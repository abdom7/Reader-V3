import { NextRequest, NextResponse } from "next/server";
import { notionFetch, NotionApiError } from "@/lib/notion-client";
import { setTokenCookie } from "@/lib/notion-session";
import type { NotionDatabase } from "@/lib/notion-types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TokenResponse {
  access_token: string;
  workspace_name?: string;
}

interface SearchResult {
  results: NotionDatabase[];
  next_cursor?: string | null;
}

// ─── Token Exchange ───────────────────────────────────────────────────────────

async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const clientId = process.env.NOTION_CLIENT_ID!;
  const clientSecret = process.env.NOTION_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/notion/callback`;

  const res = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as Record<string, string>;
    throw new Error(err.error || `Token exchange failed (${res.status})`);
  }

  return res.json();
}

// ─── Database Discovery ───────────────────────────────────────────────────────

async function findDatabases(
  token: string
): Promise<{ booksDb: NotionDatabase | null; notesDb: NotionDatabase | null }> {
  let booksDb: NotionDatabase | null = null;
  let notesDb: NotionDatabase | null = null;
  let cursor: string | undefined = undefined;

  do {
    const body: Record<string, unknown> = {
      filter: { value: "database", property: "object" },
      page_size: 100,
    };
    if (cursor) body.start_cursor = cursor;

    const data = await notionFetch<SearchResult>(token, "/v1/search", {
      method: "POST",
      body: JSON.stringify(body),
    });

    for (const db of data.results ?? []) {
      const titleText = Array.isArray(db.title)
        ? db.title
            .map((part) => (part?.plain_text ?? "").toLowerCase())
            .join("")
            .trim()
        : "";

      if (!booksDb && titleText.includes("book") && !titleText.includes("note")) {
        booksDb = db;
      }
      if (!notesDb && titleText.includes("note")) {
        notesDb = db;
      }
      if (booksDb && notesDb) break;
    }

    if (booksDb && notesDb) break;
    cursor = data.next_cursor ?? undefined;
  } while (cursor);

  return { booksDb, notesDb };
}

// ─── Template Discovery ───────────────────────────────────────────────────────

async function getDefaultTemplateId(
  token: string,
  databaseId: string
): Promise<string | null> {
  let data: NotionDatabase;
  try {
    data = await notionFetch<NotionDatabase>(token, `/v1/databases/${databaseId}`);
  } catch (err) {
    if (err instanceof NotionApiError && err.status === 404) {
      throw new Error(
        "Books database could not be retrieved. Share it with the integration and try connecting again."
      );
    }
    throw err;
  }

  const templates = data?.template_pages ?? [];
  if (!templates.length) return null;

  const defaultTemplate = templates.find((t) => t?.is_default);
  if (defaultTemplate?.id) return defaultTemplate.id;

  const namedTemplate = templates.find((t) => {
    const text =
      t?.name ||
      t?.title?.map((part) => part?.plain_text ?? "").join("") ||
      "";
    return text.trim().toLowerCase() === "new book";
  });

  return namedTemplate?.id ?? null;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        `${appUrl}?notion_error=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${appUrl}?notion_error=${encodeURIComponent("No authorization code received")}`
      );
    }

    // Exchange code for access token
    const tokenData = await exchangeCodeForToken(code);
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.redirect(
        `${appUrl}?notion_error=${encodeURIComponent("No access token received")}`
      );
    }

    // Discover databases
    const { booksDb, notesDb } = await findDatabases(accessToken);

    if (!booksDb || !notesDb) {
      const missing: string[] = [];
      if (!booksDb) missing.push("Books");
      if (!notesDb) missing.push("Notes");
      return NextResponse.redirect(
        `${appUrl}?notion_error=${encodeURIComponent(
          `Could not find ${missing.join(" and ")} database. Make sure your template databases have "Book" and "Note" in their titles.`
        )}`
      );
    }

    // Attempt to discover template ID (non-fatal)
    let bookTemplateId: string | null = null;
    try {
      bookTemplateId = await getDefaultTemplateId(accessToken, booksDb.id);
    } catch (err) {
      console.warn("Default template lookup failed", err);
    }

    // Build redirect with only non-sensitive params (token goes in HttpOnly cookie)
    const params = new URLSearchParams({
      notion_books_db: booksDb.id,
      notion_notes_db: notesDb.id,
      notion_workspace: tokenData.workspace_name ?? "",
    });

    if (bookTemplateId) {
      params.set("notion_book_template", bookTemplateId);
    }

    const redirectResponse = NextResponse.redirect(`${appUrl}?${params.toString()}`);

    // Store the access token in a secure HttpOnly cookie — never exposed to JS
    setTokenCookie(redirectResponse, accessToken);

    return redirectResponse;
  } catch (err) {
    const message = err instanceof Error ? err.message : "OAuth callback failed";
    return NextResponse.redirect(
      `${appUrl}?notion_error=${encodeURIComponent(message)}`
    );
  }
}

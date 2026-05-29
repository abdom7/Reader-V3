import { NextRequest, NextResponse } from "next/server";

const NOTION_VERSION = "2022-06-28";

// Exchange authorization code for access token
async function exchangeCodeForToken(code: string) {
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
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Token exchange failed (${res.status})`);
  }

  return res.json();
}

// Search for databases by name in the user's workspace
async function findDatabases(token: string) {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };

  // Search for all databases the integration can access
  const res = await fetch("https://api.notion.com/v1/search", {
    method: "POST",
    headers,
    body: JSON.stringify({
      filter: { value: "database", property: "object" },
      page_size: 20,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to search workspace databases");
  }

  const data = await res.json();
  const databases = data.results || [];

  // Find Books DB and Notes DB by title
  let booksDb = null;
  let notesDb = null;

  for (const db of databases) {
    const title = (
      db.title?.[0]?.plain_text || ""
    ).toLowerCase();

    if (
      title.includes("book") &&
      !title.includes("note")
    ) {
      booksDb = db;
    } else if (title.includes("note")) {
      notesDb = db;
    }
  }

  return { booksDb, notesDb };
}

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
      const missing = [];
      if (!booksDb) missing.push("Books");
      if (!notesDb) missing.push("Notes");
      return NextResponse.redirect(
        `${appUrl}?notion_error=${encodeURIComponent(
          `Could not find ${missing.join(" and ")} database. Make sure your template databases have "Book" and "Note" in their titles.`
        )}`
      );
    }

    // Redirect back to app with auth data
    const params = new URLSearchParams({
      notion_token: accessToken,
      notion_books_db: booksDb.id,
      notion_notes_db: notesDb.id,
      notion_workspace: tokenData.workspace_name || "",
    });

    return NextResponse.redirect(`${appUrl}?${params.toString()}`);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "OAuth callback failed";
    return NextResponse.redirect(
      `${appUrl}?notion_error=${encodeURIComponent(message)}`
    );
  }
}

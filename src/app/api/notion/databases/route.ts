import { NextRequest, NextResponse } from "next/server";
import { notionFetch } from "@/lib/notion-client";
import { getTokenFromRequest } from "@/lib/notion-session";
import type { NotionDatabase } from "@/lib/notion-types";

interface SearchResult {
  results: NotionDatabase[];
  next_cursor?: string | null;
  has_more?: boolean;
}

interface DatabaseEntry {
  id: string;
  name: string;
}

/**
 * GET /api/notion/databases
 *
 * Returns a flat list of all databases accessible to the Infinity Reader integration.
 * The token is read from the HttpOnly cookie — never from the request body.
 *
 * Used by the NotionDatabasePicker component to let the user explicitly choose
 * their Books and Notes databases instead of relying on fuzzy name matching.
 */
export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated. Please reconnect Notion." },
        { status: 401 }
      );
    }

    const databases: DatabaseEntry[] = [];
    let cursor: string | undefined = undefined;

    // Paginate through all accessible databases
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
        const name = Array.isArray(db.title)
          ? db.title.map((part) => part.plain_text ?? "").join("").trim()
          : "";
        databases.push({ id: db.id, name: name || "Untitled Database" });
      }

      cursor = data.next_cursor ?? undefined;
    } while (cursor);

    // Sort alphabetically for a clean picker UX
    databases.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ success: true, databases });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

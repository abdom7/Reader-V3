import { NextRequest, NextResponse } from "next/server";
import { notionFetch, NotionApiError } from "@/lib/notion-client";
import { getTokenFromRequest } from "@/lib/notion-session";
import type { NotionDatabase } from "@/lib/notion-types";

async function testDatabase(
  token: string,
  databaseId: string
): Promise<{ success: boolean; error: string; title: string }> {
  try {
    const data = await notionFetch<NotionDatabase>(
      token,
      `/v1/databases/${databaseId}`
    );
    const title =
      data.title?.map((part) => part.plain_text).join("").trim() || "Untitled";
    return { success: true, error: "", title };
  } catch (err) {
    if (err instanceof NotionApiError) {
      const message =
        err.status === 401
          ? "Invalid token — check your integration token"
          : err.status === 404
          ? "Database not found — check the ID and ensure integration has access"
          : err.message;
      return { success: false, error: message, title: "" };
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
      title: "",
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    // Token from HttpOnly cookie
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated. Please reconnect Notion." },
        { status: 401 }
      );
    }

    const { booksDatabaseId, notesDatabaseId } = await req.json();

    if (!booksDatabaseId || !notesDatabaseId) {
      return NextResponse.json(
        { success: false, error: "Both Database IDs are required" },
        { status: 400 }
      );
    }

    // Test both databases in parallel
    const [booksResult, notesResult] = await Promise.all([
      testDatabase(token, booksDatabaseId),
      testDatabase(token, notesDatabaseId),
    ]);

    if (!booksResult.success) {
      return NextResponse.json({
        success: false,
        error: `Books DB: ${booksResult.error}`,
      });
    }

    if (!notesResult.success) {
      return NextResponse.json({
        success: false,
        error: `Notes DB: ${notesResult.error}`,
      });
    }

    return NextResponse.json({
      success: true,
      booksTitle: booksResult.title,
      notesTitle: notesResult.title,
    });
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

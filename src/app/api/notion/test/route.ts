import { NextRequest, NextResponse } from "next/server";

const NOTION_VERSION = "2022-06-28";

async function testDatabase(token: string, databaseId: string) {
  const res = await fetch(
    `https://api.notion.com/v1/databases/${databaseId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message =
      res.status === 401
        ? "Invalid token — check your integration token"
        : res.status === 404
        ? "Database not found — check the ID and ensure integration has access"
        : errorData.message || `Notion API error (${res.status})`;
    return { success: false, error: message, title: "" };
  }

  const data = await res.json();
  return {
    success: true,
    error: "",
    title: data.title?.[0]?.plain_text || "Untitled",
  };
}

export async function POST(req: NextRequest) {
  try {
    const { token, booksDatabaseId, notesDatabaseId } = await req.json();

    if (!token || !booksDatabaseId || !notesDatabaseId) {
      return NextResponse.json(
        {
          success: false,
          error: "Token and both Database IDs are required",
        },
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

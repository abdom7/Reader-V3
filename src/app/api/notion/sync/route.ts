import { NextRequest, NextResponse } from "next/server";

const NOTION_VERSION = "2022-06-28";

interface NotePayload {
  id: string;
  page: number;
  content: string;
  noteType: string;
  createdAt: number;
  updatedAt: number;
  notionPageId?: string;
}

interface SyncPayload {
  token: string;
  booksDatabaseId: string;
  notesDatabaseId: string;
  session: {
    pdfName: string;
    bookTitle?: string;
    readingMode: string;
    durationMinutes: number;
    elapsedSeconds: number;
    currentPage: number;
    totalPages: number;
    date: string;
  };
  notes: NotePayload[];
}

// Helper: Notion API headers
function notionHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

// Query Books DB for an existing entry by name
async function findBookByName(
  token: string,
  booksDatabaseId: string,
  bookName: string
) {
  const res = await fetch(
    `https://api.notion.com/v1/databases/${booksDatabaseId}/query`,
    {
      method: "POST",
      headers: notionHeaders(token),
      body: JSON.stringify({
        filter: {
          property: "Name",
          title: { equals: bookName },
        },
        page_size: 1,
      }),
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.results?.[0] || null;
}

// Create or update the book entry in Books DB
async function upsertBook(
  token: string,
  booksDatabaseId: string,
  session: SyncPayload["session"]
) {
  const bookName = session.bookTitle?.trim() || session.pdfName;
  const existing = await findBookByName(
    token,
    booksDatabaseId,
    bookName
  );

  const timeReadMin = Math.floor(session.elapsedSeconds / 60);
  const isCompleted = session.currentPage >= session.totalPages;

  const bookProperties: Record<string, unknown> = {
    Name: {
      title: [{ text: { content: bookName } }],
    },
    "Current Page": { number: session.currentPage },
    "Total Pages": { number: session.totalPages },
    "Reading Mode": { select: { name: session.readingMode } },
    "Last Read": { date: { start: new Date().toISOString() } },
    Status: {
      select: { name: isCompleted ? "Completed" : "In Progress" },
    },
  };

  if (existing) {
    // Update existing book — accumulate time
    const prevTime =
      existing.properties?.["Time Read (min)"]?.number || 0;
    bookProperties["Time Read (min)"] = {
      number: prevTime + timeReadMin,
    };

    const res = await fetch(
      `https://api.notion.com/v1/pages/${existing.id}`,
      {
        method: "PATCH",
        headers: notionHeaders(token),
        body: JSON.stringify({ properties: bookProperties }),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        err.message || `Failed to update book (${res.status})`
      );
    }
    const data = await res.json();
    return { id: data.id, url: data.url, created: false };
  } else {
    // Create new book
    bookProperties["Time Read (min)"] = { number: timeReadMin };

    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: notionHeaders(token),
      body: JSON.stringify({
        parent: { database_id: booksDatabaseId },
        properties: bookProperties,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        err.message || `Failed to create book (${res.status})`
      );
    }
    const data = await res.json();
    return { id: data.id, url: data.url, created: true };
  }
}

async function clearNoteBlocks(token: string, pageId: string) {
  // 1. Get existing blocks
  const blocksRes = await fetch(
    `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`,
    { headers: notionHeaders(token) }
  );
  if (!blocksRes.ok) return;
  const blocksData = await blocksRes.json();

  // 2. Delete old blocks
  for (const block of blocksData.results || []) {
    await fetch(`https://api.notion.com/v1/blocks/${block.id}`, {
      method: "DELETE",
      headers: notionHeaders(token),
    });
  }

}

// Create or update note entries in Notes DB, related to the book
async function syncNotes(
  token: string,
  notesDatabaseId: string,
  bookPageId: string,
  bookName: string,
  notes: NotePayload[]
) {
  const results: { localId: string; notionPageId?: string; success: boolean }[] = [];

  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    if (!note.content.trim()) continue;

    const noteTitle = `${bookName} — Note ${i + 1} (p.${note.page})`;

    if (note.notionPageId) {
      // UPDATE existing Notion page
      const res = await fetch(
        `https://api.notion.com/v1/pages/${note.notionPageId}`,
        {
          method: "PATCH",
          headers: notionHeaders(token),
          body: JSON.stringify({
            properties: {
              Name: {
                title: [{ text: { content: noteTitle } }],
              },
              Content: {
                rich_text: [{ type: "text", text: { content: note.content } }],
              },
              "Note Type": {
                select: { name: note.noteType || "note" },
              },
            },
          }),
        }
      );

      if (res.ok) {
        await clearNoteBlocks(token, note.notionPageId);
        results.push({ localId: note.id, notionPageId: note.notionPageId, success: true });
      } else {
        results.push({ localId: note.id, success: false });
      }
    } else {
      // CREATE new Notion page
      const res = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: notionHeaders(token),
        body: JSON.stringify({
          parent: { database_id: notesDatabaseId },
          properties: {
            Name: {
              title: [{ text: { content: noteTitle } }],
            },
            Book: {
              relation: [{ id: bookPageId }],
            },
            Page: { number: note.page },
            "Note Type": {
              select: { name: note.noteType || "note" },
            },
            Content: {
              rich_text: [{ type: "text", text: { content: note.content } }],
            },
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        results.push({ localId: note.id, notionPageId: data.id, success: true });
      } else {
        results.push({ localId: note.id, success: false });
      }
    }
  }

  return results;
}

export async function POST(req: NextRequest) {
  try {
    const payload: SyncPayload = await req.json();
    const { token, booksDatabaseId, notesDatabaseId, session, notes } =
      payload;

    if (!token || !booksDatabaseId || !notesDatabaseId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Token, Books Database ID, and Notes Database ID are required",
        },
        { status: 400 }
      );
    }

    // 1. Upsert book in Books DB
    const book = await upsertBook(token, booksDatabaseId, session);

    // 2. Sync notes to Notes DB with relation to book
    let noteResults: { localId: string; notionPageId?: string; success: boolean }[] = [];
    if (notes.length > 0) {
      const bookTitle = session.bookTitle?.trim() || session.pdfName;
      noteResults = await syncNotes(
        token,
        notesDatabaseId,
        book.id,
        bookTitle,
        notes
      );
    }

    const notesSynced = noteResults.filter((r) => r.success).length;

    // Build mapping: local note ID → Notion page ID
    const syncedNoteIds: Record<string, string> = {};
    for (const r of noteResults) {
      if (r.success && r.notionPageId) {
        syncedNoteIds[r.localId] = r.notionPageId;
      }
    }

    return NextResponse.json({
      success: true,
      bookPageId: book.id,
      bookUrl: book.url,
      bookCreated: book.created,
      notesSynced,
      totalNotes: notes.length,
      syncedNoteIds,
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

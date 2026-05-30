import { NextRequest, NextResponse } from "next/server";
import { notionFetch, NotionApiError } from "@/lib/notion-client";
import { getTokenFromRequest } from "@/lib/notion-session";

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
  booksDatabaseId: string;
  notesDatabaseId: string;
  bookTemplateId?: string;
  session: {
    pdfName: string;
    uploadedPdfUrl?: string | null;
    uploadedCoverUrl?: string | null;
    bookTitle?: string;
    readingMode: string;
    durationMinutes: number;
    elapsedSeconds: number;
    currentPage: number;
    totalPages: number;
    date: string;
    genre?: string;
  };
  notes: NotePayload[];
}

interface NotionPage {
  id: string;
  url: string;
  properties: Record<string, unknown>;
}

interface NotionBlock {
  id: string;
}

interface NotionQueryResult {
  results: NotionPage[];
}

interface NotionBlockChildren {
  results: NotionBlock[];
}

interface NotionDatabase {
  template_pages?: Array<{ id: string; name?: string; is_default?: boolean; title?: Array<{ plain_text: string }> }>;
}

const BOOK_TEMPLATE_NAME = "New Book";

// ─── Template Discovery ──────────────────────────────────────────────────────

async function getBooksDatabaseTemplateId(
  token: string,
  booksDatabaseId: string
): Promise<string | null> {
  let data: NotionDatabase;
  try {
    data = await notionFetch<NotionDatabase>(
      token,
      `/v1/databases/${booksDatabaseId}`
    );
  } catch (err) {
    if (err instanceof NotionApiError && err.status === 404) {
      throw new Error(
        "Books database could not be retrieved. Reconnect Infinity Reader and ensure the integration has access to the database."
      );
    }
    throw err;
  }

  const templates = data?.template_pages ?? [];

  const match = templates.find((t) => {
    const text =
      t?.name ||
      t?.title?.map((part) => part?.plain_text ?? "").join("") ||
      "";
    return text.trim().toLowerCase() === BOOK_TEMPLATE_NAME.toLowerCase();
  });

  if (match?.id) return match.id;

  const defaultTemplate = templates.find((t) => t?.is_default);
  return defaultTemplate?.id ?? null;
}

// ─── Book Lookup ─────────────────────────────────────────────────────────────

async function findBookByName(
  token: string,
  booksDatabaseId: string,
  bookName: string
): Promise<NotionPage | null> {
  let data: NotionQueryResult;
  try {
    data = await notionFetch<NotionQueryResult>(
      token,
      `/v1/databases/${booksDatabaseId}/query`,
      {
        method: "POST",
        body: JSON.stringify({
          filter: { property: "Name", title: { equals: bookName } },
          page_size: 1,
        }),
      }
    );
  } catch (err) {
    if (err instanceof NotionApiError && err.status === 404) {
      throw new Error(
        "Books database could not be found. If you duplicated or converted it, reconnect Infinity Reader and share the integration with the new database."
      );
    }
    throw err;
  }

  return data.results?.[0] ?? null;
}

// ─── Upsert Book ─────────────────────────────────────────────────────────────

async function upsertBook(
  token: string,
  booksDatabaseId: string,
  bookTemplateId: string | undefined,
  session: SyncPayload["session"]
): Promise<{ id: string; url: string; created: boolean }> {
  const bookName = session.bookTitle?.trim() || session.pdfName;
  const existing = await findBookByName(token, booksDatabaseId, bookName);

  const timeReadMin = Math.floor(session.elapsedSeconds / 60);
  const isCompleted = session.currentPage >= session.totalPages;

  const bookProperties: Record<string, unknown> = {
    Name: { title: [{ text: { content: bookName } }] },
    "Current Page": { number: session.currentPage },
    "Total Pages": { number: session.totalPages },
    "Reading Mode": { select: { name: session.readingMode } },
    "Last Read": { date: { start: new Date().toISOString() } },
    Status: { select: { name: isCompleted ? "Completed" : "In Progress" } },
  };

  if (session.genre) {
    bookProperties["Genre"] = {
      select: { name: session.genre },
    };
  }

  // ── Update existing book ──────────────────────────────────────────────────
  if (existing) {
    const prevTime =
      (existing.properties?.["Time Read (min)"] as { number?: number } | undefined)?.number ?? 0;
    bookProperties["Time Read (min)"] = { number: prevTime + timeReadMin };

    let data: NotionPage;
    try {
      data = await notionFetch<NotionPage>(
        token,
        `/v1/pages/${existing.id}`,
        { method: "PATCH", body: JSON.stringify({ properties: bookProperties }) }
      );
    } catch (err) {
      if (err instanceof NotionApiError && err.status === 404) {
        throw new Error(
          "Unable to update the Books database entry. Reconnect Infinity Reader and ensure the integration still has access to your Books database."
        );
      }
      throw err;
    }

    return { id: data.id, url: data.url, created: false };
  }

  // ── Create new book ───────────────────────────────────────────────────────
  bookProperties["Time Read (min)"] = { number: timeReadMin };
  bookProperties["Version"] = { select: { name: "Version 1" } };
  bookProperties["Priority"] = { select: { name: "Medium" } };
  
  const deadline = new Date();
  deadline.setMonth(deadline.getMonth() + 1);
  bookProperties["Deadline"] = { date: { start: deadline.toISOString() } };

  if (session.uploadedPdfUrl) {
    bookProperties["PDF"] = {
      files: [
        {
          name: session.pdfName,
          type: "external",
          external: { url: session.uploadedPdfUrl },
        },
      ],
    };
  }

  if (session.uploadedCoverUrl) {
    bookProperties["Cover"] = {
      files: [
        {
          name: "Cover",
          type: "external",
          external: { url: session.uploadedCoverUrl },
        },
      ],
    };
  }

  // Resolve template ID (prefer cached, then fetch)
  let templateId: string | null = bookTemplateId ?? null;
  if (!templateId) {
    try {
      templateId = await getBooksDatabaseTemplateId(token, booksDatabaseId);
    } catch (err) {
      console.warn("Failed to load books template", err);
      templateId = null;
    }
  }

  // When a template exists: create page with template + properties in one shot
  if (templateId) {
    let created: NotionPage;
    try {
      created = await notionFetch<NotionPage>(token, "/v1/pages", {
        method: "POST",
        body: JSON.stringify({
          parent: { database_id: booksDatabaseId },
          template_id: templateId,
          properties: bookProperties,
        }),
      });
    } catch (err) {
      if (err instanceof NotionApiError) {
        if (err.status === 404) {
          throw new Error(
            "Unable to access the Books database. If you converted or moved it, reconnect so we can capture the new database ID, and share the integration with it."
          );
        }
        if (err.status === 400 && err.message.includes("template")) {
          throw new Error(
            "The selected Notion template could not be applied. Reconnect Notion to refresh template access, or ensure the template is shared with the Infinity Reader integration."
          );
        }
      }
      throw err;
    }

    return { id: created.id, url: created.url, created: true };
  }

  // No template — plain create
  let data: NotionPage;
  try {
    data = await notionFetch<NotionPage>(token, "/v1/pages", {
      method: "POST",
      body: JSON.stringify({
        parent: { database_id: booksDatabaseId },
        icon: { type: "emoji", emoji: "📖" },
        properties: bookProperties,
      }),
    });
  } catch (err) {
    if (err instanceof NotionApiError && err.status === 404) {
      throw new Error(
        "Unable to access the Books database. If you converted or moved it, reconnect so we can capture the new database ID, and share the integration with it."
      );
    }
    throw err;
  }

  return { id: data.id, url: data.url, created: true };
}

// ─── Block Helpers ────────────────────────────────────────────────────────────

/** Delete all top-level blocks on a Notion page in parallel. */
async function clearNoteBlocks(token: string, pageId: string): Promise<void> {
  let blocksData: NotionBlockChildren;
  try {
    blocksData = await notionFetch<NotionBlockChildren>(
      token,
      `/v1/blocks/${pageId}/children?page_size=100`
    );
  } catch {
    return; // Non-fatal — page may have no blocks
  }

  // Delete all blocks in parallel (Notion API only supports individual deletes)
  await Promise.all(
    (blocksData.results ?? []).map((block) =>
      notionFetch(token, `/v1/blocks/${block.id}`, { method: "DELETE" }).catch(
        () => undefined // Ignore individual delete failures
      )
    )
  );
}

/** Append a single paragraph block containing the note content. */
async function writeNoteBody(
  token: string,
  pageId: string,
  content: string
): Promise<void> {
  if (!content.trim()) return;

  await notionFetch(token, `/v1/blocks/${pageId}/children`, {
    method: "PATCH",
    body: JSON.stringify({
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content } }],
          },
        },
      ],
    }),
  });
}

// ─── Sync Single Note ─────────────────────────────────────────────────────────

type NoteResult = { localId: string; notionPageId?: string; success: boolean };

async function syncSingleNote(
  token: string,
  notesDatabaseId: string,
  bookPageId: string,
  bookName: string,
  note: NotePayload,
  noteIndex: number
): Promise<NoteResult> {
  const noteTitle = `${bookName} — Note ${noteIndex + 1} (p.${note.page})`;

  if (note.notionPageId) {
    // UPDATE existing page
    try {
      await notionFetch(token, `/v1/pages/${note.notionPageId}`, {
        method: "PATCH",
        body: JSON.stringify({
          icon: { type: "emoji", emoji: "📝" },
          properties: {
            Name: { title: [{ text: { content: noteTitle } }] },
            Content: {
              rich_text: [{ type: "text", text: { content: note.content } }],
            },
            "Note Type": { select: { name: note.noteType || "note" } },
          },
        }),
      });

      // Refresh body content
      await clearNoteBlocks(token, note.notionPageId);
      await writeNoteBody(token, note.notionPageId, note.content);

      return { localId: note.id, notionPageId: note.notionPageId, success: true };
    } catch (err) {
      if (err instanceof NotionApiError && err.status === 404) {
        throw new Error(
          "A synced note could not be updated because the Notes database is unavailable. Reconnect Infinity Reader and confirm the integration has access to your Notes database."
        );
      }
      throw err;
    }
  }

  // CREATE new page
  let data: NotionPage;
  try {
    data = await notionFetch<NotionPage>(token, "/v1/pages", {
      method: "POST",
      body: JSON.stringify({
        parent: { database_id: notesDatabaseId },
        icon: { type: "emoji", emoji: "📝" },
        properties: {
          Name: { title: [{ text: { content: noteTitle } }] },
          Book: { relation: [{ id: bookPageId }] },
          Page: { number: note.page },
          "Note Type": { select: { name: note.noteType || "note" } },
          Content: {
            rich_text: [{ type: "text", text: { content: note.content } }],
          },
        },
      }),
    });
  } catch (err) {
    if (err instanceof NotionApiError && err.status === 404) {
      throw new Error(
        "Notes database could not be found. Reconnect Infinity Reader to refresh the database IDs and share the integration with the database."
      );
    }
    throw err;
  }

  await writeNoteBody(token, data.id, note.content);
  return { localId: note.id, notionPageId: data.id, success: true };
}

// ─── Sync All Notes (Parallel) ────────────────────────────────────────────────

async function syncNotes(
  token: string,
  notesDatabaseId: string,
  bookPageId: string,
  bookName: string,
  notes: NotePayload[]
): Promise<NoteResult[]> {
  const contentNotes = notes.filter((n) => n.content.trim());

  const settled = await Promise.allSettled(
    contentNotes.map((note, i) =>
      syncSingleNote(token, notesDatabaseId, bookPageId, bookName, note, i)
    )
  );

  // Re-throw the first hard failure so the outer handler can report it
  for (const result of settled) {
    if (result.status === "rejected") {
      throw result.reason;
    }
  }

  return settled
    .filter(
      (r): r is PromiseFulfilledResult<NoteResult> => r.status === "fulfilled"
    )
    .map((r) => r.value);
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Token is read from the HttpOnly cookie — not from the request body
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated. Please reconnect Notion." },
        { status: 401 }
      );
    }

    const payload: SyncPayload = await req.json();
    const { booksDatabaseId, notesDatabaseId, session, notes } = payload;

    if (!booksDatabaseId || !notesDatabaseId) {
      return NextResponse.json(
        {
          success: false,
          error: "Books Database ID and Notes Database ID are required",
        },
        { status: 400 }
      );
    }

    // 1. Upsert book in Books DB
    const book = await upsertBook(
      token,
      booksDatabaseId,
      payload.bookTemplateId,
      session
    );

    // 2. Sync notes in parallel
    let noteResults: NoteResult[] = [];
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

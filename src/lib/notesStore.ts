import { create } from "zustand";

export type NoteType = "note" | "highlight" | "question" | "idea";

export interface Note {
  id: string;
  page: number;
  content: string;
  noteType: NoteType;
  createdAt: number;
  updatedAt: number;
  notionPageId?: string;
}

export interface NotionConfig {
  booksDatabaseId: string;
  notesDatabaseId: string;
  connected: boolean;
  bookTemplateId?: string;
}

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

interface NotesState {
  notes: Note[];
  isNotesPanelOpen: boolean;
  isNotesBoardOpen: boolean;
  notionConfig: NotionConfig;
  syncStatus: SyncStatus;
  lastSyncedAt: number | null;

  // Notes actions
  addNote: (page: number) => void;
  updateNote: (id: string, content: string) => void;
  updateNoteType: (id: string, noteType: NoteType) => void;
  deleteNote: (id: string) => void;
  markNotesSynced: (mapping: Record<string, string>) => void;
  getNotesForPage: (page: number) => Note[];
  getAllNotes: () => Note[];

  // Panel
  toggleNotesPanel: () => void;
  setNotesPanelOpen: (open: boolean) => void;
  toggleNotesBoard: () => void;
  setNotesBoardOpen: (open: boolean) => void;

  // Notion
  setNotionConfig: (config: Partial<NotionConfig>) => void;
  clearNotionConfig: () => void;
  setSyncStatus: (status: SyncStatus) => void;
  setLastSyncedAt: (ts: number) => void;
}

let noteIdCounter = 0;
const generateNoteId = () => `note-${Date.now()}-${++noteIdCounter}`;

const defaultNotionConfig: NotionConfig = {
  booksDatabaseId: "",
  notesDatabaseId: "",
  connected: false,
  bookTemplateId: "",
};

const loadNotionConfig = (): NotionConfig => {
  if (typeof window === "undefined") return { ...defaultNotionConfig };
  try {
    const saved = localStorage.getItem("infinity-reader-notion");
    if (saved) return { ...defaultNotionConfig, ...JSON.parse(saved) };
  } catch {
    // ignore
  }
  return { ...defaultNotionConfig };
};

const saveNotionConfig = (config: NotionConfig) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("infinity-reader-notion", JSON.stringify(config));
};

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  isNotesPanelOpen: false,
  isNotesBoardOpen: false,
  notionConfig: loadNotionConfig(),
  syncStatus: "idle",
  lastSyncedAt: null,

  addNote: (page) => {
    const note: Note = {
      id: generateNoteId(),
      page,
      content: "",
      noteType: "note",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((s) => ({ notes: [...s.notes, note] }));
  },

  updateNote: (id, content) => {
    set((s) => ({
      notes: s.notes.map((n) =>
        n.id === id ? { ...n, content, updatedAt: Date.now() } : n
      ),
    }));
  },

  updateNoteType: (id, noteType) => {
    set((s) => ({
      notes: s.notes.map((n) =>
        n.id === id ? { ...n, noteType, updatedAt: Date.now() } : n
      ),
    }));
  },

  deleteNote: (id) => {
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
  },

  markNotesSynced: (mapping) => {
    set((s) => ({
      notes: s.notes.map((n) =>
        mapping[n.id] ? { ...n, notionPageId: mapping[n.id] } : n
      ),
    }));
  },

  getNotesForPage: (page) => {
    return get().notes.filter((n) => n.page === page);
  },

  getAllNotes: () => get().notes,

  toggleNotesPanel: () =>
    set((s) => ({ isNotesPanelOpen: !s.isNotesPanelOpen })),

  setNotesPanelOpen: (open) => set({ isNotesPanelOpen: open }),

  toggleNotesBoard: () =>
    set((s) => ({ isNotesBoardOpen: !s.isNotesBoardOpen })),

  setNotesBoardOpen: (open) => set({ isNotesBoardOpen: open }),

  setNotionConfig: (partial) => {
    const current = get().notionConfig;
    const updated = { ...current, ...partial };
    saveNotionConfig(updated);
    set({ notionConfig: updated });
  },

  clearNotionConfig: () => {
    const empty = { ...defaultNotionConfig };
    saveNotionConfig(empty);
    set({ notionConfig: empty });
  },

  setSyncStatus: (status) => set({ syncStatus: status }),
  setLastSyncedAt: (ts) => set({ lastSyncedAt: ts }),
}));

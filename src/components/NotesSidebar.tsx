"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Trash2,
  FileText,
  ChevronDown,
  ChevronRight,
  StickyNote,
} from "lucide-react";
import { useNotesStore, Note, NoteType } from "@/lib/notesStore";
import { useReaderStore } from "@/lib/store";

const NOTE_TYPES: { value: NoteType; label: string; icon: string }[] = [
  { value: "note", label: "Note", icon: "📝" },
  { value: "highlight", label: "Highlight", icon: "🔆" },
  { value: "question", label: "Question", icon: "❓" },
  { value: "idea", label: "Idea", icon: "💡" },
];

function NoteCard({
  note,
  isActive,
}: {
  note: Note;
  isActive: boolean;
}) {
  const { updateNote, updateNoteType, deleteNote } = useNotesStore();
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={`group rounded-xl border transition-colors ${
        isActive
          ? "bg-gold-500/5 border-gold-500/30"
          : "bg-space-black/30 border-space-border/50 hover:border-space-border"
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-space-border/30">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
            Page {note.page}
          </span>
          <select
            value={note.noteType}
            onChange={(e) => updateNoteType(note.id, e.target.value as NoteType)}
            aria-label="Note type"
            title="Note type"
            className="text-[10px] bg-transparent border border-space-border/40 rounded px-1 py-0.5 text-white/50 outline-none cursor-pointer hover:border-gold-500/40 transition-colors"
          >
            {NOTE_TYPES.map((t) => (
              <option key={t.value} value={t.value} className="bg-space-deep">
                {t.icon} {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isDeleting ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => deleteNote(note.id)}
                className="text-[10px] text-red-400 hover:text-red-300 px-1"
              >
                Confirm
              </button>
              <button
                onClick={() => setIsDeleting(false)}
                className="text-[10px] text-white/40 hover:text-white/60 px-1"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsDeleting(true)}
              className="p-1 rounded hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
              title="Delete Note"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      <textarea
        value={note.content}
        onChange={(e) => updateNote(note.id, e.target.value)}
        placeholder="Write your note..."
        className="w-full bg-transparent text-white/80 text-sm p-3 resize-none outline-none placeholder:text-white/20 min-h-[80px] leading-relaxed"
        rows={3}
      />
      <div className="px-3 pb-2">
        <span className="text-[9px] text-white/20">
          {new Date(note.updatedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </motion.div>
  );
}

export function NotesSidebar() {
  const { isNotesPanelOpen, setNotesPanelOpen, notes, addNote } =
    useNotesStore();
  const { currentPage, totalPages } = useReaderStore();
  const [viewMode, setViewMode] = useState<"page" | "all">("page");

  const currentPageNotes = notes.filter((n) => n.page === currentPage);
  const allNotesByPage = notes.reduce(
    (acc, note) => {
      if (!acc[note.page]) acc[note.page] = [];
      acc[note.page].push(note);
      return acc;
    },
    {} as Record<number, Note[]>
  );

  const displayNotes = viewMode === "page" ? currentPageNotes : notes;
  const sortedPages = Object.keys(allNotesByPage)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <AnimatePresence>
      {isNotesPanelOpen && (
        <motion.div
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -320, opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed left-0 top-12 bottom-0 z-40 w-80 bg-space-deep/95 backdrop-blur-2xl border-r border-space-border/30 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-space-border/30">
            <div className="flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-gold-500" />
              <h3 className="text-sm font-display font-medium text-white/90 tracking-wide">
                Notes
              </h3>
              <span className="text-[10px] font-mono text-white/30 bg-space-surface px-1.5 py-0.5 rounded">
                {notes.length}
              </span>
            </div>
            <button
              onClick={() => setNotesPanelOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
              title="Close Notes"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex px-4 py-2 gap-1 border-b border-space-border/20">
            <button
              onClick={() => setViewMode("page")}
              className={`flex-1 text-xs py-1.5 rounded-lg transition-colors ${
                viewMode === "page"
                  ? "bg-gold-500/15 text-gold-400"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Page {currentPage}
            </button>
            <button
              onClick={() => setViewMode("all")}
              className={`flex-1 text-xs py-1.5 rounded-lg transition-colors ${
                viewMode === "all"
                  ? "bg-gold-500/15 text-gold-400"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              All Notes
            </button>
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {viewMode === "page" ? (
              <>
                <AnimatePresence>
                  {currentPageNotes.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8"
                    >
                      <FileText className="w-8 h-8 text-white/10 mx-auto mb-3" />
                      <p className="text-xs text-white/30">
                        No notes on this page yet
                      </p>
                    </motion.div>
                  ) : (
                    currentPageNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        isActive={true}
                      />
                    ))
                  )}
                </AnimatePresence>
              </>
            ) : (
              <>
                {sortedPages.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-8 h-8 text-white/10 mx-auto mb-3" />
                    <p className="text-xs text-white/30">
                      No notes yet. Start writing!
                    </p>
                  </div>
                ) : (
                  sortedPages.map((page) => (
                    <PageGroup
                      key={page}
                      page={page}
                      notes={allNotesByPage[page]}
                      isCurrent={page === currentPage}
                    />
                  ))
                )}
              </>
            )}
          </div>

          {/* Add Note Button */}
          <div className="px-3 py-3 border-t border-space-border/30">
            <button
              onClick={() => addNote(currentPage)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gold-500/10 border border-gold-500/30 text-gold-400 text-sm hover:bg-gold-500/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Note — Page {currentPage}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PageGroup({
  page,
  notes,
  isCurrent,
}: {
  page: number;
  notes: Note[];
  isCurrent: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(isCurrent);

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
          isCurrent
            ? "text-gold-400 bg-gold-500/5"
            : "text-white/50 hover:text-white/70 hover:bg-white/5"
        }`}
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        <span className="font-mono">Page {page}</span>
        <span className="text-white/20 ml-auto">{notes.length}</span>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pl-2 pt-1 space-y-2"
          >
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isActive={isCurrent}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

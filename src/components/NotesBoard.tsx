"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  FileText,
  Lightbulb,
  MessageCircleQuestion,
  Search,
  Sparkles,
  StickyNote,
  X,
} from "lucide-react";
import { Note, NoteType, useNotesStore } from "@/lib/notesStore";
import { useReaderStore } from "@/lib/store";

const NOTE_META: Record<
  NoteType,
  { label: string; icon: React.ReactNode; className: string; pin: string }
> = {
  note: {
    label: "Note",
    icon: <StickyNote className="w-4 h-4" />,
    className: "from-yellow-300/95 to-amber-200/95 text-space-black",
    pin: "bg-yellow-500",
  },
  highlight: {
    label: "Highlight",
    icon: <Sparkles className="w-4 h-4" />,
    className: "from-gold-300/95 to-orange-200/95 text-space-black",
    pin: "bg-orange-500",
  },
  question: {
    label: "Question",
    icon: <MessageCircleQuestion className="w-4 h-4" />,
    className: "from-sky-300/95 to-cyan-100/95 text-space-black",
    pin: "bg-sky-500",
  },
  idea: {
    label: "Idea",
    icon: <Lightbulb className="w-4 h-4" />,
    className: "from-violet-300/95 to-fuchsia-100/95 text-space-black",
    pin: "bg-violet-500",
  },
};

const FILTERS: Array<"all" | NoteType> = [
  "all",
  "note",
  "highlight",
  "question",
  "idea",
];

function rotationFor(index: number) {
  return [-2, 1.5, -1, 2, -1.5, 1][index % 6];
}

function StickyCard({ note, index }: { note: Note; index: number }) {
  const { updateNote, setNotesBoardOpen } = useNotesStore();
  const { setCurrentPage } = useReaderStore();
  const meta = NOTE_META[note.noteType];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      whileHover={{ y: -6, rotate: 0, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={`relative min-h-[220px] rounded-sm bg-gradient-to-br ${meta.className} p-4 shadow-2xl shadow-black/30`}
      style={{ rotate: `${rotationFor(index)}deg` }}
    >
      <div className={`absolute left-1/2 top-2 h-3 w-3 -translate-x-1/2 rounded-full ${meta.pin} shadow-lg shadow-black/30`} />
      <div className="mt-4 flex items-center justify-between gap-2 border-b border-black/10 pb-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest opacity-70">
          {meta.icon}
          {meta.label}
        </div>
        <span className="rounded-full bg-black/10 px-2 py-1 text-[10px] font-bold">
          Page {note.page}
        </span>
      </div>

      <textarea
        value={note.content}
        onChange={(event) => updateNote(note.id, event.target.value)}
        placeholder="Empty note..."
        className="mt-3 h-28 w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-black/35"
      />

      <div className="mt-3 flex items-center justify-between gap-2 text-[10px] opacity-65">
        <span>
          {new Date(note.updatedAt).toLocaleDateString([], {
            month: "short",
            day: "numeric",
          })}
        </span>
        <button
          onClick={() => {
            setCurrentPage(note.page);
            setNotesBoardOpen(false);
          }}
          className="flex items-center gap-1 rounded-full bg-black/10 px-2 py-1 font-semibold hover:bg-black/15 transition-colors"
        >
          Go to page
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </motion.article>
  );
}

export function NotesBoard() {
  const { notes, isNotesBoardOpen, setNotesBoardOpen } = useNotesStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | NoteType>("all");

  const filteredNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return notes
      .filter((note) => note.content.trim().length > 0)
      .filter((note) => filter === "all" || note.noteType === filter)
      .filter((note) =>
        normalizedQuery
          ? note.content.toLowerCase().includes(normalizedQuery) ||
            `page ${note.page}`.includes(normalizedQuery)
          : true
      )
      .sort((a, b) => a.page - b.page || a.createdAt - b.createdAt);
  }, [filter, notes, query]);

  return (
    <AnimatePresence>
      {isNotesBoardOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-space-deep/95 backdrop-blur-2xl"
        >
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.18),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(139,92,246,0.16),transparent_24%),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:auto,auto,42px_42px,42px_42px]" />

          <div className="relative flex h-full flex-col">
            <header className="flex flex-col gap-4 border-b border-space-border/40 bg-space-deep/75 px-5 py-4 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gold-500/30 bg-gold-500/10 text-gold-400 shadow-gold-glow">
                  <StickyNote className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-gold-400/60">
                    Infinity Board
                  </p>
                  <h2 className="font-display text-xl font-semibold text-white">
                    Sticky Notes Canvas
                  </h2>
                </div>
                <span className="rounded-full border border-space-border bg-space-surface px-2.5 py-1 text-xs font-mono text-white/50">
                  {filteredNotes.length}/{notes.length}
                </span>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search notes or page..."
                    className="w-full rounded-xl border border-space-border bg-space-black/50 py-2 pl-9 pr-3 text-sm text-white/75 outline-none transition-colors placeholder:text-white/25 focus:border-gold-500/50 md:w-64"
                  />
                </div>
                <button
                  onClick={() => setNotesBoardOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-space-border bg-white/5 px-3 py-2 text-sm text-white/60 transition-colors hover:border-gold-500/40 hover:text-white"
                >
                  <X className="h-4 w-4" />
                  Close Board
                </button>
              </div>
            </header>

            <div className="flex gap-2 overflow-x-auto border-b border-space-border/20 px-5 py-3">
              {FILTERS.map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    filter === item
                      ? "bg-gold-500/15 text-gold-300 border border-gold-500/35"
                      : "border border-space-border/60 bg-space-black/30 text-white/45 hover:text-white/70"
                  }`}
                >
                  {item === "all" ? "All Notes" : NOTE_META[item].label}
                </button>
              ))}
            </div>

            <main className="flex-1 overflow-auto p-6 md:p-8">
              {filteredNotes.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="max-w-sm rounded-3xl border border-space-border/50 bg-space-surface/50 p-8 text-center backdrop-blur-xl">
                    <FileText className="mx-auto mb-4 h-10 w-10 text-white/15" />
                    <h3 className="text-lg font-medium text-white/80">
                      No sticky notes yet
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/35">
                      Add notes from the sidebar while reading, then open this board to review them visually.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid auto-rows-fr grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  <AnimatePresence mode="popLayout">
                    {filteredNotes.map((note, index) => (
                      <StickyCard key={note.id} note={note} index={index} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </main>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

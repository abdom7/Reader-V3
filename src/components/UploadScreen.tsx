"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  FileText,
  Clock,
  Shield,
  Eye,
  Sparkles,
  Rocket,
  X,
  Check,
  CloudUpload,
  Library,
  RefreshCw,
  Download,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useReaderStore, ReadingMode } from "@/lib/store";
import { useNotesStore } from "@/lib/notesStore";
import { Starfield } from "./Starfield";

const READING_MODES: {
  id: ReadingMode;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "deep-space",
    label: "Deep Space",
    description: "Pure black, zero distractions",
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    id: "low-light",
    label: "Low Light",
    description: "Warm amber, gentle on eyes",
    icon: <Eye className="w-5 h-5" />,
  },
  {
    id: "focus",
    label: "Focus Mode",
    description: "Maximum concentration",
    icon: <Shield className="w-5 h-5" />,
  },
];

const TIME_PRESETS = [15, 30, 60];

type ExplorerBook = {
  id: string;
  title: string;
  notionUrl: string;
  currentPage: number | null;
  totalPages: number | null;
  status: string | null;
  hasPdf: boolean;
  pdfName: string | null;
  pdfUrl: string | null;
  pdfPropertyName: string | null;
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.3 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function UploadScreen() {
  const {
    setPhase,
    setPdfFile,
    setPdfUrl,
    setBookTitle,
    bookTitle,
    setCurrentPage,
    setReadingMode,
    readingMode,
    setTimerTarget,
    timer,
    toggleFocusMode,
    focusModeActive,
  } = useReaderStore();
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (file.type === "application/pdf") {
        setPdfFile(file);
        setBookTitle(null);
        setCurrentPage(1);
        const url = URL.createObjectURL(file);
        setPdfUrl(url);
        setFileName(file.name);
      }
    },
    [setBookTitle, setCurrentPage, setPdfFile, setPdfUrl]
  );

  const handleExplorerImport = useCallback(
    async (book: ExplorerBook) => {
      if (!book.pdfUrl) return;

      const res = await fetch(
        `/api/notion/pdf?url=${encodeURIComponent(book.pdfUrl)}`
      );
      if (!res.ok) {
        throw new Error(`Failed to load PDF (${res.status})`);
      }

      const blob = await res.blob();
      const fileName = book.pdfName || `${book.title}.pdf`;
      const file = new File([blob], fileName, { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setPdfFile(file);
      setPdfUrl(url);
      setBookTitle(book.title);
      setFileName(fileName);
      setCurrentPage(book.currentPage && book.currentPage > 0 ? book.currentPage : 1);
    },
    [setBookTitle, setCurrentPage, setPdfFile, setPdfUrl]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleLaunch = () => {
    if (fileName) {
      setPhase("countdown");
    }
  };

  const clearFile = useCallback(() => {
    setFileName(null);
    setPdfFile(null);
    setPdfUrl(null);
    setBookTitle(null);
    setCurrentPage(1);
  }, [setBookTitle, setCurrentPage, setPdfFile, setPdfUrl]);

  return (
    <div className="fixed inset-0 bg-space-deep overflow-y-auto">
      <Starfield density={120} />

      <div className="relative z-10 min-h-full flex flex-col">
        {/* ── Hero Section ── */}
        <header className="pt-16 pb-10 md:pt-20 md:pb-12 text-center flex-shrink-0 px-4">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="font-brand gold-text mb-1"
          >
            <span className="block text-4xl md:text-5xl lg:text-6xl font-medium uppercase tracking-[0.35em]">
              Infinity
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gold-400/60 font-brand text-xs md:text-sm uppercase tracking-[0.5em] mb-4"
          >
            Reader
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-white/40 font-light text-sm tracking-wide max-w-md mx-auto"
          >
            Your distraction-free reading capsule in deep space
          </motion.p>
        </header>

        {/* ── Main Content ── */}
        <motion.main
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 pb-32"
        >
          {/* Upload Zone — full width, prominent */}
          <motion.div variants={fadeUp} className="mb-8">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() =>
                !fileName && document.getElementById("file-input")?.click()
              }
              className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 ${
                isDragging
                  ? "border-gold-400 bg-gold-500/5 shadow-gold-glow"
                  : fileName
                  ? "border-gold-500/40 bg-space-surface/60"
                  : "border-space-border/60 bg-space-surface/30 hover:border-white/20 hover:bg-space-surface/50 cursor-pointer"
              }`}
            >
              <input
                id="file-input"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileInput}
                aria-label="Upload PDF file"
              />

              {fileName ? (
                <div className="flex items-center gap-4 px-6 py-5">
                  <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-gold-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {fileName}
                    </p>
                    <p className="text-gold-400/60 text-xs mt-0.5">
                      Ready for launch
                    </p>
                    <div className="mt-3">
                      <label className="block text-[10px] text-white/35 uppercase tracking-widest mb-1.5">
                        Book title
                      </label>
                      <input
                        value={bookTitle ?? fileName.replace(/\\.pdf$/i, "")}
                        onChange={(e) => setBookTitle(e.target.value)}
                        className="w-full bg-space-black/40 border border-space-border rounded-lg px-3 py-2 text-sm text-white/75 placeholder-white/25 focus:outline-none focus:border-gold-500/50 transition-colors"
                        placeholder="Rename this book"
                      />
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFile();
                    }}
                    title="Remove file"
                    className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center py-10 px-6">
                  <Upload
                    className={`w-10 h-10 mx-auto mb-3 transition-colors ${
                      isDragging ? "text-gold-400" : "text-white/25"
                    }`}
                  />
                  <p className="text-white/60 text-sm mb-1">
                    Drop your PDF here or{" "}
                    <span className="text-gold-400/80 underline underline-offset-2">
                      browse
                    </span>
                  </p>
                  <p className="text-white/30 text-xs">
                    Supports any PDF document
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="mb-8">
            <NotionExplorer onImport={handleExplorerImport} />
          </motion.div>

          {/* ── Settings Grid — 2 columns on md+ ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {/* Card: Reading Mode */}
            <motion.div variants={fadeUp} className="glass-panel p-5">
              <h3 className="text-xs font-display font-medium text-white/40 mb-4 flex items-center gap-2 uppercase tracking-widest">
                <Eye className="w-3.5 h-3.5 text-gold-500/60" />
                Reading Mode
              </h3>
              <div className="space-y-2">
                {READING_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setReadingMode(mode.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 ${
                      readingMode === mode.id
                        ? "bg-gold-500/10 border border-gold-500/40 text-gold-300"
                        : "bg-space-black/30 border border-transparent hover:border-space-border hover:bg-space-black/50 text-white/60"
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                        readingMode === mode.id
                          ? "bg-gold-500/15 text-gold-400"
                          : "bg-space-surface text-white/30"
                      }`}
                    >
                      {mode.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{mode.label}</p>
                      <p
                        className={`text-[11px] mt-0.5 ${
                          readingMode === mode.id
                            ? "text-gold-400/50"
                            : "text-white/30"
                        }`}
                      >
                        {mode.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Card: Session Settings */}
            <motion.div variants={fadeUp} className="flex flex-col gap-4 md:gap-5">
              {/* Timer */}
              <div className="glass-panel p-5 flex-1">
                <h3 className="text-xs font-display font-medium text-white/40 mb-4 flex items-center gap-2 uppercase tracking-widest">
                  <Clock className="w-3.5 h-3.5 text-gold-500/60" />
                  Duration
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_PRESETS.map((minutes) => (
                    <button
                      key={minutes}
                      onClick={() => setTimerTarget(minutes)}
                      className={`py-2.5 rounded-lg text-sm font-mono transition-all duration-200 ${
                        timer.targetMinutes === minutes
                          ? "bg-gold-500/15 border border-gold-500/40 text-gold-300"
                          : "bg-space-black/30 border border-transparent hover:border-space-border text-white/50 hover:text-white/70"
                      }`}
                    >
                      {minutes}
                      <span className="text-[10px] ml-0.5 opacity-60">
                        min
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <label className="text-[11px] text-white/40 whitespace-nowrap">Custom:</label>
                  <input
                    type="number"
                    min={1}
                    max={480}
                    placeholder="min"
                    value={
                      TIME_PRESETS.includes(timer.targetMinutes)
                        ? ""
                        : timer.targetMinutes
                    }
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (v > 0 && v <= 480) setTimerTarget(v);
                    }}
                    className="w-20 bg-space-black/40 border border-space-border rounded-lg px-3 py-1.5 text-sm font-mono text-white/70 placeholder-white/30 focus:outline-none focus:border-gold-500/50 transition-colors"
                    aria-label="Custom duration in minutes"
                  />
                  <span className="text-[11px] text-white/30">minutes</span>
                </div>
              </div>

              {/* Focus Shield */}
              <div className="glass-panel p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                        focusModeActive
                          ? "bg-gold-500/15 text-gold-400"
                          : "bg-space-black/50 text-white/30"
                      }`}
                    >
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">
                        Focus Shield
                      </p>
                      <p className="text-[11px] text-white/30 mt-0.5">
                        Block notifications
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleFocusMode}
                    aria-label="Toggle Focus Shield"
                    className={`w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
                      focusModeActive ? "bg-gold-500" : "bg-space-border"
                    }`}
                  >
                    <motion.div
                      animate={{ x: focusModeActive ? 22 : 2 }}
                      className="w-[18px] h-[18px] rounded-full bg-white shadow-md mt-[2px]"
                    />
                  </button>
                </div>
              </div>

              {/* Notion Connect */}
              <NotionConnectCard />
            </motion.div>
          </div>
        </motion.main>

        {/* ── Sticky Launch Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-5 pt-8 pointer-events-none launch-bar-fade"
        >
          <div className="max-w-lg mx-auto pointer-events-auto">
            <button
              onClick={handleLaunch}
              disabled={!fileName}
              className={`w-full flex items-center justify-center gap-3 ${
                fileName
                  ? "btn-primary-cta"
                  : "py-4 rounded-2xl font-display font-semibold text-lg bg-space-surface/80 backdrop-blur-md border border-space-border text-white/30 cursor-not-allowed"
              }`}
            >
              <Rocket className="w-5 h-5" />
              {fileName ? "Launch Reading Session" : "Upload a PDF to begin"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function NotionExplorer({
  onImport,
}: {
  onImport: (book: ExplorerBook) => Promise<void> | void;
}) {
  const { notionConfig } = useNotesStore();
  const [mounted, setMounted] = useState(false);
  const [books, setBooks] = useState<ExplorerBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [importingBookId, setImportingBookId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadBooks = useCallback(async () => {
    if (!notionConfig.connected || !notionConfig.token || !notionConfig.booksDatabaseId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/notion/explorer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: notionConfig.token,
          booksDatabaseId: notionConfig.booksDatabaseId,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to load Notion books");
        return;
      }

      setBooks(data.books || []);
      setExpanded(true);
    } catch {
      setError("Failed to load Notion books");
    } finally {
      setLoading(false);
    }
  }, [notionConfig.booksDatabaseId, notionConfig.connected, notionConfig.token]);

  const handleImport = useCallback(
    async (book: ExplorerBook) => {
      if (!book.hasPdf || importingBookId) return;

      setImportingBookId(book.id);
      setError(null);

      try {
        await onImport(book);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load PDF");
      } finally {
        setImportingBookId(null);
      }
    },
    [importingBookId, onImport]
  );

  if (!mounted || !notionConfig.connected) return null;

  const booksWithPdf = books.filter((book) => book.hasPdf).length;

  return (
    <div className="glass-panel p-5 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center text-gold-400">
            <Library className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-display font-medium text-white/85 tracking-wide">
              Notion Explorer
            </h3>
            <p className="text-[11px] text-white/35 mt-0.5">
              Load books from your Books DB and continue reading PDFs
            </p>
          </div>
        </div>

        <button
          onClick={loadBooks}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-white/10 border border-space-border text-xs font-medium text-white/70 hover:text-white hover:border-gold-500/40 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {books.length ? "Refresh" : "Open Explorer"}
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {expanded && (
        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between text-[11px] text-white/35">
            <span>{books.length} books found</span>
            <span>{booksWithPdf} with PDF</span>
          </div>

          <div className="max-h-72 overflow-y-auto pr-1 space-y-2">
            {books.map((book) => (
              <div
                key={book.id}
                className={`rounded-xl border p-3 transition-colors ${
                  book.hasPdf
                    ? "border-space-border bg-space-black/30 hover:border-gold-500/30"
                    : "border-white/5 bg-white/[0.02] opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white/80 truncate">{book.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-white/35">
                      <span>{book.status || "No status"}</span>
                      {book.currentPage && <span>Page {book.currentPage}</span>}
                      {book.totalPages && <span>of {book.totalPages}</span>}
                      <span
                        className={
                          book.hasPdf ? "text-green-400/70" : "text-yellow-300/60"
                        }
                      >
                        {book.hasPdf ? "PDF attached" : "No PDF"}
                      </span>
                      {book.pdfName && (
                        <span className="max-w-[220px] truncate text-white/25">
                          {book.pdfName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={book.notionUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Open in Notion"
                      className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleImport(book)}
                      disabled={!book.hasPdf || Boolean(importingBookId)}
                      className="px-3 py-1.5 rounded-lg bg-gold-500/15 border border-gold-500/30 text-xs font-medium text-gold-300 hover:bg-gold-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {importingBookId === book.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      {importingBookId === book.id ? "Loading" : "Load"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NotionConnectCard() {
  const { notionConfig } = useNotesStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="glass-panel p-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-space-black/50 flex items-center justify-center text-white/30">
            <CloudUpload className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/80">Notion Sync</p>
            <p className="text-[11px] text-white/30 mt-0.5">
              Save notes &amp; progress
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (notionConfig.connected) {
    return (
      <div className="glass-panel p-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-500/15 flex items-center justify-center">
            <Check className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/80">Notion Connected</p>
            <p className="text-[11px] text-white/30 mt-0.5">
              Notes will sync to your workspace
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-space-black/50 flex items-center justify-center text-white/30">
            <CloudUpload className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/80">Notion Sync</p>
            <p className="text-[11px] text-white/30 mt-0.5">
              Save notes &amp; progress
            </p>
          </div>
        </div>
        <button
          onClick={() => { window.location.href = "/api/notion/auth"; }}
          className="px-3 py-1.5 rounded-lg bg-white/10 border border-space-border text-xs font-medium text-white/70 hover:text-white hover:border-gold-500/40 transition-colors"
        >
          Connect
        </button>
      </div>
    </div>
  );
}

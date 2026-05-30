"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Clock,
  Shield,
  Maximize2,
  X,
  Sun,
  Moon,
  Sparkles,
  PenTool,
  StickyNote,
  LayoutDashboard,
  Keyboard,
  Target,
  Info,
} from "lucide-react";
import { useReaderStore, ReadingMode } from "@/lib/store";
import { useDrawingStore } from "@/lib/drawingStore";
import { useNotesStore } from "@/lib/notesStore";
import { NotionSyncButton } from "./NotionSync";

export function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {
      /* ignore errors */
    });
  } else {
    document.exitFullscreen().catch(() => {
      /* ignore errors */
    });
  }
}

type HotkeyHint = {
  keys: string;
  description: string;
};

function NotesToggle() {
  const { isNotesPanelOpen, toggleNotesPanel, notes } = useNotesStore();
  const noteCount = notes.length;
  return (
    <button
      onClick={toggleNotesPanel}
      className={`p-2 rounded-lg transition-colors relative ${
        isNotesPanelOpen
          ? "bg-gold-500/20 text-gold-400"
          : "hover:bg-white/5 text-white/60 hover:text-white"
      }`}
      title={isNotesPanelOpen ? "Close Notes" : "Open Notes"}
    >
      <StickyNote className="w-4 h-4" />
      {noteCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-gold-500 text-space-black text-[8px] font-bold flex items-center justify-center">
          {noteCount > 9 ? "9+" : noteCount}
        </span>
      )}
    </button>
  );
}

function NotesBoardToggle() {
  const { isNotesBoardOpen, toggleNotesBoard, notes } = useNotesStore();
  const noteCount = notes.filter((note) => note.content.trim()).length;

  return (
    <button
      onClick={toggleNotesBoard}
      className={`p-2 rounded-lg transition-colors relative ${
        isNotesBoardOpen
          ? "bg-gold-500/20 text-gold-400"
          : "hover:bg-white/5 text-white/60 hover:text-white"
      }`}
      title={isNotesBoardOpen ? "Close Notes Board" : "Open Notes Board"}
    >
      <LayoutDashboard className="w-4 h-4" />
      {noteCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-gold-500 text-space-black text-[8px] font-bold flex items-center justify-center">
          {noteCount > 9 ? "9+" : noteCount}
        </span>
      )}
    </button>
  );
}

function DrawingToggle() {
  const { isDrawingMode, toggleDrawingMode } = useDrawingStore();
  return (
    <button
      onClick={toggleDrawingMode}
      className={`p-2 rounded-lg transition-colors ${
        isDrawingMode
          ? "bg-nebula-purple/20 text-nebula-purple"
          : "hover:bg-white/5 text-white/60 hover:text-white"
      }`}
      title={isDrawingMode ? "Exit Drawing" : "Drawing Tools"}
    >
      <PenTool className="w-4 h-4" />
    </button>
  );
}

interface ReaderToolbarProps {
  hotkeys?: HotkeyHint[];
}

export function ReaderToolbar({ hotkeys = [] }: ReaderToolbarProps) {
  const {
    currentPage,
    totalPages,
    setCurrentPage,
    zoom,
    setZoom,
    timer,
    startTimer,
    stopTimer,
    tickTimer,
    focusModeActive,
    toggleFocusMode,
    readingMode,
    setReadingMode,
    setPhase,
    reset,
    dailyRecommendation,
  } = useReaderStore();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showHotkeys, setShowHotkeys] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(true);

  useEffect(() => {
    if (dailyRecommendation) {
      setShowRecommendation(true);
    } else {
      setShowRecommendation(false);
    }
  }, [dailyRecommendation?.timestamp]);

  // Timer logic
  useEffect(() => {
    if (timer.isRunning) {
      intervalRef.current = setInterval(() => {
        tickTimer();
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timer.isRunning, tickTimer]);

  // Auto-start timer when entering reading mode
  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, [startTimer, stopTimer]);

  // Timer exceeded notification
  useEffect(() => {
    if (timer.elapsedSeconds >= timer.targetMinutes * 60 && timer.isRunning) {
      stopTimer();
    }
  }, [timer.elapsedSeconds, timer.targetMinutes, timer.isRunning, stopTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const remainingSeconds = timer.targetMinutes * 60 - timer.elapsedSeconds;
  const progress = timer.elapsedSeconds / (timer.targetMinutes * 60);

  const handleFullscreen = () => {
    toggleFullscreen();
  };

  const handleExit = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    reset();
    setPhase("upload");
  };

  const modeIcons: Record<ReadingMode, React.ReactNode> = {
    "deep-space": <Sparkles className="w-4 h-4" />,
    "low-light": <Moon className="w-4 h-4" />,
    "focus": <Sun className="w-4 h-4" />,
  };

  const cycleModes: ReadingMode[] = ["deep-space", "low-light", "focus"];
  const nextMode = () => {
    const idx = cycleModes.indexOf(readingMode);
    setReadingMode(cycleModes[(idx + 1) % cycleModes.length]);
  };

  const formatKeySegment = (segment: string) => {
    const normalized = segment.trim();
    const lower = normalized.toLowerCase();

    switch (lower) {
      case "arrow left":
        return { display: "←", label: "Arrow Left" };
      case "arrow right":
        return { display: "→", label: "Arrow Right" };
      case "arrow up":
        return { display: "↑", label: "Arrow Up" };
      case "arrow down":
        return { display: "↓", label: "Arrow Down" };
      case "space":
        return { display: "Space", label: "Spacebar" };
      case "enter":
        return { display: "Enter", label: "Enter" };
      default: {
        const display =
          normalized.length === 1
            ? normalized.toUpperCase()
            : normalized
                .split(" ")
                .map((word) =>
                  word.length > 1
                    ? word[0].toUpperCase() + word.slice(1).toLowerCase()
                    : word.toUpperCase()
                )
                .join(" ");
        return { display, label: normalized };
      }
    }
  };

  const renderKeySegments = (keys: string) => {
    return keys.split("+").map((rawSegment, index) => {
      const { display, label } = formatKeySegment(rawSegment);
      return (
        <span
          key={`${label}-${index}`}
          aria-label={label}
          className="inline-flex min-w-[34px] items-center justify-center rounded-lg border border-white/12 bg-white/8 px-2 py-1 text-[11px] font-mono tracking-[0.18em] text-white/70 shadow-inner shadow-black/20"
        >
          {display}
        </span>
      );
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-space-deep/90 backdrop-blur-xl border-b border-space-border/30"
      >
      {/* Left: Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleExit}
          className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors"
          title="Exit Reading"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-space-border mx-1" />

        <button
          onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors disabled:opacity-30"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-sm text-white/70 font-mono min-w-[80px] text-center leading-relaxed">
          {currentPage} / {totalPages}
        </span>

        <button
          onClick={() =>
            currentPage < totalPages && setCurrentPage(currentPage + 1)
          }
          disabled={currentPage >= totalPages}
          className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors disabled:opacity-30"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Center: Timer & Recommendation */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-space-surface border border-space-border">
            <Clock className="w-3.5 h-3.5 text-gold-500" />
            <span className="text-sm font-mono text-gold-400">
              {formatTime(remainingSeconds > 0 ? remainingSeconds : 0)}
            </span>
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 h-0.5 rounded-full bg-gold-500/30 w-full overflow-hidden">
              <div
                className="h-full bg-gold-500 timer-progress"
                style={{ width: `${Math.min(progress * 100, 100)}%` }}
              />
            </div>
          </div>

          {focusModeActive && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gold-500/10 border border-gold-500/30">
              <Shield className="w-3 h-3 text-gold-500" />
              <span className="text-xs text-gold-400">Focus Active</span>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showRecommendation && dailyRecommendation && (
            <motion.div
              key={dailyRecommendation.timestamp}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex items-start gap-3 rounded-xl border border-gold-500/25 bg-gold-500/10 px-3 py-2 max-w-xs"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-500/20 border border-gold-500/40 text-gold-200">
                {dailyRecommendation.source === "notion" ? (
                  <Target className="w-4 h-4" />
                ) : (
                  <Info className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 text-[12px] leading-relaxed text-white/70">
                <p className="font-semibold text-white/80">
                  {dailyRecommendation.source === "notion"
                    ? "Daily Pages"
                    : "Smart goal"}
                </p>
                <p className="mt-0.5">{dailyRecommendation.text}</p>
              </div>
              <button
                onClick={() => setShowRecommendation(false)}
                className="mt-0.5 text-white/30 hover:text-white/60 transition-colors"
                aria-label="Dismiss recommendation"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setZoom(zoom - 10)}
          className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-xs text-white/50 min-w-[40px] text-center font-mono">
          {zoom}%
        </span>

        <button
          onClick={() => setZoom(zoom + 10)}
          className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-space-border mx-1" />

        <button
          onClick={nextMode}
          className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-gold-400 transition-colors"
          title={`Mode: ${readingMode}`}
        >
          {modeIcons[readingMode]}
        </button>

        <button
          onClick={toggleFocusMode}
          className={`p-2 rounded-lg transition-colors ${
            focusModeActive
              ? "bg-gold-500/20 text-gold-400"
              : "hover:bg-white/5 text-white/60 hover:text-white"
          }`}
          title="Toggle Focus Shield"
        >
          <Shield className="w-4 h-4" />
        </button>

        <NotesToggle />

        <NotesBoardToggle />

        <DrawingToggle />

        <div className="h-5 w-px bg-space-border mx-1" />

        <NotionSyncButton variant="compact" />

        {hotkeys.length > 0 && (
          <button
            onClick={() => setShowHotkeys((value) => !value)}
            className={`p-2 rounded-lg transition-colors ${
              showHotkeys
                ? "bg-gold-500/20 text-gold-300"
                : "hover:bg-white/5 text-white/60 hover:text-white"
            }`}
            title="Keyboard Shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={handleFullscreen}
          className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors"
          title="Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
      </motion.div>

      <AnimatePresence>
        {showHotkeys && hotkeys.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed right-4 top-16 z-50 w-80 max-w-full rounded-2xl border border-space-border/60 bg-space-deep/96 backdrop-blur-2xl shadow-xl shadow-black/30"
          >
            <div className="flex items-start justify-between px-4 py-3 border-b border-space-border/45">
              <div>
                <p className="text-[10px] uppercase tracking-[0.32em] text-white/55">
                  Hotkeys
                </p>
                <p className="mt-1 text-[12px] text-white/35">
                  Quick controls for Infinity Reader
                </p>
              </div>
              <button
                onClick={() => setShowHotkeys(false)}
                className="text-[11px] text-white/40 hover:text-white/70 transition-colors"
              >
                Close
              </button>
            </div>
            <ul className="divide-y divide-space-border/35">
              {hotkeys.map((item, index) => (
                <li
                  key={`${item.keys}-${index}`}
                  className="grid grid-cols-[auto,1fr] items-center gap-3 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    {renderKeySegments(item.keys)}
                  </div>
                  <p className="text-[12px] text-white/45 leading-relaxed">
                    {item.description}
                  </p>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

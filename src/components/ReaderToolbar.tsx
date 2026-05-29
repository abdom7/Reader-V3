"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Clock,
  Shield,
  Eye,
  Maximize2,
  X,
  Sun,
  Moon,
  Sparkles,
  PenTool,
  StickyNote,
  LayoutDashboard,
} from "lucide-react";
import { useReaderStore, ReadingMode } from "@/lib/store";
import { useDrawingStore } from "@/lib/drawingStore";
import { useNotesStore } from "@/lib/notesStore";
import { NotionSyncButton } from "./NotionSync";

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

export function ReaderToolbar() {
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
  } = useReaderStore();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
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

  return (
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

      {/* Center: Timer */}
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

        <button
          onClick={handleFullscreen}
          className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors"
          title="Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

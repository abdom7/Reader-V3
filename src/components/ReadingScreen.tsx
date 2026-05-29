"use client";

import { useReaderStore } from "@/lib/store";
import { useDrawingStore } from "@/lib/drawingStore";
import { useNotesStore } from "@/lib/notesStore";
import { Starfield } from "./Starfield";
import { PdfViewer } from "./PdfViewer";
import { ReaderToolbar } from "./ReaderToolbar";
import { TimerComplete } from "./TimerComplete";
import { DrawingToolbar } from "./DrawingToolbar";
import { NotesSidebar } from "./NotesSidebar";
import { NotesBoard } from "./NotesBoard";

export function ReadingScreen() {
  const { readingMode, timer } = useReaderStore();
  const { isDrawingMode } = useDrawingStore();
  const { isNotesPanelOpen } = useNotesStore();

  const isTimerDone =
    timer.elapsedSeconds >= timer.targetMinutes * 60 && !timer.isRunning;

  const modeClass =
    readingMode === "deep-space"
      ? "reading-mode-deep-space"
      : readingMode === "low-light"
      ? "reading-mode-low-light"
      : "reading-mode-focus";

  const bgColor =
    readingMode === "deep-space"
      ? "bg-space-deep"
      : readingMode === "low-light"
      ? "bg-[#1a1410]"
      : "bg-[#0d0d12]";

  return (
    <div className={`fixed inset-0 ${bgColor} ${modeClass}`}>
      {readingMode === "deep-space" && <Starfield density={60} />}

      <ReaderToolbar />

      <NotesSidebar />

      <NotesBoard />

      <div
        className={`pt-12 h-full relative transition-all duration-300 ${
          isNotesPanelOpen ? "pl-80" : "pl-0"
        }`}
      >
        <PdfViewer />

        {/* Drawing mode indicator border */}
        {isDrawingMode && (
          <div className="absolute inset-0 pointer-events-none z-40 border-2 border-nebula-purple/30 rounded-sm" />
        )}
      </div>

      <DrawingToolbar />

      {isTimerDone && <TimerComplete />}
    </div>
  );
}

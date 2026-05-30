"use client";

import { useMemo } from "react";
import { useReaderStore } from "@/lib/store";
import { useDrawingStore } from "@/lib/drawingStore";
import { useNotesStore } from "@/lib/notesStore";
import { Starfield } from "./Starfield";
import { PdfViewer } from "./PdfViewer";
import { ReaderToolbar, toggleFullscreen } from "./ReaderToolbar";
import { TimerComplete } from "./TimerComplete";
import { DrawingToolbar } from "./DrawingToolbar";
import { NotesSidebar } from "./NotesSidebar";
import { NotesBoard } from "./NotesBoard";
import { useHotkeys, Modifier } from "@/hooks/useHotkeys";

export function ReadingScreen() {
  const {
    readingMode,
    timer,
    zoom,
    setZoom,
    currentPage,
    focusModeActive,
    toggleFocusMode,
  } = useReaderStore((state) => ({
    readingMode: state.readingMode,
    timer: state.timer,
    zoom: state.zoom,
    setZoom: state.setZoom,
    currentPage: state.currentPage,
    focusModeActive: state.focusModeActive,
    toggleFocusMode: state.toggleFocusMode,
  }));
  const { isDrawingMode, toggleDrawingMode } = useDrawingStore((state) => ({
    isDrawingMode: state.isDrawingMode,
    toggleDrawingMode: state.toggleDrawingMode,
  }));
  const {
    isNotesPanelOpen,
    toggleNotesPanel,
    toggleNotesBoard,
    setNotesPanelOpen,
    addNote,
  } = useNotesStore((state) => ({
    isNotesPanelOpen: state.isNotesPanelOpen,
    toggleNotesPanel: state.toggleNotesPanel,
    toggleNotesBoard: state.toggleNotesBoard,
    setNotesPanelOpen: state.setNotesPanelOpen,
    addNote: state.addNote,
  }));

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

  const hotkeyConfigs = useMemo(
    () => [
      {
        key: "f",
        handler: () => toggleFullscreen(),
        preventDefault: true,
        description: "Toggle fullscreen",
      },
      {
        key: "=",
        handler: () => setZoom(zoom + 10),
        preventDefault: true,
        description: "Zoom in",
      },
      {
        key: "-",
        handler: () => setZoom(zoom - 10),
        preventDefault: true,
        description: "Zoom out",
      },
      {
        key: "n",
        handler: () => toggleNotesPanel(),
        preventDefault: true,
        description: "Toggle notes sidebar",
      },
      {
        key: "n",
        modifiers: ["shift"] as Modifier[],
        handler: () => {
          addNote(currentPage);
          setNotesPanelOpen(true);
        },
        preventDefault: true,
        description: "Add note on current page",
      },
      {
        key: "b",
        handler: () => toggleNotesBoard(),
        preventDefault: true,
        description: "Toggle sticky notes board",
      },
      {
        key: "d",
        handler: () => toggleDrawingMode(),
        preventDefault: true,
        description: "Toggle drawing mode",
      },
      {
        key: "s",
        handler: () => toggleFocusMode(),
        preventDefault: true,
        description: "Toggle focus shield",
      },
    ],
    [
      addNote,
      currentPage,
      setZoom,
      toggleDrawingMode,
      toggleFocusMode,
      toggleNotesBoard,
      toggleNotesPanel,
      setNotesPanelOpen,
      zoom,
    ]
  );

  useHotkeys(hotkeyConfigs);

  const hotkeyHints = useMemo(
    () => [
      { keys: "F", description: "Toggle fullscreen" },
      { keys: "=", description: "Zoom in" },
      { keys: "-", description: "Zoom out" },
      { keys: "Arrow Left", description: "Previous page" },
      { keys: "Arrow Right", description: "Next page" },
      { keys: "Space", description: "Advance to next page" },
      { keys: "N", description: "Toggle notes sidebar" },
      { keys: "Shift + N", description: "Add note on current page" },
      { keys: "B", description: "Toggle sticky notes board" },
      { keys: "D", description: "Toggle drawing mode" },
      { keys: "S", description: "Toggle focus shield" },
    ],
    []
  );

  return (
    <div className={`fixed inset-0 ${bgColor} ${modeClass}`}>
      {readingMode === "deep-space" && <Starfield density={60} />}

      <ReaderToolbar hotkeys={hotkeyHints} />

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

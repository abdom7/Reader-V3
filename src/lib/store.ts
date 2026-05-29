import { create } from "zustand";

export type ReadingMode = "deep-space" | "low-light" | "focus";
export type AppPhase = "launch" | "upload" | "countdown" | "reading";

interface TimerState {
  targetMinutes: number;
  elapsedSeconds: number;
  isRunning: boolean;
}

interface ReaderState {
  phase: AppPhase;
  readingMode: ReadingMode;
  focusModeActive: boolean;
  pdfFile: File | null;
  pdfUrl: string | null;
  bookTitle: string | null;
  currentPage: number;
  totalPages: number;
  zoom: number;
  timer: TimerState;
  sidebarOpen: boolean;

  // Actions
  setPhase: (phase: AppPhase) => void;
  setReadingMode: (mode: ReadingMode) => void;
  toggleFocusMode: () => void;
  setPdfFile: (file: File | null) => void;
  setPdfUrl: (url: string | null) => void;
  setBookTitle: (title: string | null) => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (total: number) => void;
  setZoom: (zoom: number) => void;
  setTimerTarget: (minutes: number) => void;
  startTimer: () => void;
  stopTimer: () => void;
  tickTimer: () => void;
  resetTimer: () => void;
  toggleSidebar: () => void;
  reset: () => void;
}

const initialState = {
  phase: "launch" as AppPhase,
  readingMode: "deep-space" as ReadingMode,
  focusModeActive: false,
  pdfFile: null,
  pdfUrl: null,
  bookTitle: null,
  currentPage: 1,
  totalPages: 0,
  zoom: 100,
  timer: {
    targetMinutes: 30,
    elapsedSeconds: 0,
    isRunning: false,
  },
  sidebarOpen: false,
};

export const useReaderStore = create<ReaderState>((set) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),
  setReadingMode: (mode) => set({ readingMode: mode }),
  toggleFocusMode: () =>
    set((state) => ({ focusModeActive: !state.focusModeActive })),
  setPdfFile: (file) => set({ pdfFile: file }),
  setPdfUrl: (url) => set({ pdfUrl: url }),
  setBookTitle: (title) => set({ bookTitle: title }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setTotalPages: (total) => set({ totalPages: total }),
  setZoom: (zoom) => set({ zoom: Math.max(50, Math.min(200, zoom)) }),
  setTimerTarget: (minutes) =>
    set((state) => ({ timer: { ...state.timer, targetMinutes: minutes } })),
  startTimer: () =>
    set((state) => ({ timer: { ...state.timer, isRunning: true } })),
  stopTimer: () =>
    set((state) => ({ timer: { ...state.timer, isRunning: false } })),
  tickTimer: () =>
    set((state) => ({
      timer: { ...state.timer, elapsedSeconds: state.timer.elapsedSeconds + 1 },
    })),
  resetTimer: () =>
    set((state) => ({
      timer: { ...state.timer, elapsedSeconds: 0, isRunning: false },
    })),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  reset: () => set(initialState),
}));

import { create } from "zustand";

export type ReadingMode = "deep-space" | "low-light" | "focus";
export type AppPhase = "launch" | "upload" | "countdown" | "reading";

type RecommendationSource = "notion" | "fallback";

export interface DailyRecommendation {
  source: RecommendationSource;
  pages: number | null;
  text?: string | null;
  missingDeadline?: boolean;
  raw?: string | null;
  timestamp: number;
}

type DailyRecommendationInput = Omit<DailyRecommendation, "timestamp">;

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
  uploadedPdfUrl: string | null;
  bookTitle: string | null;
  bookGenre: string | null;
  currentPage: number;
  totalPages: number;
  zoom: number;
  timer: TimerState;
  sidebarOpen: boolean;
  dailyRecommendation: DailyRecommendation | null;

  // Actions
  setPhase: (phase: AppPhase) => void;
  setReadingMode: (mode: ReadingMode) => void;
  toggleFocusMode: () => void;
  setPdfFile: (file: File | null) => void;
  setPdfUrl: (url: string | null) => void;
  setUploadedPdfUrl: (url: string | null) => void;
  setBookTitle: (title: string | null) => void;
  setBookGenre: (genre: string | null) => void;
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
  setDailyRecommendation: (recommendation: DailyRecommendationInput | null) => void;
  clearDailyRecommendation: () => void;
}

const initialState = {
  phase: "launch" as AppPhase,
  readingMode: "deep-space" as ReadingMode,
  focusModeActive: false,
  pdfFile: null,
  pdfUrl: null,
  uploadedPdfUrl: null,
  bookTitle: null,
  bookGenre: null,
  currentPage: 1,
  totalPages: 0,
  zoom: 100,
  timer: {
    targetMinutes: 30,
    elapsedSeconds: 0,
    isRunning: false,
  },
  sidebarOpen: false,
  dailyRecommendation: null as DailyRecommendation | null,
};

export const useReaderStore = create<ReaderState>((set) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),
  setReadingMode: (mode) => set({ readingMode: mode }),
  toggleFocusMode: () =>
    set((state) => ({ focusModeActive: !state.focusModeActive })),
  setPdfFile: (file) => set({ pdfFile: file }),
  setPdfUrl: (url) => set({ pdfUrl: url }),
  setUploadedPdfUrl: (url) => set({ uploadedPdfUrl: url }),
  setBookTitle: (title) => set({ bookTitle: title }),
  setBookGenre: (genre) => set({ bookGenre: genre }),
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
  setDailyRecommendation: (recommendation) =>
    set({
      dailyRecommendation: recommendation
        ? { ...recommendation, timestamp: Date.now() }
        : null,
    }),
  clearDailyRecommendation: () => set({ dailyRecommendation: null }),
  reset: () => set(initialState),
}));

import { create } from "zustand";

export type DrawingTool =
  | "pen"
  | "highlighter"
  | "arrow"
  | "line"
  | "rectangle"
  | "ellipse"
  | "eraser";

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface Stroke {
  id: string;
  tool: DrawingTool;
  points: Point[];
  color: string;
  size: number;
  opacity: number;
}

interface DrawingState {
  isDrawingMode: boolean;
  activeTool: DrawingTool;
  strokeColor: string;
  strokeSize: number;
  // Per-page stroke storage: page number -> strokes
  pageStrokes: Record<number, Stroke[]>;
  // Undo/redo stacks per page
  undoStack: Record<number, Stroke[][]>;
  redoStack: Record<number, Stroke[][]>;
  // Currently drawing stroke
  currentStroke: Stroke | null;

  // Actions
  toggleDrawingMode: () => void;
  setDrawingMode: (active: boolean) => void;
  setActiveTool: (tool: DrawingTool) => void;
  setStrokeColor: (color: string) => void;
  setStrokeSize: (size: number) => void;
  startStroke: (page: number, point: Point, sizeOverride?: number) => void;
  addPoint: (point: Point) => void;
  endStroke: (page: number) => void;
  undo: (page: number) => void;
  redo: (page: number) => void;
  clearPage: (page: number) => void;
  clearAll: () => void;
}

let strokeIdCounter = 0;
const generateId = () => `stroke-${Date.now()}-${++strokeIdCounter}`;

const getToolDefaults = (tool: DrawingTool) => {
  switch (tool) {
    case "highlighter":
      return { opacity: 0.35, size: 20 };
    case "eraser":
      return { opacity: 1, size: 16 };
    default:
      return { opacity: 1, size: 3 };
  }
};

export const useDrawingStore = create<DrawingState>((set, get) => ({
  isDrawingMode: false,
  activeTool: "pen",
  strokeColor: "#d4a017",
  strokeSize: 3,
  pageStrokes: {},
  undoStack: {},
  redoStack: {},
  currentStroke: null,

  toggleDrawingMode: () =>
    set((s) => ({ isDrawingMode: !s.isDrawingMode })),

  setDrawingMode: (active) => set({ isDrawingMode: active }),

  setActiveTool: (tool) => {
    const defaults = getToolDefaults(tool);
    set({ activeTool: tool, strokeSize: defaults.size });
  },

  setStrokeColor: (color) => set({ strokeColor: color }),
  setStrokeSize: (size) => set({ strokeSize: size }),

  startStroke: (page, point, sizeOverride) => {
    const { activeTool, strokeColor, strokeSize } = get();
    const defaults = getToolDefaults(activeTool);
    set({
      currentStroke: {
        id: generateId(),
        tool: activeTool,
        points: [point],
        color: activeTool === "eraser" ? "eraser" : strokeColor,
        size: sizeOverride ?? strokeSize,
        opacity: defaults.opacity,
      },
    });
  },

  addPoint: (point) => {
    const { currentStroke } = get();
    if (!currentStroke) return;
    set({
      currentStroke: {
        ...currentStroke,
        points: [...currentStroke.points, point],
      },
    });
  },

  endStroke: (page) => {
    const { currentStroke, pageStrokes, undoStack } = get();
    if (!currentStroke || currentStroke.points.length < 2) {
      set({ currentStroke: null });
      return;
    }

    const existing = pageStrokes[page] || [];
    // Save current state for undo
    const pageUndoStack = undoStack[page] || [];

    let newStrokes: Stroke[];

    if (currentStroke.color === "eraser") {
      // Eraser: remove strokes that intersect with eraser path
      newStrokes = existing.filter(
        (stroke) => !doesStrokeIntersect(stroke, currentStroke)
      );
    } else {
      newStrokes = [...existing, currentStroke];
    }

    set({
      currentStroke: null,
      pageStrokes: { ...pageStrokes, [page]: newStrokes },
      undoStack: {
        ...undoStack,
        [page]: [...pageUndoStack, existing],
      },
      redoStack: { ...get().redoStack, [page]: [] },
    });
  },

  undo: (page) => {
    const { pageStrokes, undoStack, redoStack } = get();
    const pageUndoStack = undoStack[page] || [];
    if (pageUndoStack.length === 0) return;

    const previousState = pageUndoStack[pageUndoStack.length - 1];
    const currentState = pageStrokes[page] || [];
    const pageRedoStack = redoStack[page] || [];

    set({
      pageStrokes: { ...pageStrokes, [page]: previousState },
      undoStack: {
        ...undoStack,
        [page]: pageUndoStack.slice(0, -1),
      },
      redoStack: {
        ...redoStack,
        [page]: [...pageRedoStack, currentState],
      },
    });
  },

  redo: (page) => {
    const { pageStrokes, undoStack, redoStack } = get();
    const pageRedoStack = redoStack[page] || [];
    if (pageRedoStack.length === 0) return;

    const nextState = pageRedoStack[pageRedoStack.length - 1];
    const currentState = pageStrokes[page] || [];
    const pageUndoStack = undoStack[page] || [];

    set({
      pageStrokes: { ...pageStrokes, [page]: nextState },
      undoStack: {
        ...undoStack,
        [page]: [...pageUndoStack, currentState],
      },
      redoStack: {
        ...redoStack,
        [page]: pageRedoStack.slice(0, -1),
      },
    });
  },

  clearPage: (page) => {
    const { pageStrokes, undoStack, redoStack } = get();
    const currentState = pageStrokes[page] || [];
    if (currentState.length === 0) return;
    const pageUndoStack = undoStack[page] || [];

    set({
      pageStrokes: { ...pageStrokes, [page]: [] },
      undoStack: {
        ...undoStack,
        [page]: [...pageUndoStack, currentState],
      },
      redoStack: { ...redoStack, [page]: [] },
    });
  },

  clearAll: () =>
    set({ pageStrokes: {}, undoStack: {}, redoStack: {}, currentStroke: null }),
}));

// Utility: check if eraser path intersects a stroke
function doesStrokeIntersect(stroke: Stroke, eraser: Stroke): boolean {
  const eraserSize = eraser.size;
  for (const ep of eraser.points) {
    for (const sp of stroke.points) {
      const dx = ep.x - sp.x;
      const dy = ep.y - sp.y;
      if (dx * dx + dy * dy < eraserSize * eraserSize) {
        return true;
      }
    }
  }
  return false;
}

"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Pen,
  Highlighter,
  ArrowUpRight,
  Minus,
  Square,
  Circle,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  X,
} from "lucide-react";
import { useDrawingStore, DrawingTool } from "@/lib/drawingStore";
import { useReaderStore } from "@/lib/store";

const TOOLS: { id: DrawingTool; icon: React.ReactNode; label: string }[] = [
  { id: "pen", icon: <Pen className="w-4 h-4" />, label: "Pen" },
  {
    id: "highlighter",
    icon: <Highlighter className="w-4 h-4" />,
    label: "Highlighter",
  },
  { id: "arrow", icon: <ArrowUpRight className="w-4 h-4" />, label: "Arrow" },
  { id: "line", icon: <Minus className="w-4 h-4" />, label: "Line" },
  {
    id: "rectangle",
    icon: <Square className="w-4 h-4" />,
    label: "Rectangle",
  },
  { id: "ellipse", icon: <Circle className="w-4 h-4" />, label: "Ellipse" },
  { id: "eraser", icon: <Eraser className="w-4 h-4" />, label: "Eraser" },
];

const COLORS = [
  "#d4a017", // Gold (brand)
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#22c55e", // Green
  "#f97316", // Orange
  "#a855f7", // Purple
  "#06b6d4", // Cyan
  "#ffffff", // White
];

const SIZES = [
  { value: 2, label: "S" },
  { value: 4, label: "M" },
  { value: 6, label: "L" },
  { value: 10, label: "XL" },
];

export function DrawingToolbar() {
  const {
    isDrawingMode,
    activeTool,
    strokeColor,
    strokeSize,
    setActiveTool,
    setStrokeColor,
    setStrokeSize,
    setDrawingMode,
    undo,
    redo,
    clearPage,
    undoStack,
    redoStack,
  } = useDrawingStore();

  const { currentPage } = useReaderStore();

  const canUndo = (undoStack[currentPage] || []).length > 0;
  const canRedo = (redoStack[currentPage] || []).length > 0;

  return (
    <AnimatePresence>
      {isDrawingMode && (
        <motion.div
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed right-3 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-1"
        >
          {/* Main tool panel */}
          <div className="glass-panel p-2 flex flex-col gap-1 shadow-nebula">
            {/* Close drawing mode */}
            <button
              onClick={() => setDrawingMode(false)}
              className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors mb-1"
              title="Close Drawing"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="h-px bg-space-border/50" />

            {/* Tool buttons */}
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  activeTool === tool.id
                    ? "bg-gold-500/20 text-gold-400 shadow-sm"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
                title={tool.label}
              >
                {tool.icon}
              </button>
            ))}

            <div className="h-px bg-space-border/50 my-1" />

            {/* Undo / Redo */}
            <button
              onClick={() => undo(currentPage)}
              disabled={!canUndo}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => redo(currentPage)}
              disabled={!canRedo}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:pointer-events-none"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>

            <div className="h-px bg-space-border/50 my-1" />

            {/* Clear page */}
            <button
              onClick={() => clearPage(currentPage)}
              className="p-2 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Clear Page"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Color picker panel */}
          {activeTool !== "eraser" && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-panel p-2 flex flex-col gap-1"
            >
              <p className="text-[10px] text-white/40 text-center uppercase tracking-widest mb-1">
                Color
              </p>
              <div className="grid grid-cols-2 gap-1">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setStrokeColor(color)}
                    className={`w-6 h-6 rounded-full border-2 transition-all mx-auto ${
                      strokeColor === color
                        ? "border-white scale-110"
                        : "border-transparent hover:border-white/30 hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>

              <div className="h-px bg-space-border/50 my-1" />

              <p className="text-[10px] text-white/40 text-center uppercase tracking-widest mb-1">
                Size
              </p>
              <div className="flex flex-col gap-1">
                {SIZES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStrokeSize(s.value)}
                    className={`flex items-center justify-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono transition-all ${
                      strokeSize === s.value
                        ? "bg-gold-500/20 text-gold-400"
                        : "text-white/50 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span
                      className="rounded-full bg-current flex-shrink-0"
                      style={{
                        width: `${Math.min(s.value * 1.5, 12)}px`,
                        height: `${Math.min(s.value * 1.5, 12)}px`,
                      }}
                    />
                    {s.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

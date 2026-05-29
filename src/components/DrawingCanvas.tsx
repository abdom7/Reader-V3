"use client";

import { useEffect, useRef, useCallback } from "react";
import { useDrawingStore, Stroke, Point } from "@/lib/drawingStore";
import { useReaderStore } from "@/lib/store";

/**
 * Renders a stroke using quadratic bezier curves between midpoints
 * for smooth freehand drawing. This is the standard technique used
 * by professional drawing apps (Paper, Procreate, Excalidraw).
 */
function renderSmoothStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const { points, color, size, opacity, tool } = stroke;
  if (points.length < 2) return;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (tool === "highlighter") {
    ctx.globalCompositeOperation = "multiply";
  }

  if (tool === "line" || tool === "arrow") {
    // Straight line from first to last point
    const start = points[0];
    const end = points[points.length - 1];
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Arrow head
    if (tool === "arrow") {
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const headLen = Math.max(size * 4, 12);
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(
        end.x - headLen * Math.cos(angle - Math.PI / 6),
        end.y - headLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(
        end.x - headLen * Math.cos(angle + Math.PI / 6),
        end.y - headLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    }
  } else if (tool === "rectangle") {
    const start = points[0];
    const end = points[points.length - 1];
    const w = end.x - start.x;
    const h = end.y - start.y;
    ctx.beginPath();
    ctx.rect(start.x, start.y, w, h);
    ctx.stroke();
  } else if (tool === "ellipse") {
    const start = points[0];
    const end = points[points.length - 1];
    const cx = (start.x + end.x) / 2;
    const cy = (start.y + end.y) / 2;
    const rx = Math.abs(end.x - start.x) / 2;
    const ry = Math.abs(end.y - start.y) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // Freehand: quadratic bezier smoothing between midpoints
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    if (points.length === 2) {
      ctx.lineTo(points[1].x, points[1].y);
    } else {
      // Use midpoints as anchors, actual points as control points
      for (let i = 1; i < points.length - 1; i++) {
        const midX = (points[i].x + points[i + 1].x) / 2;
        const midY = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
      }
      // Connect to last point
      const last = points[points.length - 1];
      ctx.lineTo(last.x, last.y);
    }
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Renders the eraser cursor preview (circle outline).
 */
function renderEraserCursor(
  ctx: CanvasRenderingContext2D,
  pos: Point,
  size: number
) {
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function DrawingCanvas({ width, height }: { width: number; height: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const cursorPos = useRef<Point | null>(null);
  const animFrameRef = useRef<number>(0);

  const {
    isDrawingMode,
    activeTool,
    currentStroke,
    pageStrokes,
    startStroke,
    addPoint,
    endStroke,
    strokeSize,
  } = useDrawingStore();

  const { currentPage } = useReaderStore();

  const strokes = pageStrokes[currentPage] || [];

  // Denormalize a stroke from 0-1 space to current canvas pixel space
  const denormalize = useCallback(
    (stroke: Stroke): Stroke => ({
      ...stroke,
      points: stroke.points.map((p) => ({
        x: p.x * width,
        y: p.y * height,
        pressure: p.pressure,
      })),
      size: stroke.size * width,
    }),
    [width, height]
  );

  // Render loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw committed strokes (denormalize from 0-1 to pixels)
    strokes.forEach((stroke) => {
      if (stroke.color !== "eraser") {
        renderSmoothStroke(ctx, denormalize(stroke));
      }
    });

    // Draw current (in-progress) stroke
    if (currentStroke && currentStroke.color !== "eraser") {
      renderSmoothStroke(ctx, denormalize(currentStroke));
    }

    // Eraser cursor preview (screen space)
    if (
      isDrawingMode &&
      activeTool === "eraser" &&
      cursorPos.current
    ) {
      renderEraserCursor(ctx, cursorPos.current, strokeSize);
    }

    animFrameRef.current = requestAnimationFrame(render);
  }, [strokes, currentStroke, isDrawingMode, activeTool, strokeSize, denormalize]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [render]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isDrawingMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          useDrawingStore.getState().redo(currentPage);
        } else {
          useDrawingStore.getState().undo(currentPage);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        useDrawingStore.getState().redo(currentPage);
      }
      if (e.key === "Escape") {
        useDrawingStore.getState().setDrawingMode(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawingMode, currentPage]);

  // Size canvas to match PDF canvas dimensions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0 || height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  }, [width, height]);

  // Get normalized coordinates (0-1 range relative to canvas)
  const getNormalizedPoint = useCallback(
    (e: React.PointerEvent): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
        pressure: e.pressure,
      };
    },
    []
  );

  // Get screen-space coordinates (for cursor preview only)
  const getScreenPoint = useCallback(
    (e: React.PointerEvent): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawingMode || width === 0) return;
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      isDrawing.current = true;
      const point = getNormalizedPoint(e);
      // Normalize stroke size: store as fraction of canvas width
      const normalizedSize = strokeSize / width;
      startStroke(currentPage, point, normalizedSize);
    },
    [isDrawingMode, currentPage, startStroke, getNormalizedPoint, strokeSize, width]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      // Screen-space cursor for eraser preview
      cursorPos.current = getScreenPoint(e);

      if (!isDrawing.current || !isDrawingMode) return;
      e.preventDefault();
      // Normalized point for stroke storage
      addPoint(getNormalizedPoint(e));
    },
    [isDrawingMode, addPoint, getNormalizedPoint, getScreenPoint]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing.current) return;
      e.preventDefault();
      isDrawing.current = false;
      endStroke(currentPage);
    },
    [currentPage, endStroke]
  );

  // Cursor style based on tool
  const cursorClass = !isDrawingMode
    ? "pointer-events-none"
    : activeTool === "eraser"
    ? "cursor-cell"
    : "cursor-crosshair";

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 z-30 ${cursorClass} ${
        !isDrawingMode ? "pointer-events-none" : ""
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}

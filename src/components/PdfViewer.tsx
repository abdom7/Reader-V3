"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useReaderStore } from "@/lib/store";
import { DrawingCanvas } from "./DrawingCanvas";

export function PdfViewer() {
  const { pdfUrl, bookTitle, currentPage, setCurrentPage, setTotalPages, setBookTitle, totalPages, zoom } =
    useReaderStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [rendering, setRendering] = useState(false);
  const renderTaskRef = useRef<any>(null);

  // Load PDF document
  useEffect(() => {
    if (!pdfUrl) return;

    const loadPdf = async () => {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      try {
        const doc = await pdfjsLib.getDocument(pdfUrl).promise;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);

        const firstPage = await doc.getPage(1);
        const textContent = await firstPage.getTextContent();
        const firstLine = textContent.items
          .map((item: any) => item.str)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim()
          .split(/(?<=[.!?])\s+|\n/)[0]
          ?.trim();

        if (!bookTitle && firstLine && firstLine.length >= 3) {
          setBookTitle(firstLine.slice(0, 120));
        }
      } catch (err) {
        console.error("Failed to load PDF:", err);
      }
    };

    loadPdf();
  }, [bookTitle, pdfUrl, setBookTitle, setTotalPages]);

  // Render current page
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current || rendering) return;

    setRendering(true);

    try {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const scale = (zoom / 100) * (window.devicePixelRatio || 1);
      const viewport = page.getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const cssW = viewport.width / (window.devicePixelRatio || 1);
      const cssH = viewport.height / (window.devicePixelRatio || 1);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      setCanvasSize({ w: cssW, h: cssH });

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      renderTaskRef.current = page.render(renderContext);
      await renderTaskRef.current.promise;
    } catch (err: any) {
      if (err?.name !== "RenderingCancelled") {
        console.error("Render error:", err);
      }
    } finally {
      setRendering(false);
    }
  }, [pdfDoc, currentPage, zoom, rendering]);

  useEffect(() => {
    renderPage();
  }, [pdfDoc, currentPage, zoom]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;

      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (currentPage > 1) setCurrentPage(currentPage - 1);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentPage, totalPages, setCurrentPage]);

  return (
    <div className="flex-1 overflow-auto p-4 h-full">
      <div className="relative min-w-full min-h-full pdf-scroll-container">
        <div className="relative inline-block">
          <canvas
            ref={canvasRef}
            className="rounded-lg shadow-2xl shadow-black/50 block"
            style={{ imageRendering: "auto" }}
          />
          <DrawingCanvas width={canvasSize.w} height={canvasSize.h} />
          {rendering && (
            <div className="absolute inset-0 flex items-center justify-center bg-space-black/50 rounded-lg">
              <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

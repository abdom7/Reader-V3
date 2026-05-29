"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CloudUpload,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink,
  Settings,
} from "lucide-react";
import { useNotesStore } from "@/lib/notesStore";
import { useReaderStore } from "@/lib/store";
import { NotionSettings } from "./NotionSettings";

export function NotionSyncButton({ variant = "full" }: { variant?: "full" | "compact" }) {
  const { notionConfig, notes, syncStatus, setSyncStatus, setLastSyncedAt, markNotesSynced } =
    useNotesStore();
  const { pdfFile, bookTitle, readingMode, timer, currentPage, totalPages } =
    useReaderStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [syncedUrl, setSyncedUrl] = useState<string | null>(null);

  const handleSync = async () => {
    if (
      !notionConfig.connected ||
      !notionConfig.token ||
      !notionConfig.booksDatabaseId ||
      !notionConfig.notesDatabaseId
    ) {
      setSettingsOpen(true);
      return;
    }

    setSyncStatus("syncing");
    setSyncedUrl(null);

    try {
      // Send all notes with content — API handles create vs update
      const notesToSync = notes.filter((n) => n.content.trim());

      const res = await fetch("/api/notion/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: notionConfig.token,
          booksDatabaseId: notionConfig.booksDatabaseId,
          notesDatabaseId: notionConfig.notesDatabaseId,
          session: {
            pdfName: pdfFile?.name || "Untitled PDF",
            bookTitle,
            readingMode,
            durationMinutes: timer.targetMinutes,
            elapsedSeconds: timer.elapsedSeconds,
            currentPage,
            totalPages,
            date: new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
          },
          notes: notesToSync.map((n) => ({
            id: n.id,
            page: n.page,
            content: n.content,
            noteType: n.noteType,
            createdAt: n.createdAt,
            updatedAt: n.updatedAt,
            notionPageId: n.notionPageId,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSyncStatus("synced");
        setLastSyncedAt(Date.now());
        setSyncedUrl(data.bookUrl || null);
        // Mark synced notes with their Notion page IDs
        if (data.syncedNoteIds) {
          markNotesSynced(data.syncedNoteIds);
        }
      } else {
        setSyncStatus("error");
      }
    } catch {
      setSyncStatus("error");
    }
  };

  if (variant === "compact") {
    return (
      <>
        <button
          onClick={handleSync}
          title={
            notionConfig.connected
              ? "Sync to Notion"
              : "Connect Notion"
          }
          className={`p-2 rounded-lg transition-colors ${
            syncStatus === "synced"
              ? "bg-green-500/20 text-green-400"
              : syncStatus === "syncing"
              ? "bg-gold-500/20 text-gold-400"
              : syncStatus === "error"
              ? "bg-red-500/20 text-red-400"
              : notionConfig.connected
              ? "hover:bg-white/5 text-white/60 hover:text-white"
              : "hover:bg-white/5 text-white/40 hover:text-white"
          }`}
        >
          {syncStatus === "syncing" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : syncStatus === "synced" ? (
            <Check className="w-4 h-4" />
          ) : syncStatus === "error" ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <CloudUpload className="w-4 h-4" />
          )}
        </button>
        <NotionSettings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <button
          onClick={handleSync}
          disabled={syncStatus === "syncing"}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
            syncStatus === "synced"
              ? "bg-green-500/15 border border-green-500/30 text-green-400"
              : syncStatus === "error"
              ? "bg-red-500/15 border border-red-500/30 text-red-400"
              : "bg-white/5 border border-space-border hover:border-gold-500/30 text-white/70 hover:text-gold-400"
          }`}
        >
          {syncStatus === "syncing" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Syncing to Notion...
            </>
          ) : syncStatus === "synced" ? (
            <>
              <Check className="w-4 h-4" />
              Synced to Notion
            </>
          ) : syncStatus === "error" ? (
            <>
              <AlertCircle className="w-4 h-4" />
              Sync Failed — Retry
            </>
          ) : notionConfig.connected ? (
            <>
              <CloudUpload className="w-4 h-4" />
              Sync to Notion
            </>
          ) : (
            <>
              <Settings className="w-4 h-4" />
              Connect Notion
            </>
          )}
        </button>

        {syncStatus === "synced" && syncedUrl && (
          <motion.a
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            href={syncedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs text-gold-400/60 hover:text-gold-400 transition-colors"
          >
            Open in Notion <ExternalLink className="w-3 h-3" />
          </motion.a>
        )}

        {!notionConfig.connected && (
          <p className="text-[10px] text-white/30 text-center">
            Connect your Notion workspace to save reading progress & notes
          </p>
        )}
      </div>

      <NotionSettings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}

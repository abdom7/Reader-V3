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
  const { pdfFile, bookTitle, bookGenre, readingMode, timer, currentPage, totalPages, uploadedPdfUrl, uploadedCoverUrl } =
    useReaderStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [syncedUrl, setSyncedUrl] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const openSettings = () => setSettingsOpen(true);

  const handleSync = async () => {
    setSyncError(null);
    if (
      !notionConfig.connected ||
      !notionConfig.booksDatabaseId ||
      !notionConfig.notesDatabaseId
    ) {
      openSettings();
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
          booksDatabaseId: notionConfig.booksDatabaseId,
          notesDatabaseId: notionConfig.notesDatabaseId,
          bookTemplateId: notionConfig.bookTemplateId,
          session: {
            pdfName: pdfFile?.name || "Untitled PDF",
            uploadedPdfUrl,
            uploadedCoverUrl,
            bookTitle,
            genre: bookGenre || undefined,
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
      if (res.ok && data.success) {
        setSyncStatus("synced");
        setLastSyncedAt(Date.now());
        setSyncedUrl(data.bookUrl || null);
        // Mark synced notes with their Notion page IDs
        if (data.syncedNoteIds) {
          markNotesSynced(data.syncedNoteIds);
        }
        setSyncError(null);
      } else {
        setSyncStatus("error");
        setSyncError(
          data?.error ||
            "Sync failed. Make sure the Infinity Reader integration has access to your Books and Notes databases."
        );
      }
    } catch (err) {
      setSyncStatus("error");
      setSyncError(
        err instanceof Error
          ? err.message
          : "Network error while syncing to Notion. Please try again."
      );
    }
  };

  if (variant === "compact") {
    return (
      <>
        <button
          onClick={handleSync}
          title={
            notionConfig.connected
              ? syncStatus === "error"
                ? syncError || "Sync failed"
                : "Sync to Notion"
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
        {notionConfig.connected && (
          <button
            onClick={openSettings}
            title="Manage Notion connection"
            className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
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

        {notionConfig.connected && (
          <button
            onClick={openSettings}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-space-border/60 text-xs text-white/50 hover:text-white hover:border-gold-500/40 transition-colors"
          >
            <Settings className="w-3 h-3" />
            Manage Notion Connection
          </button>
        )}

        {syncStatus === "error" && syncError && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {syncError}
            <span className="block mt-1 text-red-300/70">
              Tip: If you recently duplicated or converted your Notion databases, reconnect Infinity Reader so the new database IDs are saved, and ensure the integration has been shared with both databases.
            </span>
          </div>
        )}

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

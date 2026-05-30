"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Database, Check, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useNotesStore } from "@/lib/notesStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotionDb {
  id: string;
  name: string;
}

interface ListDatabasesResponse {
  success: boolean;
  databases?: NotionDb[];
  error?: string;
}

// ─── Notion Icon ──────────────────────────────────────────────────────────────

function NotionIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path
        d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z"
        fill="#fff"
      />
      <path
        d="M61.35 0.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723 0.967 5.053 3.3 8.167l12.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257 -3.89c5.433 -0.387 6.99 -2.917 6.99 -7.193V20.64c0 -2.21 -0.873 -2.847 -3.443 -4.733L74.167 3.143c-4.273 -3.107 -6.02 -3.5 -12.817 -2.917zM25.92 19.523c-5.247 0.353 -6.437 0.433 -9.417 -1.99L8.927 11.507c-0.77 -0.78 -0.383 -1.753 1.557 -1.947l53.193 -3.887c4.467 -0.39 6.793 1.167 8.54 2.527l9.123 6.61c0.39 0.197 1.36 1.36 0.193 1.36l-54.933 3.307 -0.68 0.047zM19.803 88.3V30.367c0 -2.53 0.777 -3.697 3.103 -3.893L86 22.78c2.14 -0.193 3.107 1.167 3.107 3.693v57.547c0 2.53 -0.39 4.67 -3.883 4.863l-60.377 3.5c-3.493 0.193 -5.043 -0.97 -5.043 -4.083z"
        fill="#000"
      />
    </svg>
  );
}

// ─── Database Selector ────────────────────────────────────────────────────────

function DbSelector({
  label,
  value,
  databases,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  databases: NotionDb[];
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-1.5">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none bg-space-black/60 border border-space-border rounded-xl px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:border-gold-500/50 transition-colors disabled:opacity-50 pr-8"
        >
          <option value="">— Select a database —</option>
          {databases.map((db) => (
            <option key={db.id} value={db.id}>
              {db.name}
            </option>
          ))}
        </select>
        <Database className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function NotionDatabasePicker({
  isOpen,
  onClose,
  onConnected,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
}) {
  const { setNotionConfig, notionConfig } = useNotesStore();
  const [mounted, setMounted] = useState(false);
  const [databases, setDatabases] = useState<NotionDb[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booksDbId, setBooksDbId] = useState(notionConfig.booksDatabaseId ?? "");
  const [notesDbId, setNotesDbId] = useState(notionConfig.notesDatabaseId ?? "");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-load databases when the modal opens
  useEffect(() => {
    if (isOpen && databases.length === 0) {
      loadDatabases();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const loadDatabases = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/notion/databases", {
        method: "GET",
      });
      const data: ListDatabasesResponse = await res.json();

      if (!data.success || !data.databases) {
        setError(data.error ?? "Failed to load databases from your workspace.");
        return;
      }

      setDatabases(data.databases);

      // Auto-select previously saved databases if they exist in the list
      if (notionConfig.booksDatabaseId) setBooksDbId(notionConfig.booksDatabaseId);
      if (notionConfig.notesDatabaseId) setNotesDbId(notionConfig.notesDatabaseId);
    } catch {
      setError("Network error while loading databases. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!booksDbId || !notesDbId) {
      setError("Please select both a Books and a Notes database.");
      return;
    }
    if (booksDbId === notesDbId) {
      setError("Books and Notes must be different databases.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      setNotionConfig({
        booksDatabaseId: booksDbId,
        notesDatabaseId: notesDbId,
        connected: true,
      });
      onConnected?.();
      onClose();
    } catch {
      setError("Failed to save database selection.");
    } finally {
      setSaving(false);
    }
  };

  const canSave = booksDbId && notesDbId && booksDbId !== notesDbId;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-space-deep/90 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel p-6 max-w-md w-full"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                  <NotionIcon />
                </div>
                <div>
                  <h3 className="text-base font-display font-medium text-white/90 tracking-wide">
                    Select Databases
                  </h3>
                  <p className="text-[10px] text-white/35 mt-0.5">
                    Choose which Notion databases to link
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                title="Close"
                className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Loading state */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="w-6 h-6 text-gold-400 animate-spin" />
                <p className="text-xs text-white/40">Loading your Notion databases…</p>
              </div>
            ) : databases.length > 0 ? (
              <div className="space-y-4">
                <DbSelector
                  label="Books Database"
                  value={booksDbId}
                  databases={databases}
                  onChange={setBooksDbId}
                />
                <DbSelector
                  label="Notes Database"
                  value={notesDbId}
                  databases={databases}
                  onChange={setNotesDbId}
                />

                <p className="text-[10px] text-white/30 leading-relaxed">
                  Select the databases where your book entries and reading notes will be stored.
                  They must be separate databases shared with the Infinity Reader integration.
                </p>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={loadDatabases}
                    disabled={loading}
                    title="Refresh database list"
                    className="p-2.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors border border-space-border"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!canSave || saving}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      canSave
                        ? "btn-primary"
                        : "bg-white/5 border border-space-border text-white/30 cursor-not-allowed"
                    }`}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Confirm Selection
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              // Empty state — failed to load or no databases found
              <div className="text-center py-6 space-y-4">
                <Database className="w-8 h-8 text-white/20 mx-auto" />
                <p className="text-xs text-white/40">
                  No databases found. Make sure the Infinity Reader integration has been shared
                  with your databases in Notion.
                </p>
                <button
                  onClick={loadDatabases}
                  className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg bg-white/5 border border-space-border text-xs text-white/60 hover:text-white hover:border-gold-500/40 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

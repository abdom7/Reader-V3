"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Unlink, Database } from "lucide-react";
import { useNotesStore } from "@/lib/notesStore";
import { NotionDatabasePicker } from "./NotionDatabasePicker";

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

export function NotionSettings({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { notionConfig, clearNotionConfig } = useNotesStore();
  const [mounted, setMounted] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOAuth = () => {
    setError(null);
    setWarning(null);
    window.location.href = "/api/notion/auth";
  };

  const handleDisconnect = async () => {
    setError(null);
    setWarning(null);
    setDisconnecting(true);

    let warningMessage: string | null = null;

    try {
      const res = await fetch("/api/notion/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        throw new Error(
          data?.error || data?.message || "Failed to revoke Notion access token"
        );
      }

      if (data?.warning) {
        warningMessage = data.warning;
      }

      clearNotionConfig();
      setWarning(warningMessage);
      if (!warningMessage) {
        onClose();
      }
      setError(null);
    } catch (err) {
      clearNotionConfig();
      setError(err instanceof Error ? err.message : "Failed to disconnect from Notion");
    } finally {
      setDisconnecting(false);
    }
  };

  if (!mounted) return null;

  return (
    <>
      {createPortal(
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
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-panel p-6 max-w-md w-full"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                      <NotionIcon />
                    </div>
                    <h3 className="text-base font-display font-medium text-white/90 tracking-wide">
                      Notion Integration
                    </h3>
                  </div>
                  <button
                    onClick={onClose}
                    title="Close"
                    className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400 mb-4">
                    {error}
                  </div>
                )}

                {warning && !error && (
                  <div className="rounded-lg border border-gold-500/40 bg-gold-500/10 px-3 py-2 text-xs text-gold-200 mb-4">
                    {warning}
                  </div>
                )}

                {notionConfig.connected ? (
                  <div className="space-y-3">
                    {/* Connection status */}
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                      <Check className="w-4 h-4 text-green-400" />
                      <div className="flex-1">
                        <span className="text-xs text-green-400 font-medium">
                          Connected to Notion
                        </span>
                        <p className="text-[10px] text-green-400/60 mt-0.5">
                          Books &amp; Notes databases linked
                        </p>
                      </div>
                      <button
                        onClick={handleDisconnect}
                        disabled={disconnecting}
                        title="Disconnect Notion"
                        className="text-[10px] text-white/40 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                      >
                        <Unlink className="w-3 h-3" />
                        {disconnecting ? "Disconnecting..." : "Disconnect"}
                      </button>
                    </div>

                    {/* Change databases */}
                    <button
                      onClick={() => setPickerOpen(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-space-border/60 text-xs text-white/50 hover:text-white hover:border-gold-500/40 transition-colors"
                    >
                      <Database className="w-3.5 h-3.5" />
                      Change Database Selection
                    </button>

                    <button
                      onClick={onClose}
                      className="w-full btn-primary text-sm py-2.5"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button
                      onClick={handleOAuth}
                      className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white text-black font-medium text-sm hover:bg-white/90 transition-colors"
                    >
                      <NotionIcon />
                      Connect with Notion
                    </button>

                    <p className="text-[10px] text-white/30 text-center">
                      Authorize Infinity Reader to access your Books &amp; Notes
                      databases
                    </p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Database picker — opens as a separate modal on top */}
      <NotionDatabasePicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConnected={() => setPickerOpen(false)}
      />
    </>
  );
}

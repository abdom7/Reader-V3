"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, AlertCircle } from "lucide-react";
import { useReaderStore } from "@/lib/store";
import { useNotesStore } from "@/lib/notesStore";
import { UploadScreen } from "@/components/UploadScreen";
import { LaunchSequence } from "@/components/LaunchSequence";
import { ReadingScreen } from "@/components/ReadingScreen";

const pageTransition = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.96 },
  transition: { duration: 0.4, ease: "easeInOut" },
};

function NotionToast({
  type,
  message,
  onDone,
}: {
  type: "success" | "error";
  message: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999]"
    >
      <div
        className={`flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-2xl shadow-2xl ${
          type === "success"
            ? "bg-green-500/10 border-green-500/30 text-green-400"
            : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}
      >
        {type === "success" ? (
          <Check className="w-4 h-4" />
        ) : (
          <AlertCircle className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { phase } = useReaderStore();
  const { setNotionConfig } = useNotesStore();
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Handle Notion OAuth callback params.
  // The token is stored server-side in an HttpOnly cookie by the callback route.
  // Only non-sensitive config (db IDs) arrives via URL params.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const booksDatabaseId = params.get("notion_books_db");
    const notesDatabaseId = params.get("notion_notes_db");
    const notionError = params.get("notion_error");
    const bookTemplateId = params.get("notion_book_template");

    if (notionError) {
      setToast({ type: "error", message: notionError });
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (booksDatabaseId && notesDatabaseId) {
      setNotionConfig({
        booksDatabaseId,
        notesDatabaseId,
        connected: true,
        ...(bookTemplateId ? { bookTemplateId } : {}),
      });
      setToast({
        type: "success",
        message: "Notion connected — Books & Notes databases linked!",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [setNotionConfig]);

  return (
    <main className="min-h-screen">
      {/* OAuth Toast */}
      <AnimatePresence>
        {toast && (
          <NotionToast
            type={toast.type}
            message={toast.message}
            onDone={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {(phase === "launch" || phase === "upload") && (
          <motion.div key="upload" {...pageTransition}>
            <UploadScreen />
          </motion.div>
        )}
        {phase === "countdown" && (
          <motion.div key="countdown" {...pageTransition}>
            <LaunchSequence />
          </motion.div>
        )}
        {phase === "reading" && (
          <motion.div key="reading" {...pageTransition}>
            <ReadingScreen />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

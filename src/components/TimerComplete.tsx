"use client";

import { motion } from "framer-motion";
import { Trophy, RotateCcw, BookOpen, StickyNote } from "lucide-react";
import { useReaderStore } from "@/lib/store";
import { useNotesStore } from "@/lib/notesStore";
import { NotionSyncButton } from "./NotionSync";

export function TimerComplete() {
  const { timer, resetTimer, startTimer, setTimerTarget } = useReaderStore();
  const { notes } = useNotesStore();

  const handleContinue = () => {
    resetTimer();
    startTimer();
  };

  const handleExtend = (minutes: number) => {
    setTimerTarget(minutes);
    resetTimer();
    startTimer();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-space-deep/95 backdrop-blur-xl flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="glass-panel p-8 max-w-md w-full mx-4 text-center"
      >
        {/* Achievement badge */}
        <motion.div
          initial={{ rotate: -10 }}
          animate={{ rotate: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gold-400 via-gold-500 to-nebula-purple flex items-center justify-center shadow-[0_0_40px_rgba(124,58,237,0.3),0_0_20px_rgba(212,160,23,0.4)]"
        >
          <Trophy className="w-10 h-10 text-space-black" />
        </motion.div>

        <h2 className="text-2xl font-brand font-medium gold-text mb-2 uppercase tracking-[0.2em]">
          Mission Complete
        </h2>
        <p className="text-white/70 mb-6 leading-relaxed">
          You&apos;ve read for {timer.targetMinutes} minutes. Outstanding focus,
          astronaut.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-space-black/50 border border-nebula-purple/20">
            <p className="text-gold-400 font-mono text-lg font-bold">
              {timer.targetMinutes}m
            </p>
            <p className="text-white/50 text-xs">Time Focused</p>
          </div>
          <div className="p-3 rounded-xl bg-space-black/50 border border-nebula-cyan/20">
            <p className="text-nebula-cyan font-mono text-lg font-bold">
              <BookOpen className="w-5 h-5 inline-block mr-1" />
              Deep
            </p>
            <p className="text-white/50 text-xs">Focus Level</p>
          </div>
          <div className="p-3 rounded-xl bg-space-black/50 border border-gold-500/20">
            <p className="text-gold-400 font-mono text-lg font-bold">
              <StickyNote className="w-4 h-4 inline-block mr-1" />
              {notes.length}
            </p>
            <p className="text-white/50 text-xs">Notes</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button onClick={handleContinue} className="btn-primary w-full">
            <RotateCcw className="w-4 h-4 inline-block mr-2" />
            Continue Reading ({timer.targetMinutes}m more)
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => handleExtend(15)}
              className="btn-ghost flex-1 text-sm"
            >
              +15m
            </button>
            <button
              onClick={() => handleExtend(30)}
              className="btn-ghost flex-1 text-sm"
            >
              +30m
            </button>
            <button
              onClick={() => handleExtend(60)}
              className="btn-ghost flex-1 text-sm"
            >
              +60m
            </button>
          </div>

          <div className="h-px bg-space-border/30 my-1" />

          {/* Notion Sync */}
          <NotionSyncButton variant="full" />
        </div>
      </motion.div>
    </motion.div>
  );
}

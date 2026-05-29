"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Sparkles } from "lucide-react";
import { useReaderStore } from "@/lib/store";
import { Starfield } from "./Starfield";

const COUNTDOWN_MESSAGES = [
  "Preparing your reading capsule...",
  "Eliminating distractions...",
  "Calibrating focus engines...",
  "Entering deep space...",
];

export function LaunchSequence() {
  const { setPhase, timer } = useReaderStore();
  const [countdown, setCountdown] = useState(5);
  const [messageIndex, setMessageIndex] = useState(0);
  const [warpActive, setWarpActive] = useState(false);

  useEffect(() => {
    if (countdown <= 0) {
      setWarpActive(true);
      setTimeout(() => {
        setPhase("reading");
      }, 1500);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
      setMessageIndex((prev) => Math.min(prev + 1, COUNTDOWN_MESSAGES.length - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown, setPhase]);

  return (
    <div className="fixed inset-0 bg-space-deep flex items-center justify-center overflow-hidden">
      <Starfield density={200} warpMode={warpActive} />

      {/* Vignette overlay - pulses during warp */}
      <div
        className={`fixed inset-0 pointer-events-none z-[1] transition-opacity duration-1000 ${
          warpActive ? "warp-vignette opacity-100" : "opacity-0"
        }`}
      />

      <AnimatePresence mode="wait">
        {!warpActive ? (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="relative z-10 text-center"
          >
            {/* Circular countdown ring */}
            <div className="relative w-48 h-48 mx-auto mb-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(212, 160, 23, 0.1)"
                  strokeWidth="2"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(212, 160, 23, 0.8)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ pathLength: 1 }}
                  animate={{ pathLength: countdown / 5 }}
                  transition={{ duration: 1, ease: "linear" }}
                  style={{
                    strokeDasharray: "283",
                    strokeDashoffset: "0",
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.span
                  key={countdown}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-6xl font-display font-bold gold-text"
                >
                  {countdown}
                </motion.span>
              </div>
            </div>

            {/* Status message */}
            <motion.p
              key={messageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-gold-400 font-light text-lg tracking-wide"
            >
              {COUNTDOWN_MESSAGES[messageIndex]}
            </motion.p>

            {/* Timer info */}
            <p className="mt-4 text-white/50 text-sm leading-relaxed">
              Mission duration: {timer.targetMinutes} minutes
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="warp"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 0.8, 1.1] }}
              transition={{ duration: 1, ease: "easeInOut" }}
            >
              <Rocket className="w-16 h-16 text-gold-400 mx-auto" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-gold-300 font-brand text-xl uppercase tracking-[0.25em]"
            >
              Entering Focus Space
            </motion.p>
            <Sparkles className="w-5 h-5 text-gold-500 mx-auto mt-2 animate-pulse-slow" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

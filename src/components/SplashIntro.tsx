import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Zap, Command } from "lucide-react";
import { useAppStore } from "../store";

interface SplashIntroProps {
  onComplete: () => void;
}

export function SplashIntro({ onComplete }: SplashIntroProps) {
  const { theme, animationsEnabled } = useAppStore();

  useEffect(() => {
    if (!animationsEnabled) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      onComplete();
    }, 3500); // Intro lasts 3.5 seconds
    
    return () => clearTimeout(timer);
  }, [onComplete, animationsEnabled]);

  if (!animationsEnabled) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-bg overflow-hidden"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* Background pulsing grid or lines could go here */}
        <div className="absolute inset-0 bg-line opacity-20 bg-[radial-gradient(var(--theme-ink)_1px,transparent_1px)] [background-size:20px_20px]" />
        
        <div className="relative z-10 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
            className="w-16 h-16 md:w-20 md:h-20 bg-ink text-bg flex items-center justify-center rounded-2xl shadow-[6px_6px_0px_var(--theme-highlight)] border-2 border-transparent mb-8"
          >
            <span className="text-3xl md:text-4xl font-extrabold tracking-tighter">PH</span>
          </motion.div>
          <motion.div className="flex space-x-2 mb-2">
            {["P", "E", "R", "S", "O", "N", "A", "L"].map((letter, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.1, type: "spring" }}
                className="text-3xl md:text-5xl font-extrabold uppercase tracking-tighter text-ink"
              >
                {letter}
              </motion.span>
            ))}
          </motion.div>

          <motion.div className="flex space-x-2">
            {["H", "U", "B"].map((letter, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.3 + i * 0.1, type: "spring" }}
                className="text-4xl md:text-6xl font-extrabold uppercase tracking-tighter text-highlight"
              >
                {letter}
              </motion.span>
            ))}
          </motion.div>

          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: 100 }}
            transition={{ duration: 0.8, delay: 2, ease: "easeInOut" }}
            className="h-1 bg-ink mt-8 rounded-full"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 2.5 }}
            className="mt-6 text-xs md:text-sm font-bold uppercase tracking-widest text-sub flex items-center gap-2"
          >
            <Zap className="w-4 h-4 text-ink" /> Initializing Core Systems...
          </motion.p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

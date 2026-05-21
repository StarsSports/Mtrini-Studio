import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Brain, Cpu, Sparkles, Terminal, Code, Settings, Database, Eye } from 'lucide-react';
import { ThemeColors } from '../types';

interface StreamingThinkingIndicatorProps {
  themeColors: ThemeColors;
}

const THINKING_STEPS = [
  { text: 'Awaiting prompt formulation...', icon: Terminal },
  { text: 'Parsing query intent & structural assets...', icon: Database },
  { text: 'Synthesizing layout components & functions...', icon: Code },
  { text: 'Refinement of styling and UX properties...', icon: Sparkles },
  { text: 'Compiling secure runtime environment...', icon: Cpu },
  { text: 'Executing test passes on interactive sandbox...', icon: Eye },
];

export default function StreamingThinkingIndicator({ themeColors }: StreamingThinkingIndicatorProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Cycle every 1.5 seconds through the compiler stages during streaming
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % THINKING_STEPS.length);
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  const ActiveStepIcon = THINKING_STEPS[stepIndex].icon;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col items-start max-w-3xl mx-auto w-full px-2"
    >
      {/* Human-designed meta tag */}
      <div className="flex items-center gap-2 mb-1.5 text-[10px] text-neutral-400 font-sans px-1 select-none">
        <span className="font-bold text-neutral-500">Mtrini Compiler</span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Refactoring Live State
        </span>
      </div>

      {/* Handcrafted AI-Indicator Board */}
      <div className="w-full bg-white border border-[#E6DCD0] rounded-xl p-4 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Core Mind details */}
        <div className="flex items-center gap-3.5">
          {/* Animated Glowing Mind Orb */}
          <div className="relative flex items-center justify-center">
            {/* Pulsing ring background */}
            <div className={`absolute inset-0 rounded-xl ${themeColors.bg} border ${themeColors.border} animate-ping opacity-25 scale-120`} />
            
            <div className={`p-2.5 rounded-xl ${themeColors.bg} border ${themeColors.border} flex items-center justify-center shadow-xs transition-colors duration-300 relative`}>
              <ActiveStepIcon className={`w-4 h-4 ${themeColors.text} transition-all duration-300`} />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block leading-none select-none">
              Cognitive Pipeline
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-800 tracking-tight transition-all duration-300">
                {THINKING_STEPS[stepIndex].text}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Micro-Progress Activity */}
        <div className="flex items-center gap-3">
          {/* Bouncing Triple-Dots */}
          <div className="flex gap-1 py-1.5 px-3 bg-neutral-50 border border-neutral-100 rounded-lg shadow-inner select-none">
            <div className={`w-1.5 h-1.5 rounded-full ${themeColors.text} bg-current animate-bounce shrink-0`} style={{ animationDelay: '0ms' }} />
            <div className={`w-1.5 h-1.5 rounded-full ${themeColors.text} bg-current animate-bounce shrink-0`} style={{ animationDelay: '150ms' }} />
            <div className={`w-1.5 h-1.5 rounded-full ${themeColors.text} bg-current animate-bounce shrink-0`} style={{ animationDelay: '300ms' }} />
          </div>

          <div className="h-4 w-[1px] bg-neutral-200 hidden md:block" />

          {/* Activity State Badge */}
          <span className={`text-[9px] uppercase font-mono font-bold ${themeColors.bg} ${themeColors.text} tracking-wider px-2 py-1 rounded border ${themeColors.border} select-none`}>
            compiling_
          </span>
        </div>
      </div>
    </motion.div>
  );
}

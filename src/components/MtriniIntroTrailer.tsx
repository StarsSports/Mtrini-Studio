import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Sparkles, Monitor, Film, X, Check, Paintbrush, Sliders } from 'lucide-react';

interface MtriniIntroTrailerProps {
  onClose?: () => void;
}

const STEPS = [
  { id: 'imagine', text: 'Imagine' },
  { id: 'ask', text: 'Ask' },
  { id: 'build', text: 'Build' },
  { id: 'mtrini', text: 'Mtrini' }
];

type ThemeID = 'minimal-white' | 'midnight-slate' | 'moroccan-emerald' | 'royal-amber' | 'crimson-ruby';

interface ThemeConfig {
  id: ThemeID;
  name: string;
  dotColor: string;
  stageBg: string; // Tailwind class
  textPrimary: string;
  textStudio: string;
  sparkleColor: string;
  sparkleBg: string;
  sparkleBorder: string;
  timelineBg: string;
  timelineActive: string;
  accentCircle: string;
}

const THEMES: ThemeConfig[] = [
  {
    id: 'minimal-white',
    name: 'Minimalist White',
    dotColor: 'bg-white border border-neutral-300',
    stageBg: 'bg-white',
    textPrimary: 'text-neutral-900',
    textStudio: 'text-amber-700',
    sparkleColor: 'text-amber-700',
    sparkleBg: 'bg-amber-50',
    sparkleBorder: 'border-amber-200',
    timelineBg: 'bg-neutral-600',
    timelineActive: 'bg-amber-700',
    accentCircle: 'bg-amber-100/10'
  },
  {
    id: 'midnight-slate',
    name: 'Midnight Slate',
    dotColor: 'bg-[#18181B] border border-neutral-700',
    stageBg: 'bg-[#09090B]',
    textPrimary: 'text-neutral-100',
    textStudio: 'text-amber-400',
    sparkleColor: 'text-amber-400',
    sparkleBg: 'bg-amber-950/40',
    sparkleBorder: 'border-amber-700/60',
    timelineBg: 'bg-neutral-400',
    timelineActive: 'bg-amber-500',
    accentCircle: 'bg-amber-500/5'
  },
  {
    id: 'moroccan-emerald',
    name: 'Moroccan Emerald',
    dotColor: 'bg-emerald-700 border border-emerald-900',
    stageBg: 'bg-[#FAFDFB]',
    textPrimary: 'text-emerald-950',
    textStudio: 'text-emerald-700',
    sparkleColor: 'text-emerald-700',
    sparkleBg: 'bg-emerald-50',
    sparkleBorder: 'border-emerald-200',
    timelineBg: 'bg-emerald-800',
    timelineActive: 'bg-emerald-600',
    accentCircle: 'bg-emerald-500/5'
  },
  {
    id: 'royal-amber',
    name: 'Royal Amber',
    dotColor: 'bg-amber-600 border border-amber-800',
    stageBg: 'bg-[#FFFDF9]',
    textPrimary: 'text-amber-950',
    textStudio: 'text-amber-700',
    sparkleColor: 'text-amber-700',
    sparkleBg: 'bg-amber-100/50',
    sparkleBorder: 'border-amber-350',
    timelineBg: 'bg-amber-900',
    timelineActive: 'bg-amber-700',
    accentCircle: 'bg-amber-600/10'
  },
  {
    id: 'crimson-ruby',
    name: 'Crimson Ruby',
    dotColor: 'bg-rose-700 border border-rose-900',
    stageBg: 'bg-[#FFF9FA]',
    textPrimary: 'text-neutral-900',
    textStudio: 'text-rose-700',
    sparkleColor: 'text-rose-600',
    sparkleBg: 'bg-rose-50',
    sparkleBorder: 'border-rose-100',
    timelineBg: 'bg-neutral-600',
    timelineActive: 'bg-rose-700',
    accentCircle: 'bg-rose-500/5'
  }
];

export default function MtriniIntroTrailer({ onClose }: MtriniIntroTrailerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [showStudio, setShowStudio] = useState(false);
  const [activeTheme, setActiveTheme] = useState<ThemeID>('minimal-white');

  useEffect(() => {
    if (!isPlaying) return;

    // Reset layout states
    setStepIndex(0);
    setShowStudio(false);

    const timers: NodeJS.Timeout[] = [];

    // 'Imagine' -> 'Ask': 1600ms
    timers.push(setTimeout(() => {
      setStepIndex(1);
    }, 1600));

    // 'Ask' -> 'Build': 3200ms
    timers.push(setTimeout(() => {
      setStepIndex(2);
    }, 3200));

    // 'Build' -> 'Mtrini': 4800ms
    timers.push(setTimeout(() => {
      setStepIndex(3);
    }, 4800));

    // Append 'Studio' next to Mtrini: 6000ms
    timers.push(setTimeout(() => {
      setShowStudio(true);
    }, 6000));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isPlaying]);

  const handleRestart = () => {
    setIsPlaying(false);
    setTimeout(() => {
      setIsPlaying(true);
    }, 100);
  };

  const currentTheme = THEMES.find((t) => t.id === activeTheme) || THEMES[0];

  return (
    <div className="flex flex-col h-full bg-white select-none">
      
      {/* Cinematic Header Bar */}
      <div className="h-12 border-b border-[#E6DCD0] bg-[#FAF8F5] px-4 flex items-center justify-between select-none shrink-0 z-20">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-amber-700" />
          <span className="text-xs font-bold tracking-tight text-neutral-800 uppercase">
            Mtrini Trailer Simulator
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-neutral-50 border border-[#DEC9B3] text-neutral-700 text-[10px] font-bold rounded-lg transition-all cursor-pointer shadow-3xs"
            title="Replay sequence"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Replay Sequence</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Director Dashboard Split */}
      <div className="flex-1 flex flex-col md:flex-row bg-[#FAF8F5] min-h-0 overflow-hidden">
        
        {/* Left Side Controller Area: Themes Selectors & Tempo control */}
        <div className="w-full md:w-64 border-r border-[#E6DCD0] bg-white p-4 flex flex-col gap-4 select-text">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
            <Sliders className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-xs font-bold text-neutral-700 uppercase tracking-tight">
              Director Settings
            </span>
          </div>

          {/* Theme Selection Section */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
              Cinematic Backdrop Theme
            </span>
            <div className="flex flex-col gap-1.5">
              {THEMES.map((theme) => {
                const isSelected = activeTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      setActiveTheme(theme.id);
                      handleRestart();
                    }}
                    className={`flex items-center justify-between p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-700 bg-amber-50/40 font-semibold text-neutral-800'
                        : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-3.5 h-3.5 rounded-full ${theme.dotColor} shrink-0`} />
                      <span className="text-xs font-medium">{theme.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-750" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-auto bg-[#FFFBF4] border border-[#F5EAD4] p-3 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wide text-amber-800 block mb-1">
              Rendering Style
            </span>
            <p className="text-[10.5px] text-neutral-600 leading-normal">
              Changing the theme adjusts the background, typography colors, and light spark effects without altering or disrupting the kinetic alignment of the words inside the prompt video stage.
            </p>
          </div>
        </div>

        {/* Right Side Video/Trailer Canvas Area */}
        <div className={`flex-1 ${currentTheme.stageBg} relative flex items-center justify-center overflow-hidden transition-colors duration-500`}>
          
          {/* Ambient subtle pattern on stage */}
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-35" />

          {/* Glowing backdrops for rich themes */}
          <div className={`absolute top-1/4 left-1/4 w-80 h-80 rounded-full filter blur-[100px] opacity-10 ${currentTheme.accentCircle}`} />

          <div className="relative z-10 text-center flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {isPlaying && (
                <motion.div 
                  key={stepIndex}
                  initial={{ opacity: 0, y: 35 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -35 }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center justify-center gap-3"
                >
                  {/* Active Dynamic Text */}
                  <h1 className={`text-4xl sm:text-5xl md:text-7xl font-sans font-extrabold tracking-tighter ${currentTheme.textPrimary} leading-none`}>
                    {STEPS[stepIndex].text}
                  </h1>

                  {/* Studio Slide Reveal next to Mtrini */}
                  {STEPS[stepIndex].id === 'mtrini' && (
                    <AnimatePresence>
                      {showStudio && (
                        <motion.div
                          initial={{ opacity: 0, x: -25, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                          className="flex items-center gap-2"
                        >
                          <span className={`text-4xl sm:text-5xl md:text-7xl font-sans font-extrabold tracking-tighter ${currentTheme.textStudio} leading-none`}>
                            Studio
                          </span>
                          
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                            className={`p-1.5 md:p-2 ${currentTheme.sparkleBg} rounded-xl border ${currentTheme.sparkleBorder} ml-1.5 flex items-center justify-center`}
                          >
                            <Sparkles className={`w-5 h-5 ${currentTheme.sparkleColor} animate-pulse`} />
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dynamic Timeline Bar of the Stage */}
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between z-10 bg-white/90 backdrop-blur-xs py-2 px-4 border border-[#E6DCD0] rounded-xl self-center max-w-md mx-auto shadow-3xs">
            <div className="flex gap-2 items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-semibold">
                Veo Sequence Timeline
              </span>
            </div>
            <div className="flex gap-1.5 select-none items-center">
              {STEPS.map((s, idx) => {
                const isActive = stepIndex === idx;
                const isPast = stepIndex > idx;
                return (
                  <div 
                    key={s.id} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isActive 
                        ? `w-6 ${currentTheme.timelineActive}` 
                        : isPast 
                          ? `w-2 ${currentTheme.timelineBg}` 
                          : 'w-2 bg-neutral-200'
                    }`} 
                  />
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Specs Panel Footer */}
      <div className="p-4 bg-[#FAF8F5] border-t border-[#E6DCD0] text-xs leading-relaxed text-neutral-600 space-y-2 select-text z-20">
        <h4 className="font-bold text-neutral-800 flex items-center gap-1.5">
          <Monitor className="w-3.5 h-3.5 text-neutral-500" />
          <span>Cinematic Specifications</span>
        </h4>
        <p className="text-[11px] text-neutral-500">
          A minimalist visual workflow optimized to simulate sequence triggers. To replay, click the header simulation trigger anytime.
        </p>
      </div>

    </div>
  );
}

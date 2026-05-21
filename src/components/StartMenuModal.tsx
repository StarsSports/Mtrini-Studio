import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Palette, Sparkles, User, ArrowRight, Play, BookOpen, Layers, Terminal, Clock, Shield, Star, Cpu, Zap, Sliders
} from 'lucide-react';
import { UserProfile, ThemeColors } from '../types';

interface StartMenuModalProps {
  onClose: () => void;
  userProfile: UserProfile | null;
  onUpdatePreferences: (updates: Partial<UserProfile>) => void;
  onSendMessage: (prompt: string) => void;
  themeColors: ThemeColors;
}

type OnboardingTab = 'welcome' | 'theme' | 'presets';

export default function StartMenuModal({
  onClose,
  userProfile,
  onUpdatePreferences,
  onSendMessage,
  themeColors
}: StartMenuModalProps) {
  const [activeTab, setActiveTab] = useState<OnboardingTab>('welcome');
  const [tempName, setTempName] = useState(userProfile?.displayName || 'Guest User');

  const personaOptions = [
    { 
      value: 'cyan' as const, 
      label: 'System Compiler', 
      desc: 'Balanced, high-speed, raw technical compiling.', 
      icon: Cpu,
      color: 'text-cyan-600',
      borderColor: 'border-cyan-200',
      bgColor: 'bg-cyan-50/50'
    },
    { 
      value: 'emerald' as const, 
      label: 'Secure Sentry', 
      desc: 'Robust try-catches, schema checking & rigid type validations.', 
      icon: Shield,
      color: 'text-emerald-600',
      borderColor: 'border-emerald-200',
      bgColor: 'bg-emerald-50/50'
    },
    { 
      value: 'crimson' as const, 
      label: 'Performance Hacker', 
      desc: 'Ultra-fast, micro-optimized, lightweight low-overhead files.', 
      icon: Zap,
      color: 'text-rose-600',
      borderColor: 'border-rose-200',
      bgColor: 'bg-rose-50/50'
    },
    { 
      value: 'amber' as const, 
      label: 'Software Architect', 
      desc: 'Decoupled modules, clean JSDocs, OOP & SOLID patterns.', 
      icon: Sliders,
      color: 'text-amber-700',
      borderColor: 'border-amber-200',
      bgColor: 'bg-amber-50/50'
    },
    { 
      value: 'violet' as const, 
      label: 'UX Craftsman', 
      desc: 'Beautiful interactive styling layout rhythms & micro-states.', 
      icon: Palette,
      color: 'text-violet-600',
      borderColor: 'border-violet-200',
      bgColor: 'bg-violet-50/50'
    },
  ];


  const presets = [
    {
      id: 'dash',
      title: 'Real-Time Stock Tracker',
      desc: 'Generates an interactive widget simulating stock performance data with real-time state triggers.',
      prompt: 'Build an interactive real-time Stock Performance Tracker. Include mock stock symbols, auto-updating line charts using Canvas, a search bar, buy/sell feedback indicators, and dynamic filter controls.'
    },
    {
      id: 'physics',
      title: 'Canvas Physics Arcade',
      desc: 'Creates an educational engine featuring gravity sliders and interactive particle collision systems.',
      prompt: 'Create an interactive Canvas Physics Sandbox. Include a bounce physics controller, sliders to modify gravity, wind, and particle size, a click-to-add particle emitter, and toggle buttons to show collision vectors.'
    },
    {
      id: 'stats',
      title: 'Metrics & Analytics Board',
      desc: 'Compiles clean data analytics grids featuring fully-animated KPI cards, mock activity logs, and table search.',
      prompt: 'Create an elegantly designed Metrics & Analytics dashboard containing responsive KPI cards with sparkline displays, a searchable user signups table, and export statistics controls.'
    },
    {
      id: 'notes',
      title: 'Markdown Notebook Suite',
      desc: 'Deploys a personal notebook featuring custom tags, instant category folders, and text search.',
      prompt: 'Build a fully-functional Client-Side Markdown Notebook. Contain folders in a left internal grid, auto-saving page edits, markdown headers, and filtering systems based on dynamic labels.'
    }
  ];

  const handleApplyName = () => {
    if (tempName.trim()) {
      onUpdatePreferences({ displayName: tempName.trim() });
    }
  };

  const handleSelectTheme = (theme: 'cyan' | 'emerald' | 'crimson' | 'amber' | 'violet') => {
    onUpdatePreferences({ themeColor: theme });
  };

  const handleLaunchPreset = (prompt: string) => {
    onSendMessage(prompt);
    localStorage.setItem('mtrini_onboarded', 'true');
    onClose();
  };

  const handleCompleteOnboarding = () => {
    localStorage.setItem('mtrini_onboarded', 'true');
    onClose();
  };

  // Define tab animation variants
  const tabVariants = {
    initial: { opacity: 0, x: 12 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' } },
    exit: { opacity: 0, x: -12, transition: { duration: 0.15, ease: 'easeIn' } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 bg-neutral-900/40 backdrop-blur-3xs z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="bg-[#FAF8F5] border border-neutral-200 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[85vh] font-sans"
        id="start-menu-modal"
      >
        {/* Banner header with earth/clay tone context */}
        <div className="p-5 border-b border-[#E6DCD0] bg-[#F2EDE4] flex items-center justify-between select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-700/10 border border-orange-700/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-orange-700" />
            </div>
            <div>
              <h3 className="font-sans font-extrabold text-neutral-900 text-sm tracking-tight leading-tight">Welcome to Mtrini Studio</h3>
              <p className="text-[10px] text-neutral-500 font-medium">Quick-start workspace companion guide</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-neutral-200/60 rounded-lg transition-colors cursor-pointer text-neutral-400 hover:text-neutral-700"
            id="close-start-menu-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation buttons */}
        <div className="flex border-b border-[#E6DCD0] px-4 py-1.5 bg-[#FAF8F5]/80 backdrop-blur-md select-none text-xs font-bold font-sans">
          <button
            onClick={() => setActiveTab('welcome')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'welcome' 
                ? 'bg-[#EAE4D9] text-neutral-900' 
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            1. Platform Tour
          </button>
          <button
            onClick={() => setActiveTab('theme')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'theme' 
                ? 'bg-[#EAE4D9] text-neutral-900' 
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            2. Personalize Settings
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'presets' 
                ? 'bg-[#EAE4D9] text-neutral-900' 
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            3. Starter Presets
          </button>
        </div>

        {/* Content Panel space */}
        <div className="flex-1 p-6 overflow-y-auto min-h-[340px] max-h-[500px] bg-[#FAF8F5] custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'welcome' && (
              <motion.div
                key="welcome-tab"
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4 text-xs select-none"
              >
                <div className="space-y-1.5 mb-1">
                  <h4 className="font-bold text-neutral-900 text-sm leading-tight">Interactive sandbox on-demand</h4>
                  <p className="text-neutral-500 leading-relaxed font-medium">
                    Mtrini is a reactive web compiler with an integrated AI agent. It allows you to model, script, compile, and run code logic directly outside the constraints of traditional command-line setups.
                  </p>
                </div>

                {/* Features List grids */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-white border border-[#E6DCD0] rounded-xl space-y-1.5 shadow-3xs">
                    <div className="flex items-center gap-1.5 text-neutral-800 font-bold">
                      <Terminal className="w-4 h-4 text-orange-700" />
                      <span>Thinking Process</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 leading-normal">
                      Examine the exact diagnostic chain of thought. You can observe calculations and model reasonings live.
                    </p>
                  </div>

                  <div className="p-3 bg-white border border-[#E6DCD0] rounded-xl space-y-1.5 shadow-3xs">
                    <div className="flex items-center gap-1.5 text-neutral-800 font-bold">
                      <Layers className="w-4 h-4 text-[#A16207]" />
                      <span>Sandbox Widgets</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 leading-normal">
                      Every generated graphic, game, component, or data visualizer automatically compiles into a responsive full-screen artifact.
                    </p>
                  </div>

                  <div className="p-3 bg-white border border-[#E6DCD0] rounded-xl space-y-1.5 shadow-3xs">
                    <div className="flex items-center gap-1.5 text-neutral-800 font-bold">
                      <BookOpen className="w-4 h-4 text-emerald-700" />
                      <span>Persistent Session logs</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 leading-normal">
                      Conversations are synchronized and stored in isolated compartments, preserving your progress across sandbox instances.
                    </p>
                  </div>

                  <div className="p-3 bg-white border border-[#E6DCD0] rounded-xl space-y-1.5 shadow-3xs">
                    <div className="flex items-center gap-1.5 text-neutral-800 font-bold">
                      <Clock className="w-4 h-4 text-indigo-700" />
                      <span>Desktop Mode</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 leading-normal">
                      Optionally host execution environments outside the browser with standalone clients for Windows & Mac.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center bg-[#F2EDE4]/40 p-3 rounded-lg border border-[#E6DCD0]">
                  <span className="text-[10px] text-neutral-500 font-bold flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-neutral-500" /> Secure Developer Sandbox
                  </span>
                  <button
                    onClick={() => setActiveTab('theme')}
                    className={`flex items-center gap-1 py-1 px-3 ${themeColors.primary} rounded-lg transition-all font-bold text-[11px] cursor-pointer`}
                  >
                    Set Profile <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'theme' && (
              <motion.div
                key="theme-tab"
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-5 text-xs text-sans"
              >
                {/* Profile Display Name */}
                <div className="space-y-1.5 p-4 bg-white border border-[#E6DCD0] rounded-xl shadow-3xs">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono block">1. Configure Nickname</span>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        placeholder="Enter nickname..."
                        className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-neutral-200 rounded-lg text-xs font-bold text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-orange-600 transition-all font-sans"
                      />
                    </div>
                    <button
                      onClick={handleApplyName}
                      className={`px-3 ${themeColors.primary} transition-all rounded-lg font-bold text-[11px]`}
                    >
                      Save Name
                    </button>
                  </div>
                </div>

                {/* Coding Persona Selection */}
                <div className="space-y-2 p-4 bg-white border border-[#E6DCD0] rounded-xl shadow-3xs">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono block">2. Select AI Assistant Compiler Persona</span>
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                    {personaOptions.map((opt) => {
                      const OptIcon = opt.icon;
                      const isActive = userProfile?.themeColor === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleSelectTheme(opt.value)}
                          className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isActive
                              ? `${opt.bgColor} ${opt.borderColor} shadow-3xs`
                              : 'border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50/50 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg border shrink-0 flex items-center justify-center ${
                              isActive ? `${opt.bgColor} ${opt.borderColor} ${opt.color}` : 'bg-neutral-50 border-neutral-100 text-neutral-400'
                            }`}>
                              <OptIcon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-neutral-800 text-[11px] font-sans flex items-center gap-1.5">
                                {opt.label}
                                {isActive && (
                                  <span className="text-[7px] px-1 py-0.2 rounded font-mono uppercase bg-neutral-900 text-white font-black">
                                    Active Mind
                                  </span>
                                )}
                              </span>
                              <span className="text-[9.5px] text-neutral-500 leading-tight">{opt.desc}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setActiveTab('presets')}
                    className={`flex items-center gap-1 py-1.5 px-4 ${themeColors.primary} rounded-lg transition-all font-bold text-[11px] cursor-pointer`}
                  >
                    View Starter Projects <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'presets' && (
              <motion.div
                key="presets-tab"
                variants={tabVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4"
              >
                <div className="space-y-1 text-xs select-none">
                  <h4 className="font-bold text-neutral-900 text-sm leading-tight">3. Compile Starter Presets</h4>
                  <p className="text-neutral-500 leading-relaxed font-medium">
                    Click any model starter below to instruct Mtrini to generate and compile a brand-new live reactive application instantly.
                  </p>
                </div>

                {/* Preset List cards */}
                <div className="space-y-2">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleLaunchPreset(preset.prompt)}
                      className="w-full text-left p-3.5 bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl transition-all shadow-3xs cursor-pointer flex items-center justify-between gap-4 group"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold text-neutral-900 text-[11.5px] font-sans group-hover:${themeColors.text} transition-colors`}>{preset.title}</span>
                          <span className="text-[8px] bg-neutral-100 text-neutral-500 font-bold uppercase tracking-wider px-1 rounded">Preset</span>
                        </div>
                        <p className="text-[10px] text-neutral-500 leading-normal">{preset.desc}</p>
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-neutral-50 border border-neutral-150/60 flex items-center justify-center group-hover:bg-neutral-100 transition-colors shrink-0">
                        <Play className={`w-3 h-3 ${themeColors.text} fill-current group-hover:scale-105 transition-transform`} />
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex justify-between items-center select-none">
                  <span className="text-[10px] text-neutral-400 font-medium">
                    You can always re-trigger this guide from the control menus
                  </span>
                  <button
                    onClick={handleCompleteOnboarding}
                    className={`py-1.5 px-4 ${themeColors.primary} rounded-lg transition-all font-bold text-[11px] cursor-pointer`}
                  >
                    Go to Workspace
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

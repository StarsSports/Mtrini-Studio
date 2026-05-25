import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, User, FileText, ArrowRight, Palette, Cpu, Shield, Zap, Sliders
} from 'lucide-react';
import { UserProfile, ThemeColors } from '../types';

interface StartMenuModalProps {
  onClose: () => void;
  userProfile: UserProfile | null;
  onUpdatePreferences: (updates: Partial<UserProfile>) => void;
  onSendMessage: (prompt: string) => void;
  themeColors: ThemeColors;
}

export default function StartMenuModal({
  onClose,
  userProfile,
  onUpdatePreferences,
  themeColors
}: StartMenuModalProps) {
  const [preferredName, setPreferredName] = useState(userProfile?.preferredName || userProfile?.displayName || '');
  const [aboutMe, setAboutMe] = useState(userProfile?.aboutMe || '');
  const [selectedTheme, setSelectedTheme] = useState<'cyan' | 'emerald' | 'crimson' | 'amber' | 'violet'>(userProfile?.themeColor || 'cyan');
  const [step, setStep] = useState(1);

  const themeOptions = [
    { value: 'cyan' as const, label: 'Cyan', desc: 'Raw system compiler', color: 'bg-cyan-500' },
    { value: 'emerald' as const, label: 'Emerald', desc: 'Defensive sentry', color: 'bg-emerald-500' },
    { value: 'crimson' as const, label: 'Crimson', desc: 'Performance Hacker', color: 'bg-rose-500' },
    { value: 'amber' as const, label: 'Amber', desc: 'Modular Architect', color: 'bg-amber-500' },
    { value: 'violet' as const, label: 'Violet', desc: 'UX Craftsman', color: 'bg-violet-500' },
  ];

  const handleFinishSetup = () => {
    onUpdatePreferences({
      displayName: preferredName.trim() || userProfile?.displayName || 'User Node',
      preferredName: preferredName.trim(),
      aboutMe: aboutMe.trim(),
      themeColor: selectedTheme,
      setupCompleted: true
    });
    localStorage.setItem('mtrini_onboarded', 'true');
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 bg-[#070708]/85 backdrop-blur-md z-50 flex items-center justify-center p-4 selection:bg-neutral-800 selection:text-white"
    >
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 15, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 180 }}
        className="bg-[#0c0c0e] border border-neutral-850 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh] font-sans text-neutral-200"
        id="start-menu-modal"
      >
        {/* Decorative dynamic neon glow top border */}
        <div className={`h-[3px] w-full bg-gradient-to-r from-cyan-500 via-rose-500 to-violet-500`} />

        <div className="p-6 border-b border-neutral-900 bg-neutral-950/40 flex items-center justify-between select-none">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center animate-pulse">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-sans font-extrabold text-white text-base tracking-tight leading-tight">Mtrini setup</h3>
              <p className="text-[10px] text-neutral-450 font-mono uppercase tracking-wider">Configure your personalized intelligence node</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-neutral-950/10 custom-scrollbar">
          {step === 1 ? (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <h4 className="font-bold text-white text-sm">Let's prepare your workspace</h4>
                <p className="text-neutral-450 text-[11.5px] leading-relaxed">
                  Tell Mtrini how to align answers to your project needs. These settings can be updated anytime from your settings workspace drawer.
                </p>
              </div>

              {/* What should Mtrini call you? */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-widest block flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-neutral-400" />
                  What should Mtrini call you?
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={preferredName}
                    onChange={(e) => setPreferredName(e.target.value)}
                    placeholder="Enter your preferred name..."
                    className="w-full bg-neutral-900 border border-neutral-850 rounded-xl p-3 pl-4 text-xs font-semibold text-white focus:outline-none focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 transition-all font-sans"
                    id="setup-preferred-name"
                  />
                </div>
              </div>

              {/* What should Mtrini know about you? */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-300 uppercase tracking-widest block flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-neutral-400" />
                  What should Mtrini know about you?
                </label>
                <textarea
                  value={aboutMe}
                  onChange={(e) => setAboutMe(e.target.value)}
                  placeholder="e.g. 'I am a computer science student building React apps.' or 'I prefer concise answers with clear modular files and standard TypeScript.'"
                  rows={4}
                  className="w-full bg-neutral-900 border border-neutral-850 rounded-xl p-3 text-xs leading-relaxed text-white focus:outline-none focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 transition-all font-sans resize-none"
                  id="setup-about-me"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!preferredName.trim()}
                  className="flex items-center gap-2 py-2.5 px-5 bg-white text-neutral-950 hover:bg-neutral-200 disabled:opacity-40 disabled:hover:bg-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <span>Select Color Accent</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="space-y-1.5">
                <h4 className="font-bold text-white text-sm">Select Color Preset</h4>
                <p className="text-neutral-450 text-[11.5px] leading-relaxed">
                  Choose a color palette accent that fits your style.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {themeOptions.map((opt) => {
                  const isSelected = selectedTheme === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedTheme(opt.value)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected 
                          ? 'bg-neutral-900 border-neutral-750 shadow-sm' 
                          : 'bg-neutral-950 border-neutral-900 hover:border-neutral-800'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${opt.color}`} />
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-white text-xs block">{opt.label}</span>
                        <span className="text-[10px] text-neutral-450 block">{opt.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  onClick={() => setStep(1)}
                  className="py-2.5 px-4 bg-transparent border border-neutral-850 hover:border-neutral-750 text-neutral-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Back
                </button>

                <button
                  onClick={handleFinishSetup}
                  className="flex items-center gap-2 py-2.5 px-5 bg-white text-neutral-950 hover:bg-neutral-250 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <span>Launch Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

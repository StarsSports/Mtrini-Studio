import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Laptop, ArrowRight, Terminal, Download, Check, AlertCircle, Info
} from 'lucide-react';

interface PremiumHubModalProps {
  onClose: () => void;
  userProfile: any | null;
}

export default function PremiumHubModal({
  onClose
}: PremiumHubModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'windows' | 'mac-silicon' | 'mac-intel'>('windows');
  const [detectedPlatform, setDetectedPlatform] = useState<'windows' | 'mac'>('windows');

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    if (ua.includes('mac')) {
      setDetectedPlatform('mac');
      setSelectedPlatform('mac-silicon'); // Default MAC users to Apple Silicon as it's the modern standard
    } else {
      setDetectedPlatform('windows');
      setSelectedPlatform('windows');
    }
  }, []);

  const handleDownload = () => {
    setDownloading(true);
    setSuccessMsg(false);
    
    setTimeout(() => {
      window.location.href = `/api/download/mtrini?platform=${selectedPlatform}`;
      setDownloading(false);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 8000);
    }, 1000);
  };

  const getPlatformLabel = () => {
    switch (selectedPlatform) {
      case 'windows': return 'Windows 10 / 11 (64-bit EXE)';
      case 'mac-silicon': return 'macOS Apple Silicon (M1/M2/M3/M4)';
      case 'mac-intel': return 'macOS Intel (64-bit)';
    }
  };

  const getPlatformFile = () => {
    switch (selectedPlatform) {
      case 'windows': return 'Mtrini_Desktop_1.1.exe';
      case 'mac-silicon': return 'Mtrini_Mac_Silicon';
      case 'mac-intel': return 'Mtrini_Mac_Intel';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.99, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.99, y: 6 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="bg-white border border-neutral-200 rounded-xl shadow-xl w-full max-w-md flex flex-col overflow-hidden max-h-[90vh]"
        id="premium-hub-modal"
      >
        {/* Simple & Clean Professional Header */}
        <div className="p-4 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center">
              <Laptop className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-neutral-900 text-sm tracking-tight leading-tight">Desktop Client</h3>
              <p className="text-[10px] text-neutral-500 font-medium">Download standalone desktop apps</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-neutral-200 rounded-md transition-colors cursor-pointer text-neutral-400 hover:text-neutral-700"
            id="close-premium-hub-modal"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 custom-scrollbar bg-white">
          
          {/* OS Platform Selector Tabs */}
          <div className="space-y-1.5 select-none">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">Select Target OS Platform:</span>
            <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-100 rounded-lg border border-neutral-200/60">
              <button
                type="button"
                onClick={() => setSelectedPlatform('windows')}
                className={`py-1.5 px-2 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                  selectedPlatform === 'windows' 
                    ? 'bg-white text-neutral-900 shadow-xs' 
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Windows 10/11
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlatform('mac-silicon')}
                className={`py-1.5 px-2 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                  selectedPlatform === 'mac-silicon' 
                    ? 'bg-white text-neutral-900 shadow-xs' 
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                macOS Silicon
              </button>
              <button
                type="button"
                onClick={() => setSelectedPlatform('mac-intel')}
                className={`py-1.5 px-2 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                  selectedPlatform === 'mac-intel' 
                    ? 'bg-white text-neutral-900 shadow-xs' 
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                macOS Intel
              </button>
            </div>
          </div>

          {/* Main Download Card - Extremely professional and clean */}
          <div className="text-center p-6 border border-neutral-200 bg-neutral-50 rounded-xl space-y-4 flex flex-col items-center select-none">
            <div className="w-11 h-11 rounded-full bg-neutral-900 text-white flex items-center justify-center">
              <Download className={`w-5 h-5 ${downloading ? 'animate-bounce' : ''}`} />
            </div>
            
            <div className="space-y-1">
              <h4 className="font-sans font-bold text-neutral-900 text-sm">
                Mtrini Desktop ({selectedPlatform.startsWith('mac') ? 'macOS App' : 'Windows Application'})
              </h4>
              <p className="text-[11px] text-neutral-500 max-w-xs mx-auto leading-normal">
                Enjoy zero-latency editing, instant access to system processes, and standard isolated window execution directly from your dock or taskbar.
              </p>
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full max-w-[280px] py-2 px-4 bg-neutral-900 hover:bg-black disabled:bg-neutral-300 text-white font-bold text-xs tracking-wide rounded-lg transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 select-none shadow-xs"
            >
              {downloading ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Requesting Build...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Download for {getPlatformLabel()}
                </>
              )}
            </button>

            <div className="text-[9px] font-mono text-neutral-400 font-bold uppercase tracking-wider">
              File: {getPlatformFile()} • Size: ~34 MB
            </div>
          </div>

          {/* Feedback message upon download initiative */}
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-lg flex items-start gap-2.5"
            >
              <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-emerald-950 block">Download Started!</span>
                <span className="text-[10px] text-emerald-700 leading-normal block">
                  Downloading <span className="font-mono font-bold">{getPlatformFile()}</span> from our compilation server. Check your browser's download progress.
                </span>
              </div>
            </motion.div>
          )}

          {/* Diagnostics Log Toggle Button */}
          <div className="pt-0.5 select-none">
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="w-full py-1.5 px-3 border border-neutral-200 hover:bg-neutral-50 text-neutral-750 font-bold text-[11px] rounded-lg transition-colors flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-neutral-400" />
                Show Build Version Log
              </span>
              <span className="text-[9px] text-neutral-400 font-mono font-bold">
                {showLogs ? 'CLOSE' : 'OPEN'}
              </span>
            </button>

            <AnimatePresence>
              {showLogs && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-1.5"
                >
                  <div className="p-3 bg-neutral-900 text-neutral-300 font-mono text-[10px] rounded-lg border border-neutral-800 space-y-1">
                    <div className="flex justify-between text-neutral-400 border-b border-neutral-800 pb-1 mb-1">
                      <span>Parameter</span>
                      <span>Value</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Selected Target:</span>
                      <span className="text-white font-medium">{getPlatformLabel()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Package Core:</span>
                      <span className="text-white font-medium">Node.js 18.x Stable Bundle</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">File Output Name:</span>
                      <span className="text-neutral-200">{getPlatformFile()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Host Compilers:</span>
                      <span className="text-emerald-400">Windows-x64 / Darwin-x64 & Arm64</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Compilation Date:</span>
                      <span className="text-neutral-400">May 20, 2026 UTC</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Simple Professional SmartScreen / Security OS Notice */}
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg space-y-1.5">
            <div className="flex items-center gap-1.5 text-neutral-800 font-bold text-xs select-none">
              <AlertCircle className="w-4 h-4 text-neutral-500 shrink-0" />
              Installation & Launch Guide
            </div>
            
            {selectedPlatform === 'windows' ? (
              <div className="text-[10px] text-neutral-600 leading-normal space-y-1 font-sans">
                <p>Because the app is freshly compiled on-demand, Windows Defender might prompt a warning popup:</p>
                <div className="p-2 bg-white rounded border border-neutral-200/65 text-[9.5px] text-neutral-505 space-y-0.5">
                  <div>1. Open the downloaded <span className="font-bold text-neutral-800">Mtrini_Desktop_1.1.exe</span> file.</div>
                  <div>2. On the Windows prompt, click <span className="font-bold text-neutral-800 underline">"More info"</span> underneath the text.</div>
                  <div>3. Click <span className="font-bold text-emerald-800">"Run anyway"</span> to construct your workspace window.</div>
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-neutral-600 leading-normal space-y-1 font-sans">
                <p>Mac systems require permissions to launch custom command-line utilities:</p>
                <div className="p-2 bg-white rounded border border-neutral-200/65 text-[9.5px] text-neutral-505 space-y-0.5">
                  <div>1. Drag or save the file to your Applications folder.</div>
                  <div>2. Open Terminal and run: <code className="bg-neutral-150 px-1 py-0.5 rounded font-mono font-bold text-red-700">chmod +x /path/to/file</code></div>
                  <div>3. Right-click the file and select <span className="font-bold text-neutral-800">"Open"</span> to approve execution.</div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Minimalist Footer */}
        <div className="p-3.5 border-t border-neutral-100 bg-neutral-50 flex items-center justify-end select-none">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-3xs"
          >
            Close Settings
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  X, Settings, Cpu, Palette, RefreshCw, ShieldCheck, HelpCircle, HardDrive, Sparkles, AlertTriangle, CheckCircle,
  Keyboard, Zap, Sliders, ToggleLeft, ToggleRight, Check
} from 'lucide-react';
import { UserProfile, ThemeColors } from '../types';

interface RightDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onUpdatePreferences: (updates: Partial<UserProfile>) => void;
  themeColors: ThemeColors;
  localApiKey: string;
  onUpdateApiKey: (key: string) => void;
}

const DEFAULT_MCP_CONFIG = `{
  "local-mcp-agent": {
    "url": "http://localhost:5001",
    "enabled": true
  },
  "remote-gdoc-bridge": {
    "url": "https://mcp.ayhamprojects.sh",
    "enabled": false
  }
}`;

export default function RightDrawer({
  isOpen,
  onClose,
  userProfile,
  onUpdatePreferences,
  themeColors,
  localApiKey,
  onUpdateApiKey
}: RightDrawerProps) {
  const [mcpJsonStr, setMcpJsonStr] = useState(() => userProfile?.mcpConfig || DEFAULT_MCP_CONFIG);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [parsedServers, setParsedServers] = useState<Record<string, { command?: string; args?: string[]; url?: string; enabled?: boolean }>>({});

  useEffect(() => {
    try {
      let parsed = JSON.parse(mcpJsonStr);
      if (typeof parsed === 'object' && parsed !== null) {
        if (parsed.mcpServers && typeof parsed.mcpServers === 'object') {
          parsed = parsed.mcpServers;
        }
        setParsedServers(parsed);
        setJsonError(null);
      } else {
        setJsonError('JSON must be a key-value object of server configs');
      }
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON syntax');
    }
  }, [mcpJsonStr]);

  const handleSaveJsonConfig = () => {
    if (jsonError) return;
    onUpdatePreferences({ 
      mcpConfig: mcpJsonStr,
      mcpServer: 'Roblox_Studio_JSON_STDIO'
    });
  };

  const personaOptions = [
    { 
      value: 'cyan' as const, 
      label: 'System Compiler', 
      tag: 'DEFAULT ENGINE', 
      desc: 'Balanced, high-speed, raw technical answers.', 
      icon: Cpu,
      color: 'text-cyan-600',
      borderColor: 'border-cyan-200',
      bgColor: 'bg-cyan-50/50'
    },
    { 
      value: 'emerald' as const, 
      label: 'Secure Sentry', 
      tag: 'DEFENSIVE SHIELD', 
      desc: 'Robust try-catches, checks & strict type-safety.', 
      icon: ShieldCheck,
      color: 'text-emerald-600',
      borderColor: 'border-emerald-200',
      bgColor: 'bg-emerald-50/50'
    },
    { 
      value: 'crimson' as const, 
      label: 'Performance Hacker', 
      tag: 'ALGORITHMIC SPRINT', 
      desc: 'Ultra-fast, micro-optimized, low-overhead files.', 
      icon: Zap,
      color: 'text-rose-600',
      borderColor: 'border-rose-200',
      bgColor: 'bg-rose-50/50'
    },
    { 
      value: 'amber' as const, 
      label: 'Software Architect', 
      tag: 'SOLID SYSTEM', 
      desc: 'Decoupled systems, JSDocs, and elegant OOP design.', 
      icon: Sliders,
      color: 'text-amber-700',
      borderColor: 'border-amber-200',
      bgColor: 'bg-amber-50/50'
    },
    { 
      value: 'violet' as const, 
      label: 'UX Craftsman', 
      tag: 'SENSORY INTERACTIVE', 
      desc: 'Beautiful spacing rhythms, styling & animations.', 
      icon: Palette,
      color: 'text-violet-600',
      borderColor: 'border-violet-200',
      bgColor: 'bg-violet-50/50'
    },
  ];

  return (
    <motion.div 
      initial={{ x: '100%', opacity: 0.95 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0.95 }}
      transition={{ type: 'spring', damping: 26, stiffness: 220 }}
      className="fixed inset-y-0 right-0 w-85 bg-[#FAF8F5] border-l border-[#E6E0D5] z-50 flex flex-col font-sans text-neutral-800 shadow-2xl h-full"
    >
      {/* Drawer Header */}
      <div className="p-4 border-b border-[#E6E0D5] bg-[#F2EDE4] flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-amber-900" />
          <span className="font-display font-semibold text-sm tracking-tight text-neutral-900">Control Desk</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-[#E3DCCE] rounded-lg transition-colors cursor-pointer text-neutral-600"
          id="btn-close-drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        
        {/* Module 1: AI Token Meter */}
        <div className="bg-white p-4 border border-[#E6E0D5] rounded-xl space-y-3.5 shadow-3xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6DCD0] select-none">
            <span className="text-[10px] font-black text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#C2410C]" />
              Compute Balance
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-250 text-[8px] font-extrabold text-emerald-800 uppercase tracking-wide">
              🔒 STABLE NODE
            </span>
          </div>

          <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#C2410C] rounded-full w-full" />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-neutral-500 leading-none">
            <span>Quota Utilized: Unlimited</span>
            <span className="font-bold text-[#A16207]">∞ Infinite Sandbox Credits</span>
          </div>
        </div>

        {/* Module 2: AI Developer Persona */}
        <div className="bg-white p-4 border border-[#E6E0D5] rounded-xl space-y-3 shadow-3xs">
          <div className="flex items-center justify-between pb-1 border-b border-[#E6DCD0] select-none">
            <span className="text-[10px] font-black text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className={`w-3.5 h-3.5 ${themeColors.text}`} />
              AI Coding Persona
            </span>
            <span className="text-[8px] font-mono text-neutral-500 bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-250 uppercase tracking-wide">
              MIND DECK
            </span>
          </div>
          
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {personaOptions.map((opt) => {
              const OptIcon = opt.icon;
              const isActive = userProfile?.themeColor === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onUpdatePreferences({ themeColor: opt.value })}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex gap-3 ${
                    isActive 
                      ? `${opt.bgColor} ${opt.borderColor} shadow-2xs` 
                      : 'bg-white border-neutral-150 hover:border-neutral-250 hover:bg-[#FAF9F5]'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 flex items-center justify-center h-8 w-8 border ${
                    isActive 
                      ? `${opt.bgColor} ${opt.borderColor} ${opt.color}` 
                      : 'bg-neutral-50 border-neutral-100 text-neutral-400'
                  }`}>
                    <OptIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-neutral-900 text-[11px] truncate">{opt.label}</span>
                      <span className={`text-[7px] font-black tracking-wider uppercase px-1 rounded-sm ${
                        isActive ? `${opt.color} ${opt.bgColor}` : 'text-neutral-400 bg-neutral-100'
                      }`}>
                        {opt.tag}
                      </span>
                    </div>
                    <p className="text-[9.5px] text-neutral-500 leading-normal mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Module Extra: AI Compilation Options */}
        <div className="bg-white p-4 border border-[#E6E0D5] rounded-xl space-y-3.5 shadow-3xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6DCD0] select-none">
            <span className="text-[10px] font-black text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className={`w-3.5 h-3.5 ${themeColors.text}`} />
              AI Compiler Node
            </span>
            <span className="text-[8px] font-mono text-neutral-500 bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-250 uppercase tracking-wide">
              OPTIMIZER v1
            </span>
          </div>

          {/* Velo-streaming channel toggle */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-neutral-800">Prompt Velo-Streaming</span>
              <span className="text-[9px] text-neutral-500 leading-tight">Live compile characters as they generate</span>
            </div>
            <button
              type="button"
              onClick={() => onUpdatePreferences({ streamingEnabled: userProfile?.streamingEnabled !== false ? false : true })}
              className="text-[#C2410C] hover:text-orange-700 transition-colors cursor-pointer"
            >
              {userProfile?.streamingEnabled !== false ? (
                <ToggleRight className="w-9 h-9 fill-[#C2410C]/10" />
              ) : (
                <ToggleLeft className="w-9 h-9 text-neutral-400" />
              )}
            </button>
          </div>

          {/* Compiler Optimization profile switcher */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-neutral-500 font-mono uppercase tracking-wide">Pipeline Profile:</span>
              <span className="text-[9px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-250 font-bold uppercase shrink-0">
                {userProfile?.compilationSpeed === 'fast' ? 'Overclock Fast' : userProfile?.compilationSpeed === 'safe' ? 'Secure Sandbox' : 'Balanced Engine'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(['fast', 'balanced', 'safe'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onUpdatePreferences({ compilationSpeed: mode })}
                  className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                    (userProfile?.compilationSpeed || 'balanced') === mode
                      ? 'bg-[#C2410C] border-[#B2310C] text-white shadow-3xs'
                      : 'bg-[#FAF9F5] hover:bg-white border-[#E6E0D5] text-neutral-600'
                  }`}
                >
                  {mode === 'fast' ? 'Aggressive' : mode === 'safe' ? 'Strict' : 'Balanced'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Module Shortcuts: Interactive Keyboard Hotkeys Suite */}
        <div className="bg-white p-4 border border-[#E6E0D5] rounded-xl space-y-3.5 shadow-3xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6DCD0] select-none">
            <span className="text-[10px] font-black text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5 text-[#C2410C]" />
              Workspace Hotkeys
            </span>
            <button
              onClick={() => onUpdatePreferences({ shortcutsEnabled: userProfile?.shortcutsEnabled === false ? true : false })}
              className="text-[#C2410C] hover:text-orange-700 transition-colors cursor-pointer"
              title="Toggle all Hotkeys"
            >
              {userProfile?.shortcutsEnabled !== false ? (
                <ToggleRight className="w-9 h-9 fill-[#C2410C]/10" />
              ) : (
                <ToggleLeft className="w-9 h-9 text-neutral-400" />
              )}
            </button>
          </div>

          <p className="text-[10px] text-neutral-500 leading-normal">
            Improve compilation speed using integrated global keyboard commands:
          </p>

          <div className="space-y-1.5 font-mono text-[9px] select-none">
            <div className="p-1.5 border border-[#EDE8DE] bg-[#FAF9F5] rounded-md flex items-center justify-between">
              <span className="text-neutral-500 font-sans font-semibold">New Active Thread</span>
              <span className="bg-white border px-1.5 py-0.5 rounded shadow-3xs font-extrabold text-[#C2410C]">Alt + N</span>
            </div>
            <div className="p-1.5 border border-[#EDE8DE] bg-[#FAF9F5] rounded-md flex items-center justify-between">
              <span className="text-neutral-500 font-sans font-semibold">Toggle Settings Drawer</span>
              <span className="bg-white border px-1.5 py-0.5 rounded shadow-3xs font-extrabold text-[#C2410C]">Alt + S</span>
            </div>
            <div className="p-1.5 border border-[#EDE8DE] bg-[#FAF9F5] rounded-md flex items-center justify-between">
              <span className="text-neutral-500 font-sans font-semibold">Platform Guide Tour</span>
              <span className="bg-white border px-1.5 py-0.5 rounded shadow-3xs font-extrabold text-[#C2410C]">Alt + C</span>
            </div>
            <div className="p-1.5 border border-[#EDE8DE] bg-[#FAF9F5] rounded-md flex items-center justify-between">
              <span className="text-neutral-500 font-sans font-semibold">Clear Active Thread Logs</span>
              <span className="bg-white border px-1.5 py-0.5 rounded shadow-3xs font-extrabold text-[#C2410C]">Alt + D</span>
            </div>
            <div className="p-1.5 border border-[#EDE8DE] bg-[#FAF9F5] rounded-md flex items-center justify-between">
              <span className="text-neutral-500 font-sans font-semibold">Dismiss Guide or Drawer</span>
              <span className="bg-white border px-1.5 py-0.5 rounded shadow-3xs font-extrabold text-[#C2410C]">Esc</span>
            </div>
          </div>
        </div>

        {/* Module 3: REAL JSON MCP CONFIG editor */}
        <div className="bg-white p-4 border border-[#E6E0D5] rounded-xl space-y-3.5 shadow-3xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6DCD0]">
            <label className="text-[10px] font-black text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-[#C2410C]" />
              JSON MCP Servers
            </label>
            <HelpCircle 
              className="w-3.5 h-3.5 text-neutral-400 cursor-help hover:text-neutral-600"
              title="Input compliant JSON to set up your fleet of Model Context Protocol endpoints." 
            />
          </div>

          <p className="text-[10px] text-neutral-500 leading-normal">
            Configure dynamic toolsets. Define your servers in standard JSON:
          </p>

          <div className="space-y-1.5">
            <textarea
              value={mcpJsonStr}
              onChange={(e) => setMcpJsonStr(e.target.value)}
              placeholder="{}"
              rows={6}
              className="w-full bg-[#FAF9F5] border border-[#EDE8DE] focus:bg-white focus:border-[#DEC9B3] rounded-lg p-2 text-[10px] focus:ring-1 focus:ring-amber-600 focus:outline-none transition-all font-mono leading-normal custom-scrollbar"
            />

            {jsonError ? (
              <div className="flex items-start gap-1 p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[9px] font-mono">
                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span>{jsonError}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[9px] text-emerald-700 font-mono flex items-center gap-1 font-bold">
                  <CheckCircle className="w-3 h-3" /> Config Validated
                </span>
                <button
                  onClick={handleSaveJsonConfig}
                  className="px-2.5 py-1 bg-neutral-900 text-[#FAF8F5] hover:bg-[#C2410C] rounded-md text-[10px] font-bold tracking-wide transition-all cursor-pointer"
                >
                  Save Workspace
                </button>
              </div>
            )}
          </div>

          {/* Render individual parsed servers list directly aligned with pure JSON config */}
          {!jsonError && Object.keys(parsedServers).length > 0 && (
            <div className="pt-2 border-t border-[#EDE8DE] space-y-2">
              <span className="text-[9px] font-bold text-neutral-500 font-mono uppercase tracking-wider block">Connected Fleet Endpoints ({Object.keys(parsedServers).length}):</span>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                {(Object.entries(parsedServers) as [string, any][]).map(([id, srv]) => {
                  return (
                    <div key={id} className="p-2.5 border border-emerald-250 bg-emerald-50/10 rounded-lg flex flex-col gap-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-neutral-800 truncate block max-w-[150px]">{id}</span>
                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 text-[9px] flex items-center justify-center gap-1 select-none shadow-3xs">
                            <Check className="w-2.5 h-2.5" /> Connected
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-[11px] text-neutral-600 font-sans">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] text-neutral-400 font-bold uppercase font-mono">Activation Mode</span>
                          <span className="text-[10px] font-medium text-neutral-700 font-mono">Standard Stdio Daemon Configuration</span>
                        </div>

                        {srv.command && (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] text-neutral-400 font-bold uppercase font-mono">Process Entrypoint</span>
                            <code className="text-[9.5px] font-mono bg-neutral-100 border text-neutral-800 p-1 px-1.5 rounded select-all block truncate leading-none">
                              {srv.command} {srv.args ? srv.args.join(' ') : ''}
                            </code>
                          </div>
                        )}

                        <div className="pt-2 border-t border-dashed border-neutral-200">
                          <span className="text-[9px] text-neutral-500 font-bold uppercase font-mono block mb-1">Active Roblox Studio Toolset:</span>
                          <div className="flex flex-wrap gap-1">
                            <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold font-mono text-[8px] rounded">roblox_write_script</span>
                            <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold font-mono text-[8px] rounded">roblox_create_part</span>
                            <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold font-mono text-[8px] rounded">roblox_toolbox_search</span>
                            <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold font-mono text-[8px] rounded">roblox_insert_model</span>
                            <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold font-mono text-[8px] rounded">roblox_get_workspace</span>
                            <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold font-mono text-[8px] rounded">roblox_publish_place</span>
                            <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold font-mono text-[8px] rounded">roblox_run_tests</span>
                            <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold font-mono text-[8px] rounded">roblox_read_script</span>
                            <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold font-mono text-[8px] rounded">roblox_set_property</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Module 4: Custom Private API Key Overrides */}
        <div className="bg-white p-4 border border-[#E6E0D5] rounded-xl space-y-3.5 shadow-3xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6DCD0] select-none">
            <label className="text-[10px] font-black text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C2410C]" />
              Bridge Tunnel Override
            </label>
            <span className="text-[8px] font-mono text-neutral-500 bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-250 uppercase tracking-wide">
              SECURITY
            </span>
          </div>

          <div className="space-y-1.5">
            <input
              type="password"
              placeholder="Active: Workspace Direct Proxy"
              value={localApiKey}
              onChange={(e) => onUpdateApiKey(e.target.value)}
              className="w-full bg-[#FAF9F5] border border-[#EDE8DE] focus:bg-white focus:border-[#DEC9B3] rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#C2410C] focus:outline-none transition-all font-mono"
            />
            <p className="text-[10px] text-neutral-500 leading-normal">
              By default, Mtrini routes prompts via the server-side proprietary AI compilation tunnel.
            </p>
          </div>
        </div>
      </div>

      {/* Drawer Footer credits & branding metadata */}
      <div className="p-4 border-t border-[#E6DCD0] bg-[#F2EDE4] mt-auto flex flex-col gap-1 text-center font-mono text-[9px] text-[#8C8473] select-none">
        <span>ENGINE: mtrini-v1.0.0-core</span>
        <span className="font-semibold text-neutral-800">"Mtrini: Designed By Nova AI"</span>
      </div>
    </motion.div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Terminal, Square, Award, Cpu, Loader2, Sparkles, Layers, ChevronDown, ChevronRight, HelpCircle, Brain, Info, Check, Coins, Lock, Gem, Laptop, Download
} from 'lucide-react';
import { Message, ThemeColors, UserProfile } from '../types';
import ArtifactView from './ArtifactView';
import { parseMessageArtifacts } from '../utils';

interface WorkspaceProps {
  messages: Message[];
  activeChatId: string | null;
  onSendMessage: (content: string) => void;
  streaming: boolean;
  onStopStreaming: () => void;
  userProfile: UserProfile | null;
  themeColors: ThemeColors;
  onOpenPreferences: () => void;
  onOpenPremiumHub: () => void;
  // Models and Thinking modes state
  selectedModel: 'mtrini_1_0' | 'mtrini_1_1';
  onSelectModel: (model: 'mtrini_1_0' | 'mtrini_1_1') => void;
  selectedThinking: 'fast' | 'deep' | 'short';
  onSelectThinking: (style: 'fast' | 'deep' | 'short') => void;
}

interface ParsedThought {
  thought: string;
  response: string;
}

function parseMessageThoughts(content: string): ParsedThought {
  const thoughtStart = content.indexOf('<thought>');
  if (thoughtStart === -1) {
    return { thought: '', response: content };
  }
  
  const closingTag = content.indexOf('</thought>');
  if (closingTag === -1) {
    const thought = content.substring(thoughtStart + 9);
    return { thought, response: '' };
  }
  
  const thought = content.substring(thoughtStart + 9, closingTag);
  const response = content.substring(closingTag + 10);
  return { thought, response };
}

export default function Workspace({
  messages,
  activeChatId,
  onSendMessage,
  streaming,
  onStopStreaming,
  userProfile,
  themeColors,
  onOpenPreferences,
  onOpenPremiumHub,
  selectedModel,
  onSelectModel,
  selectedThinking,
  onSelectThinking
}: WorkspaceProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const [selectedArtifactMessageId, setSelectedArtifactMessageId] = useState<string | null>(null);

  const [showMainLogs, setShowMainLogs] = useState(false);
  const [downloadingClient, setDownloadingClient] = useState(false);

  const handleLocalDownload = () => {
    setDownloadingClient(true);
    setTimeout(() => {
      window.location.href = '/api/download/mtrini';
      setDownloadingClient(false);
    }, 1200);
  };

  const handleApplyPreset = (prompt: string) => {
    setInputValue(prompt);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  useEffect(() => {
    const assistantMsgsWithArtifact = messages.filter(
      (m) => m.role === 'assistant' && m.content.includes('[ARTIFACT')
    );
    if (assistantMsgsWithArtifact.length > 0) {
      setSelectedArtifactMessageId(assistantMsgsWithArtifact[assistantMsgsWithArtifact.length - 1].id);
    } else {
      setSelectedArtifactMessageId(null);
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || streaming) return;

    onSendMessage(inputValue);
    setInputValue('');
  };

  const toggleThought = (msgId: string) => {
    setExpandedThoughts(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const handleSelectModelWithGate = (modelId: 'mtrini_1_0' | 'mtrini_1_1') => {
    if (modelId === 'mtrini_1_1' && !userProfile?.isPremiumActive) {
      // Trigger Paywall directly
      onOpenPremiumHub();
    } else {
      onSelectModel(modelId);
    }
  };

  const activeMessage = messages.find((m) => m.id === selectedArtifactMessageId);
  const activeArtifact = activeMessage ? parseMessageArtifacts(activeMessage.content) : null;

  return (
    <div className="flex-1 flex overflow-hidden bg-[#FAF8F5] font-sans h-full text-neutral-800">
      
      {/* Central Chat Stream */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden ${activeArtifact ? 'max-w-[50%]' : 'w-full'} transition-all duration-300`}>
        
        {/* Dynamic Studio Header Desk */}
        <div className="h-14 border-b border-[#E6DCD0] px-4 bg-[#FAF8F5] flex items-center justify-between shrink-0 select-none shadow-3xs z-10">
          <div className="flex items-center gap-2">
            <Cpu className="w-4.5 h-4.5 text-[#C2410C]" />
            <div className="flex flex-col">
              <span className="text-xs font-display font-extrabold tracking-tight uppercase text-neutral-900">
                {selectedModel === 'mtrini_1_1' ? 'Mtrini 1.1 Pro' : 'Mtrini 1.0 Core'}
              </span>
              <span className="text-[10px] text-neutral-500 font-medium">Workspace Active</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Desktop Client Badge link button */}
            <button
              onClick={onOpenPremiumHub}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-250 text-neutral-800 text-[11px] font-bold rounded-xl transition-all cursor-pointer shadow-3xs hover:-translate-y-0.5 active:translate-y-0 text-center select-none"
              title="Mtrini Desktop App Hub"
              id="header-wallet-btn"
            >
              <Laptop className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
              <span>
                Desktop Apps <strong className="font-mono">(Win / Mac)</strong>
              </span>
            </button>
            
            <button
              onClick={onOpenPreferences}
              className="text-[11px] font-bold border border-[#DEC9B3] bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-950 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-3xs"
            >
              Control Desk
            </button>
          </div>
        </div>

        {/* Message Feeds Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-[#FAF8F5]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none space-y-5 max-w-2xl mx-auto my-auto py-10" id="mtrini-welcome-dashboard">
              <div className="space-y-2">
                <div className="flex justify-center">
                  <div className="p-3 rounded-2xl bg-white border border-[#DEC9B3] shadow-xs relative group">
                    <Brain className="w-7 h-7 text-[#C2410C]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg font-sans font-extrabold text-neutral-900 tracking-tight uppercase">
                    Mtrini Code Studio
                  </h2>
                  <p className="text-[11px] text-neutral-500 font-medium">
                    Integrated AI assistant and interactive code sandbox
                  </p>
                </div>
              </div>

              {/* Module: Code Generation Capabilities */}
              <div className="w-full bg-white border border-[#E6DCD0] rounded-xl p-4.5 text-left space-y-3 shadow-3xs" id="capabilities-card">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 uppercase tracking-wide">
                  <Layers className="w-4 h-4 text-[#C2410C] shrink-0" />
                  Code Sandbox Capabilities
                </div>
                <p className="text-[11px] text-neutral-600 leading-relaxed font-sans">
                  Mtrini is designed to compile code, web UI layouts, and specialized automation files. Draft comprehensive single-page apps, scripts, or interface components, and review them instantly side-by-side using the sandbox interface.
                </p>
                
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider font-mono">Test code assistant (Click to populate workspace input):</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("Generate a fully interactive Starfield canvas simulator in HTML and CSS with particle physics and adjustable warp controls.")}
                      className="p-2.5 border border-[#EDE8DE] rounded-lg bg-[#FAF9F5] hover:bg-[#FAF5ED] text-left hover:border-[#DEC9B3] transition-colors cursor-pointer text-neutral-700 hover:text-neutral-900 flex flex-col gap-0.5"
                    >
                      <span className="font-bold text-neutral-950">1. Canvas Starfield Particle Physics</span>
                      <span className="text-[9.5px] text-neutral-500 truncate w-full">Interactive visual simulation inside secondary frames.</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("Write a robust event-driven Roblox Luau core server framework. Implement secure memory garbage collection streams and custom Dispatcher events.")}
                      className="p-2.5 border border-[#EDE8DE] rounded-lg bg-[#FAF9F5] hover:bg-[#FAF5ED] text-left hover:border-[#DEC9B3] transition-colors cursor-pointer text-neutral-700 hover:text-neutral-900 flex flex-col gap-0.5"
                    >
                      <span className="font-bold text-neutral-950">2. Luau Server Dispatcher Module</span>
                      <span className="text-[9.5px] text-neutral-500 truncate w-full">Optimized module for high fidelity event handling.</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Module: Standalone Desktop Installer */}
              <div className="w-full bg-white border border-[#E6DCD0] rounded-xl p-4.5 text-left shadow-3xs space-y-3" id="desktop-integration-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Laptop className="w-4 h-4 text-neutral-600 shrink-0" />
                    Mtrini Desktop Installer
                  </span>
                  <span className="text-[9px] font-mono text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-lg border border-neutral-200 font-semibold uppercase">
                    Cross-Platform Targets
                  </span>
                </div>
                
                <p className="text-[11px] text-neutral-600 leading-relaxed font-sans">
                  Execute code on isolated workspaces or synchronize local system workspaces using our native companion applications.
                </p>

                <div className="pt-1 flex flex-wrap items-center gap-2 select-none">
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = '/api/download/mtrini?platform=windows';
                    }}
                    className="py-1.5 px-3 bg-neutral-900 hover:bg-black text-white font-bold text-[10px] rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-3xs hover:-translate-y-0.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Windows (10/11)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = '/api/download/mtrini?platform=macos-silicon';
                    }}
                    className="py-1.5 px-3 bg-neutral-900 hover:bg-black text-white font-bold text-[10px] rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-3xs hover:-translate-y-0.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    macOS (M1/M2/M3/M4)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = '/api/download/mtrini?platform=macos-intel';
                    }}
                    className="py-1.5 px-3 bg-neutral-900 hover:bg-black text-white font-bold text-[10px] rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-3xs hover:-translate-y-0.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    macOS (Intel)
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowMainLogs(!showMainLogs)}
                    className="py-1.5 px-2.5 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    id="toggle-windows-logs-btn"
                  >
                    <Terminal className="w-3.5 h-3.5 text-neutral-500" />
                    {showMainLogs ? 'Hide Log' : 'Show OS Log'}
                  </button>
                </div>

                {/* Collapsible Diagnostics window */}
                <AnimatePresence>
                  {showMainLogs && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mt-1"
                    >
                      <div className="p-3 bg-neutral-900 text-neutral-300 font-mono text-[10px] rounded-lg border border-neutral-800 space-y-1 shadow-inner leading-normal">
                        <div className="text-neutral-400 font-semibold border-b border-neutral-800 pb-1 mb-1 flex justify-between">
                          <span>SYSTEM TARGET METADATA</span>
                          <span className="text-emerald-400">ACTIVE</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Supported Windows:</span>
                          <span className="text-neutral-100 font-bold">Microsoft Windows 10 & 11 (64-bit Editions)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Supported macOS:</span>
                          <span className="text-neutral-150">Sierra / Big Sur / Ventura / Sonoma / Sequoia</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Active Client Output:</span>
                          <span className="text-neutral-100">Client Executable Bundle v1.1.0 Stable</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Download Mode:</span>
                          <span className="text-emerald-400">Raw Binary Attachment Stream (/api/download/mtrini)</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            /* Active Messages Feed */
            <div className="space-y-5 max-w-3xl mx-auto col">
              {messages.map((m) => {
                const isUser = m.role === 'user';
                const sourceContent = m.content || '';
                
                const { thought, response } = parseMessageThoughts(sourceContent);
                const parsed = parseMessageArtifacts(response);

                const hasThought = thought.trim().length > 0;
                const isThoughtExpanded = expandedThoughts[m.id] !== false;

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    key={m.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    {/* Message Meta Info Header */}
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] text-neutral-400 font-sans px-1">
                      <span className="font-bold text-neutral-600">{isUser ? (userProfile?.displayName || 'User Node') : 'Mtrini Agent'}</span>
                      <span>•</span>
                      <span>{new Date(m.createdAt?.seconds * 1000 || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div 
                      className={`max-w-[95%] p-4 rounded-2xl text-[13px] leading-relaxed font-sans border transition-all ${isUser ? 'bg-white border-[#DEC9B3] text-neutral-900 rounded-tr-none shadow-3xs' : 'bg-transparent border-transparent text-neutral-800'}`}
                    >
                      {/* Thought process tags */}
                      {!isUser && hasThought && (
                        <div className="mb-3.5 bg-[#FAF9F5] border border-[#E6DCD0] rounded-xl overflow-hidden shadow-3xs max-w-2xl">
                          <button
                            onClick={() => toggleThought(m.id)}
                            className="w-full flex items-center justify-between p-2.5 px-3 bg-[#EAE4D9]/60 text-neutral-800 hover:text-black transition-colors text-xs font-bold font-display uppercase tracking-wide"
                          >
                            <span className="flex items-center gap-1.5 text-neutral-800">
                              <Brain className="w-3.5 h-3.5 text-[#C2410C]" />
                              <span>Diagnostics Flow</span>
                            </span>
                            {isThoughtExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          
                          {isThoughtExpanded && (
                            <pre className="p-3 bg-[#FAFDF9]/40 border-t border-[#E6DCD0] text-[10px] text-neutral-500 font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed max-h-48 custom-scrollbar">
                              {thought}
                            </pre>
                          )}
                        </div>
                      )}

                      {/* prose output text */}
                      <div className="whitespace-pre-wrap select-text pr-1 text-[12.5px] text-neutral-800 prose leading-relaxed font-sans">
                        {parsed.prose}
                      </div>

                      {/* Interactive Workspace Render shortcut */}
                      {parsed.hasArtifact && (
                        <div 
                          onClick={() => setSelectedArtifactMessageId(m.id)}
                          className={`mt-4 p-3 bg-white border rounded-xl flex items-center justify-between gap-3 text-xs font-bold hover:border-[#C2410C] transition-all cursor-pointer shadow-3xs ${selectedArtifactMessageId === m.id ? 'border-[#C2410C] text-[#C2410C]' : 'border-[#DEC9B3] text-neutral-700'}`}
                        >
                          <span className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-[#C2410C] animate-pulse" />
                            <span>Script Block: <code className="font-mono bg-[#FAF9F5] px-1 rounded text-neutral-600 font-bold">{parsed.artifactTitle}</code></span>
                          </span>
                          <span className="text-[10px] uppercase font-bold bg-[#FAF1EA] px-2.5 py-1 rounded-lg border border-[#DEC9B3]">
                            Activate Live Stage
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              
              {/* Stream Formulation bubble */}
              {streaming && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex flex-col items-start max-w-3xl mx-auto">
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] text-neutral-400 font-sans px-1">
                    <span>Mtrini Agent</span>
                    <span>•</span>
                    <span>Formulating...</span>
                  </div>
                  <div className="p-3.5 bg-white border border-[#E6DCD0] text-neutral-600 rounded-xl rounded-tl-none flex items-center gap-2.5 text-xs font-mono shadow-3xs">
                    <Loader2 className="w-4 h-4 animate-spin text-[#C2410C]" />
                    <span>Transcribing network compile stream...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Dynamic bottom prompt drawer box */}
        <div className="p-4 bg-[#FAF8F5] border-t border-[#E6DCD0] select-none shrink-0 z-10">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="flex flex-col bg-white border border-[#DEC9B3] rounded-2xl overflow-hidden shadow-sm focus-within:ring-1 focus-within:ring-amber-600 focus-within:border-amber-600 transition-all p-1">
              
              {/* PARAMETERS DESK: model engine list and cognition methods */}
              <div className="px-3 py-2 border-b border-[#FAF9F5] bg-[#FAF8F5] flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Model engine switcher */}
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mr-1">Compile Node:</span>
                    <button
                      type="button"
                      onClick={() => handleSelectModelWithGate('mtrini_1_0')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all border ${selectedModel === 'mtrini_1_0' ? 'bg-white border-[#DEC9B3] text-neutral-900 shadow-3xs font-extrabold' : 'border-transparent text-neutral-400 hover:text-neutral-700'}`}
                    >
                      Mtrini 1.0 (Free)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectModelWithGate('mtrini_1_1')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all border flex items-center gap-1 ${selectedModel === 'mtrini_1_1' ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-3xs font-extrabold' : 'border-transparent text-neutral-400 hover:text-neutral-700'}`}
                    >
                      Mtrini 1.1 (Premium)
                      {!userProfile?.isPremiumActive && <Lock className="w-3 h-3 text-[#C2410C] shrink-0" />}
                    </button>
                  </div>

                  <div className="h-4 w-[1px] bg-[#E6DCD0]" />

                  {/* Cognition switcher logic */}
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mr-1">Cognition:</span>
                    <button
                      type="button"
                      onClick={() => onSelectThinking('fast')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all border ${selectedThinking === 'fast' ? 'bg-white border-[#DEC9B3] text-neutral-900 shadow-3xs' : 'border-transparent text-neutral-400 hover:text-neutral-700'}`}
                    >
                      Fast
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectThinking('deep')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all border flex items-center gap-1 ${selectedThinking === 'deep' ? 'bg-white border-[#DEC9B3] text-neutral-900 shadow-3xs' : 'border-transparent text-neutral-400 hover:text-neutral-700'}`}
                    >
                      <Brain className="w-3 h-3 text-[#C2410C]" />
                      Deep Process
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectThinking('short')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all border ${selectedThinking === 'short' ? 'bg-white border-[#DEC9B3] text-neutral-900 shadow-3xs' : 'border-transparent text-neutral-400 hover:text-neutral-700'}`}
                    >
                      Concise
                    </button>
                  </div>
                </div>

                {streaming && (
                  <button
                    type="button"
                    onClick={onStopStreaming}
                    className="text-rose-700 hover:text-rose-800 font-bold px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Square className="w-2.5 h-2.5 fill-current" />
                    Halt
                  </button>
                )}
              </div>

              {/* Central Text Input text area panel */}
              <div className="flex items-start bg-white p-2">
                <textarea
                  placeholder="Ask Mtrini anything... Submit a prompt to start compiling. Type directly to trigger conversation thread auto-creation."
                  disabled={streaming}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (inputValue.trim()) handleSubmit(e);
                    }
                  }}
                  rows={2}
                  className="flex-1 bg-transparent py-1.5 px-3 text-[12.5px] leading-relaxed placeholder-neutral-400 font-sans focus:outline-none resize-none max-h-36 min-h-[40px] overflow-y-auto custom-scrollbar"
                />
                
                <button
                  type="submit"
                  disabled={streaming || !inputValue.trim()}
                  className={`p-2.5 rounded-xl transition-all shrink-0 cursor-pointer mt-1 ${inputValue.trim() && !streaming ? 'bg-[#C2410C] text-white hover:bg-[#A13309] shadow-sm' : 'bg-neutral-50 text-neutral-300'}`}
                  id="submit-command-btn"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </form>
            <p className="text-[10px] text-center text-neutral-400 font-sans mt-2">
              AP Specifications authorize unlimited compiling. Custom parameters can be tuned in the Control Desk.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Visual rendering Artifact board */}
      <ArtifactView 
        artifact={activeArtifact} 
        onClose={() => setSelectedArtifactMessageId(null)} 
        themeColor={userProfile?.themeColor || 'cyan'}
      />
    </div>
  );
}

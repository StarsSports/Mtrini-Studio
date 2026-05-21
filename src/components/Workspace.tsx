import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Terminal, Square, Award, Cpu, Loader2, Sparkles, Layers, ChevronDown, ChevronRight, HelpCircle, Brain, Info, Check, Coins, Lock, Gem, Laptop, Download, Trash2
} from 'lucide-react';
import { Message, ThemeColors, UserProfile } from '../types';
import ArtifactView from './ArtifactView';
import { parseMessageArtifacts } from '../utils';
import StreamingThinkingIndicator from './StreamingThinkingIndicator';

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
  onClearMessages?: () => void;
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
  onSelectThinking,
  onClearMessages
}: WorkspaceProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const [selectedArtifactMessageId, setSelectedArtifactMessageId] = useState<string | null>(null);

  const [showMainLogs, setShowMainLogs] = useState(false);
  const [downloadingClient, setDownloadingClient] = useState(false);
  const [isArtifactExpanded, setIsArtifactExpanded] = useState(false);

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

  // Clear active artifact view when changing chat threads
  useEffect(() => {
    setSelectedArtifactMessageId(null);
    setIsArtifactExpanded(false);
  }, [activeChatId]);

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
    onSelectModel(modelId);
  };

  const handleExportMarkdown = () => {
    if (messages.length === 0) return;
    const markdownContent = messages.map((m) => {
      const title = m.role === 'user' ? '### User Question' : '### Mtrini Response';
      return `${title}\n\n${m.content}\n\n---\n`;
    }).join('\n');
    
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mtrini_session_${activeChatId || 'export'}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeMessage = messages.find((m) => m.id === selectedArtifactMessageId);
  const activeArtifact = activeMessage ? parseMessageArtifacts(activeMessage.content) : null;

  return (
    <div className="flex-1 flex overflow-hidden bg-[#FAF8F5] font-sans h-full text-neutral-800">
      
      {/* Central Chat Stream */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden ${activeArtifact ? (isArtifactExpanded ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[55%] md:max-w-[50%]') : 'w-full'} transition-all duration-300`}>
        
        {/* Dynamic Studio Header Desk */}
        <div className="h-14 border-b border-[#E6DCD0] px-4 bg-[#FAF8F5] flex items-center justify-between shrink-0 select-none shadow-3xs z-10">
          <div className="flex items-center gap-2">
            <Cpu className={`w-4.5 h-4.5 ${themeColors.text}`} />
            <div className="flex flex-col">
              <span className="text-xs font-display font-extrabold tracking-tight uppercase text-neutral-900">
                Mtrini Code Studio
              </span>
              <span className="text-[10px] text-neutral-500 font-medium font-sans">Workspace Active</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Clear Sandbox / Messages */}
            {messages.length > 0 && onClearMessages && (
              <button
                type="button"
                onClick={onClearMessages}
                className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-rose-50 border border-rose-250 hover:border-rose-450 text-rose-700 text-[11px] font-bold rounded-xl transition-all cursor-pointer shadow-3xs"
                title="Reset this sandbox conversation"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                <span>Reset Sandbox</span>
              </button>
            )}

            {/* Export conversation */}
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleExportMarkdown}
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DEC9B3] ${themeColors.hoverBorder} hover:bg-neutral-50 text-neutral-700 text-[11px] font-bold rounded-xl transition-all cursor-pointer shadow-3xs`}
                title="Export entire interview as markdown"
              >
                <Download className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span>Export Session</span>
              </button>
            )}
            
             {/* Desktop companion apps trigger */}
            <button
              onClick={onOpenPremiumHub}
              className={`flex items-center gap-1.5 px-3 py-1.5 border border-[#DEC9B3] ${themeColors.hoverBorder} bg-[#FAF9F5]/80 hover:bg-white text-neutral-800 text-[11px] font-bold rounded-xl transition-all cursor-pointer shadow-3xs`}
              title="Download standalone cross-platform desktop client"
            >
              <Laptop className={`w-3.5 h-3.5 ${themeColors.text} shrink-0`} />
              <span>Desktop App</span>
            </button>

            <button
              onClick={onOpenPreferences}
              className={`text-[11px] font-bold border border-[#DEC9B3] ${themeColors.hoverBorder} bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-950 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-3xs`}
            >
              Control Desk
            </button>
          </div>
        </div>

        {/* Message Feeds Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-[#FAF8F5]">
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="h-full flex flex-col items-center justify-center p-6 text-center select-none space-y-5 max-w-2xl mx-auto my-auto py-10" 
              id="mtrini-welcome-dashboard"
            >
              <motion.div 
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.08, duration: 0.25 }}
                className="space-y-2"
              >
                <div className="flex justify-center">
                  <div className="p-3 rounded-2xl bg-white border border-[#DEC9B3] shadow-xs relative group">
                    <Brain className={`w-7 h-7 ${themeColors.text}`} />
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
              </motion.div>

              {/* Module: Code Generation Capabilities */}
              <motion.div 
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.16, duration: 0.25 }}
                className="w-full bg-white border border-[#E6DCD0] rounded-xl p-4.5 text-left space-y-3 shadow-3xs" 
                id="capabilities-card"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 uppercase tracking-wide">
                  <Layers className={`w-4 h-4 ${themeColors.text} shrink-0`} />
                  Code Sandbox Capabilities
                </div>
                <p className="text-[11px] text-neutral-600 leading-relaxed font-sans">
                  Mtrini is designed to compile code, web UI layouts, and specialized automation files. Draft comprehensive single-page apps, scripts, or interface components, and review them instantly side-by-side using the sandbox interface.
                </p>
                
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider font-mono">Test code assistant (Click to populate workspace input):</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset("Generate a fully interactive Starfield canvas simulator in HTML and CSS with particle physics, multiple stars speed tiers, and adjustable warp controls.")}
                      className="p-3 border border-[#EDE8DE] rounded-xl bg-[#FAF9F5] hover:bg-white text-left hover:border-[#DEC9B3] transition-colors cursor-pointer text-neutral-700 hover:text-neutral-900 flex flex-col gap-1 shadow-3xs"
                    >
                      <span className="font-bold text-neutral-950 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-700 animate-pulse" />
                        1. Canvas Starfield Warp Simulator
                      </span>
                      <span className="text-[9.5px] text-neutral-500 leading-normal">High-performance custom particle graphics inside responsive containers.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyPreset("Write a robust event-driven Roblox Luau core server framework. Implement secure memory garbage collection streams and custom Dispatcher events.")}
                      className="p-3 border border-[#EDE8DE] rounded-xl bg-[#FAF9F5] hover:bg-white text-left hover:border-[#DEC9B3] transition-colors cursor-pointer text-neutral-700 hover:text-neutral-900 flex flex-col gap-1 shadow-3xs"
                    >
                      <span className="font-bold text-neutral-950 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                        2. Roblox Luau Dispatcher Framework
                      </span>
                      <span className="text-[9.5px] text-neutral-500 leading-normal">Advanced garbage-collected custom Roblox backend architecture module.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyPreset("Build an elegant, fully responsive Stock Market Trading Simulator widget with interactive charts, mock symbols buy/sell logs, and dynamic filter tags.")}
                      className="p-3 border border-[#EDE8DE] rounded-xl bg-[#FAF9F5] hover:bg-white text-left hover:border-[#DEC9B3] transition-colors cursor-pointer text-neutral-700 hover:text-neutral-900 flex flex-col gap-1 shadow-3xs"
                    >
                      <span className="font-bold text-neutral-950 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        3. stock-trade-simulator.tsx
                      </span>
                      <span className="text-[9.5px] text-neutral-500 leading-normal">Elegant KPI scorecard panel containing beautiful sparkline plots.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyPreset("Create an elegant Algorithmic Sorting Visualizer using HTML Canvas for sorting algorithms (Bubble, Quick, Merge). Include speed slider and array size triggers.")}
                      className="p-3 border border-[#EDE8DE] rounded-xl bg-[#FAF9F5] hover:bg-white text-left hover:border-[#DEC9B3] transition-colors cursor-pointer text-neutral-700 hover:text-neutral-900 flex flex-col gap-1 shadow-3xs"
                    >
                      <span className="font-bold text-neutral-950 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                        4. sorting-visualizer.js
                      </span>
                      <span className="text-[9.5px] text-neutral-500 leading-normal">Interactive educational simulator to observe algorithms sorting in real-time.</span>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Module: Desktop Application Companion */}
              <motion.div
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.24, duration: 0.25 }}
                className="w-full bg-white border border-[#E6DCD0] rounded-xl p-4.5 text-left space-y-3 shadow-3xs"
                id="desktop-downloads-card"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Laptop className={`w-4 h-4 ${themeColors.text} shrink-0`} />
                    Mtrini Desktop Clients
                  </span>
                  <span className={`text-[9px] font-mono ${themeColors.text} bg-neutral-100 ${themeColors.bg} px-2 py-0.5 rounded-lg border ${themeColors.border} uppercase font-bold`}>
                    v1.1.0 Build
                  </span>
                </div>

                <p className="text-[11px] text-neutral-600 leading-relaxed font-sans">
                  Execute code on isolated workspace runtimes, and synchronize local directories securely using our cross-platform desktop companion apps.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 select-none">
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = '/api/download/mtrini?platform=windows';
                    }}
                    className="p-3 border border-[#EDE8DE] hover:border-[#DEC9B3] rounded-lg bg-[#FAF9F5] hover:bg-white text-left transition-all cursor-pointer group flex items-center justify-between shadow-3xs"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-bold text-neutral-900 text-xs">Windows x64</span>
                      <span className="text-[9px] text-neutral-500 font-mono">10 / 11 Desktop</span>
                    </div>
                    <Download className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-900 shrink-0 ml-1 transition-colors" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = '/api/download/mtrini?platform=macos-silicon';
                    }}
                    className="p-3 border border-[#EDE8DE] hover:border-[#DEC9B3] rounded-lg bg-[#FAF9F5] hover:bg-white text-left transition-all cursor-pointer group flex items-center justify-between shadow-3xs"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-bold text-neutral-900 text-xs">macOS M1/M2/M3</span>
                      <span className="text-[9px] text-neutral-500 font-mono">Apple Silicon</span>
                    </div>
                    <Download className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-900 shrink-0 ml-1 transition-colors" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = '/api/download/mtrini?platform=macos-intel';
                    }}
                    className="p-3 border border-[#EDE8DE] hover:border-[#DEC9B3] rounded-lg bg-[#FAF9F5] hover:bg-white text-left transition-all cursor-pointer group flex items-center justify-between shadow-3xs"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-bold text-neutral-900 text-xs">macOS Intel</span>
                      <span className="text-[9px] text-neutral-500 font-mono">Legacy x64 App</span>
                    </div>
                    <Download className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-900 shrink-0 ml-1 transition-colors" />
                  </button>
                </div>
              </motion.div>
            </motion.div>
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
                            type="button"
                            onClick={() => toggleThought(m.id)}
                            className="w-full flex items-center justify-between p-2.5 px-3 bg-[#EAE4D9]/60 text-neutral-800 hover:text-black transition-colors text-xs font-bold font-display uppercase tracking-wide"
                          >
                            <span className="flex items-center gap-1.5 text-neutral-800">
                              <Brain className={`w-3.5 h-3.5 ${themeColors.text}`} />
                              <span>Thinking Process</span>
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
                          className={`mt-4 p-3 bg-white border rounded-xl flex items-center justify-between gap-3 text-xs font-bold hover:border-current ${themeColors.hoverBorder} transition-all cursor-pointer shadow-3xs ${selectedArtifactMessageId === m.id ? `border-current ${themeColors.text}` : 'border-[#DEC9B3] text-neutral-700'}`}
                        >
                          <span className="flex items-center gap-2">
                            <Layers className={`w-4 h-4 ${themeColors.text} animate-pulse`} />
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
                <StreamingThinkingIndicator themeColors={themeColors} />
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Dynamic bottom prompt drawer box */}
        <div className="p-4 bg-[#FAF8F5] border-t border-[#E6DCD0] select-none shrink-0 z-10">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="flex flex-col bg-white border border-[#DEC9B3] rounded-2xl overflow-hidden shadow-sm focus-within:ring-1 focus-within:ring-amber-600 focus-within:border-amber-600 transition-all p-1">
                           {/* PARAMETERS DESK: model engine list and thinking styles */}
              <div className="px-3 py-2 border-b border-[#FAF9F5] bg-[#FAF8F5] flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Model engine display */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9.5px] font-bold text-neutral-500 uppercase tracking-wider">Model:</span>
                    <span className="px-2 py-0.5 bg-white text-neutral-800 font-bold font-mono text-[10px] rounded-lg border border-[#E6DCD0] shadow-3xs">
                      Mtrini v1.0
                    </span>
                  </div>

                  <div className="h-4 w-[1px] bg-[#E6DCD0]" />

                  {/* Thinking mode switcher */}
                  <div className="flex items-center gap-1">
                    <span className="text-[9.5px] font-bold text-neutral-500 uppercase tracking-wider mr-1.5">Thinking Mode:</span>
                    <button
                      type="button"
                      onClick={() => onSelectThinking('fast')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all border ${selectedThinking === 'fast' ? 'bg-white border-[#DEC9B3] text-neutral-900 shadow-3xs' : 'border-transparent text-neutral-400 hover:text-neutral-700'}`}
                    >
                      Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectThinking('deep')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all border flex items-center gap-1 ${selectedThinking === 'deep' ? 'bg-white border-[#DEC9B3] text-neutral-900 shadow-3xs' : 'border-transparent text-neutral-400 hover:text-neutral-700'}`}
                    >
                      <Brain className="w-3 h-3 text-amber-700" />
                      Deep Space
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
                    Halt Compilation
                  </button>
                )}
              </div>

              {/* Central Text Input text area panel */}
              <div className="flex items-start bg-white p-2">
                <textarea
                  placeholder="Ask Mtrini to draft, refactor, or compile custom workspace components..."
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
                  className={`p-2.5 rounded-xl transition-all shrink-0 cursor-pointer mt-1 ${inputValue.trim() && !streaming ? `${themeColors.primary}` : 'bg-neutral-50 text-neutral-300'}`}
                  id="submit-command-btn"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </form>

            {/* Quick Templates Panel */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5 select-none justify-center">
              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider font-mono mr-1">Templates:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset("Write an HTML particle physics canvas banner styled with warm tailwind colors.")}
                className="px-2.5 py-1 border border-[#EDE8DE] hover:border-[#DEC9B3] rounded-lg bg-white hover:bg-neutral-50 text-[10px] text-neutral-600 font-sans cursor-pointer transition-colors shadow-3xs"
              >
                Canvas Banner
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("Write a robust Roblox Luau event-driven modular dispatcher script.")}
                className="px-2.5 py-1 border border-[#EDE8DE] hover:border-[#DEC9B3] rounded-lg bg-white hover:bg-neutral-50 text-[10px] text-neutral-600 font-sans cursor-pointer transition-colors shadow-3xs"
              >
                Roblox Luau Dispatcher
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("Write a modern animated digital clock card with localized timezone selector inside an HTML canvas.")}
                className="px-2.5 py-1 border border-[#EDE8DE] hover:border-[#DEC9B3] rounded-lg bg-white hover:bg-neutral-50 text-[10px] text-neutral-600 font-sans cursor-pointer transition-colors shadow-3xs"
              >
                Digital Clock
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("Compile the interactive Mtrini Studio Video Trailer simulating beautiful kinetic text transitions.")}
                className="px-2.5 py-1 border border-amber-200 hover:border-amber-400 rounded-lg bg-amber-50/50 hover:bg-white text-[10px] text-amber-800 font-bold font-sans cursor-pointer transition-colors shadow-3xs"
              >
                Mtrini Video Trailer
              </button>
            </div>


          </div>
        </div>
      </div>

      {/* 2. Visual rendering Artifact board with smooth sliding animations */}
      <AnimatePresence>
        {activeArtifact && (
          <motion.div
            key={activeArtifact.artifactTitle || 'active-artifact'}
            initial={{ opacity: 0, width: 0, x: 50 }}
            animate={{ opacity: 1, width: isArtifactExpanded ? '100%' : '50%', x: 0 }}
            exit={{ opacity: 0, width: 0, x: 50 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="h-full flex flex-col overflow-hidden shrink-0 z-20 border-l border-[#E5DFD3]"
          >
            <ArtifactView 
              artifact={activeArtifact} 
              onClose={() => setSelectedArtifactMessageId(null)} 
              themeColor={userProfile?.themeColor || 'cyan'}
              isExpanded={isArtifactExpanded}
              onToggleExpand={() => setIsArtifactExpanded(!isArtifactExpanded)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

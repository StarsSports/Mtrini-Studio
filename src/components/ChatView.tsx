import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Terminal, Square, Award, Cpu, Loader2, Image, Layers, ChevronDown, ChevronRight, Brain, Info, Check, Coins, Lock, Gem, Download, Trash2, Plus, Sparkles, Code, Globe
} from 'lucide-react';
import { Message, ThemeColors, UserProfile } from '../types';
import ArtifactView from './ArtifactView';
import { parseMessageArtifacts, parseRobloxToolCall, stripRobloxToolTag } from '../utils';
import StreamingThinkingIndicator from './StreamingThinkingIndicator';

interface ChatViewProps {
  onNewChat: () => void;
  messages: Message[];
  activeChatId: string | null;
  onSendMessage: (content: string) => void;
  streaming: boolean;
  onStopStreaming: () => void;
  userProfile: UserProfile | null;
  themeColors: ThemeColors;
  onOpenPreferences: () => void;
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
  if (thoughtStart === -1) return { thought: '', response: content };
  const closingTag = content.indexOf('</thought>');
  if (closingTag === -1) {
    const thought = content.substring(thoughtStart + 9);
    return { thought, response: '' };
  }
  const thought = content.substring(thoughtStart + 9, closingTag);
  const response = content.substring(closingTag + 10);
  return { thought, response };
}

const MessageItem = React.memo(({ m, isUser, userProfile, themeColors, toggleThought, expandedThoughts, setSelectedArtifactMessageId, selectedArtifactMessageId, isLatest, streaming, isNew }: any) => {
  const { thought, response } = parseMessageThoughts(m.content || '');
  const parsed = parseMessageArtifacts(response);
  const robloxTool = parseRobloxToolCall(response);
  const cleanProse = stripRobloxToolTag(parsed.prose);

  const hasThought = thought.trim().length > 0;
  const isThoughtExpanded = expandedThoughts[m.id] !== false;

  const [execStatus, setExecStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [execOutput, setExecOutput] = useState<string>('');

  const getApiUrl = (endpoint: string) => {
    if (userProfile?.bridgeUrl) {
      return `${userProfile.bridgeUrl.replace(/\/$/, '')}${endpoint}`;
    }
    if (typeof window !== 'undefined' && window.location.hostname.includes('netlify.app')) {
      return `https://ais-pre-2lec2iqt6rhwokfedcy24v-429842933088.europe-west2.run.app${endpoint}`;
    }
    return endpoint;
  };

  const handleExecuteRobloxTool = async () => {
    if (!robloxTool) return;
    setExecStatus('running');
    setExecOutput('');
    try {
      const res = await fetch(getApiUrl('/api/mcp/call'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: userProfile?.mcpServer || 'Roblox_Studio_JSON_STDIO',
          toolName: robloxTool.name,
          arguments: robloxTool.arguments
        })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server returned error status ${res.status}: ${text || 'Unknown endpoint error'}`);
      }

      let result: any;
      try {
        result = await res.json();
      } catch (jsonErr) {
        throw new Error('Server returned custom response, but failed to parse as JSON.');
      }

      if (result.error && !result.success) {
        throw new Error(result.error || result.message || 'Tool execution was rejected or timeout by companion.');
      }
      
      setExecStatus('success');
      // Format response cleanly
      const textOutput = result.content?.[0]?.text || result.output || `Successfully executed ${robloxTool.name}!`;
      setExecOutput(textOutput);
    } catch (err: any) {
      setExecStatus('error');
      setExecOutput(err.message || 'Direct connection gateway link failed. Make sure your local Mtrini Desktop companion is running.');
    }
  };

  useEffect(() => {
    // Only auto-trigger actions if the message is the latest generated message, is from the active session, streaming completed, there is a pending roblox tool tag, and state is idle.
    if (isNew && isLatest && !streaming && robloxTool && execStatus === 'idle') {
      handleExecuteRobloxTool();
    }
  }, [isLatest, streaming, robloxTool, execStatus, isNew]);

  return (
    <div key={m.id} className="flex flex-col w-full space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono px-1 select-none">
        <span className="font-bold text-neutral-700">
          {isUser ? (userProfile?.displayName || 'User Node') : 'Mtrini AI Agent'}
        </span>
        <span>•</span>
        <span>{new Date(m.createdAt?.seconds * 1000 || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <div 
        className={`max-w-[95%] p-4 rounded-2xl text-[13px] leading-relaxed font-sans border transition-all ${isUser ? 'bg-white border-neutral-200 text-neutral-900 rounded-tr-none shadow-3xs self-end' : 'bg-transparent border-transparent text-neutral-800'}`}
      >
        {!isUser && hasThought && (
          <div className="mb-3.5 bg-neutral-100 border border-neutral-200 rounded-xl overflow-hidden shadow-3xs max-w-2xl">
            <button
              type="button"
              onClick={() => toggleThought(m.id)}
              className="w-full flex items-center justify-between p-2.5 px-3 bg-neutral-200/60 text-neutral-800 hover:text-black transition-colors text-xs font-bold font-display uppercase tracking-wide cursor-pointer"
            >
              <span className="flex items-center gap-1.5 text-neutral-800">
                <Brain className={`w-3.5 h-3.5 ${themeColors.text}`} />
                <span>Thinking Process</span>
              </span>
              {isThoughtExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {isThoughtExpanded && (
              <pre className="p-3 bg-white/40 border-t border-neutral-200 text-[10px] text-neutral-500 font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed max-h-48 custom-scrollbar">
                {thought}
              </pre>
            )}
          </div>
        )}

        <div className="whitespace-pre-wrap select-text pr-1 prose leading-relaxed font-sans text-neutral-800">
          {cleanProse}
        </div>

        {/* Beautiful Roblox Live Action Control Panel */}
        {!isUser && robloxTool && (
          <div className="mt-4 p-4 bg-emerald-50/70 border border-emerald-200/85 rounded-2xl shadow-3xs max-w-2xl">
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-xs font-bold font-mono tracking-tight text-emerald-950">
                  ⚡ Roblox Studio Action: <code className="bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-250 text-[11px]">{robloxTool.name}</code>
                </span>
              </div>
              
              {execStatus === 'idle' && (
                <span className="text-[9px] font-mono uppercase bg-emerald-150 border border-emerald-250 px-2 py-0.5 rounded font-bold text-emerald-800 select-none">
                  READY
                </span>
              )}
              {execStatus === 'running' && (
                <span className="text-[9px] font-mono uppercase bg-neutral-100 border text-neutral-600 px-2 py-0.5 rounded font-bold flex items-center gap-1 select-none">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" /> RUNNING
                </span>
              )}
              {execStatus === 'success' && (
                <span className="text-[9px] font-mono uppercase bg-emerald-500 text-white px-2 py-0.5 rounded font-bold select-none shadow-3xs">
                  SUCCESS
                </span>
              )}
              {execStatus === 'error' && (
                <span className="text-[9px] font-mono uppercase bg-rose-600 text-white px-2 py-0.5 rounded font-bold select-none shadow-3xs">
                  FAILED
                </span>
              )}
            </div>

            <p className="text-[11px] text-neutral-600 mb-3 font-sans">
              Mtrini compiled a direct executable payload. Tap below to send this instruction directly into Roblox Studio without pasting scripts manually.
            </p>

            <div className="mb-3.5 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-inner">
              <div className="px-3 py-1 bg-neutral-100/5 text-[9px] text-neutral-400 font-mono uppercase select-none tracking-widest border-b border-neutral-900">
                Action Arguments (JSON)
              </div>
              <pre className="p-3 text-[10.5px] text-emerald-400 font-mono whitespace-pre-wrap overflow-x-auto leading-normal max-h-36 custom-scrollbar select-all bg-neutral-950/80">
                {JSON.stringify(robloxTool.arguments, null, 2)}
              </pre>
            </div>

            {execStatus === 'idle' && (
              <button
                type="button"
                onClick={handleExecuteRobloxTool}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-xs hover:shadow transition-all cursor-pointer"
              >
                Assemble & Spawn directly in Game
              </button>
            )}

            {execStatus === 'running' && (
              <button
                type="button"
                disabled
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-neutral-100 text-neutral-400 font-bold text-xs rounded-xl border select-none"
              >
                <Loader2 className="w-3 h-3 animate-spin text-neutral-500" /> Connecting to Local Roblox Daemon...
              </button>
            )}

            {(execStatus === 'success' || execStatus === 'error') && (
              <div className="space-y-3">
                <div className={`p-3 border rounded-xl text-[11px] font-mono ${execStatus === 'success' ? 'bg-emerald-50 text-emerald-850 border-emerald-150' : 'bg-rose-50 text-rose-850 border-rose-150'} leading-relaxed overflow-x-auto max-h-36 custom-scrollbar select-text`}>
                  <strong className="block mb-1 uppercase tracking-wider text-[9px] select-none font-sans font-bold">
                    {execStatus === 'success' ? '✔ Live Output Logs:' : '⚠ Client Error Report:'}
                  </strong>
                  {execOutput}
                </div>

                <button
                  type="button"
                  onClick={handleExecuteRobloxTool}
                  className="w-full py-1.5 px-3 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-bold text-[10.5px] rounded-lg shadow-3xs transition-colors cursor-pointer"
                >
                  Re-Execute Direct Payload
                </button>
              </div>
            )}
          </div>
        )}

        {parsed.hasArtifact && (
          <div 
            onClick={() => setSelectedArtifactMessageId(m.id)}
            className={`mt-4 p-3 bg-white border rounded-xl flex items-center justify-between gap-3 text-xs font-bold hover:border-current ${themeColors.hoverBorder} transition-all cursor-pointer shadow-3xs ${selectedArtifactMessageId === m.id ? `border-current ${themeColors.text}` : 'border-neutral-200 text-neutral-700'}`}
          >
            <span className="flex items-center gap-2">
              <Layers className={`w-4 h-4 ${themeColors.text} animate-pulse`} />
              <span>Script Bloc: <code className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600 font-semibold">{parsed.artifactTitle}</code></span>
            </span>
            <span className="text-[10px] uppercase font-bold bg-neutral-100 px-2.5 py-1 rounded-lg border border-neutral-200">
              Open Side-by-Side Editor
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

export default function ChatView({
  onNewChat,
  messages,
  activeChatId,
  onSendMessage,
  streaming,
  onStopStreaming,
  userProfile,
  themeColors,
  onOpenPreferences,
  selectedModel,
  onSelectModel,
  selectedThinking,
  onSelectThinking,
  onClearMessages
}: ChatViewProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const [selectedArtifactMessageId, setSelectedArtifactMessageId] = useState<string | null>(null);
  const [isArtifactExpanded, setIsArtifactExpanded] = useState(false);

  // Set of historic message IDs to filter automatic execution on initial loading
  const historicMessageIds = useRef<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!mounted && messages.length > 0) {
      messages.forEach(m => historicMessageIds.current.add(m.id));
      setMounted(true);
    }
  }, [messages, mounted]);

  useEffect(() => {
    historicMessageIds.current.clear();
    setMounted(false);
  }, [activeChatId]);

  // Auto-scroll logic
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streaming]);

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
    setExpandedThoughts(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleApplyPreset = (text: string) => {
    setInputValue(text);
  };

  const handleExportMarkdown = () => {
    if (messages.length === 0) return;
    const markdownContent = messages.map(m => `### ${m.role === 'user' ? 'User Question' : 'Mtrini Response'}\n\n${m.content}\n\n---\n`).join('\n');
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'session.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeMessage = messages.find(m => m.id === selectedArtifactMessageId);
  const activeArtifact = activeMessage ? parseMessageArtifacts(activeMessage.content) : null;

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden ${activeArtifact ? (isArtifactExpanded ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[55%] md:max-w-[50%]') : 'w-full'} transition-all duration-300`}>
      {/* Header Panel */}
      <div className="h-14 border-b border-neutral-200 px-4 bg-neutral-50 flex items-center justify-between shrink-0 select-none shadow-3xs z-10">
        <div className="flex items-center gap-2">
            <Cpu className={`w-4.5 h-4.5 ${themeColors.text}`} />
            <div className="flex flex-col">
              <span className="text-xs font-display font-extrabold tracking-tight uppercase text-neutral-950">Mtrini Code Studio</span>
              <span className="text-[10px] text-neutral-500 font-medium font-sans">Workspace Active</span>
            </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && <button onClick={onNewChat} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-700 text-[11px] font-bold rounded-xl transition-all shadow-3xs duration-150 cursor-pointer"><Plus className="w-3.5 h-3.5" />New Chat</button>}
          {messages.length > 0 && onClearMessages && <button onClick={onClearMessages} className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold rounded-xl transition-all shadow-3xs duration-150 cursor-pointer"><Trash2 className="w-3.5 h-3.5" />Reset</button>}
          {messages.length > 0 && <button onClick={handleExportMarkdown} className={`flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-700 text-[11px] font-bold rounded-xl transition-all shadow-3xs duration-150 cursor-pointer`}><Download className="w-3.5 h-3.5" />Export</button>}
          <button onClick={onOpenPreferences} className={`text-[11px] font-bold border border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-700 px-3 py-1.5 rounded-xl transition-all shadow-3xs duration-150 cursor-pointer`}>Control Desk</button>
        </div>
      </div>

      {/* Main Flow Canvas */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-neutral-50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none space-y-5 max-w-2xl mx-auto py-10">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              <div className="flex justify-center">
                <div className="p-3.5 rounded-2xl bg-white border border-[#DEC9B3] shadow-xs relative">
                  <Brain className={`w-8 h-8 ${themeColors.text}`} />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>
              <h2 className="text-xl font-sans font-extrabold tracking-tight text-neutral-900 uppercase">Welcome to Mtrini Code Studio</h2>
              <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
                Senior developer AI engine powered by advanced intelligence. Select a preset template below or prompt custom workspace commands to draft interactive views and modules.
              </p>
            </motion.div>

            {/* Micro Templates Desk Grid */}
            <motion.div 
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-2"
            >
              <button
                type="button"
                onClick={() => handleApplyPreset("Generate a fully interactive Starfield canvas simulator in HTML and CSS with particle physics, multiple stars speed tiers, and adjustable warp controls.")}
                className="p-3.5 border border-neutral-200 rounded-xl bg-white text-left hover:border-neutral-300 transition-all cursor-pointer text-neutral-700 hover:text-neutral-900 flex flex-col gap-1 shadow-3xs hover:shadow-xs"
              >
                <span className="font-extrabold text-xs text-neutral-950 flex items-center gap-1.5 uppercase">
                  <Code className={`w-3.5 h-3.5 ${themeColors.text}`} />
                  1. Canvas Starfield Warp Simulator
                </span>
                <span className="text-[10px] text-neutral-500 leading-normal">Interactive custom particle astrophysics canvas animation inside a clean card context.</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset("Write a robust event-driven Roblox Luau core server framework. Implement secure memory garbage collection streams and custom Dispatcher events.")}
                className="p-3.5 border border-neutral-200 rounded-xl bg-white text-left hover:border-neutral-300 transition-all cursor-pointer text-neutral-700 hover:text-neutral-900 flex flex-col gap-1 shadow-3xs hover:shadow-xs"
              >
                <span className="font-extrabold text-xs text-neutral-950 flex items-center gap-1.5 uppercase">
                  <Terminal className={`w-3.5 h-3.5 ${themeColors.text}`} />
                  2. Roblox Luau Dispatcher Framework
                </span>
                <span className="text-[10px] text-neutral-500 leading-normal">High-performance custom event scheduler and script pipeline optimized for server environments.</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset("Build an elegant, fully responsive Stock Market Trading Simulator widget with interactive charts, buy/sell log modules, and dynamic filter tags.")}
                className="p-3.5 border border-neutral-200 rounded-xl bg-white text-left hover:border-neutral-300 transition-all cursor-pointer text-neutral-700 hover:text-neutral-900 flex flex-col gap-1 shadow-3xs hover:shadow-xs"
              >
                <span className="font-extrabold text-xs text-neutral-950 flex items-center gap-1.5 uppercase">
                  <Sparkles className={`w-3.5 h-3.5 ${themeColors.text}`} />
                  3. Stock Trading Dashboard
                </span>
                <span className="text-[10px] text-neutral-500 leading-normal">Functional UI showing responsive sparkline indicators, mock orders ledger, and analytics.</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset("Create an elegant Algorithmic Sorting Visualizer using HTML Canvas for sorting algorithms (Bubble, Quick, Merge). Include speed slider and array size triggers.")}
                className="p-3.5 border border-neutral-200 rounded-xl bg-white text-left hover:border-neutral-300 transition-all cursor-pointer text-neutral-700 hover:text-neutral-900 flex flex-col gap-1 shadow-3xs hover:shadow-xs"
              >
                <span className="font-extrabold text-xs text-neutral-950 flex items-center gap-1.5 uppercase">
                  <Globe className={`w-3.5 h-3.5 ${themeColors.text}`} />
                  4. Algorithmic sorting-visualizer
                </span>
                <span className="text-[10px] text-neutral-500 leading-normal">Educational physics utility observing bubble and quicksort passes in real-time.</span>
              </button>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-5 max-w-3xl mx-auto">
            {messages.map((m, index) => (
              <MessageItem 
                key={m.id}
                m={m}
                isUser={m.role === 'user'}
                userProfile={userProfile}
                themeColors={themeColors}
                toggleThought={toggleThought}
                expandedThoughts={expandedThoughts}
                setSelectedArtifactMessageId={setSelectedArtifactMessageId}
                selectedArtifactMessageId={selectedArtifactMessageId}
                isLatest={index === messages.length - 1}
                streaming={streaming}
                isNew={mounted && !historicMessageIds.current.has(m.id)}
              />
            ))}
            {streaming && (
              <StreamingThinkingIndicator themeColors={themeColors} />
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Input controls block */}
      <div className="shrink-0 p-4 border-t border-neutral-200 bg-white">
        {/* Core Input Field formulation row */}
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex flex-col bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs focus-within:ring-1 focus-within:ring-neutral-400 focus-within:border-neutral-400 transition-all p-1">
          {/* Top Panel inside Input - style parameters and indicators */}
          <div className="px-3 py-1.5 bg-neutral-50/50 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-3 text-[10px] text-neutral-500">
            <div className="flex items-center gap-1.5 select-none font-bold uppercase tracking-wider text-neutral-400">
              <span>Engine Status:</span>
              <span className="text-[10px] text-neutral-700 bg-white px-1.5 py-0.5 rounded-md border border-neutral-200 shadow-3xs font-mono font-bold lowercase">
                online_active
              </span>
            </div>

            {streaming && (
              <button
                type="button"
                onClick={onStopStreaming}
                className="text-rose-600 hover:text-rose-700 font-bold px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-1 cursor-pointer transition-colors text-[10px]"
              >
                <Square className="w-2 h-2 fill-current" />
                <span>Halt Compilation</span>
              </button>
            )}
          </div>

          <div className="flex items-start bg-white p-1">
            {/* Attachment picker */}
            <div 
              className="flex flex-col items-center justify-center p-2 border-r border-neutral-200 w-12 hover:bg-neutral-50 transition-colors cursor-pointer select-none"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const content = event.target?.result as string;
                      if (file.type.startsWith('image/')) {
                        setInputValue(prev => prev + `\n\n[IMAGE_UPLOAD: ${file.name}]\n${content}\n[/IMAGE_UPLOAD]\n`);
                      } else {
                        setInputValue(prev => prev + `\n\n[FILE_UPLOAD: ${file.name}]\n${content}\n[/FILE_UPLOAD]\n`);
                      }
                    };
                    if (file.type.startsWith('image/')) {
                      reader.readAsDataURL(file);
                    } else {
                      reader.readAsText(file);
                    }
                  }
                };
                input.click();
              }}
            >
              <Image className="w-4 h-4 text-neutral-500 hover:text-neutral-800" />
              <span className="text-[8px] font-bold mt-1 text-center font-mono tracking-tighter text-neutral-500">Attach</span>
            </div>

            <textarea
              placeholder="Ask Mtrini to draft code, configure scripts, or compile customized views..."
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
              className="flex-1 bg-transparent py-2.5 px-3 text-[12.5px] leading-relaxed placeholder-neutral-400 font-sans focus:outline-none resize-none max-h-36 min-h-[44px] overflow-y-auto custom-scrollbar"
            />
            
            <button
              type="submit"
              disabled={streaming || !inputValue.trim()}
              className={`p-2.5 rounded-xl transition-all shrink-0 cursor-pointer mt-1.5 mr-1 ${inputValue.trim() && !streaming ? `${themeColors.primary} text-white` : 'bg-neutral-50 text-neutral-300'}`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Small templates tags directly under the prompt text box */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5 select-none justify-center">
          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider font-mono mr-1">Templates:</span>
          <button
            type="button"
            onClick={() => handleApplyPreset("Generate a high-performance interactive 2D physics bouncing balls simulator using canvas.")}
            className="px-2.5 py-1 border border-neutral-200 hover:border-neutral-300 rounded-lg bg-neutral-50 hover:bg-white text-[10px] text-neutral-600 font-sans cursor-pointer transition-colors shadow-3xs"
          >
            Physics Sandbox
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset("Build an elegant responsive analog clock visualizer with customizable local sound ticks.")}
            className="px-2.5 py-1 border border-neutral-200 hover:border-neutral-300 rounded-lg bg-neutral-50 hover:bg-white text-[10px] text-neutral-600 font-sans cursor-pointer transition-colors shadow-3xs"
          >
            Analog Clock
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset("Write a robust Roblox modular player movement velocity speed controller in raw Luau.")}
            className="px-2.5 py-1 border border-neutral-200 hover:border-neutral-300 rounded-lg bg-neutral-50 hover:bg-white text-[10px] text-neutral-600 font-sans cursor-pointer transition-colors shadow-3xs"
          >
            Roblox Velocity Controller
          </button>
        </div>
      </div>

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

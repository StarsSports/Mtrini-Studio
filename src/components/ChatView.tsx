import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Terminal, Square, ChevronDown, ChevronRight, Brain, Plus, Trash2, Download, Image, Sparkles, Layers, FileCode
} from 'lucide-react';
import { Message, ThemeColors, UserProfile } from '../types';
import { parseMessageArtifacts } from '../utils';
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
  chatMode: 'mtrini' | 'mtrini-code';
  onSelectChatMode: (mode: 'mtrini' | 'mtrini-code') => void;
  selectedArtifactMessageId: string | null;
  onSelectArtifactMessageId: (msgId: string | null) => void;
  isArtifactExpanded: boolean;
  hasActiveArtifact: boolean;
  darkMode?: boolean;
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

const MessageItem = React.memo(({ 
  m, 
  isUser, 
  userProfile, 
  themeColors, 
  toggleThought, 
  expandedThoughts, 
  setSelectedArtifactMessageId, 
  selectedArtifactMessageId,
  darkMode = true 
}: any) => {
  const { thought, response } = parseMessageThoughts(m.content || '');
  const parsed = parseMessageArtifacts(response);

  const hasThought = thought.trim().length > 0;
  const isThoughtExpanded = expandedThoughts[m.id] !== false;

  // Estimate number of lines for script preview
  const lineCount = parsed.artifactCode ? parsed.artifactCode.split('\n').length : 0;

  return (
    <motion.div 
      key={m.id} 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col w-full space-y-1"
    >
      {/* Sender and time row */}
      <div className={`flex items-center gap-1.5 text-[10px] font-mono px-1 select-none ${darkMode ? 'text-neutral-500' : 'text-neutral-450'}`}>
        <span className={`font-bold ${darkMode ? 'text-neutral-300' : 'text-neutral-700'}`}>
          {isUser ? (userProfile?.preferredName || userProfile?.displayName || 'User Node') : 'Mtrini'}
        </span>
        <span>•</span>
        <span>{new Date(m.createdAt?.seconds * 1050 || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      {/* Bubble Shell */}
      <div 
        className={`max-w-[95%] p-4 rounded-2xl text-[13px] leading-relaxed font-sans border transition-all ${
          isUser 
            ? (darkMode 
                ? 'bg-neutral-900 border-neutral-800 text-neutral-100 rounded-tr-none shadow-sm self-end' 
                : 'bg-neutral-200 border-neutral-300 text-neutral-900 rounded-tr-none shadow-sm self-end'
              ) 
            : 'bg-transparent border-transparent text-neutral-800'
        }`}
      >
        {/* Thinking block if AI response */}
        {!isUser && hasThought && (
          <div className={`mb-3.5 border rounded-xl overflow-hidden shadow-sm max-w-2xl transition-all duration-200 ${
            darkMode ? 'bg-[#0f0f12] border-neutral-800' : 'bg-neutral-100 border-neutral-250'
          }`}>
            <button
              type="button"
              onClick={() => toggleThought(m.id)}
              className={`w-full flex items-center justify-between p-2.5 px-3 transition-colors text-xs font-bold uppercase tracking-wide cursor-pointer ${
                darkMode ? 'bg-neutral-950/80 text-neutral-300 hover:text-white' : 'bg-neutral-200/50 text-neutral-750 hover:text-neutral-900'
              }`}
            >
              <span className="flex items-center gap-1.5 font-bold">
                <Brain className={`w-3.5 h-3.5 ${themeColors.text}`} />
                <span>Thinking Process</span>
              </span>
              {isThoughtExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {isThoughtExpanded && (
              <pre className={`p-3 border-t text-[10px] font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed max-h-48 custom-scrollbar ${
                darkMode ? 'bg-neutral-950/65 border-neutral-800 text-neutral-400' : 'bg-white border-neutral-200 text-neutral-600'
              }`}>
                {thought}
              </pre>
            )}
          </div>
        )}

        {/* Prose text rendering */}
        <div className={`whitespace-pre-wrap select-text pr-1 prose leading-relaxed font-sans ${
          darkMode ? 'text-neutral-200' : 'text-neutral-800'
        }`}>
          {parsed.prose}
        </div>

        {/* Clicking opens the overlay Script Viewer! */}
        {parsed.hasArtifact && (
          <div 
            onClick={() => setSelectedArtifactMessageId(m.id)}
            className={`mt-4 p-4 border rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-200 cursor-pointer shadow-3xs hover:scale-[1.01] active:scale-[0.99] ${
              selectedArtifactMessageId === m.id 
                ? (darkMode ? 'bg-neutral-900 border-cyan-500 shadow-cyan-950/10' : 'bg-neutral-50 border-indigo-500 shadow-indigo-100')
                : (darkMode ? 'bg-[#111114] border-neutral-800 hover:border-neutral-750' : 'bg-white border-neutral-250 hover:bg-neutral-50 hover:border-neutral-350')
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-3 rounded-lg shrink-0 flex items-center justify-center border transition-all ${
                darkMode ? 'bg-neutral-950 border-neutral-800 text-cyan-400' : 'bg-neutral-105 border-neutral-250 text-indigo-600'
              }`}>
                <FileCode className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-xs font-extrabold font-mono tracking-tight ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                    {parsed.artifactTitle}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase tracking-wider ${
                    darkMode ? 'bg-neutral-900 text-neutral-400' : 'bg-neutral-200 text-neutral-600'
                  }`}>
                    {parsed.artifactLanguage}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 leading-snug">
                  Drafted with {lineCount} lines of executable instructions. Click to open Script Viewer.
                </p>
              </div>
            </div>

            <button
              type="button"
              className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all w-full md:w-auto justify-center ${
                darkMode 
                  ? 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:text-white hover:border-neutral-700' 
                  : 'bg-neutral-100 text-neutral-750 border-neutral-250 hover:bg-neutral-200 hover:text-neutral-900 shadow-3xs'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Launch Script View</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
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
  onClearMessages,
  chatMode,
  onSelectChatMode,
  selectedArtifactMessageId,
  onSelectArtifactMessageId,
  isArtifactExpanded,
  hasActiveArtifact,
  darkMode = true
}: ChatViewProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});

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
    onSelectArtifactMessageId(null);
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

  // We no longer compress the chat view to 50% since we open the beautiful code inside the floating modal overlay!
  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden w-full transition-all duration-300`}>
      
      {/* Header Panel */}
      <div className={`h-14 border-b px-4 flex items-center justify-between shrink-0 select-none shadow-3xs z-10 transition-colors duration-200 ${
        darkMode ? 'border-neutral-900 bg-[#0d0d0f]' : 'border-neutral-200 bg-neutral-100/70'
      }`}>
        <div className={`flex items-center gap-1.5 p-0.5 border rounded-xl select-none transition-all ${
          darkMode ? 'bg-neutral-950 border-neutral-850' : 'bg-neutral-200/50 border-neutral-250'
        }`}>
          <button
            type="button"
            onClick={() => onSelectChatMode('mtrini')}
            className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
              chatMode === 'mtrini' 
                ? (darkMode ? 'bg-neutral-800 text-white shadow-sm' : 'bg-white text-neutral-900 shadow-sm') 
                : 'text-neutral-500 hover:text-neutral-100'
            }`}
          >
            Mtrini
          </button>
          <button
            type="button"
            onClick={() => onSelectChatMode('mtrini-code')}
            className={`px-3.5 py-1 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-1 ${
              chatMode === 'mtrini-code' 
                ? (darkMode ? 'bg-neutral-800 text-white shadow-sm' : 'bg-white text-neutral-900 shadow-sm') 
                : 'text-neutral-500 hover:text-neutral-100'
            }`}
          >
            <span>Mtrini Code</span>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button 
              onClick={onNewChat} 
              className={`flex items-center gap-1.5 px-3 py-1.5 border text-[11px] font-bold rounded-xl transition-all shadow-3xs duration-150 cursor-pointer ${
                darkMode 
                  ? 'bg-neutral-900 border-neutral-800 hover:bg-neutral-850 text-neutral-300' 
                  : 'bg-white border-neutral-250 hover:bg-neutral-100 text-neutral-750'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              New Chat
            </button>
          )}
          {messages.length > 0 && onClearMessages && (
            <button 
              onClick={onClearMessages} 
              className={`flex items-center gap-1.5 px-3 py-1.5 border text-rose-500 text-[11px] font-bold rounded-xl transition-all shadow-3xs duration-150 cursor-pointer ${
                darkMode 
                  ? 'bg-neutral-900/40 border-rose-950 hover:bg-rose-950/20 text-rose-400' 
                  : 'bg-white border-red-200 hover:bg-red-50 text-rose-600'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
          {messages.length > 0 && (
            <button 
              onClick={handleExportMarkdown} 
              className={`flex items-center gap-1.5 px-3 py-1.5 border text-[11px] font-bold rounded-xl transition-all shadow-3xs duration-150 cursor-pointer ${
                darkMode 
                  ? 'bg-neutral-900 border-neutral-800 hover:bg-neutral-850 text-neutral-300' 
                  : 'bg-white border-neutral-250 hover:bg-neutral-100 text-neutral-750'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          )}
          <button 
            onClick={onOpenPreferences} 
            className={`text-[11px] font-bold border px-3 py-1.5 rounded-xl transition-all shadow-3xs duration-150 cursor-pointer ${
              darkMode 
                ? 'bg-neutral-900 border-neutral-800 text-neutral-350 hover:bg-neutral-850 hover:text-white' 
                : 'bg-white border-neutral-250 text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            Tools
          </button>
        </div>
      </div>

      {/* Main Flow Canvas */}
      <div className={`flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar transition-colors duration-200 ${
        darkMode ? 'bg-neutral-950' : 'bg-[#fafaf8]'
      }`}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none space-y-5 max-w-xl mx-auto py-16">
            <motion.div 
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="space-y-4"
            >
              <div className="flex justify-center">
                <motion.div 
                  initial={{ rotate: -15, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1, stiffness: 200, damping: 15 }}
                  className={`p-4 border rounded-2xl shadow-xl relative ${
                    darkMode ? 'bg-neutral-900 border-neutral-850' : 'bg-white border-neutral-250 shadow-sm'
                  }`}
                >
                  <Sparkles className={`w-8 h-8 ${themeColors.text} animate-pulse`} />
                </motion.div>
              </div>
              <h2 className={`text-2xl font-sans font-extrabold tracking-tight leading-tight ${
                darkMode ? 'text-white' : 'text-neutral-900'
              }`}>
                Welcome, {userProfile?.preferredName || userProfile?.displayName || 'User'}
              </h2>
              <p className="text-xs text-neutral-450 max-w-sm mx-auto leading-relaxed">
                {chatMode === 'mtrini-code' 
                  ? "Mtrini Code Mode is currently active. Ask me about system designs, complex file code, algorithms, or web layouts. I am fully optimized to build, compile, and refine."
                  : "Mtrini Mode is currently active. Ask questions, brainstorm concepts, translate ideas, or have everyday creative discussions."}
              </p>
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
                setSelectedArtifactMessageId={onSelectArtifactMessageId}
                selectedArtifactMessageId={selectedArtifactMessageId}
                isLatest={index === messages.length - 1}
                streaming={streaming}
                isNew={mounted && !historicMessageIds.current.has(m.id)}
                darkMode={darkMode}
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
      <div className={`shrink-0 p-4 border-t transition-colors duration-200 ${
        darkMode ? 'border-neutral-900 bg-neutral-950' : 'border-neutral-200 bg-[#fbfbf9]'
      }`}>
        <form onSubmit={handleSubmit} className={`max-w-3xl mx-auto flex flex-col border rounded-2xl overflow-hidden shadow-xs focus-within:ring-1 transition-all p-1 ${
          darkMode 
            ? 'bg-neutral-900 border-neutral-850 focus-within:ring-neutral-700 focus-within:border-neutral-700' 
            : 'bg-white border-neutral-300 focus-within:ring-neutral-400 focus-within:border-neutral-400 shadow-3xs'
        }`}>
          {streaming && (
            <div className={`px-3 py-1.5 border-b flex items-center justify-end select-none ${
              darkMode ? 'bg-neutral-950/50 border-neutral-850' : 'bg-neutral-50 border-neutral-200'
            }`}>
              <button
                type="button"
                onClick={onStopStreaming}
                className="text-rose-400 hover:text-rose-300 font-bold px-2 py-1 rounded-lg bg-rose-955/20 border border-rose-950 flex items-center gap-1 cursor-pointer transition-colors text-[10px]"
              >
                <Square className="w-2.5 h-2.5 fill-current" />
                <span>Halt Compilation</span>
              </button>
            </div>
          )}

          <div className="flex items-start p-1">
            <div 
              className={`flex flex-col items-center justify-center p-2 border-r w-12 hover:bg-neutral-50/10 transition-colors cursor-pointer select-none ${
                darkMode ? 'border-neutral-800' : 'border-neutral-200 hover:bg-neutral-100'
              }`}
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
              <Image className={`w-4 h-4 ${darkMode ? 'text-neutral-400' : 'text-neutral-550'}`} />
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
              className={`flex-1 bg-transparent py-2.5 px-3 text-[12.5px] leading-relaxed placeholder-neutral-500 font-sans focus:outline-none resize-none max-h-36 min-h-[44px] overflow-y-auto custom-scrollbar ${
                darkMode ? 'text-white' : 'text-neutral-900'
              }`}
            />
            
            <button
              type="submit"
              disabled={streaming || !inputValue.trim()}
              className={`p-2.5 rounded-xl transition-all shrink-0 cursor-pointer mt-1.5 mr-1 ${
                inputValue.trim() && !streaming 
                  ? (darkMode ? `bg-white text-neutral-950 font-bold` : 'bg-neutral-950 text-white font-bold') 
                  : (darkMode ? 'bg-neutral-955 text-neutral-700' : 'bg-neutral-100 text-neutral-350')
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}

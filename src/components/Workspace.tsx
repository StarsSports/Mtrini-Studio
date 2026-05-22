import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Terminal, Square, Award, Cpu, Loader2, Image, Layers, ChevronDown, ChevronRight, HelpCircle, Brain, Info, Check, Coins, Lock, Gem, Laptop, Download, Trash2, Plus
} from 'lucide-react';
import { Message, ThemeColors, UserProfile, ViewType } from '../types';
import ArtifactView from './ArtifactView';
import { parseMessageArtifacts } from '../utils';
import StreamingThinkingIndicator from './StreamingThinkingIndicator';
import NotesView from './NotesView';
import ChatView from './ChatView';

interface WorkspaceProps {
  onNewChat: () => void;
  activeView: ViewType;
  messages: Message[];
  activeChatId: string | null;
  onSendMessage: (content: string) => void;
  streaming: boolean;
  onStopStreaming: () => void;
  userProfile: UserProfile | null;
  themeColors: ThemeColors;
  onOpenPreferences: () => void;
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
  onNewChat,
  activeView,
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
    <div className="flex-1 flex overflow-hidden bg-neutral-50 font-sans h-full text-neutral-900">
      {activeView === 'notes' ? (
        <NotesView userProfile={userProfile} themeColors={themeColors} />
      ) : (
        <ChatView
          onNewChat={onNewChat}
          messages={messages}
          activeChatId={activeChatId}
          onSendMessage={onSendMessage}
          streaming={streaming}
          onStopStreaming={onStopStreaming}
          userProfile={userProfile}
          themeColors={themeColors}
          onOpenPreferences={onOpenPreferences}
          selectedModel={selectedModel}
          onSelectModel={onSelectModel}
          selectedThinking={selectedThinking}
          onSelectThinking={onSelectThinking}
          onClearMessages={onClearMessages}
        />
      )}
    </div>
  );
}
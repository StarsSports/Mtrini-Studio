import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Message, ThemeColors, UserProfile, ViewType } from '../types';
import ArtifactView from './ArtifactView';
import { parseMessageArtifacts } from '../utils';
import NotesView from './NotesView';
import ChatView from './ChatView';
import ToolsView from './ToolsView';

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
  selectedModel: 'mtrini_1_0' | 'mtrini_1_1';
  onSelectModel: (model: 'mtrini_1_0' | 'mtrini_1_1') => void;
  selectedThinking: 'fast' | 'deep' | 'short';
  onSelectThinking: (style: 'fast' | 'deep' | 'short') => void;
  onClearMessages?: () => void;
  chatMode: 'mtrini' | 'mtrini-code';
  onSelectChatMode: (mode: 'mtrini' | 'mtrini-code') => void;
  selectedArtifactMessageId: string | null;
  onSelectArtifactMessageId: (msgId: string | null) => void;
  darkMode?: boolean;
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
  onClearMessages,
  chatMode,
  onSelectChatMode,
  selectedArtifactMessageId,
  onSelectArtifactMessageId,
  darkMode = true
}: WorkspaceProps) {
  const [isArtifactExpanded, setIsArtifactExpanded] = useState(false);

  // Clear active artifact view when changing chat threads
  useEffect(() => {
    onSelectArtifactMessageId(null);
    setIsArtifactExpanded(false);
  }, [activeChatId]);

  const activeMessage = messages.find((m) => m.id === selectedArtifactMessageId);
  const activeArtifact = activeMessage ? parseMessageArtifacts(activeMessage.content) : null;

  return (
    <div className={`flex-1 flex overflow-hidden font-sans h-full relative w-full transition-colors duration-200 ${
      darkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-[#fafaf8] text-neutral-900'
    }`}>
      {activeView === 'notes' ? (
        <NotesView userProfile={userProfile} themeColors={themeColors} darkMode={darkMode} />
      ) : activeView === 'tools' ? (
        <ToolsView userProfile={userProfile} themeColors={themeColors} darkMode={darkMode} onOpenPreferences={onOpenPreferences} />
      ) : (
        <div className="flex-1 flex flex-row overflow-hidden h-full w-full relative">
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
            chatMode={chatMode}
            onSelectChatMode={onSelectChatMode}
            selectedArtifactMessageId={selectedArtifactMessageId}
            onSelectArtifactMessageId={onSelectArtifactMessageId}
            isArtifactExpanded={isArtifactExpanded}
            hasActiveArtifact={!!activeArtifact}
            darkMode={darkMode}
          />
          
          {/* Floating/Overlay Script Viewer Modal Window */}
          <AnimatePresence>
            {activeArtifact && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/70 backdrop-blur-xs">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    y: 0,
                    width: isArtifactExpanded ? '100vw' : '85vw',
                    height: isArtifactExpanded ? '100vh' : '85vh',
                    maxWidth: isArtifactExpanded ? '100vw' : '1500px',
                    maxHeight: isArtifactExpanded ? '100vh' : '900px'
                  }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                  className={`flex flex-col overflow-hidden border shadow-2xl transition-all duration-200 ${
                    isArtifactExpanded ? 'm-0 rounded-none' : 'rounded-2xl'
                  } ${
                    darkMode ? 'bg-neutral-900 border-neutral-850' : 'bg-white border-neutral-250'
                  }`}
                >
                  <ArtifactView 
                    artifact={activeArtifact} 
                    onClose={() => onSelectArtifactMessageId(null)} 
                    themeColor={userProfile?.themeColor || 'cyan'}
                    isExpanded={isArtifactExpanded}
                    onToggleExpand={() => setIsArtifactExpanded(!isArtifactExpanded)}
                    darkMode={darkMode}
                  />
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

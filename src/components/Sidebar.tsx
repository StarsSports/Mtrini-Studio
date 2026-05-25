import React from 'react';
import { motion } from 'motion/react';
import { 
  MessageSquare, Plus, LogOut, Settings, Terminal, Trash2, Sparkles, Sun, Moon
} from 'lucide-react';
import { ChatThread, UserProfile, ThemeColors, ViewType } from '../types';

interface SidebarProps {
  chatThreads: ChatThread[];
  activeChatId: string | null;
  activeView: ViewType;
  onSelectChat: (id: string) => void;
  onSelectView: (view: ViewType) => void;
  onNewChat: () => void;
  onLogout: () => void;
  onOpenPreferences: () => void;
  onOpenStartMenu: () => void;
  userProfile: UserProfile | null;
  themeColors: ThemeColors;
  onDeleteChat?: (id: string) => void;
  darkMode: boolean;
  onToggleThemeMode: () => void;
}

export default function Sidebar({
  chatThreads,
  activeChatId,
  activeView,
  onSelectChat,
  onSelectView,
  onNewChat,
  onLogout,
  onOpenPreferences,
  onOpenStartMenu,
  userProfile,
  themeColors,
  onDeleteChat,
  darkMode,
  onToggleThemeMode
}: SidebarProps) {
  return (
    <div className={`w-64 border-r flex flex-col h-full font-sans select-none z-20 shrink-0 transition-all duration-200 ${
      darkMode 
        ? 'bg-[#0d0d0f] border-neutral-900 text-neutral-300' 
        : 'bg-neutral-100 border-neutral-200 text-neutral-700'
    }`}>
      
      {/* App Header Banner */}
      <div className={`p-4 border-b flex items-center justify-between transition-all duration-200 ${
        darkMode ? 'border-neutral-900 bg-neutral-950/40' : 'border-neutral-200 bg-neutral-200/50'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl border flex items-center justify-center shadow-xs transition-all duration-200 ${
            darkMode ? 'bg-neutral-900 border-neutral-800 text-neutral-100' : 'bg-white border-neutral-300 text-neutral-900'
          }`}>
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <span className={`font-sans font-semibold text-sm tracking-tight block transition-all duration-200 ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
              Mtrini Studio
            </span>
          </div>
        </div>

        {/* Global Sun/Moon Toggle */}
        <button
          onClick={onToggleThemeMode}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center ${
            darkMode 
              ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-amber-400' 
              : 'bg-white hover:bg-neutral-50 border-neutral-300 text-indigo-600 shadow-3xs'
          }`}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          id="btn-toggle-theme"
        >
          {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Primary Action Buttons */}
      <div className="px-3 pb-2 flex gap-1.5 pt-3">
        <button
          onClick={onNewChat}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-98 shadow-sm ${
            darkMode ? 'bg-white text-neutral-950 hover:bg-neutral-200' : 'bg-neutral-900 hover:bg-neutral-800 text-white'
          }`}
          id="btn-new-chat-sidebar"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5px] shrink-0" />
          <span>New Chat</span>
        </button>
        <button
          onClick={onOpenStartMenu}
          className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-3xs ${
            darkMode 
              ? 'bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 text-neutral-200 hover:border-neutral-700' 
              : 'bg-white border border-neutral-250 hover:bg-neutral-50 text-neutral-800 hover:border-neutral-300'
          }`}
          title="Configure Mtrini Setup"
          id="btn-start-guide-sidebar"
        >
          <Sparkles className={`w-3.5 h-3.5 shrink-0 ${darkMode ? 'text-neutral-300' : 'text-neutral-600'}`} />
          <span>Setup</span>
        </button>
      </div>

      {/* Threads Section */}
      <div className="px-4 py-2 mt-2 text-[10px] font-bold tracking-wider text-neutral-500 uppercase flex items-center justify-between">
        <div className="flex items-center gap-2">
           <button 
             onClick={() => onSelectView('chat')}
             className={activeView === 'chat' ? (darkMode ? 'text-white' : 'text-neutral-900') : 'text-neutral-550 hover:text-white'}>
              Recent Chats
           </button>
           <span className="text-neutral-500">/</span>
           <button 
             onClick={() => onSelectView('notes')}
             className={activeView === 'notes' ? (darkMode ? 'text-white' : 'text-neutral-900') : 'text-neutral-550 hover:text-white'}>
              Notes
           </button>
        </div>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${darkMode ? 'bg-neutral-900 border border-neutral-805 text-neutral-450' : 'bg-neutral-200 text-neutral-700'}`}>
          {activeView === 'chat' ? chatThreads.length : '...'}
        </span>
      </div>

      {/* Scrollable Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 custom-scrollbar">
        {chatThreads.length === 0 ? (
          <div className="py-8 px-4 text-center text-[11px] text-neutral-500 font-sans italic leading-normal">
            Your conversations will be saved here.
          </div>
        ) : (
          chatThreads.map((thread, index) => {
            const isActive = thread.id === activeChatId;
            return (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.05, 0.3) }}
                key={thread.id}
                className="group/item relative flex items-center w-full"
              >
                <button
                  type="button"
                  onClick={() => onSelectChat(thread.id)}
                  className={`flex-1 text-left p-2.5 rounded-lg text-xs font-medium tracking-wide flex items-center gap-2 transition-all cursor-pointer ${
                    isActive 
                      ? (darkMode 
                          ? 'bg-neutral-900 text-white border border-neutral-800 font-bold shadow-3xs pr-8' 
                          : 'bg-neutral-250 text-neutral-905 font-bold shadow-3xs pr-8'
                        ) 
                      : (darkMode 
                          ? 'text-neutral-400 hover:bg-neutral-900/40 hover:text-neutral-100 pr-8' 
                          : 'text-neutral-600 hover:bg-neutral-200/50 hover:text-neutral-900 pr-8'
                        )
                  }`}
                  id={`thread-item-${thread.id}`}
                >
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? (darkMode ? 'text-white' : 'text-neutral-900') : 'text-neutral-450'}`} />
                  <span className="truncate flex-1 pr-1">{thread.title}</span>
                </button>
                {onDeleteChat && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Are you sure you want to delete this session thread?")) {
                        onDeleteChat(thread.id);
                      }
                    }}
                    className="absolute right-2 opacity-0 group-hover/item:opacity-100 p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-rose-400 transition-all cursor-pointer"
                    title="Delete session thread"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                 )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Footer Profile Desk */}
      <div className={`p-3 border-t flex flex-col gap-2.5 ${darkMode ? 'bg-neutral-950/40 border-neutral-900' : 'bg-neutral-200/30 border-neutral-200'}`}>
        <div className={`flex items-center gap-2.5 p-2 rounded-xl shadow-3xs border ${darkMode ? 'bg-neutral-900 border-neutral-850' : 'bg-white border-neutral-250'}`}>
          <div className="relative shrink-0">
            <img 
              src={userProfile?.avatarUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&q=80"} 
              alt="Avatar" 
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-lg object-cover border border-neutral-700"
            />
            <span className="absolute bottom-[-1px] right-[-1px] w-2.5 h-2.5 bg-emerald-500 rounded-full border border-neutral-950" />
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <span className={`text-xs font-bold truncate leading-tight flex items-center gap-1 ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
              {userProfile?.displayName || "Guest User"}
            </span>
            <span className="text-[10px] text-neutral-500 truncate leading-tight">
              {userProfile?.email || "sandbox@mtrini.sh"}
            </span>
          </div>
        </div>

        {/* Action Toggles */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenPreferences}
            className={`flex items-center justify-center gap-1.5 py-1.5 border rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-3xs ${
              darkMode 
                ? 'bg-neutral-900 hover:bg-neutral-800 border-neutral-850 text-neutral-300 hover:text-white' 
                : 'bg-white hover:bg-neutral-50 border-neutral-250 text-neutral-700 hover:text-neutral-900'
            }`}
            id="sidebar-settings-btn"
          >
            <Settings className="w-3.5 h-3.5 text-neutral-450" />
            Tools
          </button>
          
          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-1.5 py-1.5 hover:bg-neutral-900/10 text-neutral-550 hover:text-rose-400 border border-transparent rounded-lg text-[10px] font-bold transition-all cursor-pointer"
            id="sidebar-logout-btn"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

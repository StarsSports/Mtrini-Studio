import React from 'react';
import { motion } from 'motion/react';
import { 
  MessageSquare, Plus, LogOut, Settings, Award, Terminal, Trash2, Cpu, Sparkles, Laptop, ShieldCheck
} from 'lucide-react';
import { ChatThread, UserProfile, ThemeColors } from '../types';

interface SidebarProps {
  chatThreads: ChatThread[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onLogout: () => void;
  onOpenPreferences: () => void;
  onOpenPremiumHub: () => void;
  onOpenStartMenu: () => void;
  userProfile: UserProfile | null;
  themeColors: ThemeColors;
  onDeleteChat?: (id: string) => void;
}

export default function Sidebar({
  chatThreads,
  activeChatId,
  onSelectChat,
  onNewChat,
  onLogout,
  onOpenPreferences,
  onOpenPremiumHub,
  onOpenStartMenu,
  userProfile,
  themeColors,
  onDeleteChat
}: SidebarProps) {
  const isPremium = userProfile?.isPremiumActive ?? false;

  return (
    <div className="w-64 bg-[#EFECE6] border-r border-[#DEC9B3]/40 flex flex-col h-full font-sans select-none z-20 shrink-0 text-neutral-800">
      
      {/* App Header Banner */}
      <div className="p-4 border-b border-[#E6DCD0] flex flex-col gap-2.5 bg-[#EAE4D9]">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${themeColors.bg} border ${themeColors.border} flex items-center justify-center shadow-xs`}>
            <Terminal className={`w-4 h-4 ${themeColors.text}`} />
          </div>
          <div>
            <span className="font-sans font-extrabold text-sm text-neutral-950 tracking-tight block">
              Mtrini Studio
            </span>
            <span className="text-[10px] text-neutral-500 font-medium">
              Interactive Web Compiler
            </span>
          </div>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="px-3 pb-2 flex gap-1.5">
        <button
          onClick={onNewChat}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold ${themeColors.primary} transition-all cursor-pointer active:scale-98`}
          id="btn-new-chat-sidebar"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5px] shrink-0" />
          <span>New Chat</span>
        </button>
        <button
          onClick={onOpenStartMenu}
          className={`py-2 px-2.5 bg-white border border-[#E6DCD0] hover:bg-[#FAF8F5] text-neutral-800 rounded-xl text-xs font-bold transition-all ${themeColors.hoverBorder} flex items-center justify-center gap-1 cursor-pointer shadow-3xs`}
          title="Onboarding & Start Guide Menu"
          id="btn-start-guide-sidebar"
        >
          <Sparkles className={`w-3.5 h-3.5 ${themeColors.text} shrink-0`} />
          <span>Guide</span>
        </button>
      </div>

      {/* Threads Section */}
      <div className="px-4 py-2 mt-2 text-[10px] font-bold tracking-wider text-[#8C7B65] uppercase flex items-center justify-between">
        <span>Recent Chats</span>
        <span className="text-[9px] font-bold bg-[#E6DCD0] text-[#5C4F3E] px-1.5 py-0.5 rounded">
          {chatThreads.length}
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
                  className={`flex-1 text-left p-2.5 rounded-lg text-xs font-medium tracking-wide flex items-center gap-2 transition-all cursor-pointer ${isActive ? 'bg-white text-neutral-950 border border-[#E6DCD0] font-bold shadow-3xs pr-8' : 'text-neutral-600 hover:bg-white/50 hover:text-neutral-950 pr-8'}`}
                  id={`thread-item-${thread.id}`}
                >
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-805 text-amber-700' : 'text-neutral-400 group-hover/item:text-neutral-500'}`} />
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
                    className="absolute right-2 opacity-0 group-hover/item:opacity-100 p-1 hover:bg-[#FAF8F5] rounded text-neutral-400 hover:text-rose-600 transition-all cursor-pointer"
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

      {/* Desktop App Download Prompt */}
      <div className="px-3 pb-2 pt-1 select-none">
        <button
          onClick={onOpenPremiumHub}
          className={`w-full py-2 px-3 border border-[#DEC9B3]/70 ${themeColors.hoverBorder} rounded-xl bg-white hover:bg-neutral-50/50 text-neutral-800 font-bold text-xs transition-all cursor-pointer shadow-3xs flex items-center justify-between group`}
          title="Download Windows and Mac Desktop Applications"
        >
          <div className="flex items-center gap-2">
            <Laptop className={`w-4 h-4 ${themeColors.text} shrink-0`} />
            <span className="text-left leading-tight text-neutral-800 group-hover:text-neutral-950 block">Mtrini Desktop</span>
          </div>
          <span className={`text-[9px] ${themeColors.text} ${themeColors.bg} group-hover:opacity-90 px-1.5 py-0.5 rounded font-mono uppercase font-bold tracking-tight border ${themeColors.border}`}>
            Win/Mac
          </span>
        </button>
      </div>

      {/* Footer Profile Desk */}
      <div className="p-3 bg-[#E5DCD0]/60 border-t border-[#DEC9B3]/40 flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5 bg-white/80 p-2 rounded-xl border border-[#DEC9B3]/35 shadow-3xs">
          
          <div className="relative shrink-0">
            <img 
              src={userProfile?.avatarUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&q=80"} 
              alt="Avatar" 
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-lg object-cover border border-[#DDD5C5]"
            />
            <span className="absolute bottom-[-1px] right-[-1px] w-2.5 h-2.5 bg-emerald-600 rounded-full border border-white" />
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-bold text-neutral-950 truncate leading-tight flex items-center gap-1">
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
            className="flex items-center justify-center gap-1.5 py-1.5 bg-white hover:bg-[#FAF8F5] border border-[#DEC9B3]/40 rounded-lg text-[10px] font-bold text-neutral-700 transition-all cursor-pointer shadow-3xs hover:text-neutral-900"
            id="sidebar-settings-btn"
          >
            <Settings className="w-3 h-3 text-neutral-500" />
            Settings
          </button>
          
          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-1.5 py-1.5 hover:bg-[#FAF8F5]/80 text-neutral-500 hover:text-rose-700 border border-transparent hover:border-rose-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
            id="sidebar-logout-btn"
          >
            <LogOut className="w-3 h-3" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

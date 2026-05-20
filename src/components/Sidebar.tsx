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
  userProfile: UserProfile | null;
  themeColors: ThemeColors;
}

export default function Sidebar({
  chatThreads,
  activeChatId,
  onSelectChat,
  onNewChat,
  onLogout,
  onOpenPreferences,
  onOpenPremiumHub,
  userProfile,
  themeColors
}: SidebarProps) {
  const isPremium = userProfile?.isPremiumActive ?? false;

  return (
    <div className="w-64 bg-[#EFECE6] border-r border-[#DEC9B3]/40 flex flex-col h-full font-sans select-none z-20 shrink-0 text-neutral-800">
      
      {/* Editorial Moroccan App Header Banner */}
      <div className="p-4 border-b border-[#E6DCD0] flex flex-col gap-2.5 bg-[#EAE4D9]">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#C2410C]/10 border border-[#C2410C]/20 flex items-center justify-center shadow-xs">
            <Terminal className="w-4 h-4 text-[#C2410C]" />
          </div>
          <div>
            <span className="font-display font-extrabold text-sm text-neutral-950 tracking-tight block">
              MTRINI STUDIO
            </span>
            <span className="text-[9px] font-mono tracking-widest text-[#8C7A63] uppercase flex items-center gap-1">
              <Laptop className="w-2.5 h-2.5 text-amber-900 shrink-0" />
              Windows Desktop Client
            </span>
          </div>
        </div>
        
        {/* Moroccan Craft Ribbon */}
        <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/70 border border-[#DDD5C5] text-[10px] font-semibold text-[#8a5b1c]">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5 text-amber-700 shrink-0 animate-spin" style={{ animationDuration: '6s' }} />
            Mtrini Client
          </span>
          <span className="font-mono text-[9px] text-[#A16207]">v1.1.0</span>
        </div>
      </div>

      {/* Credits Balance Wallet Box (New credits trigger button) */}
      <div className="p-3">
        <button
          onClick={onOpenPremiumHub}
          className="w-full text-left p-3 rounded-xl bg-white border border-[#E6DCD0] hover:border-orange-600 hover:shadow-2xs transition-all cursor-pointer group flex flex-col gap-1.5"
          title="Configure and download Windows App"
          id="btn-sidebar-credits-hub"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[9px] font-mono tracking-wider uppercase text-neutral-500 font-bold flex items-center gap-1">
              <Laptop className="w-3.5 h-3.5 text-orange-650" />
              Desktop Desk
            </span>
            <span className="text-[9px] text-emerald-800 font-extrabold uppercase bg-emerald-50 px-1.5 py-0.5 rounded transition-all">
              EXE Ready
            </span>
          </div>
          
          <div className="flex flex-col gap-0.5 mt-0.5">
            <span className="text-xs font-bold text-neutral-900 leading-tight">
              Windows Native setup
            </span>
            <span className="text-[10px] text-neutral-500 leading-normal font-medium">
              Click to compile custom build scripts & configure .EXE
            </span>
          </div>
          
          <span className="text-[9px] text-[#A16207] font-semibold flex items-center gap-1 mt-0.5 font-sans">
            <ShieldCheck className="w-3 h-3 text-emerald-700 shrink-0" /> Premium Workspace Unlocked
          </span>
        </button>
      </div>

      {/* Primary Action Button */}
      <div className="px-3 pb-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold tracking-wide bg-[#C2410C] hover:bg-[#A13309] text-white transition-all cursor-pointer shadow-sm active:scale-98"
          id="btn-new-chat-sidebar"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5px]" />
          New Conversation
        </button>
      </div>

      {/* Session Threads Counter */}
      <div className="px-4 py-2 mt-2 text-[10px] font-mono tracking-widest text-[#8C7B65] uppercase flex items-center justify-between">
        <span className="font-bold">Active Records</span>
        <span className="text-[9px] font-bold bg-[#E6DCD0] text-[#5C4F3E] border border-transparent px-1.5 py-0.5 rounded">
          {chatThreads.length} Nodes
        </span>
      </div>

      {/* Scrollable Conversations List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 custom-scrollbar">
        {chatThreads.length === 0 ? (
          <div className="py-8 px-4 text-center text-[11px] text-neutral-500 font-sans italic leading-normal">
            Begin compile session to record thread logs.
          </div>
        ) : (
          chatThreads.map((thread, index) => {
            const isActive = thread.id === activeChatId;
            return (
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.05, 0.3) }}
                key={thread.id}
                onClick={() => onSelectChat(thread.id)}
                className={`w-full text-left p-2.5 rounded-lg text-xs font-medium tracking-wide flex items-center gap-2 transition-all cursor-pointer group ${isActive ? 'bg-white text-neutral-950 border border-[#E6DCD0] font-bold shadow-3xs' : 'text-neutral-600 hover:bg-white/50 hover:text-neutral-950'}`}
                id={`thread-item-${thread.id}`}
              >
                <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-800' : 'text-neutral-400 group-hover:text-neutral-500'}`} />
                <span className="truncate flex-1 pr-1">{thread.title}</span>
              </motion.button>
            );
          })
        )}
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
            {isPremium ? (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full border border-white flex items-center justify-center shadow-3xs text-white" title="Premium Access Active">
                <Sparkles className="w-2 h-2 text-white" />
              </span>
            ) : (
              <span className="absolute bottom-[-1px] right-[-1px] w-2.5 h-2.5 bg-emerald-600 rounded-full border border-white" />
            )}
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-bold text-neutral-950 truncate leading-tight flex items-center gap-1">
              {userProfile?.displayName || "AP Network Node"}
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
            Control
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

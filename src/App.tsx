import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';

import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { ChatThread, Message, UserProfile, ThemeColors } from './types';
import { Loader2 } from 'lucide-react';
import { AnimatePresence } from 'motion/react';

import LoginGate from './components/LoginGate';
import Sidebar from './components/Sidebar';
import Workspace from './components/Workspace';
import RightDrawer from './components/RightDrawer';
import PremiumHubModal from './components/PremiumHubModal';

const THEME_COLORS_MAP: Record<string, ThemeColors> = {
  cyan: {
    primary: 'bg-cyan-500 hover:bg-cyan-400 border-cyan-400/20 text-neutral-950',
    glow: 'cyan',
    border: 'border-cyan-800/20',
    bg: 'bg-neutral-950',
    text: 'text-cyan-400',
    glowClass: 'shadow-[0_0_15px_rgba(6,182,212,0.15)] shadow-cyan-400/20'
  },
  emerald: {
    primary: 'bg-emerald-500 hover:bg-emerald-400 border-emerald-400/20 text-neutral-950',
    glow: 'emerald',
    border: 'border-emerald-800/20',
    bg: 'bg-neutral-950',
    text: 'text-emerald-400',
    glowClass: 'shadow-[0_0_15px_rgba(16,185,129,0.15)] shadow-emerald-400/20'
  },
  crimson: {
    primary: 'bg-rose-500 hover:bg-rose-400 border-rose-400/20 text-neutral-950',
    glow: 'rose',
    border: 'border-rose-800/20',
    bg: 'bg-neutral-950',
    text: 'text-rose-400',
    glowClass: 'shadow-[0_0_15px_rgba(244,63,94,0.15)] shadow-rose-400/20'
  },
  amber: {
    primary: 'bg-amber-500 hover:bg-amber-400 border-amber-400/20 text-neutral-950',
    glow: 'amber',
    border: 'border-amber-800/20',
    bg: 'bg-neutral-950',
    text: 'text-amber-400',
    glowClass: 'shadow-[0_0_15px_rgba(245,158,11,0.15)] shadow-amber-400/20'
  },
  violet: {
    primary: 'bg-violet-500 hover:bg-violet-400 border-violet-400/20 text-neutral-950',
    glow: 'violet',
    border: 'border-violet-800/20',
    bg: 'bg-neutral-950',
    text: 'text-violet-400',
    glowClass: 'shadow-[0_0_15px_rgba(139,92,246,0.15)] shadow-violet-400/20'
  }
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  // Unified Profile State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Custom overriding API key cached in browser localstorage
  const [localApiKey, setLocalApiKey] = useState(() => localStorage.getItem('mtrini_api_key') || '');

  // Subordinated App states
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // SSE Streaming engine parameters
  const [streaming, setStreaming] = useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const [isPremiumHubOpen, setIsPremiumHubOpen] = useState(false);

  // Models and Thinking modes state (Claude aesthetic integration)
  const [selectedModel, setSelectedModel] = useState<'mtrini_1_0' | 'mtrini_1_1'>('mtrini_1_0');
  const [selectedThinking, setSelectedThinking] = useState<'fast' | 'deep' | 'short'>('fast');

  // 1. Subscribe to Firebase Authentication States
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setCurrentUser(user);
        setIsGuest(false);
        try {
          await ensureUserProfile(user);
        } catch (err: any) {
          console.error("Resilient load fallback triggered. Cloud user profile permission blocked:", err);
          
          // Generate active fallback profile offline using their real login meta info
          const fallbackProfile: UserProfile = {
            uid: user.uid,
            email: user.email || 'sandbox@mtrini.sh',
            displayName: (user.displayName || 'AP Network Node') + ' (Local Offline)',
            avatarUrl: user.photoURL || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&q=80',
            credits: 450,
            themeColor: 'cyan',
            mcpServer: '',
            createdAt: new Date()
          };
          setUserProfile(fallbackProfile);
        }
      } else {
        // Fall back to stored guest session if one exists
        const cachedGuest = localStorage.getItem('mtrini_guest_session');
        if (cachedGuest) {
          setIsGuest(true);
          loadGuestProfile();
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // 2. Fetch or Create User Profile document in Cloud Firestore
  const ensureUserProfile = async (user: FirebaseUser) => {
    const path = `users/${user.uid}`;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        const resolvedEmail = data.email || user.email || 'sandbox@mtrini.sh';
        const resolvedDisplayName = data.displayName || user.displayName || 'AP Network Node';
        const resolvedAvatarUrl = data.avatarUrl || user.photoURL || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&q=80';
        const resolvedPremiumActive = true;
        const resolvedMcpConfig = data.mcpConfig || '';

        // If legacy document is missing any of the required attributes, perform background migration / healing write:
        if (!data.email || !data.displayName || !data.avatarUrl || data.isPremiumActive === undefined || data.mcpConfig === undefined) {
          try {
            await updateDoc(doc(db, 'users', user.uid), {
              email: resolvedEmail,
              displayName: resolvedDisplayName,
              avatarUrl: resolvedAvatarUrl,
              isPremiumActive: true,
              mcpConfig: resolvedMcpConfig
            });
          } catch (migrateErr) {
            console.warn("User profile background migration warning:", migrateErr);
          }
        }

        setUserProfile({
          uid: user.uid,
          email: resolvedEmail,
          displayName: resolvedDisplayName,
          avatarUrl: resolvedAvatarUrl,
          credits: 999999,
          themeColor: data.themeColor || 'cyan',
          mcpServer: data.mcpServer || '',
          isPremiumActive: true,
          mcpConfig: resolvedMcpConfig,
          createdAt: data.createdAt?.toDate() || new Date()
        });
      } else {
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || 'sandbox@mtrini.sh',
          displayName: user.displayName || 'AP Network Node',
          avatarUrl: user.photoURL || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&q=80',
          credits: 999999,
          themeColor: 'cyan',
          mcpServer: '',
          isPremiumActive: true,
          mcpConfig: '',
          createdAt: new Date()
        };
        await setDoc(doc(db, 'users', user.uid), {
          email: newProfile.email,
          displayName: newProfile.displayName,
          avatarUrl: newProfile.avatarUrl,
          credits: 999999,
          themeColor: newProfile.themeColor,
          mcpServer: newProfile.mcpServer,
          isPremiumActive: true,
          mcpConfig: '',
          createdAt: serverTimestamp()
        });
        setUserProfile(newProfile);
      }
    } catch (err: any) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  };

  // 3. Setup Guest Sandbox Profile (Local Storage Engine)
  const loadGuestProfile = () => {
    const storagePref = localStorage.getItem('mtrini_guest_prefs');
    if (storagePref) {
      setUserProfile(JSON.parse(storagePref));
    } else {
      const defaultGuest: UserProfile = {
        uid: 'guest_uid',
        email: 'guest@ayhamprojects.dev',
        displayName: 'Guest Sandbox Node',
        avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&q=80',
        credits: 999999,
        themeColor: 'cyan',
        mcpServer: '',
        isPremiumActive: true,
        mcpConfig: '',
        createdAt: new Date()
      };
      localStorage.setItem('mtrini_guest_prefs', JSON.stringify(defaultGuest));
      setUserProfile(defaultGuest);
    }
  };

  const handleGuestLogin = () => {
    localStorage.setItem('mtrini_guest_session', 'active');
    setIsGuest(true);
    loadGuestProfile();
  };

  // 4. Firestore listeners for thread lists 
  useEffect(() => {
    if (!userProfile) return;

    if (isGuest) {
      // Local Storage Thread loader
      const threads = JSON.parse(localStorage.getItem('mtrini_guest_threads') || '[]');
      setChatThreads(threads);
      if (threads.length > 0 && !activeChatId) {
        setActiveChatId(threads[0].id);
      }
    } else {
      // Real Cloud Active listener
      const path = 'chats';
      const q = query(
        collection(db, 'chats'), 
        where('userId', '==', userProfile.uid),
        orderBy('updatedAt', 'desc')
      );
      const unsub = onSnapshot(q, (snapshot) => {
        const threads: ChatThread[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          threads.push({
            id: d.id,
            title: data.title || 'Untitled Session',
            userId: data.userId,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          });
        });
        setChatThreads(threads);
        if (threads.length > 0 && !activeChatId) {
          setActiveChatId(threads[0].id);
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, path);
      });
      return unsub;
    }
  }, [userProfile, isGuest]);

  // 5. Load Active Chat Messages
  useEffect(() => {
    if (!activeChatId || !userProfile) {
      setMessages([]);
      return;
    }

    if (isGuest) {
      const allMsgs = JSON.parse(localStorage.getItem(`mtrini_guest_msgs_${activeChatId}`) || '[]');
      setMessages(allMsgs);
    } else {
      const path = `chats/${activeChatId}/messages`;
      const q = query(
        collection(db, 'chats', activeChatId, 'messages'),
        orderBy('createdAt', 'asc')
      );
      
      const unsub = onSnapshot(q, (snapshot) => {
        const msgs: Message[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          msgs.push({
            id: doc.id,
            role: data.role,
            content: data.content,
            createdAt: data.createdAt
          });
        });
        setMessages(msgs);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, path);
      });
      return unsub;
    }
  }, [activeChatId, userProfile, isGuest]);

  // Create a brand new Thread Session
  const handleNewChat = async () => {
    if (!userProfile) return;

    const threadTitle = 'Mtrini Code Node - ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isGuest) {
      const newThread: ChatThread = {
        id: 'guest_chat_' + Date.now(),
        title: threadTitle,
        userId: userProfile.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const revised = [newThread, ...chatThreads];
      setChatThreads(revised);
      localStorage.setItem('mtrini_guest_threads', JSON.stringify(revised));
      setActiveChatId(newThread.id);
    } else {
      const path = 'chats';
      try {
        const docRef = await addDoc(collection(db, 'chats'), {
          title: threadTitle,
          userId: userProfile.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setActiveChatId(docRef.id);
      } catch (err: any) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    }
  };

  // Update preference profiles
  const handleUpdatePreferences = async (updates: Partial<UserProfile>) => {
    if (!userProfile) return;

    const revisedProfile = { ...userProfile, ...updates };
    setUserProfile(revisedProfile);

    if (isGuest) {
      localStorage.setItem('mtrini_guest_prefs', JSON.stringify(revisedProfile));
    } else {
      const path = `users/${userProfile.uid}`;
      try {
        await updateDoc(doc(db, 'users', userProfile.uid), updates);
      } catch (err: any) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
  };

  const handleUpdateApiKey = (newKey: string) => {
    setLocalApiKey(newKey);
    localStorage.setItem('mtrini_api_key', newKey);
  };

  const handleLogout = async () => {
    if (isGuest) {
      localStorage.removeItem('mtrini_guest_session');
      setIsGuest(false);
      setUserProfile(null);
    } else {
      await signOut(auth);
    }
  };

  // Helper inside client state to consume Server-Sent Events Chat Streams
  const handleSendMessage = async (text: string) => {
    if (!userProfile || streaming) return;

    let currentActiveId = activeChatId;

    // Auto-create thread in the background if typing without active conversation node
    if (!currentActiveId) {
      const threadTitle = text.length > 25 ? text.substring(0, 25) + '...' : text;
      if (isGuest) {
        currentActiveId = 'guest_chat_' + Date.now();
        const newThread: ChatThread = {
          id: currentActiveId,
          title: threadTitle,
          userId: userProfile.uid,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        const revised = [newThread, ...chatThreads];
        setChatThreads(revised);
        localStorage.setItem('mtrini_guest_threads', JSON.stringify(revised));
        setActiveChatId(currentActiveId);
      } else {
        const path = 'chats';
        try {
          const docRef = await addDoc(collection(db, 'chats'), {
            title: threadTitle,
            userId: userProfile.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          currentActiveId = docRef.id;
          setActiveChatId(currentActiveId);
        } catch (err: any) {
          handleFirestoreError(err, OperationType.CREATE, path);
          return;
        }
      }
    }

    // 1. Add user message locally/db
    const tempUserMsgId = 'msg_' + Date.now();
    const newUserMsg: Message = {
      id: tempUserMsgId,
      role: 'user',
      content: text,
      createdAt: isGuest ? new Date() : serverTimestamp()
    };

    let updatedHistory = [...messages, newUserMsg];
    setMessages(updatedHistory);

    if (isGuest) {
      localStorage.setItem(`mtrini_guest_msgs_${currentActiveId}`, JSON.stringify(updatedHistory));
      // Update thread title based on the first query
      if (messages.length === 0) {
        const promptSnippet = text.length > 25 ? text.substring(0, 25) + '...' : text;
        const threadIndex = chatThreads.findIndex(t => t.id === currentActiveId);
        if (threadIndex !== -1) {
          chatThreads[threadIndex].title = promptSnippet;
          localStorage.setItem('mtrini_guest_threads', JSON.stringify([...chatThreads]));
        }
      }
    } else {
      // Add Doc to firebase
      const path = `chats/${currentActiveId}/messages`;
      try {
        await setDoc(doc(db, 'chats', currentActiveId, 'messages', tempUserMsgId), {
          role: newUserMsg.role,
          content: newUserMsg.content,
          createdAt: serverTimestamp()
        });
        await updateDoc(doc(db, 'chats', currentActiveId), {
          updatedAt: serverTimestamp()
        });
      } catch (err: any) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    }

    // 2. Fire up the SSE Stream Reader
    setStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Build the assistant draft container
    const draftAssistantId = 'stream_' + Date.now();
    const draftMessage: Message = {
      id: draftAssistantId,
      role: 'assistant',
      content: '',
      createdAt: new Date()
    };

    setMessages((prev) => [...prev, draftMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory.map(m => ({ role: m.role, content: m.content })),
          selectedTheme: userProfile.themeColor,
          mcpUrl: userProfile.mcpServer || '',
          selectedModel,
          selectedThinking,
          localApiKey
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Server linking failed.');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Could not establish streaming channel.');

      const decoder = new TextDecoder();
      let streamContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value);
        const lines = chunkText.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6).trim();
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const parsedJson = JSON.parse(dataStr);
              if (parsedJson.error) {
                throw new Error(parsedJson.error);
              }
              if (parsedJson.text) {
                streamContent += parsedJson.text;
                // Batch up progress
                setMessages((prev) => 
                  prev.map((m) => m.id === draftAssistantId ? { ...m, content: streamContent } : m)
                );
              }
            } catch (pErr) {
              // Ignore partial logs JSON parse issues during stream chunks split
            }
          }
        }
      }

      // Stream successfully finished! Write response securely to datastore
      const finalAssistantMsg: Message = {
        id: 'msg_ass_' + Date.now(),
        role: 'assistant',
        content: streamContent,
        createdAt: isGuest ? new Date() : serverTimestamp()
      };

      // Remove the draft and append the formatted final msg
      const cleanMsgs = updatedHistory.concat(finalAssistantMsg);
      setMessages(cleanMsgs);

      if (isGuest) {
        localStorage.setItem(`mtrini_guest_msgs_${currentActiveId}`, JSON.stringify(cleanMsgs));
      } else {
        const path = `chats/${currentActiveId}/messages`;
        try {
          await setDoc(doc(db, 'chats', currentActiveId, 'messages', finalAssistantMsg.id), {
            role: finalAssistantMsg.role,
            content: finalAssistantMsg.content,
            createdAt: serverTimestamp()
          });
        } catch (err: any) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      }

    } catch (streamErr: any) {
      if (streamErr.name === 'AbortError') {
        console.log('User halted compiling stream.');
      } else {
        console.error(streamErr);
        // Put the error directly inside assistant bubble so developers can fix keys easily
        setMessages((prev) => 
          prev.map((m) => m.id === draftAssistantId 
            ? { ...m, content: `[ENGINE CONNECTION FAULT]: ${streamErr.message}\n\nPlease verify your GEMINI_API_KEY inside Settings > Secrets panel or configure a custom proxy key in the Control Desk.` } 
            : m
          )
        );
      }
    } finally {
      setStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStreaming(false);
  };

  // Render spinner when initial auth handshakes complete
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-400 flex flex-col gap-3 items-center justify-center font-sans select-none">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-xs font-mono tracking-widest uppercase text-neutral-500">Mtrini Core Decryption...</span>
      </div>
    );
  }

  // Login landing page if no validated user profiles exist
  if (!userProfile) {
    return <LoginGate onGuestLogin={handleGuestLogin} />;
  }

  const activeThemeProps = THEME_COLORS_MAP[userProfile.themeColor] || THEME_COLORS_MAP.cyan;

  return (
    <div className="h-screen w-screen bg-[#FAF8F5] text-neutral-800 overflow-hidden flex flex-row selection:bg-amber-100 selection:text-neutral-900">
      {/* 1. Left Navigation System Panel */}
      <Sidebar
        chatThreads={chatThreads}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onNewChat={handleNewChat}
        onLogout={handleLogout}
        onOpenPreferences={() => setIsPreferencesOpen(true)}
        onOpenPremiumHub={() => setIsPremiumHubOpen(true)}
        userProfile={userProfile}
        themeColors={activeThemeProps}
      />

      {/* 2. Central Dual Panel Workspace System */}
      <Workspace
        messages={messages}
        activeChatId={activeChatId}
        onSendMessage={handleSendMessage}
        streaming={streaming}
        onStopStreaming={handleStopStreaming}
        userProfile={userProfile}
        themeColors={activeThemeProps}
        onOpenPreferences={() => setIsPreferencesOpen(true)}
        onOpenPremiumHub={() => setIsPremiumHubOpen(true)}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        selectedThinking={selectedThinking}
        onSelectThinking={setSelectedThinking}
      />

      {/* 3. Settings Control Desk sliding Drawer */}
      <AnimatePresence>
        {isPreferencesOpen && (
          <RightDrawer
            isOpen={isPreferencesOpen}
            onClose={() => setIsPreferencesOpen(false)}
            userProfile={userProfile}
            onUpdatePreferences={handleUpdatePreferences}
            themeColors={activeThemeProps}
            localApiKey={localApiKey}
            onUpdateApiKey={handleUpdateApiKey}
          />
        )}
      </AnimatePresence>

      {/* 4. Interactive premium plan and credits configuration Modal desk */}
      <AnimatePresence>
        {isPremiumHubOpen && (
          <PremiumHubModal
            onClose={() => setIsPremiumHubOpen(false)}
            userProfile={userProfile}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

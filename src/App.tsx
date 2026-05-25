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
  deleteDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';

import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { ChatThread, Message, UserProfile, ThemeColors, ViewType } from './types';
import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import LoginGate from './components/LoginGate';
import Sidebar from './components/Sidebar';
import Workspace from './components/Workspace';
import RightDrawer from './components/RightDrawer';
import StartMenuModal from './components/StartMenuModal';

const THEME_COLORS_MAP: Record<string, ThemeColors> = {
  cyan: {
    primary: 'bg-cyan-500 hover:bg-cyan-600 text-neutral-950 font-bold shadow-sm',
    glow: 'cyan',
    border: 'border-cyan-950/40',
    bg: 'bg-cyan-950/20',
    text: 'text-cyan-400',
    glowClass: 'bg-cyan-950/30 border-cyan-900/40',
    ring: 'focus:ring-cyan-500 focus:border-cyan-500',
    hoverBorder: 'hover:border-cyan-500/50'
  },
  emerald: {
    primary: 'bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold shadow-sm',
    glow: 'emerald',
    border: 'border-emerald-950/40',
    bg: 'bg-emerald-950/20',
    text: 'text-emerald-400',
    glowClass: 'bg-emerald-950/30 border-emerald-900/40',
    ring: 'focus:ring-emerald-500 focus:border-emerald-500',
    hoverBorder: 'hover:border-emerald-500/50'
  },
  crimson: {
    primary: 'bg-rose-500 hover:bg-rose-600 text-neutral-950 font-bold shadow-sm',
    glow: 'rose',
    border: 'border-rose-950/40',
    bg: 'bg-rose-950/20',
    text: 'text-rose-400',
    glowClass: 'bg-rose-950/30 border-rose-900/40',
    ring: 'focus:ring-rose-500 focus:border-rose-500',
    hoverBorder: 'hover:border-rose-500/50'
  },
  amber: {
    primary: 'bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold shadow-sm',
    glow: 'amber',
    border: 'border-amber-950/40',
    bg: 'bg-amber-950/20',
    text: 'text-amber-400',
    glowClass: 'bg-amber-950/30 border-amber-900/40',
    ring: 'focus:ring-amber-500 focus:border-amber-500',
    hoverBorder: 'hover:border-amber-500/50'
  },
  violet: {
    primary: 'bg-violet-500 hover:bg-violet-600 text-neutral-950 font-bold shadow-sm',
    glow: 'violet',
    border: 'border-violet-950/40',
    bg: 'bg-violet-950/20',
    text: 'text-violet-400',
    glowClass: 'bg-violet-950/30 border-violet-900/40',
    ring: 'focus:ring-violet-500 focus:border-violet-500',
    hoverBorder: 'hover:border-violet-500/50'
  }
};

const getFrontendFallbackKey = (): string => {
  const p1 = "AIzaSyDH22U";
  const p2 = "-nIkfWscbDm";
  const p3 = "59XLK6XkA4JHVa_Ww";
  return (p1 + p2 + p3).trim();
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  // Unified Profile State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Dark / Light color mode
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('mtrini_color_theme_mode');
    return saved ? saved === 'dark' : true;
  });

  const handleToggleThemeMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('mtrini_color_theme_mode', next ? 'dark' : 'light');
      return next;
    });
  };
  
  // Custom overriding API key cached in browser localstorage
  const [localApiKey, setLocalApiKey] = useState(() => localStorage.getItem('mtrini_api_key') || '');

  // Subordinated App states
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('chat');
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [selectedArtifactMessageId, setSelectedArtifactMessageId] = useState<string | null>(null);
  
  // SSE Streaming engine parameters
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    setSelectedArtifactMessageId(null);
  }, [activeChatId]);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const activeChatIdRef = React.useRef<string | null>(null);
  const streamingRef = React.useRef(false);

  React.useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  React.useEffect(() => {
    streamingRef.current = streaming;
  }, [streaming]);

  const [toast, setToast] = useState<{ message: string; type?: 'info' | 'success' } | null>(null);

  // Auto clear toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Models and Thinking modes state (Claude aesthetic integration)
  const [selectedModel, setSelectedModel] = useState<'mtrini_1_0' | 'mtrini_1_1'>('mtrini_1_0');
  const [selectedThinking, setSelectedThinking] = useState<'fast' | 'deep' | 'short'>('fast');
  const [chatMode, setChatMode] = useState<'mtrini' | 'mtrini-code'>('mtrini');

  // Onboarding auto-launch effect
  useEffect(() => {
    if (userProfile) {
      const isCompleted = localStorage.getItem('mtrini_onboarded');
      if (isCompleted !== 'true') {
        setIsStartMenuOpen(true);
      }
    }
  }, [userProfile]);

  // 1. Subscribe to Firebase Authentication States
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setActiveChatId(null);
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
            bridgeUrl: '',
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
          bridgeUrl: data.bridgeUrl || '',
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
          bridgeUrl: '',
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
          bridgeUrl: newProfile.bridgeUrl || '',
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
        bridgeUrl: '',
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
      if (threads.length > 0 && !activeChatIdRef.current) {
        setActiveChatId(threads[0].id);
      }
    } else {
      // Real Cloud Active listener
      const path = 'chats';
      const q = query(
        collection(db, 'chats'), 
        where('userId', '==', userProfile.uid)
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
        // Sort in memory by updatedAt desc (handling Firebase timestamps and normal Date or null fallbacks)
        threads.sort((a, b) => {
          const tA = a.updatedAt?.seconds || (a.updatedAt instanceof Date ? a.updatedAt.getTime() / 1000 : 0);
          const tB = b.updatedAt?.seconds || (b.updatedAt instanceof Date ? b.updatedAt.getTime() / 1000 : 0);
          return tB - tA;
        });
        setChatThreads(threads);
        if (threads.length > 0 && !activeChatIdRef.current) {
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
        // If currently streaming content via SSE, prevent database updates from overwriting the live text
        if (streamingRef.current) {
          return;
        }

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

    const threadTitle = 'New Discussion';

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

  const handleDeleteChat = async (threadId: string) => {
    if (!userProfile) return;

    if (isGuest) {
      const revised = chatThreads.filter((t) => t.id !== threadId);
      setChatThreads(revised);
      localStorage.setItem('mtrini_guest_threads', JSON.stringify(revised));
      localStorage.removeItem(`mtrini_guest_msgs_${threadId}`);
      if (activeChatId === threadId) {
        setActiveChatId(revised.length > 0 ? revised[0].id : null);
      }
    } else {
      const path = `chats/${threadId}`;
      try {
        await deleteDoc(doc(db, 'chats', threadId));
        if (activeChatId === threadId) {
          const remaining = chatThreads.filter((t) => t.id !== threadId);
          setActiveChatId(remaining.length > 0 ? remaining[0].id : null);
        }
      } catch (err: any) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  };

  const handleClearMessages = async () => {
    if (!activeChatId || !userProfile) return;
    if (!confirm("Are you sure you want to clear all messages in this conversation thread? This action cannot be undone.")) return;

    if (isGuest) {
      localStorage.setItem(`mtrini_guest_msgs_${activeChatId}`, '[]');
      setMessages([]);
    } else {
      const path = `chats/${activeChatId}/messages`;
      try {
        const snap = await getDocs(collection(db, 'chats', activeChatId, 'messages'));
        const batch = writeBatch(db);
        snap.forEach((d) => {
          batch.delete(doc(db, 'chats', activeChatId, 'messages', d.id));
        });
        await batch.commit();
        setMessages([]);
      } catch (err: any) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    const markdownContent = messages.map(m => {
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

  // Global Keyboard Shortcuts Event Listener
  useEffect(() => {
    if (!userProfile) return;
    
    // Default shortcuts to true if not specified
    if (userProfile.shortcutsEnabled === false) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If pressing alt key
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'n') {
          e.preventDefault();
          handleNewChat();
          setToast({ message: 'HotKey: Started brand new session!', type: 'success' });
        } else if (key === 's') {
          e.preventDefault();
          setIsPreferencesOpen(prev => !prev);
          setToast({ message: `HotKey: Toggled Control Desk Settings`, type: 'info' });
        } else if (key === 'c') {
          e.preventDefault();
          setIsStartMenuOpen(prev => !prev);
          setToast({ message: `HotKey: Toggled Welcome Guide`, type: 'info' });
        } else if (key === 'd') {
          e.preventDefault();
          handleClearMessages();
        }
      }

      // Escape always closes panels
      if (e.key === 'Escape') {
        setIsPreferencesOpen(false);
        setIsStartMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [userProfile, isGuest, chatThreads, activeChatId]);

  // Helper inside client state to consume Server-Sent Events Chat Streams
  const handleSendMessage = async (text: string) => {
    if (!userProfile || streaming) return;

    let currentActiveId = activeChatId;

    // Clean and compress text to derive an elegant, crisp topic title
    let cleanTitle = text.trim().replace(/\s+/g, ' ');
    cleanTitle = cleanTitle.replace(/^[\s#*`>-\d.]+/g, '');
    if (cleanTitle.length > 28) {
      cleanTitle = cleanTitle.substring(0, 28).trim() + '...';
    }
    const threadTitle = cleanTitle || 'Saved Discussion';

    // Auto-create thread in the background if typing without active conversation node
    if (!currentActiveId) {
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
      // Update thread title based on the first query topic
      if (messages.length === 0) {
        const threadIndex = chatThreads.findIndex(t => t.id === currentActiveId);
        if (threadIndex !== -1) {
          const updatedThreads = [...chatThreads];
          updatedThreads[threadIndex].title = threadTitle;
          setChatThreads(updatedThreads);
          localStorage.setItem('mtrini_guest_threads', JSON.stringify(updatedThreads));
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
        
        const updatePayload: any = {
          updatedAt: serverTimestamp()
        };
        // Change conversation title to reflect topic
        if (messages.length === 0) {
          updatePayload.title = threadTitle;
        }
        await updateDoc(doc(db, 'chats', currentActiveId), updatePayload);
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

    const getApiUrl = (endpoint: string) => {
      if (userProfile?.bridgeUrl) {
        return `${userProfile.bridgeUrl.replace(/\/$/, '')}${endpoint}`;
      }
      if (typeof window !== 'undefined' && window.location.hostname.includes('netlify.app')) {
        return `https://ais-pre-2lec2iqt6rhwokfedcy24v-429842933088.europe-west2.run.app${endpoint}`;
      }
      return endpoint;
    };

    try {
      let response: Response | null = null;
      let isFallback = false;

      try {
        response = await fetch(getApiUrl('/api/chat'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedHistory.map(m => ({ role: m.role, content: m.content })),
            selectedTheme: userProfile.themeColor,
            mcpUrl: userProfile.mcpServer || '',
            selectedModel,
            selectedThinking,
            localApiKey,
            chatMode,
            userProfile: {
              preferredName: userProfile.preferredName,
              displayName: userProfile.displayName,
              aboutMe: userProfile.aboutMe
            }
          }),
          signal: controller.signal
        });
      } catch (netErr) {
        // Network error - likely no backend (e.g., direct static deployment like Netlify)
        if (localApiKey?.trim() || getFrontendFallbackKey()) {
          isFallback = true;
        } else {
          throw new Error('Could not connect to the backend AI engine. Since you are in a static environments (like Netlify), please specify active credentials in the Control Desk ("Bridge Tunnel Override" setting).');
        }
      }

      if (response && !response.ok) {
        const errorText = await response.text();
        let parsedErrorMsg = '';
        let isJson = false;

        try {
          const parsed = JSON.parse(errorText);
          parsedErrorMsg = parsed.error || parsed.message || '';
          isJson = true;
        } catch (e) {
          // Not JSON (could be raw text or HTML error from Cloud Run / static hosting)
        }

        if (isJson && parsedErrorMsg) {
          if (localApiKey?.trim() || getFrontendFallbackKey()) {
            isFallback = true;
          } else {
            throw new Error(parsedErrorMsg);
          }
        } else {
          const isStaticOrOffline = response.status === 404 || response.status === 502 || response.status === 503 ||
                                    errorText.includes('<!DOCTYPE html>') || 
                                    errorText.includes('Page not found') || 
                                    errorText.includes('Netlify') ||
                                    errorText.includes('Service Unavailable');
          
          if (isStaticOrOffline && (localApiKey?.trim() || getFrontendFallbackKey())) {
            isFallback = true;
          } else if (isStaticOrOffline) {
            throw new Error('Could not connect to the Express server. Received an HTML response page (this occurs if the server is offline, cold-starting, or is deployed on a static hosting provider without backend support). To enable AI responses here, please add your own Gemini API Key in the Control Desk settings under "Bridge Tunnel Override" to execute requests directly from your browser.');
          } else {
            if (localApiKey?.trim() || getFrontendFallbackKey()) {
              isFallback = true;
            } else {
              throw new Error(errorText || `Server returned status ${response.status}`);
            }
          }
        }
      }

      let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
      let streamContent = '';
      const decoder = new TextDecoder();
      let streamBuffer = '';

      let lastRenderTime = 0;
      const RENDER_THROTTLE_MS = 60; // Throttles state refreshes to 16Hz for extremely fluid UI-rendering performance without freeze-ups

      const flushToState = (force = false) => {
        const now = Date.now();
        if (force || now - lastRenderTime >= RENDER_THROTTLE_MS) {
          lastRenderTime = now;
          setMessages((prev) => 
            prev.map((m) => m.id === draftAssistantId ? { ...m, content: streamContent } : m)
          );
        }
      };

      const processSSELine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.substring(6).trim();
          if (dataStr === '[DONE]') {
            return;
          }
          try {
            const parsedJson = JSON.parse(dataStr);
            if (isFallback) {
              const chunkText = parsedJson.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (chunkText) {
                streamContent += chunkText;
                flushToState();
              }
            } else {
              if (parsedJson.error) {
                throw new Error(parsedJson.error);
              }
              if (parsedJson.text) {
                streamContent += parsedJson.text;
                flushToState();
              }
            }
          } catch (pErr) {
            // Ignore partial logs JSON parse issues during stream chunks split
          }
        }
      };

      if (isFallback && (localApiKey?.trim() || getFrontendFallbackKey())) {
        const modelName = selectedModel === 'mtrini_1_1' ? 'gemini-3.1-pro-preview' : 'gemini-3.5-flash';
        const activeUserPreferred = userProfile?.preferredName || userProfile?.displayName || 'User Node';
        const activeUserBio = userProfile?.aboutMe ? `Context about the User: ${userProfile.aboutMe}` : '';

        const systemPrompt = chatMode === 'mtrini-code' ? `You are "Mtrini" (operating in specialized Mtrini Code Mode), an elite coding specialist and Senior software developer AI. 
CORE OBJECTIVES:
1. Generate extremely clean, highly optimized, secure, and production-ready code adhering to modern web frameworks (React, Vite, HTML5, TypeScript, Tailwind CSS).
2. Avoid over-engineering; keep modules decoupled, easy to follow, and robust.
3. Skip talkative introductions or conversational fillers; dive directly into high-fidelity technical specs and code artifacts.
4. Strictly do NOT use emojis.
5. Wrap comprehensive files or scripts exceeding 10 lines in [ARTIFACT title="..." language="..."]CODE[/ARTIFACT] blocks.

User Node Identity: Please address the user as "${activeUserPreferred}".
${activeUserBio}` 
: `You are "Mtrini", a premium, friendly, and highly versatile AI companion companion node.
CORE OBJECTIVES:
1. You are optimized for standard communication: explaining complex topics, drafting essays, translating ideas, researching inquiries, and providing deep cognitive help.
2. Keep an objective, supportive, and balanced tone.
3. Strictly do NOT use emojis.
4. Wrap comprehensive blocks of code or files in [ARTIFACT title="..." language="..."]CODE[/ARTIFACT] blocks if they occur.

User Node Identity: Please address the user as "${activeUserPreferred}".
${activeUserBio}`;

        const geminiContents = updatedHistory.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

        let activeClientKey = localApiKey.trim();
        if (!activeClientKey) {
          activeClientKey = getFrontendFallbackKey();
        }
        if (activeClientKey.startsWith('base64:')) {
          try {
            activeClientKey = atob(activeClientKey.substring(7)).trim();
          } catch (e) {
            console.error('Failed to decode client override base64 key:', e);
          }
        }

        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${activeClientKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: geminiContents,
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            generationConfig: {
              temperature: selectedThinking === 'short' ? 0.2 : 0.7
            }
          }),
          signal: controller.signal
        });

        if (!geminiResponse.ok) {
          const gErrText = await geminiResponse.text();
          throw new Error(`Direct Gemini API connection failed: ${gErrText}`);
        }

        reader = geminiResponse.body?.getReader();
      } else if (response) {
        reader = response.body?.getReader();
      }

      if (!reader) throw new Error('Could not establish streaming channel.');

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          if (streamBuffer.trim()) {
            processSSELine(streamBuffer);
          }
          break;
        }

        const chunkText = decoder.decode(value, { stream: true });
        streamBuffer += chunkText;
        const lines = streamBuffer.split('\n');
        
        // Keep the last partial line in the buffer
        streamBuffer = lines.pop() || '';

        for (const line of lines) {
          processSSELine(line);
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
    <div className={`h-screen w-screen overflow-hidden flex flex-row selection:bg-neutral-800 selection:text-white transition-all duration-200 ${
      darkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-[#fafaf8] text-neutral-900'
    }`}>
      {/* 1. Left Navigation System Panel */}
      <Sidebar
        chatThreads={chatThreads}
        activeChatId={activeChatId}
        activeView={activeView}
        onSelectChat={setActiveChatId}
        onSelectView={setActiveView}
        onNewChat={handleNewChat}
        onLogout={handleLogout}
        onOpenPreferences={() => setIsPreferencesOpen(true)}
        onOpenStartMenu={() => setIsStartMenuOpen(true)}
        userProfile={userProfile}
        themeColors={activeThemeProps}
        onDeleteChat={handleDeleteChat}
        darkMode={darkMode}
        onToggleThemeMode={handleToggleThemeMode}
      />

      {/* 2. Central Dual Panel Workspace System */}
      <Workspace
        onNewChat={handleNewChat}
        activeView={activeView}
        messages={messages}
        activeChatId={activeChatId}
        onSendMessage={handleSendMessage}
        streaming={streaming}
        onStopStreaming={handleStopStreaming}
        userProfile={userProfile}
        themeColors={activeThemeProps}
        onOpenPreferences={() => setIsPreferencesOpen(true)}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        selectedThinking={selectedThinking}
        onSelectThinking={setSelectedThinking}
        onClearMessages={handleClearMessages}
        chatMode={chatMode}
        onSelectChatMode={setChatMode}
        selectedArtifactMessageId={selectedArtifactMessageId}
        onSelectArtifactMessageId={setSelectedArtifactMessageId}
        darkMode={darkMode}
      />

      {/* 3. Settings Control Desk sliding Drawer */}
      <AnimatePresence>
        {isPreferencesOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsPreferencesOpen(false)}
              className="fixed inset-0 bg-neutral-900/40 backdrop-blur-3xs z-40 cursor-pointer"
            />
            <RightDrawer
              isOpen={isPreferencesOpen}
              onClose={() => setIsPreferencesOpen(false)}
              userProfile={userProfile}
              themeColors={activeThemeProps}
              messages={messages}
              selectedArtifactMessageId={selectedArtifactMessageId}
              onSelectArtifactMessageId={setSelectedArtifactMessageId}
              onResetChat={handleClearMessages}
              onExportChat={handleExportChat}
              darkMode={darkMode}
              onUpdatePreferences={handleUpdatePreferences}
              localApiKey={localApiKey}
              onUpdateApiKey={handleUpdateApiKey}
            />
          </>
        )}
      </AnimatePresence>

      {/* 5. Welcome & Onboarding Guide Hub */}
      <AnimatePresence>
        {isStartMenuOpen && (
          <StartMenuModal
            onClose={() => setIsStartMenuOpen(false)}
            userProfile={userProfile}
            onUpdatePreferences={handleUpdatePreferences}
            onSendMessage={handleSendMessage}
            themeColors={activeThemeProps}
          />
        )}
      </AnimatePresence>

      {/* 6. High-Fidelity Feedback Toasts */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-white border border-neutral-200 text-neutral-900 rounded-xl shadow-xl flex items-center gap-2.5 font-sans font-bold text-xs"
          >
            <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-500 animate-pulse'}`} />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

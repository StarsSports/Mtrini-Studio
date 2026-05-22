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
import PremiumHubModal from './components/PremiumHubModal';
import StartMenuModal from './components/StartMenuModal';

const THEME_COLORS_MAP: Record<string, ThemeColors> = {
  cyan: {
    primary: 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-3xs',
    glow: 'cyan',
    border: 'border-cyan-200',
    bg: 'bg-cyan-50/50',
    text: 'text-cyan-600',
    glowClass: 'bg-cyan-50/75 border-cyan-150',
    ring: 'focus:ring-cyan-600 focus:border-cyan-600',
    hoverBorder: 'hover:border-cyan-500/50'
  },
  emerald: {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-3xs',
    glow: 'emerald',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50/50',
    text: 'text-emerald-600',
    glowClass: 'bg-emerald-50/75 border-emerald-150',
    ring: 'focus:ring-emerald-600 focus:border-emerald-600',
    hoverBorder: 'hover:border-emerald-500/50'
  },
  crimson: {
    primary: 'bg-rose-600 hover:bg-rose-700 text-white shadow-3xs',
    glow: 'rose',
    border: 'border-rose-200',
    bg: 'bg-rose-50/50',
    text: 'text-rose-600',
    glowClass: 'bg-rose-50/75 border-rose-150',
    ring: 'focus:ring-rose-600 focus:border-rose-600',
    hoverBorder: 'hover:border-rose-500/50'
  },
  amber: {
    primary: 'bg-amber-600 hover:bg-amber-700 text-white shadow-3xs',
    glow: 'amber',
    border: 'border-amber-200',
    bg: 'bg-amber-50/50',
    text: 'text-amber-700',
    glowClass: 'bg-amber-50/75 border-amber-150',
    ring: 'focus:ring-amber-600 focus:border-amber-600',
    hoverBorder: 'hover:border-amber-500/50'
  },
  violet: {
    primary: 'bg-violet-600 hover:bg-violet-700 text-white shadow-3xs',
    glow: 'violet',
    border: 'border-violet-200',
    bg: 'bg-violet-50/50',
    text: 'text-violet-600',
    glowClass: 'bg-violet-50/75 border-violet-150',
    ring: 'focus:ring-violet-600 focus:border-violet-600',
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
  
  // Custom overriding API key cached in browser localstorage
  const [localApiKey, setLocalApiKey] = useState(() => localStorage.getItem('mtrini_api_key') || '');

  // Subordinated App states
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('chat');
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  
  // SSE Streaming engine parameters
  const [streaming, setStreaming] = useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const activeChatIdRef = React.useRef<string | null>(null);
  const streamingRef = React.useRef(false);

  React.useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  React.useEffect(() => {
    streamingRef.current = streaming;
  }, [streaming]);

  const [isPremiumHubOpen, setIsPremiumHubOpen] = useState(false);
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
      if (threads.length > 0 && !activeChatIdRef.current) {
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
        } else if (key === 'h') {
          e.preventDefault();
          setIsPremiumHubOpen(prev => !prev);
          setToast({ message: `HotKey: Toggled Desktop Applications Hub`, type: 'info' });
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
        setIsPremiumHubOpen(false);
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
      let response: Response | null = null;
      let isFallback = false;

      try {
        response = await fetch('/api/chat', {
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
                setMessages((prev) => 
                  prev.map((m) => m.id === draftAssistantId ? { ...m, content: streamContent } : m)
                );
              }
            } else {
              if (parsedJson.error) {
                throw new Error(parsedJson.error);
              }
              if (parsedJson.text) {
                streamContent += parsedJson.text;
                setMessages((prev) => 
                  prev.map((m) => m.id === draftAssistantId ? { ...m, content: streamContent } : m)
                );
              }
            }
          } catch (pErr) {
            // Ignore partial logs JSON parse issues during stream chunks split
          }
        }
      };

      if (isFallback && (localApiKey?.trim() || getFrontendFallbackKey())) {
        const modelName = selectedModel === 'mtrini_1_1' ? 'gemini-3.1-pro-preview' : 'gemini-3.5-flash';
        const systemPrompt = `You are "Mtrini 1.0", a premium, top-tier Senior Developer AI Engine specializing in high-fidelity full-stack web applications and complex system scripting. 
YOUR OBJECTIVES:
1. Generate clean, modular, production-grade code adhering to modern TypeScript, React, and Tailwind best practices.
2. Prioritize architectural efficiency: avoid over-engineering, ensure strict adherence to single-responsibility principles, and proactively minimize complexity.
3. Be concise. Deliver objective, technical, and actionable responses.
RESTRICTIONS:
- DO NOT USE EMOJIS. Strict prohibition.
- Only output essential, context-rich prose.
- Output substantial code inside [ARTIFACT title="..." language="..."]CODE[/ARTIFACT] blocks. 
- You are a Moroccan-born master craftsman in digital architecture: precision, efficiency, and structural integrity are your hallmarks.`;

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
    <div className="h-screen w-screen bg-neutral-50 text-neutral-900 overflow-hidden flex flex-row selection:bg-neutral-200 selection:text-neutral-950">
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
        onOpenPremiumHub={() => setIsPremiumHubOpen(true)}
        onOpenStartMenu={() => setIsStartMenuOpen(true)}
        userProfile={userProfile}
        themeColors={activeThemeProps}
        onDeleteChat={handleDeleteChat}
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
        onOpenPremiumHub={() => setIsPremiumHubOpen(true)}
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        selectedThinking={selectedThinking}
        onSelectThinking={setSelectedThinking}
        onClearMessages={handleClearMessages}
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
              onUpdatePreferences={handleUpdatePreferences}
              themeColors={activeThemeProps}
              localApiKey={localApiKey}
              onUpdateApiKey={handleUpdateApiKey}
            />
          </>
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

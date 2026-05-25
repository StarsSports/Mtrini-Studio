import React, { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ThemeColors, UserProfile, ProjectNote } from '../types';
import { Plus, FileText, Loader2, Search, Trash2, Download, CheckCircle, Clock } from 'lucide-react';

interface NotesViewProps {
  userProfile: UserProfile | null;
  themeColors: ThemeColors;
  darkMode?: boolean;
}

export default function NotesView({ userProfile, themeColors, darkMode = true }: NotesViewProps) {
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Editing state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Load notes
  useEffect(() => {
    if (!userProfile) return;
    const q = query(collection(db, 'users', userProfile.uid, 'notes'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedNotes: ProjectNote[] = [];
      snapshot.forEach(d => {
        const data = d.data();
        fetchedNotes.push({ 
          id: d.id, 
          title: data.title || '',
          content: data.content || '',
          userId: data.userId || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as ProjectNote);
      });
      setNotes(fetchedNotes);
      setLoading(false);
    });
    return unsub;
  }, [userProfile]);

  // Handle active note selection
  const activeNote = notes.find(n => n.id === activeNoteId);

  useEffect(() => {
    if (activeNote) {
      setEditTitle(activeNote.title);
      setEditContent(activeNote.content);
      setSaveStatus('idle');
    } else {
      setEditTitle('');
      setEditContent('');
    }
  }, [activeNoteId]);

  const addNote = async () => {
    if (!userProfile) return;
    try {
      const docRef = await addDoc(collection(db, 'users', userProfile.uid, 'notes'), {
        title: 'Untitled Note',
        content: '',
        userId: userProfile.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setActiveNoteId(docRef.id);
    } catch (err) {
      console.error('Error adding note:', err);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!userProfile) return;
    try {
      if (activeNoteId === noteId) {
        setActiveNoteId(null);
      }
      await deleteDoc(doc(db, 'users', userProfile.uid, 'notes', noteId));
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  // Live save handler
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleNoteChange = (newTitle: string, newContent: string) => {
    setEditTitle(newTitle);
    setEditContent(newContent);
    setSaveStatus('saving');

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      if (!userProfile || !activeNoteId) return;
      try {
        await updateDoc(doc(db, 'users', userProfile.uid, 'notes', activeNoteId), {
          title: newTitle,
          content: newContent,
          updatedAt: serverTimestamp()
        });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Error auto-saving note:', err);
        setSaveStatus('idle');
      }
    }, 1000); // 1-second debounce for Firestore saves
  };

  const handleExportNote = (title: string, content: string) => {
    const blob = new Blob([`# ${title}\n\n${content}`], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.replace(/\s+/g, '_').toLowerCase() || 'note'}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter notes
  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`flex-1 flex overflow-hidden h-full font-sans transition-all duration-200 ${
      darkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-[#fbfbf9] text-neutral-900'
    }`}>
      {/* Sidebar: Notes directory List */}
      <div className={`w-80 border-r flex flex-col h-full shrink-0 transition-all duration-200 ${
        darkMode ? 'border-neutral-900 bg-neutral-950' : 'border-neutral-200 bg-neutral-100'
      }`}>
        <div className={`p-4 border-b space-y-3 shrink-0 transition-all duration-200 ${
          darkMode ? 'border-neutral-900' : 'border-neutral-200 bg-neutral-150/40'
        }`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              darkMode ? 'text-white' : 'text-neutral-900'
            }`}>
              <FileText className={`w-4 h-4 ${themeColors.text}`} />
              <span>Project Notes</span>
            </h2>
            <button 
              onClick={addNote}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition-colors cursor-pointer shadow-3xs ${
                darkMode ? 'bg-white text-neutral-950 hover:bg-neutral-200' : 'bg-neutral-900 text-white hover:bg-neutral-800'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Note</span>
            </button>
          </div>

          {/* Search bar widget */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-neutral-500" />
            <input 
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-2 text-xs font-sans rounded-lg border focus:outline-none transition-all shadow-3xs ${
                darkMode 
                  ? 'bg-neutral-900 placeholder-neutral-500 border-neutral-850 focus:border-neutral-750 text-white' 
                  : 'bg-white placeholder-neutral-450 border-neutral-250 focus:border-neutral-450 text-neutral-900'
              }`}
            />
          </div>
        </div>

        {/* Directory Items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 select-none custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-neutral-500 w-5 h-5" />
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-10 text-neutral-500 text-xs leading-relaxed font-sans px-4">
              {searchQuery ? 'No matching notes found.' : 'Create your first project note using the button above.'}
            </div>
          ) : (
            filteredNotes.map(note => {
              const active = note.id === activeNoteId;
              const hasContent = note.content.trim().length > 0;
              const displayContent = hasContent ? note.content.substring(0, 60) : 'Blank project note';
              return (
                <div 
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 shadow-3xs text-left group ${
                    active 
                      ? (darkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-300 ring-1 ring-neutral-200') 
                      : (darkMode ? 'bg-transparent border-transparent hover:bg-neutral-900/40 hover:border-neutral-900' : 'bg-transparent border-transparent hover:bg-neutral-200/40 hover:border-neutral-250')
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`font-bold text-xs truncate max-w-[80%] ${
                      darkMode ? 'text-neutral-200' : 'text-neutral-850'
                    }`}>
                      {note.title || 'Untitled Note'}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 rounded-md transition-all shrink-0 cursor-pointer"
                      title="Delete profile note"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-neutral-500 hover:text-rose-500" />
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-500 line-clamp-2 leading-relaxed font-sans">
                    {displayContent}
                  </p>
                  <div className="flex items-center gap-1 text-[9px] text-neutral-500 mt-1 font-mono">
                    <Clock className="w-2.5 h-2.5" />
                    <span>
                      {note.updatedAt?.seconds ? new Date(note.updatedAt.seconds * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Draft'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Editor Center Stage Canvas */}
      <div className={`flex-1 flex flex-col h-full relative transition-all duration-205 ${
        darkMode ? 'bg-neutral-950' : 'bg-[#fdfdfc]'
      }`}>
        {activeNote ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header Control Panel */}
            <div className={`h-14 border-b px-6 flex items-center justify-between shrink-0 select-none transition-all duration-200 ${
              darkMode ? 'border-neutral-900 bg-[#0d0d0f]' : 'border-neutral-200 bg-neutral-100/70'
            }`}>
              <div className="flex items-center gap-3">
                {saveStatus === 'saving' && (
                  <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-pulse">
                    <Loader2 className="animate-spin text-amber-500 w-3 h-3" />
                    <span>Syncing cloud...</span>
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    <CheckCircle className="text-emerald-500 w-3 h-3" />
                    <span>Snapshot Saved</span>
                  </span>
                )}
                {saveStatus === 'idle' && (
                  <span className="text-[10px] text-neutral-500 font-bold flex items-center gap-1.5">
                    <CheckCircle className="text-neutral-500 w-3 h-3" />
                    <span>All changes saved</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleExportNote(editTitle, editContent)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border text-[11px] font-bold rounded-xl transition-all shadow-3xs cursor-pointer ${
                    darkMode 
                      ? 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300' 
                      : 'bg-white border-neutral-250 hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900'
                  }`}
                  title="Export note as markdown file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Markdown</span>
                </button>
                <button 
                  onClick={() => deleteNote(activeNoteId!)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border text-rose-505 text-[11px] font-bold rounded-xl transition-all shadow-3xs cursor-pointer ${
                    darkMode 
                      ? 'bg-neutral-900 hover:bg-rose-950/40 border-neutral-800 hover:border-rose-900 text-rose-400' 
                      : 'bg-white hover:bg-rose-100/50 border-red-200 hover:border-red-300 text-rose-600'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Note</span>
                </button>
              </div>
            </div>

            {/* Input canvases */}
            <div className="flex-1 flex flex-col p-8 space-y-4 overflow-y-auto">
              <input 
                type="text"
                value={editTitle}
                onChange={(e) => handleNoteChange(e.target.value, editContent)}
                placeholder="Title your project note..."
                className={`w-full text-2xl font-bold font-sans bg-transparent pb-3 focus:outline-none border-b transition-all duration-200 ${
                  darkMode ? 'text-white border-neutral-905 placeholder-neutral-750' : 'text-neutral-900 border-neutral-200 placeholder-neutral-400'
                }`}
              />
              <textarea 
                value={editContent}
                onChange={(e) => handleNoteChange(editTitle, e.target.value)}
                placeholder="Write your note markdown here... Add ideas, script drafts, and reference guides..."
                className={`w-full flex-1 text-sm font-sans bg-transparent leading-relaxed resize-none focus:outline-none transition-all duration-200 ${
                  darkMode ? 'text-neutral-300 placeholder-neutral-750' : 'text-neutral-700 placeholder-neutral-400'
                }`}
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none space-y-3 max-w-md mx-auto">
            <div className={`p-4 rounded-full border transition-all duration-200 ${
              darkMode ? 'bg-neutral-900 text-neutral-500 border-neutral-850' : 'bg-white text-neutral-400 border-neutral-200 shadow-3xs'
            }`}>
              <FileText className="w-10 h-10" />
            </div>
            <h3 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-neutral-900'}`}>Workspace Note Canvas</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Create a new note or select an existing one from the left directory to track project requirements, snippets, and interview materials. Everything is synced securely in real-time.
            </p>
            <button
              onClick={addNote}
              className={`flex items-center gap-1.5 px-4 py-2 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-3xs ${
                darkMode ? 'bg-white text-neutral-950 hover:bg-neutral-200' : 'bg-neutral-900 text-white hover:bg-neutral-800'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Create First Note</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ThemeColors, UserProfile, ProjectNote } from '../types';
import { Plus, FileText, Loader2, Search, Trash2, Download, Save, CheckCircle, Clock } from 'lucide-react';

interface NotesViewProps {
  userProfile: UserProfile | null;
  themeColors: ThemeColors;
}

export default function NotesView({ userProfile, themeColors }: NotesViewProps) {
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
    <div className="flex-1 flex overflow-hidden bg-neutral-50 h-full font-sans text-neutral-900">
      {/* Sidebar: Notes directory List */}
      <div className="w-80 border-r border-neutral-200 bg-white flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-neutral-200 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
              <FileText className={`w-4 h-4 ${themeColors.text}`} />
              <span>Project Notes</span>
            </h2>
            <button 
              onClick={addNote}
              className={`flex items-center gap-1 px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer shadow-3xs`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Note</span>
            </button>
          </div>

          {/* Search bar widget */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-neutral-400" />
            <input 
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-neutral-100 placeholder-neutral-400 text-xs font-sans rounded-lg border border-transparent focus:bg-white focus:outline-none focus:border-neutral-300 transition-all shadow-3xs"
            />
          </div>
        </div>

        {/* Directory Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 p-2 space-y-1 select-none custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-neutral-400 w-5 h-5" />
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-10 text-neutral-400 text-xs leading-relaxed font-sans px-4">
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
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 shadow-3xs text-left group ${active ? 'bg-neutral-100 border-neutral-200' : 'bg-transparent border-transparent hover:bg-neutral-50 hover:border-neutral-100'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-neutral-950 truncate max-w-[80%]">
                      {note.title || 'Untitled Note'}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-600 p-0.5 rounded-md transition-all shrink-0 cursor-pointer"
                      title="Delete profile note"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-neutral-400 hover:text-rose-500" />
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-500 line-clamp-2 leading-relaxed">
                    {displayContent}
                  </p>
                  <div className="flex items-center gap-1 text-[9px] text-neutral-400 mt-1 font-mono">
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
      <div className="flex-1 flex flex-col h-full bg-white relative">
        {activeNote ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Header Control Panel */}
            <div className="h-14 border-b border-neutral-200 px-6 flex items-center justify-between shrink-0 select-none bg-neutral-50">
              <div className="flex items-center gap-3">
                {saveStatus === 'saving' && (
                  <span className="text-[10px] text-neutral-500 font-bold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    <Loader2 className="animate-spin text-amber-500 w-3 h-3" />
                    <span>Syncing cloud...</span>
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-150 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    <CheckCircle className="text-emerald-500 w-3 h-3" />
                    <span>Snapshot Saved</span>
                  </span>
                )}
                {saveStatus === 'idle' && (
                  <span className="text-[10px] text-neutral-400 font-bold flex items-center gap-1.5">
                    <CheckCircle className="text-neutral-300 w-3 h-3" />
                    <span>All changes saved</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleExportNote(editTitle, editContent)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-700 text-[11px] font-bold rounded-xl transition-all shadow-3xs cursor-pointer"
                  title="Export note as markdown file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Markdown</span>
                </button>
                <button 
                  onClick={() => deleteNote(activeNoteId!)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold rounded-xl hover:bg-rose-100 transition-all shadow-3xs cursor-pointer"
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
                className="w-full text-2xl font-bold font-sans placeholder-neutral-300 text-neutral-900 border-b border-neutral-100 pb-3 focus:outline-none"
              />
              <textarea 
                value={editContent}
                onChange={(e) => handleNoteChange(editTitle, e.target.value)}
                placeholder="Write your note markdown here... Add ideas, script drafts, and reference guides..."
                className="w-full flex-1 text-sm font-sans placeholder-neutral-300 text-neutral-800 leading-relaxed resize-none focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none space-y-3 max-w-md mx-auto">
            <div className="p-4 rounded-full bg-neutral-100 text-neutral-400">
              <FileText className="w-10 h-10" />
            </div>
            <h3 className="font-extrabold text-neutral-900 text-base">Workspace Note Canvas</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Create a new note or select an existing one from the left directory to track project requirements, snippets, and interview materials. Everything is synced securely in real-time.
            </p>
            <button
              onClick={addNote}
              className={`flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-3xs`}
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

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotes, pinNote, unpinNote, archiveNote, deleteNote } from '../../services/offlineApi';
import NoteCard from '../../components/NoteCard';
import SearchBar from '../../components/SearchBar';
import { Plus, LayoutGrid, List, SlidersHorizontal, Loader2, Sparkles } from 'lucide-react';

interface Note {
    id: string | number;
    title: string;
    content: string;
    color?: string;
    is_pinned?: boolean;
    is_archived?: boolean;
    created_at: string;
    updated_at: string;
    labels?: Array<{ id: number; name: string; color: string }>;
    checklist_items?: Array<{ id: number; text: string; is_completed: boolean }>;
    images?: Array<{ id: number; image_url: string }>;
    audio_recordings?: Array<{ id: number; file_url: string }>;
    drawings?: Array<{ id: number; image_url: string }>;
    reminder?: { remind_at: string } | null;
}

export default function NotesPage() {
    const navigate = useNavigate();
    const [notes, setNotes] = useState<Note[]>([]);
    const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        fetchNotes();
    }, []);

    useEffect(() => {
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const filtered = notes.filter(note =>
                note.title?.toLowerCase().includes(query) ||
                note.content?.toLowerCase().includes(query) ||
                note.labels?.some(label => label.name.toLowerCase().includes(query))
            );
            setFilteredNotes(filtered);
        } else {
            setFilteredNotes(notes);
        }
    }, [searchQuery, notes]);

    const fetchNotes = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getNotes();

            const activeNotes = data.filter(note => !note.is_archived && !note.is_deleted);

            const sorted = activeNotes.sort((a, b) => {
                if (a.is_pinned && !b.is_pinned) return -1;
                if (!a.is_pinned && b.is_pinned) return 1;
                return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
            });

            setNotes(sorted);
            setFilteredNotes(sorted);
        } catch (err: any) {
            console.error('Failed to fetch notes:', err);
            setError('Failed to load notes. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePin = async (id: string | number) => {
        const note = notes.find(n => n.id === id);
        if (!note) return;
        try {
            if (note.is_pinned) await unpinNote(id);
            else await pinNote(id);
            await fetchNotes();
        } catch (err) {
            console.error('Failed to pin/unpin note:', err);
        }
    };

    const handleArchive = async (id: string | number) => {
        try {
            await archiveNote(id);
            await fetchNotes();
        } catch (err) {
            console.error('Failed to archive note:', err);
        }
    };

    const handleDelete = async (id: string | number) => {
        try {
            await deleteNote(id);
            await fetchNotes();
        } catch (err) {
            console.error('Failed to delete note:', err);
        }
    };

    return (
        <div className="min-h-screen bg-transparent">
            <div className="max-w-7xl mx-auto px-6 py-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 rotate-3">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">My Notes</h1>
                            <p className="text-sm text-gray-500 font-medium">Capture your thoughts instantly</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <SearchBar onSearch={setSearchQuery} />
                        <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-gray-400'}`}
                            >
                                <LayoutGrid size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-gray-400'}`}
                            >
                                <List size={20} />
                            </button>
                        </div>
                        <button className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm text-gray-500 hover:text-primary transition-colors">
                            <SlidersHorizontal size={20} />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-32 gap-4">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-gray-500 font-medium animate-pulse">Syncing your thoughts...</p>
                    </div>
                ) : error ? (
                    <div className="max-w-lg mx-auto bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-8 rounded-3xl text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <X className="text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-red-900 dark:text-red-400 mb-2">Connection Issue</h3>
                        <p className="text-red-700 dark:text-red-500/70 mb-6">{error}</p>
                        <button onClick={fetchNotes} className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all">
                            Try Again
                        </button>
                    </div>
                ) : filteredNotes.length === 0 ? (
                    <div className="text-center py-32 flex flex-col items-center">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-[2.5rem] flex items-center justify-center mb-8 rotate-12 transition-transform hover:rotate-0 duration-500 group">
                            <Sparkles className="w-12 h-12 text-gray-300 group-hover:text-primary transition-colors" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            {searchQuery ? 'No match found' : 'Start your journey'}
                        </h3>
                        <p className="text-gray-500 max-w-sm mb-10 leading-relaxed font-medium">
                            {searchQuery
                                ? "We couldn't find any notes matching your search request."
                                : "Create your first note to begin capturing your ideas and organizing your life."}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => navigate('/notes/create')}
                                className="group flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-[2rem] font-extrabold shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-1 transition-all"
                            >
                                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                                <span>Create Note</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={`
                        grid gap-6 
                        ${viewMode === 'grid'
                            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
                            : 'grid-cols-1 max-w-3xl mx-auto'
                        }
                        animate-in fade-in duration-500
                    `}>
                        {filteredNotes.map((note) => (
                            <NoteCard
                                key={note.id}
                                note={note}
                                onPin={handlePin}
                                onArchive={handleArchive}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Action Button */}
            {!loading && filteredNotes.length > 0 && (
                <button
                    onClick={() => navigate('/notes/create')}
                    className="
                        fixed bottom-8 right-8 w-16 h-16 
                        bg-primary hover:bg-primary-dark text-white 
                        rounded-2xl shadow-2xl hover:shadow-primary/40 
                        transition-all duration-300 flex items-center justify-center 
                        hover:-translate-y-2 hover:rotate-6
                    "
                    title="Create new note"
                >
                    <Plus className="w-8 h-8" />
                </button>
            )}
        </div>
    );
}

const X = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

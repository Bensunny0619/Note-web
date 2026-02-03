import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotes, pinNote, unpinNote, archiveNote, deleteNote } from '../../services/offlineApi';
import NoteCard from '../../components/NoteCard';
import SearchBar from '../../components/SearchBar';

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
    audio_recordings?: Array<{ id: number; audio_url: string }>;
    drawings?: Array<{ id: number; drawing_url: string }>;
    reminder?: { remind_at: string } | null;
}

export default function NotesPage() {
    const navigate = useNavigate();
    const [notes, setNotes] = useState<Note[]>([]);
    const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchNotes();
    }, []);

    useEffect(() => {
        // Filter notes based on search query
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

            // Filter out archived and deleted notes
            const activeNotes = data.filter(note => !note.is_archived && !note.is_deleted);

            // Sort: pinned notes first, then by updated_at
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
            if (note.is_pinned) {
                await unpinNote(id);
            } else {
                await pinNote(id);
            }
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
        if (window.confirm('Are you sure you want to delete this note?')) {
            try {
                await deleteNote(id);
                await fetchNotes();
            } catch (err) {
                console.error('Failed to delete note:', err);
            }
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const handleCreateNote = () => {
        navigate('/notes/create');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Notes</h1>

                    {/* Search Bar */}
                    <SearchBar onSearch={handleSearch} />
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && filteredNotes.length === 0 && (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                            {searchQuery ? 'No notes found' : 'No notes yet'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {searchQuery ? 'Try a different search term' : 'Create your first note to get started'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={handleCreateNote}
                                className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Create Note
                            </button>
                        )}
                    </div>
                )}

                {/* Notes Grid */}
                {!loading && !error && filteredNotes.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
            <button
                onClick={handleCreateNote}
                className="fixed bottom-8 right-8 w-14 h-14 bg-primary hover:bg-primary-dark text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                title="Create new note"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </button>
        </div>
    );
}

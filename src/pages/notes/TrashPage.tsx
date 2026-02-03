import { useState, useEffect } from 'react';
import { getNotes, restoreNote, permanentlyDeleteNote } from '../../services/offlineApi';
import NoteCard from '../../components/NoteCard';
import { Trash2, Loader2, RotateCcw, XCircle } from 'lucide-react';

interface Note {
    id: string | number;
    title: string;
    content: string;
    color?: string;
    is_pinned?: boolean;
    is_archived?: boolean;
    is_deleted?: boolean;
    created_at: string;
    updated_at: string;
    labels?: Array<{ id: number; name: string; color: string }>;
    checklist_items?: Array<{ id: number; text: string; is_completed: boolean }>;
    images?: Array<{ id: number; image_url: string }>;
    audio_recordings?: Array<{ id: number; file_url: string }>;
    drawings?: Array<{ id: number; image_url: string }>;
    reminder?: { remind_at: string } | null;
}

const TrashPage: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDeletedNotes();
    }, []);

    const fetchDeletedNotes = async () => {
        try {
            setLoading(true);
            const data = await getNotes();
            const deletedNotes = data.filter(note => note.is_deleted);
            setNotes(deletedNotes.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (id: string | number) => {
        try {
            await restoreNote(id);
            await fetchDeletedNotes();
        } catch (err) {
            console.error(err);
        }
    };

    const handlePermanentDelete = async (id: string | number) => {
        if (window.confirm('Permanently delete this note? This action cannot be undone.')) {
            try {
                // Assuming there's a permanentlyDeleteNote or just use deleteNote if it handles it
                // For now, let's assume restoreNote is the way to bring it back, and we might need a new API call for permanent
                if (typeof permanentlyDeleteNote === 'function') {
                    await permanentlyDeleteNote(id);
                } else {
                    console.warn('permanentlyDeleteNote not implemented in offlineApi');
                }
                await fetchDeletedNotes();
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <div className="min-h-screen bg-transparent">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-500 shadow-sm -rotate-6">
                            <Trash2 size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Trash</h1>
                            <p className="text-sm text-gray-500 font-medium">Notes here are deleted after 30 days</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col justify-center items-center py-32 gap-4">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-gray-500 font-medium">Cleaning up...</p>
                    </div>
                ) : notes.length === 0 ? (
                    <div className="text-center py-32 flex flex-col items-center">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-[2.5rem] flex items-center justify-center mb-8">
                            <Trash2 className="w-12 h-12 text-gray-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Trash is empty</h3>
                        <p className="text-gray-500 max-w-sm font-medium">
                            No notes in trash. When you delete a note, it stays here for a while before being permanently deleted.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 animate-in fade-in duration-500">
                        {notes.map((note) => (
                            <div key={note.id} className="relative group opacity-75 hover:opacity-100 transition-opacity">
                                <NoteCard
                                    note={note}
                                    onDelete={() => handlePermanentDelete(note.id)}
                                />
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                        onClick={() => handleRestore(note.id)}
                                        className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg hover:text-green-500 transition-colors"
                                        title="Restore"
                                    >
                                        <RotateCcw size={16} />
                                    </button>
                                    <button
                                        onClick={() => handlePermanentDelete(note.id)}
                                        className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg hover:text-red-500 transition-colors"
                                        title="Delete Permanently"
                                    >
                                        <XCircle size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrashPage;

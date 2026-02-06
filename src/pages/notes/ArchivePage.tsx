import { useState, useEffect } from 'react';
import { getArchivedNotes, deleteNote, unarchiveNote } from '../../services/offlineApi';
import NoteCard from '../../components/NoteCard';
import { Archive, Loader2, RefreshCw } from 'lucide-react';

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

const ArchivePage: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchArchivedNotes();
    }, []);

    const fetchArchivedNotes = async () => {
        try {
            setLoading(true);
            const archivedNotes = await getArchivedNotes();
            setNotes(archivedNotes.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUnarchive = async (id: string | number) => {
        try {
            await unarchiveNote(id);
            await fetchArchivedNotes();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-transparent">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex items-center gap-4 mb-12">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-500 shadow-sm">
                        <Archive size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Archive</h1>
                        <p className="text-sm text-gray-500 font-medium">Keep your mental space clean</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col justify-center items-center py-32 gap-4">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-gray-500 font-medium">Loading archive...</p>
                    </div>
                ) : notes.length === 0 ? (
                    <div className="text-center py-32 flex flex-col items-center">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-[2.5rem] flex items-center justify-center mb-8 rotate-6">
                            <Archive className="w-12 h-12 text-gray-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Archive is empty</h3>
                        <p className="text-gray-500 max-w-sm font-medium">
                            Your archived notes will appear here. Archiving helps you hide notes you don't need right now without deleting them.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 animate-in fade-in duration-500">
                        {notes.map((note) => (
                            <div key={note.id} className="relative group">
                                <NoteCard
                                    note={note}
                                    onArchive={() => handleUnarchive(note.id)}
                                    onDelete={() => deleteNote(note.id).then(fetchArchivedNotes)}
                                />
                                <button
                                    onClick={() => handleUnarchive(note.id)}
                                    className="absolute top-2 right-2 p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg hover:scale-110 opacity-0 group-hover:opacity-100 transition-all text-primary"
                                    title="Unarchive"
                                >
                                    <RefreshCw size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ArchivePage;

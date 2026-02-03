import { useState, useEffect } from 'react';
import { getNotes, pinNote, unpinNote, archiveNote, deleteNote } from '../../services/offlineApi';
import NoteCard from '../../components/NoteCard';
import { Bell, Loader2, Calendar, Sparkles } from 'lucide-react';

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

const RemindersPage: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchNotesWithReminders();
    }, []);

    const fetchNotesWithReminders = async () => {
        try {
            setLoading(true);
            const data = await getNotes();

            // Filter notes that have reminders and are not archived/deleted
            const reminderNotes = data.filter(note =>
                note.reminder && !note.is_archived && !note.is_deleted
            );

            // Sort by reminder date (upcoming first)
            const sorted = reminderNotes.sort((a, b) => {
                const dateA = new Date(a.reminder!.remind_at).getTime();
                const dateB = new Date(b.reminder!.remind_at).getTime();
                return dateA - dateB;
            });

            setNotes(sorted);
        } catch (err: any) {
            console.error('Failed to fetch reminders:', err);
            setError('Failed to load reminders.');
        } finally {
            setLoading(false);
        }
    };

    const handlePin = async (id: string | number) => {
        try {
            const note = notes.find(n => n.id === id);
            if (!note) return;
            if (note.is_pinned) await unpinNote(id);
            else await pinNote(id);
            await fetchNotesWithReminders();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-transparent">
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex items-center gap-4 mb-12">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm rotate-6">
                        <Bell size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Reminders</h1>
                        <p className="text-sm text-gray-500 font-medium">Never miss an important thought</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col justify-center items-center py-32 gap-4">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-gray-500 font-medium">Fetching reminders...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20 text-red-500">{error}</div>
                ) : notes.length === 0 ? (
                    <div className="text-center py-32 flex flex-col items-center">
                        <div className="relative mb-8">
                            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-[2.5rem] flex items-center justify-center -rotate-12">
                                <Calendar className="w-12 h-12 text-gray-300" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-lg">
                                <Sparkles className="w-4 h-4 text-primary" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No upcoming reminders</h3>
                        <p className="text-gray-500 max-w-sm font-medium">
                            Notes with upcoming reminders will appear here. You can set a reminder when creating or editing a note.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 animate-in fade-in duration-500">
                        {notes.map((note) => (
                            <div key={note.id} className="relative group">
                                <div className="absolute -top-3 left-6 z-10 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-orange-500/20 flex items-center gap-1.5">
                                    <Bell size={10} />
                                    {new Date(note.reminder!.remind_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <NoteCard
                                    note={note}
                                    onPin={handlePin}
                                    onArchive={() => archiveNote(note.id).then(fetchNotesWithReminders)}
                                    onDelete={() => deleteNote(note.id).then(fetchNotesWithReminders)}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RemindersPage;

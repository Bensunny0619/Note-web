import { useState, useEffect } from 'react';
import { getNotes, pinNote, unpinNote, archiveNote, deleteNote } from '../../services/offlineApi';
import NoteCard from '../../components/NoteCard';
import SearchBar from '../../components/SearchBar';
import { Bell, Loader2, Calendar, Sparkles, X, CheckSquare, Square, Trash2, Archive } from 'lucide-react';

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
    checklist_items?: Array<{ id: number; text: string; is_checked: boolean; is_completed?: boolean }>;
    images?: Array<{ id: number; image_url: string }>;
    audio_recordings?: Array<{ id: number; audio_url: string }>;
    drawings?: Array<{ id: number; drawing_url: string }>;
    reminder?: { remind_at: string } | null;
    reminder_at?: string | null;
}

const RemindersPage: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

    useEffect(() => {
        fetchNotesWithReminders();
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredNotes(notes);
            return;
        }
        const query = searchQuery.toLowerCase();
        const filtered = notes.filter(note =>
            note.title?.toLowerCase().includes(query) ||
            note.content?.toLowerCase().includes(query) ||
            note.labels?.some(label => label.name.toLowerCase().includes(query))
        );
        setFilteredNotes(filtered);
    }, [searchQuery, notes]);

    const fetchNotesWithReminders = async () => {
        try {
            setLoading(true);
            const data = await getNotes();

            // Filter notes that have reminders and are not archived/deleted
            const reminderNotes = data.filter(note =>
                (note.reminder || note.reminder_at) && !note.is_archived && !note.is_deleted
            );

            // Sort by reminder date (upcoming first)
            const sorted = reminderNotes.sort((a, b) => {
                const dateA = new Date(a.reminder?.remind_at || a.reminder_at || 0).getTime();
                const dateB = new Date(b.reminder?.remind_at || b.reminder_at || 0).getTime();
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

    const toggleSelection = (id: string | number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkArchive = async () => {
        if (!selectedIds.length) return;
        try {
            await Promise.all(selectedIds.map(id => archiveNote(id)));
            setSelectedIds([]);
            await fetchNotesWithReminders();
        } catch (err) {
            console.error('Bulk archive failed:', err);
        }
    };

    const handleBulkDelete = async () => {
        if (!selectedIds.length) return;
        if (window.confirm(`Delete ${selectedIds.length} notes?`)) {
            try {
                await Promise.all(selectedIds.map(id => deleteNote(id)));
                setSelectedIds([]);
                await fetchNotesWithReminders();
            } catch (err) {
                console.error('Bulk delete failed:', err);
            }
        }
    };

    const selectAll = () => {
        if (selectedIds.length === notes.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(notes.map(n => n.id));
        }
    };

    return (
        <div className="min-h-screen bg-transparent">
            <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    {selectedIds.length > 0 ? (
                        <div className="flex items-center gap-6 animate-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setSelectedIds([])}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-500"
                                >
                                    <X size={24} />
                                </button>
                                <h2 className="text-2xl font-bold text-orange-500">{selectedIds.length} selected</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={selectAll}
                                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-600 dark:text-gray-400 font-medium"
                                >
                                    {selectedIds.length === notes.length ? <CheckSquare size={20} /> : <Square size={20} />}
                                    <span>{selectedIds.length === notes.length ? 'Deselect All' : 'Select All'}</span>
                                </button>
                                <button
                                    onClick={handleBulkArchive}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-all font-bold"
                                >
                                    <Archive size={20} />
                                    <span>Archive</span>
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-all font-bold"
                                >
                                    <Trash2 size={20} />
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm rotate-6">
                                <Bell size={24} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                    Homa<span className="text-primary">.</span> Reminders
                                </h1>
                                <p className="text-sm text-gray-500 font-medium">Never miss an important thought</p>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <SearchBar onSearch={setSearchQuery} placeholder="Search in reminders..." />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col justify-center items-center py-32 gap-4">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-gray-500 font-medium">Fetching reminders...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20 text-red-500">{error}</div>
                ) : filteredNotes.length === 0 ? (
                    <div className="text-center py-32 flex flex-col items-center">
                        <div className="relative mb-8">
                            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-[2.5rem] flex items-center justify-center -rotate-12">
                                <Calendar className="w-12 h-12 text-gray-300" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-lg">
                                <Sparkles className="w-4 h-4 text-primary" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            {searchQuery ? 'No match found' : 'No upcoming reminders'}
                        </h3>
                        <p className="text-gray-500 max-w-sm font-medium">
                            {searchQuery
                                ? "We couldn't find any reminders matching your search."
                                : "Notes with upcoming reminders will appear here. You can set a reminder when creating or editing a note."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 animate-in fade-in duration-500">
                        {filteredNotes.map((note) => (
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
                                    isSelected={selectedIds.includes(note.id)}
                                    onSelect={() => toggleSelection(note.id)}
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

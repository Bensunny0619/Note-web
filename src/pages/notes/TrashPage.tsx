import { useState, useEffect } from 'react';
import { getDeletedNotes, restoreNote, permanentlyDeleteNote } from '../../services/offlineApi';
import NoteCard from '../../components/NoteCard';
import SearchBar from '../../components/SearchBar';
import { Trash2, Loader2, RotateCcw, XCircle, X, CheckSquare, Square } from 'lucide-react';

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
}

const TrashPage: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

    useEffect(() => {
        fetchDeletedNotes();
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

    const fetchDeletedNotes = async () => {
        try {
            setLoading(true);
            const deletedNotes = await getDeletedNotes();
            const sorted = deletedNotes.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
            setNotes(sorted);
            setFilteredNotes(sorted);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (id: string | number) => {
        try {
            await restoreNote(id);
            if (selectedIds.includes(id)) {
                setSelectedIds(prev => prev.filter(i => i !== id));
            }
            await fetchDeletedNotes();
        } catch (err) {
            console.error(err);
        }
    };

    const handlePermanentDelete = async (id: string | number) => {
        if (window.confirm('Permanently delete this note? This action cannot be undone.')) {
            try {
                if (typeof permanentlyDeleteNote === 'function') {
                    await permanentlyDeleteNote(id);
                }
                if (selectedIds.includes(id)) {
                    setSelectedIds(prev => prev.filter(i => i !== id));
                }
                await fetchDeletedNotes();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const toggleSelection = (id: string | number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkRestore = async () => {
        if (!selectedIds.length) return;
        try {
            await Promise.all(selectedIds.map(id => restoreNote(id)));
            setSelectedIds([]);
            await fetchDeletedNotes();
        } catch (err) {
            console.error('Bulk restore failed:', err);
        }
    };

    const handleBulkPermanentDelete = async () => {
        if (!selectedIds.length) return;
        if (window.confirm(`Permanently delete ${selectedIds.length} notes? This cannot be undone.`)) {
            try {
                await Promise.all(selectedIds.map(id => permanentlyDeleteNote(id)));
                setSelectedIds([]);
                await fetchDeletedNotes();
            } catch (err) {
                console.error('Bulk permanent delete failed:', err);
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
                                <h2 className="text-2xl font-bold text-red-500">{selectedIds.length} selected</h2>
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
                                    onClick={handleBulkRestore}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-xl transition-all font-bold"
                                >
                                    <RotateCcw size={20} />
                                    <span>Restore</span>
                                </button>
                                <button
                                    onClick={handleBulkPermanentDelete}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-all font-bold"
                                >
                                    <XCircle size={20} />
                                    <span>Delete Forever</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-500 shadow-sm -rotate-6">
                                <Trash2 size={24} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                    Homa<span className="text-primary">.</span> Trash
                                </h1>
                                <p className="text-sm text-gray-500 font-medium">Notes here are deleted after 30 days</p>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <SearchBar onSearch={setSearchQuery} placeholder="Search in trash..." />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col justify-center items-center py-32 gap-4">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-gray-500 font-medium">Cleaning up...</p>
                    </div>
                ) : filteredNotes.length === 0 ? (
                    <div className="text-center py-32 flex flex-col items-center">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-[2.5rem] flex items-center justify-center mb-8">
                            <Trash2 className="w-12 h-12 text-gray-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            {searchQuery ? 'No match found' : 'Trash is empty'}
                        </h3>
                        <p className="text-gray-500 max-w-sm font-medium">
                            {searchQuery
                                ? "We couldn't find any deleted notes matching your search."
                                : "No notes in trash. When you delete a note, it stays here for a while before being permanently deleted."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 animate-in fade-in duration-500">
                        {filteredNotes.map((note) => (
                            <div key={note.id} className="relative group opacity-75 hover:opacity-100 transition-opacity">
                                <NoteCard
                                    note={note}
                                    onDelete={() => handlePermanentDelete(note.id)}
                                    isSelected={selectedIds.includes(note.id)}
                                    onSelect={() => toggleSelection(note.id)}
                                />
                                {!selectedIds.length && (
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
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrashPage;

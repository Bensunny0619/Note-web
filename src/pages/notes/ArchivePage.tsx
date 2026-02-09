import { useState, useEffect } from 'react';
import { getArchivedNotes, deleteNote, unarchiveNote } from '../../services/offlineApi';
import NoteCard from '../../components/NoteCard';
import SearchBar from '../../components/SearchBar';
import { Archive, Loader2, RefreshCw, X, CheckSquare, Square, Trash2 } from 'lucide-react';

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

const ArchivePage: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

    useEffect(() => {
        fetchArchivedNotes();
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

    const fetchArchivedNotes = async () => {
        try {
            setLoading(true);
            const archivedNotes = await getArchivedNotes();
            const sorted = archivedNotes.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
            setNotes(sorted);
            setFilteredNotes(sorted);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUnarchive = async (id: string | number) => {
        try {
            await unarchiveNote(id);
            if (selectedIds.includes(id)) {
                setSelectedIds(prev => prev.filter(i => i !== id));
            }
            await fetchArchivedNotes();
        } catch (err) {
            console.error(err);
        }
    };

    const toggleSelection = (id: string | number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkUnarchive = async () => {
        if (!selectedIds.length) return;
        try {
            await Promise.all(selectedIds.map(id => unarchiveNote(id)));
            setSelectedIds([]);
            await fetchArchivedNotes();
        } catch (err) {
            console.error('Bulk unarchive failed:', err);
        }
    };

    const handleBulkDelete = async () => {
        if (!selectedIds.length) return;
        if (window.confirm(`Delete ${selectedIds.length} notes?`)) {
            try {
                await Promise.all(selectedIds.map(id => deleteNote(id)));
                setSelectedIds([]);
                await fetchArchivedNotes();
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
                                <h2 className="text-2xl font-bold text-primary">{selectedIds.length} selected</h2>
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
                                    onClick={handleBulkUnarchive}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-all font-bold"
                                >
                                    <RefreshCw size={20} />
                                    <span>Unarchive</span>
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
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm rotate-3">
                                <Archive size={24} fill="currentColor" fillOpacity={0.2} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                    Homa<span className="text-primary">.</span> Archive
                                </h1>
                                <p className="text-sm text-gray-500 font-medium">Keep your mental space clean</p>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <SearchBar onSearch={setSearchQuery} placeholder="Search in archive..." />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col justify-center items-center py-32 gap-4">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-gray-500 font-medium">Loading archive...</p>
                    </div>
                ) : filteredNotes.length === 0 ? (
                    <div className="text-center py-32 flex flex-col items-center">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-[2.5rem] flex items-center justify-center mb-8 rotate-6">
                            <Archive className="w-12 h-12 text-gray-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            {searchQuery ? 'No match found' : 'Archive is empty'}
                        </h3>
                        <p className="text-gray-500 max-w-sm font-medium">
                            {searchQuery
                                ? "We couldn't find any archived notes matching your search."
                                : "Your archived notes will appear here. Archiving helps you hide notes you don't need right now without deleting them."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 animate-in fade-in duration-500">
                        {filteredNotes.map((note) => (
                            <div key={note.id} className="relative group">
                                <NoteCard
                                    note={note}
                                    onArchive={() => handleUnarchive(note.id)}
                                    onDelete={() => deleteNote(note.id).then(fetchArchivedNotes)}
                                    isSelected={selectedIds.includes(note.id)}
                                    onSelect={() => toggleSelection(note.id)}
                                />
                                {!selectedIds.length && (
                                    <button
                                        onClick={() => handleUnarchive(note.id)}
                                        className="absolute top-2 right-2 p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg hover:scale-110 opacity-0 group-hover:opacity-100 transition-all text-primary"
                                        title="Unarchive"
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ArchivePage;

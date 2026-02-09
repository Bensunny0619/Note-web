import React, { useState } from 'react';
import { useLabels } from '../../contexts/LabelContext';
import { Tag, Plus, Edit2, Trash2, Check, X, Loader2 } from 'lucide-react';

const LabelsPage: React.FC = () => {
    const { labels, loading, createLabel, updateLabel, deleteLabel } = useLabels();
    const [newLabelName, setNewLabelName] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (!newLabelName.trim()) return;
        try {
            setIsCreating(true);
            await createLabel(newLabelName.trim());
            setNewLabelName('');
        } catch (error) {
            console.error(error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdate = async (id: number) => {
        if (!editingName.trim()) return;
        try {
            await updateLabel(id, editingName.trim());
            setEditingId(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Delete this label? Notes using this label will not be deleted.')) {
            try {
                await deleteLabel(id);
            } catch (error) {
                console.error(error);
            }
        }
    };

    return (
        <div className="min-h-screen bg-transparent">
            <div className="max-w-3xl mx-auto px-6 py-12">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm rotate-3">
                        <Tag size={24} fill="currentColor" fillOpacity={0.2} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                            Homa<span className="text-primary">.</span> Labels
                        </h1>
                        <p className="text-sm text-gray-500 font-medium">Organize your thoughts with labels</p>
                    </div>
                </div>

                {/* Create Label Input */}
                <div className="relative mb-10">
                    <input
                        type="text"
                        value={newLabelName}
                        onChange={(e) => setNewLabelName(e.target.value)}
                        placeholder="Create new label..."
                        className="w-full pl-12 pr-12 py-4 bg-white dark:bg-gray-800 border-none rounded-2xl shadow-xl shadow-black/5 dark:shadow-none dark:border dark:border-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/20 transition-all text-lg font-medium"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Plus size={20} />
                    </div>
                    {isCreating ? (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        </div>
                    ) : newLabelName && (
                        <button
                            onClick={handleCreate}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-primary hover:text-primary-dark font-bold"
                        >
                            Save
                        </button>
                    )}
                </div>

                {/* Label List */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {labels.length === 0 ? (
                            <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/20 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-700/50">
                                <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-medium">No labels yet. Start categorizing!</p>
                            </div>
                        ) : (
                            labels.map((label) => (
                                <div
                                    key={label.id}
                                    className="group flex items-center gap-4 p-4 bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-gray-700/50 transition-all hover:shadow-lg hover:shadow-black/5"
                                >
                                    <Tag className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />

                                    <div className="flex-1">
                                        {editingId === label.id ? (
                                            <input
                                                autoFocus
                                                type="text"
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleUpdate(label.id)}
                                                onBlur={() => setEditingId(null)}
                                                className="w-full bg-transparent border-none p-0 focus:ring-0 text-gray-900 dark:text-white font-semibold"
                                            />
                                        ) : (
                                            <span className="text-gray-900 dark:text-gray-200 font-semibold">{label.name}</span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {editingId === label.id ? (
                                            <>
                                                <button
                                                    onClick={() => handleUpdate(label.id)}
                                                    className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 rounded-xl"
                                                >
                                                    <Check size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setEditingId(label.id);
                                                        setEditingName(label.name);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(label.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LabelsPage;

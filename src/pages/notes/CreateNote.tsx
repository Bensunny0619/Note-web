import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createNote, uploadImage } from '../../services/offlineApi';
import { useLabels } from '../../contexts/LabelContext';
import { Plus, ImageIcon, Mic, Edit3, Bell, ChevronLeft, Tag, X as XIcon } from 'lucide-react';
import ChecklistItem from '../../components/ChecklistItem';
import AudioRecorder from '../../components/AudioRecorder';
import DrawingCanvas from '../../components/DrawingCanvas';

const COLORS = [
    { name: 'Default', value: 'default', class: 'bg-white dark:bg-gray-800' },
    { name: 'Red', value: 'red', class: 'bg-red-100 dark:bg-red-900/20' },
    { name: 'Orange', value: 'orange', class: 'bg-orange-100 dark:bg-orange-900/20' },
    { name: 'Yellow', value: 'yellow', class: 'bg-yellow-100 dark:bg-yellow-900/20' },
    { name: 'Green', value: 'green', class: 'bg-green-100 dark:bg-green-900/20' },
    { name: 'Blue', value: 'blue', class: 'bg-blue-100 dark:bg-blue-900/20' },
    { name: 'Purple', value: 'purple', class: 'bg-purple-100 dark:bg-purple-900/20' },
    { name: 'Pink', value: 'pink', class: 'bg-pink-100 dark:bg-pink-900/20' },
];

interface ChecklistItemData {
    id: string;
    content: string;
    is_checked: boolean;
}

export default function CreateNote() {
    const navigate = useNavigate();
    const { labels } = useLabels();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [color, setColor] = useState('default');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Advanced Features State
    const [checklistItems, setChecklistItems] = useState<ChecklistItemData[]>([]);
    const [selectedLabels, setSelectedLabels] = useState<number[]>([]);
    const [reminderDate, setReminderDate] = useState('');
    const [showReminderPicker, setShowReminderPicker] = useState(false);
    const [showLabelPicker, setShowLabelPicker] = useState(false);

    // Media State
    const [audioUri, setAudioUri] = useState<string | null>(null);
    const [drawingUri, setDrawingUri] = useState<string | null>(null);
    const [images, setImages] = useState<{ file: File, preview: string }[]>([]);
    const [showAudioRecorder, setShowAudioRecorder] = useState(false);
    const [showDrawingCanvas, setShowDrawingCanvas] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = async () => {
        if (!title.trim() && !content.trim() && checklistItems.length === 0 && !audioUri && !drawingUri && images.length === 0) {
            setError('Please add some content to your note');
            return;
        }

        try {
            setSaving(true);
            setError('');

            const note = await createNote({
                title: title.trim(),
                content: content.trim(),
                color,
                checklist_items: checklistItems
                    .filter(item => item.content.trim() !== '')
                    .map(item => ({
                        text: item.content.trim(),
                        is_checked: item.is_checked
                    })),
                label_ids: selectedLabels,
                reminder_at: reminderDate || null,
                audio_uri: audioUri,
                drawing_uri: drawingUri,
            });

            // Upload images if any
            if (images.length > 0) {
                for (const img of images) {
                    await uploadImage(note.id, img.file);
                }
            }

            navigate('/');
        } catch (err: any) {
            console.error('Failed to create note:', err);
            setError('Failed to save note. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newImages = Array.from(files).map(file => ({
                file,
                preview: URL.createObjectURL(file)
            }));
            setImages(prev => [...prev, ...newImages]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => {
            const updated = [...prev];
            URL.revokeObjectURL(updated[index].preview);
            updated.splice(index, 1);
            return updated;
        });
    };

    const addChecklistItem = () => {
        setChecklistItems([
            ...checklistItems,
            { id: Date.now().toString(), content: '', is_checked: false }
        ]);
    };

    const toggleChecklistItem = (id: string) => {
        setChecklistItems(checklistItems.map(item =>
            item.id === id ? { ...item, is_checked: !item.is_checked } : item
        ));
    };

    const removeChecklistItem = (id: string) => {
        setChecklistItems(checklistItems.filter(item => item.id !== id));
    };

    const updateChecklistItem = (id: string, newContent: string) => {
        setChecklistItems(checklistItems.map(item =>
            item.id === id ? { ...item, content: newContent } : item
        ));
    };

    const toggleLabel = (labelId: number) => {
        setSelectedLabels(prev =>
            prev.includes(labelId)
                ? prev.filter(id => id !== labelId)
                : [...prev, labelId]
        );
    };

    const selectedColorClass = COLORS.find(c => c.value === color)?.class || COLORS[0].class;

    return (
        <div className="min-h-screen bg-transparent transition-colors duration-200">
            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Note</h1>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium shadow-sm transition-all disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm rounded shadow-sm">
                        {error}
                    </div>
                )}

                {/* Editor Surface */}
                <div
                    className={`${selectedColorClass} rounded-2xl shadow-xl overflow-hidden transition-colors duration-300 border border-gray-200 dark:border-gray-700`}
                >
                    {/* Media Previews */}
                    {images.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-4 bg-black/5 dark:bg-white/5">
                            {images.map((img, idx) => (
                                <div key={idx} className="relative group w-32 h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removeImage(idx)}
                                        className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <XIcon size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {drawingUri && (
                        <div className="relative group p-4 bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/5">
                            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white shadow-inner">
                                <img
                                    src={drawingUri}
                                    alt="Drawing"
                                    className="w-full h-full object-contain transition-opacity duration-300"
                                    onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement!.style.display = 'none';
                                    }}
                                    style={{ opacity: 0 }}
                                />
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setShowDrawingCanvas(true)} className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 shadow-lg backdrop-blur-sm">
                                        <Edit3 size={16} />
                                    </button>
                                    <button onClick={() => setDrawingUri(null)} className="p-2 bg-red-500/80 text-white rounded-lg hover:bg-red-500 shadow-lg backdrop-blur-sm">
                                        <XIcon size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="p-8 space-y-6">
                        <input
                            type="text"
                            placeholder="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-0 text-3xl font-bold text-gray-900 dark:text-white placeholder-gray-400 p-0"
                        />

                        {showAudioRecorder && (
                            <div className="animate-in slide-in-from-top duration-300">
                                <AudioRecorder
                                    onAudioRecorded={setAudioUri}
                                    onAudioDeleted={() => {
                                        setAudioUri(null);
                                        setShowAudioRecorder(false);
                                    }}
                                    existingAudioUri={audioUri || undefined}
                                />
                            </div>
                        )}

                        <textarea
                            placeholder="Take a note..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-0 text-lg text-gray-800 dark:text-gray-200 placeholder-gray-400 p-0 min-h-[150px] resize-none"
                        />

                        {/* Checklist Section */}
                        {checklistItems.length > 0 && (
                            <div className="space-y-1 pt-4 border-t border-black/5 dark:border-white/5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Checklist</h3>
                                {checklistItems.map((item, index) => (
                                    <ChecklistItem
                                        key={item.id}
                                        {...item}
                                        onToggle={toggleChecklistItem}
                                        onRemove={removeChecklistItem}
                                        onChange={updateChecklistItem}
                                        onEnter={addChecklistItem}
                                        autoFocus={index === checklistItems.length - 1}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Selected Labels Display */}
                        {selectedLabels.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-4">
                                {selectedLabels.map(id => {
                                    const label = labels.find(l => l.id === id);
                                    return label ? (
                                        <span key={id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                            <Tag size={12} />
                                            {label.name}
                                            <button onClick={() => toggleLabel(id)} className="hover:text-primary-dark">
                                                <XIcon size={12} />
                                            </button>
                                        </span>
                                    ) : null;
                                })}
                            </div>
                        )}

                        {/* Reminder Display */}
                        {reminderDate && (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                                <Bell size={12} />
                                {new Date(reminderDate).toLocaleString()}
                                <button onClick={() => setReminderDate('')} className="hover:text-orange-900">
                                    <XIcon size={12} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Toolbar */}
                    <div className="bg-gray-100/50 dark:bg-gray-800/50 px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 relative">
                            <button
                                onClick={addChecklistItem}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
                                title="Add checklist"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
                                title="Add image"
                            >
                                <ImageIcon className="w-5 h-5" />
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageSelect} />
                            </button>
                            <button
                                onClick={() => setShowAudioRecorder(!showAudioRecorder)}
                                className={`p-2 rounded-lg transition-colors ${showAudioRecorder ? 'bg-primary/10 text-primary' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                                title="Audio note"
                            >
                                <Mic className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setShowDrawingCanvas(true)}
                                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
                                title="Freehand drawing"
                            >
                                <Edit3 className="w-5 h-5" />
                            </button>

                            {/* Reminder Picker */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowReminderPicker(!showReminderPicker)}
                                    className={`p-2 rounded-lg transition-colors ${showReminderPicker ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                                    title="Set reminder"
                                >
                                    <Bell className="w-5 h-5" />
                                </button>
                                {showReminderPicker && (
                                    <div className="absolute bottom-full left-0 mb-2 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-10 w-64">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Set Reminder</h4>
                                        <input
                                            type="datetime-local"
                                            value={reminderDate}
                                            onChange={(e) => setReminderDate(e.target.value)}
                                            className="w-full p-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/20 mb-3"
                                        />
                                        <button
                                            onClick={() => setShowReminderPicker(false)}
                                            className="w-full py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-dark transition-colors"
                                        >
                                            Set Reminder
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Label Picker */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowLabelPicker(!showLabelPicker)}
                                    className={`p-2 rounded-lg transition-colors ${showLabelPicker ? 'bg-primary/10 text-primary' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                                    title="Labels"
                                >
                                    <Tag className="w-5 h-5" />
                                </button>
                                {showLabelPicker && (
                                    <div className="absolute bottom-full left-0 mb-2 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-10 w-48 max-h-64 overflow-y-auto">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Labels</h4>
                                        <div className="space-y-1">
                                            {labels.length === 0 ? (
                                                <p className="text-xs text-gray-400 italic">No labels</p>
                                            ) : (
                                                labels.map(label => (
                                                    <button
                                                        key={label.id}
                                                        onClick={() => toggleLabel(label.id)}
                                                        className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors flex items-center justify-between ${selectedLabels.includes(label.id)
                                                            ? 'bg-primary/10 text-primary'
                                                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400'
                                                            }`}
                                                    >
                                                        {label.name}
                                                        {selectedLabels.includes(label.id) && <XIcon size={12} />}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Color Picker */}
                        <div className="flex items-center gap-1.5 p-1.5 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl">
                            {COLORS.map((c) => (
                                <button
                                    key={c.value}
                                    onClick={() => setColor(c.value)}
                                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${color === c.value ? 'border-primary' : 'border-transparent'
                                        } ${c.class}`}
                                    title={c.name}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <DrawingCanvas
                isOpen={showDrawingCanvas}
                onClose={() => setShowDrawingCanvas(false)}
                onDrawingSaved={setDrawingUri}
                existingDrawing={drawingUri || undefined}
            />
        </div>
    );
}

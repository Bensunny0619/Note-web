import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Pin,
    Archive,
    Trash2,
    ImageIcon,
    Mic,
    Edit3,
    Bell,
    Check
} from 'lucide-react';

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

interface NoteCardProps {
    note: Note;
    onPin?: (id: string | number) => void;
    onArchive?: (id: string | number) => void;
    onDelete?: (id: string | number) => void;
}

const NOTE_COLORS: Record<string, string> = {
    default: 'bg-white dark:bg-gray-800',
    red: 'bg-red-50 dark:bg-red-900/20',
    orange: 'bg-orange-50 dark:bg-orange-900/20',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20',
    green: 'bg-green-50 dark:bg-green-900/20',
    blue: 'bg-blue-50 dark:bg-blue-900/20',
    purple: 'bg-purple-50 dark:bg-purple-900/20',
    pink: 'bg-pink-50 dark:bg-pink-900/20',
};

export default function NoteCard({ note, onPin, onArchive, onDelete }: NoteCardProps) {
    const navigate = useNavigate();
    const [showActions, setShowActions] = useState(false);

    const handleClick = () => {
        navigate(`/notes/edit/${note.id}`);
    };

    const handlePin = (e: React.MouseEvent) => {
        e.stopPropagation();
        onPin?.(note.id);
    };

    const handleArchive = (e: React.MouseEvent) => {
        e.stopPropagation();
        onArchive?.(note.id);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete?.(note.id);
    };

    const colorClass = NOTE_COLORS[note.color || 'default'] || NOTE_COLORS.default;
    const isOffline = typeof note.id === 'string' && note.id.startsWith('offline_');

    const mainImageUrl = note.images?.[0]?.image_url || note.drawings?.[0]?.image_url;

    return (
        <div
            onClick={handleClick}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            className={`
                ${colorClass} rounded-2xl cursor-pointer transition-all duration-300 
                hover:shadow-xl hover:-translate-y-1 border border-gray-200 dark:border-gray-700/50 
                relative group overflow-hidden flex flex-col h-fit
            `}
        >
            {/* Image Preview */}
            {mainImageUrl && (
                <div className="w-full aspect-video overflow-hidden border-b border-gray-100 dark:border-gray-700/30">
                    <img src={mainImageUrl} alt="" className="w-full h-full object-cover" />
                </div>
            )}

            <div className="p-5 flex flex-col flex-1">
                {/* Header Info */}
                <div className="flex items-start justify-between mb-2">
                    {note.is_pinned && (
                        <Pin className="w-4 h-4 text-primary fill-primary rotate-45" />
                    )}
                    {isOffline && (
                        <div className="ml-auto bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Syncing
                        </div>
                    )}
                </div>

                {/* Title */}
                {note.title && (
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-tight">
                        {note.title}
                    </h3>
                )}

                {/* Content */}
                {note.content && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-4 leading-relaxed">
                        {note.content}
                    </p>
                )}

                {/* Checklist preview */}
                {note.checklist_items && note.checklist_items.length > 0 && (
                    <div className="mb-4 space-y-1.5">
                        {note.checklist_items.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex items-center gap-2 text-xs">
                                <div className={`w-3.5 h-3.5 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center ${item.is_completed ? 'bg-primary border-primary' : 'bg-transparent'}`}>
                                    {item.is_completed && <Check size={10} className="text-white" />}
                                </div>
                                <span className={`line-clamp-1 ${item.is_completed ? 'line-through text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                    {item.text}
                                </span>
                            </div>
                        ))}
                        {note.checklist_items.length > 3 && (
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 pl-5 uppercase tracking-wider">
                                + {note.checklist_items.length - 3} more
                            </p>
                        )}
                    </div>
                )}

                {/* Footer Metadata */}
                <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/5">
                    {/* Labels */}
                    {note.labels && note.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {note.labels.map((label) => (
                                <span
                                    key={label.id}
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-black/5 dark:border-white/5"
                                >
                                    {label.name}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <div className="flex gap-2.5">
                            {note.images && note.images.length > 0 && (
                                <div className="flex items-center text-gray-400" title={`${note.images.length} images`}>
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    <span className="text-[10px] ml-1 font-bold">{note.images.length}</span>
                                </div>
                            )}
                            {note.audio_recordings && note.audio_recordings.length > 0 && (
                                <div className="flex items-center text-gray-400" title="Audio note">
                                    <Mic className="w-3.5 h-3.5" />
                                </div>
                            )}
                            {note.drawings && note.drawings.length > 0 && (
                                <div className="flex items-center text-gray-400" title="Drawing">
                                    <Edit3 className="w-3.5 h-3.5" />
                                </div>
                            )}
                            {note.reminder && (
                                <div className="flex items-center text-orange-500/70" title="Reminder set">
                                    <Bell className="w-3.5 h-3.5" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action buttons (shown on hover) */}
            <div className={`
                absolute bottom-3 right-3 flex gap-1.5 transition-all duration-300
                ${showActions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}
            `}>
                <button
                    onClick={handlePin}
                    className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all text-gray-600 dark:text-gray-300 hover:text-primary"
                    title={note.is_pinned ? 'Unpin' : 'Pin'}
                >
                    <Pin className={`w-4 h-4 ${note.is_pinned ? 'fill-primary text-primary' : ''}`} />
                </button>
                <button
                    onClick={handleArchive}
                    className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all text-gray-600 dark:text-gray-300 hover:text-primary"
                    title="Archive"
                >
                    <Archive className="w-4 h-4" />
                </button>
                <button
                    onClick={handleDelete}
                    className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all text-red-500 hover:bg-red-50"
                    title="Delete"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

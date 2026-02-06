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
import { resolveMediaUrl } from '../utils/media';
import { useAudio } from '../contexts/AudioContext';

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

interface NoteCardProps {
    note: Note;
    onPin?: (id: string | number) => void;
    onArchive?: (id: string | number) => void;
    onDelete?: (id: string | number) => void;
    isSelected?: boolean;
    onSelect?: (id: string | number) => void;
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

export default function NoteCard({ note, onPin, onArchive, onDelete, isSelected, onSelect }: NoteCardProps) {
    const navigate = useNavigate();
    const [showActions, setShowActions] = useState(false);
    const { playAudio, isPlaying, currentUri } = useAudio();

    const handleClick = () => {
        if (onSelect && isSelected !== undefined) {
            // If we are in "some selection" mode, click anywhere to toggle
            // (Optional behavior, let's stick to standard for now or just navigate)
            navigate(`/notes/edit/${note.id}`);
        } else {
            navigate(`/notes/edit/${note.id}`);
        }
    };

    const handleSelectToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect?.(note.id);
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

    const handleAudioClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (noteAudio.length > 0) {
            const audioUrl = resolveMediaUrl(noteAudio[0].audio_url);
            playAudio(audioUrl, {
                noteId: note.id,
                title: note.title || 'Audio Note',
            });
        }
    };

    const colorClass = isSelected
        ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900 bg-primary/5 dark:bg-primary/20'
        : (NOTE_COLORS[note.color || 'default'] || NOTE_COLORS.default);

    const isOffline = typeof note.id === 'string' && note.id.startsWith('offline_');
    const noteImages = note.images || (note as any).images || [];
    const noteDrawings = note.drawings || (note as any).drawings || [];
    const noteChecklist = note.checklist_items || (note as any).checklistItems || [];
    const noteAudio = note.audio_recordings || (note as any).audioRecordings || [];


    return (
        <div
            onClick={handleClick}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            className={`
                ${colorClass} rounded-2xl cursor-pointer transition-all duration-300 
                border border-gray-200 dark:border-gray-700/50 
                relative group overflow-hidden flex flex-col h-fit
                ${isSelected ? 'shadow-lg translate-y-[-2px]' : 'hover:shadow-xl hover:-translate-y-1'}
            `}
        >
            {/* Selection Checkbox */}
            <div
                onClick={handleSelectToggle}
                className={`
                    absolute top-3 left-3 z-20 w-6 h-6 rounded-lg border-2 transition-all duration-200 flex items-center justify-center
                    ${isSelected
                        ? 'bg-primary border-primary text-white scale-110'
                        : `bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-600 ${showActions ? 'opacity-100' : 'opacity-0'}`
                    }
                `}
            >
                {isSelected && <Check size={16} strokeWidth={3} />}
            </div>

            {/* Media Preview (Dual Support) */}
            {(noteImages.length > 0 || noteDrawings.length > 0) && (
                <div className="w-full aspect-video overflow-hidden border-b border-gray-100 dark:border-gray-700/30 bg-gray-50 dark:bg-gray-900/50 flex">
                    {/* Primary Image */}
                    {noteImages.length > 0 && (
                        <div className={`overflow-hidden h-full ${noteDrawings.length > 0 ? 'w-1/2 border-r border-gray-100 dark:border-gray-700/30' : 'w-full'}`}>
                            <img
                                src={resolveMediaUrl(noteImages[0].image_url)}
                                alt=""
                                className="w-full h-full object-cover transition-opacity duration-300"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                                onLoad={(e) => {
                                    (e.target as HTMLImageElement).style.opacity = '1';
                                }}
                                style={{ opacity: 0 }}
                            />
                        </div>
                    )}
                    {/* Drawing Preview */}
                    {noteDrawings.length > 0 && (
                        <div className={`overflow-hidden h-full ${noteImages.length > 0 ? 'w-1/2' : 'w-full'}`}>
                            <img
                                src={resolveMediaUrl(noteDrawings[0].drawing_url)}
                                alt=""
                                className="w-full h-full object-cover transition-opacity duration-300"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                                onLoad={(e) => {
                                    (e.target as HTMLImageElement).style.opacity = '1';
                                }}
                                style={{ opacity: 0 }}
                            />
                        </div>
                    )}
                </div>
            )}

            <div className="p-5 flex flex-col flex-1">
                {/* Header Info */}
                <div className="flex items-start justify-between mb-2">
                    <div className="flex gap-1 items-center">
                        {note.is_pinned && (
                            <Pin className="w-4 h-4 text-primary fill-primary rotate-45" />
                        )}
                    </div>
                    {isOffline && (
                        <div className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Syncing
                        </div>
                    )}
                    {(!note.is_archived && !note.is_deleted && (note.reminder || note.reminder_at)) && (
                        <div className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                            <Bell size={10} strokeWidth={3} />
                            <span>{new Date(note.reminder?.remind_at || note.reminder_at!).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
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
                {noteChecklist.length > 0 && (
                    <div className="mb-4 space-y-1.5">
                        {noteChecklist.slice(0, 3).map((item: any) => (
                            <div key={item.id} className="flex items-center gap-2 text-xs">
                                <div className={`w-3.5 h-3.5 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center ${(item.is_checked || item.is_completed) ? 'bg-primary border-primary' : 'bg-transparent'}`}>
                                    {(item.is_checked || item.is_completed) && <Check size={10} className="text-white" />}
                                </div>
                                <span className={`line-clamp-1 ${(item.is_checked || item.is_completed) ? 'line-through text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                    {item.text || item.content}
                                </span>
                            </div>
                        ))}
                        {noteChecklist.length > 3 && (
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 pl-5 uppercase tracking-wider">
                                + {noteChecklist.length - 3} more
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
                            {noteImages.length > 0 && (
                                <div className="flex items-center text-gray-400" title={`${noteImages.length} images`}>
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    <span className="text-[10px] ml-1 font-bold">{noteImages.length}</span>
                                </div>
                            )}
                            {noteAudio.length > 0 && (
                                <button
                                    onClick={handleAudioClick}
                                    className={`flex items-center transition-all duration-200 ${isPlaying && currentUri === resolveMediaUrl(noteAudio[0].audio_url)
                                            ? 'text-primary scale-110'
                                            : 'text-gray-400 hover:text-primary hover:scale-110'
                                        }`}
                                    title="Play audio note"
                                >
                                    <Mic className={`w-3.5 h-3.5 ${isPlaying && currentUri === resolveMediaUrl(noteAudio[0].audio_url)
                                            ? 'animate-pulse'
                                            : ''
                                        }`} />
                                </button>
                            )}
                            {noteDrawings.length > 0 && (
                                <div className="flex items-center text-gray-400" title="Drawing">
                                    <Edit3 className="w-3.5 h-3.5" />
                                </div>
                            )}
                            {(note.reminder || note.reminder_at) && (
                                <div className="flex items-center text-orange-500/70" title="Reminder set">
                                    <Bell className="w-3.5 h-3.5" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action buttons (shown on hover, hidden when selected) */}
            {!isSelected && (
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
            )}
        </div>
    );
}

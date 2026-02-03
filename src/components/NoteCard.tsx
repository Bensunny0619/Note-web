import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    audio_recordings?: Array<{ id: number; audio_url: string }>;
    drawings?: Array<{ id: number; drawing_url: string }>;
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

    // Truncate content for preview
    const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <div
            onClick={handleClick}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            className={`${colorClass} rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg border border-gray-200 dark:border-gray-700 relative group`}
        >
            {/* Offline indicator */}
            {isOffline && (
                <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                    Offline
                </div>
            )}

            {/* Pin indicator */}
            {note.is_pinned && (
                <div className="absolute top-2 left-2">
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L11 4.323V3a1 1 0 011-1h-2z" />
                    </svg>
                </div>
            )}

            {/* Title */}
            {note.title && (
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 pr-8">
                    {truncateText(note.title, 50)}
                </h3>
            )}

            {/* Content */}
            {note.content && (
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 whitespace-pre-wrap">
                    {truncateText(note.content, 150)}
                </p>
            )}

            {/* Checklist preview */}
            {note.checklist_items && note.checklist_items.length > 0 && (
                <div className="mb-3 space-y-1">
                    {note.checklist_items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center text-sm">
                            <input
                                type="checkbox"
                                checked={item.is_completed}
                                readOnly
                                className="mr-2 rounded"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <span className={`${item.is_completed ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                {truncateText(item.text, 40)}
                            </span>
                        </div>
                    ))}
                    {note.checklist_items.length > 3 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">
                            +{note.checklist_items.length - 3} more items
                        </p>
                    )}
                </div>
            )}

            {/* Attachments preview */}
            <div className="flex gap-2 mb-3">
                {note.images && note.images.length > 0 && (
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {note.images.length}
                    </div>
                )}
                {note.audio_recordings && note.audio_recordings.length > 0 && (
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        {note.audio_recordings.length}
                    </div>
                )}
                {note.drawings && note.drawings.length > 0 && (
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        {note.drawings.length}
                    </div>
                )}
            </div>

            {/* Labels */}
            {note.labels && note.labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {note.labels.map((label) => (
                        <span
                            key={label.id}
                            className="text-xs px-2 py-1 rounded-full"
                            style={{ backgroundColor: label.color + '40', color: label.color }}
                        >
                            {label.name}
                        </span>
                    ))}
                </div>
            )}

            {/* Reminder indicator */}
            {note.reminder && (
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mb-2">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(note.reminder.remind_at).toLocaleDateString()}
                </div>
            )}

            {/* Action buttons (shown on hover) */}
            {showActions && (
                <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={handlePin}
                        className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title={note.is_pinned ? 'Unpin' : 'Pin'}
                    >
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill={note.is_pinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    </button>
                    <button
                        onClick={handleArchive}
                        className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Archive"
                    >
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        title="Delete"
                    >
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}

import React from 'react';
import { Check, X } from 'lucide-react';

interface ChecklistItemProps {
    id: string;
    content: string;
    is_completed: boolean;
    onToggle: (id: string) => void;
    onRemove: (id: string) => void;
    onChange: (id: string, content: string) => void;
    onEnter?: (id: string) => void;
    autoFocus?: boolean;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({
    id,
    content,
    is_completed,
    onToggle,
    onRemove,
    onChange,
    onEnter,
    autoFocus = false
}) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onEnter?.(id);
        }
    };

    return (
        <div className="flex items-center gap-3 group py-1">
            <button
                type="button"
                onClick={() => onToggle(id)}
                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${is_completed
                    ? 'bg-primary border-primary text-white'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary'
                    }`}
            >
                {is_completed && <Check size={14} />}
            </button>

            <input
                type="text"
                value={content}
                onChange={(e) => onChange(id, e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="List item..."
                autoFocus={autoFocus}
                className={`flex-1 bg-transparent border-none focus:ring-0 p-0 text-sm ${is_completed ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'
                    }`}
            />

            <button
                type="button"
                onClick={() => onRemove(id)}
                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default ChecklistItem;

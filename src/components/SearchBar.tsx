import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
    onSearch: (query: string) => void;
    placeholder?: string;
}

export default function SearchBar({ onSearch, placeholder = 'Search in your notes...' }: SearchBarProps) {
    const [query, setQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(query);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, onSearch]);

    return (
        <div className="relative w-full max-w-2xl group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
                <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="
                    block w-full pl-12 pr-12 py-3.5 
                    bg-white dark:bg-gray-800/80 
                    border border-gray-200 dark:border-gray-700/50 
                    rounded-2xl shadow-sm backdrop-blur-sm
                    text-gray-900 dark:text-white placeholder-gray-400
                    transition-all duration-300
                    focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                    group-hover:border-gray-300 dark:group-hover:border-gray-600
                "
                placeholder={placeholder}
            />
            {query && (
                <button
                    onClick={() => setQuery('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>
            )}
        </div>
    );
}

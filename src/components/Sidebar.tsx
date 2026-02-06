import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    StickyNote,
    Bell,
    Tag,
    Archive,
    Trash2,
    Settings,
    Plus,
    LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar: React.FC = () => {
    const { logout, user } = useAuth();

    const navItems = [
        { icon: StickyNote, label: 'Notes', path: '/' },
        { icon: Bell, label: 'Reminders', path: '/reminders' },
        { icon: Archive, label: 'Archive', path: '/archive' },
        { icon: Trash2, label: 'Trash', path: '/trash' },
    ];

    return (
        <aside className="w-64 bg-slate-50/50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen sticky top-0 flex flex-col transition-colors duration-200">
            <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {/* <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-sm rotate-3">
                        <StickyNote size={24} fill="currentColor" fillOpacity={0.2} />
                    </div> */}
                    <span>Homa<span className="text-primary">.</span></span>
                </h1>
            </div>

            <nav className="flex-1 px-3 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                            flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                            ${isActive
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                            }
                        `}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}

                <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="px-4 mb-2 flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <span>Labels</span>
                        <button className="hover:text-primary transition-colors">
                            <Plus size={14} />
                        </button>
                    </div>
                    <NavLink
                        to="/labels"
                        className={({ isActive }) => `
                            flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                            ${isActive
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                            }
                        `}
                    >
                        <Tag size={20} />
                        <span>Edit Labels</span>
                    </NavLink>
                </div>
            </nav>

            <div className="p-3 border-t border-gray-100 dark:border-gray-700 space-y-1">
                <NavLink
                    to="/settings"
                    className={({ isActive }) => `
                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                        ${isActive
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                        }
                    `}
                >
                    <Settings size={20} />
                    <span>Settings</span>
                </NavLink>

                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all duration-200"
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>

                {user && (
                    <div className="mt-4 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl flex items-center gap-3 border border-gray-100 dark:border-gray-700">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                            {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                            <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;

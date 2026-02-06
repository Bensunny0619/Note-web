import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { User, Moon, Sun, Palette, Bell, LogOut, Info, Shield, FileText } from 'lucide-react';

const SettingsPage: React.FC = () => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const [defaultNoteColor, setDefaultNoteColor] = useState('default');

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to logout?')) {
            await logout();
        }
    };

    const noteColors = [
        { value: 'default', label: 'Default', color: 'bg-white dark:bg-gray-800' },
        { value: 'red', label: 'Red', color: 'bg-red-50 dark:bg-red-900/20' },
        { value: 'orange', label: 'Orange', color: 'bg-orange-50 dark:bg-orange-900/20' },
        { value: 'yellow', label: 'Yellow', color: 'bg-yellow-50 dark:bg-yellow-900/20' },
        { value: 'green', label: 'Green', color: 'bg-green-50 dark:bg-green-900/20' },
        { value: 'blue', label: 'Blue', color: 'bg-blue-50 dark:bg-blue-900/20' },
        { value: 'purple', label: 'Purple', color: 'bg-purple-50 dark:bg-purple-900/20' },
        { value: 'pink', label: 'Pink', color: 'bg-pink-50 dark:bg-pink-900/20' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage your account and preferences</p>
                </div>

                {/* Account Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <User className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                            <p className="text-gray-900 dark:text-white font-medium">{user?.name || 'Not available'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                            <p className="text-gray-900 dark:text-white font-medium">{user?.email || 'Not available'}</p>
                        </div>
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="font-medium">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Appearance Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Palette className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Appearance</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {isDarkMode ? (
                                    <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                ) : (
                                    <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                )}
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {isDarkMode ? 'Enabled' : 'Disabled'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${isDarkMode ? 'bg-primary' : 'bg-gray-300'
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${isDarkMode ? 'translate-x-7' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preferences Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Bell className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Preferences</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                Default Note Color
                            </label>
                            <div className="grid grid-cols-4 gap-3">
                                {noteColors.map((color) => (
                                    <button
                                        key={color.value}
                                        onClick={() => setDefaultNoteColor(color.value)}
                                        className={`${color.color} p-4 rounded-lg border-2 transition-all ${defaultNoteColor === color.value
                                                ? 'border-primary ring-2 ring-primary/20'
                                                : 'border-gray-200 dark:border-gray-600 hover:border-primary/50'
                                            }`}
                                    >
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {color.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Auto-save Notes</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Notes are automatically saved as you type
                                </p>
                            </div>
                            <div className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                                Enabled
                            </div>
                        </div>
                    </div>
                </div>

                {/* About Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Info className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">About</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Version</label>
                            <p className="text-gray-900 dark:text-white font-medium">1.0.0</p>
                        </div>
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                            <a
                                href="#"
                                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                            >
                                <Shield className="w-4 h-4" />
                                <span>Privacy Policy</span>
                            </a>
                            <a
                                href="#"
                                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                <span>Terms of Service</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;

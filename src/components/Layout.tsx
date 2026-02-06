import React from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-gray-900 transition-colors duration-200">
            {/* Sidebar - hidden on mobile, need drawer for that later */}
            <div className="hidden md:block">
                <Sidebar />
            </div>

            <main className="flex-1 min-w-0 overflow-y-auto">
                {children}
            </main>
        </div>
    );
};

export default Layout;

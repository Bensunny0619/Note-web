import React from 'react';

const TrashPage: React.FC = () => {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Trash</h1>
            <p className="text-gray-600 dark:text-gray-400">Deleted notes are moved here and automatically removed after 30 days.</p>
        </div>
    );
};

export default TrashPage;

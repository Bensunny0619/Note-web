import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { setGlobalOnlineStatus } from '../services/offlineApi';
import { getSyncQueue } from '../services/storage';

type NetworkContextType = {
    isOnline: boolean;
    pendingCount: number;
    triggerSync: () => void;
    lastSync: Date | null;
};

const NetworkContext = createContext<NetworkContextType>({
    isOnline: true,
    pendingCount: 0,
    triggerSync: () => { },
    lastSync: null,
});

export const NetworkProvider = ({ children }: { children: ReactNode }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(0);
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const [syncTrigger, setSyncTrigger] = useState(0);

    useEffect(() => {
        const handleOnline = () => {
            console.log('🌐 Network: Online');
            setIsOnline(true);
            setGlobalOnlineStatus(true);
            triggerSync();
        };

        const handleOffline = () => {
            console.log('📴 Network: Offline');
            setIsOnline(false);
            setGlobalOnlineStatus(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Set initial status
        setGlobalOnlineStatus(navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        const updatePendingCount = async () => {
            const queue = await getSyncQueue();
            setPendingCount(queue.length);
        };

        updatePendingCount();
        const interval = setInterval(updatePendingCount, 5000);

        return () => clearInterval(interval);
    }, [syncTrigger]);

    const triggerSync = useCallback(() => {
        setSyncTrigger(prev => prev + 1);
        setLastSync(new Date());
    }, []);

    return (
        <NetworkContext.Provider value={{ isOnline, pendingCount, triggerSync, lastSync }}>
            {children}
        </NetworkContext.Provider>
    );
};

export const useNetwork = () => useContext(NetworkContext);

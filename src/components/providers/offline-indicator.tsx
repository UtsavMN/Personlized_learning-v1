'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial check
        setIsOffline(!navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-lg animate-in slide-in-from-bottom">
            <WifiOff className="h-4 w-4" />
            <span>You are offline. AI & Sync paused.</span>
        </div>
    );
}

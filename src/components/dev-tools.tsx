import React from 'react';
import { db } from '@/lib/db';

export function DevTools() {
    const handleReset = async () => {
        if (confirm('Delete all data?')) {
            await db.delete();
            await db.open();
            alert('Database cleared & reset.');
            window.location.reload();
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex gap-2">
            <button onClick={handleReset} className="bg-red-600 text-white p-2 rounded text-xs">Reset DB</button>
        </div>
    );
}

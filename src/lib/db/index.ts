import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import path from 'path';
import fs from 'fs';

// Default to local SQLite file if no DB_URL is provided (for local dev)
const isLocal = !process.env.DB_URL || process.env.DB_URL === 'file:./data/sqlite.db' || !process.env.DB_URL.startsWith('libsql://');

if (isLocal) {
    // Ensure data directory exists for local development
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

// Use DB_URL from environment, fallback to local sqlite file
const client = createClient({
    url: process.env.DB_URL || 'file:./data/sqlite.db',
    authToken: process.env.DB_AUTH_TOKEN, // Only used for Turso
});

export const db = drizzle(client);

// Export type for use in other files
export type DB = typeof db;

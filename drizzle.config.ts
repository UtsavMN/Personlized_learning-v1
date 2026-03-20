import type { Config } from 'drizzle-kit';
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default {
    schema: './src/lib/db/schema.ts',
    out: './drizzle',
    dialect: 'turso',   // Newer Drizzle uses dialect: 'turso' instead of driver: 'turso'
    dbCredentials: {
        url: process.env.DB_URL || 'file:./data/sqlite.db',
        authToken: process.env.DB_AUTH_TOKEN,
    },
} satisfies Config;

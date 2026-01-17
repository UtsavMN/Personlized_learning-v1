import { db } from '../db/index';
import { analytics as analyticsTable } from '../db/schema';
import { desc } from 'drizzle-orm';

/**
 * Logs a user interaction event to the local database.
 * Used for behavioral analysis and future personalization.
 */
export async function trackEvent(
    eventType: string,
    payload: { topicId?: string; documentId?: string; data?: any } = {}
) {
    try {
        await db.insert(analyticsTable).values({
            event: eventType,
            subject: payload.topicId || 'general',
            data: payload.data ? JSON.stringify(payload.data) : null,
            timestamp: new Date()
        });
        console.log(`[Analytics] ${eventType}`, payload);
    } catch (error) {
        console.warn('Failed to log analytics event:', error);
    }
}

/**
 * Analyzing time spent or struggle points (Example utility)
 */
export async function getRecentActivity() {
    const events = await db.select().from(analyticsTable).orderBy(desc(analyticsTable.timestamp)).limit(50);
    return events;
}

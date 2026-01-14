import { db, AnalyticsEvent } from '../db';

/**
 * Logs a user interaction event to the local database.
 * Used for behavioral analysis and future personalization.
 */
export async function trackEvent(
    eventType: AnalyticsEvent['eventType'],
    payload: { topicId?: string; documentId?: string; data?: any } = {}
) {
    try {
        const event: AnalyticsEvent = {
            userId: 'local-user', // Single user mode for now
            eventType,
            timestamp: Date.now(),
            topicId: payload.topicId,
            documentId: payload.documentId,
            data: payload.data
        };

        await db.analytics.add(event);
        console.log(`[Analytics] ${eventType}`, payload);
    } catch (error) {
        console.warn('Failed to log analytics event:', error);
        // Don't crash the app for analytics
    }
}

/**
 * Analyzing time spent or struggle points (Example utility)
 */
export async function getRecentActivity() {
    return await db.analytics.orderBy('timestamp').reverse().limit(50).toArray();
}

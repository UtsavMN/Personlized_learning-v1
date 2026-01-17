'use server';

import { db } from '@/lib/db/index';
import { subjectMastery, analytics } from '@/lib/db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { generateTopicId } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

export async function getStudyData() {
    try {
        const masteryItems = await db.select().from(subjectMastery);

        // Also fetch recent analytics for "inputs" if needed
        // For now, mastery items are the main thing needed for recommendations
        // Detailed stats are handled by getGradePredictorData in another action

        return { success: true, masteryItems };
    } catch (error: any) {
        console.error("Error fetching study data:", error);
        return { success: false, error: error.message };
    }
}

export async function saveSessionToDb(data: {
    subject: string;
    durationSeconds: number;
    scorePercent?: number;
    xpEarned: number;
}) {
    try {
        // 1. Update or Create Mastery
        let mastery = await db.select().from(subjectMastery).where(eq(subjectMastery.subject, data.subject)).get();
        if (!mastery) {
            const topicId = generateTopicId(data.subject);
            await db.insert(subjectMastery).values({
                topicId,
                subject: data.subject,
                masteryScore: 50,
                xp: 0,
            });
            mastery = await db.select().from(subjectMastery).where(eq(subjectMastery.topicId, topicId)).get();
        }

        if (mastery) {
            await db.update(subjectMastery).set({
                xp: (mastery.xp || 0) + data.xpEarned,
                lastAssessmentDate: new Date(),
                masteryScore: data.scorePercent
                    ? Math.round(((mastery.masteryScore || 0) * 0.8) + (data.scorePercent * 0.2))
                    : (mastery.masteryScore || 0)
            }).where(eq(subjectMastery.id, mastery.id));
        }

        // 2. Save Session Analytics
        await db.insert(analytics).values({
            event: 'session_complete',
            subject: data.subject,
            data: JSON.stringify({ xp: data.xpEarned, duration: data.durationSeconds })
        });

        revalidatePath('/dashboard');
        return { success: true, newMasteryScore: mastery?.masteryScore };
    } catch (error: any) {
        console.error("Error saving session:", error);
        return { success: false, error: error.message };
    }
}

// --- Focus Timer Actions ---
import { focusSessions } from '@/lib/db/schema';

export async function addFocusSessionAction(data: {
    subject: string;
    durationMinutes: number;
}) {
    try {
        await db.insert(focusSessions).values({
            subject: data.subject,
            durationMinutes: data.durationMinutes,
            completed: true,
            xpEarned: Math.floor(data.durationMinutes / 5) * 5
        });
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// --- Notes Actions ---
import { notes } from '@/lib/db/schema';

export async function getNotesAction() {
    try {
        const items = await db.select().from(notes).orderBy(desc(notes.updatedAt));
        return { success: true, items };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function addNoteAction(data: {
    title: string;
    content: string;
    subject: string;
    color: string;
}) {
    try {
        await db.insert(notes).values({
            ...data,
            updatedAt: new Date(),
        });
        revalidatePath('/?view=notes');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateNoteAction(id: number, data: any) {
    try {
        await db.update(notes).set({
            ...data,
            updatedAt: new Date(),
        }).where(eq(notes.id, id));
        revalidatePath('/?view=notes');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteNoteAction(id: number) {
    try {
        await db.delete(notes).where(eq(notes.id, id));
        revalidatePath('/?view=notes');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// --- Timetable Actions ---
import { timetable, timetableMeta } from '@/lib/db/schema';

export async function getTimetableAction() {
    try {
        const items = await db.select().from(timetable);
        return { success: true, items };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function addTimetableItemAction(data: any) {
    try {
        await db.insert(timetable).values(data);
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteTimetableItemAction(id: number) {
    try {
        await db.delete(timetable).where(eq(timetable.id, id));
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function clearTimetableAction() {
    try {
        await db.delete(timetable);
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getTimetableMetaAction() {
    try {
        const meta = await db.select().from(timetableMeta).limit(1);
        return { success: true, meta: meta[0] || null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateTimetableMetaAction(data: { imageBase64: string }) {
    try {
        const existing = await db.select().from(timetableMeta).limit(1);
        if (existing.length > 0) {
            await db.update(timetableMeta).set({ ...data, uploadedAt: new Date() }).where(eq(timetableMeta.id, existing[0].id));
        } else {
            await db.insert(timetableMeta).values({ ...data, uploadedAt: new Date() });
        }
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// --- Tracker Actions ---
import { tracker, habits } from '@/lib/db/schema';

export async function getTrackerItemsAction() {
    try {
        const items = await db.select().from(tracker).orderBy(desc(tracker.deadline));
        return { success: true, items };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function addTrackerItemAction(data: any) {
    try {
        await db.insert(tracker).values(data);
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateTrackerItemAction(id: number, data: any) {
    try {
        await db.update(tracker).set(data).where(eq(tracker.id, id));
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteTrackerItemAction(id: number) {
    try {
        await db.delete(tracker).where(eq(tracker.id, id));
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// --- Habit Actions ---

export async function getHabitsAction() {
    try {
        const items = await db.select().from(habits);
        return { success: true, items };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function addHabitAction(data: any) {
    try {
        await db.insert(habits).values(data);
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateHabitAction(id: number, data: any) {
    try {
        await db.update(habits).set(data).where(eq(habits.id, id));
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteHabitAction(id: number) {
    try {
        await db.delete(habits).where(eq(habits.id, id));
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// --- Quiz & Analytics Actions ---
import { quizResults } from '@/lib/db/schema';

export async function trackEventAction(event: string, subject?: string, data?: any) {
    try {
        await db.insert(analytics).values({
            event,
            subject,
            data: JSON.stringify(data || {}),
        });
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function saveQuizResultAction(data: any) {
    try {
        await db.insert(quizResults).values({
            ...data,
            questions: typeof data.questions === 'string' ? data.questions : JSON.stringify(data.questions),
        });
        revalidatePath('/dashboard');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

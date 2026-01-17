'use server';

import { db } from '@/lib/db/index';
import { learnerProfile, subjectMastery } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getProfileAction(userId: string) {
    try {
        let profile = await db.select().from(learnerProfile).where(eq(learnerProfile.userId, userId)).get();
        if (!profile) {
            // Check for any profile (fallback for demo)
            profile = await db.select().from(learnerProfile).limit(1).get() || null;
        }
        return { success: true, profile };
    } catch (error: any) {
        console.error('Get Profile Error:', error);
        return { success: false, error: error.message };
    }
}

export async function updateProfileAction(userId: string, data: any) {
    try {
        const existing = await db.select().from(learnerProfile).where(eq(learnerProfile.userId, userId)).get();
        if (existing) {
            await db.update(learnerProfile).set(data).where(eq(learnerProfile.userId, userId));
        } else {
            await db.insert(learnerProfile).values({ userId, ...data });
        }
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        console.error('Update Profile Error:', error);
        return { success: false, error: error.message };
    }
}

export async function getMasteryAction() {
    try {
        const mastery = await db.select().from(subjectMastery).orderBy(subjectMastery.subject);
        return { success: true, mastery };
    } catch (error: any) {
        console.error('Get Mastery Error:', error);
        return { success: false, error: error.message };
    }
}

export async function updateMasteryAction(subject: string, topicId: string, score: number, xp: number = 10) {
    try {
        const existing = await db.select().from(subjectMastery)
            .where(and(eq(subjectMastery.subject, subject), eq(subjectMastery.topicId, topicId)))
            .get();

        if (existing) {
            await db.update(subjectMastery)
                .set({
                    masteryScore: score,
                    xp: (existing.xp || 0) + xp,
                    lastAssessmentDate: new Date(),
                })
                .where(eq(subjectMastery.id, existing.id));
        } else {
            await db.insert(subjectMastery).values({
                subject,
                topicId,
                masteryScore: score,
                xp,
                lastAssessmentDate: new Date(),
            });
        }
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        console.error('Update Mastery Error:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteMasteryItemAction(id: number) {
    try {
        await db.delete(subjectMastery).where(eq(subjectMastery.id, id));
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// --- Factory Reset ---
import { timetable, tracker, habits, notes, quizzes, questions, flashcardDecks, flashcards } from '@/lib/db/schema';

export async function wipeAllDataAction() {
    try {
        // Clear all tables except documents and chunks
        await db.delete(learnerProfile);
        await db.delete(subjectMastery);
        await db.delete(timetable);
        await db.delete(tracker);
        await db.delete(habits);
        await db.delete(notes);
        await db.delete(quizzes);
        await db.delete(questions);
        await db.delete(flashcardDecks);
        await db.delete(flashcards);

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error('Wipe All Data Error:', error);
        return { success: false, error: error.message };
    }
}

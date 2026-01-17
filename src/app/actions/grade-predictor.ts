'use server';

import { db } from '@/lib/db/index';
import { quizResults, analytics, tracker } from '@/lib/db/schema';
import { eq, and, gt, gte, lt, lte, between, sql } from 'drizzle-orm';

// Shared type for input vector
export type InputVector = [number, number, number, number];

export async function getGradePredictorData() {
    try {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // --- 1. Current Stats ---
        // 1.1 Avg Quiz Score (All Time)
        const quizzes = await db.select().from(quizResults);
        const avgQuizScore = quizzes.length > 0
            ? quizzes.reduce((acc, q) => acc + q.score, 0) / quizzes.length
            : 0;

        // 1.2 Study Hours (Last 7 Days)
        const studySessions = await db.select().from(analytics)
            .where(and(
                eq(analytics.event, 'session_complete'),
                gte(analytics.timestamp, oneWeekAgo)
            ));

        const totalSeconds = studySessions.reduce((acc, s) => {
            const data = s.data ? JSON.parse(s.data) : {};
            return acc + (data.duration || 0);
        }, 0);
        const studyHours = totalSeconds / 3600;

        // 1.3 Completed Tasks (Last 7 Days)
        // Note: Tracker table doesn't have completion date, so we count all completed tasks for now
        const completedTasksItems = await db.select().from(tracker)
            .where(eq(tracker.status, 'Completed'));
        const completedTasks = completedTasksItems.length;

        const difficulty = 0.5;

        const currentInputs: InputVector = [
            Math.min(avgQuizScore / 100, 1),
            Math.min(studyHours / 20, 1),
            Math.min(completedTasks / 20, 1),
            difficulty
        ];

        // --- 2. Training Data ---
        const trainingInputs: InputVector[] = [];
        const trainingLabels: number[] = [];

        const sortedQuizzes = await db.select().from(quizResults).orderBy(quizResults.completedAt);

        // If not enough real data, provide dummy data based on the original logic
        if (sortedQuizzes.length < 3) {
            const dummyInputs: InputVector[] = [
                [0.9, 0.5, 1.0, 0.8],
                [0.4, 0.05, 0.1, 0.3],
                [0.6, 0.25, 0.5, 0.5],
                [0.8, 0.4, 0.75, 0.7],
                [0.2, 0, 0, 0.2]
            ];
            const dummyLabels = [0.95, 0.40, 0.65, 0.85, 0.20];

            trainingInputs.push(...dummyInputs);
            trainingLabels.push(...dummyLabels);
        } else {
            // Reconstruct historical data
            for (const quiz of sortedQuizzes) {
                const quizDate = quiz.completedAt || new Date();
                const oneWeekBefore = new Date(quizDate.getTime() - 7 * 24 * 60 * 60 * 1000);

                const pastSessions = await db.select().from(analytics)
                    .where(and(
                        eq(analytics.event, 'session_complete'),
                        gte(analytics.timestamp, oneWeekBefore),
                        lte(analytics.timestamp, quizDate)
                    ));

                const durationSec = pastSessions.reduce((acc, s) => {
                    const data = s.data ? JSON.parse(s.data) : {};
                    return acc + (data.duration || 0);
                }, 0);
                const hours = durationSec / 3600;

                // For historical tasks, we can't filter by date effectively without a completedAt column
                // So we'll use a simplified metric or just current completed tasks (less accurate but working)
                const pastTasks = (await db.select().from(tracker)
                    .where(eq(tracker.status, 'Completed'))).length;

                const priorQuizzes = sortedQuizzes.filter(q => (q.completedAt || new Date()) < quizDate);
                const priorAvg = priorQuizzes.length > 0
                    ? priorQuizzes.reduce((acc, q) => acc + q.score, 0) / priorQuizzes.length
                    : 50;

                trainingInputs.push([
                    Math.min(priorAvg / 100, 1),
                    Math.min(hours / 20, 1),
                    Math.min(pastTasks / 20, 1),
                    0.5
                ]);

                trainingLabels.push(quiz.score / 100);
            }
        }

        return {
            success: true,
            currentStats: {
                inputs: currentInputs,
                raw: { avgQuizScore, studyHours, completedTasks, difficulty }
            },
            trainingData: {
                inputs: trainingInputs,
                labels: trainingLabels
            }
        };

    } catch (error: any) {
        console.error("Error fetching grade predictor data:", error);
        return { success: false, error: error.message };
    }
}

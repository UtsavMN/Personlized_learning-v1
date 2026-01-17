import { db } from '../db/index';
import { subjectMastery } from '../db/schema';
import { eq } from 'drizzle-orm';

export const DIFFICULTY_LEVELS = {
    1: 'Novice',
    2: 'Beginner',
    3: 'Intermediate',
    4: 'Advanced',
    5: 'Expert'
};

const PROMOTION_THRESHOLD = 80; // % Score to Level Up
const DEMOTION_THRESHOLD = 40;  // % Score to Level Down

/**
 * Updates the mastery record for a topic based on quiz performance.
 */
export async function updateTopicMastery(topicId: string, scorePercentage: number, questionsCount: number) {
    const existing = await db.select().from(subjectMastery).where(eq(subjectMastery.topicId, topicId)).get();

    let currentScore = existing?.masteryScore || 0;
    const oldLevel = getLevelFromScore(currentScore);

    if (scorePercentage >= PROMOTION_THRESHOLD) {
        const boost = 15;
        currentScore = Math.min(100, currentScore + boost);
    } else if (scorePercentage <= DEMOTION_THRESHOLD) {
        const penalty = 10;
        currentScore = Math.max(0, currentScore - penalty);
    } else {
        currentScore = Math.min(100, currentScore + 2);
    }

    const newLevel = getLevelFromScore(currentScore);
    const levelChange = newLevel - oldLevel;

    if (existing) {
        await db.update(subjectMastery).set({
            masteryScore: currentScore,
            lastAssessmentDate: new Date()
        }).where(eq(subjectMastery.id, existing.id));
    } else {
        await db.insert(subjectMastery).values({
            topicId,
            subject: 'General',
            masteryScore: currentScore,
            lastAssessmentDate: new Date()
        });
    }

    return {
        newLevel,
        levelChange,
        xpGained: scorePercentage,
        message: getLevelChangeMessage(levelChange, newLevel)
    };
}

function getLevelFromScore(score: number): number {
    if (score >= 90) return 5;
    if (score >= 70) return 4;
    if (score >= 50) return 3;
    if (score >= 30) return 2;
    return 1;
}

function getLevelChangeMessage(change: number, newLevel: number): string {
    const levelName = DIFFICULTY_LEVELS[newLevel as keyof typeof DIFFICULTY_LEVELS] || 'Learner';
    if (change > 0) return `Level Up! You are now a ${levelName}.`;
    if (change < 0) return `Dropping to ${levelName} to reinforce basics.`;
    return `Keep practicing to reach the next level!`;
}

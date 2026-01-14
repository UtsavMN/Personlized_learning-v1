import { db } from '../db';

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
 * Implements deterministic progression logic using the 'subjectMastery' table.
 */
export async function updateTopicMastery(topicId: string, scorePercentage: number, questionsCount: number) {
    // Query using the correct table 'subjectMastery'
    const existing = await db.subjectMastery.where('topicId').equals(topicId).first();

    let currentScore = existing?.masteryScore || 0;
    const oldLevel = getLevelFromScore(currentScore);

    // Rule-Based Logic: Update Score based on Performance
    if (scorePercentage >= PROMOTION_THRESHOLD) {
        // Increase score (capped at 100)
        const boost = 15;
        currentScore = Math.min(100, currentScore + boost);
    } else if (scorePercentage <= DEMOTION_THRESHOLD) {
        // Decrease score (floor at 0)
        const penalty = 10;
        currentScore = Math.max(0, currentScore - penalty);
    } else {
        // Small boost for consistent practice
        currentScore = Math.min(100, currentScore + 2);
    }

    const newLevel = getLevelFromScore(currentScore);
    const levelChange = newLevel - oldLevel;

    // Save to DB
    if (existing) {
        await db.subjectMastery.update(existing.id!, {
            masteryScore: currentScore,
            lastRevised: new Date()
        });
    } else {
        await db.subjectMastery.add({
            topicId,
            subject: 'General', // Default if unknown
            masteryScore: currentScore,
            confidenceScore: 50,
            lastRevised: new Date(),
            nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
        } as any);
    }

    return {
        newLevel,
        levelChange,
        xpGained: scorePercentage, // Simple XP
        message: getLevelChangeMessage(levelChange, newLevel)
    };
}

function getLevelFromScore(score: number): number {
    if (score >= 90) return 5; // Expert
    if (score >= 70) return 4; // Advanced
    if (score >= 50) return 3; // Intermediate
    if (score >= 30) return 2; // Beginner
    return 1; // Novice
}

function getLevelChangeMessage(change: number, newLevel: number): string {
    // Safe access to level name
    const levelName = DIFFICULTY_LEVELS[newLevel as keyof typeof DIFFICULTY_LEVELS] || 'Learner';

    if (change > 0) return `Level Up! You are now a ${levelName}.`;
    if (change < 0) return `Dropping to ${levelName} to reinforce basics.`;
    return `Keep practicing to reach the next level!`;
}

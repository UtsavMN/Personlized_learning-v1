
import { db, SubjectMastery } from '@/lib/db';
import { generateTopicId } from '@/lib/utils';
import { gradePredictor } from './grade-predictor';
import { rlScheduler, SchedulerState } from './rl-scheduler';

export type ActivityType = 'flashcards' | 'quiz' | 'reading';

interface Recommendation {
    id: string;
    title: string;
    description: string;
    subject: string;
    type: ActivityType;
    priority: 'high' | 'medium' | 'low';
    reason: string;
    actionLabel: string;
    route: string;
}

export class StudyManager {
    private static instance: StudyManager;

    private constructor() { }

    public static getInstance(): StudyManager {
        if (!StudyManager.instance) {
            StudyManager.instance = new StudyManager();
        }
        return StudyManager.instance;
    }

    /**
     * The Core "Brain" Function
     * Aggregates insights from GradePredictor and RLScheduler to suggest the next best action.
     */
    public async getRecommendations(): Promise<Recommendation[]> {
        const recommendations: Recommendation[] = [];
        const masteryItems = await db.subjectMastery.toArray();
        const now = new Date();
        const dayOfWeek = now.getDay();

        // 1. Check for Critical Gaps (Grade Predictor Logic)
        // In a real app, we'd feed real user habits here. For now, we simulate.
        for (const item of masteryItems) {
            // Predict grade based on Real User Habits
            // We fetch global stats (study hours, tasks) and mix in the Subject's specific Mastery Score
            const globalStats = await gradePredictor.getCurrentStats();

            const input: [number, number, number, number] = [
                item.masteryScore / 100,      // Subject Specific Mastery
                globalStats.inputs[1],        // Global Study Hours
                globalStats.inputs[2],        // Global Task Comepletion
                globalStats.inputs[3]         // Difficulty/Base
            ];

            const predictedGrade = gradePredictor.predict(input);
            console.log(`[StudyManager] Predicted Grade for ${item.subject}: ${predictedGrade.toFixed(2)}%`);

            // If prediction is dangerously low, flag it
            if (predictedGrade < 60) {
                recommendations.push({
                    id: `urgent-${item.id}`,
                    title: `Rescue ${item.subject}`,
                    description: `Predicted grade is only ${predictedGrade.toFixed(0)}%. Immediate intervention needed.`,
                    subject: item.subject,
                    type: 'quiz',
                    priority: 'high',
                    reason: 'Low Predicted Grade',
                    actionLabel: 'Take Emergency Quiz',
                    route: '/?view=flashcards'
                });
            }
        }

        // 2. Ask the RL Agent for a Strategy
        // We construct the current state
        const currentState: SchedulerState = {
            dayOfWeek,
            energyLevel: 2, // Default to Medium, could ask user
            previousSubject: 'None' // simplified
        };

        const availableSubjects = masteryItems.map(m => m.subject);
        const suggestedAction = await rlScheduler.suggestAction(currentState, availableSubjects);

        if (suggestedAction !== 'Break') {
            recommendations.push({
                id: 'rl-suggestion',
                title: `${suggestedAction} Focus`,
                description: `Your smart agent suggests focusing on ${suggestedAction} right now based on your energy patterns.`,
                subject: suggestedAction,
                type: 'flashcards', // Defaulting to flashcards for the agent
                priority: 'medium',
                reason: 'Optimal Time Block (RL)',
                actionLabel: 'Start Flashcards',
                route: '/?view=flashcards'
            });
        } else {
            recommendations.push({
                id: 'rl-break',
                title: 'Brain Break',
                description: 'The agent suggests taking a short break to restore focus.',
                subject: 'Rest',
                type: 'reading',
                priority: 'low',
                reason: 'Energy Management',
                actionLabel: 'Relax',
                route: '/'
            });
        }

        // 3. Fallback / Maintenance
        if (recommendations.length === 0) {
            const worstSubject = masteryItems.sort((a, b) => a.masteryScore - b.masteryScore)[0];
            if (worstSubject) {
                recommendations.push({
                    id: 'maint-1',
                    title: `Review ${worstSubject.subject}`,
                    description: 'Improve your weakest subject to balance your profile.',
                    subject: worstSubject.subject,
                    type: 'flashcards',
                    priority: 'medium',
                    reason: 'Lowest Mastery Score',
                    actionLabel: 'Practice',
                    route: '/?view=flashcards'
                });
            }
        }

        return recommendations;
    }

    /**
     * Called when a user completes a learning activity.
     * Closing the loop: Updates Mastery -> Trains RL Agent -> Saves Data.
     */
    public async completeSession(data: {
        subject: string;
        activityType: ActivityType;
        durationSeconds: number;
        scorePercent?: number; // 0-100
        itemsReviewed?: number;
    }) {
        console.log("[StudyManager] Completing Session:", data);

        // 1. Update Subject Mastery
        let mastery = await db.subjectMastery.where('subject').equals(data.subject).first();
        if (!mastery) {
            // Create if new
            mastery = {
                topicId: generateTopicId(data.subject),
                subject: data.subject,
                masteryScore: 50,
                confidenceScore: 50,
                level: 1,
                xp: 0,
                lastRevised: new Date(),
                nextReviewDate: new Date()
            } as SubjectMastery;
            const id = await db.subjectMastery.add(mastery);
            mastery.id = id as number;
        }

        // Simple XP Formula
        const xpEarned = Math.floor((data.durationSeconds / 60) * 10) + (data.scorePercent ? Math.floor(data.scorePercent / 10) : 0);

        await db.subjectMastery.update(mastery.id!, {
            xp: (mastery.xp || 0) + xpEarned,
            lastRevised: new Date(),
            // Simple moving average for score
            masteryScore: data.scorePercent
                ? Math.round((mastery.masteryScore * 0.8) + (data.scorePercent * 0.2))
                : mastery.masteryScore
        });

        // 2. Train RL Agent
        // Calculate Reward
        // +10 for High Score (>80), +5 for Completion, -5 for fail
        let reward = 5;
        if (data.scorePercent && data.scorePercent >= 80) reward += 10;
        if (data.scorePercent && data.scorePercent < 40) reward -= 5;

        const state: SchedulerState = {
            dayOfWeek: new Date().getDay(),
            energyLevel: 2, // simplify
            previousSubject: data.subject
        };

        // We assume the action taken was studying this subject
        // For strict Q-Learning we need the PREVIOUS state, but for this simplified app
        // we'll update based on the just-completed action.
        rlScheduler.learn(state, data.subject as any, reward, state); // naive update

        // 3. Log Analytics
        await db.analytics.add({
            eventType: 'session_complete',
            timestamp: Date.now(),
            topicId: data.subject,
            data: { xp: xpEarned, duration: data.durationSeconds }
        });

        return { xpEarned, newMastery: mastery.masteryScore };
    }
}

export const studyManager = StudyManager.getInstance();

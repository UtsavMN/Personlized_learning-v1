import { generateTopicId } from '@/lib/utils';
import { gradePredictor } from './grade-predictor';
import { rlScheduler, SchedulerState } from './rl-scheduler';
import { getGradePredictorData } from '@/app/actions/grade-predictor';
import { getStudyData, saveSessionToDb } from '@/app/actions/study';

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
     */
    public async getRecommendations(): Promise<Recommendation[]> {
        const recommendations: Recommendation[] = [];

        // Fetch Data from Server
        const [studyDataRes, gpDataRes] = await Promise.all([
            getStudyData(),
            getGradePredictorData()
        ]);

        if (!studyDataRes.success || !studyDataRes.masteryItems || !gpDataRes.success || !gpDataRes.currentStats) {
            console.error("Failed to load study data for recommendations");
            return [];
        }

        const masteryItems = studyDataRes.masteryItems;
        const globalStats = gpDataRes.currentStats;
        const now = new Date();
        const dayOfWeek = now.getDay();

        for (const item of masteryItems) {
            const input: [number, number, number, number] = [
                (item.masteryScore || 0) / 100,
                globalStats.inputs[1],
                globalStats.inputs[2],
                globalStats.inputs[3]
            ];

            const predictedGrade = gradePredictor.predict(input);
            console.log(`[StudyManager] Predicted Grade for ${item.subject}: ${predictedGrade.toFixed(2)}%`);

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
                    route: '/?view=quiz'
                });
            }
        }

        const currentState: SchedulerState = {
            dayOfWeek,
            energyLevel: 2,
            previousSubject: 'None'
        };

        const availableSubjects = masteryItems.map(m => m.subject);
        const suggestedAction = await rlScheduler.suggestAction(currentState, availableSubjects);

        if (suggestedAction !== 'Break') {
            recommendations.push({
                id: 'rl-suggestion',
                title: `${suggestedAction} Focus`,
                description: `Your smart agent suggests focusing on ${suggestedAction} right now based on your energy patterns.`,
                subject: suggestedAction,
                type: 'flashcards',
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

        if (recommendations.length === 0) {
            const worstSubject = masteryItems.sort((a, b) => (a.masteryScore ?? 0) - (b.masteryScore ?? 0))[0];
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
     */
    public async completeSession(data: {
        subject: string;
        activityType: ActivityType;
        durationSeconds: number;
        scorePercent?: number;
        itemsReviewed?: number;
    }) {
        console.log("[StudyManager] Completing Session:", data);

        const xpEarned = Math.floor((data.durationSeconds / 60) * 10) + (data.scorePercent ? Math.floor(data.scorePercent / 10) : 0);

        // 1. Save to DB via Server Action
        const result = await saveSessionToDb({
            subject: data.subject,
            durationSeconds: data.durationSeconds,
            scorePercent: data.scorePercent,
            xpEarned
        });

        // 2. Calculate Reward for RL (Client-side)
        let reward = 5;
        if (data.scorePercent && data.scorePercent >= 80) reward += 10;
        if (data.scorePercent && data.scorePercent < 40) reward -= 5;

        const state: SchedulerState = {
            dayOfWeek: new Date().getDay(),
            energyLevel: 2,
            previousSubject: data.subject
        };

        // 3. Update RL Agent
        rlScheduler.learn(state, data.subject as any, reward, state);

        return { xpEarned, newMastery: result.newMasteryScore };
    }
}

export const studyManager = StudyManager.getInstance();

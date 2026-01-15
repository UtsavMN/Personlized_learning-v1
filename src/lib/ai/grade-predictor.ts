import * as tf from '@tensorflow/tfjs';
import { db } from '@/lib/db';

// Input Feature Vector (Normalized 0-1)
// [AVG_QUIZ_SCORE, STUDY_HOURS_THIS_WEEK, COMPLETED_TASKS_COUNT, SUBJECT_DIFFICULTY]
export type InputVector = [number, number, number, number];

export class GradePredictor {
    private model: tf.Sequential;

    constructor() {
        this.model = tf.sequential();

        // Input Layer: 4 features
        this.model.add(tf.layers.dense({
            units: 8,
            activation: 'relu',
            inputShape: [4]
        }));

        // Hidden Layer
        this.model.add(tf.layers.dense({
            units: 4,
            activation: 'relu'
        }));

        // Output Layer: 1 value (Predicted Percentage 0-100)
        this.model.add(tf.layers.dense({
            units: 1,
            activation: 'linear' // or 'sigmoid' if we normalize output to 0-1
        }));

        this.model.compile({
            optimizer: tf.train.adam(0.01),
            loss: 'meanSquaredError'
        });
    }

    /**
     * Aggregates the User's current stats from the local DB.
     * Returns a normalized vector suitable for prediction.
     */
    async getCurrentStats(): Promise<{ inputs: InputVector, raw: any }> {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // 1. Avg Quiz Score (All Time)
        const quizzes = await db.quizResults.toArray();
        const avgQuizScore = quizzes.length > 0
            ? quizzes.reduce((acc, q) => acc + q.score, 0) / quizzes.length
            : 0; // Default 0

        // 2. Study Hours (Last 7 Days)
        // We look for 'session_complete' events in analytics
        const studySessions = await db.analytics
            .where('timestamp')
            .above(oneWeekAgo.getTime())
            .filter(e => e.eventType === 'session_complete')
            .toArray();

        // Sum duration (seconds) -> hours
        const totalSeconds = studySessions.reduce((acc, s) => acc + (s.data?.duration || 0), 0);
        const studyHours = totalSeconds / 3600;

        // 3. Completed Tasks (Last 7 Days)
        // We assume tasks have a 'date' field or we check all completed?
        // Let's filter by completion and date range if possible, or just all completed for MVP.
        // The DB schema for tasks is 'date, completed'.
        const completedTasks = await db.tasks
            .filter(t => t.completed && t.date >= oneWeekAgo)
            .count();

        // 4. Difficulty (Average Subject Mastery Flipped?)
        // Let's use 1 - (avg_outcome / 100) or similar.
        // Actually, let's keep it simple: 0.5 (Medium) unless we track specific problem difficulty.
        const difficulty = 0.5;

        // Normalize
        // Score: 0-100 -> 0-1
        // Hours: 0-20 -> 0-1 (Cap at 20h/week for scaling)
        // Tasks: 0-20 -> 0-1 (Cap at 20)
        const inputs: InputVector = [
            Math.min(avgQuizScore / 100, 1),
            Math.min(studyHours / 20, 1),
            Math.min(completedTasks / 20, 1),
            difficulty
        ];

        return {
            inputs,
            raw: { avgQuizScore, studyHours, completedTasks, difficulty }
        };
    }

    /**
     * Reconstructs historical training examples from the DB.
     * Strategy: Each Quiz Result acts as a "Label".
     * Valid Samples = (Activity_Before_Quiz) -> Quiz_Score
     */
    async gatherTrainingData() {
        const quizzes = await db.quizResults.orderBy('date').toArray();

        // If scant data, return seed data to prevent crash
        if (quizzes.length < 3) {
            return {
                inputs: [
                    [0.9, 0.5, 1.0, 0.8], // Good student -> 95%
                    [0.4, 0.05, 0.1, 0.3],   // Low effort -> 40%
                    [0.6, 0.25, 0.5, 0.5],  // Average -> 65%
                    [0.8, 0.4, 0.75, 0.7],  // Good -> 85%
                    [0.2, 0, 0, 0.2]    // No effort -> 20%
                ] as InputVector[],
                labels: [0.95, 0.40, 0.65, 0.85, 0.20]
            };
        }

        const inputs: InputVector[] = [];
        const labels: number[] = [];

        for (const quiz of quizzes) {
            const quizDate = new Date(quiz.date);
            const oneWeekBefore = new Date(quizDate.getTime() - 7 * 24 * 60 * 60 * 1000);

            // Calculate stats for the week leading up to this quiz
            const studySessions = await db.analytics
                .where('timestamp')
                .between(oneWeekBefore.getTime(), quizDate.getTime())
                .filter(e => e.eventType === 'session_complete')
                .toArray();

            const durationSec = studySessions.reduce((acc, s) => acc + (s.data?.duration || 0), 0);
            const hours = durationSec / 3600;

            const completedTasks = await db.tasks
                .filter(t => t.completed && t.date >= oneWeekBefore && t.date <= quizDate)
                .count();

            // Avg score of quizzes BEFORE this one (to get historical baseline)
            const priorQuizzes = quizzes.filter(q => q.date < quiz.date);
            const priorAvg = priorQuizzes.length > 0
                ? priorQuizzes.reduce((acc, q) => acc + q.score, 0) / priorQuizzes.length
                : 50; // default average

            // Normalize
            inputs.push([
                Math.min(priorAvg / 100, 1),
                Math.min(hours / 20, 1),
                Math.min(completedTasks / 20, 1),
                0.5 // difficulty constant
            ]);

            labels.push(quiz.score / 100);
        }

        return { inputs, labels };
    }

    async train(data: { inputs: InputVector[], labels: number[] }) {
        const xs = tf.tensor2d(data.inputs);
        const ys = tf.tensor2d(data.labels, [data.labels.length, 1]);

        console.log("Training Grade Predictor...");
        await this.model.fit(xs, ys, {
            epochs: 50,
            callbacks: {
                onEpochEnd: (epoch, logs) => console.log(`Epoch ${epoch}: loss = ${logs?.loss}`)
            }
        });

        xs.dispose();
        ys.dispose();
        console.log("Training Complete");
    }

    predict(input: InputVector): number {
        const xs = tf.tensor2d([input]);
        const output = this.model.predict(xs) as tf.Tensor;
        const result = output.dataSync()[0];

        xs.dispose();
        output.dispose();

        return result;
    }

    async save() {
        if (typeof window === 'undefined') return;
        await this.model.save('localstorage://grade-predictor-model');
    }

    async load() {
        if (typeof window === 'undefined') return;
        try {
            this.model = await tf.loadLayersModel('localstorage://grade-predictor-model') as tf.Sequential;
            this.model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
        } catch (e) {
            console.log("No saved model found, using fresh instance.");
        }
    }
}

// Singleton Pattern for HMR support
const globalForGradePredictor = globalThis as unknown as { gradePredictor: GradePredictor | undefined };

export const gradePredictor = globalForGradePredictor.gradePredictor ?? new GradePredictor();

if (process.env.NODE_ENV !== 'production') globalForGradePredictor.gradePredictor = gradePredictor;

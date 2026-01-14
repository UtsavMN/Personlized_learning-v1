'use server';

import { runWithRetry } from '@/ai/retry';
import { generateQuizFlow } from '@/ai/flows/generate-quiz';

export async function generateQuizAction(
    topic: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    count: number = 5,
    contextDocuments?: string[]
) {
    try {
        const result = await runWithRetry(
            () => generateQuizFlow({ topic, difficulty, count, contextDocuments })
        );
        return result;
    } catch (error: any) {
        console.error('Quiz Gen Error:', error);
        // Return fallback or error structure. Since flow returns {questions}, we should return that or null?
        // The flow has a try/catch internal fallback but verify.
        // The flow returns { questions: ... }.
        // If error here, rethrow or return empty?
        throw error;
    }
}

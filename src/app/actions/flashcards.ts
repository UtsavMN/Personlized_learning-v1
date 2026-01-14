'use server';

import { generateFlashcardsFlow } from '@/ai/flows/generate-flashcards';

export async function generateFlashcardsAction(documentContent: string, count: number = 5) {
    try {
        // Truncate content to avoid token limits (simulated for now, 10k chars check)
        const truncatedContext = documentContent.slice(0, 15000);

        const result = await generateFlashcardsFlow({
            context: truncatedContext,
            numCards: count
        });

        return result;
    } catch (error) {
        console.error('Flashcard Action Error:', error);
        return { flashcards: [] };
    }
}

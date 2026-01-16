'use server';

import { generateFlashcardsFlow } from '@/ai/flows/generate-flashcards';

export async function generateFlashcardsAction(documentContent: string | string[], count: number = 5) {
    try {
        // If array (chunks), join them. If string, use as is.
        let fullContext = '';
        if (Array.isArray(documentContent)) {
            fullContext = documentContent.join('\n\n');
        } else {
            fullContext = documentContent;
        }

        // Truncate content to avoid token limits (simulated for now, 15k chars check)
        const truncatedContext = fullContext.slice(0, 15000);

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

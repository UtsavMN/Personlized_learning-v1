'use server';

import { db } from '@/lib/db/index';
import { documents, flashcardDecks, flashcards } from '@/lib/db/schema';
import { getAIProvider } from '@/lib/ai/provider-factory';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function generateFlashcardsAction(documentId: number) {
    try {
        // 1. Fetch
        const docRes = await db.select().from(documents).where(eq(documents.id, documentId)).get();
        if (!docRes) throw new Error('Document not found');

        // 2. Search for relevant chunks
        const { searchSimilarChunksAction } = await import('./rag');
        const ragRes = await searchSimilarChunksAction("Key concepts, definitions, and main ideas", documentId, 15);

        let context = "";
        if (ragRes.success && ragRes.chunks && ragRes.chunks.length > 0) {
            context = ragRes.chunks.map(c => c.content).join("\n\n");
        } else {
            context = docRes.content || docRes.summary || docRes.title;
        }

        // 3. Prompt
        const prompt = `
        Create 10 flashcards (Front/Back) based on the following text.
        Focus on key definitions, formulas, and important concepts.
        
        Output format: JSON Array of objects with keys:
        - front (string)
        - back (string)

        Text:
        ${context.substring(0, 15000)}
        `;
        const cardsData = await getAIProvider().generateJSON(prompt);

        if (!Array.isArray(cardsData)) throw new Error('Invalid AI response format');

        // 3. Save Deck
        const deckResult = await db.insert(flashcardDecks).values({
            title: `${docRes.title} - Flashcards`,
            subject: docRes.subject,
            documentId: docRes.id,
        }).returning();

        const deckId = deckResult[0].id;

        // 4. Save Cards
        for (const c of cardsData) {
            await db.insert(flashcards).values({
                deckId,
                front: c.front,
                back: c.back,
            });
        }

        revalidatePath('/dashboard');
        return { success: true, deckId };

    } catch (error: any) {
        console.error('Generate Flashcards Error:', error);
        return { success: false, error: error.message };
    }
}

export async function getFlashcardDecksAction() {
    try {
        const decks = await db.select().from(flashcardDecks).orderBy(flashcardDecks.createdAt);
        return { success: true, decks };
    } catch (error: any) {
        console.error('Get Decks Error:', error);
        return { success: false, error: error.message };
    }
}

export async function getFlashcardsAction(deckId: number) {
    try {
        const cards = await db.select().from(flashcards).where(eq(flashcards.deckId, deckId));
        return { success: true, cards };
    } catch (error: any) {
        console.error('Get Cards Error:', error);
        return { success: false, error: error.message };
    }
}

export async function updateFlashcardAction(id: number, data: any) {
    try {
        await db.update(flashcards).set(data).where(eq(flashcards.id, id));
        return { success: true };
    } catch (error: any) {
        console.error('Update Card Error:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteFlashcardDeckAction(id: number) {
    try {
        await db.delete(flashcardDecks).where(eq(flashcardDecks.id, id));
        // Cascade delete should be handled by SQLite if configured, but Drizzle might need help
        await db.delete(flashcards).where(eq(flashcards.deckId, id));
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        console.error('Delete Deck Error:', error);
        return { success: false, error: error.message };
    }
}

export async function createFlashcardDeckAction(data: { title: string, subject: string, documentId?: number | null }) {
    try {
        const result = await db.insert(flashcardDecks).values({
            title: data.title,
            subject: data.subject,
            documentId: data.documentId || null,
        }).returning();
        return { success: true, deck: result[0] };
    } catch (error: any) {
        console.error('Create Deck Error:', error);
        return { success: false, error: error.message };
    }
}

export async function addFlashcardAction(data: { deckId: number, front: string, back: string }) {
    try {
        const result = await db.insert(flashcards).values(data).returning();
        return { success: true, card: result[0] };
    } catch (error: any) {
        console.error('Add Card Error:', error);
        return { success: false, error: error.message };
    }
}



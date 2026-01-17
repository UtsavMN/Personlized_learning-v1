'use server';

import { db } from '@/lib/db/index';
import { documents, quizzes, questions } from '@/lib/db/schema';
import { getAIProvider } from '@/lib/ai/provider-factory';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function generateQuizAction(documentId: number) {
    try {
        // 1. Fetch Document Content
        const docRes = await db.select().from(documents).where(eq(documents.id, documentId)).get();
        if (!docRes) throw new Error('Document not found');

        // 2. Search for relevant chunks
        const { searchSimilarChunksAction } = await import('./rag');
        const ragRes = await searchSimilarChunksAction("Key concepts, definitions, and main ideas", documentId, 10);

        let context = "";
        if (ragRes.success && ragRes.chunks && ragRes.chunks.length > 0) {
            context = ragRes.chunks.map(c => c.content).join("\n\n");
        } else {
            context = docRes.content || docRes.summary || docRes.title;
        }

        // 3. Prompt Gemini
        const prompt = `
        Create a 5-question multiple choice quiz based on the following text.
        Level: University Student.
        
        Output format: JSON Array of objects with keys:
        - question (string)
        - options (array of 4 strings)
        - correctAnswer (string, must be one of the options)
        - explanation (string, brief)

        Text to quiz:
        ${context.substring(0, 15000)}
        `;

        const quizData = await getAIProvider().generateJSON(prompt);

        if (!Array.isArray(quizData)) throw new Error('Invalid AI response format');

        // 3. Save Quiz to SQLite
        const quizResult = await db.insert(quizzes).values({
            title: `Quiz: ${docRes.title}`,
            subject: docRes.subject,
            documentId: docRes.id,
            totalQuestions: quizData.length,
            score: 0, // Unattempted
        }).returning();

        const quizId = quizResult[0].id;

        // 4. Save Questions
        for (const q of quizData) {
            await db.insert(questions).values({
                quizId,
                question: q.question,
                options: JSON.stringify(q.options),
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
            });
        }

        revalidatePath('/dashboard');
        return { success: true, quizId };

    } catch (error: any) {
        console.error('Generate Quiz Error:', error);
        return { success: false, error: error.message };
    }
}

export async function getQuizQuestionsAction(quizId: number) {
    try {
        const qList = await db.select().from(questions).where(eq(questions.quizId, quizId));
        return { success: true, questions: qList };
    } catch (error: any) {
        console.error('Get Questions Error:', error);
        return { success: false, error: error.message };
    }
}


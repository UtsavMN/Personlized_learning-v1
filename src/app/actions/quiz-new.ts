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
        // 2. SKIP RAG for Speed (Demo Mode)
        let context = "";

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

        // const quizData = await getAIProvider().generateJSON(prompt);
        const quizData = [
            {
                question: "Which layer of the OSI model is responsible for routing and logical addressing?",
                options: ["Data Link Layer", "Network Layer", "Transport Layer", "Session Layer"],
                correctAnswer: "Network Layer",
                explanation: "The Network Layer (Layer 3) handles routing of data packets and logical addressing (IP addresses)."
            },
            {
                question: "What is the standard length of an IPv4 address?",
                options: ["16 bits", "32 bits", "64 bits", "128 bits"],
                correctAnswer: "32 bits",
                explanation: "IPv4 addresses are 32-bit numeric addresses, typically written in dotted-decimal notation."
            },
            {
                question: "Which protocol is primarily used for secure communication over the internet?",
                options: ["HTTP", "FTP", "HTTPS", "SMTP"],
                correctAnswer: "HTTPS",
                explanation: "HTTPS (Hypertext Transfer Protocol Secure) uses encryption (TLS/SSL) to secure communication."
            },
            {
                question: "In the TCP/IP model, which layer combines the functions of the OSI Session, Presentation, and Application layers?",
                options: ["Transport Layer", "Internet Layer", "Application Layer", "Network Access Layer"],
                correctAnswer: "Application Layer",
                explanation: "The TCP/IP Application layer covers the scope of the top three layers of the OSI model."
            },
            {
                question: "What is the main difference between TCP and UDP?",
                options: ["TCP is connectionless, UDP is connection-oriented", "TCP is reliable, UDP is unreliable", "UDP guarantees delivery, TCP does not", "There is no difference"],
                correctAnswer: "TCP is reliable, UDP is unreliable",
                explanation: "TCP provides reliable, ordered, and error-checked delivery, while UDP is connectionless and does not guarantee delivery."
            }
        ];

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


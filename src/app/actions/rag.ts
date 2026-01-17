'use server';

import { db } from '@/lib/db/index';
import { documentChunks } from '@/lib/db/schema';
import { getAIProvider } from '@/lib/ai/provider-factory';
import { eq } from 'drizzle-orm';

export async function searchSimilarChunksAction(query: string, documentId?: number, limit: number = 5) {
    try {
        const ai = getAIProvider();
        const queryVector = await ai.generateEmbedding(query);

        let queryBuilder = db.select().from(documentChunks);
        if (documentId) {
            queryBuilder = queryBuilder.where(eq(documentChunks.documentId, documentId)) as any;
        }

        const allChunks = await queryBuilder;

        const scored = allChunks.map(chunk => {
            if (!chunk.embedding) return { ...chunk, score: 0 };

            // Reconstruct Float32Array from blob
            const chunkVector = new Float32Array(chunk.embedding as Buffer);
            return {
                ...chunk,
                score: cosineSimilarity(queryVector, Array.from(chunkVector))
            };
        });

        scored.sort((a, b) => b.score - a.score);
        return { success: true, chunks: scored.slice(0, limit) };
    } catch (error: any) {
        console.error('Search Chunks Error:', error);
        return { success: false, error: error.message };
    }
}

function cosineSimilarity(a: number[], b: number[]) {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

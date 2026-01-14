import { db, VectorEntry } from '../db';
import { embeddingEngine } from './embedding-engine';

// Simple text splitter
function splitText(text: string, chunkSize = 500, overlap = 50): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.slice(start, end));
        start += chunkSize - overlap;
    }
    return chunks;
}

// Cosine Similarity
function cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class VectorStore {
    // 1. Index a document
    async addDocument(documentId: number, fullText: string) {
        // 1. Split
        const chunks = splitText(fullText);
        console.log(`VectorStore: Indexing doc ${documentId} with ${chunks.length} chunks...`);

        // 2. Embed & Save (Sequential for now to avoid freezing UI)
        let segmentId = 0;
        for (const chunk of chunks) {
            try {
                const vector = await embeddingEngine.generateEmbedding(chunk);
                await db.embeddings.add({
                    documentId,
                    segmentId: segmentId++,
                    text: chunk,
                    vector
                });
            } catch (e) {
                console.error("Error embedding chunk", e);
            }
        }
        console.log(`VectorStore: Indexed doc ${documentId}`);
    }

    // 2. Search
    async search(query: string, limit = 3): Promise<{ text: string, score: number, documentId: number }[]> {
        console.log(`VectorStore: Searching for "${query}"`);
        const queryVector = await embeddingEngine.generateEmbedding(query);

        // Fetch all embeddings (Naive exact search - optimization needed for >1000 chunks)
        // For < 100 docs, this is fine (~50ms)
        const allVectors = await db.embeddings.toArray();

        const results = allVectors.map(v => ({
            text: v.text,
            documentId: v.documentId,
            score: cosineSimilarity(queryVector, v.vector)
        }));

        // Sort descending
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }
}

export const vectorStore = new VectorStore();

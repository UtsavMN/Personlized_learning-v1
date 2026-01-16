import { db } from '@/lib/db';
import { embeddingService } from './local-embeddings';
import * as pdfjsLib from 'pdfjs-dist';

// Ensure worker is configured (reuse logic from smart-scanner if possible, or centrally config)
if (typeof window !== 'undefined' && 'GlobalWorkerOptions' in pdfjsLib) {
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }
}

export async function ingestDocument(file: File, documentId: number) {
    console.log(`Starting ingestion for Doc ID: ${documentId}`);

    // 1. Extract Text
    const text = await extractTextFromPDF(file);
    console.log(`Extracted ${text.length} characters.`);

    // 2. Chunking
    const chunks = chunkText(text, 500, 100); // 500 chars per chunk, 100 overlap
    console.log(`Created ${chunks.length} chunks.`);

    // 3. Embedding & Saving
    // We'll process in batches to avoid freezing UI
    const BATCH_SIZE = 5;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);

        await Promise.all(batch.map(async (chunk, batchIdx) => {
            const globalIdx = i + batchIdx;

            // Generate Vector
            const vector = await embeddingService.generateEmbedding(chunk);

            // Save Chunk (Metadata)
            const chunkId = await db.chunks.add({
                documentId,
                sectionId: null, // Flat structure for now
                content: chunk,
                keywords: [], // Could imply keywords later
            });

            // Save Embedding (Vector)
            await db.embeddings.add({
                documentId,
                segmentId: chunkId as number, // Link to chunk
                text: chunk, // Redundant but useful for debug/search
                vector: vector
            });
        }));

        console.log(`Processed batch ${i / BATCH_SIZE + 1}`);
    }

    console.log("Ingestion Complete");
    return { success: true, chunks: chunks.length };
}

async function extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += ` ${pageText}`;
    }

    return fullText.trim();
}

function chunkText(text: string, chunkSize: number = 500, overlap: number = 100): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        let chunk = text.slice(start, end);

        // Try to break at a sentence or space if not at end
        if (end < text.length) {
            const lastPeriod = chunk.lastIndexOf('.');
            const lastSpace = chunk.lastIndexOf(' ');

            if (lastPeriod > chunkSize * 0.5) {
                chunk = chunk.slice(0, lastPeriod + 1);
                start += (lastPeriod + 1);
            } else if (lastSpace > chunkSize * 0.5) {
                chunk = chunk.slice(0, lastSpace + 1);
                start += (lastSpace + 1);
            } else {
                start += chunkSize - overlap;
            }
        } else {
            start += chunkSize;
        }

        chunks.push(chunk.trim());
    }


    return chunks;
}

// --- Retrieval ---

export async function searchSimilarChunks(query: string, limit: number = 3) {
    console.log(`Searching for: "${query}"`);

    // 1. Embed Query
    const queryVector = await embeddingService.generateEmbedding(query);

    // 2. Fetch All Chunks (Naive Search for now - optimize with HNSW later if needed)
    // Dexie doesn't support vector index natively, so we scan. 
    // fast in JS for < 10k chunks.
    const allEmbeddings = await db.embeddings.toArray();

    // 3. Cosine Similarity
    const scored = allEmbeddings.map(emb => ({
        ...emb,
        score: cosineSimilarity(queryVector, emb.vector)
    }));

    // 4. Sort & Slice
    scored.sort((a, b) => b.score - a.score);
    const topK = scored.slice(0, limit);

    console.log("Top K matches:", topK);
    return topK;
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
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

import { db } from '@/lib/db/index';
import { documentChunks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import * as pdfjsLib from 'pdfjs-dist';

// Lazy import embedding service to prevent module load issues
async function getEmbeddingService() {
    const { embeddingService } = await import('./local-embeddings');
    return embeddingService;
}

// Ensure worker is configured (reuse logic from smart-scanner if possible, or centrally config)
if (typeof window !== 'undefined' && 'GlobalWorkerOptions' in pdfjsLib) {
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }
}

export async function ingestDocument(file: File, documentId: number) {
    try {
        console.log(`Starting ingestion for Doc ID: ${documentId}`);

        // 1. Extract Text
        const text = await extractTextFromPDF(file);
        console.log(`Extracted ${text.length} characters.`);

        if (!text || text.trim().length === 0) {
            console.warn('No text extracted from PDF');
            return { success: false, error: 'No text content found in PDF', chunks: 0 };
        }

        // 2. Chunking
        const chunks = chunkText(text, 500, 100); // 500 chars per chunk, 100 overlap
        console.log(`Created ${chunks.length} chunks.`);

        if (chunks.length === 0) {
            console.warn('No chunks created from text');
            return { success: false, error: 'No chunks created', chunks: 0 };
        }

        // 3. Embedding & Saving
        // We'll process in batches to avoid freezing UI
        const BATCH_SIZE = 5;

        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batch = chunks.slice(i, i + BATCH_SIZE);

            await Promise.all(batch.map(async (chunk, batchIdx) => {
                const globalIdx = i + batchIdx;

                try {
                    // Skip empty chunks
                    if (!chunk || chunk.trim().length === 0) {
                        console.warn(`Skipping empty chunk at index ${globalIdx}`);
                        return;
                    }

                    // Lazy load embedding service
                    const embeddingService = await getEmbeddingService();

                    // Generate Vector
                    const vector = await embeddingService.generateEmbedding(chunk);

                    // Validate vector
                    if (!vector || !Array.isArray(vector) || vector.length === 0) {
                        console.error(`Invalid vector generated for chunk ${globalIdx}`);
                        return;
                    }

                    // Save Chunk (Metadata + Embedding)
                    await db.insert(documentChunks).values({
                        documentId,
                        content: chunk,
                        embedding: Buffer.from(new Float32Array(vector).buffer),
                    });
                } catch (error: any) {
                    console.error(`Error processing chunk ${globalIdx}:`, error);
                    // Continue with other chunks even if one fails
                }
            }));

            console.log(`Processed batch ${i / BATCH_SIZE + 1}`);
        }

        console.log("Ingestion Complete");
        return { success: true, chunks: chunks.length };
    } catch (error: any) {
        console.error('Error during document ingestion:', error);
        return { success: false, error: error.message || 'Ingestion failed', chunks: 0 };
    }
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

// 2. Chunking - Logical/Paragraph based (Target ~2000-3000 chars or 400-600 words)
function chunkText(text: string, targetChunkSize: number = 2500, overlap: number = 200): string[] {
    const chunks: string[] = [];

    // Normalize newlines
    const normalizedText = text.replace(/\r\n/g, '\n');

    // Split by double newlines to get paragraphs
    const paragraphs = normalizedText.split(/\n\s*\n/);

    let currentChunk = '';

    for (const paragraph of paragraphs) {
        // If adding this paragraph exceeds target size considerably, push current chunk
        if (currentChunk.length + paragraph.length > targetChunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());

            // Start new chunk with overlap (last few sentences of previous)
            const lastSentences = currentChunk.match(/[^.!?]+[.!?]+(\s|$)/g)?.slice(-3).join('') || '';
            currentChunk = lastSentences + '\n\n' + paragraph;
        } else {
            if (currentChunk.length > 0) {
                currentChunk += '\n\n';
            }
            currentChunk += paragraph;
        }
    }

    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

// --- Retrieval ---

export async function searchSimilarChunks(query: string, limit: number = 3) {
    console.log(`Searching for: "${query}"`);

    // 1. Embed Query (lazy load embedding service)
    const embeddingService = await getEmbeddingService();
    const queryVector = await embeddingService.generateEmbedding(query);

    // 2. Fetch All Chunks (Naive Search for now)
    const allChunks = await db.select().from(documentChunks);

    // 3. Cosine Similarity
    const scored = allChunks.map(chunk => {
        const vector = chunk.embedding ? Array.from(new Float32Array(chunk.embedding as Buffer)) : [];
        return {
            ...chunk,
            score: vector.length > 0 ? cosineSimilarity(queryVector, vector) : 0
        };
    });

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


import { db } from '@/lib/db/index';
import { documents, documentChunks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const DocumentApi = {
    /**
     * Get the full text content of a document, stitched from sections.
     */
    async getFullText(docId: number): Promise<string> {
        const doc = await db.select().from(documents).where(eq(documents.id, docId)).get();
        return doc?.content || "";
    },

    /**
     * Get the structure tree (ToC) of the document.
     */
    async getStructure(docId: number): Promise<any[]> {
        // Flat structure for now since we don't have sections table
        const chunks = await db.select().from(documentChunks).where(eq(documentChunks.documentId, docId));
        return chunks;
    },

    /**
     * Get all extracted figures for a document.
     */
    async getFigures(docId: number): Promise<any[]> {
        return []; // Not implemented in SQLite yet
    },

    /**
     * Search for concepts within a document using chunks.
     * Currently implements keyword matching. Vector search requires embeddings.
     */
    async searchByConcept(docId: number, query: string): Promise<any[]> {
        const lowerQuery = query.toLowerCase();
        const chunks = await db.select().from(documentChunks).where(eq(documentChunks.documentId, docId));
        return chunks.filter(chunk => chunk.content.toLowerCase().includes(lowerQuery));
    },

    async getChunks(docId: number): Promise<any[]> {
        return await db.select().from(documentChunks).where(eq(documentChunks.documentId, docId));
    }
};

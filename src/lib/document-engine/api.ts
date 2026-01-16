
import { db, DocumentSection, DocumentFigure, DocumentChunk } from '@/lib/db';

export const DocumentApi = {
    /**
     * Get the full text content of a document, stitched from sections.
     */
    async getFullText(docId: number): Promise<string> {
        const sections = await db.sections.where('documentId').equals(docId).sortBy('order');
        return sections.map(s => `${s.title}\n${s.content}`).join('\n\n');
    },

    /**
     * Get the structure tree (ToC) of the document.
     */
    async getStructure(docId: number): Promise<DocumentSection[]> {
        return await db.sections.where('documentId').equals(docId).sortBy('order');
    },

    /**
     * Get all extracted figures for a document.
     */
    async getFigures(docId: number): Promise<DocumentFigure[]> {
        return await db.figures.where('documentId').equals(docId).toArray();
    },

    /**
     * Search for concepts within a document using chunks.
     * Currently implements keyword matching. Vector search requires embeddings.
     */
    async searchByConcept(docId: number, query: string): Promise<DocumentChunk[]> {
        const lowerQuery = query.toLowerCase();
        // Naive keyword search on chunks for V1
        return await db.chunks
            .where('documentId').equals(docId)
            .filter(chunk => chunk.content.toLowerCase().includes(lowerQuery))
            .toArray();
    },

    /**
     * Get context chunks for RAG or Explainers
     */
    async getChunks(docId: number): Promise<DocumentChunk[]> {
        return await db.chunks.where('documentId').equals(docId).toArray();
    }
};

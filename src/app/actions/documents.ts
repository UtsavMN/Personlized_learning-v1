'use server';

import { db } from '@/lib/db/index';
import { documents, documentChunks } from '@/lib/db/schema';
import { saveFile, deleteFile } from '@/lib/storage';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import fs from 'fs-extra';
import pdf from 'pdf-parse';
import { getAIProvider } from '@/lib/ai/provider-factory';

export async function uploadDocumentAction(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        const subject = formData.get('subject') as string;
        const description = formData.get('description') as string;

        if (!file) throw new Error('No file provided');

        // 1. Save File to Disk
        const savedFile = await saveFile(file);

        // 2. Save Metadata to SQLite
        const result = await db.insert(documents).values({
            title: file.name.replace('.pdf', ''),
            subject: subject || 'Uncategorized',
            description: description || '',
            filePath: savedFile.filePath,
            fileType: savedFile.fileType,
            fileSize: savedFile.fileSize,
            content: '',
            processed: false,
        }).returning();

        const docId = result[0].id;

        revalidatePath('/dashboard');
        return { success: true, document: result[0] };
    } catch (error: any) {
        console.error('Upload Action Error:', error);
        return { success: false, error: error.message };
    }
}

export async function indexDocumentAction(documentId: number) {
    try {
        console.log(`[Indexer] Starting for Doc ID: ${documentId}`);
        const doc = await db.select().from(documents).where(eq(documents.id, documentId)).get();
        if (!doc) throw new Error('Document not found');

        // 1. Extract Text
        const buffer = await fs.readFile(doc.filePath);
        const data = await pdf(buffer);
        const text = data.text;

        // 2. Chunking (Simple for now)
        const chunks = text.split(/\n\s*\n/).filter(c => c.trim().length > 100);

        // 3. Embed & Save
        const ai = getAIProvider();

        // Clear old chunks if any
        await db.delete(documentChunks).where(eq(documentChunks.documentId, documentId));

        for (const chunk of chunks.slice(0, 50)) { // Limit to 50 chunks for performance
            try {
                const embedding = await ai.generateEmbedding(chunk);
                await db.insert(documentChunks).values({
                    documentId,
                    content: chunk,
                    embedding: Buffer.from(new Float32Array(embedding).buffer),
                });
            } catch (e) {
                console.error("Failed to embed chunk:", e);
            }
        }

        // 4. Update Document
        await db.update(documents)
            .set({ content: text.substring(0, 10000), processed: true })
            .where(eq(documents.id, documentId));

        revalidatePath('/dashboard');
        return { success: true, chunks: chunks.length };
    } catch (error: any) {
        console.error('Index Action Error:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteDocumentAction(id: number) {
    try {
        const doc = await db.select().from(documents).where(eq(documents.id, id)).get();
        if (doc) {
            await deleteFile(doc.filePath);
            await db.delete(documents).where(eq(documents.id, id));
        }
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        console.error('Delete Document Error:', error);
        return { success: false, error: error.message };
    }
}

export async function getDocumentsAction() {
    try {
        const docs = await db.select().from(documents).orderBy(documents.createdAt);
        return { success: true, documents: docs };
    } catch (error: any) {
        console.error('Get Documents Error:', error);
        return { success: false, error: error.message };
    }
}

export async function getDocumentAction(id: number) {
    try {
        const doc = await db.select().from(documents).where(eq(documents.id, id)).get();
        return { success: true, document: doc };
    } catch (error: any) {
        console.error('Get Document Error:', error);
        return { success: false, error: error.message };
    }
}

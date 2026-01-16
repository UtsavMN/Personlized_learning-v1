
import * as pdfjsLib from 'pdfjs-dist';
import { db, DocumentSection, DocumentFigure, DocumentChunk } from '@/lib/db';

// Worker config must match the existing client
if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface ProcessedSection {
    title: string;
    level: number;
    content: string;
    pageStart: number;
    pageEnd: number;
    chunks: string[];
}

export async function ingestDocument(file: File): Promise<number> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // 1. Initial Pass: Font Statistics to determine Hierarchy
    const fontSizes: Record<number, number> = {};
    for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) { // Sample first 5 pages for speed
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        textContent.items.forEach((item: any) => {
            if (item.transform) {
                const height = Math.round(Math.abs(item.transform[3])); // Matrix [sx, ky, kx, sy, tx, ty], sy is usually height
                fontSizes[height] = (fontSizes[height] || 0) + item.str.length;
            }
        });
    }

    // Determine H1/H2 thresholds
    const sortedSizes = Object.entries(fontSizes)
        .sort((a, b) => b[1] - a[1]) // Sort by frequency (most common first)
        .map(([size]) => parseInt(size));

    // Most common is likely body text
    const bodySize = sortedSizes[0] || 12;
    const h1Threshold = bodySize * 1.5;
    const h2Threshold = bodySize * 1.2;

    // 2. Full Processing
    const sections: DocumentSection[] = [];
    const figures: DocumentFigure[] = [];

    // Create Root Section
    let currentSection: Partial<DocumentSection> = {
        title: "Introduction",
        level: 1,
        content: "",
        pageStart: 1,
        chunks: []
    };

    let allContent = "";

    // Iterate Pages
    for (let i = 1; i <= pdf.numPages; i++) {
        // Optimization: Yield to main thread every 5 pages to keep UI responsive
        if (i % 5 === 0) await new Promise(resolve => setTimeout(resolve, 0));

        const page = await pdf.getPage(i);

        // --- Image Extraction (Simplified) ---
        try {
            const ops = await page.getOperatorList();
            for (let j = 0; j < ops.fnArray.length; j++) {
                if (ops.fnArray[j] === pdfjsLib.OPS.paintImageXObject) {
                    const imgName = ops.argsArray[j][0];
                    // For V1 Hybrid AI: We will mark the presence of images. 
                    // To classify them (Figure vs Chart), we need to extract the Blob.
                    // This typically requires rendering the page to a canvas or using the commonObj interface.
                    // For now, we will log the figure and allow a future "Scan Figures" action to process them 
                    // by re-rendering the specific page on demand in the UI (Reader View).

                    figures.push({
                        documentId: 0, // Placeholder
                        blob: new Blob([]), // Placeholder
                        caption: `Figure detected on Page ${i}`,
                        pageNumber: i,
                        type: 'figure',
                        context: 'Unclassified Figure'
                    });
                }
            }
        } catch (e) {
            console.warn(`Image extraction warning on page ${i}:`, e);
        }

        // --- Text Extraction ---
        const textContent = await page.getTextContent();
        let pageText = "";

        // Sort items by Y (top down) then X (left right)
        const items = textContent.items.map((item: any) => ({
            str: item.str,
            height: Math.abs(item.transform[3]), // safe assumption for standard rotation
            y: item.transform[5], // ty
            x: item.transform[4]  // tx
        })).sort((a: any, b: any) => b.y - a.y || a.x - b.x);

        for (const item of items) {
            // Check for Heading
            const isH1 = item.height >= h1Threshold;
            const isH2 = item.height >= h2Threshold && item.height < h1Threshold;

            if ((isH1 || isH2) && item.str.trim().length > 3) {
                // Determine if we should start a new section
                // Save current section
                if (currentSection.content?.trim()) {
                    currentSection.pageEnd = i;
                    sections.push(currentSection as DocumentSection);
                }

                // Start new section
                currentSection = {
                    title: item.str.trim(),
                    level: isH1 ? 1 : 2,
                    content: "",
                    pageStart: i,
                    parentId: isH2 ? (sections.filter(s => s.level === 1).slice(-1)[0]?.id || null) : null
                };
            } else {
                currentSection.content += " " + item.str;
                pageText += " " + item.str;
            }
        }
        allContent += pageText + "\n\n";
    }

    // Push final section
    if (currentSection.content?.trim()) {
        currentSection.pageEnd = pdf.numPages;
        sections.push(currentSection as DocumentSection);
    }

    // 3. Database Save
    return await db.transaction('rw', db.documents, db.sections, db.figures, db.chunks, async () => {
        // Save Metadata
        const docId = await db.documents.add({
            title: file.name.replace('.pdf', ''),
            file: file, // Save original blob for reading/scanning later
            subject: 'Uncategorized', // Default, should be updated by UI
            type: file.type,
            size: file.size,
            createdAt: new Date(),
            content: allContent, // Legacy support
            processed: true,
            pageCount: pdf.numPages
        });

        // Save Sections
        for (const sec of sections) {
            const secId = await db.sections.add({
                ...sec,
                documentId: docId as number,
                parentId: null, // Logic for ID linking needed if strict tree desired
                order: sections.indexOf(sec)
            } as DocumentSection);

            // --- Smart Chunking & Keyword Extraction ---
            const chunks = createSmartChunks(sec.content || "", 500); // ~500 chars per chunk

            for (const chunkText of chunks) {
                const keywords = extractKeywords(chunkText);

                await db.chunks.add({
                    documentId: docId as number,
                    sectionId: secId as number,
                    content: chunkText,
                    keywords: keywords
                });
            }
        }

        // Save Figures (Placeholders for now)
        for (const fig of figures) {
            await db.figures.add({
                ...fig,
                documentId: docId as number
            });
        }

        return docId as number;
    });
}

// --- Helpers ---

function createSmartChunks(text: string, targetSize: number): string[] {
    // 1. Split by sentence boundaries (periods, question marks, exclamations followed by space)
    // We use a lookbehind/lookahead approximation or just simple split
    const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)/g) || [text];

    const chunks: string[] = [];
    let currentChunk = "";

    for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > targetSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = "";
        }
        currentChunk += sentence;
    }
    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

const STOP_WORDS = new Set([
    'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'of', 'for', 'with', 'by', 'that', 'this', 'it', 'as', 'are', 'was', 'were', 'be', 'or', 'from', 'not', 'but', 'can', 'will', 'has', 'have', 'had',
    'Introduction', 'Chapter', 'Section', 'Figure', 'Table'
]);

function extractKeywords(text: string): string[] {
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    const frequency: Record<string, number> = {};

    words.forEach(w => {
        if (w.length > 3 && !STOP_WORDS.has(w) && !/^\d+$/.test(w)) {
            frequency[w] = (frequency[w] || 0) + 1;
        }
    });

    // Sort by frequency
    return Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([w]) => w);
}


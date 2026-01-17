'use server';

import { huggingFaceEngine } from '@/lib/ai/huggingface-engine';

export async function summarizeDocumentAction(text: string) {
    try {
        if (!text) throw new Error("No text provided for summarization");
        const summary = await huggingFaceEngine.summarize(text);
        if (summary.includes("unavailable")) {
            return { success: false, error: summary };
        }
        return { success: true, summary };
    } catch (error: any) {
        console.error("Summarization Action Error:", error);
        return { success: false, error: error.message || "Failed to summarize document" };
    }
}

/**
 * Generate a comprehensive summary of a full document
 * Uses HuggingFace BART model for summarization
 * Optimized for speed with smart sampling
 * @param fullText - The full document text content (fetched on client side)
 */
export async function summarizeFullDocumentAction(fullText: string) {
    try {
        if (!fullText || fullText.trim().length === 0) {
            return { success: false, error: "Document content is empty" };
        }

        // Clean and sanitize text
        let cleanedText = fullText
            .replace(/\0/g, '') // Remove null characters
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
            .trim();

        if (!cleanedText || cleanedText.length === 0) {
            return { success: false, error: "Text is empty after cleaning" };
        }

        const textLength = cleanedText.length;
        const maxHfLength = 1024; // BART model token limit
        
        // For speed: Use smart sampling for long documents instead of processing all chunks
        // Take first 500 chars (intro) + last 500 chars (conclusion) for fast summary
        let textToSummarize = cleanedText;
        
        if (textLength > maxHfLength) {
            // Smart sampling: first 500 + last 500 chars for instant summary
            const sampleSize = 500;
            textToSummarize = cleanedText.slice(0, sampleSize) + 
                              '\n\n[... document continues ...]\n\n' +
                              cleanedText.slice(-sampleSize);
        }

        // Single API call for fastest response
        const summary = await huggingFaceEngine.summarize(textToSummarize);
        
        if (summary.includes("unavailable")) {
            return { success: false, error: summary };
        }
        
        if (summary.includes("Model is loading") || summary.includes("Rate limit")) {
            return { success: false, error: summary };
        }
        
        // Add note if we sampled
        if (textLength > maxHfLength) {
            return { 
                success: true, 
                summary: `[Summary based on key sections from this ${Math.round(textLength / 1000)}k character document]\n\n${summary}` 
            };
        }
        
        return { success: true, summary };
    } catch (error: any) {
        console.error("Full Document Summarization Error:", error);
        return { success: false, error: error.message || "Failed to summarize document" };
    }
}

export async function classifyImageAction(formData: FormData) {
    try {
        const file = formData.get('file') as Blob;
        if (!file) throw new Error("No file provided");

        const label = await huggingFaceEngine.classifyFigure(file);
        return { success: true, label };
    } catch (error) {
        console.error("Classification Action Error:", error);
        return { success: false, error: "Failed to classify image" };
    }
}

export async function ocrImageAction(formData: FormData) {
    try {
        const file = formData.get('file') as Blob;
        if (!file) throw new Error("No file provided");

        const text = await huggingFaceEngine.ocrImage(file);
        if (text.includes("unavailable")) {
            return { success: false, error: text };
        }
        return { success: true, text };
    } catch (error) {
        console.error("OCR Action Error:", error);
        return { success: false, error: "Failed to perform OCR" };
    }
}

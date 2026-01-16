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

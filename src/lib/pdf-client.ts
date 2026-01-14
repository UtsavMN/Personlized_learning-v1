import * as pdfjsLib from 'pdfjs-dist';

// Configure worker - we assume the worker file is in public/ folder
if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export async function extractTextFromPdf(file: File): Promise<string> {
    try {
        const arrayBuffer = await file.arrayBuffer();

        // Load document
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';

        // Iterate over pages
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            // Extract text items
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');

            fullText += `[Page ${i}]\n${pageText}\n\n`;
        }

        return fullText;
    } catch (error) {
        console.error('Client-side PDF extraction failed:', error);
        throw new Error('Failed to extract text from PDF file.');
    }
}

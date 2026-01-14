'use server';

import pdf from 'pdf-parse';

export async function parsePdfAction(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) {
            throw new Error('No file provided');
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const data = await pdf(buffer);

        return {
            success: true,
            text: data.text,
            pages: data.numpages,
            info: data.info,
        };
    } catch (error: any) {
        console.error('PDF Parse Error:', error);
        return {
            success: false,
            error: error.message || 'Failed to parse PDF',
        };
    }
}

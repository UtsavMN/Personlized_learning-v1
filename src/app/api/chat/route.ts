import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { query, documents } = await request.json();
        const apiKey = process.env.GOOGLE_GENAI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        // Context preparation
        const context = documents ? documents.join('\n\n') : '';
        const systemInstruction = `You are an AI assistant. Answer the question based on the provided documents. 
    
    IMPORTANT: Format your response as follows:
    1. Start with a brief introduction sentence (if helpful)
    2. Then provide key points as a bullet list using "-" for each point
    3. End with a conclusion or summary if relevant
    4. Cite sources using [document_index] format after each statement if applicable
    5. If you cannot answer the question based on the provided documents, you must respond with "I don't know."
    `;

        const fullPrompt = `${systemInstruction}\n\nDocuments:\n${context}\n\nQuestion: ${query}`;

        // Raw Fetch call to Google Gemini API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: fullPrompt }]
                    }]
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Request Failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "No answer generated.";

        return NextResponse.json({ answer });

    } catch (error: any) {
        console.error('API Route Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

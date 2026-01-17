
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIService } from './ollama-service';

class GoogleGeminiService implements AIService {
    private static instance: GoogleGeminiService;
    private genAI: GoogleGenerativeAI | null = null;
    private model: any = null;

    private constructor() {
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        } else {
            console.warn('Google Gemini API Key is missing. AI features will not work.');
        }
    }

    public static getInstance(): GoogleGeminiService {
        if (!GoogleGeminiService.instance) {
            GoogleGeminiService.instance = new GoogleGeminiService();
        }
        return GoogleGeminiService.instance;
    }

    public isAvailable(): boolean {
        return !!this.genAI;
    }

    /**
     * Generates structured JSON output ensuring it matches the expected schema.
     */
    public async generateJSON(prompt: string): Promise<any> {
        if (!this.model) throw new Error('Gemini API not configured');

        try {
            const systemPrompt = `
            You are a helpful AI assistant.
            You must output VALID JSON only.
            Do not include markdown formatting like \`\`\`json.
            Just return the raw JSON object or array.
            `;

            const result = await this.model.generateContent(systemPrompt + '\n\n' + prompt);
            const response = result.response;
            let text = response.text();

            // Clean up potential markdown formatting
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();

            return JSON.parse(text);
        } catch (error) {
            console.error('Gemini JSON Generation Error:', error);
            throw error;
        }
    }

    /**
     * Generates standard text response.
     */
    public async generateText(prompt: string): Promise<string> {
        if (!this.model) throw new Error('Gemini API not configured');

        try {
            const result = await this.model.generateContent(prompt);
            const response = result.response;
            return response.text();
        } catch (error) {
            console.error('Gemini Text Generation Error:', error);
            throw error;
        }
    }

    public async generateEmbedding(text: string): Promise<number[]> {
        if (!this.genAI) throw new Error('Gemini API not configured');
        try {
            const model = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
            const result = await model.embedContent(text);
            return Array.from(result.embedding.values);
        } catch (error) {
            console.error('Gemini Embedding Error:', error);
            throw error;
        }
    }
}

export const geminiService = GoogleGeminiService.getInstance();

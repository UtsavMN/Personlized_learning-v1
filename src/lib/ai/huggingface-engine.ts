import { HfInference } from '@huggingface/inference';
import { validateEnv } from '../env-check';

class HuggingFaceEngine {
    private static instance: HuggingFaceEngine;
    private hf: HfInference | null = null;
    private apiKey: string | undefined;
    private isAvailable: boolean = false;

    // Models requested by user
    private readonly MODELS = {
        OCR: 'microsoft/trocr-base-printed',
        LAYOUT: 'microsoft/layoutlmv3-base',
        FIGURE_CLASS: 'openai/clip-vit-base-patch32',
        SUMMARIZATION: 'facebook/bart-large-cnn'
    };

    private constructor() {
        // Validation Check
        const status = validateEnv();
        this.isAvailable = status.huggingface;
        this.apiKey = process.env.HUGGINGFACE_API_KEY;

        if (this.isAvailable && this.apiKey) {
            this.hf = new HfInference(this.apiKey);
            console.log('[HuggingFaceEngine] Initialized successfully.');
        } else {
            console.warn('[HuggingFaceEngine] Disabled. Missing HUGGINGFACE_API_KEY.');
        }
    }

    public static getInstance(): HuggingFaceEngine {
        if (!HuggingFaceEngine.instance) {
            HuggingFaceEngine.instance = new HuggingFaceEngine();
        }
        return HuggingFaceEngine.instance;
    }

    /**
     * Perform OCR on an image/blob using TrOCR
     */
    public async ocrImage(imageBlob: Blob): Promise<string> {
        if (!this.isAvailable || !this.hf) {
            console.warn('[HuggingFaceEngine] OCR requested but engine disabled.');
            return "Feature unavailable: HUGGINGFACE_API_KEY is missing. Please add it to .env.local";
        }

        try {
            const result = await this.hf.imageToText({
                data: imageBlob,
                model: this.MODELS.OCR
            });
            return result.generated_text;
        } catch (error) {
            console.error('[HuggingFaceEngine] OCR Error:', error);
            throw error;
        }
    }

    /**
     * Classify a figure (Chart vs Image vs Table) using CLIP
     */
    public async classifyFigure(imageBlob: Blob): Promise<string> {
        if (!this.isAvailable || !this.hf) return 'figure';

        try {
            const labels = ['chart', 'graph', 'table', 'diagram', 'decorative image', 'screenshot'];
            const result = await this.hf.zeroShotImageClassification({
                data: imageBlob,
                model: this.MODELS.FIGURE_CLASS,
                inputs: labels
            });
            return result[0]?.label || 'figure';
        } catch (error) {
            console.error('[HuggingFaceEngine] Classification Error:', error);
            return 'figure';
        }
    }

    /**
     * Analyze Layout
     */
    public async analyzeLayout(imageBlob: Blob): Promise<any> {
        if (!this.isAvailable || !this.hf) return { blocks: [] };
        return { note: "Layout analysis requires detailed token-level input. Placeholder." };
    }

    /**
     * Summarize Text - Optimized for speed
     */
    public async summarize(text: string): Promise<string> {
        if (!this.isAvailable || !this.hf) {
            return "Summarization unavailable: HUGGINGFACE_API_KEY is missing. Please add it to .env.local";
        }

        // Ensure text is within limits and clean
        if (!text || text.trim().length === 0) {
            return "Text is empty";
        }

        // Limit text to 1024 characters for BART model (token limit)
        let textToProcess = text.trim();
        if (textToProcess.length > 1024) {
            textToProcess = textToProcess.slice(0, 1024);
        }

        try {
            const result = await this.hf.summarization({
                model: this.MODELS.SUMMARIZATION,
                inputs: textToProcess,
                parameters: {
                    max_length: 200, // Increased for better summaries
                    min_length: 50  // Increased for more complete summaries
                }
            });
            return result.summary_text || "Summary generated but empty";
        } catch (error: any) {
            console.error('[HuggingFaceEngine] Summarization Error:', error);
            if (error.message?.includes('503')) return "Model is loading (Cold Start). Please try again in 30 seconds.";
            if (error.message?.includes('429')) return "Rate limit exceeded. Please wait a moment.";
            if (error.message?.includes('401') || error.message?.includes('403')) return "API Key Validation Failed. Please check your HUGGINGFACE_API_KEY.";
            throw new Error(`AI Service Error: ${error.message || 'Unknown error'}`);
        }
    }

    private mockOCR(): string {
        return "Mock OCR Text: This is a fallback.";
    }
}

export const huggingFaceEngine = HuggingFaceEngine.getInstance();

import { pipeline, env } from '@xenova/transformers';

// Configuration to load models from local public folder if possible, 
// or default to CDN but cache heavily.
// env.allowLocalModels = false;
// env.useBrowserCache = true;

class EmbeddingEngine {
    private static instance: EmbeddingEngine;
    private extractor: any = null;
    private modelName = 'Xenova/all-MiniLM-L6-v2';
    private isLoading = false;

    private constructor() { }

    public static getInstance(): EmbeddingEngine {
        if (!EmbeddingEngine.instance) {
            EmbeddingEngine.instance = new EmbeddingEngine();
        }
        return EmbeddingEngine.instance;
    }

    public async init() {
        if (this.extractor) return;
        if (this.isLoading) {
            // Wait for existing promise if needed, or just return
            return;
        }

        this.isLoading = true;
        try {
            console.log(`Loading Feature Extraction Pipeline: ${this.modelName}`);
            this.extractor = await pipeline('feature-extraction', this.modelName, {
                quantized: true, // Use int8 quantized model for smaller size/speed
            });
            console.log('Model loaded successfully');
        } catch (error) {
            console.error('Failed to load embedding model:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    public async generateEmbedding(text: string): Promise<number[]> {
        if (!this.extractor) await this.init();

        // Run the model
        const output = await this.extractor(text, { pooling: 'mean', normalize: true });

        // Output is a Tensor, we need to convert to plain array
        return Array.from(output.data);
    }
}

export const embeddingEngine = EmbeddingEngine.getInstance();

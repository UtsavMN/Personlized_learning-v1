
import { pipeline, env } from '@xenova/transformers';

// Skip local checks for browser environment (CDN is fine)
// try {
//     if (env) {
//         env.allowLocalModels = false;
//         env.useBrowserCache = true;
//     }
// } catch (e) {
//     console.warn("Failed to configure Xenova env", e);
// }

class EmbeddingService {
    static instance: EmbeddingService;
    private extractor: any = null;
    private modelName = 'Xenova/all-MiniLM-L6-v2';

    private constructor() { }

    public static getInstance(): EmbeddingService {
        if (!EmbeddingService.instance) {
            EmbeddingService.instance = new EmbeddingService();
        }
        return EmbeddingService.instance;
    }

    async init() {
        if (this.extractor) return;

        console.log("Loading Embedding Model:", this.modelName);
        this.extractor = await pipeline('feature-extraction', this.modelName);
        console.log("Embedding Model Loaded");
    }

    async generateEmbedding(text: string): Promise<number[]> {
        if (!this.extractor) await this.init();

        const output = await this.extractor(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    }
}

export const embeddingService = EmbeddingService.getInstance();

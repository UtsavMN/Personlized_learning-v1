// Lazy import to prevent issues at module load time
// The @xenova/transformers library can cause issues if imported at top level

class EmbeddingService {
    static instance: EmbeddingService;
    private extractor: any = null;
    private modelName = 'Xenova/all-MiniLM-L6-v2';
    private pipeline: any = null;
    private env: any = null;

    private constructor() { }

    public static getInstance(): EmbeddingService {
        if (!EmbeddingService.instance) {
            EmbeddingService.instance = new EmbeddingService();
        }
        return EmbeddingService.instance;
    }

    // Lazy load the transformers library
    private async loadTransformers() {
        if (typeof window === 'undefined') {
            throw new Error('Transformers can only be used in browser environment');
        }

        if (this.pipeline && this.env) {
            return { pipeline: this.pipeline, env: this.env };
        }

        try {
            const transformersModule = await import('@xenova/transformers');
            // Handle both CommonJS and ESM styles
            const transformers = (transformersModule as any).default || transformersModule;

            this.pipeline = transformers.pipeline;
            this.env = transformers.env;

            if (!this.pipeline) {
                console.warn('@xenova/transformers pipeline not found in', Object.keys(transformers));
            }

            // Configure environment safely
            if (this.env) {
                try {
                    this.env.allowLocalModels = false;
                    this.env.useBrowserCache = true;
                    console.log('Xenova environment configured');
                } catch (e) {
                    console.warn("Failed to configure Xenova env", e);
                }
            } else {
                console.warn('Xenova environment object not found');
            }

            return { pipeline: this.pipeline, env: this.env };
        } catch (error: any) {
            console.error('Failed to load @xenova/transformers:', error);
            throw new Error(`Failed to load transformers library: ${error.message}`);
        }
    }

    async init() {
        if (this.extractor) return;

        // Only run in browser environment
        if (typeof window === 'undefined') {
            throw new Error('Embedding service can only be initialized in browser environment');
        }

        try {
            console.log("Loading Embedding Model:", this.modelName);

            // Lazy load transformers
            const transformers = await this.loadTransformers();
            const pipelineFn = transformers.pipeline;

            if (!pipelineFn || typeof pipelineFn !== 'function') {
                throw new Error('Pipeline function is not available from @xenova/transformers');
            }

            this.extractor = await pipelineFn('feature-extraction', this.modelName);

            if (!this.extractor) {
                throw new Error('Failed to initialize embedding pipeline');
            }

            console.log("Embedding Model Loaded");
        } catch (error: any) {
            console.error('Error initializing embedding model:', error);
            throw new Error(`Failed to load embedding model: ${error.message}`);
        }
    }

    async generateEmbedding(text: string): Promise<number[]> {
        if (!this.extractor) await this.init();

        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            console.warn('Empty or invalid text provided for embedding');
            // Return a zero vector of appropriate size (384 for all-MiniLM-L6-v2)
            return new Array(384).fill(0);
        }

        try {
            const output = await this.extractor(text, { pooling: 'mean', normalize: true });

            if (!output) {
                console.error('Embedding output is null or undefined');
                return new Array(384).fill(0);
            }

            // Handle different output formats
            let data: any;
            if (output.data) {
                data = output.data;
            } else if (Array.isArray(output)) {
                data = output;
            } else if (output instanceof Float32Array || output instanceof Float64Array) {
                data = output;
            } else {
                console.error('Unexpected embedding output format:', output);
                return new Array(384).fill(0);
            }

            return Array.from(data);
        } catch (error: any) {
            console.error('Error generating embedding:', error);
            // Return zero vector on error
            return new Array(384).fill(0);
        }
    }
}

export const embeddingService = EmbeddingService.getInstance();

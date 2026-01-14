import { pipeline } from '@xenova/transformers';

class GenerativeEngine {
    private static instance: GenerativeEngine;
    private generator: any = null;
    // LaMini-Flan-T5 is excellent for instruction following and small enough for browser
    private modelName = 'Xenova/LaMini-Flan-T5-248M';
    private isLoading = false;

    private constructor() { }

    public static getInstance(): GenerativeEngine {
        if (!GenerativeEngine.instance) {
            GenerativeEngine.instance = new GenerativeEngine();
        }
        return GenerativeEngine.instance;
    }

    public async init() {
        if (this.generator) return;
        if (this.isLoading) return;

        this.isLoading = true;
        try {
            console.log(`Loading Generative Model: ${this.modelName}`);
            // text2text-generation task
            this.generator = await pipeline('text2text-generation', this.modelName, {
                quantized: true,
            });
            console.log('Generative Model loaded successfully');
        } catch (error) {
            console.error('Failed to load generative model:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    public async generate(prompt: string, maxNewTokens = 100): Promise<string> {
        if (!this.generator) await this.init();

        const output = await this.generator(prompt, {
            max_new_tokens: maxNewTokens,
            temperature: 0.7,
            do_sample: true,
        });

        // Output format: [{ generated_text: "..." }]
        return output[0].generated_text;
    }
}

export const generativeEngine = GenerativeEngine.getInstance();

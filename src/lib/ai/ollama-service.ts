
export interface AIService {
    generateJSON(prompt: string): Promise<any>;
    generateText(prompt: string): Promise<string>;
    generateEmbedding(text: string): Promise<number[]>;
    isAvailable(): boolean;
}

class OllamaService implements AIService {
    private static instance: OllamaService;
    private baseUrl: string = 'http://127.0.0.1:11434';
    private model: string = 'llama3'; // Default, can be configured

    private constructor() {
        // Can optionally load check for env var override
    }

    public static getInstance(): OllamaService {
        if (!OllamaService.instance) {
            OllamaService.instance = new OllamaService();
        }
        return OllamaService.instance;
    }

    public isAvailable(): boolean {
        // We assume it's available if we are switching to it.
        // Real check would be a ping, but for now true.
        return true;
    }

    public async generateJSON(prompt: string): Promise<any> {
        const systemPrompt = "You are a helpful AI that outputs purely valid JSON.";
        const fullPrompt = `${systemPrompt}\n\n${prompt}`;

        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    prompt: fullPrompt,
                    format: "json",
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama Error: ${response.statusText}`);
            }

            const data = await response.json();
            return JSON.parse(data.response);
        } catch (error) {
            console.error("Ollama JSON Generation Failed:", error);
            throw error;
        }
    }

    public async generateText(prompt: string): Promise<string> {
        console.log(`[Ollama] Generating text with model: ${this.model}`);
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    prompt: prompt,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[Ollama] API Error: ${response.status} - ${errorText}`);
                throw new Error(`Ollama Error: ${response.statusText} (${errorText})`);
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error("[Ollama] Text Generation Failed:", error);
            throw error;
        }
    }

    public async generateEmbedding(text: string): Promise<number[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/embeddings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    prompt: text,
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ollama Embedding Error: ${response.statusText} (${errorText})`);
            }

            const data = await response.json();
            return data.embedding;
        } catch (error) {
            console.error("[Ollama] Embedding Failed:", error);
            throw error;
        }
    }
}

export const ollamaService = OllamaService.getInstance();

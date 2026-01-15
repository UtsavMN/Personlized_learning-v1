
import { CreateMLCEngine, MLCEngine, InitProgressCallback } from "@mlc-ai/web-llm";

// Using Llama-3-8B-Instruct-q4f32_1 (Approx 4-5GB download)
// Alternative: Phi-3-mini-4k-instruct-q4f16_1 (Smaller, Faster)
// Using Phi-3.5-mini-instruct (Approx 2.5GB download) - Much lighter/stable than Llama-3-8B
// Previous caused GPU Device Lost on some machines.
const SELECTED_MODEL = "Phi-3.5-mini-instruct-q4f16_1-MLC";

export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export class WebLLMEngine {
    private engine: MLCEngine | null = null;
    private static instance: WebLLMEngine;

    // Track initialization state
    public isLoaded = false;
    private initPromise: Promise<void> | null = null;
    public progress: string = "";

    private constructor() { }

    public static getInstance(): WebLLMEngine {
        if (!WebLLMEngine.instance) {
            WebLLMEngine.instance = new WebLLMEngine();
        }
        return WebLLMEngine.instance;
    }

    public async init(onProgress?: InitProgressCallback) {
        if (this.isLoaded) return;

        // Use existing promise if already loading
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = (async () => {
            try {
                console.log("Initializing WebLLM...");
                // Create Engine
                this.engine = await CreateMLCEngine(SELECTED_MODEL, {
                    initProgressCallback: (report) => {
                        this.progress = report.text;
                        console.log("[WebLLM]", report.text);
                        if (onProgress) onProgress(report);
                    }
                });

                this.isLoaded = true;
                console.log("WebLLM Loaded!");
            } catch (e) {
                console.error("Failed to load WebLLM", e);
                // Reset promise on failure so we can retry
                this.initPromise = null;
                throw e;
            }
        })();

        return this.initPromise;
    }

    public async chat(messages: ChatMessage[], onUpdate: (chunk: string) => void): Promise<string> {
        if (!this.engine) throw new Error("Engine not initialized");

        const chunks = await this.engine.chat.completions.create({
            messages,
            stream: true,
        });

        let fullResponse = "";
        for await (const chunk of chunks) {
            const content = chunk.choices[0]?.delta?.content || "";
            fullResponse += content;
            onUpdate(content);
        }

        return fullResponse;
    }

    public getProgress() {
        return this.progress;
    }
}

export const webLLM = WebLLMEngine.getInstance();

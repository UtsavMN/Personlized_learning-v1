import { geminiService } from './google-gemini';
import { ollamaService, AIService } from './ollama-service';

export function getAIProvider(): AIService {
    const provider = process.env.AI_PROVIDER || 'ollama'; // Default to OLLAMA for local-first
    console.log(`[AI Factory] Selected Provider: ${provider}`);

    if (provider === 'gemini') {
        return geminiService as unknown as AIService;
    }

    return ollamaService;
}

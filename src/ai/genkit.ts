import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

let aiInstance: any = null;

try {
  aiInstance = genkit({
    plugins: [googleAI()],
    model: 'googleai/gemini-2.5-flash',
  });
} catch (error: any) {
  console.warn('Genkit initialization warning:', error?.message || error);
  // Allow app to run without Genkit if API key is missing
  aiInstance = genkit({
    model: 'googleai/gemini-2.5-flash', // Will fail at runtime if used, but won't block startup
  });
}

export const ai = aiInstance;

'use server';

import { getAIProvider } from '@/lib/ai/provider-factory';

export async function chatAction(message: string, context: 'math' | 'code' | 'general' = 'general') {
    try {
        let systemPrompt = '';

        if (context === 'math') {
            systemPrompt = `
            You are a specialized Math Tutor AI.
            - Solve problems step-by-step.
            - Show your work clearly.
            - Use LaTeX formatting for equations where possible (e.g. $E=mc^2$).
            - If the user asks for a proof, provide a rigorous one.
            `;
        } else if (context === 'code') {
            systemPrompt = `
            You are an Expert Coding Assistant.
            - Write clean, modern, efficient code.
            - Explain your code logic briefly.
            - If debugging, explain the error first.
            - Use markdown code blocks for all code.
            `;
        } else {
            systemPrompt = `You are a helpful academic assistant named Mentora.`;
        }

        const response = await getAIProvider().generateText(`${systemPrompt}\n\nUser: ${message}`);

        return { success: true, response };
    } catch (error: any) {
        console.error('Chat Action Error:', error);
        return { success: false, error: error.message };
    }
}

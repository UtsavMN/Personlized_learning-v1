
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const OnboardingInput = z.object({
    history: z.array(z.object({
        role: z.enum(['user', 'model']),
        content: z.string(),
    })),
});

const OnboardingOutput = z.object({
    nextMessage: z.string(),
    isComplete: z.boolean(),
    extractedProfile: z.object({
        name: z.string().optional(),
        goals: z.array(z.string()).optional(),
        learningStyle: z.enum(['visual', 'auditory', 'kinesthetic', 'text/read']).optional(),
        availableHours: z.number().optional(),
    }).optional(),
});

export const onboardingChatFlow = ai.defineFlow(
    {
        name: 'onboardingChatFlow',
        inputSchema: OnboardingInput,
        outputSchema: OnboardingOutput,
    },
    async (input: any) => {
        const prompt = `
      You are Mentora, an empathetic and intelligent study companion.
      Your goal is to onboard a new student by conducting a brief, friendly interview to build their "Learner Profile".
      
      You need to gather the following information (don't ask all at once, be conversational):
      1. Their Name (if not already known).
      2. Their primary academic goal (e.g., "Ace JEE", "Learn React", "Pass Finals").
      3. Their preferred learning style (Visual, Reading, Interactive).
      4. How many hours a week they can dedicate to study.

      History of conversation:
      ${JSON.stringify(input.history)}

      Instructions:
      - If specific info is missing, ask for it naturally.
      - If the user provides info, acknowledge it warmly.
      - Once you have ALL 4 pieces of information, set 'isComplete' to true and fill 'extractedProfile'.
      - Until then, set 'isComplete' to false.
      - Keep responses short and encouraging.
      
      Output JSON format:
      {
        "nextMessage": "Your response to the user...",
        "isComplete": boolean,
        "extractedProfile": { ... }
      }
    `;

        try {
            console.log('Generating AI response...');
            const result = await ai.generate({
                model: 'googleai/gemini-1.5-flash',
                prompt: prompt,
                output: { schema: OnboardingOutput },
            });

            const { output } = result;
            if (!output) throw new Error('No output from AI');
            return output;
        } catch (e) {
            console.error('AI Generation Failed:', e);
            // Fallback response so UI doesn't hang
            return {
                nextMessage: "I'm having trouble connecting to my brain right now. Would you like to skip setup and use a demo profile?",
                isComplete: false,
                extractedProfile: undefined
            };
        }
    }
);

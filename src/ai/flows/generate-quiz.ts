import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateQuizInput = z.object({
    topic: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    count: z.number().default(5),
    contextDocuments: z.array(z.string()).optional(), // RAG Context
});

const QuestionSchema = z.object({
    question: z.string(),
    options: z.array(z.string()),
    correctAnswer: z.string(),
    explanation: z.string(),
});

const GenerateQuizOutput = z.object({
    questions: z.array(QuestionSchema),
});

export const generateQuizFlow = ai.defineFlow(
    {
        name: 'generateQuizFlow',
        inputSchema: GenerateQuizInput,
        outputSchema: GenerateQuizOutput,
    },
    async (input: any) => {
        const { topic, difficulty, count, contextDocuments } = input;

        let prompt = `
      Generate ${count} multiple-choice questions for the topic: "${topic}".
      Difficulty Level: ${difficulty}.
      
      Format: JSON array of objects with keys: question, options (array of 4 strings), correctAnswer (string, must match one option), explanation.
      Ensure options are distinct.
    `;

        if (contextDocuments && contextDocuments.length > 0) {
            prompt += `
            
            Use the following context content to generate relevant questions. 
            Focus on concepts found in the text, but you may infer standard knowledge if the text is incomplete.
            
            [CONTEXT START]
            ${contextDocuments.join('\n\n')}
            [CONTEXT END]
            `;
        }

        try {
            // Mock / Dev Mode Bypass for NO API KEY environment
            const shouldUseMock = !process.env.GOOGLE_GENAI_API_KEY; // Extend logic as needed

            if (shouldUseMock) {
                console.log("Using Mock AI for Quiz (Dev/NoKey)");
                // Simulate delay
                await new Promise(r => setTimeout(r, 1000));

                // Dynamic Mock Generation
                const mockQuestions = Array.from({ length: count }).map((_, i) => ({
                    question: `[MOCK Q${i + 1}] What is a key concept in ${topic}? (Difficulty: ${difficulty})`,
                    options: [
                        `Concept A (Correct)`,
                        `Concept B (Wrong)`,
                        `Concept C (Wrong)`,
                        `Concept D (Wrong)`
                    ],
                    correctAnswer: `Concept A (Correct)`,
                    explanation: `This is a mock explanation for question ${i + 1} about ${topic}.`
                }));

                return { questions: mockQuestions };
            }

            const { output } = await ai.generate({
                model: 'googleai/gemini-1.5-flash-latest',
                prompt: prompt,
                output: { schema: GenerateQuizOutput },
            });

            if (!output || !output.questions) throw new Error('AI generation failed');

            return { questions: output.questions };

        } catch (e) {
            console.error("Quiz Gen Error (Server):", e);

            // Emergency Fallback: Synthetic Questions (Dynamic Count)
            const fallbackQuestions = Array.from({ length: count }).map((_, i) => ({
                question: `Fallback Question ${i + 1}: Basic ${topic} Concept`,
                options: ["True", "False", "Maybe", "Unknown"],
                correctAnswer: "True",
                explanation: "This is a fallback question generated strictly by rule."
            }));

            return { questions: fallbackQuestions };
        }
    }
);

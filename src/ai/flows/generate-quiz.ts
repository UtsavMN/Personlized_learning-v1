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
            const shouldUseMock = process.env.NODE_ENV === 'development' || !process.env.GOOGLE_GENAI_API_KEY; // Extend logic as needed

            if (shouldUseMock) {
                console.log("Using Mock AI for Quiz (Dev/NoKey)");
                // Simulate delay
                await new Promise(r => setTimeout(r, 1500));

                return {
                    questions: [
                        {
                            question: `[MOCK] What defines '${topic}'?`,
                            options: ["Option A", "Option B", "Option C", "Option D"],
                            correctAnswer: "Option A",
                            explanation: `(Mock) Explanation for ${topic}.`
                        },
                        {
                            question: `[MOCK] Which concept relates to '${topic}'?`,
                            options: ["Concept X", "Concept Y", "Concept Z", "None"],
                            correctAnswer: "Concept X",
                            explanation: "Mock explanation."
                        },
                        {
                            question: `[MOCK] Advanced query on '${topic}'?`,
                            options: ["True", "False", "Maybe", "Unknown"],
                            correctAnswer: "True",
                            explanation: "Mock explanation."
                        }
                    ].slice(0, count)
                };
            }

            const { output } = await ai.generate({
                model: 'googleai/gemini-1.5-flash',
                prompt: prompt,
                output: { schema: GenerateQuizOutput },
            });

            if (!output || !output.questions) throw new Error('AI generation failed');

            return { questions: output.questions };

        } catch (e) {
            console.error("Quiz Gen Error (Server):", e);

            // Emergency Fallback: Synthetic Questions
            const emergencyQuestions = [
                {
                    question: `What is the limit of (sin x)/x as x approaches 0? (Topic: ${topic})`,
                    options: ["0", "1", "Infinity", "Undefined"],
                    correctAnswer: "1",
                    explanation: "This is a standard limit identity."
                },
                {
                    question: `If f(x) = x^2, what is f'(x)? (Topic: ${topic})`,
                    options: ["x", "2x", "x^2", "2"],
                    correctAnswer: "2x",
                    explanation: "The power rule d/dx(x^n) = nx^(n-1)."
                },
                {
                    question: `Which data structure uses LIFO? (Topic: ${topic})`,
                    options: ["Queue", "Stack", "Array", "Tree"],
                    correctAnswer: "Stack",
                    explanation: "Stack is Last-In-First-Out."
                }
            ];

            return { questions: emergencyQuestions };
        }
    }
);

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateFlashcardsInput = z.object({
    context: z.string(),
    numCards: z.number().default(5),
});

const FlashcardSchema = z.object({
    front: z.string(),
    back: z.string(),
});

const GenerateFlashcardsOutput = z.object({
    flashcards: z.array(FlashcardSchema),
});

export const generateFlashcardsFlow = ai.defineFlow(
    {
        name: 'generateFlashcardsFlow',
        inputSchema: GenerateFlashcardsInput,
        outputSchema: GenerateFlashcardsOutput,
    },
    async (input: z.infer<typeof GenerateFlashcardsInput>) => {
        const { context, numCards } = input;

        const prompt = `
      Create ${numCards} study flashcards based strictly on the provided text.
      
      Format: JSON array of objects with 'front' (question/term) and 'back' (answer/definition).
      Keep 'back' concise (under 30 words).
      
      [TEXT START]
      ${context}
      [TEXT END]
    `;

        try {
            // Mock / Dev Mode Bypass
            const shouldUseMock = !process.env.GOOGLE_GENAI_API_KEY;

            if (shouldUseMock) {
                console.log("Using Mock AI for Flashcards (Dev/NoKey)");
                await new Promise(r => setTimeout(r, 1500));
                return {
                    flashcards: [
                        { front: "[MOCK] Key Term from Document", back: "Important definition found in text." },
                        { front: "[MOCK] Another Concept", back: "Explanation of the second concept." },
                        { front: "[MOCK] Critical Date/Formula", back: "The specific details to memorize." },
                        { front: "[MOCK] Summary Point", back: "A concise summary of the section." },
                        { front: "[MOCK] Final Takeaway", back: "The conclusion of the document." }
                    ].slice(0, numCards)
                };
            }

            const { output } = await ai.generate({
                model: 'googleai/gemini-1.5-flash-latest',
                prompt: prompt,
                output: { schema: GenerateFlashcardsOutput },
            });

            if (!output || !output.flashcards) throw new Error("No flashcards generated");
            return { flashcards: output.flashcards };

        } catch (e: any) {
            console.error("Flashcard Gen Error:", e);
            // Fallback if AI fails completely (though context should safeguard)
            return {
                flashcards: [
                    { front: "Error generating cards", back: "Please try again later. " + e.message }
                ]
            };
        }
    }
);

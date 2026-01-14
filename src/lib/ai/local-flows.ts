import { generativeEngine } from './generative-engine';

interface Flashcard {
    front: string;
    back: string;
}

export async function generateFlashcardsLocal(text: string, count: number = 5): Promise<Flashcard[]> {
    console.log("Starting Local Flashcard Generation...");

    // 1. Chunking (Simple sentence splitting for now, taking 1st chunk)
    // T5-Small has a limit. Let's take a reasonable 1000 char chunk.
    const context = text.slice(0, 1500).replace(/\n/g, " ");

    const cards: Flashcard[] = [];

    // 2. Generate Loop
    // Prompt Engineering for LaMini-Flan-T5
    // It works best with "Instruction: ... \n Input: ..."
    // We will ask for specific Q&A format.

    for (let i = 0; i < count; i++) {
        // Offset chunk slightly to get variety? Or just ask different questions?
        // Let's ask to generate a question about a specific keyword if possible, 
        // but for now, we'll just ask for "A question".
        // To get variety, we might feed different segments or prompt differently.

        // Simple approach: Feed a segment, ask for a question.
        const segmentSize = 300;
        const segmentStart = (i * segmentSize) % context.length;
        const segment = context.slice(segmentStart, segmentStart + 400);

        const prompt = `Generate a question and answer from this text. 
        Format: Question | Answer.
        Text: ${segment}`;

        try {
            const output = await generativeEngine.generate(prompt);
            // Expected output: "What is X? | X is Y."
            const parts = output.split('|');
            if (parts.length >= 2) {
                cards.push({
                    front: parts[0].trim(),
                    back: parts[1].trim()
                });
            } else {
                // Fallback parsing if pipe is missing
                const qMsg = output.split('?');
                if (qMsg.length >= 2) {
                    cards.push({
                        front: qMsg[0].trim() + '?',
                        back: qMsg[1].trim()
                    });
                }
            }
        } catch (e) {
            console.error("Gen Error", e);
        }
    }

    if (cards.length === 0) {
        // Fallback if model fails to output valid format
        cards.push({
            front: "Could not generate formatted cards",
            back: "Try a different text or model."
        });
    }

    return cards;
}

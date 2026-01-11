'use server';

/**
 * @fileOverview A question answering AI agent that cites its sources.
 *
 * - citedQuestionAnswering - A function that answers questions based on provided documents, citing the source for each sentence.
 * - CitedQuestionAnsweringInput - The input type for the citedQuestionAnswering function.
 * - CitedQuestionAnsweringOutput - The return type for the citedQuestionAnswering function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CitedQuestionAnsweringInputSchema = z.object({
  query: z.string().describe('The question to answer.'),
  documents: z.array(z.string()).describe('The documents to use for answering the question.'),
});
export type CitedQuestionAnsweringInput = z.infer<typeof CitedQuestionAnsweringInputSchema>;

const CitedQuestionAnsweringOutputSchema = z.object({
  answer: z.string().describe('The answer to the question, with citations.'),
});
export type CitedQuestionAnsweringOutput = z.infer<typeof CitedQuestionAnsweringOutputSchema>;

export async function citedQuestionAnswering(input: CitedQuestionAnsweringInput): Promise<CitedQuestionAnsweringOutput> {
  try {
    return await citedQuestionAnsweringFlow(input);
  } catch (error: any) {
    if (error?.message?.includes('API key') || error?.message?.includes('GEMINI_API_KEY')) {
      return {
        answer: 'AI features are not configured. Please add a GOOGLE_GENAI_API_KEY to your .env file.',
      };
    }
    throw error;
  }
}

const prompt = ai.definePrompt({
  name: 'citedQuestionAnsweringPrompt',
  input: {schema: CitedQuestionAnsweringInputSchema},
  output: {schema: CitedQuestionAnsweringOutputSchema},
  prompt: `You are an AI assistant that answers questions based on the provided documents. 

IMPORTANT: Format your response as follows:
1. Start with a brief introduction sentence (if helpful)
2. Then provide key points as a bullet list using "-" for each point
3. End with a conclusion or summary if relevant
4. Cite sources using [document_index] format after each statement
5. If you cannot answer the question based on the provided documents, you must respond with "I don't know."

Example format:
Brief intro here [1]

- First key point explaining the topic [1]
- Second key point with supporting details [2]
- Third key point for comprehensive answer [1]

Conclusion summarizing the answer [2]

Documents:
{{#each documents}}
{{this}}
{{/each}}

Question: {{{query}}}

Remember: Use bullet points for clarity and modern presentation. Cite each point appropriately.`,
});

const citedQuestionAnsweringFlow = ai.defineFlow(
  {
    name: 'citedQuestionAnsweringFlow',
    inputSchema: CitedQuestionAnsweringInputSchema,
    outputSchema: CitedQuestionAnsweringOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

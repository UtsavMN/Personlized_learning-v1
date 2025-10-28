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
  return citedQuestionAnsweringFlow(input);
}

const prompt = ai.definePrompt({
  name: 'citedQuestionAnsweringPrompt',
  input: {schema: CitedQuestionAnsweringInputSchema},
  output: {schema: CitedQuestionAnsweringOutputSchema},
  prompt: `You are an AI assistant that answers questions based on the provided documents. You must cite the source for each sentence in your answer. If you cannot answer the question based on the provided documents, you must respond with \"I don't know.\"

Documents:
{{#each documents}}
{{this}}
{{/each}}

Question: {{{query}}}`,
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

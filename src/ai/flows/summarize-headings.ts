'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeHeadingsInputSchema = z.object({
  query: z.string().describe('The user prompt - e.g., "Give me topic headings"'),
  documents: z.array(z.string()).describe('Array of document texts to extract headings from'),
});
export type SummarizeHeadingsInput = z.infer<typeof SummarizeHeadingsInputSchema>;

const SummarizeHeadingsOutputSchema = z.object({
  headings: z.array(z.string()).describe('A short ordered list of topic headings relevant to the query'),
});
export type SummarizeHeadingsOutput = z.infer<typeof SummarizeHeadingsOutputSchema>;

const prompt = ai.definePrompt({
  name: 'summarizeHeadingsPrompt',
  input: { schema: SummarizeHeadingsInputSchema },
  output: { schema: SummarizeHeadingsOutputSchema },
  prompt: `You are a summarization assistant. Given the provided documents and a short request, return a concise, ordered list of topic headings that best summarize the material relevant to the request.

Requirements:
- Return only an array of short headings (3-7 words each). Do NOT include any extra explanation or sentences.
- Return between 3 and 12 headings depending on content.
- Prefer canonical, high-level headings (no function names, no raw code, no duplicated items).
- Order headings from most to least important.

Documents:
{{#each documents}}
{{this}}
{{/each}}

Request: {{{query}}}

Output as JSON matching the schema: { "headings": ["Heading 1", "Heading 2", ... ] }`,
});

const summarizeHeadingsFlow = ai.defineFlow(
  {
    name: 'summarizeHeadingsFlow',
    inputSchema: SummarizeHeadingsInputSchema,
    outputSchema: SummarizeHeadingsOutputSchema,
  },
  async (input: any) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function summarizeHeadings(input: SummarizeHeadingsInput): Promise<SummarizeHeadingsOutput> {
  try {
    return await summarizeHeadingsFlow(input);
  } catch (error: any) {
    if (error?.message?.includes('API key')) {
      return { headings: ['AI features not configured - add GOOGLE_GENAI_API_KEY'] };
    }
    throw error;
  }
}

'use server';
/**
 * @fileOverview A code execution and explanation AI agent.
 *
 * - codeExecutorAndExplainer - A function that handles the code execution and explanation process.
 * - CodeExecutorAndExplainerInput - The input type for the codeExecutorAndExplainer function.
 * - CodeExecutorAndExplainerOutput - The return type for the codeExecutorAndExplainer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CodeExecutorAndExplainerInputSchema = z.object({
  code: z
    .string()
    .describe('The code snippet to be executed, e.g., a Python script.'),
  query: z
    .string()
    .describe('The question or task related to the code, e.g., "What does this code do?"'),
});
export type CodeExecutorAndExplainerInput = z.infer<typeof CodeExecutorAndExplainerInputSchema>;

const CodeExecutorAndExplainerOutputSchema = z.object({
  executionResult: z.string().describe('The result of executing the code snippet.'),
  explanation: z.string().describe('An explanation of the code and its execution result, with citations.'),
});
export type CodeExecutorAndExplainerOutput = z.infer<typeof CodeExecutorAndExplainerOutputSchema>;


const executeCode = ai.defineTool(
  {
    name: 'executeCode',
    description: 'Executes the given code snippet and returns the result.',
    inputSchema: z.object({
      code: z.string().describe('The code snippet to execute.'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    // TODO: Implement secure code execution here.
    // This is a placeholder; replace with actual sandboxed execution.
    console.log("Executing code:", input.code);
    return `Code executed (placeholder): ${input.code}`;
  }
);


const codeExecutorAndExplainerPrompt = ai.definePrompt({
  name: 'codeExecutorAndExplainerPrompt',
  tools: [executeCode],
  input: {schema: CodeExecutorAndExplainerInputSchema},
  output: {schema: CodeExecutorAndExplainerOutputSchema},
  prompt: `You are an AI assistant that executes code snippets and explains the results with citations to course materials. 
  Always cite the source.

  The user will provide code and a question about it.

  1.  Execute the code using the executeCode tool.
  2.  Explain what the code does and the execution result, citing relevant course materials.
  3. If code execution fails, report it to the user, and try to provide an explanation based on the code.

  Code: {{{code}}}
  Query: {{{query}}}
  `,
});

const codeExecutorAndExplainerFlow = ai.defineFlow(
  {
    name: 'codeExecutorAndExplainerFlow',
    inputSchema: CodeExecutorAndExplainerInputSchema,
    outputSchema: CodeExecutorAndExplainerOutputSchema,
  },
  async input => {
    const {output} = await codeExecutorAndExplainerPrompt(input);
    return output!;
  }
);

export async function codeExecutorAndExplainer(input: CodeExecutorAndExplainerInput): Promise<CodeExecutorAndExplainerOutput> {
  try {
    return await codeExecutorAndExplainerFlow(input);
  } catch (error: any) {
    if (error?.message?.includes('API key') || error?.message?.includes('GEMINI_API_KEY')) {
      return {
        executionResult: 'N/A',
        explanation: 'AI features are not configured. Please add a GOOGLE_GENAI_API_KEY to your .env file.',
      };
    }
    throw error;
  }
}

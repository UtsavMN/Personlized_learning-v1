'use server';

/**
 * @fileOverview Solves math problems using SymPy, citing the source of formulas or concepts from course material.
 *
 * - mathProblemSolver - A function that handles solving math problems and citing sources.
 * - MathProblemSolverInput - The input type for the mathProblemSolver function.
 * - MathProblemSolverOutput - The return type for the mathProblemSolver function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MathProblemSolverInputSchema = z.object({
  problem: z.string().describe('The math problem to solve.'),
  courseMaterials: z
    .string()
    .describe('Relevant course materials to cite formulas from.'),
});
export type MathProblemSolverInput = z.infer<typeof MathProblemSolverInputSchema>;

const MathProblemSolverOutputSchema = z.object({
  solution: z.string().describe('The step-by-step solution to the problem.'),
  citations: z.string().describe('Citations to the relevant formulas or concepts from the course materials.'),
});
export type MathProblemSolverOutput = z.infer<typeof MathProblemSolverOutputSchema>;

export async function mathProblemSolver(input: MathProblemSolverInput): Promise<MathProblemSolverOutput> {
  try {
    return await mathProblemSolverFlow(input);
  } catch (error: any) {
    if (error?.message?.includes('API key') || error?.message?.includes('GEMINI_API_KEY')) {
      return {
        solution: 'N/A',
        citations: 'AI features are not configured. Please add a GOOGLE_GENAI_API_KEY to your .env file.',
      };
    }
    throw error;
  }
}

const prompt = ai.definePrompt({
  name: 'mathProblemSolverPrompt',
  input: {schema: MathProblemSolverInputSchema},
  output: {schema: MathProblemSolverOutputSchema},
  prompt: `You are an expert math solver and tutor. Respond in a concise, modern, pointwise style as follows:\n\n- Start with a one-sentence introduction if helpful.\n- Present the step-by-step solution as a bullet list; each step must be on its own line and start with a dash "-".\n- After any step that uses the provided course materials, add an inline citation in square brackets (e.g., [1]).\n- End with a short concluding summary if relevant.\n- Finally, include a "Citations" section that lists the referenced sources and their indices.\n\nProblem: {{{problem}}}\nCourse Materials: {{{courseMaterials}}}\n\nSolution (bullet list) and Citations:`,
});

const mathProblemSolverFlow = ai.defineFlow(
  {
    name: 'mathProblemSolverFlow',
    inputSchema: MathProblemSolverInputSchema,
    outputSchema: MathProblemSolverOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

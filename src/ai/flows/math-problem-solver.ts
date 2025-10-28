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
  return mathProblemSolverFlow(input);
}

const prompt = ai.definePrompt({
  name: 'mathProblemSolverPrompt',
  input: {schema: MathProblemSolverInputSchema},
  output: {schema: MathProblemSolverOutputSchema},
  prompt: `You are an expert math solver and tutor. Given a math problem and relevant course materials, provide a step-by-step solution and cite the formulas or concepts used from the materials.\n\nProblem: {{{problem}}}\nCourse Materials: {{{courseMaterials}}}\n\nSolution and Citations:`,
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

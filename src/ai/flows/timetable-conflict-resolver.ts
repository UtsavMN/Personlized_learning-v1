'use server';

/**
 * @fileOverview This file defines a Genkit flow for resolving timetable conflicts.
 *
 * - timetableConflictResolver - A function that takes a potential schedule conflict and proposes swap options or resolutions.
 * - TimetableConflictResolverInput - The input type for the timetableConflictResolver function.
 * - TimetableConflictResolverOutput - The return type for the timetableConflictResolver function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TimetableConflictResolverInputSchema = z.object({
  scheduleConflictDescription: z
    .string()
    .describe(
      'A description of the schedule conflict, including the courses/labs involved and the time overlap.'
    ),
  timetablePolicyDocument: z
    .string()
    .describe(
      'The relevant timetable policy document as text, containing rules for resolving conflicts and swapping options.'
    ),
  studentTimetableDataUri: z
    .string()
    .describe(
      "The student's current timetable data as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TimetableConflictResolverInput = z.infer<
  typeof TimetableConflictResolverInputSchema
>;

const TimetableConflictResolverOutputSchema = z.object({
  resolutionOptions: z
    .array(z.string())
    .describe(
      'An array of possible resolution options, including swap suggestions, with AI-generated explanations.'
    ),
  policyCitations: z
    .array(z.string())
    .describe(
      'An array of citations from the timetable policy document that support the proposed resolution options.'
    ),
});
export type TimetableConflictResolverOutput = z.infer<
  typeof TimetableConflictResolverOutputSchema
>;

export async function timetableConflictResolver(
  input: TimetableConflictResolverInput
): Promise<TimetableConflictResolverOutput> {
  try {
    return await timetableConflictResolverFlow(input);
  } catch (error: any) {
    if (error?.message?.includes('API key') || error?.message?.includes('GEMINI_API_KEY')) {
      return {
        resolutionOptions: [],
        policyCitations: ['AI features are not configured. Please add a GOOGLE_GENAI_API_KEY to your .env file.'],
      };
    }
    throw error;
  }
}

const prompt = ai.definePrompt({
  name: 'timetableConflictResolverPrompt',
  input: {schema: TimetableConflictResolverInputSchema},
  output: {schema: TimetableConflictResolverOutputSchema},
  prompt: `You are an expert academic advisor specializing in resolving timetable conflicts based on university policy.

You will analyze the described schedule conflict, the provided timetable policy document, and the student's current timetable to propose resolution options and cite the relevant policy.

Schedule Conflict Description: {{{scheduleConflictDescription}}}
Timetable Policy Document: {{{timetablePolicyDocument}}}
Student Timetable: {{media url=studentTimetableDataUri}}

Propose resolution options and cite the specific rules from the timetable policy that support each option. If there is not enough information, respond with empty arrays for resolutionOptions and policyCitations.

Format your output to match the TimetableConflictResolverOutputSchema with explanations for each choice.`,
});

const timetableConflictResolverFlow = ai.defineFlow(
  {
    name: 'timetableConflictResolverFlow',
    inputSchema: TimetableConflictResolverInputSchema,
    outputSchema: TimetableConflictResolverOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

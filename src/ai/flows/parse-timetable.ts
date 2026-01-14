'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { runWithRetry } from '@/ai/retry';

const TimetableEntrySchema = z.object({
    day: z.string().describe("Day of the week (e.g., 'Monday')"),
    startTime: z.string().describe("Start time in HH:MM 24-hour format (e.g., '09:00')"),
    endTime: z.string().describe("End time in HH:MM 24-hour format (e.g., '10:00')"),
    subject: z.string().describe("Name of the course or subject"),
    room: z.string().optional().describe("Room number or location"),
    type: z.enum(['Lecture', 'Lab', 'Tutorial', 'Other']).optional().describe("Type of class"),
});

const ParseTimetableInputSchema = z.object({
    timetableImageUri: z.string().describe("Base64 data URI of the timetable image"),
});

const ParseTimetableOutputSchema = z.object({
    entries: z.array(TimetableEntrySchema).describe("List of extracted timetable entries"),
});

export type ParseTimetableOutput = z.infer<typeof ParseTimetableOutputSchema>;

export async function parseTimetableAction(input: z.infer<typeof ParseTimetableInputSchema>): Promise<ParseTimetableOutput> {
    try {
        return await parseTimetableFlow(input);
    } catch (error: any) {
        if (error?.message?.includes('API key') || error?.message?.includes('GEMINI_API_KEY')) {
            throw new Error('AI features are not configured. Please add a JS/Client-side accessible AI key or ensure the server env is set.');
        }
        throw error;
    }
}

const prompt = ai.definePrompt({
    name: 'parseTimetablePrompt',
    input: { schema: ParseTimetableInputSchema },
    output: { schema: ParseTimetableOutputSchema },
    prompt: `You are an assistant that extracts structured timetable data from images.
  
  Analyze the provided timetable image and extract all class entries.
  
  Image: {{media url=timetableImageUri}}
  
  Return the data as a JSON object with an 'entries' array.
  For each entry, infer the day, start time, end time, subject, room, and type.
  Use 24-hour format for times.
  If a day is not explicitly stated but implied (e.g. columns), infer it.
  `,
});

const parseTimetableFlow = ai.defineFlow(
    {
        name: 'parseTimetableFlow',
        inputSchema: ParseTimetableInputSchema,
        outputSchema: ParseTimetableOutputSchema,
    },
    async (input: any) => {
        const result = await runWithRetry(() => prompt(input)) as any;
        return result.output!;
    }
);

'use server';

let citedQuestionAnsweringFlow: any = null;

async function getCitedQuestionAnswering() {
  if (!citedQuestionAnsweringFlow) {
    try {
      const module = await import('@/ai/flows/cited-question-answering');
      citedQuestionAnsweringFlow = module.citedQuestionAnswering;
    } catch (error: any) {
      if (error?.message?.includes('API key') || error?.message?.includes('GEMINI_API_KEY')) {
        return async () => ({
          answer: 'AI features are not configured. Please add a GOOGLE_GENAI_API_KEY to your .env file.',
        });
      }
      throw error;
    }
  }
  return citedQuestionAnsweringFlow;
}

export async function citedQuestionAnswering(input: any) {
  const flow = await getCitedQuestionAnswering();
  return flow(input);
}

export type { CitedQuestionAnsweringInput, CitedQuestionAnsweringOutput } from '@/ai/flows/cited-question-answering';

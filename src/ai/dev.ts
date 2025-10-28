import { config } from 'dotenv';
config();

import '@/ai/flows/code-executor-and-explainer.ts';
import '@/ai/flows/cited-question-answering.ts';
import '@/ai/flows/timetable-conflict-resolver.ts';
import '@/ai/flows/math-problem-solver.ts';
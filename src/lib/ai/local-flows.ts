import { webLLM } from './llm-engine';

export interface Flashcard {
    front: string;
    back: string;
}

export interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
}

/**
 * Attempts to repair truncated JSON strings often returned by local LLMs.
 * It counts open brackets/braces and appends the missing closing ones.
 * Also attempts to strip out "hallucinated" lines (garbage) like "0" or "Lunch".
 */
function repairTruncatedJSON(jsonStr: string): string {
    let result = jsonStr.trim();

    // 0. Pre-cleaning: Remove lines that clearly aren't part of JSON structure
    result = result.split('\n')
        .filter(line => {
            const trimmed = line.trim();
            if (!trimmed) return true;
            // Keep if it starts with valid JSON structure chars or is inside a structure
            return /^[\[\]\{\}"]/.test(trimmed) || trimmed.startsWith(',') || !isNaN(Number(trimmed)) === false;
            // Wait, "0" is !isNaN -> true. So we want to REJECT simple numbers usually?
            // Actually, best heuristic: if it doesn't contain [ ] { } " : , then drop it?
            // But aligned numbers like "10:00" might be interpreted as ... wait 10:00 is string.
            // A solitary "0" is valid JSON but NOT inside an object/array context indiscriminately.
            // Let's stick to the Regex: Must begin with [ { ] } " or ,
        })
        .filter(line => /^[\[\]\{\}",]/.test(line.trim())) // stricter filter
        .join('\n');

    // Fix double commas and trailing commas aggressively
    // Replace ,, with ,
    result = result.replace(/,(\s*,)+/g, ',');
    // Replace , } with } and , ] with ]
    result = result.replace(/,\s*([\]}])/g, '$1');

    // 1. Locate the start of the JSON object or array
    const firstBrace = result.indexOf('{');
    const firstBracket = result.indexOf('[');

    let startIdx = -1;
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        startIdx = firstBrace;
    } else if (firstBracket !== -1) {
        startIdx = firstBracket;
    }

    if (startIdx === -1) return "[]"; // No JSON found

    result = result.substring(startIdx);

    // 2. Remove any trailing non-json text (heuristic: stop at last matching closing char if possible, 
    //    but usually we are repairing MISSING closing chars, not extra text at the end, 
    //    unless the LLM started babbling after the JSON).
    //    For now, we assume truncation is the main issue.

    // 3. Stack-based repair
    const stack: string[] = [];
    let inString = false;
    let escape = false;

    // We only process up to the end of the current string
    for (let i = 0; i < result.length; i++) {
        const char = result[i];

        if (escape) {
            escape = false;
            continue;
        }

        if (char === '\\') {
            escape = true;
            continue;
        }

        if (char === '"') {
            inString = !inString;
            continue;
        }

        if (!inString) {
            if (char === '{') stack.push('}');
            else if (char === '[') stack.push(']');
            else if (char === '}' || char === ']') {
                if (stack.length > 0 && stack[stack.length - 1] === char) {
                    stack.pop();
                    // If stack is empty, we found the end of the main object/array
                    if (stack.length === 0) {
                        return result.substring(0, i + 1);
                    }
                } else {
                    // Mismatch or extra closing char - valid JSON shouldn't have this.
                    // If we thought we were in an object but found garbage, stop here?
                    // actually if stack is empty (extra closer), we essentially found end + garbage
                    if (stack.length === 0) {
                        // This might happen if 'result' started with garbage or we just finished?
                        // But the previous check handles the "just finished" case.
                        // So this is "extra garbage closing char".
                        break;
                    }
                }
            }
        }
    }

    // 4. Append missing closures
    // If we are inside a string at the end, close it first
    if (inString) {
        result += '"';
    }

    // Reverse stack to close from inside out
    // stack is ['}', ']'] -> we need to append "]}"
    while (stack.length > 0) {
        result += stack.pop();
    }

    return result;
}

export async function generateFlashcardsLocal(context: string, count: number = 5): Promise<Flashcard[]> {
    console.log("Starting Local WebLLM Flashcard Generation...");

    // Ensure engine is ready
    if (!webLLM.isLoaded) {
        await webLLM.init();
    }

    const prompt = `
    You are a helpful study assistant.
    Create ${count} study flashcards based strictly on the provided text.
    
    Output ONLY a raw JSON array of objects. No markdown, no intro.
    Format: [{"front": "Question/Term", "back": "Answer/Definition"}]
    
    [TEXT START]
    ${context.slice(0, 8000)}
    [TEXT END]
    `;

    try {
        const response = await webLLM.chat([
            { role: "user", content: prompt }
        ], (chunk) => {
            // Optional: Handle streaming updates if needed
        });

        console.log("WebLLM Response:", response);

        const cleaned = repairTruncatedJSON(response);
        console.log("Repaired JSON:", cleaned);

        const cards = JSON.parse(cleaned);

        // Validate structure
        if (Array.isArray(cards)) {
            return cards.map(c => ({
                front: String(c.front || "Error"),
                back: String(c.back || "Error")
            }));
        }
        return [];

    } catch (e) {
        console.error("Local Flashcard Gen Error", e);
        return [{ front: "Error generating cards", back: "Please try again. " + e }];
    }
}

export async function generateQuizLocal(topic: string, context: string, count: number = 5): Promise<QuizQuestion[]> {
    console.log("Starting Local WebLLM Quiz Generation...");

    // Ensure engine is ready
    if (!webLLM.isLoaded) {
        await webLLM.init();
    }

    const prompt = `
    Create ${count} multiple-choice questions about "${topic}".
    You must rely STRICTLY on the provided [CONTEXT] below. 
    Do not use outside knowledge. 
    If the context does not contain enough information to generate ${count} questions, generate as many as you can based ONLY on the context.

    Output ONLY a raw JSON array of objects. No markdown.
    Format: [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "A", "explanation": "..."}]
    
    [CONTEXT]
    ${context.slice(0, 8000)}
    `;

    try {
        const response = await webLLM.chat([
            { role: "user", content: prompt }
        ], () => { });

        console.log("WebLLM Response:", response);

        const cleaned = repairTruncatedJSON(response);
        console.log("Repaired JSON:", cleaned);

        const questions = JSON.parse(cleaned);

        if (Array.isArray(questions)) {
            return questions;
        }
        return [];

    } catch (e) {
        console.error("Local Quiz Gen Error", e);
        return [];
    }
}

export interface TimetableEntry {
    day: string;
    startTime: string;
    endTime: string;
    subject: string;
    room: string;
    type: 'Lecture' | 'Lab' | 'Tutorial' | 'Other';
}

// Helper to expand simplified schedule into full entries
function expandSchedule(simpleSchedule: any): TimetableEntry[] {
    const entries: TimetableEntry[] = [];

    // Handle both "Monday": [...] and Array of objects structures if LLM messes up
    // But we expect Record<string, [[time, subj], ...]>

    if (typeof simpleSchedule !== 'object' || simpleSchedule === null) return [];

    for (const [day, classes] of Object.entries(simpleSchedule)) {
        // Validate Day
        if (!['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(day)) {
            // Sometimes LLM puts "Days" or "Time" as a key, ignore those
            continue;
        }

        if (!Array.isArray(classes)) continue;

        classes.forEach((item: any) => {
            // Expected item: [string, string]
            if (!Array.isArray(item) || item.length < 2) return;

            const [start, subject] = item;

            // Filter out invalid entries
            if (!subject || typeof subject !== 'string' ||
                ['free', 'lunch', 'break', 'no class', '---'].some(x => subject.toLowerCase().includes(x))) {
                return;
            }

            // Normalize Start Time (HH:MM)
            let finalStart = String(start).trim();
            // Fix single digit hour format "9:00" -> "09:00"
            if (finalStart.length === 4 && finalStart.indexOf(':') === 1) {
                finalStart = "0" + finalStart;
            }
            // Basic validation
            if (!finalStart.match(/^\d{2}:\d{2}$/)) {
                // Try to rescue "9" -> "09:00" ? or "9.00" -> "09:00"
                finalStart = finalStart.replace('.', ':');
                if (finalStart.length === 4) finalStart = "0" + finalStart;
                if (!finalStart.includes(':')) finalStart += ":00";
                if (finalStart.length === 4) finalStart = "0" + finalStart;
            }

            // Logic to calculate end time (Start + 1 hour default)
            // If the subject looks like a Lab, maybe 2 hours?
            // Heuristic: Labs usually 2-3 hours.
            const isLab = subject.toLowerCase().includes('lab') || subject.toLowerCase().includes('practical');
            const durationHours = isLab ? 2 : 1;

            const parts = finalStart.split(':');
            let endH = parseInt(parts[0]) + durationHours;
            const endM = parts[1] || "00";

            // Handle day overflow? Unlikely for school timetable (e.g. 23:00 + 2 = 25:00)
            // Just clamp/format
            const end = `${endH.toString().padStart(2, '0')}:${endM}`;

            entries.push({
                day: day,
                startTime: finalStart,
                endTime: end,
                subject: subject.trim(),
                room: '301', // Default room, maybe update this later or ask LLM to extract room too
                type: isLab ? 'Lab' : 'Lecture'
            });
        });
    }
    return entries;
}

export async function generateTimetableLocal(ocrText: string, onProgress?: (msg: string) => void): Promise<TimetableEntry[]> {
    console.log("Starting Local WebLLM Timetable Parsing...");

    if (!webLLM.isLoaded) {
        await webLLM.init((report) => {
            if (onProgress) onProgress(report.text);
        });
    }

    if (onProgress) onProgress("Parsing schedule with AI...");

    // Prompt optimized for "Keyed" extraction to ensure alignment
    // We explicitly ask for [Time, Subject] pairs to avoid position-based errors.
    const prompt = `
    You are a JSON-only bot.
    Task: Extract class schedule from this OCR text.
    
    Output Format: JSON Object where keys are Days (Monday, Tuesday...) and values are arrays of [StartTime, Subject].
    
    Rules:
    1. Time must be "HH:MM" (24hr format). e.g. "09:00", "14:30".
    2. StartTime is the BEGINNING of the class.
    3. Ignore "Lunch", "Break", "Free", or empty slots.
    4. Subject name should be concise.
    5. Output VALID JSON only. No markdown.

    Example:
    {
      "Monday": [ ["09:00", "Math"], ["10:00", "Physics"], ["14:00", "Chemistry Lab"] ],
      "Tuesday": [ ["11:00", "Biology"] ]
    }

    [OCR START]
    ${ocrText.slice(0, 6000)}
    [OCR END]
    `;

    try {
        const response = await webLLM.chat([
            { role: "user", content: prompt }
        ], () => { });

        console.log("WebLLM Raw Response:", response);

        const cleaned = repairTruncatedJSON(response);
        console.log("Repaired JSON:", cleaned);

        try {
            const simpleSchedule = JSON.parse(cleaned);
            return expandSchedule(simpleSchedule);
        } catch (innerE) {
            console.error("JSON Parse Failed", innerE);

            // One last ditch attempt: Regex extraction if JSON fails completely
            // Regex to find "Monday" ... then times? Too complex to regex reliably across full text.
            return [];
        }

    } catch (e) {
        console.error("Local Timetable Gen Error", e);
        return [];
    }
}

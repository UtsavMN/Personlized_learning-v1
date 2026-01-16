export type EnvStatus = {
    google: boolean;
    huggingface: boolean;
};

export const validateEnv = (): EnvStatus => {
    // Check for keys. Note: Client-side usually only sees NEXT_PUBLIC_ keys,
    // so this is primarily for server-side or where process.env is polyfilled.
    const google = !!process.env.GOOGLE_GENAI_API_KEY;
    const huggingface = !!process.env.HUGGINGFACE_API_KEY;

    if (!google) {
        console.warn("[EnvCheck] Missing GOOGLE_GENAI_API_KEY. Flashcards/AI Tutor may not work.");
    }
    if (!huggingface) {
        console.warn("[EnvCheck] Missing HUGGINGFACE_API_KEY. OCR/Summarization will be disabled.");
    }

    return { google, huggingface };
};

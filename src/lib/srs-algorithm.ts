/**
 * Spaced Repetition System (SRS) Algorithm
 * Based on SM-2 (SuperMemo-2) with slight modifications.
 */

export interface ReviewResult {
    interval: number; // Days until next review
    repetition: number;
    easeFactor: number;
}

/**
 * Calculates the next schedule for a flashcard.
 * @param quality User rating (0-5)
 *      5 - perfect response
 *      4 - correct response after a hesitation
 *      3 - correct response recalled with serious difficulty
 *      2 - incorrect response; where the correct one seemed easy to recall
 *      1 - incorrect response; the correct one remembered
 *      0 - complete blackout.
 * @param previousState Current state of the card
 */
export function calculateNextReview(quality: number, previousState: ReviewResult): ReviewResult {
    let { interval, repetition, easeFactor } = previousState;

    if (quality >= 3) {
        // Correct response
        if (repetition === 0) {
            interval = 1;
        } else if (repetition === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * easeFactor);
        }
        repetition++;
    } else {
        // Incorrect response: Reset
        repetition = 0;
        interval = 1;
    }

    // Update Ease Factor
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // Enforce minimum EF
    if (easeFactor < 1.3) easeFactor = 1.3;

    return { interval, repetition, easeFactor };
}

export const INITIAL_CARD_STATE: ReviewResult = {
    interval: 0,
    repetition: 0,
    easeFactor: 2.5
};

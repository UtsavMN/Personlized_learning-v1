import { differenceInDays, isSameDay, subDays } from 'date-fns';

// Simplified types for intelligence logic
interface TaskEntry {
    completed: boolean | null;
    status?: string | null;
}

interface HobbyEntry {
    completedDates: Date[] | string[] | null;
}

export const TrackerIntelligence = {
    /**
     * Predicts the likelihood of completing tasks for a given day based on historical performance.
     * Returns a percentage (0-100).
     */
    predictDailyCompletionRate: (pastTasks: TaskEntry[]): number => {
        if (pastTasks.length === 0) return 85; // Optimistic default for new users

        const completed = pastTasks.filter(t => t.completed).length;
        const total = pastTasks.length;

        // Simple historical average
        const rate = (completed / total) * 100;

        // Weighted adjustment: Recent tasks matter more? (Keep simple for now)
        return Math.round(rate);
    },

    /**
     * Analyzes a hobby's consistency and predicts the "Follow-up Rate" (probability of continuing tomorrow).
     * Returns a percentage (0-100).
     */
    predictHobbyConsistency: (hobby: HobbyEntry): { score: number, label: string, streak: number } => {
        // Parse dates if they are strings from JSON
        const dates = (hobby.completedDates || []).map(d => typeof d === 'string' ? new Date(d) : d);
        if (dates.length === 0) {
            return { score: 50, label: "New Habit", streak: 0 };
        }

        // Sort dates descending
        const sortedDates = [...dates].sort((a, b) => b.getTime() - a.getTime());
        const lastDate = sortedDates[0];
        const today = new Date();

        // Calculate current streak
        let streak = 0;
        let checkDate = today;

        // normalization for "today" - if tracked today, streak starts today. If not, check yesterday.
        if (isSameDay(lastDate, today)) {
            streak = 1;
            checkDate = subDays(today, 1);
        } else if (isSameDay(lastDate, subDays(today, 1))) {
            // Last tracked yesterday
            streak = 0; // Will be incremented in loop
            checkDate = subDays(today, 1); // Start checking from yesterday
        } else {
            // Streak broken
            return { score: 40, label: "Getting Back", streak: 0 };
        }

        // Iterate backwards to count streak
        for (const date of sortedDates) {
            if (isSameDay(date, checkDate)) {
                streak++;
                checkDate = subDays(checkDate, 1);
            } else if (date > checkDate) {
                // Redundant check due to sort, but ensures we don't double count if multiple entries same day
                continue;
            } else {
                // Gap found
                break;
            }
        }

        // Calculate Consistency Score
        // Formula: Base 50 + (Streak * 5) + (Total completions * 1)
        let score = 50 + (streak * 10) + (sortedDates.length * 2);
        score = Math.min(99, Math.max(10, score)); // Clamp 10-99

        let label = "Consistent";
        if (score > 90) label = "Unstoppable 🔥";
        else if (score > 75) label = "Strong Flow 🌊";
        else if (score > 60) label = "Building Up 🧱";
        else label = "Needs Focus ⚠️";

        return { score, label, streak };
    },

    /**
     * Generates a motivational "AISight" based on overall performance.
     */
    generateInsight: (tasks: TaskEntry[], hobbies: HobbyEntry[]): string => {
        const pendingTasks = tasks.filter(t => !t.completed).length;
        const completedTasks = tasks.length - pendingTasks;

        if (pendingTasks > 5) return "Heavy load today. Prioritize the top 3 and move the rest.";
        if (completedTasks > 5 && pendingTasks === 0) return "Crushed it! Great productive flow today.";
        if (hobbies.length > 0 && hobbies.some(h => TrackerIntelligence.predictHobbyConsistency(h).streak > 3)) return "Your hobby streaks are looking great. Keep the momentum!";

        return "Stay consistent based on your schedule. Small steps win the race.";
    }
};

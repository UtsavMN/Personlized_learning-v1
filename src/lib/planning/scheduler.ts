import { db } from '../db';
import { SubjectMastery, TimetableEntry } from '../db';

export interface StudySessionRecommendation {
    subject: string;
    topicId: string;
    startTime: string; // HH:MM
    durationMinutes: number;
    reason: string; // e.g. "Low Mastery", "Review Due"
}

// Helper to convert time string to minutes from midnight
const timeToMins = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

// Helper to format minutes back to HH:MM
const minsToTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export async function generateStudyPlan(): Promise<StudySessionRecommendation[]> {
    const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    // 1. Get Today's Schedule (Fixed Commitments)
    const timetable = await db.timetable.where('day').equals(dayName).toArray();
    const sortedSchedule = timetable.sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));

    // 2. Get Mastery Data to prioritize
    const mastery = await db.subjectMastery.toArray();
    // Sort: Lowest mastery first, then overdue reviews
    const priorities = mastery.sort((a, b) => {
        // If one is very weak (<40), prioritize it
        if (a.masteryScore < 40 && b.masteryScore >= 40) return -1;
        if (b.masteryScore < 40 && a.masteryScore >= 40) return 1;

        // Otherwise check dates
        return (a.nextReviewDate?.getTime() || 0) - (b.nextReviewDate?.getTime() || 0);
    });

    const recommendations: StudySessionRecommendation[] = [];

    // 3. Find Free Slots (Simple Strategy: Look for evening blocks or gap > 1hr)
    // For MVP, let's assume "Evening Study" is 6PM - 9PM if free
    const studyStart = timeToMins("18:00");
    const studyEnd = timeToMins("21:00");

    // Filter timetable items that overlap with evening block
    const eveningConflicts = sortedSchedule.filter(t => {
        const tStart = timeToMins(t.startTime);
        const tEnd = timeToMins(t.endTime);
        return (tStart < studyEnd && tEnd > studyStart);
    });

    // If completely free evening
    if (eveningConflicts.length === 0) {
        // Recommend 2 sessions of 1 hour (Pomodoro style ish)
        if (priorities.length > 0) {
            recommendations.push({
                subject: priorities[0].subject,
                topicId: priorities[0].topicId,
                startTime: "18:00",
                durationMinutes: 45,
                reason: `Weakness (${priorities[0].masteryScore}%)`
            });
        }

        if (priorities.length > 1) {
            recommendations.push({
                subject: priorities[1].subject,
                topicId: priorities[1].topicId,
                startTime: "19:00",
                durationMinutes: 45,
                reason: "Review Due"
            });
        }
    } else {
        // Complex logic needed for partial gaps? 
        // For MVP, just suggest 1 short session after the last commitment
        const lastCommitment = eveningConflicts[eveningConflicts.length - 1];
        const startMins = Math.max(studyStart, timeToMins(lastCommitment.endTime) + 30); // 30 min break

        if (startMins + 45 < studyEnd && priorities.length > 0) {
            recommendations.push({
                subject: priorities[0].subject,
                topicId: priorities[0].topicId,
                startTime: minsToTime(startMins),
                durationMinutes: 45,
                reason: `Criticall Weakness`
            });
        }
    }

    // Fallback if no mastery data
    if (recommendations.length === 0 && priorities.length === 0) {
        recommendations.push({
            subject: "Onboarding",
            topicId: "Setup your profile",
            startTime: "18:00",
            durationMinutes: 15,
            reason: "Add subjects to generate a study plan."
        });
    }

    return recommendations;
}

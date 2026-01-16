
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { toast } from "@/hooks/use-toast";

export interface LevelStats {
    totalXP: number;
    level: number;
    progress: number; // 0-100
    nextLevelXP: number;
    prevLevelXP: number;
}

export function useGamification() {

    // Reactive Stats
    const stats: LevelStats | undefined = useLiveQuery(async () => {
        const mastery = await db.subjectMastery.toArray();
        const totalXP = mastery.reduce((sum, item) => sum + (item.xp || 0), 0);

        // Simple Level Formula: Level = Floor(Sqrt(XP / 100)) + 1
        const level = Math.floor(Math.sqrt(totalXP / 100)) + 1;

        const nextLevelXP = Math.pow(level, 2) * 100;
        const prevLevelXP = Math.pow(level - 1, 2) * 100;

        const rawProgress = ((totalXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100;
        const progress = Math.min(100, Math.max(0, rawProgress));

        return { totalXP, level, progress, nextLevelXP, prevLevelXP };
    });

    // Action: Add XP
    const addXP = async (amount: number, subject: string, reason?: string) => {
        // Find mastery record for this subject, or create generic one
        // Ideally subject matches a 'subject' string in db.subjectMastery

        let mastery = await db.subjectMastery.where('subject').equals(subject).first();

        // If not found, create a "General" or specific mastery track
        if (!mastery) {
            const id = await db.subjectMastery.add({
                topicId: subject.toLowerCase().replace(/\s+/g, '-'),
                subject: subject,
                masteryScore: 0,
                confidenceScore: 0,
                level: 1,
                xp: 0,
                lastRevised: new Date(),
                nextReviewDate: new Date()
            });
            mastery = await db.subjectMastery.get(id);
        }

        if (mastery && mastery.id) {
            const currentXP = mastery.xp || 0;
            const newXP = currentXP + amount;

            await db.subjectMastery.update(mastery.id, { xp: newXP });

            // Check for level up (global calculation, but toast notification here)
            // We use the hook's stats for global level, but we can approximate:
            // This notification is best done if we know we crossed a threshold.

            toast({
                title: `+${amount} XP`,
                description: reason || `Gained for ${subject}`,
                className: "bg-yellow-500/10 border-yellow-500/50 text-yellow-600 dark:text-yellow-400 font-bold"
            });
        }
    };

    return {
        stats,
        addXP
    };
}

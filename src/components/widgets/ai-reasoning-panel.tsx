'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrainCircuit, Lightbulb, TrendingUp, Clock, Target, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export function AIReasoningPanel() {
    const profile = useLiveQuery(() => db.learnerProfile.orderBy('id').last());
    const tasks = useLiveQuery(() => db.tasks.toArray());
    const [insight, setInsight] = useState<{ title: string; desc: string; icon: any; color: string } | null>(null);

    useEffect(() => {
        if (!profile) return;

        // 1. Exam Prep Detection (Keyword Search)
        const hasExam = tasks?.some(t => !t.completed && (t.title.toLowerCase().includes('exam') || t.title.toLowerCase().includes('test')));
        if (hasExam) {
            setInsight({
                title: "Exam Preparation Mode",
                desc: "Mentora detected upcoming exams. The scheduler has prioritized review sessions over new material to maximize retention.",
                icon: Target,
                color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400"
            });
            return;
        }

        // 2. Check Engagement (Streak)
        if ((profile.metrics?.streak || 0) > 3) {
            setInsight({
                title: "Consistency Bonus Active",
                desc: "Your 3+ day streak indicates high engagement. Mentora has slightly increased the difficulty of your recommended questions to challenge you.",
                icon: TrendingUp,
                color: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400"
            });
            return;
        }

        // 3. Circadian Rhythm (Time Based)
        const hour = new Date().getHours();
        if (hour > 23 || hour < 5) {
            setInsight({
                title: "Late Night Strategy",
                desc: "Circadian rhythm analysis suggests lower retention rates now. Mentora recommends shorter, review-based tasks instead of complex new topics.",
                icon: Clock,
                color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400"
            });
            return;
        }

        // 4. Goal Alignment
        if (profile.goals && profile.goals.length > 0) {
            setInsight({
                title: "Goal Alignment Strategy",
                desc: `Your focus on "${profile.goals[0]}" is prioritizing related document ingestion in the RAG pipeline.`,
                icon: BrainCircuit,
                color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
            });
            return;
        }

        // Default
        setInsight({
            title: "Adaptive Learning Engine",
            desc: "Mentora is currently analyzing your interaction patterns to personalize the difficulty curve. Continue using the Tracker to improve accuracy.",
            icon: Lightbulb,
            color: "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400"
        });

    }, [profile, tasks]);

    if (!insight) return null;

    return (
        <Card className="border-l-4 border-l-blue-500 shadow-sm bg-gradient-to-r from-card to-blue-50/30 dark:to-blue-900/10 mb-6 overflow-hidden">
            <CardHeader className="pb-2 pt-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-widest text-blue-500">Mentora Insight</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex gap-4 items-start">
                    <div className={`p-2.5 rounded-xl shadow-sm mt-1 shrink-0 ${insight.color}`}>
                        <insight.icon className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-base text-foreground mb-1">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {insight.desc}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

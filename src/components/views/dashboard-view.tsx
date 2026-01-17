'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLocalAuth } from "@/lib/auth-context";
import { Brain, Flame, Clock, BookOpen, ArrowUpRight, Target, Loader2, Cpu, CheckCircle2, ShieldCheck } from "lucide-react";
import { OnboardingWizard } from '@/components/onboarding-wizard';
import { Button } from '@/components/ui/button';
import { AIRecommendationsWidget } from '../widgets/ai-recommendations';
import { AIReasoningPanel } from '../widgets/ai-reasoning-panel';
import { toast } from '@/hooks/use-toast';
import { StatsCard, ActionItem } from '@/components/dashboard-widgets';
import { getProfileAction, getMasteryAction } from '@/app/actions/user';
import { Progress } from "@/components/ui/progress";

export function DashboardView() {
    const { user } = useLocalAuth();
    const [profile, setProfile] = useState<any>(null);
    const [masteryItems, setMasteryItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshData = async () => {
        if (!user) return;
        const pRes = await getProfileAction(user.uid);
        if (pRes.success) setProfile(pRes.profile);

        const mRes = await getMasteryAction();
        if (mRes.success) setMasteryItems(mRes.mastery);

        setLoading(false);
    };

    useEffect(() => {
        refreshData();
    }, [user]);

    const totalXp = masteryItems?.reduce((sum, item) => sum + (item.xp || 0), 0) || (profile?.totalXp || 0);

    if (loading) return <div className="p-8 flex items-center justify-center animate-pulse">Loading Analytics...</div>;

    if (!profile) return (
        <div className="h-full flex flex-col items-center justify-center p-4">
            <OnboardingWizard onComplete={refreshData} />
        </div>
    );

    return (
        <div className="space-y-6 p-2">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white shadow-xl">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 opacity-90">
                        <Brain className="w-5 h-5" />
                        <span className="text-sm font-medium tracking-wide uppercase">Student Dashboard</span>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-4">
                        Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'},
                        <span className="ml-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">
                            {user?.displayName?.split(' ')[0] || profile.name.split(' ')[0]}
                        </span>
                    </h1>

                    <div className="flex flex-wrap gap-4 mt-6">
                        <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20">
                            <p className="text-xs text-blue-100 uppercase tracking-widest font-semibold">Weekly Goal</p>
                            <p className="text-2xl font-bold">{profile.availableHoursPerWeek} hrs</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20">
                            <p className="text-xs text-blue-100 uppercase tracking-widest font-semibold">Streak</p>
                            <div className="flex items-center gap-2">
                                <Flame className="w-5 h-5 text-orange-400 fill-orange-400" />
                                <p className="text-2xl font-bold">{profile.streak || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative background effects */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2" />
            </div>

            {/* AI Reasoning Layer (Goal 2) */}
            <AIReasoningPanel />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard
                    title="Total XP"
                    value={totalXp}
                    icon={Brain}
                    color="text-purple-500 bg-purple-100 dark:bg-purple-900/30"
                    trend="Lifetime gained"
                />
                <StatsCard
                    title="Focus Time"
                    value={Math.round(totalXp / 10) + "m"} // Simplified mock
                    icon={Clock}
                    color="text-blue-500 bg-blue-100 dark:bg-blue-900/30"
                    trend="This Week"
                />
                <StatsCard
                    title="Topics Mastered"
                    value={masteryItems?.filter(i => i.masteryScore > 80).length || 0}
                    icon={Target}
                    color="text-green-500 bg-green-100 dark:bg-green-900/30"
                    trend="Score > 80%"
                />
                <StatsCard
                    title="Active Subjects"
                    value={masteryItems?.length || 0}
                    icon={BookOpen}
                    color="text-pink-500 bg-pink-100 dark:bg-pink-900/30"
                    trend="Currently tracking"
                />
            </div>

            {/* Knowledge Graph / Mastery List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 shadow-sm border-muted/60">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary" />
                            Mastery Tracker
                        </CardTitle>
                        <CardDescription>Your confidence level per subject</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {masteryItems?.slice(0, 5).map(item => (
                                <div key={item.id} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-medium leading-none">{item.topicId}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{item.subject}</p>
                                        </div>
                                        <span className="text-sm font-bold">{item.masteryScore}%</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-1000 ease-out"
                                            style={{ width: `${item.masteryScore}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {(!masteryItems || masteryItems.length === 0) && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No data yet. Go to 'Quiz' to start a Knowledge Assessment!
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="h-full">
                    <AIRecommendationsWidget />
                </div>
            </div>

            {/* Offline Model Widget - Refactored for Ollama */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                    <OllamaStatusWidget />
                </div>
            </div>

            <div className="grid grid-cols-1">
                <StudyPlanWidget />
            </div>
        </div>
    );
}

function OllamaStatusWidget() {
    return (
        <Card className="h-full border-muted/60 shadow-md bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                    <ShieldCheck className="w-5 h-5 text-green-400" />
                    Strict Local AI
                </CardTitle>
                <CardDescription className="text-slate-300">
                    Ollama Powered (Llama 3)
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col items-center justify-center py-6 text-green-400 space-y-2">
                    <div className="p-4 bg-green-500/10 rounded-full">
                        <Cpu className="w-10 h-10" />
                    </div>
                    <p className="font-semibold text-white">System Active</p>
                    <p className="text-xs text-slate-400 text-center px-4">
                        Your AI is running entirely on this machine. No data leaves your project folder.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

function StudyPlanWidget() {
    const [plan, setPlan] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const generate = async () => {
        setLoading(true);
        try {
            const { generateStudyPlan } = await import('@/lib/planning/scheduler');
            const newPlan = await generateStudyPlan();
            setPlan(newPlan);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-muted/60 shadow-md bg-gradient-to-r from-background to-muted/20">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-500" />
                            Today's Study Plan
                        </CardTitle>
                        <CardDescription>AI-generated schedule based on your gaps.</CardDescription>
                    </div>
                    <Button onClick={generate} disabled={loading} variant="outline" size="sm">
                        {loading ? 'Generating...' : 'Generate Plan'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {plan.length === 0 && !loading && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                        Click generic plan to organize your evening studying.
                    </div>
                )}
                <div className="space-y-3">
                    {plan.map((item, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                            <div className="min-w-[80px] text-center sm:text-left">
                                <div className="font-bold text-lg">{item.startTime}</div>
                                <div className="text-xs text-muted-foreground">{item.durationMinutes} mins</div>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-primary">{item.subject} - {item.topicId}</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Reason: <span className="font-medium text-foreground">{item.reason}</span>
                                </p>
                            </div>
                            <div className="flex items-center">
                                <Button size="sm" variant="secondary">Start</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}




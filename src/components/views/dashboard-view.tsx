
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLocalAuth } from "@/lib/auth-context";
import { db, LearnerProfile, SubjectMastery } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { Brain, Flame, Clock, BookOpen, ArrowUpRight, Target } from "lucide-react";
import { OnboardingWizard } from '@/components/onboarding-wizard';
import { Button } from '@/components/ui/button';

export function DashboardView() {
    const { user } = useLocalAuth();
    const profile = useLiveQuery(
        async () => {
            if (!user) return null;
            return await db.learnerProfile.where('userId').equals(user.uid).first()
                || await db.learnerProfile.toCollection().first();
        },
        [user]
    );

    const masteryItems = useLiveQuery(() => db.subjectMastery.toArray());
    if (profile === undefined) return <div className="p-8 flex items-center justify-center animate-pulse">Loading Profile...</div>;
    if (profile === null) return (
        <div className="h-full flex flex-col items-center justify-center p-4">
            <OnboardingWizard />
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 p-2">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-primary/60 p-8 text-primary-foreground shadow-lg">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">
                        Welcome back, {user?.displayName?.split(' ')[0] || profile.name.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-primary-foreground/90 max-w-xl">
                        You have <span className="font-bold bg-white/20 px-2 py-0.5 rounded text-white">{profile.availableHoursPerWeek} hours</span> available this week.
                        {masteryItems && masteryItems.length > 0 ? (
                            <span> Keep consistent to maintain your streak!</span>
                        ) : (
                            <span> Complete your onboarding to get personalized recs.</span>
                        )}
                    </p>
                </div>
                {/* Decorative background circle */}
                <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard
                    title="Daily Streak"
                    value={`${profile.metrics.streak} Days`}
                    icon={Flame}
                    color="text-orange-500"
                    trend="Keep it up!"
                />
                <StatsCard
                    title="Total XP"
                    value={profile.stats?.totalXp || 0}
                    icon={Brain}
                    color="text-purple-500"
                    trend="Lifetime gained"
                />
                <StatsCard
                    title="Topics Mastered"
                    value={masteryItems?.filter(i => i.masteryScore > 80).length || 0}
                    icon={Target}
                    color="text-green-500"
                    trend="Score > 80%"
                />
                <StatsCard
                    title="Active Subjects"
                    value={masteryItems?.length || 0}
                    icon={BookOpen}
                    color="text-blue-500"
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
                                    No data yet. Go to 'The Gym' to start practicing!
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-muted/60">
                    <CardHeader>
                        <CardTitle>Recommended Actions</CardTitle>
                        <CardDescription>Based on your recent activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {masteryItems && masteryItems.length > 0 ? (
                                masteryItems
                                    .filter(m => m.masteryScore < 50)
                                    .slice(0, 2)
                                    .map(m => (
                                        <ActionItem
                                            key={m.id}
                                            title={`Review ${m.topicId}`}
                                            desc={`Score is ${m.masteryScore}%. Time to practice!`}
                                            type="urgent"
                                        />
                                    ))
                            ) : (
                                <ActionItem
                                    title="Complete Onboarding"
                                    desc="Add subjects to get recommendations."
                                    type="normal"
                                />
                            )}

                            {masteryItems && masteryItems.length > 0 && masteryItems.every(m => m.masteryScore >= 50) && (
                                <ActionItem
                                    title="Maintain Streak"
                                    desc="You're doing great! Keep reviewing."
                                    type="normal"
                                />
                            )}

                            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 flex flex-col gap-2 items-center text-center mt-4">
                                <h4 className="font-semibold text-sm text-primary">Ready for a workout?</h4>
                                <p className="text-xs text-muted-foreground">Take a quick 5-min quiz.</p>
                                <Button size="sm" className="w-full mt-1">Start Quiz</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1">
                <StudyPlanWidget />
            </div>
        </div>
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

function StatsCard({ title, value, icon: Icon, color, trend }: any) {
    return (
        <Card className="shadow-sm border-muted/60 hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                    {trend.includes('+') ? <ArrowUpRight className="w-3 h-3 mr-1 text-green-500" /> : null}
                    {trend}
                </p>
            </CardContent>
        </Card>
    );
}

function ActionItem({ title, desc, type }: any) {
    return (
        <div className={`p-3 border rounded-lg transition-colors ${type === 'urgent' ? 'bg-red-500/5 border-red-200 dark:border-red-900/30' : 'bg-muted/30 hover:bg-muted/50'}`}>
            <div className="flex justify-between items-start">
                <h4 className="font-medium text-sm">{title}</h4>
                {type === 'urgent' && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{desc}</p>
        </div>
    )
}

'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Brain, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { studyManager } from "@/lib/ai/study-manager";
import { useRouter } from 'next/navigation';
import { FeedbackButtons } from './feedback-buttons';

export function AIRecommendationsWidget() {
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadRecs();
    }, []);

    const loadRecs = async () => {
        setLoading(true);
        try {
            const recs = await studyManager.getRecommendations();
            setRecommendations(recs);
        } catch (e) {
            console.error("Failed to load recs", e);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (route: string) => {
        // In a real app we might pass specific context ID via query params
        router.push(route);
    };

    if (loading) {
        return (
            <Card className="border-muted/60 shadow-sm h-full">
                <CardContent className="flex items-center justify-center h-full py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="text-sm">Consulting AI Agent...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (recommendations.length === 0) {
        return (
            <Card className="border-muted/60 shadow-sm h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-muted p-4 rounded-full mb-4">
                    <Sparkles className="w-6 h-6 text-yellow-500" />
                </div>
                <h3 className="font-semibold">All Caught Up!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    No urgent actions. You're free to explore the library or take a break.
                </p>
                <Button variant="outline" className="mt-4" onClick={() => router.push('/gym')}>
                    Go to Gym
                </Button>
            </Card>
        );
    }

    // Top recommendation is favored
    const topRec = recommendations[0];
    const otherRecs = recommendations.slice(1);

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Top Recommendation (Hero) */}
            <Card className="border-primary/20 shadow-md bg-white/5 backdrop-blur-sm flex-grow-0 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-blue-500" />
                <CardHeader className="pb-2 pl-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <Badge variant={topRec.priority === 'high' ? 'destructive' : 'secondary'} className="mb-2 uppercase tracking-wider text-[10px]">
                                {topRec.priority === 'high' ? 'Critical' : 'Suggested'}
                            </Badge>
                            <CardTitle className="text-xl flex items-center gap-2">
                                {topRec.priority === 'high' ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <Brain className="w-5 h-5 text-primary" />}
                                {topRec.title}
                            </CardTitle>
                            <CardDescription className="mt-1">{topRec.description}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pl-6">
                    <div className="flex items-center justify-between mt-2 p-3 bg-muted/40 rounded-lg border border-white/10">
                        <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-yellow-500" />
                            Reason: {topRec.reason}
                        </div>
                        <Button onClick={() => handleAction(topRec.route)} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 transition-opacity border-0">
                            {topRec.actionLabel}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* AI Feedback Loop (Goal 4) */}
            <div className="flex items-center justify-between px-2 py-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold opacity-70">
                    Reinforcement Signal
                </span>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Was this helpful?</span>
                    <FeedbackButtons recId={topRec.id} />
                </div>
            </div>

            {/* Secondary List */}
            {otherRecs.length > 0 && (
                <div className="space-y-3 flex-grow">
                    <h4 className="text-sm font-semibold text-muted-foreground pl-1">Other Suggestions</h4>
                    {otherRecs.map((rec) => (
                        <div key={rec.id} className="group flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleAction(rec.route)}>
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${rec.priority === 'high' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                <div>
                                    <div className="font-medium text-sm">{rec.title}</div>
                                    <div className="text-xs text-muted-foreground">{rec.subject} • {rec.type}</div>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

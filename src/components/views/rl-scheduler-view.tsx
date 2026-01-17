'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RLScheduler, rlScheduler, SchedulerState, SchedulerAction } from '@/lib/ai/rl-scheduler';
import { BrainCircuit, ThumbsUp, ThumbsDown, Zap, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { getMasteryAction } from '@/app/actions/user';

export function RLSchedulerView() {
    const { toast } = useToast();
    const [step, setStep] = useState<'context' | 'thinking' | 'result'>('context');
    const [state, setState] = useState<SchedulerState>({
        dayOfWeek: new Date().getDay(),
        energyLevel: 2, // Medium
        previousSubject: 'None'
    });

    const [suggestedAction, setSuggestedAction] = useState<SchedulerAction | null>(null);

    const [subjects, setSubjects] = useState<string[]>([]);
    const [subjectsLoading, setSubjectsLoading] = useState(true);

    useEffect(() => {
        const fetchSubjects = async () => {
            const res = await getMasteryAction();
            if (res.success && res.mastery) {
                setSubjects(res.mastery.map((s: any) => s.subject));
            }
            setSubjectsLoading(false);
        };
        fetchSubjects();
    }, []);

    const handleSuggest = () => {
        if (subjects.length === 0) {
            toast({
                title: "No Subjects Found",
                description: "Please add subjects in 'The Gym' or 'Documents' first.",
                variant: "destructive"
            });
            return;
        }

        setStep('thinking');
        setTimeout(async () => {
            const action = await rlScheduler.suggestAction(state, subjects);
            setSuggestedAction(action);
            setStep('result');
        }, 800);
    };

    const handleFeedback = (positive: boolean) => {
        if (!suggestedAction) return;
        const reward = positive ? 10 : -5;
        const nextState: SchedulerState = {
            ...state,
            previousSubject: positive && suggestedAction !== 'Break' ? suggestedAction : state.previousSubject,
            energyLevel: Math.max(1, state.energyLevel - (suggestedAction === 'Break' ? -1 : 1))
        };
        rlScheduler.learn(state, suggestedAction, reward, nextState);
        toast({
            title: positive ? "Great choice!" : "Noted.",
            description: positive ? "Agent learned this was helpful." : "Agent will adjust strategy.",
            variant: positive ? "default" : "secondary"
        });
        setSuggestedAction(null);
        setState(nextState);
        setStep('context');
    };

    return (
        <div className="h-full flex flex-col justify-center animate-in fade-in duration-500">
            {step === 'context' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Energy</label>
                            <div className="flex gap-2">
                                {[1, 2, 3].map((level) => (
                                    <Button
                                        key={level}
                                        variant={state.energyLevel === level ? "default" : "outline"}
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => setState({ ...state, energyLevel: level })}
                                    >
                                        {level === 1 && <span className="text-lg mr-1">😫</span>}
                                        {level === 2 && <span className="text-lg mr-1">😐</span>}
                                        {level === 3 && <span className="text-lg mr-1">⚡</span>}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Subject</label>
                            <Select
                                value={state.previousSubject}
                                onValueChange={v => setState({ ...state, previousSubject: v })}
                            >
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="None">None (Start)</SelectItem>
                                    {subjects.map(subject => (
                                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                                    ))}
                                    <SelectItem value="Break">Break</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button
                            onClick={handleSuggest}
                            disabled={subjects.length === 0}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md transition-all hover:scale-[1.02]"
                        >
                            <BrainCircuit className="w-4 h-4 mr-2" />
                            {subjects.length === 0 ? "Add Subjects First" : "Generate Plan"}
                        </Button>
                    </div>

                    <div className="text-[10px] text-center text-muted-foreground">
                        Agent uses Q-Learning (ε-Greedy) to optimize your schedule.
                    </div>
                </div>
            )}

            {step === 'thinking' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in fade-in">
                    <div className="relative">
                        <div className="h-12 w-12 rounded-full border-4 border-muted border-t-primary animate-spin" />
                        <BrainCircuit className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground animate-pulse">Analyzing optimal path...</p>
                </div>
            )}

            {step === 'result' && suggestedAction && (
                <div className="text-center space-y-6 animate-in zoom-in-95 duration-300 py-2">
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold">Recommended Focus</p>
                        <div className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 filter drop-shadow-sm">
                            {suggestedAction}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                        <Button
                            variant="outline"
                            className="border-green-500/20 hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/50 transition-all font-medium"
                            onClick={() => handleFeedback(true)}
                        >
                            <ThumbsUp className="w-4 h-4 mr-2" /> Accept
                        </Button>
                        <Button
                            variant="outline"
                            className="border-red-500/20 hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/50 transition-all font-medium"
                            onClick={() => handleFeedback(false)}
                        >
                            <ThumbsDown className="w-4 h-4 mr-2" /> Reject
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

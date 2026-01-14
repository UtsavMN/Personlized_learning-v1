'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RLScheduler, rlScheduler, SchedulerState, SchedulerAction } from '@/lib/ai/rl-scheduler';
import { BrainCircuit, ThumbsUp, ThumbsDown, Zap, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function RLSchedulerView() {
    const { toast } = useToast();
    const [state, setState] = useState<SchedulerState>({
        dayOfWeek: new Date().getDay(),
        energyLevel: 2, // Medium
        previousSubject: 'None'
    });

    const [suggestedAction, setSuggestedAction] = useState<SchedulerAction | null>(null);
    const [isThinking, setIsThinking] = useState(false);

    const handleSuggest = () => {
        setIsThinking(true);
        // Simulate "Thinking" delay
        setTimeout(() => {
            const action = rlScheduler.suggestAction(state);
            setSuggestedAction(action);
            setIsThinking(false);
        }, 500);
    };

    const handleFeedback = (positive: boolean) => {
        if (!suggestedAction) return;

        // Reward Function
        // +10 for good suggestion, -5 for bad
        const reward = positive ? 10 : -5;

        // Next State (Simulation)
        // If they study 'Math', next previousSubject becomes 'Math', energy might drop
        const nextState: SchedulerState = {
            ...state,
            previousSubject: positive && suggestedAction !== 'Break' ? suggestedAction : state.previousSubject,
            energyLevel: Math.max(1, state.energyLevel - (suggestedAction === 'Break' ? -1 : 1))
        };

        rlScheduler.learn(state, suggestedAction, reward, nextState);

        toast({
            title: positive ? "Reinforced!" : "Corrected!",
            description: `Agent received reward: ${reward}. Q-Values updated.`,
            variant: positive ? "default" : "destructive"
        });

        // Reset for next step
        setSuggestedAction(null);
        setState(nextState);
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/20 text-orange-600">
                    <BrainCircuit className="w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">RL Scheduler Agent</h2>
                    <p className="text-muted-foreground">Q-Learning agent that optimizes your study plan.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* State Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle>Current Context (State)</CardTitle>
                        <CardDescription>Define the environment for the agent.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2"><Calendar className="w-4 h-4" /> Day of Week</label>
                            <Select
                                value={state.dayOfWeek.toString()}
                                onValueChange={v => setState({ ...state, dayOfWeek: parseInt(v) })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Monday</SelectItem>
                                    <SelectItem value="2">Tuesday</SelectItem>
                                    <SelectItem value="3">Wednesday</SelectItem>
                                    <SelectItem value="4">Thursday</SelectItem>
                                    <SelectItem value="5">Friday</SelectItem>
                                    <SelectItem value="6">Saturday</SelectItem>
                                    <SelectItem value="0">Sunday</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2"><Zap className="w-4 h-4" /> Energy Level</label>
                            <Select
                                value={state.energyLevel.toString()}
                                onValueChange={v => setState({ ...state, energyLevel: parseInt(v) })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="3">High (Fresh)</SelectItem>
                                    <SelectItem value="2">Medium (Okay)</SelectItem>
                                    <SelectItem value="1">Low (Tired)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Previous Subject</label>
                            <Select
                                value={state.previousSubject}
                                onValueChange={v => setState({ ...state, previousSubject: v })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="None">None (Start of Day)</SelectItem>
                                    <SelectItem value="Math">Math</SelectItem>
                                    <SelectItem value="Physics">Physics</SelectItem>
                                    <SelectItem value="Chemistry">Chemistry</SelectItem>
                                    <SelectItem value="Break">Break</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button onClick={handleSuggest} className="w-full mt-4" disabled={!!suggestedAction}>
                            {isThinking ? "Agent is thinking..." : "Ask Agent"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Agent Action area */}
                <Card className={`border-2 transition-colors duration-500 ${suggestedAction ? 'border-primary' : 'border-transparent'}`}>
                    <CardHeader>
                        <CardTitle>Agent Suggestion (Action)</CardTitle>
                        <CardDescription>Based on learned Q-Values.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center min-h-[200px] text-center space-y-4">
                        {suggestedAction ? (
                            <div className="animate-in zoom-in spin-in-3 duration-300">
                                <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 mb-2">
                                    {suggestedAction}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Why? The agent expects the highest future reward for this action given the current state.
                                </p>
                            </div>
                        ) : (
                            <div className="text-muted-foreground opacity-50">
                                <BrainCircuit className="w-16 h-16 mx-auto mb-2" />
                                <p>Waiting for context...</p>
                            </div>
                        )}
                    </CardContent>

                    {suggestedAction && (
                        <CardFooter className="flex gap-4 justify-center bg-muted/30 p-6">
                            <Button
                                variant="outline"
                                className="border-green-200 hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900/30"
                                onClick={() => handleFeedback(true)}
                            >
                                <ThumbsUp className="w-4 h-4 mr-2" /> Good Choice
                            </Button>
                            <Button
                                variant="outline"
                                className="border-red-200 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30"
                                onClick={() => handleFeedback(false)}
                            >
                                <ThumbsDown className="w-4 h-4 mr-2" /> Bad Choice
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg text-xs text-muted-foreground font-mono">
                Observation: The agent is "Greedy" (Uses Epsilon-Greedy). 30% of the time it explores random actions to find better strategies.
            </div>
        </div>
    );
}

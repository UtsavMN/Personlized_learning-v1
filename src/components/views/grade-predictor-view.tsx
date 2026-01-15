'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { gradePredictor } from '@/lib/ai/grade-predictor';
import { Brain, TrendingUp, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function GradePredictorView() {
    const { toast } = useToast();
    const [prediction, setPrediction] = useState<number | null>(null);
    const [isTraining, setIsTraining] = useState(false);

    // Mock Inputs for MVP (In real app, fetch from db.analytics)
    const [inputs, setInputs] = useState({
        avgQuizScore: 0,
        studyHours: 0,
        completedTasks: 0,
        difficulty: 0.5
    });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const stats = await gradePredictor.getCurrentStats();
            setInputs(stats.raw);
        } catch (e) {
            console.error("Failed to load stats", e);
        }
    };

    const handleTrain = async () => {
        setIsTraining(true);
        try {
            toast({ title: "Training Neural Network...", description: "Learning from your history." });

            // Fetch Real Training Data
            const trainingData = await gradePredictor.gatherTrainingData();

            await gradePredictor.train(trainingData);
            await gradePredictor.save();

            toast({ title: "Training Complete!", description: `Trained on ${trainingData.labels.length} historical sessions.` });
        } catch (e) {
            console.error(e);
            toast({ variant: "destructive", title: "Training Failed" });
        } finally {
            setIsTraining(false);
        }
    };

    const handlePredict = async () => {
        try {
            // Re-fetch latest stats just in case
            const current = await gradePredictor.getCurrentStats();
            setInputs(current.raw);

            const result = gradePredictor.predict(current.inputs);
            setPrediction(result * 100);
        } catch (e) {
            toast({ title: "Prediction Failed", description: "Ensure model is trained.", variant: "destructive" });
        }
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/20 text-purple-600">
                    <Brain className="w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">AI Grade Predictor</h2>
                    <p className="text-muted-foreground">TensorFlow.js Neural Network running in your browser.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Model Training</CardTitle>
                        <CardDescription>Teach the AI using your historical data.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                            <p>Current Architecture:</p>
                            <ul className="list-disc ml-5 mt-2">
                                <li>Input Layer (4 Features)</li>
                                <li>Hidden Layer (4 Neurons, ReLU)</li>
                                <li>Output Layer (Linear Regression)</li>
                            </ul>
                        </div>
                        <Button onClick={handleTrain} disabled={isTraining} className="w-full">
                            {isTraining ? "Training..." : "Train Model"}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Live Prediction</CardTitle>
                        <CardDescription>What's your estimated exam score?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {prediction !== null ? (
                            <div className="text-center py-6">
                                <div className="text-5xl font-bold text-primary mb-2">
                                    {prediction.toFixed(1)}%
                                </div>
                                <p className="text-sm text-muted-foreground">Predicted Score</p>
                                <Progress value={prediction} className="mt-4" />

                                {/* Data Flow Visualization */}
                                <div className="space-y-4 mt-8 relative">
                                    <div className="absolute left-1/2 -top-6 w-0.5 h-6 bg-gradient-to-b from-transparent to-primary/50" />

                                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                                        <span className="font-semibold flex items-center gap-1.5 text-primary">
                                            <TrendingUp className="w-4 h-4" /> Live Tracker Inputs
                                        </span>
                                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                                            Connected
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground relative z-10">
                                        {/* Input Nodes */}
                                        <div className="bg-card p-3 rounded-lg border shadow-sm flex flex-col items-center gap-1 group relative overflow-hidden">
                                            <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
                                            <div className="font-bold text-lg text-foreground">{inputs.studyHours.toFixed(1)}h</div>
                                            <div className="text-[10px] uppercase tracking-wide opacity-70">Study Time</div>
                                            {/* Connection Line */}
                                            <div className="absolute -bottom-8 left-1/2 w-0.5 h-8 bg-blue-200 dark:bg-blue-800" />
                                        </div>

                                        <div className="bg-card p-3 rounded-lg border shadow-sm flex flex-col items-center gap-1 group relative overflow-hidden">
                                            <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors" />
                                            <div className="font-bold text-lg text-foreground">{inputs.completedTasks}</div>
                                            <div className="text-[10px] uppercase tracking-wide opacity-70">Tasks</div>
                                            <div className="absolute -bottom-8 left-1/2 w-0.5 h-8 bg-purple-200 dark:bg-purple-800" />
                                        </div>

                                        <div className="bg-card p-3 rounded-lg border shadow-sm flex flex-col items-center gap-1 group relative overflow-hidden">
                                            <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors" />
                                            <div className="font-bold text-lg text-foreground">{inputs.avgQuizScore.toFixed(0)}%</div>
                                            <div className="text-[10px] uppercase tracking-wide opacity-70">Quiz Avg</div>
                                            <div className="absolute -bottom-8 left-1/2 w-0.5 h-8 bg-green-200 dark:bg-green-800" />
                                        </div>
                                    </div>

                                    {/* Neural Node Representation */}
                                    <div className="mt-8 mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20 relative z-20 animate-pulse">
                                        <Brain className="w-6 h-6 text-primary-foreground" />
                                    </div>

                                    <div className="text-[10px] text-center text-muted-foreground bg-muted/40 p-2 rounded-md mx-4 mt-2 border border-border/50">
                                        Neural Network processing <strong>historical learning patterns</strong> to forecast outcomes.
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">
                                <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                <p>Run prediction to see results</p>
                            </div>
                        )}
                        <Button onClick={handlePredict} variant="secondary" className="w-full">
                            Run Prediction
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

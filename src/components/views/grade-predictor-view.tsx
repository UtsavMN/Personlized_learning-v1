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
        avgQuizScore: 0.75, // 75%
        studyHours: 5,
        completedTasks: 12,
        difficulty: 0.5 // Medium
    });

    const handleTrain = async () => {
        setIsTraining(true);
        try {
            toast({ title: "Training Neural Network...", description: "Learning from your study habits." });

            // Mock Training Data (Simulating a pattern: More study + High scores = High Grade)
            const trainingData = {
                inputs: [
                    [0.9, 10, 20, 0.8], // Good student -> 95%
                    [0.4, 1, 2, 0.3],   // Low effort -> 40%
                    [0.6, 5, 10, 0.5],  // Average -> 65%
                    [0.8, 8, 15, 0.7],  // Good -> 85%
                    [0.2, 0, 0, 0.2]    // No effort -> 20%
                ],
                labels: [0.95, 0.40, 0.65, 0.85, 0.20]
            };

            await gradePredictor.train({ ...trainingData, inputs: trainingData.inputs as any });
            await gradePredictor.save();

            toast({ title: "Training Complete!", description: "Model updated and saved locally." });
        } catch (e) {
            console.error(e);
            toast({ variant: "destructive", title: "Training Failed" });
        } finally {
            setIsTraining(false);
        }
    };

    const handlePredict = async () => {
        try {
            const inputVector = [
                inputs.avgQuizScore,
                inputs.studyHours,
                inputs.completedTasks,
                inputs.difficulty
            ] as [number, number, number, number];

            const result = gradePredictor.predict(inputVector);
            setPrediction(result * 100);
        } catch (e) {
            toast({ title: "Model not trained yet", description: "Please train the model first.", variant: "destructive" });
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

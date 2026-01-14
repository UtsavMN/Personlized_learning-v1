'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, QuestionEntry } from '@/lib/db';
import { generateQuizAction } from '@/app/actions/quiz';
import { updateTopicMastery } from '@/lib/adaptation/engine';
import { trackEvent } from '@/lib/tracking/analytics';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, XCircle, Trophy, Dumbbell, Flame } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const quizConfigSchema = z.object({
    topic: z.string().min(1, 'Please select a topic'),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    questionCount: z.string().transform((val) => parseInt(val, 10)),
});

export function QuizView() {
    const { toast } = useToast();
    const [quizState, setQuizState] = useState<'config' | 'loading' | 'active' | 'review'>('config');
    const [activeQuestions, setActiveQuestions] = useState<QuestionEntry[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({}); // { questionId: selectedOption }
    const [score, setScore] = useState(0);

    // Data fetching
    const subjectMastery = useLiveQuery(() => db.subjectMastery.toArray());
    const timetable = useLiveQuery(() => db.timetable.toArray());

    // Combine topics from mastery and timetable
    const availableTopics = Array.from(new Set([
        ...(subjectMastery?.map(m => m.topicId) || []),
        ...(timetable?.map(t => t.subject) || [])
    ])).filter(Boolean).sort();

    const form = useForm<z.infer<typeof quizConfigSchema>>({
        resolver: zodResolver(quizConfigSchema),
        defaultValues: {
            difficulty: 'medium',
            questionCount: 5,
        },
    });

    const startQuiz = async (data: z.infer<typeof quizConfigSchema>) => {
        setQuizState('loading');
        try {
            // 1. Fetch relevant documents for RAG context
            const documents = await db.documents
                .filter(doc => doc.subject?.toLowerCase().trim() === data.topic.toLowerCase().trim() ||
                    doc.title.toLowerCase().includes(data.topic.toLowerCase()))
                .toArray();

            // STRICT GATING: No documents = No Quiz
            if (documents.length === 0) {
                setQuizState('config'); // Go back
                toast({
                    title: "Missing Study Materials",
                    description: `You have no documents for "${data.topic}". Please upload PDF notes first.`,
                    variant: "destructive"
                });
                return;
            }

            // Track Start
            trackEvent('quiz_start', { topicId: data.topic, data: { difficulty: data.difficulty } });

            // 2. Call Server Action
            const contextStrings = documents.map(d => `Title: ${d.title}\n\n${d.content || d.description}`);

            // Generate Quiz
            const result = await generateQuizAction(data.topic, data.difficulty, data.questionCount, contextStrings) as any;

            if (!result.questions || result.questions.length === 0) {
                throw new Error("No questions generated.");
            }

            // 3. Save to local DB (cache) with synthetic source
            const questionsToAdd = result.questions.map((q: any) => ({
                ...q,
                topicId: data.topic,
                difficulty: data.difficulty,
                source: 'synthetic' as const
            }));

            const ids = await Promise.all(questionsToAdd.map((q: any) => db.questions.add(q)));

            // 4. Retrieve fully formated questions to set active state
            const loadedQuestions = await db.questions.bulkGet(ids);
            setActiveQuestions(loadedQuestions.filter(q => q !== undefined) as QuestionEntry[]);

            setQuizState('active');
            setCurrentQuestionIndex(0);
            setAnswers({});
            setScore(0);

        } catch (error: any) {
            console.error("Quiz Error:", error);
            toast({
                variant: 'destructive',
                title: 'Workout Cancelled',
                description: 'Failed to prepare the gym session. Try again.',
            });
            setQuizState('config');
        }
    };

    const handleAnswer = (value: string) => {
        const currentQ = activeQuestions[currentQuestionIndex];
        if (!currentQ.id) return;

        setAnswers(prev => ({ ...prev, [currentQ.id!]: value }));
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < activeQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            finishQuiz();
        }
    };

    const finishQuiz = async () => {
        let calculatedScore = 0;
        activeQuestions.forEach(q => {
            if (q.id && answers[q.id] === q.correctAnswer) {
                calculatedScore++;
            }
        });

        const percentage = Math.round((calculatedScore / activeQuestions.length) * 100);
        setScore(calculatedScore); // Calculated score (raw count)
        setQuizState('review');

        // Save Result
        if (activeQuestions.length > 0) {
            const topic = activeQuestions[0].topicId;

            await db.quizResults.add({
                topic: topic,
                score: percentage,
                totalQuestions: activeQuestions.length,
                correctAnswers: calculatedScore,
                date: new Date(),
                questions: activeQuestions,
            });

            // --- Non-LLM Adaptation Logic ---
            try {
                // Update Mastery using new Engine
                const result = await updateTopicMastery(topic, percentage, activeQuestions.length);

                // Track Analytics
                trackEvent('quiz_complete', {
                    topicId: topic,
                    data: { score: percentage, levelChange: result.levelChange, newLevel: result.newLevel }
                });

                // User Feedback based on adaptation result
                if (result.levelChange > 0) {
                    toast({
                        title: "Level Up! 🌟",
                        description: result.message,
                        className: "bg-green-500 text-white"
                    });
                } else if (result.levelChange < 0) {
                    toast({
                        title: "Difficulty Adjusted",
                        description: result.message,
                    });
                } else {
                    toast({
                        description: result.message,
                    });
                }
            } catch (e) {
                console.error("Failed to update mastery:", e);
            }
        }
    };

    // --- Render Views ---

    if (quizState === 'config') {
        if (availableTopics.length === 0) {
            return (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-300">
                    <Card className="max-w-md w-full border-dashed border-2 shadow-sm bg-muted/30">
                        <CardHeader>
                            <div className="mx-auto bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
                                <Dumbbell className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <CardTitle>The Gym is Empty</CardTitle>
                            <CardDescription>
                                You haven't added any subjects yet.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                To start practicing, you need to set up your subjects in your profile or upload documents.
                            </p>
                            <Button variant="outline" onClick={() => window.location.reload()}>
                                Check Again
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )
        }

        return (
            <div className="h-full flex flex-col items-center justify-center p-4 animate-in zoom-in-95 duration-300">
                <Card className="w-full max-w-md shadow-xl border-primary/20">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                            <Dumbbell className="w-8 h-8 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-bold font-headline">The Gym</CardTitle>
                        <CardDescription>Train your brain. Build your streak.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(startQuiz)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="topic"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Workout Focus</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a topic..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {availableTopics.map(t => (
                                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="difficulty"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Intensity</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="easy">Warmup (Easy)</SelectItem>
                                                        <SelectItem value="medium">Sweat (Medium)</SelectItem>
                                                        <SelectItem value="hard">Max Effort (Hard)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="questionCount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Reps (Questions)</FormLabel>
                                                <Select onValueChange={(val) => field.onChange(val)} defaultValue={String(field.value)}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="3">3 Reps</SelectItem>
                                                        <SelectItem value="5">5 Reps</SelectItem>
                                                        <SelectItem value="10">10 Reps</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <Button type="submit" className="w-full text-lg h-12">
                                    Start Workout
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (quizState === 'loading') {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <h3 className="text-xl font-semibold animate-pulse">Preparing your personalized session...</h3>
                <p className="text-muted-foreground text-sm">Analyzing your documents and weak points.</p>
            </div>
        );
    }

    if (quizState === 'review') {
        const percentage = Math.round((score / activeQuestions.length) * 100);
        return (
            <div className="h-full flex items-center justify-center p-4 animate-in zoom-in-95 duration-500">
                <Card className="w-full max-w-2xl border-primary/20 shadow-2xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 bg-green-100 dark:bg-green-900/30 w-20 h-20 rounded-full flex items-center justify-center">
                            <Trophy className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <CardTitle className="text-3xl font-bold">Session Complete!</CardTitle>
                        <CardDescription className="text-lg">
                            You scored <span className="font-bold text-primary">{percentage}%</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4">
                            {activeQuestions.map((q, idx) => {
                                const userAnswer = answers[q.id!];
                                const isCorrect = userAnswer === q.correctAnswer;
                                return (
                                    <div key={q.id} className={`p-4 rounded-lg border ${isCorrect ? 'bg-green-500/5 border-green-200 dark:border-green-900' : 'bg-red-500/5 border-red-200 dark:border-red-900'}`}>
                                        <div className="flex items-start gap-3">
                                            {isCorrect ? <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-600 mt-0.5" />}
                                            <div className="space-y-1">
                                                <p className="font-medium text-sm">{idx + 1}. {q.question}</p>
                                                <p className="text-xs text-muted-foreground">Correct: {q.correctAnswer}</p>
                                                {!isCorrect && <p className="text-xs text-red-500">Your Answer: {userAnswer}</p>}
                                                {q.explanation && <p className="text-xs text-muted-foreground mt-2 italic bg-muted/50 p-2 rounded">Note: {q.explanation}</p>}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-center gap-4 pb-8">
                        <Button variant="outline" onClick={() => setQuizState('config')}>Back to Gym</Button>
                        <Button onClick={() => setQuizState('config')}>Start New Session</Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // Active Quiz View
    // Safety check
    if (!activeQuestions || activeQuestions.length === 0 || currentQuestionIndex >= activeQuestions.length) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <p>Something went wrong.</p>
                    <Button onClick={() => setQuizState('config')} className="mt-4">Return to Menu</Button>
                </div>
            </div>
        );
    }

    const currentQ = activeQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex) / activeQuestions.length) * 100;

    return (
        <div className="max-w-3xl mx-auto h-full flex flex-col py-6 px-4">
            {/* Quiz Header */}
            <div className="mb-8 space-y-2">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Question {currentQuestionIndex + 1} of {activeQuestions.length}</span>
                    <span className="flex items-center text-orange-500"><Flame className="w-4 h-4 mr-1" /> High Intensity</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            {/* Question Card */}
            <Card className="flex-1 flex flex-col shadow-lg border-muted/60">
                <CardHeader>
                    <CardTitle className="text-xl leading-relaxed">{currentQ.question}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                    <RadioGroup onValueChange={handleAnswer} value={answers[currentQ.id!] || ""}>
                        <div className="grid gap-3">
                            {currentQ.options.map((option, idx) => (
                                <div key={idx} className={`flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors ${answers[currentQ.id!] === option ? 'border-primary bg-primary/5' : ''}`}>
                                    <RadioGroupItem value={option} id={`opt-${idx}`} />
                                    <Label htmlFor={`opt-${idx}`} className="flex-1 cursor-pointer font-normal text-base">{option}</Label>
                                </div>
                            ))}
                        </div>
                    </RadioGroup>
                </CardContent>
                <CardFooter className="border-t bg-muted/10 p-6 flex justify-between items-center">
                    <Button variant="ghost" disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(prev => prev - 1)}>
                        Previous
                    </Button>
                    <Button onClick={nextQuestion} disabled={!answers[currentQ.id!]}>
                        {currentQuestionIndex === activeQuestions.length - 1 ? "Finish Workout" : "Next Rep"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

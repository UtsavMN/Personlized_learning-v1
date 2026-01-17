'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { getDocumentsAction } from '@/app/actions/documents';

import { Button } from '@/components/ui/button';
import { generateQuizLocal } from '@/lib/ai/local-flows';
import { webLLM } from '@/lib/ai/llm-engine';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, XCircle, Trophy, BrainCircuit, Target, ArrowRight, BookOpen } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const quizConfigSchema = z.object({
    documentId: z.string().min(1, 'Please select a document'),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    questionCount: z.string().transform((val) => parseInt(val, 10)),
});

interface QuestionEntry {
    id?: number;
    topicId?: string;
    subject?: string;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
}

export function QuizView() {
    const { toast } = useToast();
    const [quizState, setQuizState] = useState<'config' | 'loading' | 'active' | 'review'>('config');
    const [activeQuestions, setActiveQuestions] = useState<QuestionEntry[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({}); // { questionId: selectedOption }
    const [score, setScore] = useState(0);
    const [modelProgress, setModelProgress] = useState('');

    // Data fetching
    const [documents, setDocuments] = useState<any[]>([]);

    useEffect(() => {
        const fetchDocs = async () => {
            const res = await getDocumentsAction();
            if (res.success) {
                setDocuments(res.documents);
            }
        };
        fetchDocs();
    }, []);

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
            if (!data.documentId) {
                toast({ variant: "destructive", title: "Error", description: "Please select a document." });
                setQuizState('config');
                return;
            }

            toast({ title: "Consulting AI...", description: "Gemini is crafting your unique assessment." });

            // 1. Call Server Action (Gemini)
            const { generateQuizAction } = await import('@/app/actions/quiz-new');
            const result = await generateQuizAction(parseInt(data.documentId));

            if (!result.success || !result.quizId) {
                throw new Error(result.error || "Failed to generate quiz");
            }

            // 2. Load Generated Questions
            const { getQuizQuestionsAction } = await import('@/app/actions/quiz-new');
            const questionsResult = await getQuizQuestionsAction(result.quizId);

            if (!questionsResult.success || !questionsResult.questions || questionsResult.questions.length === 0) {
                throw new Error("No questions retrieved from database.");
            }

            const quizQuestions = questionsResult.questions;

            // 3. Set Active State
            setActiveQuestions(quizQuestions.map((q: any) => ({
                ...q,
                options: JSON.parse(q.options), // SQLite stores JSON as string
            })));

            setQuizState('active');
            setCurrentQuestionIndex(0);
            setAnswers({});
            setScore(0);

        } catch (error: any) {
            console.error("Quiz Error:", error);
            toast({
                variant: 'destructive',
                title: 'Assessment Generation Failed',
                description: error.message || 'We encountered an error preparing your questions.',
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
            const topic = activeQuestions[0].subject || 'General';
            const tid = activeQuestions[0].topicId || 'general';

            const { saveQuizResultAction, trackEventAction } = await import('@/app/actions/study');
            const { updateMasteryAction } = await import('@/app/actions/user');

            await saveQuizResultAction({
                subject: topic,
                score: percentage,
                totalQuestions: activeQuestions.length,
                correctAnswers: calculatedScore,
                questions: activeQuestions,
            });

            // Update Mastery
            await updateMasteryAction(topic, tid, percentage);

            // Track Event
            await trackEventAction('quiz_complete', topic, {
                score: percentage,
                count: activeQuestions.length
            });

            toast({ title: "Assessment Saved", description: "Your progress has been updated." });
        }
    };

    // --- Render Views ---

    if (quizState === 'config') {
        if (!documents || documents.length === 0) {
            return (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-300">
                    <Card className="max-w-md w-full border-dashed border-2 shadow-sm bg-muted/30">
                        <CardHeader>
                            <div className="mx-auto bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
                                <BookOpen className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <CardTitle>Assessments Unavailable</CardTitle>
                            <CardDescription>
                                No subjects found. Please add subjects in your Profile or upload documents first.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                The Knowledge Assessment engine requires course material to generate questions.
                            </p>
                            <Button variant="outline" onClick={() => window.location.reload()}>
                                Reload Data
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )
        }

        return (
            <div className="h-full flex flex-col items-center justify-center p-4 animate-in zoom-in-95 duration-300">
                <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
                    <CardHeader className="text-center pb-6">
                        <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                            <BrainCircuit className="w-8 h-8 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Knowledge Assessment</CardTitle>
                        <CardDescription className="text-base">
                            Test your command of the material with AI-generated questions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(startQuiz)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="documentId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-semibold">Select Document</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11">
                                                        <SelectValue placeholder="Choose a document to quiz..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {documents?.map(doc => (
                                                        <SelectItem key={doc.id} value={String(doc.id)}>{doc.title} ({doc.subject})</SelectItem>
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
                                                <FormLabel className="text-sm font-semibold">Difficulty Level</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="easy">Fundamental (Easy)</SelectItem>
                                                        <SelectItem value="medium">Standard (Med)</SelectItem>
                                                        <SelectItem value="hard">Complex (Hard)</SelectItem>
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
                                                <FormLabel className="text-sm font-semibold">Question Count</FormLabel>
                                                <Select onValueChange={(val) => field.onChange(val)} defaultValue={String(field.value)}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="3">3 Questions</SelectItem>
                                                        <SelectItem value="5">5 Questions</SelectItem>
                                                        <SelectItem value="10">10 Questions</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <Button type="submit" className="w-full text-base font-semibold h-12 shadow-md hover:shadow-lg transition-all">
                                    Start Assessment <ArrowRight className="w-4 h-4 ml-2" />
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
            <div className="h-full flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                    <Loader2 className="relative h-16 w-16 animate-spin text-primary" />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold tracking-tight">Generating Assessment...</h3>
                    <p className="text-muted-foreground max-w-xs">
                        Our local AI is analyzing your documents to create a personalized test.
                    </p>
                    {modelProgress && (
                        <p className="text-xs text-muted-foreground/70 animate-pulse truncate max-w-sm mx-auto">
                            {modelProgress}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    if (quizState === 'review') {
        const percentage = Math.round((score / activeQuestions.length) * 100);
        return (
            <div className="h-full flex items-center justify-center p-4 animate-in zoom-in-95 duration-500">
                <Card className="w-full max-w-3xl border-0 shadow-2xl bg-gradient-to-br from-card to-muted/20">
                    <CardHeader className="text-center border-b pb-8">
                        <div className="mx-auto mb-4 bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center shadow-inner">
                            <Trophy className="w-12 h-12 text-primary" />
                        </div>
                        <CardTitle className="text-4xl font-bold mb-2">Assessment Complete</CardTitle>
                        <CardDescription className="text-xl">
                            You scored <span className="font-bold text-foreground">{percentage}%</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-8 max-h-[500px] overflow-y-auto">
                        <div className="grid gap-4">
                            {activeQuestions.map((q, idx) => {
                                const userAnswer = answers[q.id!];
                                const isCorrect = userAnswer === q.correctAnswer;
                                return (
                                    <div key={q.id} className={`p-5 rounded-xl border transition-all ${isCorrect ? 'bg-green-500/5 border-green-200 dark:border-green-900/50' : 'bg-red-500/5 border-red-200 dark:border-red-900/50'}`}>
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1">
                                                {isCorrect ? <CheckCircle2 className="w-6 h-6 text-green-600 shadow-sm" /> : <XCircle className="w-6 h-6 text-red-600 shadow-sm" />}
                                            </div>
                                            <div className="space-y-2 flex-1">
                                                <p className="font-semibold text-lg leading-snug">{idx + 1}. {q.question}</p>
                                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-8 pt-2">
                                                    <p className="text-sm text-muted-foreground font-medium">Correct Answer: <span className="text-green-600 dark:text-green-400">{q.correctAnswer}</span></p>
                                                    {!isCorrect && <p className="text-sm text-red-600 dark:text-red-400 font-medium">Your Answer: {userAnswer}</p>}
                                                </div>
                                                {q.explanation && (
                                                    <div className="text-sm text-muted-foreground mt-3 bg-muted/50 p-3 rounded-lg border border-border/50">
                                                        <span className="font-semibold">Explanation:</span> {q.explanation}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-center gap-4 py-8 border-t bg-muted/5">
                        <Button variant="outline" size="lg" onClick={() => setQuizState('config')}>Back to Menu</Button>
                        <Button size="lg" onClick={() => setQuizState('config')}>Take Another Test</Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // Active Quiz View
    if (!activeQuestions || activeQuestions.length === 0 || currentQuestionIndex >= activeQuestions.length) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-lg text-muted-foreground">Session Error</p>
                    <Button onClick={() => setQuizState('config')}>Return to Menu</Button>
                </div>
            </div>
        );
    }

    const currentQ = activeQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / activeQuestions.length) * 100;

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col py-8 px-4 sm:px-6">
            {/* Quiz Header */}
            <div className="mb-8 space-y-4">
                <div className="flex justify-between items-end text-sm text-muted-foreground">
                    <div>
                        <span className="text-2xl font-bold text-foreground">Question {currentQuestionIndex + 1}</span>
                        <span className="ml-2">/ {activeQuestions.length}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xs font-semibold uppercase tracking-wider">
                        <Target className="w-4 h-4" /> Focus Mode
                    </div>
                </div>
                <Progress value={progress} className="h-3 rounded-full" />
            </div>

            {/* Question Card */}
            <Card className="flex-1 flex flex-col shadow-lg border-muted/60 overflow-hidden">
                <CardHeader className="bg-muted/5 pb-8 pt-6">
                    <CardTitle className="text-2xl leading-relaxed font-medium">{currentQ.question}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-6 sm:p-8">
                    <RadioGroup onValueChange={handleAnswer} value={answers[currentQ.id!] || ""}>
                        <div className="grid gap-4">
                            {currentQ.options.map((option, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleAnswer(option)}
                                    className={`
                                        flex items-center space-x-4 border-2 rounded-xl p-5 cursor-pointer transition-all duration-200
                                        ${answers[currentQ.id!] === option
                                            ? 'border-primary bg-primary/5 shadow-md scale-[1.01]'
                                            : 'border-muted hover:border-primary/50 hover:bg-muted/30'
                                        }
                                    `}
                                >
                                    <RadioGroupItem value={option} id={`opt-${idx}`} className="w-5 h-5 mt-0.5" />
                                    <Label htmlFor={`opt-${idx}`} className="flex-1 cursor-pointer font-normal text-lg leading-relaxed pointer-events-none">
                                        {option}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </RadioGroup>
                </CardContent>
                <CardFooter className="border-t bg-muted/5 p-6 flex justify-between items-center sm:px-8">
                    <Button
                        variant="ghost"
                        size="lg"
                        disabled={currentQuestionIndex === 0}
                        onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        Previous
                    </Button>
                    <Button
                        size="lg"
                        onClick={nextQuestion}
                        disabled={!answers[currentQ.id!]}
                        className="px-8 font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                        {currentQuestionIndex === activeQuestions.length - 1 ? "Complete Assessment" : "Next Question"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

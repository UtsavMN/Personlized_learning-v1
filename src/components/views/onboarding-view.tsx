'use client';

import React, { useState } from 'react';
import { useLocalAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { generateTopicId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash, GraduationCap, ChevronRight, ChevronLeft, Target, Clock, BookOpen } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

type Step = 'profile' | 'goals' | 'subjects' | 'pace';

export function OnboardingView() {
    const { user } = useLocalAuth();
    const [step, setStep] = useState<Step>('profile');
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [semester, setSemester] = useState<string>('1');
    const [branch, setBranch] = useState<string>('');
    const [goals, setGoals] = useState<string>('');
    const [subjects, setSubjects] = useState<string[]>(['']);
    const [studyHours, setStudyHours] = useState<string>('10');
    const [preferredTime, setPreferredTime] = useState<string>('evening');

    const nextStep = () => {
        if (step === 'profile') setStep('goals');
        else if (step === 'goals') setStep('subjects');
        else if (step === 'subjects') {
            const valid = subjects.filter(s => s.trim() !== '');
            if (valid.length === 0) {
                toast({ title: "No subjects", description: "Please add at least one subject.", variant: "destructive" });
                return;
            }
            setStep('pace');
        }
    };

    const prevStep = () => {
        if (step === 'goals') setStep('profile');
        else if (step === 'subjects') setStep('goals');
        else if (step === 'pace') setStep('subjects');
    };

    // Subject Handlers
    const handleSubjectChange = (index: number, value: string) => {
        const newSubjects = [...subjects];
        newSubjects[index] = value;
        setSubjects(newSubjects);
    };
    const addSubjectField = () => setSubjects([...subjects, '']);
    const removeSubjectField = (index: number) => {
        if (subjects.length > 1) setSubjects(subjects.filter((_, i) => i !== index));
    };

    const handleComplete = async () => {
        if (!user) return;
        setIsLoading(true);

        try {
            const validSubjects = subjects.filter(s => s.trim() !== '');

            // 1. Create Learner Profile
            await db.learnerProfile.put({

                userId: user.uid, // Required by index
                name: user.displayName || 'Student',
                learningStyle: 'visual', // Default, can be refined later
                preferredTime: preferredTime as 'morning' | 'evening',
                availableHoursPerWeek: parseInt(studyHours) || 10,
                goals: goals.split('\n').filter(g => g.trim().length > 0),
                metrics: {
                    streak: 0,
                    lastStudySession: new Date() // Initialize timestamp
                }
            });

            // 2. Initialize Subject Mastery (Strictly 0)
            const masteryEntries = validSubjects.map(sub => ({

                topicId: generateTopicId(sub),
                subject: sub.trim(),
                masteryScore: 0,
                confidenceScore: 0,
                level: 1,
                xp: 0,
                lastRevised: new Date(),
                nextReviewDate: new Date()
            }));

            // Clear old if matching (safety) then add new
            await db.subjectMastery.clear();
            await db.subjectMastery.bulkAdd(masteryEntries);

            // 3. Reload to start app
            window.location.reload();

        } catch (e) {
            console.error(e);
            toast({ title: "Setup Failed", description: "Could not create profile. Please try again.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
            <Card className="w-full max-w-lg border-muted-foreground/20 shadow-xl">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                        <GraduationCap className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl">Setup Your Journey</CardTitle>
                    <CardDescription>
                        {step === 'profile' && "Tell us about your academic standing."}
                        {step === 'goals' && "What do you want to achieve?"}
                        {step === 'subjects' && "What are you studying right now?"}
                        {step === 'pace' && "How do you like to study?"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {step === 'profile' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                <div className="space-y-2">
                                    <Label>Current Semester</Label>
                                    <Select value={semester} onValueChange={setSemester}>
                                        <SelectTrigger><SelectValue placeholder="Select Semester" /></SelectTrigger>
                                        <SelectContent>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <SelectItem key={s} value={s.toString()}>Semester {s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Branch / Major</Label>
                                    <Input placeholder="e.g. Computer Science" value={branch} onChange={e => setBranch(e.target.value)} />
                                </div>
                            </div>
                        )}

                        {step === 'goals' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                <div className="space-y-2">
                                    <Label>Learning Goals (One per line)</Label>
                                    <Textarea
                                        placeholder="e.g. Score 90% in Calculus&#10;Prepare for Internship"
                                        value={goals}
                                        onChange={e => setGoals(e.target.value)}
                                        rows={4}
                                    />
                                    <div className="flex gap-2 text-xs text-muted-foreground">
                                        <Target className="w-3 h-3" />
                                        <span>We'll customize your tasks based on this.</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 'subjects' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                <div className="flex items-center justify-between">
                                    <Label>Your Subjects</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addSubjectField}>
                                        <Plus className="mr-2 h-3 w-3" /> Add
                                    </Button>
                                </div>
                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                                    {subjects.map((sub, index) => (
                                        <div key={index} className="flex gap-2">
                                            <Input
                                                placeholder={`Subject ${index + 1}`}
                                                value={sub}
                                                onChange={(e) => handleSubjectChange(index, e.target.value)}
                                                autoFocus={index === subjects.length - 1}
                                            />
                                            {subjects.length > 1 && (
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeSubjectField(index)}>
                                                    <Trash className="h-4 w-4 text-destructive" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-primary/5 p-3 rounded-md flex gap-2 items-start">
                                    <BookOpen className="w-4 h-4 text-primary mt-0.5" />
                                    <p className="text-xs text-muted-foreground">Only add subjects you are actively studying. You can add more later.</p>
                                </div>
                            </div>
                        )}

                        {step === 'pace' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                <div className="space-y-2">
                                    <Label>Target Study Hours / Week</Label>
                                    <Input type="number" value={studyHours} onChange={e => setStudyHours(e.target.value)} min={1} max={100} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Preferred Time</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div
                                            className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${preferredTime === 'morning' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
                                            onClick={() => setPreferredTime('morning')}
                                        >
                                            Early Bird ☀️
                                        </div>
                                        <div
                                            className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${preferredTime === 'evening' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'}`}
                                            onClick={() => setPreferredTime('evening')}
                                        >
                                            Night Owl 🌙
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    {step !== 'profile' ? (
                        <Button variant="outline" onClick={prevStep} disabled={isLoading}>
                            <ChevronLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                    ) : <div />}

                    {step !== 'pace' ? (
                        <Button onClick={nextStep}>
                            Next <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button onClick={handleComplete} disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Target className="mr-2 h-4 w-4" />}
                            {isLoading ? "Finalizing..." : "Start Learning Journey"}
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}

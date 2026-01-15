'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, TaskEntry, HobbyEntry } from '@/lib/db';
import { TrackerIntelligence } from '@/lib/ai/tracker-intelligence';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { format, isSameDay } from 'date-fns';
import { CheckCircle2, Circle, Flame, Target, Plus, TrendingUp, Sparkles, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export function TrackerView() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [activeTab, setActiveTab] = useState('tasks');
    const [newTaskTitle, setNewTaskTitle] = useState('');

    // Hobby Form State
    const [hobbyName, setHobbyName] = useState('');
    const [isHobbyDialogOpen, setIsHobbyDialogOpen] = useState(false);

    // Queries
    const allTasks = useLiveQuery(() => db.tasks.toArray()) || [];
    const hobbies = useLiveQuery(() => db.hobbies.toArray()) || [];

    // Derived State
    const selectedDate = date || new Date();

    const dailyTasks = allTasks.filter(task =>
        isSameDay(new Date(task.date), selectedDate)
    );

    const completedTasks = dailyTasks.filter(t => t.completed);
    const completionRate = dailyTasks.length > 0 ? (completedTasks.length / dailyTasks.length) * 100 : 0;

    // AI Predictions
    const aiCompletionPred = TrackerIntelligence.predictDailyCompletionRate(allTasks);
    const aiInsight = TrackerIntelligence.generateInsight(dailyTasks, hobbies);

    // Handlers
    const addTask = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newTaskTitle.trim()) return;

        await db.tasks.add({
            title: newTaskTitle,
            completed: false,
            date: selectedDate, // Add for specific selected date
            type: 'task'
        });
        setNewTaskTitle('');
    };

    const toggleTask = async (task: TaskEntry) => {
        if (task.id) {
            await db.tasks.update(task.id, { completed: !task.completed });
        }
    };

    const addHobby = async () => {
        if (!hobbyName.trim()) return;
        await db.hobbies.add({
            name: hobbyName,
            frequency: 'daily',
            durationMinutes: 30,
            completedDates: [],
            type: 'hobby'
        });
        setHobbyName('');
        setIsHobbyDialogOpen(false);
    };

    const checkInHobby = async (hobby: HobbyEntry) => {
        if (!hobby.id) return;

        // Check if already done today
        const doneToday = hobby.completedDates.some(d => isSameDay(new Date(d), selectedDate));

        let updatedDates = [...hobby.completedDates];
        if (doneToday) {
            // Toggle off (remove date)
            updatedDates = updatedDates.filter(d => !isSameDay(new Date(d), selectedDate));
        } else {
            // Toggle on
            updatedDates.push(selectedDate);
        }

        await db.hobbies.update(hobby.id, { completedDates: updatedDates });
    };

    const deleteHobby = async (id?: number) => {
        if (id) await db.hobbies.delete(id);
    }

    const deleteTask = async (id?: number) => {
        if (id) await db.tasks.delete(id);
    }


    return (
        <div className="flex flex-col md:flex-row gap-6 h-full p-2">

            {/* LEFT COLUMN: Main Tracker */}
            <div className="flex-1 flex flex-col gap-6">

                {/* Header Section */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Today's Focus</h1>
                        <p className="text-muted-foreground">{format(selectedDate, 'EEEE, MMMM do, yyyy')}</p>
                    </div>
                    {/* Progress Pill */}
                    <div className="flex items-center gap-3 bg-card border px-4 py-2 rounded-full shadow-sm">
                        <div className="text-right">
                            <p className="text-xs font-semibold text-muted-foreground">Daily Goal</p>
                            <p className="text-sm font-bold">{Math.round(completionRate)}%</p>
                        </div>
                        <div className="w-12 h-12 relative flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-secondary" />
                                <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="4" fill="transparent"
                                    className="text-primary transition-all duration-500 ease-out"
                                    strokeDasharray={113}
                                    strokeDashoffset={113 - (113 * completionRate) / 100} />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Tabs for Tasks vs Hobbies */}
                <Tabs defaultValue="tasks" className="w-full flex-1 flex flex-col" onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="tasks" className="text-base">Tasks</TabsTrigger>
                        <TabsTrigger value="hobbies" className="text-base">Habits & Hobbies</TabsTrigger>
                    </TabsList>

                    <TabsContent value="tasks" className="flex-1 flex flex-col gap-4">
                        {/* Component: Quick Add */}
                        <form onSubmit={addTask} className="relative">
                            <Input
                                placeholder="What needs to be done?"
                                className="pl-12 py-6 text-lg shadow-sm border-muted-foreground/20 focus-visible:ring-primary/20"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                <Plus className="w-5 h-5" />
                            </div>
                        </form>

                        {/* Component: Task List */}
                        <ScrollArea className="flex-1 pr-2">
                            <div className="flex flex-col gap-2">
                                {dailyTasks.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground border-2 border-dashed rounded-xl mt-4">
                                        <Sparkles className="w-8 h-8 mb-2 opacity-50" />
                                        <p>No tasks for this day.</p>
                                        <p className="text-sm">Enjoy your freedom or plan ahead!</p>
                                    </div>
                                ) : (
                                    dailyTasks.map(task => (
                                        <div key={task.id} className="group flex items-center gap-3 p-4 bg-card rounded-xl border shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                                            <Checkbox
                                                checked={task.completed}
                                                onCheckedChange={() => toggleTask(task)}
                                                className="w-6 h-6 rounded-full border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                            />
                                            <span className={`flex-1 text-lg transition-all ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                                {task.title}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                                                onClick={() => deleteTask(task.id)}
                                            >
                                                <span className="sr-only">Delete</span>
                                                <Plus className="w-4 h-4 rotate-45" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="hobbies" className="flex-1">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="flex justify-end">
                                <Dialog open={isHobbyDialogOpen} onOpenChange={setIsHobbyDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="gap-2"><Plus className="w-4 h-4" /> New Habit</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Start a New Habit</DialogTitle>
                                            <DialogDescription>Consistency is key. What do you want to track?</DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4">
                                            <Label>Habit Name</Label>
                                            <Input
                                                value={hobbyName}
                                                onChange={(e) => setHobbyName(e.target.value)}
                                                placeholder="e.g. Read 30 mins, Gym, Meditate"
                                                className="mt-2"
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={addHobby}>Create Habit</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {hobbies.map(hobby => {
                                    const stats = TrackerIntelligence.predictHobbyConsistency(hobby);
                                    const isDoneToday = hobby.completedDates.some(d => isSameDay(new Date(d), selectedDate));

                                    return (
                                        <Card key={hobby.id} className="relative overflow-hidden border-muted-foreground/10 hover:border-primary/30 transition-all">
                                            <CardHeader className="pb-2">
                                                <div className="flex justify-between items-start">
                                                    <CardTitle className="text-lg">{hobby.name}</CardTitle>
                                                    <Badge variant={isDoneToday ? "default" : "outline"} className="cursor-pointer" onClick={() => checkInHobby(hobby)}>
                                                        {isDoneToday ? "Completed" : "Check In"}
                                                    </Badge>
                                                </div>
                                                <CardDescription className="flex items-center gap-2">
                                                    <Flame className={`w-4 h-4 ${stats.streak > 3 ? 'text-orange-500 fill-orange-500' : 'text-muted-foreground'}`} />
                                                    {stats.streak} Day Streak
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Consistency Score</span>
                                                        <span className="font-semibold">{Math.round(stats.score)}%</span>
                                                    </div>
                                                    <Progress value={stats.score} className="h-2" />
                                                    <p className="text-xs text-muted-foreground text-right">{stats.label}</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute bottom-2 right-2 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => deleteHobby(hobby.id)}
                                                >
                                                    <Plus className="w-4 h-4 rotate-45" />
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* RIGHT COLUMN: Calendar & Widgets */}
            <div className="w-full md:w-[350px] flex flex-col gap-6">

                {/* Calendar Widget */}
                <div className="border rounded-xl bg-card shadow-sm p-4">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border-0 w-full flex justify-center"
                    />
                </div>

                {/* AI Prediction Widget */}
                <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-100 dark:border-indigo-900">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                            <Sparkles className="w-5 h-5" />
                            AISights
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Completion Forecast</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold">{aiCompletionPred}%</span>
                                <span className="text-sm text-green-600 dark:text-green-400 flex items-center">
                                    <TrendingUp className="w-3 h-3 mr-1" /> Probable
                                </span>
                            </div>
                        </div>

                        <div className="p-3 bg-white dark:bg-black/20 rounded-lg text-sm border border-indigo-100 dark:border-indigo-900/50 italic">
                            "{aiInsight}"
                        </div>
                    </CardContent>
                </Card>

                {/* Mini Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <Trophy className="w-6 h-6 text-yellow-500 mb-2" />
                            <span className="text-2xl font-bold">{hobbies.filter(h => h.completedDates.some(d => isSameDay(new Date(d), new Date()))).length}</span>
                            <span className="text-xs text-muted-foreground">Habits Today</span>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <Target className="w-6 h-6 text-blue-500 mb-2" />
                            <span className="text-2xl font-bold">{completedTasks.length}</span>
                            <span className="text-xs text-muted-foreground">Tasks Done</span>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}

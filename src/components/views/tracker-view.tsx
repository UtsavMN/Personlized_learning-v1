'use client';

import { useState, useEffect } from 'react';
import { format, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Sparkles, TrendingUp, Trophy, Target, Flame } from 'lucide-react';
import { TrackerIntelligence } from '@/lib/ai/tracker-intelligence';
import { useDelete } from '@/hooks/use-delete';
import {
    getTrackerItemsAction,
    addTrackerItemAction,
    updateTrackerItemAction,
    deleteTrackerItemAction,
    getHabitsAction,
    addHabitAction,
    updateHabitAction,
    deleteHabitAction
} from '@/app/actions/study';

export function TrackerView() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [activeTab, setActiveTab] = useState('tasks');
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [loading, setLoading] = useState(true);

    // Hobby Form State
    const [hobbyName, setHobbyName] = useState('');
    const [isHobbyDialogOpen, setIsHobbyDialogOpen] = useState(false);

    // Queries
    const [allTasks, setAllTasks] = useState<any[]>([]);
    const [hobbies, setHobbies] = useState<any[]>([]);

    const refreshData = async () => {
        const tRes = await getTrackerItemsAction();
        if (tRes.success) setAllTasks(tRes.items);

        const hRes = await getHabitsAction();
        if (hRes.success) {
            // Parse completedDates JSON
            const parsed = hRes.items.map((h: any) => ({
                ...h,
                completedDates: h.completedDates ? JSON.parse(h.completedDates) : []
            }));
            setHobbies(parsed);
        }
        setLoading(false);
    };

    useEffect(() => {
        refreshData();
    }, []);

    // Derived State
    const selectedDate = date || new Date();

    const dailyTasks = allTasks.filter(task =>
        isSameDay(new Date(task.deadline || task.date || Date.now()), selectedDate)
    );

    const completedTasks = dailyTasks.filter(t => t.status === 'Completed' || t.completed);
    const completionRate = dailyTasks.length > 0 ? (completedTasks.length / dailyTasks.length) * 100 : 0;

    // AI Predictions
    const aiCompletionPred = TrackerIntelligence.predictDailyCompletionRate(allTasks as any);
    const aiInsight = TrackerIntelligence.generateInsight(dailyTasks as any, hobbies as any);

    // Handlers
    const addTask = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newTaskTitle.trim()) return;

        await addTrackerItemAction({
            subject: 'General',
            description: newTaskTitle,
            status: 'Pending',
            priority: 'Medium',
            deadline: selectedDate
        });
        setNewTaskTitle('');
        refreshData();
    };

    const toggleTask = async (task: any) => {
        await updateTrackerItemAction(task.id, {
            status: (task.status === 'Completed' || task.completed) ? 'Pending' : 'Completed'
        });
        refreshData();
    };

    const addHobby = async () => {
        if (!hobbyName.trim()) return;
        await addHabitAction({
            name: hobbyName,
            frequency: 'daily',
            durationMinutes: 30
        });
        setHobbyName('');
        setIsHobbyDialogOpen(false);
        refreshData();
    };

    const checkInHobby = async (hobby: any) => {
        if (!hobby.id) return;

        // Check if already done today
        const doneToday = hobby.completedDates.some((d: string) => isSameDay(new Date(d), selectedDate));

        let updatedDates = [...hobby.completedDates];
        if (doneToday) {
            // Toggle off (remove date)
            updatedDates = updatedDates.filter((d: string) => !isSameDay(new Date(d), selectedDate));
        } else {
            // Toggle on
            updatedDates.push(selectedDate.toISOString());
        }

        await updateHabitAction(hobby.id, { completedDates: JSON.stringify(updatedDates) });
        refreshData();
    };

    const { deleteItem } = useDelete();

    const deleteHobby = (id?: number) => {
        if (id) deleteItem(async () => {
            await deleteHabitAction(id);
            refreshData();
        }, { successMessage: "Habit deleted" });
    }

    const deleteTask = (id?: number) => {
        if (id) deleteItem(async () => {
            await deleteTrackerItemAction(id);
            refreshData();
        }, { successMessage: "Task deleted" });
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
                                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                onClick={() => deleteTask(task.id)}
                                                title="Delete Task"
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
                                                    className="absolute bottom-2 right-2 text-muted-foreground hover:text-destructive transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteHobby(hobby.id);
                                                    }}
                                                    title="Delete Habit"
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
                    <StatsCard
                        title="Habits Today"
                        value={hobbies.filter(h => h.completedDates.some(d => isSameDay(new Date(d), new Date()))).length}
                        icon={Trophy}
                        color="text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30"
                        trend="Active"
                    />
                    <StatsCard
                        title="Tasks Done"
                        value={completedTasks.length}
                        icon={Target}
                        color="text-blue-500 bg-blue-100 dark:bg-blue-900/30"
                        trend="Completed"
                    />
                </div>

            </div>
        </div>
    );
}

// StatsCard Component
interface StatsCardProps {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    trend: string;
}

function StatsCard({ title, value, icon: Icon, color, trend }: StatsCardProps) {
    return (
        <Card className="relative overflow-hidden">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{trend}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${color}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

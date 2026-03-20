import { useLocalAuth } from '@/lib/auth-context';
import { FactoryResetWidget } from '@/components/factory-reset';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, ShieldAlert, Mail, Plus, X, Save, Target, Brain, TrendingUp, Loader2, Server, Database, Cpu, Layers, Lock, MonitorSmartphone, ArrowRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn, generateTopicId } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import {
    getProfileAction,
    updateProfileAction,
    getMasteryAction,
    updateMasteryAction,
    deleteMasteryItemAction
} from '@/app/actions/user';
import { useDelete } from '@/hooks/use-delete';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function SettingsView() {
    const { user } = useLocalAuth();

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings & Profile</h1>
                <p className="text-muted-foreground mt-2">Manage your account and data preferences.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Profile Editor */}
                <ProfileEditor />

                {/* Data Zone */}
                <Card className="border-muted/60">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-purple-500" />
                            Brain Inspector
                        </CardTitle>
                        <CardDescription>Visualize the internal state of your AI agents.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <BrainInspector />
                    </CardContent>
                </Card>

                <Card className="border-destructive/20 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <ShieldAlert className="h-5 w-5" />
                            Danger Zone
                        </CardTitle>
                        <CardDescription>
                            Actions here are irreversible.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm">
                            If you want to restart your learning journey from scratch (e.g. to test the onboarding flow), you can reset your progress below.
                            This <strong>Safe Reset</strong> will keep your documents and dataset intact.
                        </p>
                        <Separator className="bg-destructive/10" />
                        <FactoryResetWidget />
                    </CardContent>
                </Card>
            </div>

            {/* Explainable AI Section (Goal 2) */}
            <Card className="border-blue-500/20 bg-blue-50/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-blue-500" />
                        How Mentora Thinks
                    </CardTitle>
                    <CardDescription>Transparency into the AI decision making process.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg bg-card">
                        <div className="font-semibold mb-1 flex items-center gap-2">
                            <Target className="w-4 h-4 text-green-500" />
                            Rule-Based Engine
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Used for urgent alerts and basic study tips. If you study late, simple rules trigger "Rest" recommendations.
                        </p>
                    </div>
                    <div className="p-4 border rounded-lg bg-card">
                        <div className="font-semibold mb-1 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-purple-500" />
                            Reinforcement Learning
                        </div>
                        <p className="text-sm text-muted-foreground">
                            The scheduler learns from your <span className="font-mono text-xs bg-muted px-1 rounded">thumbs up/down</span> feedback and study patterns to optimize time-slots.
                        </p>
                    </div>
                    <div className="p-4 border rounded-lg bg-card">
                        <div className="font-semibold mb-1 flex items-center gap-2">
                            <Brain className="w-4 h-4 text-rose-500" />
                            Neural Network
                        </div>
                        <p className="text-sm text-muted-foreground">
                            A TensorFlow.js model runs locally to predict grades based on your focus duration and quiz scores.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Tech Stack Architecture Flowchart */}
            <ProjectArchitecture />
        </div>
    );
}


function ProfileEditor() {
    const { user } = useLocalAuth();
    const [profile, setProfile] = useState<any>(null);
    const [mastery, setMastery] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const refreshData = async () => {
        if (!user) return;
        const pRes = await getProfileAction(user.uid);
        if (pRes.success) setProfile(pRes.profile);

        const mRes = await getMasteryAction();
        if (mRes.success) setMastery(mRes.mastery);

        setLoading(false);
    };

    useEffect(() => {
        refreshData();
    }, [user]);

    // Form State
    const [name, setName] = useState("");
    const [goals, setGoals] = useState("");
    const [semester, setSemester] = useState("1");
    const [branch, setBranch] = useState("");
    const [studyHours, setStudyHours] = useState("10");
    const [preferredTime, setPreferredTime] = useState("evening");

    const [newSubject, setNewSubject] = useState("");
    const [deleteCandidate, setDeleteCandidate] = useState<any>(null);

    useEffect(() => {
        if (profile) {
            setName(profile.name || "");
            setGoals(Array.isArray(profile.goals) ? profile.goals.join('\n') : (typeof profile.goals === 'string' ? JSON.parse(profile.goals).join('\n') : ""));
            setSemester(profile.semester || "1");
            setBranch(profile.branch || "");
            setStudyHours(profile.availableHoursPerWeek?.toString() || "10");
            setPreferredTime(profile.preferredTime || "evening");
        }
    }, [profile]);

    const handleSave = async () => {
        if (!user) {
            toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
            return;
        }

        try {
            await updateProfileAction(user.uid, {
                name: name,
                goals: JSON.stringify(goals.split('\n').filter(g => g.trim().length > 0)),
                semester: semester,
                branch: branch,
                availableHoursPerWeek: parseInt(studyHours) || 10,
                preferredTime: preferredTime as 'morning' | 'evening'
            });

            setIsEditing(false);
            refreshData();
            toast({ title: "Profile Updated", description: "Your changes have been saved." });
        } catch (e: any) {
            console.error("Profile Update Failed:", e);
            toast({ title: "Save Failed", description: e.message || "Could not update profile.", variant: "destructive" });
        }
    };

    const handleAddSubject = async () => {
        if (!newSubject.trim()) return;
        const sub = newSubject.trim();
        const tid = generateTopicId(sub);

        try {
            await updateMasteryAction(sub, tid, 0, 0);
            toast({ title: "Subject Added", description: `${sub} is now in your mastery tracker.` });
            setNewSubject("");
            refreshData();
        } catch (e) {
            console.error("Add Subject Error:", e);
            toast({ title: "Error", description: "Could not add subject.", variant: "destructive" });
        }
    };

    const { deleteItem } = useDelete();

    const confirmDelete = async () => {
        if (!deleteCandidate) return;
        const item = deleteCandidate;

        deleteItem(async () => {
            if (item.id) {
                await deleteMasteryItemAction(item.id);
                refreshData();
            } else {
                throw new Error("Could not identify subject to delete.");
            }
        }, {
            successMessage: "Subject Removed",
            onSuccess: () => setDeleteCandidate(null)
        });
    };

    if (!profile) return <Card className="animate-pulse h-[300px]"><CardHeader><CardTitle>Loading Profile...</CardTitle></CardHeader></Card>;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Student Profile
                    </CardTitle>
                    <CardDescription>Manage your academic identity & curriculum.</CardDescription>
                </div>
                {!isEditing && <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit Details</Button>}
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="grid gap-4 border p-4 rounded-lg bg-muted/10">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Display Name</Label>
                            {isEditing ? (
                                <Input value={name} onChange={e => setName(e.target.value)} />
                            ) : (
                                <p className="text-sm font-medium">{profile.name}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Branch / Major</Label>
                            {isEditing ? (
                                <Input value={branch} onChange={e => setBranch(e.target.value)} placeholder="e.g. Computer Science" />
                            ) : (
                                <p className="text-sm font-medium">{profile.branch || "Undeclared"}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Semester</Label>
                            {isEditing ? (
                                <Input type="number" min={1} max={8} value={semester} onChange={e => setSemester(e.target.value)} />
                            ) : (
                                <p className="text-sm font-medium">Semester {profile.semester || "-"}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Study Hours / Week</Label>
                            {isEditing ? (
                                <Input type="number" min={1} value={studyHours} onChange={e => setStudyHours(e.target.value)} />
                            ) : (
                                <p className="text-sm font-medium">{profile.availableHoursPerWeek} hours</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Goals */}
                <div className="grid gap-2">
                    <Label>Learning Goals</Label>
                    {isEditing ? (
                        <Textarea value={goals} onChange={e => setGoals(e.target.value)} rows={3} />
                    ) : (
                        <div className="space-y-1">
                            {(!profile.goals || profile.goals.length === 0) && <p className="text-sm text-muted-foreground italic">No goals set.</p>}
                            {Array.isArray(profile.goals) && profile.goals.map((g, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                    <Target className="w-3 h-3 text-primary" />
                                    {g}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {isEditing && (
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button onClick={handleSave}><Save className="w-4 h-4 mr-2" /> Save Changes</Button>
                    </div>
                )}

                <Separator />

                {/* Subjects Management */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Tracked Subjects</Label>
                    </div>

                    <div className="flex gap-2">
                        <Input
                            placeholder="Add new subject (e.g. Linear Algebra)"
                            value={newSubject}
                            onChange={e => setNewSubject(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
                        />
                        <Button onClick={handleAddSubject} size="icon"><Plus className="w-4 h-4" /></Button>
                    </div>

                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {!mastery || mastery.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">No subjects tracked.</p>
                        ) : (
                            mastery.map(m => (
                                <div key={m.id || m.topicId} className="flex justify-between items-center p-2 border rounded hover:bg-muted/50">
                                    <span className="text-sm font-medium">{m.subject || m.topicId || "Untitled Subject"}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                        onClick={() => setDeleteCandidate(m)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </CardContent>

            <AlertDialog open={!!deleteCandidate} onOpenChange={(open) => !open && setDeleteCandidate(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Stop tracking subject?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove <strong>{deleteCandidate?.subject}</strong>? All mastery data and XP for this subject will be permanently lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                            Stop Tracking
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}


function BrainInspector() {
    // StateHash -> { Action: Value }
    const [qTable, setQTable] = useState<Record<string, Record<string, number>>>({});
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        // Dynamic import to avoid SSR issues if any (though this component is client-only)
        import('@/lib/ai/rl-scheduler').then(({ rlScheduler }) => {
            setQTable(rlScheduler.getQTableFull());
        });
    }, [refresh]);

    const handleReset = async () => {
        if (confirm("Reset AI Brain? All learned habits will be forgotten.")) {
            const { rlScheduler } = await import('@/lib/ai/rl-scheduler');
            rlScheduler.reset();
            setRefresh(prev => prev + 1);
            toast({ title: "Brain Wiped", description: "The agent has forgotten everything." });
        }
    };

    const items = Object.entries(qTable);

    const formatState = (hash: string) => {
        const [day, energy, prev] = hash.split('-');
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const energyLabels = ['?', 'Low', 'Med', 'High'];
        return (
            <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground uppercase tracking-wider">
                <span className="font-semibold text-primary">{days[parseInt(day)] || day}</span>
                <span>Energy: {energyLabels[parseInt(energy)] || energy}</span>
                <span>Prev: {prev}</span>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                    <span className="font-bold text-foreground">{items.length}</span> States Learned
                </div>
                <div className="flex gap-2">
                    <Button variant="destructive" size="sm" onClick={handleReset} className="h-8 text-xs">
                        <Brain className="w-3 h-3 mr-2" /> Reset Memory
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setRefresh(prev => prev + 1)} className="h-8 text-xs">
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-0 border rounded-lg bg-card shadow-sm divide-y">
                {items.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm flex flex-col items-center gap-2">
                        <Brain className="w-8 h-8 opacity-20" />
                        No learning data yet. Start using the Smart Agent!
                    </div>
                ) : (
                    items.map(([state, actions], i) => (
                        <div key={i} className="flex flex-col sm:flex-row p-3 gap-4 hover:bg-muted/50 transition-colors">
                            <div className="w-24 shrink-0 border-r pr-4">
                                {formatState(state)}
                            </div>
                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                                {Object.entries(actions).map(([action, value]) => (
                                    <div
                                        key={action}
                                        className={cn(
                                            "flex flex-col p-2 rounded border text-xs text-center transition-all",
                                            value > 5 ? "bg-green-500/10 border-green-500/30" :
                                                value < 0 ? "bg-red-500/10 border-red-500/30" : "bg-muted/30"
                                        )}
                                    >
                                        <span className="font-medium truncate" title={action}>{action}</span>
                                        <span className={cn(
                                            "font-mono font-bold",
                                            value > 0 ? "text-green-600 dark:text-green-400" :
                                                value < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                                        )}>
                                            {value?.toFixed(1)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
            <p className="text-[10px] text-muted-foreground text-right">
                Correct actions get +10. Bad actions get -5.
            </p>
        </div>
    );
}

function ProjectArchitecture() {
    return (
        <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/50 overflow-hidden mt-8 hidden md:block">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Layers className="w-6 h-6 text-primary" />
                    Project Architecture
                </CardTitle>
                <CardDescription className="text-sm">
                    Hover over each tech stack layer to understand how the components of this application connect together.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative flex flex-col items-center gap-8 py-8 md:p-8">
                    {/* Flow Line Background */}
                    <div className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500 rounded-full opacity-20 hidden md:block" />

                    {/* Layer 1: Frontend */}
                    <div className="relative group w-full max-w-2xl bg-card border-2 hover:border-blue-500 transition-all duration-300 rounded-xl p-4 shadow-sm hover:shadow-md z-10 hover:-translate-y-1">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                                <MonitorSmartphone className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg">1. Frontend (User Interface)</h3>
                                <div className="text-sm text-muted-foreground mt-1 leading-relaxed hidden group-hover:block transition-all fade-in">
                                    <p><strong>Next.js (React)</strong> powers the user interface using Server-Side Rendering (SSR) for blazing fast load times.</p>
                                    <p className="mt-1"><strong>Tailwind CSS & Radix UI</strong> are used for building beautiful, responsive, and accessible components without writing raw CSS.</p>
                                </div>
                                <div className="text-sm text-muted-foreground mt-1 group-hover:hidden">Next.js • React • Tailwind CSS • Radix UI</div>
                            </div>
                        </div>
                    </div>

                    <ArrowRight className="w-6 h-6 text-muted-foreground rotate-90 hidden md:block" />

                    {/* Layer 2: Authentication */}
                    <div className="relative group w-full max-w-2xl bg-card border-2 hover:border-orange-500 transition-all duration-300 rounded-xl p-4 shadow-sm hover:shadow-md z-10 hover:-translate-y-1">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full">
                                <Lock className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg">2. Authentication & Security</h3>
                                <div className="text-sm text-muted-foreground mt-1 leading-relaxed hidden group-hover:block transition-all fade-in">
                                    <p><strong>Clerk</strong> manages secure user authentication, session tokens, and identity verification.</p>
                                    <p className="mt-1">It intercepts requests via Next.js Middleware to ensure only authorized users access their personal learning data.</p>
                                </div>
                                <div className="text-sm text-muted-foreground mt-1 group-hover:hidden">Clerk • Next.js Middleware • Secure Sessions</div>
                            </div>
                        </div>
                    </div>

                    <ArrowRight className="w-6 h-6 text-muted-foreground rotate-90 hidden md:block" />

                    {/* Layer 3: Backend & DB */}
                    <div className="relative group w-full max-w-2xl bg-card border-2 hover:border-green-500 transition-all duration-300 rounded-xl p-4 shadow-sm hover:shadow-md z-10 hover:-translate-y-1">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                                <Database className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg">3. Backend API & Database</h3>
                                <div className="text-sm text-muted-foreground mt-1 leading-relaxed hidden group-hover:block transition-all fade-in">
                                    <p>Server Actions (Next.js API) securely handle business logic symmetrically inside the React Server Components.</p>
                                    <p className="mt-1"><strong>Drizzle ORM</strong> maps TypeScript objects to SQL queries, communicating with <strong>Turso (libSQL)</strong>, a highly scalable serverless SQLite cloud database.</p>
                                </div>
                                <div className="text-sm text-muted-foreground mt-1 group-hover:hidden">Next.js Server Actions • Drizzle ORM • Turso (SQLite/libSQL)</div>
                            </div>
                        </div>
                    </div>

                    <ArrowRight className="w-6 h-6 text-muted-foreground rotate-90 hidden md:block" />

                    {/* Layer 4: AI & ML */}
                    <div className="relative group w-full max-w-2xl bg-card border-2 hover:border-purple-500 transition-all duration-300 rounded-xl p-4 shadow-sm hover:shadow-md z-10 hover:-translate-y-1">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                                <Cpu className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg">4. Artificial Intelligence & Machine Learning</h3>
                                <div className="text-sm text-muted-foreground mt-1 leading-relaxed hidden group-hover:block transition-all fade-in">
                                    <p><strong>Genkit & Google Gemini:</strong> Used for generating dynamic quizzes, answering RAG document queries, and parsing unstructured data.</p>
                                    <p className="mt-1"><strong>Custom ML:</strong> Uses custom Q-Learning for scheduling habits and TensorFlow.js for predictive grade analytics.</p>
                                    <p className="mt-1"><strong>Local AI:</strong> Falls back to Ollama natively to run Llama 3 for 100% offline, privacy-first processing.</p>
                                </div>
                                <div className="text-sm text-muted-foreground mt-1 group-hover:hidden">Google Gemini API • Genkit • TensorFlow.js • Local Llama 3</div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}


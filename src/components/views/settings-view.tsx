'use client';

import { useLocalAuth } from '@/lib/auth-context';
import { FactoryResetWidget } from '@/components/factory-reset';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, ShieldAlert, Mail, Plus, X, Save, Target } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

export function SettingsView() {
    const { user } = useLocalAuth();

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings & Profile</h1>
                <p className="text-muted-foreground mt-2">Manage your account and data preferences.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Profile Editor */}
                <ProfileEditor />

                {/* Data Zone */}
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
        </div>
    );
}


function ProfileEditor() {
    const { user } = useLocalAuth();
    const profile = useLiveQuery(() => db.learnerProfile.where('userId').equals(user?.uid || "").first());
    const mastery = useLiveQuery(() => db.subjectMastery.toArray());

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState("");
    const [goals, setGoals] = useState("");
    const [newSubject, setNewSubject] = useState("");

    useEffect(() => {
        if (profile) {
            setName(profile.name);
            setGoals(profile.goals.join('\n'));
        }
    }, [profile]);

    const handleSave = async () => {
        if (!user) {
            toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
            return;
        }

        try {
            // Find valid ID (either from object or query)
            let profileId = profile?.id;
            if (!profileId) {
                // Should technically not happen if parent renders correct, but safe fallback
                const p = await db.learnerProfile.where('userId').equals(user.uid).first();
                profileId = p?.id;
            }

            if (!profileId) {
                throw new Error("Profile record not found on disk.");
            }

            await db.learnerProfile.update(profileId, {
                name: name,
                goals: goals.split('\n').filter(g => g.trim().length > 0)
            });

            setIsEditing(false);
            toast({ title: "Profile Updated", description: "Your changes have been saved." });
        } catch (e: any) {
            console.error("Profile Update Failed:", e);
            toast({ title: "Save Failed", description: e.message || "Could not update profile.", variant: "destructive" });
        }
    };

    const handleAddSubject = async () => {
        if (!newSubject.trim()) return;
        const sub = newSubject.trim();
        const id = sub.toLowerCase().replace(/[^a-z0-9]+/g, '-'); // Cleaner ID generation

        // Check duplicate (case insensitive check on topicId)
        const exists = await db.subjectMastery.where('topicId').equals(id).count();
        if (exists > 0) {
            toast({ title: "Subject already exists", description: "You are already tracking this subject.", variant: "destructive" });
            return;
        }

        try {
            await db.subjectMastery.add({
                topicId: id,
                subject: sub,
                masteryScore: 0,
                confidenceScore: 0,
                level: 1,
                xp: 0,
                lastRevised: new Date(),
                nextReviewDate: new Date()
            });

            toast({ title: "Subject Added", description: `${sub} is now in your mastery tracker.` });
            setNewSubject("");
        } catch (e) {
            console.error("Add Subject Error:", e);
            toast({ title: "Error", description: "Could not add subject.", variant: "destructive" });
        }
    };

    const handleRemoveSubject = async (id: number) => {
        if (!id) return;
        if (confirm("Stop tracking this subject? Mastery data will be lost.")) {
            try {
                await db.subjectMastery.delete(id);
                toast({ title: "Subject Removed" });
            } catch (e: any) {
                console.error("Remove Subject Error:", e);
                toast({ title: "Error", description: "Failed to remove subject: " + e.message, variant: "destructive" });
            }
        }
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
                    <div className="grid gap-2">
                        <Label>Display Name</Label>
                        {isEditing ? (
                            <Input value={name} onChange={e => setName(e.target.value)} />
                        ) : (
                            <p className="text-sm font-medium">{profile.name}</p>
                        )}
                    </div>
                </div>

                {/* Goals */}
                <div className="grid gap-2">
                    <Label>Learning Goals</Label>
                    {isEditing ? (
                        <Textarea value={goals} onChange={e => setGoals(e.target.value)} rows={3} />
                    ) : (
                        <div className="space-y-1">
                            {profile.goals.length === 0 && <p className="text-sm text-muted-foreground italic">No goals set.</p>}
                            {profile.goals.map((g, i) => (
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
                                        onClick={() => m.id && handleRemoveSubject(m.id)}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

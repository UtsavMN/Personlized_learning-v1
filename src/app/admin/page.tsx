'use client';

import { useEffect, useState } from 'react';
import { getMasteryAction, getProfileAction, wipeAllDataAction, updateMasteryAction } from '@/app/actions/user';
import { getDocumentsAction } from '@/app/actions/documents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Trash2, Database, RefreshCw, Key, Shield, FileJson } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminPage() {
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(false);

    const [profile, setProfile] = useState<any[]>([]);
    const [mastery, setMastery] = useState<any[]>([]);
    const [timetable, setTimetable] = useState<any[]>([]);

    const refreshCounts = async () => {
        setIsLoading(true);
        const pRes = await getProfileAction('dev_utsav');
        const mRes = await getMasteryAction();
        const dRes = await getDocumentsAction();

        setCounts({
            profile: pRes.success ? 1 : 0,
            mastery: mRes.success ? mRes.mastery.length : 0,
            documents: dRes.success ? dRes.documents.length : 0
        });

        if (pRes.success) setProfile(pRes.profile ? [pRes.profile] : []);
        if (mRes.success) setMastery(mRes.mastery);
        setIsLoading(false);
    };

    useEffect(() => {
        refreshCounts();
    }, []);

    const handleNuclearWipe = async () => {
        if (!confirm("This will clear all user data in SQLite.")) return;

        setIsLoading(true);
        try {
            await wipeAllDataAction();
            alert("Database wiped. Reloading now...");
            window.location.href = '/';
        } catch (e: any) {
            alert("Wipe failed: " + e.message);
            setIsLoading(false);
        }
    };

    const handleForceOnboarding = async () => {
        if (!confirm("Wipe profile to force re-onboarding?")) return;
        await wipeAllDataAction(); // Simplest way
        toast({ title: "Profile Wiped", description: "Redirecting to Dashboard..." });
        setTimeout(() => window.location.href = '/', 1000);
    };

    const handleAddTestSubject = async () => {
        await updateMasteryAction('Test Subject', 'test-subject', 50, 0);
        toast({ title: "Added 'Test Subject'" });
        refreshCounts();
    };

    return (
        <div className="container mx-auto p-8 space-y-8 animate-in fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                        <Shield className="w-8 h-8 text-destructive" />
                        Admin Console
                    </h1>
                    <p className="text-muted-foreground">System diagnostics and emergency controls.</p>
                </div>
                <Button variant="outline" onClick={() => window.location.href = '/'}>
                    Back to App
                </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Control Center */}
                <div className="space-y-6">
                    <Card className="border-destructive/50 bg-destructive/5">
                        <CardHeader>
                            <CardTitle className="text-destructive flex items-center gap-2">
                                <Database className="w-5 h-5" />
                                Nuclear Options
                            </CardTitle>
                            <CardDescription>Emergency Reset Tools</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button variant="destructive" className="w-full" onClick={handleNuclearWipe} disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                DELETE ENTIRE DATABASE (Nuclear)
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                Use this if "Wipe Data" fails. It destroys the IndexedDB container itself.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="w-5 h-5" />
                                State Overrides
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="secondary" className="w-full justify-between" onClick={handleForceOnboarding}>
                                Force Re-Onboarding
                                <span className="text-xs bg-muted px-2 py-1 rounded">Clears Profile Only</span>
                            </Button>
                            <Button variant="outline" className="w-full justify-between" onClick={handleAddTestSubject}>
                                Inject Test Subject
                                <span className="text-xs bg-muted px-2 py-1 rounded">+1 Entry</span>
                            </Button>
                            <Button variant="outline" className="w-full justify-between" onClick={refreshCounts}>
                                Refresh Counters
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Inspector */}
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileJson className="w-5 h-5" />
                            Database Inspector
                        </CardTitle>
                        <CardDescription>Live view of local data tables.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden">
                        <Tabs defaultValue="stats" className="h-full flex flex-col">
                            <TabsList className="w-full justify-start">
                                <TabsTrigger value="stats">Stats</TabsTrigger>
                                <TabsTrigger value="profile">Profile ({profile?.length || 0})</TabsTrigger>
                                <TabsTrigger value="mastery">Mastery ({mastery?.length || 0})</TabsTrigger>
                                <TabsTrigger value="timetable">Timetable ({timetable?.length || 0})</TabsTrigger>
                            </TabsList>

                            <TabsContent value="stats" className="mt-4">
                                <ScrollArea className="h-[400px]">
                                    <div className="grid grid-cols-2 gap-4">
                                        {Object.entries(counts).map(([table, count]) => (
                                            <div key={table} className="p-4 border rounded bg-muted/20 flex justify-between items-center">
                                                <span className="font-mono text-sm">{table}</span>
                                                <span className="font-bold bg-primary/10 px-2 py-1 rounded">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="profile" className="flex-1 overflow-auto mt-4">
                                <pre className="text-xs font-mono bg-muted p-4 rounded overflow-auto max-h-[400px]">
                                    {JSON.stringify(profile, null, 2)}
                                </pre>
                            </TabsContent>

                            <TabsContent value="mastery" className="flex-1 overflow-auto mt-4">
                                <pre className="text-xs font-mono bg-muted p-4 rounded overflow-auto max-h-[400px]">
                                    {JSON.stringify(mastery, null, 2)}
                                </pre>
                            </TabsContent>

                            <TabsContent value="timetable" className="flex-1 overflow-auto mt-4">
                                <pre className="text-xs font-mono bg-muted p-4 rounded overflow-auto max-h-[400px]">
                                    {JSON.stringify(timetable, null, 2)}
                                </pre>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

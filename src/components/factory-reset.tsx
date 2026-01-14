'use client';

import { useState } from 'react';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function FactoryResetWidget() {
    const [isResetting, setIsResetting] = useState(false);

    const handleReset = async () => {
        if (!confirm("This will PERMANENTLY delete your profile, subjects, and study data. Documents will be kept. Are you sure?")) return;

        setIsResetting(true);
        try {
            console.log("Starting factory reset...");

            // 1. Explicitly Open DB if closed
            if (!db.isOpen()) await db.open();

            // 2. Clear tables in parallel for efficiency
            await Promise.all([
                db.learnerProfile.clear(),
                db.subjectMastery.clear(),
                db.timetable.clear(),
                db.analytics.clear(),
                db.quizResults.clear(),
                db.tasks.clear(),
                db.hobbies.clear(),
                db.chatHistory.clear(),
                db.questions.clear(), // Clear cached questions
                db.flashcardDecks.clear(),
                db.flashcards.clear()
            ]);

            // Do NOT clear documents or history to match "Safe Reset" description
            // await db.documents.clear(); 

            toast({ title: "Reset Complete", description: "All progress data wiped. Reloading..." });

            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (e: any) {
            console.error("Reset Fatal Error:", e);
            toast({ title: "Reset Failed", description: `Error: ${e.message}. Please try again.`, variant: "destructive" });
            setIsResetting(false);
        }
    };

    return (
        <Card className="border-destructive/20 bg-destructive/5 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-base text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Reset User Progress
                </CardTitle>
                <CardDescription className="text-xs">
                    Clear your stats (XP, Level, Subjects). Keeps dataset (Documents/Questions).
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={handleReset}
                    disabled={isResetting}
                >
                    {isResetting ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Trash2 className="h-3 w-3 mr-2" />}
                    Wipe Data & Restart
                </Button>
            </CardContent>
        </Card>
    );
}

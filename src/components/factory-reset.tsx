import React, { useState } from 'react';
import { wipeAllDataAction } from '@/app/actions/user';
import { toast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';

export function FactoryResetWidget() {
    const [isResetting, setIsResetting] = useState(false);

    const handleReset = async () => {
        if (!confirm("This will PERMANENTLY delete your profile, subjects, and study data. Documents will be kept. Are you sure?")) return;

        setIsResetting(true);
        try {
            const res = await wipeAllDataAction();
            if (res.success) {
                toast({ title: "Reset Complete", description: "All progress data wiped. Reloading..." });
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                throw new Error(res.error);
            }
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

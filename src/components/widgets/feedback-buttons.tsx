'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

export function FeedbackButtons({ recId }: { recId: string }) {
    const { toast } = useToast();
    const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem(`feedback_rec_${recId}`);
        if (stored) setFeedback(stored as 'up' | 'down');
    }, [recId]);

    const handleFeedback = (type: 'up' | 'down') => {
        setFeedback(type);
        localStorage.setItem(`feedback_rec_${recId}`, type);

        toast({
            title: "Reinforcement Signal Received",
            description: type === 'up'
                ? "Policy Updated: Reward +1.0 for this recommendation path."
                : "Policy Updated: Penalty -0.5. Adjusting exploration strategy.",
            duration: 3000,
            className: "bg-slate-900 text-white border-slate-700"
        });
    };

    if (feedback) {
        return (
            <span className="text-[10px] bg-muted px-2 py-1 rounded-full text-muted-foreground animate-in fade-in zoom-in">
                Feedback recorded.
            </span>
        )
    }

    return (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-green-600 hover:bg-green-50"
                onClick={() => handleFeedback('up')}
                title="Helpful (Reward)"
            >
                <ThumbsUp className="w-3 h-3" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                onClick={() => handleFeedback('down')}
                title="Not Helpful (Penalty)"
            >
                <ThumbsDown className="w-3 h-3" />
            </Button>
        </div>
    );
}

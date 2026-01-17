
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { runOnboardingChat } from '@/app/actions/onboarding';
import { useLocalAuth } from '@/lib/auth-context';
import { Loader2, Send } from 'lucide-react';

interface Message {
    role: 'user' | 'model';
    content: string;
}

export function OnboardingWizard({ onComplete }: { onComplete?: () => void }) {
    const { user } = useLocalAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial Greeting
    useEffect(() => {
        if (messages.length === 0) {
            handleSend([], true);
        }
    }, [messages.length]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = async (currentHistory: Message[] = messages, isInitial = false) => {
        if (!input.trim() && !isInitial) return;

        const userMsg: Message = { role: 'user', content: input };
        const newHistory = isInitial ? [] : [...currentHistory, userMsg];

        if (!isInitial) {
            setMessages(newHistory);
            setInput('');
        }

        setIsLoading(true);

        try {
            const response = await runOnboardingChat(newHistory);

            if (response.success && response.data) {
                const data = response.data as any;
                const aiMsg: Message = { role: 'model', content: data.nextMessage };
                setMessages([...newHistory, aiMsg]);

                if (data.isComplete && data.extractedProfile && user) {
                    // Save to SQLite
                    const p = data.extractedProfile;
                    const { updateProfileAction } = await import('@/app/actions/user');
                    await updateProfileAction(user.uid, {
                        name: p.name || user.displayName || 'Student',
                        learningStyle: p.learningStyle,
                        goals: JSON.stringify(p.goals || []),
                        interests: JSON.stringify([]), // Default
                        availableHoursPerWeek: p.availableHours || 10,
                        onboarded: true
                    });

                    // Callback to refresh dashboard
                    if (onComplete) onComplete();
                }
            }
        } catch (error) {
            console.error('Failed to chat:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto h-[600px] flex flex-col shadow-xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">👋</span>
                    Let's get to know you
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                    <div className="space-y-4">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-lg p-3 ${m.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                    }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-muted rounded-lg p-3">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="p-4 bg-muted/20">
                <form
                    className="flex w-full gap-2"
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                >
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your answer..."
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading || !input.trim()}>
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}

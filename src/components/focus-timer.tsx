'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Play, Pause, Square, Trophy, Flame, X } from 'lucide-react';
import { useGamification } from '@/hooks/use-gamification';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { toast } from '@/hooks/use-toast';

export function FocusTimer() {
    const [timeLeft, setTimeLeft] = useState(25 * 60); // Default 25m
    const [isActive, setIsActive] = useState(false);
    const [duration, setDuration] = useState(25);
    const [subject, setSubject] = useState('');
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const { addXP } = useGamification();
    const subjects = useLiveQuery(() => db.subjectMastery.toArray());

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            finishSession();
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive, timeLeft]);

    const startTimer = () => {
        if (!subject) {
            toast({ title: "Select a Subject", description: "What used to be studied?", variant: "destructive" });
            return;
        }
        setIsActive(true);
    };

    const pauseTimer = () => setIsActive(false);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(duration * 60);
    };

    const finishSession = async () => {
        setIsActive(false);
        if (intervalRef.current) clearInterval(intervalRef.current);

        // Award XP: 10 XP per minute focused
        const xp = duration * 10;

        await db.focusSessions.add({
            startTime: new Date(),
            durationMinutes: duration,
            subject: subject,
            completed: true,
            xpEarned: xp
        });

        addXP(xp, subject, `Completed ${duration}m Focus Session`);

        toast({
            title: "Focus Session Complete!",
            description: `You earned ${xp} XP in ${subject}.`,
            className: "bg-green-500 text-white"
        });

        // Reset
        setTimeLeft(duration * 60);
    };

    // Visualization
    const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Subject Selector */}
            <div className="w-full max-w-xs flex gap-4">
                <Select value={subject} onValueChange={setSubject} disabled={isActive}>
                    <SelectTrigger>
                        <SelectValue placeholder="Focus Subject" />
                    </SelectTrigger>
                    <SelectContent>
                        {subjects?.map(s => (
                            <SelectItem key={s.id} value={s.subject}>{s.subject}</SelectItem>
                        ))}
                        <SelectItem value="General">General Study</SelectItem>
                    </SelectContent>
                </Select>

                {isActive ? (
                    <div className="flex items-center justify-center h-10 px-3 py-2 text-sm font-medium border rounded-md bg-muted/50 w-[100px]">
                        {duration}m
                    </div>
                ) : (
                    <Select
                        value={duration.toString()}
                        onValueChange={(v) => {
                            if (v === "custom") {
                                // Use window.prompt for simplicity as per requirement to just add the option
                                // Ideally a Dialog, but keeping it light
                                setTimeout(() => {
                                    const custom = window.prompt("Enter duration in minutes:");
                                    if (custom && !isNaN(parseInt(custom))) {
                                        const d = Math.max(1, Math.min(180, parseInt(custom)));
                                        setDuration(d);
                                        setTimeLeft(d * 60);
                                    }
                                }, 100);
                            } else {
                                const d = parseInt(v);
                                setDuration(d);
                                setTimeLeft(d * 60);
                            }
                        }}
                    >
                        <SelectTrigger className="w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10m</SelectItem>
                            <SelectItem value="25">25m</SelectItem>
                            <SelectItem value="45">45m</SelectItem>
                            <SelectItem value="60">60m</SelectItem>
                            <SelectItem value="custom">Custom...</SelectItem>
                            {![10, 25, 45, 60].includes(duration) && (
                                <SelectItem value={duration.toString()} className="hidden">{duration}m</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* Timer Circle */}
            <div className="relative w-64 h-64 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="128"
                        cy="128"
                        r="120"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-muted/20"
                    />
                    <circle
                        cx="128"
                        cy="128"
                        r="120"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={753}
                        strokeDashoffset={753 - (753 * progress) / 100}
                        className={`transition-all duration-1000 ease-linear ${isActive ? 'text-primary' : 'text-primary/50'}`}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-6xl font-bold tabular-nums tracking-tighter">
                        {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                    </span>
                    <span className="text-sm text-muted-foreground uppercase tracking-widest mt-2">
                        {isActive ? 'Focusing...' : 'Ready'}
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6">
                {!isActive ? (
                    <Button size="lg" className="rounded-full w-16 h-16" onClick={startTimer}>
                        <Play className="w-6 h-6 fill-current ml-1" />
                    </Button>
                ) : (
                    <Button size="lg" variant="outline" className="rounded-full w-16 h-16 border-2" onClick={pauseTimer}>
                        <Pause className="w-6 h-6 fill-current" />
                    </Button>
                )}

                <Button size="icon" variant="ghost" className="rounded-full text-muted-foreground hover:text-destructive" onClick={resetTimer}>
                    <Square className="w-5 h-5 fill-current" />
                </Button>
            </div>

            {/* Stats / Motivation */}
            <div className="flex gap-8 text-center">
                <div>
                    <div className="text-2xl font-bold flex items-center justify-center gap-1 text-yellow-500">
                        <Trophy className="w-5 h-5" />
                        <span>{duration * 10}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">XP Value</p>
                </div>
                <div>
                    <div className="text-2xl font-bold flex items-center justify-center gap-1 text-orange-500">
                        <Flame className="w-5 h-5" />
                        <span>3</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Streak</p>
                </div>
            </div>

        </div>
    );
}

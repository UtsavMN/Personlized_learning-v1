'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Deck, Flashcard } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { calculateNextReview, INITIAL_CARD_STATE } from '@/lib/srs-algorithm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Plus, Brain, RotateCcw, Check, Sparkles } from 'lucide-react';


export function FlashcardsView() {
    const { toast } = useToast();
    const decks = useLiveQuery(() => db.flashcardDecks.toArray());
    const [selectedDeck, setSelectedDeck] = useState<number | null>(null);
    const [studyMode, setStudyMode] = useState(false);

    // Creation State
    const [isCreating, setIsCreating] = useState(false);
    const [newDeckName, setNewDeckName] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('General');
    const [selectedDocId, setSelectedDocId] = useState<string>('');
    const documents = useLiveQuery(() => db.documents.toArray());
    const masterySubjects = useLiveQuery(() => db.subjectMastery.toArray());

    const handleCreateDeck = async () => {
        if (!newDeckName) return;
        setIsCreating(true);
        try {
            // 1. Create Deck Entry
            const deckId = await db.flashcardDecks.add({
                title: newDeckName,
                subject: selectedSubject,
                documentId: selectedDocId,
                createdAt: Date.now()
            });

            // 2. Generate Cards via AI or Placeholder
            if (selectedDocId) {
                const doc = await db.documents.get(parseInt(selectedDocId));

                if (doc && doc.content) {
                    toast({ title: "Loading AI Model...", description: "This happens locally and may take a moment." });

                    // Dynamic import for client-side ML
                    const { generateFlashcardsLocal } = await import('@/lib/ai/local-flows');
                    const cards = await generateFlashcardsLocal(doc.content, 5);

                    if (cards && cards.length > 0) {
                        const cardsToAdd = cards.map(card => ({
                            deckId,
                            front: card.front,
                            back: card.back,
                            ...INITIAL_CARD_STATE,
                            nextReview: Date.now()
                        }));
                        await db.flashcards.bulkAdd(cardsToAdd as Flashcard[]);
                        toast({ title: "Success", description: `Generated ${cards.length} cards from ${doc.title}` });
                    } else {
                        throw new Error("AI returned no cards.");
                    }
                } else {
                    // Empty Deck (Manual) - Placeholder or No Content
                    await db.flashcards.add({
                        deckId,
                        front: "New Card (Edit me)",
                        back: "Answer goes here",
                        ...INITIAL_CARD_STATE,
                        nextReview: Date.now()
                    } as Flashcard);
                    if (doc) {
                        toast({ title: "Warning", description: "Document had no text. Created empty deck.", variant: "destructive" });
                    } else {
                        toast({ title: "Deck Created", description: "Created empty deck." });
                    }
                }

                setNewDeckName('');
                setSelectedDocId('');
            }
        } catch (e: any) {
            console.error(e);
            toast({ variant: "destructive", title: "Generation Error", description: e.message || "Failed to create deck" });
        } finally {
            setIsCreating(false);
        }
    };

    if (selectedDeck !== null) {
        return <StudySession deckId={selectedDeck} onExit={() => setSelectedDeck(null)} />;
    }

    return (
        <div className="h-full p-6 space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2">My Decks</h2>
                    <p className="text-muted-foreground">Spaced repetition for long-term memory.</p>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button><Plus className="w-4 h-4 mr-2" /> New Deck</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Flashcard Deck</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Deck Name</Label>
                                <Input value={newDeckName} onChange={e => setNewDeckName(e.target.value)} placeholder="e.g. Physics Ch1" />
                            </div>
                            <div className="space-y-2">
                                <Label>Subject</Label>
                                <select
                                    className="w-full p-2 border rounded-md bg-background"
                                    value={selectedSubject}
                                    onChange={e => setSelectedSubject(e.target.value)}
                                >
                                    <option value="General">General</option>
                                    {masterySubjects?.map(s => (
                                        <option key={s.id} value={s.subject}>{s.subject}</option>
                                    ))}
                                    <option value="Math">Math</option>
                                    <option value="Physics">Physics</option>
                                    <option value="History">History</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Source Document (Optional)</Label>
                                <select
                                    className="w-full p-2 border rounded-md bg-background"
                                    value={selectedDocId}
                                    onChange={e => setSelectedDocId(e.target.value)}
                                >
                                    <option value="">None (Empty Deck)</option>
                                    {documents?.map(doc => (
                                        <option key={doc.id} value={doc.id}>{doc.title}</option>
                                    ))}
                                </select>
                            </div>
                            <Button onClick={handleCreateDeck} disabled={!newDeckName || isCreating} className="w-full">
                                {isCreating ? <Loader2 className="animate-spin" /> : "Create Deck"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {decks?.map(deck => (
                    <Card key={deck.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedDeck(deck.id!)}>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                {deck.title}
                                <Badge variant="outline"><Brain className="w-3 h-3 mr-1" /> SRS</Badge>
                            </CardTitle>
                            <CardDescription>{deck.subject}</CardDescription>
                        </CardHeader>
                        <CardFooter className="text-xs text-muted-foreground">
                            Last reviewed: Never
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function StudySession({ deckId, onExit }: { deckId: number, onExit: () => void }) {
    const { toast } = useToast();
    const deck = useLiveQuery(() => db.flashcardDecks.get(deckId));
    const cards = useLiveQuery(() => db.flashcards.where('deckId').equals(deckId).toArray());
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0, startTime: Date.now() });

    if (!cards) return <div className="p-10 text-center"><Loader2 className="animate-spin inline" /> Loading cards...</div>;
    if (cards.length === 0) return (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
            <p>This deck is empty.</p>
            <Button onClick={onExit}>Back</Button>
        </div>
    );

    const currentCard = cards[currentIndex];

    const handleRate = async (quality: number) => {
        // Update Stats
        setSessionStats(prev => ({
            ...prev,
            total: prev.total + 1,
            correct: quality >= 3 ? prev.correct + 1 : prev.correct
        }));

        // Calculate new state
        const newState = calculateNextReview(quality, {
            interval: currentCard.interval || 0,
            repetition: currentCard.repetition || 0,
            easeFactor: currentCard.easeFactor || 2.5
        });

        // Update DB
        await db.flashcards.update(currentCard.id!, {
            ...newState,
            nextReview: Date.now() + (newState.interval * 24 * 60 * 60 * 1000)
        });

        // Next card logic
        setIsFlipped(false);

        if (currentIndex < cards.length - 1) {
            setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
        } else {
            // End of Deck
            // ---------------- SYNC WITH STUDY MANAGER ----------------
            const durationSeconds = Math.round((Date.now() - sessionStats.startTime) / 1000);
            const finalScore = Math.round(((sessionStats.correct + (quality >= 3 ? 1 : 0)) / (sessionStats.total + 1)) * 100);

            import('@/lib/ai/study-manager').then(({ studyManager }) => {
                if (deck && deck.subject) {
                    studyManager.completeSession({
                        subject: deck.subject,
                        activityType: 'flashcards',
                        durationSeconds,
                        scorePercent: finalScore,
                        itemsReviewed: cards.length
                    });
                }
            });
            // ---------------------------------------------------------

            toast({ title: "Session Complete!", description: `Score: ${finalScore}%. Updated AI Models.` });
            onExit();
        }
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-6 max-w-2xl mx-auto">
            <div className="w-full flex justify-between items-center mb-6">
                <Button variant="ghost" onClick={onExit}>Exit</Button>
                <div className="text-sm text-muted-foreground">
                    Card {currentIndex + 1} of {cards.length}
                </div>
            </div>

            <div
                className="w-full aspect-video perspective-1000 cursor-pointer mb-8"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                    {/* Front */}
                    <Card className="absolute w-full h-full backface-hidden flex items-center justify-center text-center text-2xl font-medium p-6">
                        <div className="w-full h-full overflow-y-auto flex items-center justify-center">
                            <p className="max-h-full w-full break-words">{currentCard.front}</p>
                        </div>
                    </Card>

                    {/* Back */}
                    <Card className="absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center text-center text-xl bg-muted/20 border-primary/20 p-6">
                        <div className="w-full h-full overflow-y-auto flex items-center justify-center">
                            <p className="max-h-full w-full break-words">{currentCard.back}</p>
                        </div>
                    </Card>
                </div>
            </div>

            {isFlipped ? (
                <div className="grid grid-cols-4 gap-2 w-full">
                    <Button variant="outline" className="border-red-200 hover:bg-red-100 dark:hover:bg-red-900/20" onClick={() => handleRate(1)}>
                        Forgot
                    </Button>
                    <Button variant="outline" className="border-orange-200 hover:bg-orange-100 dark:hover:bg-orange-900/20" onClick={() => handleRate(3)}>
                        Hard
                    </Button>
                    <Button variant="outline" className="border-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/20" onClick={() => handleRate(4)}>
                        Good
                    </Button>
                    <Button variant="outline" className="border-green-200 hover:bg-green-100 dark:hover:bg-green-900/20" onClick={() => handleRate(5)}>
                        Easy
                    </Button>
                </div>
            ) : (
                <Button className="w-full h-12 text-lg" onClick={() => setIsFlipped(true)}>
                    Show Answer
                </Button>
            )}
        </div>
    );
}

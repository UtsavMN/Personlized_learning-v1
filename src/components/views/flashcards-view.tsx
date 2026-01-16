'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Deck, Flashcard } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { useDelete } from '@/hooks/use-delete';
import { calculateNextReview, INITIAL_CARD_STATE } from '@/lib/srs-algorithm';
import { Button } from '@/components/ui/button';
import { generateFlashcardsLocal } from '@/lib/ai/local-flows';
import { webLLM } from '@/lib/ai/llm-engine';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Plus, Brain, RotateCcw, Check, Sparkles, X, Layers, Play, StickyNote, Zap, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NotesView } from './notes-view';

export function FlashcardsView() {
    const { toast } = useToast();
    const decks = useLiveQuery(() => db.flashcardDecks.toArray());
    const [selectedDeck, setSelectedDeck] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState('flashcards');

    // Creation State
    const [isCreating, setIsCreating] = useState(false);
    const [newDeckName, setNewDeckName] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('General');
    const [selectedDocId, setSelectedDocId] = useState<string>('');
    const documents = useLiveQuery(() => db.documents.toArray());
    const masterySubjects = useLiveQuery(() => db.subjectMastery.toArray());

    // Local AI State
    const [isLoadingModel, setIsLoadingModel] = useState(false);
    const [modelProgress, setModelProgress] = useState('');

    const handleCreateDeck = async () => {
        if (!newDeckName) return;
        setIsCreating(true);
        try {
            const deckId = await db.flashcardDecks.add({
                title: newDeckName,
                subject: selectedSubject,
                documentId: selectedDocId,
                createdAt: Date.now()
            });

            if (selectedDocId) {
                const docIdNum = parseInt(selectedDocId);
                const doc = await db.documents.get(docIdNum);

                if (doc) {
                    // Initialize Local Brain
                    setIsLoadingModel(true);
                    await webLLM.init((report) => {
                        setModelProgress(report.text);
                    });

                    toast({ title: "Brain Activated", description: "Analyzing document..." });

                    // Fetch chunks for this document
                    const chunks = await db.chunks.where('documentId').equals(docIdNum).toArray();

                    let contextContent: string = '';

                    if (chunks && chunks.length > 0) {
                        // Pick 5 random chunks
                        const shuffled = chunks.sort(() => 0.5 - Math.random());
                        contextContent = shuffled.slice(0, 15).map(c => c.content).join('\n\n');
                    } else {
                        // Fallback
                        contextContent = doc.content || doc.description || '';
                    }

                    if (contextContent.length > 0) {
                        const flashcards = await generateFlashcardsLocal(contextContent, 5);

                        if (flashcards.length > 0) {
                            const cardsToAdd = flashcards.map((card) => ({
                                deckId,
                                front: card.front,
                                back: card.back,
                                ...INITIAL_CARD_STATE,
                                nextReview: Date.now()
                            }));
                            await db.flashcards.bulkAdd(cardsToAdd as Flashcard[]);
                            toast({ title: "Success", description: `Generated ${flashcards.length} cards locally` });
                        }
                    } else {
                        toast({ title: "Generation Skipped", description: "No content found." });
                    }
                }
                setNewDeckName('');
                setSelectedDocId('');
            } else {
                // Empty content handling
                await db.flashcards.add({
                    deckId,
                    front: "Edit this card",
                    back: "Add the answer here",
                    ...INITIAL_CARD_STATE,
                    nextReview: Date.now()
                } as Flashcard);
                toast({ title: "Deck Created", description: "Created empty deck (no content found)." });
            }

            setNewDeckName('');
            setSelectedDocId('');
        } catch (e: any) {
            toast({ variant: "destructive", title: "Error", description: "Failed to create deck: " + e.message });
        } finally {
            setIsCreating(false);
            setIsLoadingModel(false);
            setModelProgress('');
        }
    };

    const { deleteItem } = useDelete();

    const handleDeleteDeck = (id: number) => {
        if (!id) return;
        deleteItem(async () => {
            await db.transaction('rw', db.flashcardDecks, db.flashcards, async () => {
                await db.flashcardDecks.delete(id);
                await db.flashcards.where('deckId').equals(id).delete();
            });
        }, { successMessage: 'Deck Deleted' });
    };

    if (selectedDeck !== null) {
        return <StudySession deckId={selectedDeck} onExit={() => setSelectedDeck(null)} />;
    }

    return (
        <div className="h-full p-2 md:p-6 space-y-6 flex flex-col">

            {/* Header / Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 p-8 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-white/20 dark:border-white/5 backdrop-blur-xl shadow-xl shrink-0">
                <div className="space-y-4 w-full">
                    <div className="flex justify-between items-start w-full">
                        <div>
                            <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400 mb-2">
                                <Sparkles className="w-5 h-5" />
                                <span className="font-semibold tracking-wide uppercase text-xs">Learning Engine</span>
                            </div>
                            <h2 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-300 dark:to-purple-300">
                                Pulse
                            </h2>
                            <p className="text-muted-foreground mt-2 max-w-lg">
                                Your central hub for active recall and knowledge management.
                            </p>
                        </div>
                        {/* Action Buttons based on Tab */}
                        {activeTab === 'flashcards' && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button size="lg" className="rounded-full shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 text-white">
                                        <Plus className="w-5 h-5 mr-2" /> CREATE DECK
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>New Knowledge Deck</DialogTitle>
                                        <DialogDescription>
                                            Create a new flashcard deck to start studying.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Deck Name</Label>
                                            <Input value={newDeckName} onChange={e => setNewDeckName(e.target.value)} placeholder="e.g. Quantum Physics" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Subject</Label>
                                            <select className="w-full p-2.5 text-sm border rounded-lg bg-background"
                                                value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                                                <option value="General">General</option>
                                                {masterySubjects?.map(s => <option key={s.id} value={s.subject}>{s.subject}</option>)}
                                                <option value="Math">Math</option>
                                                <option value="Science">Science</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Source Material (AI Generation)</Label>
                                            <select className="w-full p-2.5 text-sm border rounded-lg bg-background"
                                                value={selectedDocId} onChange={e => setSelectedDocId(e.target.value)}>
                                                <option value="">Manual Entry (No AI)</option>
                                                {documents?.map(doc => <option key={doc.id} value={doc.id}>{doc.title}</option>)}
                                            </select>
                                        </div>
                                        <Button onClick={handleCreateDeck} disabled={!newDeckName || isCreating} className="w-full h-auto py-3 flex flex-col gap-1">
                                            {isCreating ? (
                                                <>
                                                    <div className="flex items-center gap-2">
                                                        <Loader2 className="animate-spin w-4 h-4" />
                                                        <span>{isLoadingModel ? "Initializing Brain..." : "Generating..."}</span>
                                                    </div>
                                                    {modelProgress && (
                                                        <span className="text-[10px] opacity-70 truncate max-w-[200px]">{modelProgress}</span>
                                                    )}
                                                </>
                                            ) : "Create Deck"}
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="bg-background/50 backdrop-blur-md border p-1 rounded-full">
                            <TabsTrigger value="flashcards" className="rounded-full px-6 data-[state=active]:bg-indigo-100 dark:data-[state=active]:bg-indigo-900/30 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-300">
                                <Zap className="w-4 h-4 mr-2" /> Flashcards
                            </TabsTrigger>
                            <TabsTrigger value="notes" className="rounded-full px-6 data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-300">
                                <StickyNote className="w-4 h-4 mr-2" /> Notes
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'flashcards' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
                        {decks?.map(deck => (
                            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }} key={deck.id}>
                                <Card className="group relative overflow-hidden border-0 bg-card/50 hover:bg-card/80 transition-colors shadow-sm hover:shadow-xl rounded-2xl cursor-pointer h-full" onClick={() => setSelectedDeck(deck.id!)}>

                                    {/* Decorative background element */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500 ease-in-out" />

                                    <CardHeader>
                                        <div className="flex justify-between items-start mb-2">
                                            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">{deck.subject}</Badge>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-muted-foreground hover:text-destructive z-10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteDeck(deck.id!);
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                                <Layers className="w-5 h-5 text-muted-foreground/50" />
                                            </div>
                                        </div>
                                        <CardTitle className="text-xl font-bold leading-tight">{deck.title}</CardTitle>
                                        <CardDescription className="line-clamp-2">
                                            Adaptive SRS deck
                                        </CardDescription>
                                    </CardHeader>
                                    <CardFooter className="mt-auto pt-4 border-t border-border/50">
                                        <div className="flex items-center text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
                                            <Play className="w-4 h-4 mr-2 fill-current" />
                                            Start Session
                                        </div>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <NotesView />
                )}
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

    if (!cards) return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    if (cards.length === 0) return <div className="h-full flex flex-col items-center justify-center"><p className="text-lg text-muted-foreground mb-4">Deck is empty.</p><Button onClick={onExit}>Back</Button></div>;

    const currentCard = cards[currentIndex];
    const progress = ((currentIndex) / cards.length) * 100;

    const handleRate = async (quality: number) => {
        setSessionStats(prev => ({
            ...prev,
            total: prev.total + 1,
            correct: quality >= 3 ? prev.correct + 1 : prev.correct
        }));

        const newState = calculateNextReview(quality, {
            interval: currentCard.interval || 0,
            repetition: currentCard.repetition || 0,
            easeFactor: currentCard.easeFactor || 2.5
        });

        await db.flashcards.update(currentCard.id!, {
            ...newState,
            nextReview: Date.now() + (newState.interval * 24 * 60 * 60 * 1000)
        });

        setIsFlipped(false);
        if (currentIndex < cards.length - 1) {
            setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
        } else {
            const finalScore = Math.round(((sessionStats.correct + (quality >= 3 ? 1 : 0)) / (sessionStats.total + 1)) * 100);
            // Import dynamically to avoid hydration issues if StudyManager uses browser APIs heavily on init
            import('@/lib/ai/study-manager').then(({ studyManager }) => {
                if (deck?.subject) {
                    studyManager.completeSession({
                        subject: deck.subject,
                        activityType: 'flashcards',
                        durationSeconds: Math.round((Date.now() - sessionStats.startTime) / 1000),
                        scorePercent: finalScore,
                        itemsReviewed: cards.length
                    });
                }
            });
            toast({ title: "Session Complete", description: `You scored ${finalScore}%` });
            onExit();
        }
    };

    return (
        <div className="h-full flex flex-col max-w-4xl mx-auto p-4 md:p-8 animate-in zoom-in-95 duration-300">
            {/* Header / Progress */}
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={onExit} className="rounded-full hover:bg-secondary">
                    <X className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                    <div className="flex justify-between text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                        <span>Progress</span>
                        <span>{currentIndex + 1} / {cards.length}</span>
                    </div>
                    <Progress value={progress} className="h-2 rounded-full" />
                </div>
            </div>

            {/* Flashcard Area */}
            <div className="flex-1 flex flex-col items-center justify-center perspective-1000 mb-8 min-h-[400px]">
                <div
                    className="relative w-full max-w-2xl aspect-[1.6/1] preserve-3d transition-all duration-700 ease-in-out-back cursor-pointer group"
                    style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    {/* Front Face */}
                    <div className="absolute inset-0 backface-hidden rounded-[2rem] shadow-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center p-8 md:p-12 text-center group-hover:scale-[1.02] transition-transform">
                        <span className="absolute top-8 left-8 text-xs font-bold text-muted-foreground uppercase tracking-widest">Question</span>
                        <div className="w-full max-h-full overflow-y-auto custom-scrollbar">
                            <p className="text-2xl md:text-4xl font-medium leading-relaxed break-words">{currentCard.front}</p>
                        </div>
                        <div className="absolute bottom-6 text-sm text-muted-foreground font-medium animate-pulse">Click to flip</div>
                    </div>

                    {/* Back Face */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-[2rem] shadow-2xl bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/30 dark:to-zinc-900 border border-indigo-100 dark:border-indigo-900/50 flex flex-col items-center justify-center p-8 md:p-12 text-center">
                        <span className="absolute top-8 left-8 text-xs font-bold text-indigo-500 uppercase tracking-widest">Answer</span>
                        <div className="w-full max-h-full overflow-y-auto custom-scrollbar">
                            <p className="text-xl md:text-3xl font-medium leading-relaxed text-indigo-900 dark:text-indigo-100 break-words">{currentCard.back}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="h-24">
                <AnimatePresence mode="wait">
                    {isFlipped ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                            className="grid grid-cols-4 gap-4 w-full max-w-2xl mx-auto"
                        >
                            <Button variant="outline" className="h-14 flex flex-col gap-1 border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20" onClick={(e) => { e.stopPropagation(); handleRate(1); }}>
                                <span className="font-bold">Again</span>
                                <span className="text-[10px] uppercase opacity-60">&lt; 1m</span>
                            </Button>
                            <Button variant="outline" className="h-14 flex flex-col gap-1 border-orange-200 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/20" onClick={(e) => { e.stopPropagation(); handleRate(3); }}>
                                <span className="font-bold">Hard</span>
                                <span className="text-[10px] uppercase opacity-60">2d</span>
                            </Button>
                            <Button variant="outline" className="h-14 flex flex-col gap-1 border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20" onClick={(e) => { e.stopPropagation(); handleRate(4); }}>
                                <span className="font-bold">Good</span>
                                <span className="text-[10px] uppercase opacity-60">5d</span>
                            </Button>
                            <Button variant="outline" className="h-14 flex flex-col gap-1 border-green-200 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20" onClick={(e) => { e.stopPropagation(); handleRate(5); }}>
                                <span className="font-bold">Easy</span>
                                <span className="text-[10px] uppercase opacity-60">8d</span>
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex justify-center"
                        >
                            <Button size="lg" className="px-12 h-14 text-lg rounded-full shadow-lg hover:shadow-xl transition-all" onClick={() => setIsFlipped(true)}>
                                Show Answer
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

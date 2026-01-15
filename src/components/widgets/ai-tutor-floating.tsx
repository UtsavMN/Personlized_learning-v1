'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChatView } from '@/components/views/chat-view';
import { Bot, MessageCircle, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';

export function AITutorFloating() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="mb-4 pointer-events-auto shadow-2xl rounded-2xl overflow-hidden border border-border"
                    >
                        <Card className="w-[400px] h-[600px] max-h-[80vh] flex flex-col shadow-none border-0 glass-panel">
                            {/* Header for the Bubble */}
                            <div className="flex items-center justify-between p-3 border-b bg-muted/50 backdrop-blur-md">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                                    <span className="font-semibold text-sm">AI Tutor</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 rounded-full hover:bg-destructive/20 hover:text-destructive"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>

                            {/* Chat View Wrapper */}
                            <div className="flex-1 overflow-hidden bg-background/95 backdrop-blur-sm">
                                {/* We pass a prop or context if we want to modify ChatView style, but for now standard view */}
                                <ChatView isFloating={true} />
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="pointer-events-auto">
                <Button
                    size="lg"
                    className={`h-14 w-14 rounded-full shadow-xl transition-all duration-300 ${isOpen ? 'rotate-90 bg-muted text-muted-foreground' : 'bg-gradient-to-tr from-purple-600 to-blue-600 hover:scale-110'}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? (
                        <X className="w-6 h-6" />
                    ) : (
                        <Bot className="w-8 h-8 text-white" />
                    )}
                </Button>
            </div>
        </div>
    );
}

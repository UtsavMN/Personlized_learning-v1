'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { webLLM, ChatMessage as LLMMessage } from '@/lib/ai/llm-engine';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/components/chat-message';
import { Loader2, Send, Trash2, Cpu, Download, BookText } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '../ui/label';

const formSchema = z.object({
  query: z.string().min(1, 'Please enter a question.'),
  documentId: z.string().min(1, 'Please select a document.'),
});

export function ChatView({ isFloating = false }: { isFloating?: boolean }) {
  const [mode, setMode] = useState<'local' | 'cloud'>('local');
  // Initialize from global state to fix sync issue
  const [isModelReady, setIsModelReady] = useState(webLLM.isLoaded);
  const [initProgress, setInitProgress] = useState(0);
  const [initText, setInitText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Dexie Data
  const documents = useLiveQuery(() => db.documents.toArray());
  const messages = useLiveQuery(() => db.chatHistory.orderBy('createdAt').toArray());

  // Auto-scroll ref
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isGenerating]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { query: '', documentId: '' },
  });

  // Initialize Model on Mount (or on demand)
  const initializeModel = async () => {
    try {
      await webLLM.init((report) => {
        setInitProgress(report.progress * 100);
        setInitText(report.text);
      });
      setIsModelReady(true);
    } catch (e) {
      console.error("Model Load Failed", e);
    }
  };

  const clearChat = async () => {
    await db.chatHistory.clear();
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Check if initializing local model
    if (mode === 'local' && !isModelReady) {
      await initializeModel();
    }

    setIsGenerating(true);

    // Save User Message
    await db.chatHistory.add({
      role: 'user',
      content: values.query,
      createdAt: new Date(),
      documentId: Number(values.documentId)
    });

    const doc = documents?.find(d => d.id === Number(values.documentId));
    // const context = doc?.content ? doc.content.slice(0, 15000) : ""; // OLD

    let context = "";
    if (doc) {
      if (doc.processed && doc.id) {
        const { DocumentApi } = await import('@/lib/document-engine/api');
        context = await DocumentApi.getFullText(doc.id);
      } else {
        context = doc.content || "";
      }
    }
    // Truncate for V1 Context Limit
    context = context.slice(0, 15000);

    try {
      let fullResponse = "";

      if (mode === 'local') {
        // ---------------- LOCAL MODE (WebLLM) ----------------
        const systemMsg = `You are a helpful AI tutor. Use the following document context to answer the user's question.
            If the answer isn't in the context, say "I don't know based on this document."
            
            Context:
            ${context || "No specific document context provided."}`;

        const conversationHistory: LLMMessage[] = [
          { role: 'system', content: systemMsg },
          { role: 'user', content: values.query }
        ];

        await webLLM.chat(conversationHistory, (chunk) => {
          fullResponse += chunk;
        });

      } else {
        // ---------------- CLOUD MODE (Gemini) ----------------
        const documentsArray = context ? [context] : [];
        const apiResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: values.query,
            documents: documentsArray,
          }),
        });

        if (!apiResponse.ok) {
          const err = await apiResponse.json().catch(() => ({}));
          throw new Error(err.error || `Server Error: ${apiResponse.statusText}`);
        }

        const response = await apiResponse.json();
        fullResponse = response.answer || "No response received.";
      }

      // Save Assistant Response
      await db.chatHistory.add({
        role: 'assistant',
        content: fullResponse,
        createdAt: new Date(),
        documentId: Number(values.documentId)
      });

      form.setValue('query', '');

    } catch (e: any) {
      console.error(e);
      await db.chatHistory.add({
        role: 'assistant',
        content: "Error: " + e.message,
        createdAt: new Date()
      });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className={isFloating ? "flex flex-col h-full" : "grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 h-full"}>
      <Card className={`h-full flex flex-col shadow-lg border-2 border-primary/10 ${isFloating ? 'border-0 shadow-none' : 'lg:col-span-2'}`}>
        {!isFloating && (
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
            <div className="flex flex-col space-y-1.5">
              <CardTitle className="flex items-center gap-2">
                <BookText className="w-5 h-5 text-primary" />
                AI Tutor
                {!webLLM.isLoaded && (
                  <span className="text-xs font-normal text-destructive bg-destructive/10 px-2 py-0.5 rounded ml-2">
                    Offline Model Not Ready
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Running Llama-3-8B directly in your browser (WebGPU).
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={clearChat} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </CardHeader>
        )}

        {/* content area */}
        <CardContent className="flex-grow flex flex-col gap-4 p-0">
          {/* Messages Area */}
          <ScrollArea className="flex-grow h-[400px] p-6">
            <div className="space-y-6">
              {messages?.map((message, index) => (
                <div key={index} ref={index === messages.length - 1 ? scrollRef : null}>
                  <ChatMessage role={message.role} content={message.content} />
                </div>
              ))}

              {isGenerating && (
                <div className="flex items-center space-x-2 pl-4">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <span className="text-sm text-muted-foreground">AI is typing...</span>
                </div>
              )}

              {(!messages || messages.length === 0) && (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50 space-y-4">
                  <Cpu className="w-12 h-12" />
                  <p className="text-sm text-center px-4">Ready to help using {mode === 'local' ? 'WebGPU' : 'Cloud'}.</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 bg-background border-t">
            {/* Model Loading Indicator */}
            {mode === 'local' && !isModelReady && (
              <div className="mb-4 p-4 rounded-lg bg-secondary/50 border border-secondary text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Model Required
                  </span>
                  <span className="text-xs text-muted-foreground">{Math.round(initProgress)}%</span>
                </div>
                {initProgress > 0 && <Progress value={initProgress} className="h-2" />}
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="documentId"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Context..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {documents?.map((doc) => (
                                <SelectItem key={doc.id} value={String(doc.id)}>{doc.title}</SelectItem>
                              ))}
                              <SelectItem value="none">No Context</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <Select value={mode} onValueChange={(v: 'local' | 'cloud') => setMode(v)}>
                      <SelectTrigger className="w-[80px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">Local</SelectItem>
                        <SelectItem value="cloud">Cloud</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" type="button" onClick={clearChat} className="h-8 w-8 text-muted-foreground hover:text-destructive" title="Clear Chat">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>


                  <FormField
                    control={form.control}
                    name="query"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative flex items-center gap-2">
                            <Input
                              placeholder="Ask anything..."
                              {...field}
                              className="pr-10"
                              disabled={isGenerating}
                              autoComplete="off"
                            />
                            <Button
                              type="submit"
                              size="icon"
                              disabled={isGenerating}
                              className={`absolute right-1 top-1 h-8 w-8 ${mode === 'local' && !isModelReady ? "animate-pulse" : ""}`}
                            >
                              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>

      {/* Sidebar Info - Hidden in Floating Mode */}
      {!isFloating && (
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Mode</span>
                <span className="font-mono bg-muted px-2 py-1 rounded capitalize">{mode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <span className={`px-2 py-1 rounded font-medium ${isModelReady || mode === 'cloud' ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'}`}>
                  {mode === 'local' ? (isModelReady ? 'Ready' : 'Standby') : 'Online'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

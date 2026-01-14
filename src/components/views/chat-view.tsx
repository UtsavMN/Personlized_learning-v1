'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { citedQuestionAnswering, type CitedQuestionAnsweringOutput } from '@/ai/flows/cited-question-answering';
import { summarizeHeadings } from '@/ai/flows/summarize-headings';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RightPanel } from '@/components/right-panel';
import { ChatMessage } from '@/components/chat-message';
import { Loader2, Send, Trash2 } from 'lucide-react';
import type { ConfidenceLevel } from '../confidence-meter';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from '../ui/label';

const formSchema = z.object({
  query: z.string().min(1, 'Please enter a question.'),
  documentId: z.string().min(1, 'Please select a document.'),
});

export function ChatView() {
  const [aiResponse, setAiResponse] = useState<CitedQuestionAnsweringOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sources, setSources] = useState<{ id: number; content: string }[]>([]);
  const [confidence, setConfidence] = useState<ConfidenceLevel>('high');

  // Load documents and messages from local storage
  const documents = useLiveQuery(() => db.documents.toArray());
  const messages = useLiveQuery(() => db.chatHistory.orderBy('createdAt').toArray());

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: '',
      documentId: '',
    },
  });

  const clearChat = async () => {
    await db.chatHistory.clear();
    setSources([]);
    setAiResponse(null);
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setAiResponse(null);

    // 1. Save User Message
    await db.chatHistory.add({
      role: 'user',
      content: values.query,
      createdAt: new Date(),
      documentId: Number(values.documentId)
    });

    const selectedDocument = documents?.find(doc => doc.id === Number(values.documentId));

    if (!selectedDocument) {
      await db.chatHistory.add({
        role: 'assistant',
        content: 'Could not find the selected document.',
        createdAt: new Date()
      });
      setIsLoading(false);
      return;
    }

    // Use the extracted content from Dexie
    // Truncate to avoid hitting token limits (approx 20k chars per doc)
    const MAX_SHARD_SIZE = 20000;
    const rawContent = selectedDocument.content || "";
    const truncatedContent = rawContent.length > MAX_SHARD_SIZE
      ? rawContent.substring(0, MAX_SHARD_SIZE) + "\n...[Content Truncated due to size limits]"
      : rawContent;

    const documentsArray = [truncatedContent];

    // For UI simplicity in this version, sources are just the full doc content
    const mockSources = documentsArray.map((doc, index) => ({ id: index + 1, content: doc }));
    setSources(mockSources);

    try {
      const headingKeywords = ['heading', 'headings', 'topic headings', 'topics', 'outline'];
      const isHeadingRequest = headingKeywords.some(k => values.query.toLowerCase().includes(k));
      let answer = "";

      if (isHeadingRequest) {
        const headingsResp = await summarizeHeadings({ query: values.query, documents: documentsArray });
        const content = headingsResp.headings && headingsResp.headings.length > 0
          ? headingsResp.headings.map((h: string) => `- ${h}`).join('\n')
          : "No headings could be generated.";

        answer = content;

      } else {
        // Direct API call to our new route
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

        const isUncertain = response.answer.toLowerCase().includes("i don't know");
        setConfidence(isUncertain ? 'low' : 'high');
        setAiResponse(response);
        answer = response.answer;
      }

      // 2. Save Assistant Message
      await db.chatHistory.add({
        role: 'assistant',
        content: answer,
        createdAt: new Date(),
        documentId: Number(values.documentId)
      });

    } catch (error: any) {
      console.error("Chat Error:", error);
      await db.chatHistory.add({
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message || 'Unknown error'}. Please check if your API key is configured correctly.`,
        createdAt: new Date()
      });
      setConfidence('low');
    } finally {
      setIsLoading(false);
      form.setValue('query', ''); // Clear input
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 h-full">
      <Card className="lg:col-span-2 h-full flex flex-col shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex flex-col space-y-1.5">
            <CardTitle className="font-headline">Cited Question Answering</CardTitle>
            <CardDescription>Ask a question based on your local documents.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={clearChat}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Chat
          </Button>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col gap-4">
          <ScrollArea className="flex-grow pr-4 -mr-4 h-96 border rounded-md p-4">
            <div className="space-y-4">
              {messages?.map((message, index) => (
                <ChatMessage key={index} role={message.role} content={message.content} />
              ))}
              {isLoading && (
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-muted rounded-full animate-pulse">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </div>
                  <p className="text-sm text-muted-foreground">Thinking...</p>
                </div>
              )}
              {messages?.length === 0 && !isLoading && (
                <div className="text-center text-muted-foreground py-10">
                  No messages yet. Select a document and ask a question!
                </div>
              )}
            </div>
          </ScrollArea>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="documentId"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Select a Document</Label>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a document" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {documents?.length === 0 ? (
                            <SelectItem value="none" disabled>No documents uploaded</SelectItem>
                          ) : (
                            documents?.map((doc) => (
                              <SelectItem key={doc.id} value={String(doc.id)}>{doc.title}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="query"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Your Question</Label>
                      <FormControl>
                        <div className="relative" suppressHydrationWarning>
                          <Input placeholder="Ask your question..." {...field} className="pr-12" suppressHydrationWarning />
                          <Button
                            type="submit"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                            disabled={isLoading}
                            suppressHydrationWarning
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <RightPanel sources={sources} confidence={confidence} />
    </div>
  );
}

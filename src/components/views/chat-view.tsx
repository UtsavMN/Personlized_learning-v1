'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { citedQuestionAnswering, type CitedQuestionAnsweringOutput } from '@/ai/flows/cited-question-answering';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { RightPanel } from '@/components/right-panel';
import { ChatMessage } from '@/components/chat-message';
import { Loader2, Send } from 'lucide-react';
import type { ConfidenceLevel } from '../confidence-meter';

const formSchema = z.object({
  query: z.string().min(1, 'Please enter a question.'),
  documents: z.string().min(1, 'Please provide some documents for context.'),
});

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiResponse, setAiResponse] = useState<CitedQuestionAnsweringOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sources, setSources] = useState<{ id: number; content: string }[]>([]);
  const [confidence, setConfidence] = useState<ConfidenceLevel>('high');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: '',
      documents: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setAiResponse(null);

    const userMessage: Message = { role: 'user', content: values.query };
    setMessages((prev) => [...prev, userMessage]);

    const documentsArray = values.documents.split('\n').filter(doc => doc.trim() !== '');
    
    const mockSources = documentsArray.map((doc, index) => ({ id: index + 1, content: doc }));
    setSources(mockSources);

    try {
      const response = await citedQuestionAnswering({
        query: values.query,
        documents: documentsArray,
      });

      const isUncertain = response.answer.toLowerCase().includes("i don't know");
      setConfidence(isUncertain ? 'low' : 'high');
      
      const assistantMessage: Message = { role: 'assistant', content: response.answer };
      setMessages((prev) => [...prev, assistantMessage]);
      setAiResponse(response);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
      setConfidence('low');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 h-full">
      <Card className="lg:col-span-2 h-full flex flex-col shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Cited Question Answering</CardTitle>
          <CardDescription>Ask a question based on the provided documents. The AI will answer and cite its sources.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col gap-4">
          <ScrollArea className="flex-grow pr-4 -mr-4 h-96 border rounded-md p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
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
            </div>
          </ScrollArea>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="documents"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Paste source documents here, one per line..."
                        className="resize-none h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Input placeholder="Ask your question..." {...field} className="pr-12"/>
                        <Button
                          type="submit"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                          disabled={isLoading}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>

      <RightPanel sources={sources} confidence={confidence} />
    </div>
  );
}

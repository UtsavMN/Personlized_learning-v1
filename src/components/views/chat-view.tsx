'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chatAction } from '@/app/actions/chat-new';
import { Loader2, Send, Calculator, Code2, Bot, User, Eraser } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm Mentora. I can help you with **General** questions, solve **Math** problems step-by-step, or write **Code**. \n\nSelect a mode below to start!", timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'general' | 'math' | 'code'>('general');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: Date.now() }]);
    setIsLoading(true);

    try {
      const result = await chatAction(userMsg, mode);

      if (result.success && result.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: result.response, timestamp: Date.now() }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: result.error || "Sorry, I encountered an error. Please try again.", timestamp: Date.now() }]);
      }

    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Network error. Please check your connection.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm rounded-xl border shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b bg-muted/20">
        <Button
          variant={mode === 'general' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setMode('general')}
          className="gap-2"
        >
          <Bot className="w-4 h-4" /> General
        </Button>
        <Button
          variant={mode === 'math' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setMode('math')}
          className="gap-2 text-blue-600 dark:text-blue-400"
        >
          <Calculator className="w-4 h-4" /> Math Tutor
        </Button>
        <Button
          variant={mode === 'code' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setMode('code')}
          className="gap-2 text-purple-600 dark:text-purple-400"
        >
          <Code2 className="w-4 h-4" /> Coding Expert
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" onClick={() => setMessages([])} title="Clear Chat">
          <Eraser className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth" ref={scrollRef}>
        {messages.map((m, idx) => (
          <div key={idx} className={cn("flex gap-3 max-w-[85%]", m.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
              m.role === 'user' ? "bg-primary text-primary-foreground" : "bg-white dark:bg-zinc-800 border"
            )}>
              {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5 text-blue-500" />}
            </div>
            <div className={cn(
              "rounded-2xl p-4 text-sm shadow-sm leading-relaxed",
              m.role === 'user'
                ? "bg-primary text-primary-foreground"
                : "bg-white dark:bg-zinc-800 border"
            )}>
              {/* Simple Markdown Rendering */}
              <div className="prose dark:prose-invert max-w-none text-sm break-words">
                <ReactMarkdown>
                  {m.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            </div>
            <div className="bg-white dark:bg-zinc-800 border rounded-2xl p-4 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-background/50 backdrop-blur-md">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${mode === 'math' ? 'a math problem...' : mode === 'code' ? 'about code...' : 'anything...'}`}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

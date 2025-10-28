'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { codeExecutorAndExplainer, type CodeExecutorAndExplainerOutput } from '@/ai/flows/code-executor-and-explainer';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Terminal } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

const formSchema = z.object({
  code: z.string().min(1, 'Please enter some code.'),
  query: z.string().min(1, 'Please enter a query about the code.'),
});

export function CodeView() {
  const [result, setResult] = useState<CodeExecutorAndExplainerOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: 'print("Hello, NIE!")',
      query: 'What does this python code do?',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await codeExecutorAndExplainer(values);
      setResult(response);
    } catch (error) {
      console.error(error);
      setResult({ executionResult: 'An error occurred.', explanation: 'Could not process the request.' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 h-full">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Code Executor &amp; Explainer</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code Snippet</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter your code here..." className="h-48 font-code" {...field} />
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
                    <FormLabel>Query</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Explain this code." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Terminal className="mr-2 h-4 w-4" />}
                Run &amp; Explain
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Output</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[28rem] pr-2">
             {isLoading && (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            {result && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold font-headline mb-2">Execution Result:</h4>
                  <pre className="text-sm whitespace-pre-wrap font-code bg-muted p-4 rounded-md">{result.executionResult}</pre>
                </div>
                <div>
                  <h4 className="font-semibold font-headline mb-2">Explanation:</h4>
                  <div className="text-sm text-foreground p-3 bg-muted rounded-md space-y-2">
                    <p>{result.explanation}</p>
                  </div>
                </div>
              </div>
            )}
             {!isLoading && !result && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                The output will appear here.
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { mathProblemSolver, type MathProblemSolverOutput } from '@/ai/flows/math-problem-solver';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

const formSchema = z.object({
  problem: z.string().min(3, 'Please enter a math problem.'),
  courseMaterials: z.string().min(10, 'Please provide some course materials for context.'),
});

export function MathView() {
  const [result, setResult] = useState<MathProblemSolverOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      problem: '',
      courseMaterials: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await mathProblemSolver(values);
      setResult(response);
    } catch (error) {
      console.error(error);
      setResult({ solution: 'An error occurred while solving the problem.', citations: 'N/A' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 h-full">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Math Problem Solver</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="problem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Math Problem</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Solve for x in 2x + 5 = 15" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="courseMaterials"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Materials (for citations)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., From calculus textbook page 45, the power rule is d/dx(x^n) = nx^(n-1)..." className="h-32" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Solve Problem
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Solution</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 pr-2">
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            {result && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold font-headline mb-2">Step-by-step Solution:</h4>
                  <pre className="text-sm whitespace-pre-wrap font-code bg-muted p-4 rounded-md">{result.solution}</pre>
                </div>
                <div>
                  <h4 className="font-semibold font-headline mb-2">Citations:</h4>
                  <div className="text-sm text-foreground p-3 bg-muted rounded-md space-y-2">
                    <p>{result.citations}</p>
                  </div>
                </div>
              </div>
            )}
            {!isLoading && !result && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                The solution will appear here.
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { timetableConflictResolver, type TimetableConflictResolverOutput } from '@/ai/flows/timetable-conflict-resolver';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Send, FileWarning } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const MAX_FILE_SIZE = 500000; // 500kb
const ACCEPTED_FILE_TYPES = ['text/calendar', 'text/csv'];

const formSchema = z.object({
  scheduleConflictDescription: z.string().min(10, 'Please describe the conflict in detail.'),
  timetablePolicyDocument: z.string().min(10, 'Please paste the relevant policy text.'),
  studentTimetableFile: z
    .any()
    .refine((files) => files?.length == 1, 'Timetable file is required.')
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 500KB.`)
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      '.ics and .csv files are accepted.'
    ),
});

export function TimetableView() {
  const [result, setResult] = useState<TimetableConflictResolverOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scheduleConflictDescription: '',
      timetablePolicyDocument: '',
    },
  });

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const file = values.studentTimetableFile[0];
      const studentTimetableDataUri = await fileToDataUri(file);

      const response = await timetableConflictResolver({
        scheduleConflictDescription: values.scheduleConflictDescription,
        timetablePolicyDocument: values.timetablePolicyDocument,
        studentTimetableDataUri,
      });
      setResult(response);
    } catch (err) {
      console.error(err);
      setError('An error occurred while processing your request.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 h-full">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Timetable Conflict Resolver</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="scheduleConflictDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conflict Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., My CS101 lab conflicts with the tech fest on Wednesday..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timetablePolicyDocument"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timetable Policy Document</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Paste the text of the timetable policy rules here..." className="h-24" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="studentTimetableFile"
                render={({ field: { onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Your Timetable File (.ics or .csv)</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        accept=".ics,.csv"
                        onChange={(e) => onChange(e.target.files)}
                        {...fieldProps}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Resolve Conflict
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Resolution Options</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[32rem] pr-2">
            {isLoading && <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
            {error && <Alert variant="destructive"><FileWarning className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
            {result && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold font-headline mb-2">Suggested Resolutions:</h4>
                  {result.resolutionOptions?.length > 0 ? (
                    <ul className="list-disc list-inside space-y-2 text-sm bg-muted p-4 rounded-md">
                      {result.resolutionOptions.map((opt, i) => <li key={i}>{opt}</li>)}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No resolution options could be generated based on the provided information.</p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold font-headline mb-2">Relevant Policies:</h4>
                   {result.policyCitations?.length > 0 ? (
                    <ul className="list-disc list-inside space-y-2 text-sm bg-muted p-4 rounded-md">
                      {result.policyCitations.map((cite, i) => <li key={i}>{cite}</li>)}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No relevant policies found.</p>
                  )}
                </div>
              </div>
            )}
            {!isLoading && !result && !error && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Resolution options will appear here.
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

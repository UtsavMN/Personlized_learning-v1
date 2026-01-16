'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileUp, FileText, Trash2, Download, CloudUpload, FileType, Sparkles, MessageSquare, Scan } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { summarizeDocumentAction } from '@/app/actions/ai';
import { useDelete } from '@/hooks/use-delete';
import dynamic from 'next/dynamic';

const SmartScanner = dynamic(() => import('../smart-scanner').then(mod => mod.SmartScanner), {
  ssr: false,
  loading: () => null
});

const ACCEPTED_FILE_TYPES = ['application/pdf'];

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().optional(),
  subject: z.string().min(1, 'Subject is required.'),
  documentFile: z
    .any()
    .refine((files): files is FileList => files instanceof FileList && files.length > 0, 'PDF file is required.')
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files[0]?.type),
      'Only .pdf files are accepted.'
    )
    .refine(
      (files) => files[0]?.size <= 50 * 1024 * 1024,
      'Max file size is 50MB.'
    ),
});

export function DocumentView() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedDocForScan, setSelectedDocForScan] = useState<any | null>(null);

  // Live query from Dexie
  const documents = useLiveQuery(() => db.documents.toArray());
  const documentsLoading = !documents;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      subject: '',
      documentFile: undefined,
    },
  });

  const fileRef = form.register("documentFile");

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsUploading(true);
      const file = data.documentFile[0];

      toast({
        title: "Processing Document...",
        description: "Analyzing structure, images, and content."
      });

      // Import the new engine dynamically
      const { ingestDocument } = await import('@/lib/ai/rag-pipeline');

      // Perform Ingestion
      const result = await ingestDocument(file, Date.now()); // Using Date.now() as temp ID before saving doc? 
      // Actually we should save doc first to get ID, or update ID strategy. 
      // Local Dexie uses auto-increment.

      // Let's safe doc first to get ID
      const docId = await db.documents.add({
        title: data.title || file.name.replace('.pdf', ''),
        subject: data.subject,
        description: data.description || '',
        content: '', // Will be filled? Or we stick to chunks?
        file: file,
        createdAt: new Date(),
        size: file.size,
        type: file.type,
        processed: true // Mark as processed by RAG
      });

      // Now Ingest with real ID
      await ingestDocument(file, docId);

      // Metadata already saved above

      toast({
        title: 'Document Intelligence Ready',
        description: 'Deep analysis complete. Structure and figures extracted.',
      });

      form.reset();

    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'An error occurred while uploading.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const { deleteItem } = useDelete();

  const handleDelete = (id: number) => {
    deleteItem(async () => await db.documents.delete(id), {
      successMessage: 'Document deleted',
      confirmMessage: 'Are you sure you want to delete this document?'
    });
  };

  const handleDownload = (doc: any) => {
    if (doc.file) {
      const url = URL.createObjectURL(doc.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.title + '.pdf';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      form.setValue("documentFile", e.dataTransfer.files);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Upload Section */}
      <Card className="lg:col-span-1 border-muted/60 shadow-md h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="w-5 h-5 text-primary" />
            Upload Materials
          </CardTitle>
          <CardDescription>Add PDFs (max 50MB) to your local library.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Physics Chapter 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Tag</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Physics" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Brief summary..." className="resize-none h-20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="documentFile"
                render={() => (
                  <FormItem>
                    <FormLabel>File</FormLabel>
                    <FormControl>
                      <div
                        className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${dragActive || form.watch('documentFile')?.length > 0 ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <Input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          id="file-upload"
                          {...fileRef}
                        />
                        <label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer w-full h-full">
                          <CloudUpload className={`w-8 h-8 mb-2 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                          <p className="text-sm font-medium">
                            {form.watch('documentFile')?.length > 0 ? form.watch('documentFile')[0].name : "Drag PDF here or click to browse"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">PDF up to 50MB</p>
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isUploading} className="w-full shadow-lg">
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                Save Document Locally
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Library Grid */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Library</h2>
          <span className="text-sm text-muted-foreground">{documents?.length || 0} items</span>
        </div>

        <ScrollArea className="h-[calc(100vh-12rem)] pr-2">
          {documentsLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Loading library...</p>
            </div>
          ) : documents && documents.length > 0 ? (
            <div className="space-y-8 pb-8">
              {Object.entries(
                (documents || []).reduce((acc, doc) => {
                  const subj = doc.subject || 'Uncategorized';
                  if (!acc[subj]) acc[subj] = [];
                  acc[subj].push(doc);
                  return acc;
                }, {} as Record<string, typeof documents>)
              ).map(([subject, docs]) => (
                <div key={subject} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold border-l-4 border-primary pl-3">{subject}</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{docs.length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {docs.map((doc) => (
                      <Card key={doc.id} className="group hover:shadow-md transition-shadow border-muted/60">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 pb-2">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                              <FileType className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="grid gap-1">
                              <h3 className="font-semibold text-sm leading-none truncate max-w-[150px]" title={doc.title}>{doc.title}</h3>
                              <p className="text-xs text-muted-foreground capitalize">{doc.subject}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                            onClick={() => doc.id && handleDelete(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardHeader>
                        <CardContent className="p-4 pt-2">
                          <p className="text-xs text-muted-foreground line-clamp-2 h-8">
                            {doc.description || "No description provided."}
                          </p>
                        </CardContent>
                        <CardFooter className="p-2 bg-muted/30 flex justify-between items-center gap-1">
                          <span className="text-[10px] text-muted-foreground px-2">
                            {(doc.size / 1024 / 1024).toFixed(1)} MB
                          </span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                              onClick={async () => {
                                toast({ title: "Summarizing...", description: "Asking AI to summarize this document." });
                                if (doc.content) {
                                  const res = await summarizeDocumentAction(doc.content.substring(0, 1500)); // Limit for speed and to respect API limits
                                  if (res.success && res.summary) {
                                    alert(res.summary); // Simple alert for now, TODO: Modal
                                    // Update description
                                    if (doc.id) {
                                      await db.documents.update(doc.id, { description: res.summary });
                                      toast({ title: "Updated", description: "Document description updated with AI summary." });
                                    }
                                  } else {
                                    toast({ variant: "destructive", title: "Error", description: res.error });
                                  }
                                } else {
                                  toast({ variant: "destructive", title: "No Content", description: "Document content is empty." });
                                }
                              }}
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              Summarize
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                              onClick={() => {
                                if (doc.file) {
                                  setSelectedDocForScan(doc);
                                } else {
                                  toast({ variant: "destructive", title: "Unavailable", description: "Original file not found for scanning." });
                                }
                              }}
                            >
                              <Scan className="h-3 w-3 mr-1" />
                              Scan
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => handleDownload(doc)}>
                              <Download className="h-3 w-3 mr-1" />
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl bg-muted/10 text-muted-foreground">
              <FileUp className="h-12 w-12 mb-4 opacity-20" />
              <h3 className="font-semibold text-lg">No documents yet</h3>
              <p className="text-sm max-w-sm text-center">Upload your course materials to start generating flashcards and quizzes.</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Smart Analysis Dialog */}
      {
        selectedDocForScan && (
          <SmartScanner
            isOpen={!!selectedDocForScan}
            onClose={() => setSelectedDocForScan(null)}
            file={selectedDocForScan.file}
            title={selectedDocForScan.title}
          />
        )
      }
    </div >
  );
}

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  docId: number | null;
  docTitle: string;
}

export function SummaryDialog({ isOpen, onClose, docId, docTitle }: SummaryDialogProps) {
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      // Reset state when dialog closes
      setSummary('');
      setError(null);
      setCopied(false);
    }
  }, [isOpen]);

  const loadSummary = async () => {
    if (!docId) return;

    setIsLoading(true);
    setError(null);
    setSummary('');

    try {
      const { getDocumentAction } = await import('@/app/actions/documents');
      const res = await getDocumentAction(docId);

      if (!res.success || !res.document) {
        throw new Error(res.error || 'Document not found');
      }

      const doc = res.document;

      // Check for pre-computed summary
      if (doc.summary) {
        setSummary(doc.summary);
        setIsLoading(false);
        return;
      }

      const fullText = doc.content;

      if (!fullText || fullText.trim().length === 0) {
        setError('Document has no extractable content. Please ensure it is indexed.');
        setIsLoading(false);
        return;
      }

      // Call server action with the text
      const { summarizeFullDocumentAction } = await import('@/app/actions/ai');
      const result = await summarizeFullDocumentAction(fullText);

      if (result.success && result.summary) {
        setSummary(result.summary);
      } else {
        setError(result.error || 'Failed to generate summary');
      }
    } catch (err: any) {
      console.error('Error loading summary:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!summary) return;

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Summary copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Failed to copy',
        description: 'Could not copy summary to clipboard',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Document Summary
          </DialogTitle>
          <DialogDescription>
            Comprehensive summary of: <span className="font-semibold">{docTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full py-12 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <Loader2 className="relative h-10 w-10 animate-spin text-primary" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">Generating summary...</p>
                <p className="text-xs text-muted-foreground">Analyzing document content with AI</p>
                <div className="flex items-center justify-center gap-1 pt-2">
                  <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}

          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="text-center space-y-4">
                <p className="text-destructive font-medium">Failed to generate summary</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button onClick={loadSummary} variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {summary && !isLoading && (
            <ScrollArea className="h-full pr-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {summary.split('\n').map((line, index) => {
                    // Format headings (lines that are short and end without punctuation)
                    if (line.trim().length > 0 && line.trim().length < 80 && !line.trim().endsWith('.') && !line.trim().endsWith(',')) {
                      return (
                        <h3 key={index} className="font-semibold text-base mt-4 mb-2 text-foreground">
                          {line}
                        </h3>
                      );
                    }
                    return (
                      <p key={index} className="mb-3 text-muted-foreground">
                        {line || '\u00A0'}
                      </p>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          )}

          {!summary && !error && !isLoading && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Click "Generate Summary" to create a comprehensive summary of this document.
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 gap-2">
          {summary && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          )}
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
          {!summary && !isLoading && (
            <Button onClick={loadSummary} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generate Summary
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

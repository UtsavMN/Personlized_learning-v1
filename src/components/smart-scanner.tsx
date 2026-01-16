'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Eye, Scan, Type, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { classifyImageAction, ocrImageAction } from '@/app/actions/ai';
import { useToast } from '@/hooks/use-toast';

// Ensure worker is configured
if (typeof window !== 'undefined' && 'GlobalWorkerOptions' in pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface SmartScannerProps {
    isOpen: boolean;
    onClose: () => void;
    file: File | Blob;
    title: string;
}

export function SmartScanner({ isOpen, onClose, file, title }: SmartScannerProps) {
    const { toast } = useToast();
    const [numPages, setNumPages] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [thumbnails, setThumbnails] = useState<string[]>([]);
    const [analyzingMap, setAnalyzingMap] = useState<Record<number, string>>({}); // pageIndex -> status
    const [resultsMap, setResultsMap] = useState<Record<number, { type?: string; text?: string }>>({});

    useEffect(() => {
        if (isOpen && file) {
            loadDocument();
        }
    }, [isOpen, file]);

    const loadDocument = async () => {
        setLoading(true);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            setNumPages(pdf.numPages);

            // OPTIMIZATION: Only render first 8 pages to avoid freezing on large PDFs
            const pagesToRender = Math.min(pdf.numPages, 8);
            const thumbs: string[] = [];

            for (let i = 1; i <= pagesToRender; i++) {
                try {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 0.4 }); // Reduced scale for faster thumbnailing
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    if (context) {
                        await page.render({ canvasContext: context, viewport }).promise;
                        thumbs.push(canvas.toDataURL());
                    }
                } catch (pageErr) {
                    console.warn(`Failed to render page ${i}`, pageErr);
                    thumbs.push(""); // Placeholder for failed page
                }
            }
            setThumbnails(thumbs);
            if (pdf.numPages > pagesToRender) {
                toast({ title: "Large Document", description: `Showing first ${pagesToRender} pages for performance.` });
            }
        } catch (error) {
            console.error("Failed to load PDF", error);
            toast({ variant: "destructive", title: "Load Failed", description: "Could not render document." });
        } finally {
            setLoading(false);
        }
    };

    const getPageBlob = async (pageIndex: number): Promise<Blob | null> => {
        // Re-render page at higher quality for analysis
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const page = await pdf.getPage(pageIndex + 1);
            const viewport = page.getViewport({ scale: 1.5 }); // Analysis scale
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (context) {
                await page.render({ canvasContext: context, viewport }).promise;
                return new Promise((resolve) => canvas.toBlob(blob => resolve(blob)));
            }
        } catch (e) {
            console.error(e);
        }
        return null;
    };

    const handleClassify = async (index: number) => {
        setAnalyzingMap(prev => ({ ...prev, [index]: 'classifying' }));
        try {
            const blob = await getPageBlob(index);
            if (!blob) throw new Error("Failed to render page image");

            const formData = new FormData();
            formData.append('file', blob);

            const result = await classifyImageAction(formData);
            if (result.success && result.label) {
                setResultsMap(prev => ({
                    ...prev,
                    [index]: { ...prev[index], type: result.label }
                }));
                toast({ title: "Classification Complete", description: `Detected: ${result.label}` });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Classification failed" });
        } finally {
            setAnalyzingMap(prev => ({ ...prev, [index]: '' }));
        }
    };

    const handleOCR = async (index: number) => {
        setAnalyzingMap(prev => ({ ...prev, [index]: 'ocr' }));
        try {
            const blob = await getPageBlob(index);
            if (!blob) throw new Error("Failed to render page image");

            const formData = new FormData();
            formData.append('file', blob);

            const result = await ocrImageAction(formData);
            if (result.success && result.text) {
                setResultsMap(prev => ({
                    ...prev,
                    [index]: { ...prev[index], text: result.text }
                }));
                toast({ title: "OCR Complete", description: "Text extracted successfully" });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "OCR failed" });
        } finally {
            setAnalyzingMap(prev => ({ ...prev, [index]: '' }));
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <Scan className="w-5 h-5 text-indigo-500" />
                        Smart Vision Scanner
                    </DialogTitle>
                    <DialogDescription>
                        Analyze visuals and extract text from {title}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden bg-muted/10">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <ScrollArea className="h-full px-6 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {thumbnails.map((src, idx) => (
                                    <div key={idx} className="space-y-3 bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        {/* Image Display */}
                                        <div className="relative aspect-[3/4] bg-zinc-100 dark:bg-zinc-900 border-b">
                                            <img src={src} alt={`Page ${idx + 1}`} className="w-full h-full object-contain" />
                                            <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
                                                Page {idx + 1}
                                            </div>

                                            {/* Status Overlay */}
                                            {analyzingMap[idx] && (
                                                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center text-white font-medium">
                                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                                    {analyzingMap[idx] === 'ocr' ? 'Reading Text...' : 'Classifying...'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="p-3 space-y-3">
                                            {/* Results */}
                                            {resultsMap[idx] && (
                                                <div className="text-xs space-y-1 p-2 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-900/20">
                                                    {resultsMap[idx].type && (
                                                        <div className="flex items-center text-indigo-700 dark:text-indigo-300">
                                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                                            Type: <strong>{resultsMap[idx].type}</strong>
                                                        </div>
                                                    )}
                                                    {resultsMap[idx].text && (
                                                        <div className="flex items-start text-zinc-600 dark:text-zinc-400">
                                                            <Type className="w-3 h-3 mr-1 mt-0.5 shrink-0" />
                                                            <span className="line-clamp-2" title={resultsMap[idx].text}>
                                                                {resultsMap[idx].text}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-2">
                                                <Button
                                                    variant="outline" size="sm"
                                                    className="w-full text-xs"
                                                    disabled={!!analyzingMap[idx]}
                                                    onClick={() => handleClassify(idx)}
                                                >
                                                    <Eye className="w-3 h-3 mr-1.5" />
                                                    Classify
                                                </Button>
                                                <Button
                                                    variant="outline" size="sm"
                                                    className="w-full text-xs"
                                                    disabled={!!analyzingMap[idx]}
                                                    onClick={() => handleOCR(idx)}
                                                >
                                                    <Type className="w-3 h-3 mr-1.5" />
                                                    TrOCR
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

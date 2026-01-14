'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/30">
                    <div className="flex flex-col items-center text-center space-y-4 max-w-md">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <AlertTriangle className="h-8 w-8" />
                        </div>
                        <h1 className="text-2xl font-bold">Something went wrong</h1>
                        <p className="text-muted-foreground">
                            {this.state.error?.message || "An unexpected error occurred."}
                        </p>
                        <div className="flex gap-2">
                            <Button onClick={() => window.location.reload()}>
                                Reload Page
                            </Button>
                            <Button variant="outline" onClick={() => window.location.href = '/'}>
                                Go Home
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

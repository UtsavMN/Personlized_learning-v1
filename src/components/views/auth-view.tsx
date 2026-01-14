'use client';

import { SignIn } from '@clerk/nextjs';
import { GraduationCap } from 'lucide-react';

export function AuthView() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/30">
            <div className="mb-8 flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg mb-4">
                    <GraduationCap className="h-6 w-6" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">NIE Campus Guide</h1>
                <p className="text-muted-foreground mt-2">Sign in with your institutional account</p>
            </div>

            <SignIn
                routing="hash"
                appearance={{
                    elements: {
                        rootBox: "mx-auto",
                        card: "shadow-lg border-muted/60"
                    }
                }}
            />
        </div>
    );
}

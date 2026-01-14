'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useClerk } from "@clerk/nextjs";
import { db } from "@/lib/db";

export interface LocalUser {
    uid: string;
    displayName: string | null;
    email: string | null;
    password?: string;
    photoURL: string | null;
}

interface AuthContextType {
    user: LocalUser | null;
    isUserLoading: boolean;
    login: (email: string, password?: string) => Promise<void>;
    register: (name: string, email: string, password?: string) => Promise<void>;
    logout: () => void;
    needsOnboarding: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>({
    user: null,
    isUserLoading: true,
    login: async () => { },
    register: async () => { },
    logout: () => { },
    needsOnboarding: false,
});

export function LocalAuthProvider({ children }: { children: React.ReactNode }) {
    const { user: clerkUser, isLoaded } = useUser();
    const { signOut, openSignIn, openSignUp } = useClerk();
    const [user, setUser] = useState<LocalUser | null>(null);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);

    const USE_DEV_AUTH = true; // TOGGLE THIS FOR DEV MODE

    const [isDevLoading, setIsDevLoading] = useState(true);

    useEffect(() => {
        const syncUser = async () => {
            if (USE_DEV_AUTH) {
                // Dev/Offline Mode Logic
                const devUser: LocalUser = {
                    uid: 'dev_utsav',
                    displayName: 'Utsav (Dev)',
                    email: 'utsav@dev.local',
                    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Utsav',
                };
                setUser(devUser);

                // Check Dexie with dev ID
                try {
                    const profile = await db.learnerProfile.where('userId').equals('dev_utsav').first();
                    // If no profile, we need onboarding.
                    // If profile exists, we are good.
                    setNeedsOnboarding(!profile);
                } catch (e) {
                    console.error("Dev Profile check failed", e);
                } finally {
                    setIsDevLoading(false);
                }
                return;
            }

            if (clerkUser) {
                const newUser: LocalUser = {
                    uid: clerkUser.id,
                    displayName: clerkUser.fullName || clerkUser.firstName || 'Student',
                    email: clerkUser.primaryEmailAddress?.emailAddress || null,
                    photoURL: clerkUser.imageUrl,
                };
                setUser(newUser);

                // Check if profile exists in Dexie
                try {
                    const count = await db.learnerProfile.where('userId').equals(clerkUser.id).count();
                    setNeedsOnboarding(count === 0);
                } catch (e) {
                    console.error("Profile check failed", e);
                }
            } else {
                setUser(null);
                setNeedsOnboarding(false);
            }
        };

        if (isLoaded || USE_DEV_AUTH) {
            syncUser();
        }
    }, [clerkUser, isLoaded]);

    const login = async () => {
        if (USE_DEV_AUTH) {
            window.location.reload();
            return;
        }
        await openSignIn();
    }
    const register = async () => {
        if (USE_DEV_AUTH) return;
        await openSignUp();
    }
    const logout = async () => {
        if (USE_DEV_AUTH) {
            if (confirm("Exit Dev Mode?")) {
                // Nothing to do really, just reload
                window.location.reload();
            }
            return;
        }
        await signOut();
    }

    const effectiveLoading = USE_DEV_AUTH ? isDevLoading : !isLoaded;

    return (
        <AuthContext.Provider value={{ user, isUserLoading: effectiveLoading, login, register, logout, needsOnboarding }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useLocalAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useLocalAuth must be used within a LocalAuthProvider');
    }
    return context;
}

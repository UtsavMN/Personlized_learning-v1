'use client';

import { useAuth, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GraduationCap, LogIn, LogOut, AlertCircle } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

function UserNav() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setAuthError(null);
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      const errorCode = error?.code;
      const errorMessage = error?.message || 'Unknown error';
      
      if (errorCode === 'auth/configuration-not-found') {
        setAuthError('Firebase authentication is not configured. Please see FIREBASE_AUTH_SETUP.md for setup instructions.');
      } else if (errorCode === 'auth/popup-blocked') {
        setAuthError('Login popup was blocked. Please allow popups and try again.');
      } else if (errorCode === 'auth/operation-not-supported-in-this-environment') {
        setAuthError('Google Sign-In is not available in this environment.');
      } else {
        setAuthError(`Login error: ${errorMessage}`);
      }
      
      console.error('Error signing in with Google:', error);
    }
  };

  const handleLogout = async () => {
    try {
      setAuthError(null);
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  if (isUserLoading) {
    return <div className="h-9 w-24 rounded-md animate-pulse bg-muted" />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-end gap-2">
        {authError && (
          <Alert variant="destructive" className="mb-2 w-80">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        )}
        <Button onClick={handleLogin}>
          <LogIn className="mr-2 h-4 w-4" />
          Login with Google
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? ''} />
            <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  return (
    <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold font-headline text-foreground">
              NIE Campus Guide
            </h1>
          </div>
          <UserNav />
        </div>
      </div>
    </header>
  );
}

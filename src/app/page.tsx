
'use client';

import React, { useState } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '@/firebase'; // Correct path
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LogIn, Pill, Loader2, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
   const router = useRouter();
   const [isGuestLoading, setIsGuestLoading] = useState(false);
   const { toast } = useToast();

   // Middleware will redirect authenticated users trying to access '/' to '/dashboard'.
   // So, this content is primarily for unauthenticated users.

   const handleGuestLogin = async () => {
     setIsGuestLoading(true);
     console.log("[Landing Page] Guest login initiated.");
     try {
       await signInAnonymously(auth);
       // Firebase automatically handles the session.
       // Middleware should detect the new session on next navigation and redirect to /dashboard.
       // Explicit redirect here can sometimes race with middleware or auth state propagation.
       // Forcing a hard navigation to a known protected route like /dashboard helps ensure middleware kicks in.
       console.log("[Landing Page] Guest login successful with Firebase. Attempting to navigate to /dashboard to trigger middleware/auth checks.");
       toast({ title: 'Guest Login Successful', description: 'Redirecting to dashboard...' });
       router.push('/dashboard'); // Navigate to dashboard, AuthProvider and middleware will handle the rest
     } catch (error: any) {
       console.error("[Landing Page] Guest Login Error:", error);
       toast({ title: 'Guest Login Failed', description: error.message, variant: 'destructive' });
     } finally {
       setIsGuestLoading(false);
       console.log("[Landing Page] Guest login finished.");
     }
   };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <Card className="panel-primary w-full max-w-md text-center animate-fadeIn">
            <CardHeader>
                <div className="flex justify-center mb-4">
                <Pill className="w-12 h-12 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold">Welcome to MediSync Pro</CardTitle>
                <CardDescription>Your integrated solution for medical management and clinical support.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-muted-foreground">Please log in or sign up to access your dashboard.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/auth/login">
                    <LogIn className="mr-2 h-4 w-4" /> Login
                    </Link>
                </Button>
                <Button variant="outline" asChild className="w-full sm:w-auto">
                    <Link href="/auth/signup">
                        Sign Up
                    </Link>
                </Button>
                </div>
                <div className="mt-4 flex items-center">
                  <div className="flex-grow border-t border-border"></div>
                  <span className="mx-2 text-xs text-muted-foreground">OR</span>
                  <div className="flex-grow border-t border-border"></div>
                </div>
                <Button variant="outline" className="w-full mt-2 flex justify-center items-center" onClick={handleGuestLogin} disabled={isGuestLoading}>
                   {isGuestLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                   {isGuestLoading ? 'Joining as Guest...' : <><UserIcon className="mr-2 h-4 w-4" /> Continue as Guest</>}
                </Button>
            </CardContent>
            </Card>
        </div>
    );
}
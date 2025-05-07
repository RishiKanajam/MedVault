
'use client';

import React, { useState } from 'react'; // Import useState
import { signInAnonymously } from 'firebase/auth'; // Import signInAnonymously
import { auth } from '@/firebase'; // Import auth
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LogIn, Pill, Loader2, User as UserIcon } from 'lucide-react'; // Added UserIcon
import Link from 'next/link';
// Note: This page is NOT wrapped by AuthProvider, so useAuth() won't work here
// to get auth state. Redirection for already logged-in users trying to access
import { useToast } from '@/hooks/use-toast'; // Import useToast
// this page will primarily be handled by the middleware.
// Client-side checks here would require a separate, minimal auth state check if desired.

export default function Home() {
   const router = useRouter();

   // This page assumes it's public.
   const [isGuestLoading, setIsGuestLoading] = useState(false);
   const { toast } = useToast();

   const handleGuestLogin = async () => {
     setIsGuestLoading(true);
     try {
       await signInAnonymously(auth);
       // Firebase automatically handles the session, middleware redirects to /dashboard
     } catch (error: any) {
       toast({ title: 'Guest Login Failed', description: error.message, variant: 'destructive' });
     } finally {
       setIsGuestLoading(false);
     }
   };
   // Middleware will redirect authenticated users trying to access '/' to '/dashboard'.
   // So, this content is primarily for unauthenticated users.

   // If we still want a client-side check for robustness (e.g., if middleware is bypassed or for faster UX):
   // We'd need a way to check auth state without the full AuthProvider context here,
   // or accept that middleware is the primary gatekeeper.
   // For simplicity with the new structure, we rely on middleware for this redirect.

   // Simulate a loading state if needed for initial rendering, though typically not needed for a static landing page.
   // const [pageLoading, setPageLoading] = React.useState(true);
   // useEffect(() => {
   //   // Simulate content load
   //   const timer = setTimeout(() => setPageLoading(false), 300); // Adjust as needed
   //   return () => clearTimeout(timer);
   // }, []);

   // if (pageLoading) {
   //   return (
   //     <div className="flex min-h-screen items-center justify-center bg-background">
   //       <Loader2 className="h-12 w-12 animate-spin text-primary" />
   //     </div>
   //   );
   // }

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

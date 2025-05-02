
'use client'; // Required for hooks

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LogIn, Pill, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider'; // Import useAuth hook

export default function Home() {
   const { user, authLoading } = useAuth();
   const router = useRouter();

   useEffect(() => {
       // Redirect authenticated users away from the landing page
       if (!authLoading && user) {
           console.log("[Home Page] User authenticated, redirecting to /dashboard");
           router.replace('/dashboard'); // Use replace to avoid back button issues
       }
   }, [user, authLoading, router]);

   // Show loading indicator while checking auth state OR if user is logged in but redirect hasn't completed
   if (authLoading || user) {
        return (
          <div className="flex min-h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        );
   }

   // Render landing page content only if user is not authenticated and loading is finished
   // The check for `!user` is implicitly true if the above condition (authLoading || user) is false
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
            <CardContent>
                <p className="mb-6 text-muted-foreground">Please log in or sign up to access your dashboard.</p>
                <div className="flex justify-center gap-4">
                <Button asChild>
                    <Link href="/auth/login">
                    <LogIn className="mr-2 h-4 w-4" /> Login
                    </Link>
                </Button>
                <Button variant="outline" asChild>
                    <Link href="/auth/signup">
                        Sign Up
                    </Link>
                </Button>
                </div>
            </CardContent>
            </Card>
        </div>
    );
}

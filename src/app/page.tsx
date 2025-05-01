'use client'; // Required for hooks like useRouter and useEffect

import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LogIn, Pill } from 'lucide-react';
import Link from 'next/link';

// TODO: Replace with actual authentication check from Firebase context/state management
const isAuthenticated = false; // Default to false to show login page

export default function Home() {
  const router = useRouter();

  // // Redirect to dashboard if already authenticated (optional, based on desired UX)
  // useEffect(() => {
  //   if (isAuthenticated) {
  //       router.replace('/dashboard');
  //   }
  // }, [isAuthenticated, router]);


  // If not authenticated, show a landing/welcome page that links to login
  // if (!isAuthenticated) { // Removed this condition to always show landing page if direct access to '/' is allowed
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
        <Card className="w-full max-w-md text-center shadow-lg">
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
                 <Link href="/login">
                   <LogIn className="mr-2 h-4 w-4" /> Login
                 </Link>
              </Button>
               <Button variant="outline" asChild>
                 <Link href="/signup">
                    Sign Up
                 </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  // }

  // // If authenticated and not redirected yet, render null or a loading indicator
  // return null;
}

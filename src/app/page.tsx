'use client'; // Required for hooks like useRouter and useEffect

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LogIn, Pill, Loader2 } from 'lucide-react'; // Added Loader2
import Link from 'next/link';

// Placeholder - replace with actual Firebase Auth hook/context
const useAuth = () => {
  // Simulate fetching user data and auth state
  const [user, setUser] = useState<{} | null>(null); // Simplified user object
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      // In real app, use onAuthStateChanged listener
      const fakeAuth = false; // Simulate logged OUT for landing page initially
      if (fakeAuth) {
        setUser({});
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    }, 300); // Short delay for simulation
    return () => clearTimeout(timer);
  }, []);

  return { isAuthenticated, loading };
};


export default function Home() {
  const router = useRouter();
   const { isAuthenticated, loading } = useAuth();

   // Redirect to dashboard if already authenticated (optional, based on desired UX)
   useEffect(() => {
      // Only redirect AFTER loading is complete and user IS authenticated
     if (!loading && isAuthenticated) {
         router.replace('/dashboard');
     }
   }, [isAuthenticated, loading, router]);


   // Show loading indicator while checking auth
   if (loading) {
     return (
       <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }

   // If loading is done AND user is NOT authenticated, show landing/login page
   if (!loading && !isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
        <Card className="w-full max-w-md text-center shadow-lg animate-fadeIn"> {/* Added animation */}
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
                 <Link href="/login"> {/* Assuming /login exists */}
                   <LogIn className="mr-2 h-4 w-4" /> Login
                 </Link>
              </Button>
               <Button variant="outline" asChild>
                 <Link href="/signup"> {/* Assuming /signup exists */}
                    Sign Up
                 </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If authenticated and redirecting, show a minimal loading state or null
   return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
         <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
       </div>
   );
}

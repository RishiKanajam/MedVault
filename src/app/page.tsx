'use client'; // Required for hooks like useRouter and useEffect

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LogIn, Pill, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuthGuard } from '@/hooks/useAuthGuard'; // Import the auth guard

export default function Home() {
   // Use the auth guard hook. If authenticated, it will redirect to '/dashboard'.
   // It prevents rendering this page if the user is already logged in.
   const { loading } = useAuthGuard({ redirectIfAuthenticated: '/dashboard', requiredAuth: false });

   // Show loading indicator while checking auth state and potentially redirecting
   if (loading) {
     return (
       <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }

   // If loading is complete and the user is NOT authenticated (guard didn't redirect), show the landing page.
   return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        {/* Use panel-primary for consistent styling */}
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
}

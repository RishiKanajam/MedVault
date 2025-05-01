'use client'; // Required for hooks like useRouter and useEffect

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LogIn, Pill, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ClientSideAuthGuard } from '@/hooks/useAuthGuard'; // Import the client-side guard component

export default function Home() {
   // Wrap the content with the guard.
   // It will show a spinner initially, then:
   // - If authenticated, redirect to '/dashboard' (handled by the guard itself).
   // - If not authenticated, render the landing page content below.
   return (
      <ClientSideAuthGuard>
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
                     <Link href="/auth/login"> {/* Updated path */}
                       <LogIn className="mr-2 h-4 w-4" /> Login
                     </Link>
                  </Button>
                   <Button variant="outline" asChild>
                     <Link href="/auth/signup"> {/* Updated path */}
                        Sign Up
                     </Link>
                   </Button>
                </div>
              </CardContent>
            </Card>
          </div>
      </ClientSideAuthGuard>
    );
}

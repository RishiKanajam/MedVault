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
   const { toast } = useToast();

   // Middleware will redirect authenticated users trying to access '/' to '/dashboard'.
   // So, this content is primarily for unauthenticated users.

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
            </CardContent>
            </Card>
        </div>
    );
}
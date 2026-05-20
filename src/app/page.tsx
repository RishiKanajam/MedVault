'use client';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogIn, Pill, Zap } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
   // Middleware will redirect authenticated users trying to access '/' to '/dashboard'.
   // So, this content is primarily for unauthenticated users.

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center animate-fade-in">
            <CardHeader>
                <div className="flex justify-center mb-4">
                <Pill className="w-12 h-12 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold">Welcome to MedVault</CardTitle>
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
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/40" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="bg-card px-3 text-muted-foreground">or explore first</span>
                    </div>
                </div>
                <Button asChild variant="ghost" className="w-full border border-dashed border-primary/40 hover:border-primary/70 hover:bg-primary/5">
                    <Link href="/demo">
                        <Zap className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-primary font-medium">Try Demo</span>
                        <Badge variant="secondary" className="ml-2 text-[10px]">No login needed</Badge>
                    </Link>
                </Button>
                <p className="text-xs text-muted-foreground">
                    See a full AI clinical analysis with sample patient data — no account required.
                </p>
            </CardContent>
            </Card>
        </div>
    );
}

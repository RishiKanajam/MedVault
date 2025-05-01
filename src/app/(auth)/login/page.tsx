'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pill, Loader2 } from 'lucide-react';
import { auth, db } from '@/firebase'; // Ensure these are correctly initialized and exported
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null); // Clear previous errors
    setIsLoading(true);

    try {
      // 1. Sign in with Firebase Auth
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      // 2. Fetch user's Firestore document
      console.log('[Login] Fetching user document for:', user.uid);
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      let modulesConfigured = false;
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        // Check if settings.modules exists and has any keys
        modulesConfigured = userData?.settings?.modules && Object.keys(userData.settings.modules).length > 0;
        console.log('[Login] User document exists. Modules configured:', modulesConfigured);
      } else {
        // This case should ideally not happen if signup creates the doc, but handle it defensively.
        console.warn("[Login] User document not found in Firestore for UID:", user.uid);
        // Redirect to module setup as a fallback, assuming it's a first-time login after a potential signup issue.
      }

      toast({ title: "Login Successful", description: `Welcome back!` });

      // 3. Redirect based on module configuration
      if (modulesConfigured) {
        console.log('[Login] Redirecting to /dashboard');
        router.push('/dashboard'); // Modules set up, go to dashboard
      } else {
        console.log('[Login] Redirecting to /module-selection');
        router.push('/module-selection'); // Modules not set up or empty, go to selection screen
      }

    } catch (err: any) {
      console.error('[Login] Error:', err);
      let message = 'An unknown error occurred during login.';
       if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
         message = 'Invalid email or password.';
       } else if (err.message) {
          message = err.message;
       }
      setError(message);
      toast({ title: "Login Failed", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
       {/* Use panel-primary for consistent styling */}
      <Card className="panel-primary w-full max-w-sm">
        <CardHeader className="text-center">
           <div className="flex justify-center mb-4">
             <Pill className="w-10 h-10 text-primary" />
           </div>
          <CardTitle className="text-2xl font-bold">MediSync Pro Login</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="m@example.com" required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                 {/* TODO: Implement password reset flow */}
                <Button variant="link" asChild className="p-0 h-auto text-sm">
                    <Link href="#">
                    Forgot your password?
                    </Link>
                </Button>
              </div>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
             {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
               {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Logging In...' : 'Login'}
            </Button>
          </form>
        </CardContent>
         <CardFooter className="text-center text-sm">
           Don't have an account?{' '}
            <Button variant="link" asChild className="p-0 h-auto ml-1">
                <Link href="/signup">
                Sign up
                </Link>
            </Button>
         </CardFooter>
      </Card>
    </div>
  );
}

// app/auth/login/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Import useSearchParams
import { signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth'; // Added signInAnonymously

import { auth } from '@/firebase';       // Correct firebase export path
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Loader2, Pill, User as UserIcon } from 'lucide-react'; // Added UserIcon for Guest button

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Get search params
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false); // Loading state for guest login
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Toast first, then redirect
      toast({ title: 'Login Successful', description: 'Redirecting to dashboard...' });
      const redirectedFrom = searchParams.get('redirectedFrom');
      console.log("[Login] Login successful. Redirecting...");
      router.replace(redirectedFrom || '/dashboard'); // Redirect to original destination or dashboard
    } catch (err: any) {
      console.error('[Login] Error:', err);
      let message = 'An unknown error occurred during login.';
      // Map Firebase error codes to user-friendly messages
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          message = 'Invalid email or password.';
          break;
        case 'auth/invalid-email':
          message = 'Please enter a valid email address.';
          break;
        case 'auth/network-request-failed':
          message = 'Network error. Please check your connection.';
          break;
        case 'auth/too-many-requests':
            message = 'Access temporarily disabled due to too many failed login attempts. Please reset your password or try again later.';
            break;
        default:
          message = err.message || message;
      }
      setError(message);
      toast({ title: 'Login Failed', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setIsGuestLoading(true);
    try {
      await signInAnonymously(auth);
      toast({ title: 'Guest Login Successful', description: 'Redirecting to dashboard...' });
      const redirectedFrom = searchParams.get('redirectedFrom');
      console.log("[Login] Guest login successful. Redirecting...");
      router.replace(redirectedFrom || '/dashboard');
    } catch (err: any) {
      console.error('[Login] Guest login error:', err);
      const message = err.message || 'Failed to sign in as guest.';
      setError(message);
      toast({ title: 'Guest Login Failed', description: message, variant: 'destructive' });
    } finally {
      setIsGuestLoading(false);
    }
  };


  return (
    <Card className="w-full max-w-sm mx-auto my-auto panel-primary">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Pill className="w-10 h-10 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">MediSync Pro Login</CardTitle>
        <CardDescription>Enter your email below to login to your account or continue as a guest.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isLoading || isGuestLoading}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={isLoading || isGuestLoading}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center mt-2">{error}</p>
          )}

          <Button type="submit" className="w-full flex justify-center items-center" disabled={isLoading || isGuestLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Logging In…' : 'Login'}
          </Button>
        </form>

        <div className="mt-4 flex items-center">
          <div className="flex-grow border-t border-border"></div>
          <span className="mx-2 text-xs text-muted-foreground">OR</span>
          <div className="flex-grow border-t border-border"></div>
        </div>

        <Button variant="outline" className="w-full mt-4 flex justify-center items-center" onClick={handleGuestLogin} disabled={isLoading || isGuestLoading}>
           {isGuestLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
           {isGuestLoading ? 'Joining as Guest...' : <><UserIcon className="mr-2 h-4 w-4" /> Continue as Guest</>}
        </Button>

      </CardContent>

      <CardFooter className="text-center text-sm">
        Don’t have an account?{' '}
        <Button variant="link" asChild className="p-0 h-auto ml-1 text-primary">
          <Link href="/auth/signup">
             Sign up
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

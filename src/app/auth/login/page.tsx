// app/auth/login/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // Keep useRouter for potential future use, but not for redirect here
import { signInWithEmailAndPassword } from 'firebase/auth';

import { auth } from '@/firebase';       // Correct firebase export path
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Loader2, Pill } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter(); // Keep router instance if needed elsewhere
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Toast first, AuthProviderWrapper will handle the redirect
      toast({ title: 'Login Successful', description: 'Redirecting to dashboard...' });
      console.log("[Login] Login successful. AuthProviderWrapper will handle redirect.");
      // DO NOT redirect here - let the auth state change trigger the redirect in AuthProviderWrapper/AuthLogic
      // router.replace('/dashboard'); // <-- REMOVED
    } catch (err: any) {
      console.error('[Login] Error:', err);
      let message = 'An unknown error occurred during login.';
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
        default:
          message = err.message || message;
      }
      setError(message);
      toast({ title: 'Login Failed', description: message, variant: 'destructive' });
    } finally {
      // Set loading to false ONLY if there was an error.
      // If login was successful, the redirect will happen, and this component might unmount.
      // Keeping it loading prevents user interaction while waiting for redirect.
      // If the component *doesn't* unmount quickly (e.g., due to slow redirect),
      // we might need to reconsider this, but typically the redirect is fast.
      if (error) {
          setIsLoading(false);
      }
      // If login is successful, let it stay in the loading state until redirect happens
    }
  };

  return (
    <Card className="w-full max-w-sm mx-auto my-auto panel-primary"> {/* Adjusted margin for centering */}
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Pill className="w-10 h-10 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">MediSync Pro Login</CardTitle>
        <CardDescription>Enter your email below to login to your account</CardDescription>
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center mt-2">{error}</p>
          )}

          <Button type="submit" className="w-full flex justify-center items-center" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Logging In…' : 'Login'}
          </Button>
        </form>
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

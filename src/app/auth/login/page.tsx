// Login Page for MediSync Pro
// Purpose: Handles user authentication via email/password or guest mode (anonymous login).
// Data Flow: On submit, calls Firebase Auth methods. On success, redirects to /dashboard (or redirectedFrom if present).
// TODO: Implement redirect to original page if redirectedFrom param exists.
// TODO: Add a clear guest mode indicator after login.
// TODO: Replace dummy data with real API calls where marked.

'use client';
import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Loader2, Pill } from 'lucide-react';

function LoginContent(props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Sign in with Firebase
      console.log('Attempting to sign in with Firebase...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase sign in successful, getting ID token...');
      
      // Force refresh the token to ensure it's fresh
      const idToken = await userCredential.user.getIdToken(true);
      console.log('ID token obtained, creating session...');

      // Create session
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned an invalid response');
      }

      const data = await response.json();

      if (!response.ok) {
        console.error('Session creation failed:', data);
        throw new Error(data.details || data.error || 'Failed to create session');
      }

      if (!data.success) {
        console.error('Session creation unsuccessful:', data);
        throw new Error(data.details || data.error || 'Failed to create session');
      }

      console.log('Session created successfully, redirecting...');
      // Redirect to dashboard or the page they were trying to access
      const redirectTo = searchParams.get('redirectedFrom') || '/dashboard';
      router.replace(redirectTo);
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Failed to login. Please try again.';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            errorMessage = 'Invalid email or password.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed attempts. Please try again later.';
            break;
          default:
            errorMessage = error.message || errorMessage;
        }
      } else {
        errorMessage = error.message || errorMessage;
      }

      setError(errorMessage);
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // The login form is rendered directly.
  // Middleware handles authenticated users. AuthProvider handles loading for protected routes.
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm mx-auto my-auto panel-primary">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Pill className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">MediSync Pro Login</CardTitle>
          <CardDescription>Enter your email below to login to your account.</CardDescription>
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            </div>

            {/* Error message with aria-live for accessibility */}
            {error && (
              <p className="text-sm text-destructive text-center mt-2" aria-live="polite">{error}</p>
            )}

            <Button type="submit" className="w-full flex justify-center items-center" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Logging In…' : 'Login'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="text-center text-sm">
          Don't have an account?{' '}
          <Button variant="link" asChild className="p-0 h-auto ml-1 text-primary">
            <Link href="/auth/signup">
              Sign up
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage(props) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent {...props} />
    </Suspense>
  );
}


'use client'; // Required for hooks and event handlers

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter for navigation
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
import { auth } from '@/firebase'; // Ensure Firebase is correctly initialized
import { signInWithEmailAndPassword } from 'firebase/auth'; // Import sign-in function
import { useToast } from '@/hooks/use-toast';

// No Suspense import needed here

export default function LoginPage() {
  const router = useRouter(); // Initialize useRouter
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // State for loading indicator
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true); // Show spinner

    try {
      console.log('[Login] Attempting sign-in...');
      await signInWithEmailAndPassword(auth, email, password); // Sign in
      console.log('[Login] Sign-in successful.');

      toast({ title: "Login Successful", description: `Welcome back!` });

      console.log('[Login] Redirecting to /dashboard');
      router.push('/dashboard'); // Redirect to dashboard on success
      // Keep isLoading true as the component will unmount/redirect

    } catch (err: any) {
      console.error('[Login] Error:', err);
      let message = 'An unknown error occurred during login.';
       if (err.code) {
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
               break;
          }
       } else if (err.message) {
          message = err.message;
       }
      setError(message);
      toast({ title: "Login Failed", description: message, variant: "destructive" });
      setIsLoading(false); // Stop spinner only on error
    }
  };

  // Show loading overlay *specifically for the login action*
  // The AuthProvider handles the initial app load spinner
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className='sr-only'>Logging in...</span>
      </div>
    );
  }


  return (
    // The parent layout already handles centering
      <Card className="panel-primary w-full max-w-sm"> {/* Use primary panel */}
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
                {/* Implement password reset later if needed */}
                {/* <Button variant="link" asChild className="p-0 h-auto text-sm text-primary">
                    <Link href="#">
                    Forgot your password?
                    </Link>
                </Button> */}
              </div>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
             {error && <p className="text-sm text-destructive text-center">{error}</p>}
            {/* Disable button handled by the isLoading overlay */}
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </CardContent>
         <CardFooter className="text-center text-sm">
           Don't have an account?{' '}
            <Button variant="link" asChild className="p-0 h-auto ml-1 text-primary"> {/* Primary color link */}
                <Link href="/auth/signup">
                Sign up
                </Link>
            </Button>
         </CardFooter>
      </Card>
  );
}

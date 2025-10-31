// Signup Page for MediSync Pro
// Purpose: Handles user registration with email/password and full name.
// Data Flow: Creates Firebase Auth user, updates displayName, and creates Firestore profile document.
// TODO: Add redirect to original page if redirectedFrom param exists.
// TODO: Add password strength meter and validation.
// TODO: Replace dummy data with real API calls where marked.

'use client'; // Required for hooks and event handlers

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
import { auth, db } from '@/firebase'; // Correct import path
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'; // Import serverTimestamp
import { useToast } from '@/hooks/use-toast';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: Add password strength meter
  // TODO: Add redirect-back logic after signup

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName || !clinicId || !email || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    try {
      // 1. Create Firebase Auth user
      if (!auth) {
        throw new Error('Firebase auth is not initialized');
      }
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;
      // 2. Update Firebase Auth Profile (Display Name)
      await updateProfile(user, { displayName: fullName });
      // 3. Create Firestore user document for profile info
      const dbInstance = db;
      if (!dbInstance) {
        throw new Error('Firestore is not initialized');
      }
      await setDoc(doc(dbInstance, 'users', user.uid), {
        name: fullName,
        email,
        clinicId,
        createdAt: serverTimestamp(),
      });
      // 4. Set custom claims for the user
      const response = await fetch('/api/auth/set-custom-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user.uid,
          clinicId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to set user permissions');
      }

      toast({ title: 'Account Created', description: 'Welcome to MediSync Pro! Please log in.' });
      router.push('/auth/login');
    } catch (err: any) {
      let message = 'An unknown error occurred during sign up.';
      if (err.code) {
        switch (err.code) {
          case 'auth/email-already-in-use':
            message = 'This email address is already registered.';
            break;
          case 'auth/weak-password':
            message = 'Password should be at least 6 characters long.';
            break;
          case 'auth/invalid-email':
            message = 'Please enter a valid email address.';
            break;
          default:
            message = err.message || message;
            break;
        }
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      toast({ title: 'Signup Failed', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Pill className="mx-auto h-10 w-10 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">Create your MedVault account</h1>
          <p className="text-sm text-muted-foreground">
            Set up access for your clinic in just a minute.
          </p>
        </div>
        <Card className="w-full rounded-3xl border border-border/60 bg-background/95 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">Tell us about you</CardTitle>
            <CardDescription>We’ll use these details to configure your workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSignup} className="space-y-4" autoComplete="off">
              <div className="space-y-2 text-left">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required disabled={isLoading} autoComplete="name" />
              </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="clinicId">Clinic ID</Label>
              <Input id="clinicId" value={clinicId} onChange={e => setClinicId(e.target.value)} required disabled={isLoading} autoComplete="organization" />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} autoComplete="email" />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading} autoComplete="new-password" />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required disabled={isLoading} autoComplete="new-password" />
            </div>
            {error && <p className="text-sm text-destructive text-center" aria-live="polite">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading} aria-busy={isLoading} aria-live="polite">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Button variant="link" asChild className="h-auto p-0 text-primary">
              <Link href="/auth/login">Log in</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

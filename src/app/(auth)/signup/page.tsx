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
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clinicId, setClinicId] = useState(''); // Assuming direct input for now
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null); // Clear previous errors

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!clinicId.trim()) {
       setError('Clinic ID is required.');
       return;
    }

    setIsLoading(true);

    try {
      // 1. Create Firebase Auth user
      console.log('[Signup] Attempting to create user...');
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      console.log('[Signup] User created in Auth:', userCred.user.uid);

      // 2. Update Firebase Auth Profile (Display Name)
      console.log('[Signup] Updating Auth profile...');
      await updateProfile(userCred.user, { displayName: fullName });
      console.log('[Signup] Auth profile updated.');

      // 3. Create Firestore user document
      console.log('[Signup] Attempting to create Firestore document for user:', userCred.user.uid);
      // IMPORTANT: Security rules allow this write because the user is now authenticated
      // and the path matches their UID: `/users/{userId}` where `request.auth.uid == userId`.
      const userDocRef = doc(db, 'users', userCred.user.uid);
      await setDoc(userDocRef, {
        name: fullName,
        email: email,
        clinicId: clinicId, // Store clinic ID in Firestore profile
        settings: { modules: null, theme: 'system' } // Initialize settings as null/default
      });
      console.log('[Signup] Firestore document created.');

      // Optional: Trigger a function to set the custom claim 'clinicId' on the user token
      // This step is CRITICAL for Firestore rules that check `request.auth.token.clinicId`.
      // Since this requires a backend function, it's commented out here.
      // Without this backend step, access to `/clinics/{clinicId}/...` will fail due to permissions.
      // console.log('[Signup] Note: Backend function needed to set clinicId custom claim for full access.');
      // await fetch('/api/set-custom-claims', { method: 'POST', body: JSON.stringify({ uid: userCred.user.uid, clinicId }) });


      toast({ title: "Account Created", description: "Welcome to MediSync Pro! Please select your modules." });
      router.push('/module-selection'); // Redirect to module setup

    } catch (err: any) {
      console.error('[Signup] Error during signup:', err);

      // Provide more user-friendly error messages
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
           case 'permission-denied': // Firestore permission error
             message = 'Could not save user profile. Please check permissions or contact support.';
             break;
           default:
              message = err.message || message; // Use Firebase error message if available
              break;
        }
      } else if (err.message) {
          message = err.message;
      }

      setError(message);
      toast({ title: "Signup Failed", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
       {/* Use panel-primary for consistent styling */}
      <Card className="panel-primary w-full max-w-md">
        <CardHeader className="text-center">
           <div className="flex justify-center mb-4">
             <Pill className="w-10 h-10 text-primary" />
           </div>
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>Enter your details to get started with MediSync Pro</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
             <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
             <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="m@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
             <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
             <div className="space-y-2">
              <Label htmlFor="clinicId">Clinic ID</Label>
              {/* TODO: Replace with a dropdown fetched from a 'clinics' collection if needed */}
              <Input id="clinicId" value={clinicId} onChange={(e) => setClinicId(e.target.value)} required placeholder="Your Clinic Identifier" />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
               {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>
        </CardContent>
         <CardFooter className="text-center text-sm">
           Already have an account?{' '}
            <Button variant="link" asChild className="p-0 h-auto ml-1">
              <Link href="/login">
                Login
              </Link>
           </Button>
         </CardFooter>
      </Card>
    </div>
  );
}

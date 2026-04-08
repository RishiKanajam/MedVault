'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pill, Loader2, Check } from 'lucide-react';
import { auth, db } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

// ── Brand panel ─────────────────────────────────────────────────────────────
const highlights = [
  { text: 'Role-based access for multi-clinician teams' },
  { text: 'Real-time Firestore sync across all devices' },
  { text: 'End-to-end session security with Firebase Auth' },
];

function BrandPanel() {
  return (
    <div
      className="relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex"
      style={{
        background:
          'linear-gradient(155deg, hsl(162 63% 30%) 0%, hsl(162 63% 38%) 55%, hsl(168 55% 44%) 100%)',
      }}
    >
      <div className="dot-grid absolute inset-0" aria-hidden />
      <div
        aria-hidden
        className="absolute -left-24 top-1/3 h-64 w-64 rounded-full bg-white/5 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute right-8 bottom-32 h-48 w-48 rounded-full bg-emerald-400/10 blur-2xl"
      />

      <div className="relative flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm">
          <Pill className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-semibold tracking-tight">MedVault</span>
      </div>

      <div className="relative space-y-8">
        <div className="space-y-3">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Your clinic&apos;s command<br />center starts here.
          </h2>
          <p className="max-w-sm text-base leading-relaxed text-white/70">
            Set up in minutes. Bring your team, inventory, and patient records together in a single secure workspace.
          </p>
        </div>

        <ul className="space-y-3">
          {highlights.map(({ text }) => (
            <li key={text} className="flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm text-white/85">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-white/35">
        Supporting UN SDG 3 — Good Health and Well-Being
      </p>
    </div>
  );
}

// ── Signup form ─────────────────────────────────────────────────────────────
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
      if (!auth) throw new Error('Firebase auth is not initialized');

      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;
      await updateProfile(user, { displayName: fullName });

      if (!db) throw new Error('Firestore is not initialized');
      await setDoc(doc(db, 'users', user.uid), {
        name: fullName,
        email,
        clinicId,
        createdAt: serverTimestamp(),
      });

      // Pass the freshly minted ID token so the server can verify the caller's identity.
      const idToken = await user.getIdToken();
      const response = await fetch('/api/auth/set-custom-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ uid: user.uid, clinicId }),
      });

      if (!response.ok) throw new Error('Failed to set user permissions');

      toast({ title: 'Account created', description: 'Welcome to MedVault. Please sign in.' });
      router.push('/auth/login');
    } catch (err: any) {
      let message = 'An error occurred during sign up.';
      if (err.code) {
        switch (err.code) {
          case 'auth/email-already-in-use':
            message = 'This email address is already registered.';
            break;
          case 'auth/weak-password':
            message = 'Password must be at least 6 characters.';
            break;
          case 'auth/invalid-email':
            message = 'Please enter a valid email address.';
            break;
          default:
            message = err.message || message;
        }
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      toast({ title: 'Signup failed', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <BrandPanel />

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background px-6 py-12 lg:px-10">
        <div className="w-full max-w-sm animate-slide-up space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Pill className="h-4 w-4 text-primary" />
            </div>
            <span className="text-base font-semibold text-foreground">MedVault</span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
            <p className="text-sm text-muted-foreground">
              Set up access for your clinic in just a minute.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4" autoComplete="off">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-medium">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Dr. Jane Smith"
                required
                disabled={isLoading}
                autoComplete="name"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clinicId" className="text-sm font-medium">Clinic ID</Label>
              <Input
                id="clinicId"
                value={clinicId}
                onChange={e => setClinicId(e.target.value)}
                placeholder="e.g. central-health-clinic"
                required
                disabled={isLoading}
                autoComplete="organization"
                className="h-10 rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                All staff in your clinic must use the same ID.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@clinic.com"
                required
                disabled={isLoading}
                autoComplete="email"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="h-10 rounded-xl"
                />
              </div>
            </div>

            {error && (
              <div
                className="rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-sm text-destructive"
                aria-live="polite"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="h-10 w-full rounded-xl font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

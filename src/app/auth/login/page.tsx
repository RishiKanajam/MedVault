'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Loader2, Pill, Check } from 'lucide-react';

// ── Brand panel – left half on desktop ─────────────────────────────────────
const features = [
  { text: 'AI-powered clinical decision support via Gemini' },
  { text: 'Cold-chain shipment tracking with live GPS sensors' },
  { text: 'RBAC and Firestore security rules baked in' },
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
      {/* Dot grid texture */}
      <div className="dot-grid absolute inset-0" aria-hidden />
      {/* Soft blurred orbs */}
      <div
        aria-hidden
        className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-16 left-8 h-52 w-52 rounded-full bg-emerald-400/10 blur-2xl"
      />

      {/* Logo */}
      <div className="relative flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm">
          <Pill className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-white">MedVault</span>
      </div>

      {/* Main copy */}
      <div className="relative space-y-8">
        <div className="space-y-3">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Clinical intelligence<br />where it matters most.
          </h2>
          <p className="max-w-sm text-base leading-relaxed text-white/70">
            A unified workspace for inventory, shipments, and AI-assisted clinical decisions — built for the clinics that cannot afford to slow down.
          </p>
        </div>

        <ul className="space-y-3">
          {features.map(({ text }) => (
            <li key={text} className="flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm text-white/85">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer attribution */}
      <p className="relative text-xs text-white/35">
        Supporting UN SDG 3 — Good Health and Well-Being
      </p>
    </div>
  );
}

// ── Login form ─────────────────────────────────────────────────────────────
function LoginContent() {
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
      if (!auth) throw new Error('Firebase auth is not initialized');

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken(true);

      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.details || data.error || 'Failed to create session');
      }

      const redirectTo = searchParams.get('redirectedFrom') || '/dashboard';
      router.replace(redirectTo);
    } catch (error: any) {
      let errorMessage = 'Failed to login. Please try again.';
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
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
      }
      setError(errorMessage);
      toast({ title: 'Login Failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-background px-6 py-12 lg:px-10">
      <div className="w-full max-w-sm animate-slide-up space-y-8">
        {/* Mobile logo (hidden on desktop where brand panel shows) */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Pill className="h-4 w-4 text-primary" />
          </div>
          <span className="text-base font-semibold text-foreground">MedVault</span>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your clinical workspace.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@clinic.com"
              required
              disabled={isSubmitting}
              autoComplete="email"
              className="h-10 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              autoComplete="current-password"
              className="h-10 rounded-xl"
            />
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
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href="/auth/signup"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <BrandPanel />
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center bg-background">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        }
      >
        <LoginContent />
      </Suspense>
    </div>
  );
}

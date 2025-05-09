// app/auth/login/page.tsx
'use client';
import React from 'react'; // Ensure React is imported
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { auth } from '@/firebase'; // Correct path
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Loader2, Pill, User as UserIcon } from 'lucide-react';
// Removed useAuth import as LoginPage is outside AuthProvider scope for its primary rendering

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Keep if needed for redirectedFrom logic, though middleware often handles this
  const { toast } = useToast();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGuestLoading, setIsGuestLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Middleware should handle redirecting already authenticated users.
  // No useEffect based on contextAuthLoading or user needed here.

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    console.log("[Login Page] handleLogin initiated.");
    try {
      console.log("[Login Page] Attempting email/password login...");
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Login Successful', description: 'Redirecting to dashboard...' });
      console.log(`[Login Page] Email/Password Login successful. Forcing redirect to /dashboard.`);
      router.replace('/dashboard'); 
    } catch (err: any) {
      console.error('[Login Page] Email/Password Login Error:', err);
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
        case 'auth/too-many-requests':
            message = 'Access temporarily disabled due to too many failed login attempts. Please reset your password or try again later.';
            break;
        default:
          message = err.message || message;
      }
      setError(message);
      toast({ title: 'Login Failed', description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
      console.log("[Login Page] handleLogin finished.");
    }
  };

  const handleGuestLogin = async () => {
    setIsGuestLoading(true);
    setError(null);
    console.log("[Login Page] handleGuestLogin initiated.");
    try {
      console.log("[Login Page] Attempting guest login...");
      await signInAnonymously(auth);
      toast({ title: 'Guest Login Successful', description: 'Redirecting to dashboard...' });
      console.log("[Login Page] Guest login successful, forcing redirect to /dashboard");
      router.replace('/dashboard');
    } catch (error: any) {
      console.error('[Login Page] Guest Login Error:', error);
      let message = 'An unknown error occurred during guest login.';
      if (error.code) {
        switch (error.code) {
          case 'auth/operation-not-allowed':
            message = 'Guest login is not enabled for this project.';
            break;
          default:
            message = error.message || message;
            break;
        }
      }
      setError(message);
      toast({ title: 'Guest Login Failed', description: message, variant: 'destructive' });
    } finally {
      setIsGuestLoading(false);
      console.log("[Login Page] handleGuestLogin finished.");
    }
  };

  // The login form is rendered directly.
  // Middleware handles authenticated users. AuthProvider handles loading for protected routes.
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
              disabled={isSubmitting || isGuestLoading}
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
              disabled={isSubmitting || isGuestLoading}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center mt-2">{error}</p>
          )}

          <Button type="submit" className="w-full flex justify-center items-center" disabled={isSubmitting || isGuestLoading}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Logging In…' : 'Login'}
          </Button>
        </form>
        
        <div className="mt-4 flex items-center">
          <div className="flex-grow border-t border-border"></div>
          <span className="mx-2 text-xs text-muted-foreground">OR</span>
          <div className="flex-grow border-t border-border"></div>
        </div>
        <Button variant="outline" className="w-full mt-2 flex justify-center items-center" onClick={handleGuestLogin} disabled={isSubmitting || isGuestLoading}>
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

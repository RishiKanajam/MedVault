
'use client'; // Mark as client component

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { auth } from '@/firebase'; // Use correct firebase path
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link'; // Import Link

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // State for login action loading
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true); // Show spinner for login action

    try {
      await signInWithEmailAndPassword(auth, email, password); // Sign in
      toast({ title: "Login Successful", description: `Welcome back!` });
      router.push('/dashboard'); // Redirect to dashboard on success

    } catch (err: any) {
      console.error('[Login] Error:', err);
      let message = 'An unknown error occurred during login.';
       if (err.code) {
          switch (err.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential': message = 'Invalid email or password.'; break;
            case 'auth/invalid-email': message = 'Please enter a valid email address.'; break;
            case 'auth/network-request-failed': message = 'Network error. Please check your connection.'; break;
            default: message = err.message || message; break;
          }
       } else if (err.message) { message = err.message; }
      setError(message);
      toast({ title: "Login Failed", description: message, variant: "destructive" });
      setIsLoading(false); // Stop spinner only on error
    }
  };

  return (
    // Centering handled by parent layout src/app/auth/layout.tsx
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
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="m@example.com" required disabled={isLoading}/>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {/* <Button variant="link" asChild className="p-0 h-auto text-sm text-primary">
                    <Link href="#">Forgot your password?</Link>
                </Button> */}
              </div>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading}/>
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
            <Button variant="link" asChild className="p-0 h-auto ml-1 text-primary">
              <Link href="/auth/signup">
                Sign up
              </Link>
           </Button>
         </CardFooter>
      </Card>
  );
}

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// import Link from 'next/link';
// import { Button } from '@/components/ui/button';
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Pill } from 'lucide-react'; // Using Pill icon for branding

export default function LoginPage() {
  const router = useRouter();

  // --- TEMPORARY REDIRECT FOR TESTING ---
  useEffect(() => {
    // Immediately redirect to the dashboard, bypassing login logic
    router.replace('/dashboard');
  }, [router]);
  // --- END TEMPORARY REDIRECT ---

  // TODO: Implement Firebase Authentication logic
  // const handleLogin = (event: React.FormEvent) => {
  //   event.preventDefault();
  //   console.log('Login attempt...');
  //   // Add Firebase auth logic here
  //   // On success, redirect to '/' or '/dashboard'
  //   router.push('/dashboard'); // Temporary push for testing flow
  // };

  // Render a loading/redirecting state while the redirect happens
   return (
     <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
       <div className="flex flex-col items-center">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
         <p className="mt-2 text-muted-foreground">Redirecting to dashboard...</p>
       </div>
     </div>
   );


  // --- ORIGINAL LOGIN FORM (COMMENTED OUT FOR TESTING) ---
  /*
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-sm shadow-lg">
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
              <Input id="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-sm text-primary hover:underline">
                  Forgot your password?
                </Link>
              </div>
              <Input id="password" type="password" required />
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Login
            </Button>
          </form>
        </CardContent>
         <CardFooter className="text-center text-sm">
           Don't have an account?{' '}
            <Link href="/signup" className="text-primary hover:underline ml-1">
              Sign up
            </Link>
         </CardFooter>
      </Card>
    </div>
  );
  */
  // --- END ORIGINAL LOGIN FORM ---
}

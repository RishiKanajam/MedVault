'use client';

import React from 'react';
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
import { Pill } from 'lucide-react'; // Using Pill icon for branding

export default function SignupPage() {
  // TODO: Implement Firebase Authentication logic for sign-up
  const handleSignup = (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Signup attempt...');
    // Add Firebase auth logic here (createUserWithEmailAndPassword)
    // On success, potentially redirect to module selection or dashboard
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
           <div className="flex justify-center mb-4">
             <Pill className="w-10 h-10 text-primary" />
           </div>
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription>Enter your details to get started with MediSync Pro</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {/* Add fields like First Name, Last Name if needed */}
             <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required />
            </div>
             {/* Add Confirm Password field if needed */}
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Sign Up
            </Button>
          </form>
        </CardContent>
         <CardFooter className="text-center text-sm">
           Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline ml-1">
              Login
            </Link>
         </CardFooter>
      </Card>
    </div>
  );
}

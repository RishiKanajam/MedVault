'use client'; // Required for hooks like useRouter and useEffect

import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LogIn } from 'lucide-react';

// TODO: Replace with actual authentication check
const isAuthenticated = false; // Placeholder for auth state

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    // In a real app, this check would involve checking a context, cookie, or making an API call
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // If redirecting, render null or a loading indicator
  if (!isAuthenticated) {
    return null; // Or a loading spinner
  }

  // Render the main dashboard/welcome page content if authenticated
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4">
           <SidebarTrigger className="md:hidden" />
          <h1 className="text-xl font-semibold flex-1">Welcome to MediSync Pro</h1>
          {/* Add User Menu/Logout Button here */}
        </header>
        <main className="flex-1 overflow-auto p-4">
          <Card>
            <CardHeader>
              <CardTitle>MediSync Pro Dashboard</CardTitle>
              <CardDescription>Your central hub for medical management and clinical support.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Welcome back! Select a module from the sidebar to get started.</p>
              {/* Placeholder content - replace with actual dashboard widgets */}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </div>
  );
}

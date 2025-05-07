// src/app/(app)/layout.tsx
'use client';

import React, { useEffect } from 'react';
import AuthProvider, { useAuth } from '@/providers/AuthProvider'; // AuthProvider handles its own loading spinner
import { useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Loader2 } from 'lucide-react';

// This component contains the logic to protect routes after auth state is resolved.
function ProtectedRouteLogic({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useAuth(); // authLoading comes from AuthProvider
  const router = useRouter();

  useEffect(() => {
    // If loading is finished and there's no user, redirect to login
    if (!authLoading && !user) {
      console.log('[ProtectedRouteLogic] Auth loaded, no user. Redirecting to login.');
      router.replace('/auth/login');
    }
  }, [user, authLoading, router]);

  // If auth is still loading, AuthProvider is already displaying a spinner.
  // So, we don't need to show another spinner here unless authLoading is false AND user is null (being redirected).
  if (authLoading) {
    // AuthProvider handles this spinner. We can return null or a minimal placeholder if needed,
    // but usually AuthProvider's spinner covers this.
    return null;
  }

  // If auth is loaded and user exists, render the children (the protected page content).
  if (user) {
    return <>{children}</>;
  }

  // If auth is loaded, no user, and redirect is in progress, can show a specific spinner or null.
  // For simplicity, returning null as AuthProvider covers initial load and redirect should be quick.
  console.log('[ProtectedRouteLogic] Auth loaded, no user, redirect should be in progress.');
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-2">Redirecting...</p>
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider> {/* AuthProvider now wraps only protected routes and manages its own spinner */}
      <ProtectedRouteLogic>
        <SidebarProvider>
            <Sidebar>
                <AppSidebar />
            </Sidebar>
            <SidebarInset>
                <main className="flex-1 overflow-y-auto bg-background">
                     {children}
                 </main>
            </SidebarInset>
        </SidebarProvider>
      </ProtectedRouteLogic>
    </AuthProvider>
  );
}

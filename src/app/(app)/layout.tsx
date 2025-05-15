// src/app/(app)/layout.tsx
'use client';

import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { useRouter, useSearchParams, usePathname } from 'next/navigation'; // Added usePathname
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Loader2 } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase';
import { Header } from '@/components/layout/header';

function useInactivityLogout(timeoutMs: number = 10 * 60 * 1000) {
  const router = useRouter();
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await signOut(auth);
        router.replace('/auth/login');
      }, timeoutMs);
    };
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();
    return () => {
      clearTimeout(timer);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [router, timeoutMs]);
}

function ProtectedRouteLogic({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  if (!auth) throw new Error('AuthProvider is missing');
  const { user, authLoading } = auth;
  const router = useRouter();
  const pathname = usePathname(); // Get current path

  useInactivityLogout(); // Add inactivity logout

  useEffect(() => {
    console.log(`[ProtectedRouteLogic] Effect triggered. AuthLoading: ${authLoading}, User: ${user ? user.uid : 'null'}, Pathname: ${pathname}`);
    if (!authLoading) { // Only act once auth state is resolved
      if (!user) {
        console.log('[ProtectedRouteLogic] Auth loaded, no user. Redirecting to /auth/login.');
        router.replace('/auth/login');
      } else {
        // If user is authenticated but somehow not on /dashboard (e.g., direct navigation to an internal app route that isn't dashboard)
        // and not already trying to go to dashboard (to prevent redirect loops if dashboard is the intended page)
        // This might be redundant if middleware handles all cases, but can be a client-side fallback.
        // Only redirect if the current path is NOT a sub-path of /dashboard already
        if (pathname !== '/dashboard' && !pathname.startsWith('/dashboard/')) {
           console.log(`[ProtectedRouteLogic] Auth loaded, user exists. Current path ${pathname} is not dashboard. Redirecting to /dashboard.`);
           // router.replace('/dashboard'); // Temporarily disabled to see if middleware/login handles it.
        } else {
           console.log(`[ProtectedRouteLogic] Auth loaded, user exists. Already on or navigating to dashboard path: ${pathname}. No redirect needed from here.`);
        }
      }
    }
  }, [user, authLoading, router, pathname]);

  // If auth is loading, AuthProvider is displaying a spinner.
  if (authLoading) {
    console.log('[ProtectedRouteLogic] Auth is loading. AuthProvider spinner is active.');
    return null; // AuthProvider handles this.
  }

  // If auth is loaded AND user exists, render children.
  if (user) {
    console.log('[ProtectedRouteLogic] Auth loaded, user exists. Rendering protected content.');
    return (
      <>
        <Header />
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
      </>
    );
  }

  // If auth is loaded, no user, and redirect to login is in progress
  console.log('[ProtectedRouteLogic] Auth loaded, no user. Redirect to /auth/login should be in progress or already happened.');
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-2 text-muted-foreground">Redirecting to login...</p>
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("[AppLayout] Rendering...");
  return (
    <AuthProvider>
      <ProtectedRouteLogic>
        {children}
      </ProtectedRouteLogic>
    </AuthProvider>
  );
}
// src/providers/AuthProviderWrapper.tsx
'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AuthProvider, { useAuth } from '@/providers/AuthProvider'; // Import useAuth as well
import { Loader2 } from 'lucide-react'; // Use Loader2 for consistency

// Component to handle auth state logic and conditional rendering/redirects
function AuthLogic({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname.startsWith('/auth');

  useEffect(() => {
    // Don't run redirect logic until auth state is determined
    if (authLoading) {
      console.log("[AuthLogic] Waiting for auth state...");
      return;
    }

    console.log(`[AuthLogic] Auth loaded. User: ${!!user}, Path: ${pathname}, IsAuthPage: ${isAuthPage}`);

    // Scenario 1: User is logged in
    if (user) {
      // If logged-in user is on an auth page (e.g., /auth/login), redirect them to dashboard
      if (isAuthPage) {
        console.log("[AuthLogic] User logged in, on auth page. Redirecting to /dashboard...");
        router.replace('/dashboard');
      } else {
         console.log("[AuthLogic] User logged in, on protected page. Allowing access.");
         // User is logged in and on a protected page, allow rendering (handled below)
      }
    }
    // Scenario 2: User is logged out
    else {
      // If logged-out user is on a protected page, redirect them to login
      if (!isAuthPage) {
        console.log("[AuthLogic] User logged out, on protected page. Redirecting to /auth/login...");
        router.replace('/auth/login');
      } else {
         console.log("[AuthLogic] User logged out, on auth page. Allowing access.");
         // User is logged out and on an auth page, allow rendering (handled below)
      }
    }
  }, [user, authLoading, isAuthPage, pathname, router]);

  // --- Rendering Logic ---

  // 1. Show loading spinner while auth state is being determined
  if (authLoading) {
    console.log("[AuthLogic] Rendering global loading spinner...");
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
      </div>
    );
  }

  // 2. If auth is loaded, decide what to render based on auth status and route
  // Render children (actual page content) if:
  // - User is logged in AND on a protected page
  // - User is logged out AND on an auth page
  if ((user && !isAuthPage) || (!user && isAuthPage)) {
     console.log("[AuthLogic] Rendering page content.");
     return <>{children}</>;
  }

  // 3. In other cases (e.g., logged-in user on auth page *before* redirect finishes,
  // or logged-out user on protected page *before* redirect finishes), show a spinner
  // to prevent flashing incorrect content.
  console.log("[AuthLogic] Conditions not met for rendering children, showing intermediate loading spinner.");
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <Loader2 className="animate-spin h-12 w-12 text-primary" />
    </div>
  );
}


// Wrapper component that includes the Provider
export function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthLogic>
          {children}
      </AuthLogic>
    </AuthProvider>
  );
}

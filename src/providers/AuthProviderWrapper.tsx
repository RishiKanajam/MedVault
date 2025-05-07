// src/providers/AuthProviderWrapper.tsx
'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import AuthProvider, { useAuth } from '@/providers/AuthProvider';
import { Loader2 } from 'lucide-react';

// Define public paths that don't require authentication for AuthLogic
const PUBLIC_PATHS_PREFIX = ['/auth'];

// Component to handle auth state logic and conditional rendering/redirects
function AuthLogic({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading, profile } = useAuth(); // Use isUserLoading; profile might be used for advanced checks later
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams(); // For redirectedFrom

  const isAuthPage = PUBLIC_PATHS_PREFIX.some(prefix => pathname.startsWith(prefix));

  useEffect(() => {
    // Wait for the initial user authentication state to be resolved
    if (isUserLoading) {
      console.log("[AuthLogic] Waiting for user authentication state resolution...");
      return;
    }

    console.log(`[AuthLogic] User auth state resolved. User: ${!!user}, Path: ${pathname}, IsAuthPage: ${isAuthPage}`);

    // Scenario 1: User is LOGGED IN
    if (user) {
      if (isAuthPage) { // Logged in, but on an auth page (e.g., /auth/login trying to be accessed directly)
        const targetPath = searchParams.get('redirectedFrom') || '/dashboard';
        console.log(`[AuthLogic] User logged in, on auth page. Redirecting to ${targetPath}...`);
        router.replace(targetPath);
      }
      // Else: Logged in and on a protected page (or / if it's meant for logged-in users too) - do nothing, allow rendering.
    }
    // Scenario 2: User is LOGGED OUT
    else {
      // If logged out and trying to access a protected page (not an auth page and not the root landing page)
      if (!isAuthPage && pathname !== '/') { // Assuming '/' is the public landing page
        console.log(`[AuthLogic] User logged out, on protected page ${pathname}. Redirecting to /auth/login...`);
        const loginUrl = new URL('/auth/login', window.location.origin);
        loginUrl.searchParams.set('redirectedFrom', pathname); // Preserve intended destination
        router.replace(loginUrl.toString());
      }
      // Else: Logged out and on an auth page or the root landing page - do nothing, allow rendering.
    }
  }, [user, isUserLoading, isAuthPage, pathname, router, searchParams]);

  // --- Rendering Logic ---

  // 1. Show global loading spinner ONLY while the initial auth user check is happening.
  if (isUserLoading) {
    console.log("[AuthLogic] Rendering global loading spinner (initial user state check)...");
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // 2. If user auth state is resolved, and the user is in the correct state for the current page, render children.
  //    (e.g., logged in on protected page OR logged out on auth page/landing page).
  //    The redirect logic in useEffect handles navigation away if the state is incorrect.
  if ((user && !isAuthPage) || (!user && isAuthPage) || (!user && pathname === '/')) {
     console.log("[AuthLogic] User auth state resolved. Rendering page content.");
     return <>{children}</>;
  }

  // 3. If user auth state is resolved, but the user state doesn't match the page type (e.g., logged in on /auth/login, or logged out on /dashboard),
  //    show a temporary spinner while the redirect (triggered by useEffect) occurs.
  //    This prevents flashing the wrong page content briefly.
  console.log("[AuthLogic] User auth state resolved but waiting for redirect based on state/path mismatch. Showing intermediate spinner.");
  return (
     <div className="flex min-h-screen items-center justify-center bg-background">
       <Loader2 className="h-12 w-12 animate-spin text-primary" />
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

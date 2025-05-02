// src/providers/AuthProviderWrapper.tsx
'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AuthProvider, { useAuth } from '@/providers/AuthProvider'; // Import useAuth as well
import { Loader2 } from 'lucide-react'; // Use Loader2 for consistency

// Component to handle auth state logic and conditional rendering/redirects
function AuthLogic({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useAuth(); // Get user and loading state from context
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname.startsWith('/auth');

  useEffect(() => {
    // Skip redirect logic if still loading auth state initially
    if (authLoading) {
      console.log("[AuthLogic] Waiting for auth state...");
      return;
    }

    console.log(`[AuthLogic] Auth loaded. User: ${!!user}, Path: ${pathname}, IsAuthPage: ${isAuthPage}`);

    // Redirect logic:
    // 1. Logged in user on an auth page -> redirect to dashboard
    if (user && isAuthPage) {
      console.log("[AuthLogic] User logged in, on auth page. Redirecting to /dashboard...");
      router.replace('/dashboard');
    }
    // 2. Logged out user on a protected page -> redirect to login
    else if (!user && !isAuthPage) {
      console.log("[AuthLogic] User logged out, on protected page. Redirecting to /auth/login...");
      const loginUrl = new URL('/auth/login', window.location.origin); // Use window.location.origin for base URL
      loginUrl.searchParams.set('redirectedFrom', pathname);
      router.replace(loginUrl.toString()); // Use replace to avoid history issues
    } else {
        console.log("[AuthLogic] No redirect needed based on current auth state and path.");
    }

  }, [user, authLoading, isAuthPage, pathname, router]);

  // --- Rendering Logic ---

  // 1. Show global loading spinner ONLY while the initial auth check is happening.
  if (authLoading) {
    console.log("[AuthLogic] Rendering global loading spinner (initial auth check)...");
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
      </div>
    );
  }

  // 2. Once authLoading is false, render children immediately IF the conditions are met
  //    (logged in on protected page OR logged out on auth page).
  //    The redirect logic in useEffect will handle navigation away if needed.
  //    This prevents showing the spinner during the brief moment *after* loading finishes
  //    but *before* the redirect potentially kicks in.
  if ((user && !isAuthPage) || (!user && isAuthPage)) {
     console.log("[AuthLogic] Auth loaded. Rendering page content.");
     return <>{children}</>;
  }

  // 3. If conditions aren't met (e.g., logged-in user hits /auth/login directly),
  //    show a temporary spinner while the redirect occurs. This prevents flashing
  //    the login page briefly before navigating to the dashboard.
  console.log("[AuthLogic] Auth loaded but waiting for redirect, showing intermediate spinner.");
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

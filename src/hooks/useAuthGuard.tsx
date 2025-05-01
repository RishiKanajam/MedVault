'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Import usePathname
import { User } from 'firebase/auth';
import { auth } from '@/firebase'; // Corrected import path if needed
import { Loader2 } from 'lucide-react';
import { useUserContext } from '@/context/UserContext'; // Use context to get auth state

// Define AUTH_PATHS and PUBLIC_PATHS for client-side checks
const AUTH_PATHS = ['/auth/login', '/auth/signup'];
// Define any other paths accessible without authentication
const PUBLIC_PATHS = ['/']; // Example: Landing page at root

interface ClientSideAuthGuardProps {
  children: React.ReactNode;
}

/**
 * Component to handle client-side authentication state checks and redirects.
 * Shows a loading spinner until auth state is known.
 * @param props Component props including children to render when conditions met.
 */
export function ClientSideAuthGuard({ children }: ClientSideAuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  // Get user and loading state directly from UserContext
  const { authUser, loading: authLoading } = useUserContext();
  // Local state to prevent rendering children until the check is complete
  const [isCheckComplete, setIsCheckComplete] = useState(false);

  useEffect(() => {
    console.log("[ClientAuthGuard] Effect running. Path:", pathname, "Auth User:", authUser, "Auth Loading:", authLoading);

    // Wait until the authentication state is determined by UserContext
    if (authLoading) {
      console.log("[ClientAuthGuard] Waiting for auth context to load...");
      setIsCheckComplete(false); // Ensure check is not complete while loading
      return;
    }

    // Auth state is known, proceed with checks
    if (authUser) {
      // User is authenticated
      console.log("[ClientAuthGuard] User is authenticated.");
      // If user is on an auth page (login/signup), redirect to dashboard
      if (AUTH_PATHS.some(authPath => pathname.startsWith(authPath))) {
          console.log(`[ClientAuthGuard] Authenticated user on auth path ${pathname}. Redirecting to /dashboard.`);
          router.replace('/dashboard');
          // Redirecting, so don't mark check as complete yet for this render cycle
          return;
      }
    } else {
      // User is not authenticated
      console.log("[ClientAuthGuard] User is not authenticated.");
      // Check if the current path is a public or auth path
      const isAllowedUnauthPath = AUTH_PATHS.some(authPath => pathname.startsWith(authPath)) || PUBLIC_PATHS.includes(pathname);

      if (!isAllowedUnauthPath) {
          console.log(`[ClientAuthGuard] Unauthenticated user on protected path ${pathname}. Redirecting to /auth/login.`);
          router.replace('/auth/login');
          // Redirecting, don't mark check as complete yet
          return;
      }
    }

    // If no redirect was triggered, the check is complete for the current state
    console.log("[ClientAuthGuard] Auth check complete, allowing render or child component.");
    setIsCheckComplete(true);

  }, [authUser, authLoading, router, pathname]);

  // Show loading spinner while auth state is loading OR if the check isn't complete yet
  if (authLoading || !isCheckComplete) {
    console.log("[ClientAuthGuard] Showing loading spinner (Auth Loading:", authLoading, "Check Complete:", isCheckComplete,")");
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is finished and check is complete, render children
  console.log("[ClientAuthGuard] Rendering children for path:", pathname);
  return <>{children}</>;
}

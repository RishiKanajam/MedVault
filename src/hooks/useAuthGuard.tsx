
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Import usePathname
import { User } from 'firebase/auth';
import { auth, db } from '@/firebase'; // Corrected import path if needed
import { Loader2 } from 'lucide-react';
import { useUserContext } from '@/context/UserContext'; // Use context to get auth state
import { doc, getDoc } from 'firebase/firestore';

// Define AUTH_PATHS and PUBLIC_PATHS for client-side checks
const AUTH_PATHS = ['/auth/login', '/auth/signup'];
// Define any other paths accessible without authentication
const PUBLIC_PATHS = ['/']; // Add other public paths if needed

interface ClientSideAuthGuardProps {
  children: React.ReactNode;
}

/**
 * Component to handle client-side authentication state checks and redirects.
 * Shows a loading spinner until auth state is known ONLY IF the route requires auth.
 * Public/Auth routes are rendered immediately.
 * @param props Component props including children to render when conditions met.
 */
export function ClientSideAuthGuard({ children }: ClientSideAuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  // Get user and loading state directly from UserContext
  const { authUser, loading: authLoading } = useUserContext();
  // Local state to track if the initial auth check is needed and complete for protected routes
  const [isProtectedCheckComplete, setIsProtectedCheckComplete] = useState(false);

  const isAuthPage = AUTH_PATHS.some(authPath => pathname.startsWith(authPath));
  const isPublicPage = PUBLIC_PATHS.includes(pathname); // Check against explicitly public pages
  const isProtectedRoute = !isAuthPage && !isPublicPage;

  useEffect(() => {
    console.log("[ClientAuthGuard] Effect running. Path:", pathname, "Auth User:", !!authUser, "Auth Loading:", authLoading, "Is Protected:", isProtectedRoute);

    // Don't run checks if auth is still loading AND it's a protected route
    if (authLoading && isProtectedRoute) {
      console.log("[ClientAuthGuard] Waiting for auth context on protected route...");
      setIsProtectedCheckComplete(false); // Ensure check is not complete while loading
      return; // Spinner will be shown below
    }

    // Auth state is known OR it's not a protected route (render immediately)

    if (authUser) {
      // User is authenticated
      console.log("[ClientAuthGuard] User is authenticated.");
      // If user is on an auth page (login/signup), redirect to dashboard
      if (isAuthPage) {
          console.log(`[ClientAuthGuard] Authenticated user on auth path ${pathname}. Redirecting to /dashboard.`);
          router.replace('/dashboard');
          return; // Redirecting, don't mark check as complete for this cycle
      }
    } else {
      // User is not authenticated
      console.log("[ClientAuthGuard] User is not authenticated.");
      // If user tries to access a protected route, redirect to login
      if (isProtectedRoute) {
          console.log(`[ClientAuthGuard] Unauthenticated user on protected path ${pathname}. Redirecting to /auth/login.`);
          router.replace('/auth/login');
          return; // Redirecting
      }
    }

    // If we reach here, it means:
    // 1. Auth state is loaded (authLoading is false)
    // 2. User is on the correct type of page (auth page, public page, or protected page when authenticated)
    // Mark the check as complete for protected routes so children can render
     if (isProtectedRoute) {
       setIsProtectedCheckComplete(true);
     }

  }, [authUser, authLoading, router, pathname, isProtectedRoute, isAuthPage]);

  // --- Rendering Logic ---

  // 1. Allow Auth and Public pages to render immediately without waiting for auth state
  if (isAuthPage || isPublicPage) {
    console.log(`[ClientAuthGuard] Rendering public/auth page immediately: ${pathname}`);
    return <>{children}</>;
  }

  // 2. For Protected Routes: Show spinner ONLY while auth is loading OR check is not complete
  if (isProtectedRoute && (authLoading || !isProtectedCheckComplete)) {
    console.log("[ClientAuthGuard] Showing loading spinner for protected route (Auth Loading:", authLoading, "Check Complete:", isProtectedCheckComplete, ")");
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // 3. For Protected Routes: If auth is loaded, check is complete, and user is authenticated, render children
  if (isProtectedRoute && isProtectedCheckComplete && authUser) {
    console.log("[ClientAuthGuard] Rendering protected route children for path:", pathname);
    return <>{children}</>;
  }

  // 4. Fallback: Should ideally not be reached if logic is correct, but render null or a minimal fallback
  // This handles the brief moment after authLoading becomes false but before a redirect effect might run.
  console.log("[ClientAuthGuard] Fallback rendering null (or loading state just finished). Path:", pathname);
  return null; // Or a minimal loading indicator if preferred
}

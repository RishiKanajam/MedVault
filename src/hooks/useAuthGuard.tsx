'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Import usePathname
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/firebase'; // Corrected import path if needed
import { Loader2 } from 'lucide-react';
import { useUserContext } from '@/context/UserContext'; // Use context to avoid duplicate listeners

// Define AUTH_PATHS and PUBLIC_PATHS for client-side checks
const AUTH_PATHS = ['/auth/login', '/auth/signup'];
const PUBLIC_PATHS = ['/']; // Example: Landing page at root

interface ClientSideAuthGuardProps {
  children: React.ReactNode;
}

/**
 * Component to handle client-side authentication state checks and redirects.
 * Shows a loading spinner until auth state is resolved.
 * @param props Component props including children to render when authenticated.
 */
export function ClientSideAuthGuard({ children }: ClientSideAuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { authUser, loading: userContextLoading } = useUserContext(); // Get user and loading state from context
  const [isChecking, setIsChecking] = useState(true); // Local loading state for initial check

  useEffect(() => {
     console.log("[ClientAuthGuard] Effect running. Path:", pathname, "Auth User:", authUser, "Context Loading:", userContextLoading);

    // Wait until the UserContext has finished its initial loading
    if (userContextLoading) {
       console.log("[ClientAuthGuard] Waiting for UserContext to load...");
       setIsChecking(true);
      return;
    }

     setIsChecking(false); // Context loaded, auth state is known

    if (authUser) {
      // User is authenticated
       console.log("[ClientAuthGuard] User is authenticated.");
       // Redirect away from auth pages if already logged in
        if (AUTH_PATHS.some(authPath => pathname.startsWith(authPath))) {
            console.log(`[ClientAuthGuard] Authenticated user on auth path ${pathname}. Redirecting to /dashboard.`);
            router.replace('/dashboard');
        }
        // Otherwise, allow rendering children (protected route)
    } else {
      // User is not authenticated
      console.log("[ClientAuthGuard] User is not authenticated.");
      // Check if the current path is allowed for unauthenticated users
       const isAllowedUnauthPath = AUTH_PATHS.some(authPath => pathname.startsWith(authPath)) || PUBLIC_PATHS.includes(pathname);

      if (!isAllowedUnauthPath) {
        console.log(`[ClientAuthGuard] Unauthenticated user on protected path ${pathname}. Redirecting to /auth/login.`);
        router.replace('/auth/login');
      }
       // If on an allowed path (like /auth/login), allow rendering children (the login/signup page)
    }

  }, [authUser, userContextLoading, router, pathname]);

  // Show loading spinner while the UserContext is loading or during the initial check/redirect phase
  if (isChecking || userContextLoading) {
      console.log("[ClientAuthGuard] Showing loading spinner...");
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If auth state is resolved and no redirect is needed for the current path, render children
  console.log("[ClientAuthGuard] Auth check complete, rendering children for path:", pathname);
  return <>{children}</>;
}

// Remove the old hook export if it's no longer used elsewhere
// export { useAuthGuard };

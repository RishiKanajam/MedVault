'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Import usePathname
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/firebase'; // Corrected import path if needed
import { Loader2 } from 'lucide-react';

interface UseAuthGuardOptions {
  requiredAuth?: boolean; // Does the route require authentication? (Default: true)
  redirectIfAuthenticated?: string; // Path to redirect to if user IS authenticated (e.g., for login/signup pages)
}

interface AuthGuardResult {
  user: User | null;
  loading: boolean;
}

/**
 * Hook to handle authentication state and protect routes client-side.
 * Redirects based on auth status. Module check is removed.
 * @param options Configuration for the auth guard.
 * @returns The authenticated user and loading state.
 */
export function useAuthGuard(options: UseAuthGuardOptions = {}): AuthGuardResult {
  const {
    requiredAuth = true,
    redirectIfAuthenticated,
  } = options;

  const router = useRouter();
  const pathname = usePathname(); // Get current path
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[AuthGuard] Initializing listener...");
    let isMounted = true; // Flag to prevent state updates on unmounted component

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return; // Don't update state if component unmounted

      setUser(currentUser);
      setLoading(true); // Reset loading on auth change

      if (currentUser) {
        console.log("[AuthGuard] User is authenticated:", currentUser.uid);
        // User is logged in
        if (redirectIfAuthenticated && pathname !== redirectIfAuthenticated) {
          console.log(`[AuthGuard] User authenticated, redirecting from auth page to ${redirectIfAuthenticated}`);
          router.replace(redirectIfAuthenticated);
          // Keep loading true until redirect completes, don't process further
          return;
        }
        // If not redirecting away from an auth page, stop loading
         console.log("[AuthGuard] User authenticated, allowing access to route:", pathname);
         if (isMounted) setLoading(false); // Allow rendering protected content

      } else {
        // User is logged out
        console.log("[AuthGuard] User is not authenticated.");
        if (requiredAuth) {
           console.log("[AuthGuard] Route requires authentication.");
           // Only redirect if not already on an auth path or public path
            const isAllowedUnauthPath = AUTH_PATHS.includes(pathname) || PUBLIC_PATHS.includes(pathname);
           if (!isAllowedUnauthPath) {
              console.log("[AuthGuard] Redirecting to /login");
              router.replace('/login');
               // Keep loading true until redirect completes
               return;
           } else {
               console.log("[AuthGuard] Already on an allowed unauthenticated path, allowing access.");
               if (isMounted) setLoading(false); // Allow rendering login/signup/public
           }
        } else {
           console.log("[AuthGuard] Route does not require auth.");
          if (isMounted) setLoading(false); // Allow rendering public content
        }
      }
    });

    // Cleanup subscription on unmount
    return () => {
       console.log("[AuthGuard] Cleaning up auth listener.");
       isMounted = false;
       unsubscribe();
    }
    // Add pathname to dependencies to re-evaluate redirects if path changes
  }, [requiredAuth, redirectIfAuthenticated, router, pathname]);

  return { user, loading };
}

// Optional: A wrapper component for easier usage in page layouts
interface ProtectedRouteProps {
  children: React.ReactNode;
  authGuardOptions?: UseAuthGuardOptions;
}

export function ProtectedRoute({ children, authGuardOptions }: ProtectedRouteProps) {
  // Use the hook to get loading status and handle redirects
  const { loading: isLoading } = useAuthGuard(authGuardOptions);

  if (isLoading) {
    // Show a loading spinner or skeleton screen while checking auth
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is complete, render the children (redirects handle unauthorized access)
  return <>{children}</>;
}

// Define AUTH_PATHS and PUBLIC_PATHS for use within the hook
const AUTH_PATHS = ['/login', '/signup'];
const PUBLIC_PATHS = ['/']; // Example: Landing page at root
// Remove MODULE_SETUP_PATH as it's no longer used for redirection logic here

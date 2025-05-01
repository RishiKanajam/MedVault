// src/hooks/useAuthGuard.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase';

interface UseAuthGuardOptions {
  requiredAuth?: boolean; // Does the route require authentication? (Default: true)
  checkModules?: boolean; // Should we check if modules are configured? (Default: true)
  redirectIfAuthenticated?: string; // Path to redirect to if user IS authenticated (e.g., for login/signup pages)
}

interface AuthGuardResult {
  user: User | null;
  loading: boolean;
}

/**
 * Hook to handle authentication state and protect routes client-side.
 * Redirects based on auth status and module configuration.
 * @param options Configuration for the auth guard.
 * @returns The authenticated user and loading state.
 */
export function useAuthGuard(options: UseAuthGuardOptions = {}): AuthGuardResult {
  const {
    requiredAuth = true,
    checkModules = true,
    redirectIfAuthenticated,
  } = options;

  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // User is logged in
        if (redirectIfAuthenticated) {
          console.log(`[AuthGuard] User authenticated, redirecting to ${redirectIfAuthenticated}`);
          router.replace(redirectIfAuthenticated);
          // Keep loading until redirect is complete to avoid rendering the original page
          return; // Exit early to prevent further checks until redirect happens
        }

        if (checkModules) {
          // Check Firestore for module configuration
          try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (!userDocSnap.exists() || !userDocSnap.data()?.settings?.modules) {
              console.log("[AuthGuard] Modules not configured, redirecting to /module-selection");
              router.replace('/module-selection');
              // Keep loading until redirect is complete
              return; // Exit early
            } else {
               console.log("[AuthGuard] User authenticated and modules configured.");
              setLoading(false); // Allow rendering protected content
            }
          } catch (error) {
            console.error("[AuthGuard] Error checking modules:", error);
            // Handle error case, maybe redirect to an error page or logout
            router.replace('/login'); // Fallback redirect
            return; // Exit early
          }
        } else {
           console.log("[AuthGuard] User authenticated, module check skipped.");
          setLoading(false); // Module check skipped, allow rendering
        }

      } else {
        // User is logged out
        if (requiredAuth) {
           console.log("[AuthGuard] User not authenticated, redirecting to /login");
          router.replace('/login');
          // Keep loading until redirect is complete
          return; // Exit early
        } else {
           console.log("[AuthGuard] User not authenticated, route does not require auth.");
          setLoading(false); // Route doesn't require auth, allow rendering
        }
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [requiredAuth, checkModules, redirectIfAuthenticated, router]);

  return { user, loading };
}

// Optional: A wrapper component for easier usage in page layouts
interface ProtectedRouteProps {
  children: React.ReactNode;
  authGuardOptions?: UseAuthGuardOptions;
}

export function ProtectedRoute({ children, authGuardOptions }: ProtectedRouteProps) {
  const { loading } = useAuthGuard(authGuardOptions);

  if (loading) {
    // Show a loading spinner or skeleton screen while checking auth/modules
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If loading is complete, render the children (redirects handle unauthorized access)
  return <>{children}</>;
}

// Need to import Loader2 if not globally available
import { Loader2 } from 'lucide-react';

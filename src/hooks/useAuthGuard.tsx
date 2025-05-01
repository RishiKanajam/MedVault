'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Import usePathname
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { Loader2 } from 'lucide-react'; // Ensure Loader2 is imported

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
    checkModules = true, // Default to checking modules for protected routes
    redirectIfAuthenticated,
  } = options;

  const router = useRouter();
  const pathname = usePathname(); // Get current path
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCheckedModules, setHasCheckedModules] = useState(!checkModules); // Track if module check is complete or skipped

  useEffect(() => {
    console.log("[AuthGuard] Initializing listener...");
    let isMounted = true; // Flag to prevent state updates on unmounted component

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return; // Don't update state if component unmounted

      setUser(currentUser);
      setLoading(true); // Reset loading on auth change
      setHasCheckedModules(!checkModules); // Reset module check status

      if (currentUser) {
        console.log("[AuthGuard] User is authenticated:", currentUser.uid);
        // User is logged in
        if (redirectIfAuthenticated && pathname !== redirectIfAuthenticated) { // Check if already on the target redirect path
          console.log(`[AuthGuard] User authenticated, redirecting from auth page to ${redirectIfAuthenticated}`);
          router.replace(redirectIfAuthenticated);
          return; // Exit early, loading remains true until redirect completes
        }

        if (checkModules) {
          console.log("[AuthGuard] Checking module configuration...");
          try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            const modules = userDocSnap.data()?.settings?.modules;

             if (!userDocSnap.exists() || !modules || typeof modules !== 'object' || Object.keys(modules).length === 0) {
              console.log("[AuthGuard] Modules not configured or empty.");
              // Only redirect if NOT already on the module selection page
              if (pathname !== MODULE_SETUP_PATH) {
                 console.log("[AuthGuard] Redirecting to /module-selection");
                router.replace(MODULE_SETUP_PATH);
                return; // Exit early, loading remains true until redirect completes
              } else {
                 console.log("[AuthGuard] Already on module selection page, allowing access.");
                 setHasCheckedModules(true); // Mark check as complete
                 if (isMounted) setLoading(false); // Stop loading on module selection page
              }
            } else {
              console.log("[AuthGuard] User authenticated and modules configured.");
               // If modules ARE configured, and we are currently on module-selection, redirect away.
               // Let the login/signup page handle the initial redirect *to* dashboard.
               // This guard prevents *staying* on module-selection if modules are already set.
               if (pathname === MODULE_SETUP_PATH) {
                   console.log("[AuthGuard] Modules configured, redirecting away from module-selection to /dashboard");
                   router.replace('/dashboard');
                   return; // Exit early
               }
              setHasCheckedModules(true); // Mark check as complete
              if (isMounted) setLoading(false); // Allow rendering protected content
            }
          } catch (error) {
            console.error("[AuthGuard] Error checking modules:", error);
            // Handle error case, maybe redirect to an error page or logout
            await auth.signOut(); // Log out user on error
            router.replace('/login'); // Fallback redirect
            return; // Exit early
          }
        } else {
           console.log("[AuthGuard] User authenticated, module check skipped.");
           setHasCheckedModules(true); // Mark as complete since check is skipped
           if (isMounted) setLoading(false); // Allow rendering
        }

      } else {
        // User is logged out
        console.log("[AuthGuard] User is not authenticated.");
        if (requiredAuth) {
           console.log("[AuthGuard] Route requires authentication.");
           // Only redirect if not already on an auth path or module selection
            const isAllowedUnauthPath = AUTH_PATHS.includes(pathname) || pathname === MODULE_SETUP_PATH || PUBLIC_PATHS.includes(pathname);
           if (!isAllowedUnauthPath) {
              console.log("[AuthGuard] Redirecting to /login");
              router.replace('/login');
              return; // Exit early, loading remains true until redirect completes
           } else {
               console.log("[AuthGuard] Already on an allowed unauthenticated path, allowing access.");
               if (isMounted) setLoading(false); // Allow rendering login/signup/module-setup/public
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
  }, [requiredAuth, checkModules, redirectIfAuthenticated, router, pathname]);

   // Determine final loading state based on auth check AND module check completion
   const finalLoadingState = loading || (checkModules && !hasCheckedModules && !!user);

  return { user, loading: finalLoadingState };
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

// Define AUTH_PATHS, MODULE_SETUP_PATH, and PUBLIC_PATHS for use within the hook
const AUTH_PATHS = ['/login', '/signup'];
const MODULE_SETUP_PATH = '/module-selection';
const PUBLIC_PATHS = ['/']; // Example: Landing page at root

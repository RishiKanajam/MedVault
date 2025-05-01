'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCheckedModules, setHasCheckedModules] = useState(!checkModules); // Track if module check is complete or skipped

  useEffect(() => {
    console.log("[AuthGuard] Initializing...");
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(true); // Reset loading on auth change
      setHasCheckedModules(!checkModules); // Reset module check status

      if (currentUser) {
        console.log("[AuthGuard] User is authenticated:", currentUser.uid);
        // User is logged in
        if (redirectIfAuthenticated) {
          console.log(`[AuthGuard] User authenticated, redirecting from auth page to ${redirectIfAuthenticated}`);
          router.replace(redirectIfAuthenticated);
          return; // Exit early, loading remains true until redirect completes
        }

        if (checkModules) {
          console.log("[AuthGuard] Checking module configuration...");
          try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            // Ensure settings and modules exist before accessing Object.keys
             const modules = userDocSnap.data()?.settings?.modules;


             if (!userDocSnap.exists() || !modules || Object.keys(modules).length === 0) {
              console.log("[AuthGuard] Modules not configured or empty, redirecting to /module-selection");
              // Only redirect if NOT already on the module selection page
              if (window.location.pathname !== '/module-selection') {
                router.replace('/module-selection');
                return; // Exit early, loading remains true until redirect completes
              } else {
                 console.log("[AuthGuard] Already on module selection page, allowing access.");
                 setHasCheckedModules(true); // Mark check as complete
                 setLoading(false); // Stop loading on module selection page
              }
            } else {
              console.log("[AuthGuard] User authenticated and modules configured.");
               // If modules ARE configured, and we are currently on module-selection, redirect away.
               if (window.location.pathname === '/module-selection') {
                   console.log("[AuthGuard] Modules configured, redirecting away from module-selection to /dashboard");
                   router.replace('/dashboard');
                   return; // Exit early
               }
              setHasCheckedModules(true); // Mark check as complete
              setLoading(false); // Allow rendering protected content
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
           setLoading(false); // Allow rendering
        }

      } else {
        // User is logged out
        console.log("[AuthGuard] User is not authenticated.");
        if (requiredAuth) {
           console.log("[AuthGuard] Route requires authentication, redirecting to /login");
           // Only redirect if not already on an auth path or module selection
            const isAuthPath = AUTH_PATHS.some(path => window.location.pathname.startsWith(path));
           if (!isAuthPath && window.location.pathname !== MODULE_SETUP_PATH) {
              router.replace('/login');
              return; // Exit early, loading remains true until redirect completes
           } else {
               console.log("[AuthGuard] Already on an auth/module path, allowing access.");
               setLoading(false); // Allow rendering login/signup/module-setup
           }
        } else {
           console.log("[AuthGuard] Route does not require auth.");
          setLoading(false); // Allow rendering public content
        }
      }

    });

    // Cleanup subscription on unmount
    return () => {
       console.log("[AuthGuard] Cleaning up auth listener.");
       unsubscribe();
    }
    // Removed router from dependencies as it can cause infinite loops in some Next.js versions if not memoized correctly.
    // The redirect logic should function correctly without it here.
  }, [requiredAuth, checkModules, redirectIfAuthenticated]);

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

// Define AUTH_PATHS and MODULE_SETUP_PATH for use within the hook
const AUTH_PATHS = ['/login', '/signup'];
const MODULE_SETUP_PATH = '/module-selection';

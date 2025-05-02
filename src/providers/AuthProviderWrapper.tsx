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
    if (!authLoading) {
      if (!user && !isAuthPage) {
        console.log("[AuthLogic] No user, not on auth page, redirecting to login.");
        router.replace('/auth/login');
      } else if (user && isAuthPage) {
        console.log("[AuthLogic] User logged in, on auth page, redirecting to dashboard.");
        router.replace('/dashboard'); // Redirect logged-in users away from auth pages
      }
    }
  }, [user, authLoading, isAuthPage, pathname, router]);

  // Show loading spinner only if auth is loading AND we are not on an auth page
  // Or if we are on an auth page but the user IS logged in (while redirecting)
  if (authLoading && (!isAuthPage || (isAuthPage && user))) {
     console.log("[AuthLogic] Showing global loading spinner...");
     return (
       <div className="flex items-center justify-center h-screen bg-background">
         <Loader2 className="animate-spin h-12 w-12 text-primary" />
       </div>
     );
  }

  // Render children only if:
  // 1. Auth is not loading AND user exists AND we are NOT on an auth page
  // 2. Auth is not loading AND user does NOT exist AND we ARE on an auth page
  if (!authLoading && ((user && !isAuthPage) || (!user && isAuthPage))) {
    return <>{children}</>;
  }

  // In other cases (like auth loading on auth page with no user), render nothing or a minimal placeholder
  // This prevents rendering protected content prematurely or auth pages when logged in.
  console.log("[AuthLogic] Condition not met for rendering children, rendering null/placeholder.");
   // Render a minimal loading or null if on auth page during load without user
   if (authLoading && isAuthPage && !user) {
       return (
           <div className="flex items-center justify-center h-screen bg-background">
               <Loader2 className="animate-spin h-12 w-12 text-primary" />
           </div>
       );
   }
  return null;
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
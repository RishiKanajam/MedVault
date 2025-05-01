
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider'; // Import the context hook
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, authLoading } = useAuth(); // Get user and loading state from context
  const router = useRouter();

  useEffect(() => {
    // Don't redirect until loading is complete
    if (authLoading) {
        console.log("[ProtectedRoute] Auth loading, waiting...");
        return;
    }

    // If loading is finished and there's no user, redirect to login
    if (!user) {
      console.log("[ProtectedRoute] No user found after load, redirecting to /auth/login");
      router.replace('/auth/login');
    } else {
         console.log("[ProtectedRoute] User found, allowing access.");
    }
  }, [user, authLoading, router]);

  // Show a loading spinner while the auth check is in progress *within this component's scope*
  // This might show briefly even if AuthProvider already loaded, ensuring we don't flash content
  if (authLoading) {
     return (
       // You might want a different spinner style here than the main AuthProvider one
       // Or simply return null if AuthProvider's spinner is sufficient
       <div className="flex min-h-screen items-center justify-center bg-background">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
  }

  // If loading is complete and user exists, render the children (the protected page content)
  // If user doesn't exist, the useEffect above will have initiated a redirect,
  // so rendering null here prevents flashing the protected content briefly.
  return user ? <>{children}</> : null;
};

export default ProtectedRoute;

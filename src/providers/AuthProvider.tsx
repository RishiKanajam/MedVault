// src/providers/AuthProvider.tsx
'use client';
import React, { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, isClient } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  clinicId: string;
  role: 'admin' | 'staff';
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log('[AuthProvider] useEffect running. isClient:', isClient, 'auth:', !!auth);
    let unsubscribe: (() => void) | undefined;

    const initializeAuth = async () => {
      // If we're on the server or auth isn't available, set loading to false and return
      if (!isClient || !auth) {
        setLoading(false);
        return;
      }

      try {
        // Set up auth state listener
        unsubscribe = onAuthStateChanged(auth, async (user) => {
          console.log('[AuthProvider] onAuthStateChanged fired. user:', user);
          if (user) {
            try {
              // Get user profile from Firestore
              const profileDoc = await getDoc(doc(db!, 'users', user.uid));
              if (profileDoc.exists()) {
                const data = profileDoc.data();
                console.log('[AuthProvider] profileDoc data:', data);
                setProfile({
                  uid: user.uid,
                  ...data,
                } as UserProfile);
              }
            } catch (error) {
              console.error('Error fetching user profile:', error);
            }
          } else {
            setProfile(null);
            // Only redirect if we're not already on an auth page
            if (!window.location.pathname.startsWith('/auth')) {
              router.push('/auth/login');
            }
          }
          setUser(user);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Cleanup subscription
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [router]);

  // Show loading state only during initial auth check
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Initializing session...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

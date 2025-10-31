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
  clinicName?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  authLoading: boolean;
  profileLoading: boolean;
  updateProfileData: (updates: Partial<UserProfile>) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  authLoading: true,
  profileLoading: false,
  updateProfileData: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log('[AuthProvider] useEffect running. isClient:', isClient, 'auth:', !!auth);
    let unsubscribe: (() => void) | undefined;

    const initializeAuth = async () => {
      // If we're on the server or auth isn't available, set loading to false and return
      if (!isClient || !auth) {
        setAuthLoading(false);
        return;
      }

      try {
        // Set up auth state listener
        unsubscribe = onAuthStateChanged(auth, async (user) => {
          console.log('[AuthProvider] onAuthStateChanged fired. user:', user);
          if (user) {
            setProfileLoading(true);
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
              } else {
                setProfile({
                  uid: user.uid,
                  name: user.displayName || '',
                  email: user.email || '',
                  clinicId: '',
                  role: 'staff',
                  photoURL: user.photoURL || '',
                });
              }
            } catch (error) {
              console.error('Error fetching user profile:', error);
            }
            setProfileLoading(false);
          } else {
            setProfile(null);
            setProfileLoading(false);
            // Only redirect if we're not already on an auth page
            if (!window.location.pathname.startsWith('/auth')) {
              router.push('/auth/login');
            }
          }
          setUser(user);
          setAuthLoading(false);
        });
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthLoading(false);
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

  const updateProfileData = (updates: Partial<UserProfile>) => {
    setProfile(prev => prev ? { ...prev, ...updates } : prev);
  };

  // Show loading state only during initial auth check
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Initializing session...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, authLoading, profileLoading, updateProfileData }}>
      {children}
    </AuthContext.Provider>
  );
}

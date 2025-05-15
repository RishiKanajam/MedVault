// src/providers/AuthProvider.tsx
'use client';
import React, { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/firebase';
import { doc, onSnapshot, DocumentData, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  clinicId: string;
  role: 'admin' | 'staff';
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
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      setLoading(true);

      if (user) {
        try {
          const profileDoc = await getDoc(doc(db, 'users', user.uid));
          if (profileDoc.exists()) {
            setProfile({
              uid: user.uid,
              ...profileDoc.data(),
            } as UserProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setProfile(null);
        // Redirect to login if not on auth pages
        if (!window.location.pathname.startsWith('/auth')) {
          router.push('/auth/login');
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    console.log("[AuthProvider] Rendering global loading spinner because loading is true.");
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Initializing session...</p>
      </div>
    );
  }

  console.log(`[AuthProvider] Rendering children. User: ${user?.uid}, loading: ${loading}`);

  const value = {
    user,
    profile,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

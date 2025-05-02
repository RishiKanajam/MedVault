// src/providers/AuthProvider.tsx
'use client';
import React, { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/firebase'; // Adjust import path if needed
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';

interface UserProfile {
  name: string | null;
  email: string | null;
  photoURL?: string | null;
  clinicId?: string; // Keep clinicId if used elsewhere
  settings?: {
    theme?: string | null;
    language?: string | null;
    // modules removed
  };
  createdAt?: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  authLoading: boolean;
}

// Provide default values matching the interface
export const AuthContext = createContext<AuthContextType>({ user: null, profile: null, authLoading: true });

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Renamed original AuthProvider to AuthProviderInternal or similar if needed elsewhere,
// but typically this component just provides the context state.
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true); // Use explicit name
  let profileUnsubscribe: (() => void) | null = null;

  useEffect(() => {
    console.log("[AuthProvider] Setting up auth state listener...");
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      console.log("[AuthProvider] Auth state changed. User:", currentUser?.uid);
      setUser(currentUser);

      if (profileUnsubscribe) {
        console.log("[AuthProvider] Cleaning up previous profile listener.");
        profileUnsubscribe();
        profileUnsubscribe = null;
      }

      if (currentUser) {
        console.log(`[AuthProvider] User signed in (${currentUser.uid}). Setting up profile listener...`);
        const userDocRef = doc(db, 'users', currentUser.uid);
        profileUnsubscribe = onSnapshot(
          userDocRef,
          (snap) => {
            if (snap.exists()) {
              const profileData = snap.data() as UserProfile;
              console.log("[AuthProvider] Profile data received:", profileData);
              setProfile(profileData);
            } else {
              console.warn(`[AuthProvider] No profile document found for user ${currentUser.uid}`);
              setProfile(null);
            }
            setAuthLoading(false); // Loading finished *after* profile check
          },
          (error) => {
            console.error("[AuthProvider] Error listening to profile:", error);
            setProfile(null);
            setAuthLoading(false);
          }
        );
      } else {
        console.log("[AuthProvider] User signed out.");
        setProfile(null);
        setAuthLoading(false); // Loading finished
      }
    });

    return () => {
      console.log("[AuthProvider] Cleaning up auth listener.");
      unsubAuth();
      if (profileUnsubscribe) {
        console.log("[AuthProvider] Cleaning up profile listener on unmount.");
        profileUnsubscribe();
      }
    };
  }, []);

  // AuthProvider now only provides the context value.
  // The loading UI is handled by the AuthProviderWrapper component.
  return (
    <AuthContext.Provider value={{ user, profile, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
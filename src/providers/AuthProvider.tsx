// src/providers/AuthProvider.tsx
'use client';
import React, { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/firebase'; // Use correct firebase path
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { Loader2 } from 'lucide-react'; // For loading spinner

interface UserProfile {
  name: string | null;
  email: string | null;
  photoURL?: string | null;
  clinicId?: string;
  settings?: {
    theme?: string | null;
    language?: string | null;
  };
  createdAt?: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  authLoading: boolean; // Renamed from loading for clarity
}

// Provide default values matching the interface
export const AuthContext = createContext<AuthContextType>({ user: null, profile: null, authLoading: true });

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);


export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true); // Start as true
  let profileUnsubscribe: (() => void) | null = null;

  useEffect(() => {
    console.log("[AuthProvider] Setting up auth state listener...");
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      console.log("[AuthProvider] Auth state determined. User:", currentUser?.uid);
      setUser(currentUser);
      setAuthLoading(false); // <<< Set loading to false as soon as auth state is known

      // Clean up previous profile listener if user changes or logs out
      if (profileUnsubscribe) {
        console.log("[AuthProvider] Cleaning up previous profile listener.");
        profileUnsubscribe();
        profileUnsubscribe = null;
        setProfile(null); // Clear old profile data
      }

      if (currentUser) {
        console.log(`[AuthProvider] User signed in (${currentUser.uid}). Setting up profile listener...`);
        const userDocRef = doc(db, 'users', currentUser.uid);
        // Note: Profile loading doesn't block anymore
        profileUnsubscribe = onSnapshot(
          userDocRef,
          (snap) => {
            if (snap.exists()) {
              const profileData = snap.data() as UserProfile;
              console.log("[AuthProvider] Profile data received:", profileData);
              setProfile(profileData);
            } else {
              console.warn(`[AuthProvider] No profile document found for user ${currentUser.uid}`);
              setProfile(null); // Explicitly set to null if doc doesn't exist
            }
          },
          (error) => {
            console.error("[AuthProvider] Error listening to profile:", error);
            setProfile(null); // Clear profile on error
          }
        );
      } else {
        console.log("[AuthProvider] User signed out. No profile to fetch.");
        setProfile(null); // Ensure profile is null when logged out
        // authLoading is already false
      }
    });

    // Cleanup function for the auth listener
    return () => {
      console.log("[AuthProvider] Cleaning up auth listener.");
      unsubAuth();
      // Cleanup profile listener if it exists
      if (profileUnsubscribe) {
        console.log("[AuthProvider] Cleaning up profile listener on unmount.");
        profileUnsubscribe();
      }
    };
    // Effect runs only once on mount
  }, []); // Empty dependency array is correct here


  // The AuthProviderWrapper now handles the visual loading state based on authLoading.
  // This provider just supplies the context value.
  return (
    <AuthContext.Provider value={{ user, profile, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

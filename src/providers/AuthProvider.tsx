// src/providers/AuthProvider.tsx
'use client';
import React, { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/firebase'; // Use correct firebase path
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

interface UserProfile {
  name: string | null;
  email: string | null;
  photoURL?: string | null;
  clinicId?: string; // Assuming clinicId might be part of the profile
  settings?: {
    theme?: string | null;
    language?: string | null;
    // Modules settings removed as per previous requests
  };
  createdAt?: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isUserLoading: boolean; // True until onAuthStateChanged fires for the first time and user object is known
  isProfileLoading: boolean; // True while profile is being fetched for a logged-in user
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isUserLoading: true,
  isProfileLoading: false,
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  let profileUnsubscribe: (() => void) | null = null;

  useEffect(() => {
    console.log("[AuthProvider] Setting up auth state listener...");
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      console.log("[AuthProvider] Auth state determined. User UID:", currentUser?.uid);
      setUser(currentUser);
      setIsUserLoading(false); // Auth user state is now resolved (either null or a User object)

      // Clean up previous profile listener if user changes or logs out
      if (profileUnsubscribe) {
        console.log("[AuthProvider] Cleaning up previous profile listener.");
        profileUnsubscribe();
        profileUnsubscribe = null;
        setProfile(null); // Clear old profile data
      }

      if (currentUser) {
        console.log(`[AuthProvider] User signed in (${currentUser.uid}). Setting up profile listener...`);
        setIsProfileLoading(true); // Profile fetching starts
        const userDocRef = doc(db, 'users', currentUser.uid);
        profileUnsubscribe = onSnapshot(
          userDocRef,
          (snap) => {
            if (snap.exists()) {
              const profileData = snap.data() as UserProfile;
              console.log("[AuthProvider] Profile data received:", profileData);
              setProfile(profileData);
            } else {
              console.warn(`[AuthProvider] No profile document found for user ${currentUser.uid}. This might happen if signup didn't complete Firestore write.`);
              setProfile(null); // Explicitly set to null if doc doesn't exist
            }
            setIsProfileLoading(false); // Profile fetching ends
          },
          (error) => {
            console.error("[AuthProvider] Error listening to profile:", error);
            setProfile(null); // Clear profile on error
            setIsProfileLoading(false); // Profile fetching ends on error
          }
        );
      } else {
        console.log("[AuthProvider] User signed out. No profile to fetch.");
        setProfile(null); // Ensure profile is null when logged out
        setIsProfileLoading(false); // No profile to load
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
  }, []); // Empty dependency array is correct here

  // AuthProvider itself does not render a loading spinner.
  // AuthProviderWrapper (or AuthLogic) handles the UI for loading states.
  return (
    <AuthContext.Provider value={{ user, profile, isUserLoading, isProfileLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

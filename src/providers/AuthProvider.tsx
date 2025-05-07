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
  clinicId?: string | null; // Clinic ID can be null, especially for guests
  settings?: {
    theme?: string | null;
    language?: string | null;
    // modules settings removed as per previous requests
  } | null; // Settings can be null
  createdAt?: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  authLoading: boolean; // Combined loading state for user and profile
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  authLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true); // Single loading state

  let profileUnsubscribe: (() => void) | null = null;

  useEffect(() => {
    console.log("[AuthProvider] Setting up auth state listener...");
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      console.log("[AuthProvider] Auth state determined. User UID:", currentUser?.uid, "Is Anonymous:", currentUser?.isAnonymous);
      setUser(currentUser);

      // Clean up previous profile listener if user changes or logs out
      if (profileUnsubscribe) {
        console.log("[AuthProvider] Cleaning up previous profile listener.");
        profileUnsubscribe();
        profileUnsubscribe = null;
        setProfile(null); // Clear old profile data
      }

      if (currentUser) {
        // For anonymous users, we don't expect a profile document in 'users' collection by default.
        // So, profile will remain null, and loading should resolve.
        if (currentUser.isAnonymous) {
          console.log(`[AuthProvider] Anonymous user signed in (${currentUser.uid}). No profile to fetch by default.`);
          setProfile(null);
          setAuthLoading(false); // Auth and profile (none) state resolved
        } else {
          // For non-anonymous users, attempt to fetch profile.
          console.log(`[AuthProvider] Non-anonymous user signed in (${currentUser.uid}). Setting up profile listener...`);
          // setAuthLoading(true); // No, keep it true until profile is loaded or confirmed not to exist
          const userDocRef = doc(db, 'users', currentUser.uid);
          profileUnsubscribe = onSnapshot(
            userDocRef,
            (snap) => {
              if (snap.exists()) {
                const profileData = snap.data() as UserProfile;
                console.log("[AuthProvider] Profile data received:", profileData);
                setProfile(profileData);
              } else {
                console.warn(`[AuthProvider] No profile document found for user ${currentUser.uid}.`);
                setProfile(null);
              }
              setAuthLoading(false); // Auth and profile state resolved
            },
            (error) => {
              console.error("[AuthProvider] Error listening to profile:", error);
              setProfile(null);
              setAuthLoading(false); // Auth and profile state resolved (with error)
            }
          );
        }
      } else {
        console.log("[AuthProvider] User signed out. No profile to fetch.");
        setProfile(null);
        setAuthLoading(false); // Auth (logged out) state resolved
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

  return (
    <AuthContext.Provider value={{ user, profile, authLoading }}>
      {authLoading ? (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

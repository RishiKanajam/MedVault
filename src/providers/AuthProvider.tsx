// src/providers/AuthProvider.tsx
'use client';
import React, { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, app as firebaseApp } from '@/firebase'; // Ensure app is imported for checking initialization
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

interface UserProfile {
  name: string | null;
  email: string | null;
  photoURL?: string | null;
  clinicId?: string | null;
  settings?: {
    theme?: string | null;
    language?: string | null;
  } | null;
  createdAt?: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  authLoading: boolean;
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
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    console.log("[AuthProvider] useEffect triggered. Initializing auth state listener...");
    // Ensure Firebase app is initialized
    if (!firebaseApp) {
        console.error("[AuthProvider] Firebase app is not initialized!");
        setAuthLoading(false); // Stop loading if Firebase isn't even set up
        return;
    }

    setAuthLoading(true); // Start with loading true
    let profileUnsubscribe: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      console.log("[AuthProvider] onAuthStateChanged fired. User:", currentUser?.uid, "Anonymous:", currentUser?.isAnonymous);
      setUser(currentUser);

      if (profileUnsubscribe) {
        console.log("[AuthProvider] Cleaning up previous profile listener.");
        profileUnsubscribe();
        profileUnsubscribe = null;
      }
      setProfile(null); // Reset profile on user change

      if (currentUser) {
        if (currentUser.isAnonymous) {
          console.log(`[AuthProvider] Anonymous user (${currentUser.uid}). No profile to fetch.`);
          setProfile(null); // Explicitly null for anonymous
          setAuthLoading(false);
          console.log("[AuthProvider] authLoading set to false (anonymous user).");
        } else {
          console.log(`[AuthProvider] Authenticated user (${currentUser.uid}). Setting up profile listener...`);
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
              setAuthLoading(false);
              console.log("[AuthProvider] authLoading set to false (profile loaded or not found).");
            },
            (error) => {
              console.error("[AuthProvider] Error listening to profile:", error);
              setProfile(null);
              setAuthLoading(false);
              console.log("[AuthProvider] authLoading set to false (profile listener error).");
            }
          );
        }
      } else {
        console.log("[AuthProvider] No user signed in.");
        setProfile(null);
        setAuthLoading(false);
        console.log("[AuthProvider] authLoading set to false (no user).");
      }
    }, (error) => {
        console.error("[AuthProvider] Error in onAuthStateChanged listener:", error);
        setUser(null);
        setProfile(null);
        setAuthLoading(false);
        console.log("[AuthProvider] authLoading set to false (onAuthStateChanged error).");
    });

    return () => {
      console.log("[AuthProvider] Cleaning up auth state listener.");
      unsubAuth();
      if (profileUnsubscribe) {
        console.log("[AuthProvider] Cleaning up profile listener on component unmount.");
        profileUnsubscribe();
      }
    };
  }, []); // Empty dependency array ensures this runs once on mount

  if (authLoading) {
    console.log("[AuthProvider] Rendering loading spinner because authLoading is true.");
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  console.log("[AuthProvider] Rendering children. User:", user?.uid, "Profile:", profile ? "Exists" : "Null");
  return (
    <AuthContext.Provider value={{ user, profile, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

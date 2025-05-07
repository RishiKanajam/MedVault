// src/providers/AuthProvider.tsx
'use client';
import React, { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, app as firebaseApp } from '@/firebase';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

interface UserProfile {
  name: string | null;
  email: string | null;
  photoURL?: string | null;
  clinicId?: string | null; // Added clinicId as per requirements
  settings?: {
    theme?: string | null;
    language?: string | null;
    // modules might be added here later if module selection is re-introduced
  } | null;
  createdAt?: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  authLoading: boolean; // True while initial Firebase auth check is happening
  profileLoading: boolean; // True while profile data for an authenticated user is being fetched
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  authLoading: true,
  profileLoading: true, // Initialize profileLoading as true
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true); // Separate loading state for profile

  useEffect(() => {
    console.log("[AuthProvider] useEffect triggered. Initializing auth state listener...");
    if (!firebaseApp) {
      console.error("[AuthProvider] Firebase app is not initialized!");
      setAuthLoading(false);
      setProfileLoading(false);
      return;
    }

    setAuthLoading(true); // Initial auth check is loading
    setProfileLoading(true); // Profile also loading initially

    let profileUnsubscribe: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      console.log(`[AuthProvider] onAuthStateChanged. User: ${currentUser ? currentUser.uid : 'null'}, Anonymous: ${currentUser?.isAnonymous}`);
      setUser(currentUser);
      setAuthLoading(false); // Firebase auth state is now known (user or null)

      if (profileUnsubscribe) {
        console.log("[AuthProvider] Cleaning up previous profile listener.");
        profileUnsubscribe();
        profileUnsubscribe = null;
      }
      setProfile(null); // Reset profile on user change

      if (currentUser) {
        if (currentUser.isAnonymous) {
          console.log(`[AuthProvider] Anonymous user (${currentUser.uid}). No profile to fetch.`);
          setProfile(null);
          setProfileLoading(false); // No profile to load for anonymous
        } else {
          console.log(`[AuthProvider] Authenticated user (${currentUser.uid}). Setting up profile listener...`);
          setProfileLoading(true); // Start loading profile
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
              setProfileLoading(false); // Profile loaded or confirmed not found
            },
            (error) => {
              console.error("[AuthProvider] Error listening to profile:", error);
              setProfile(null);
              setProfileLoading(false); // Error loading profile
            }
          );
        }
      } else {
        console.log("[AuthProvider] No user signed in.");
        setProfile(null);
        setProfileLoading(false); // No user, so no profile to load
      }
    }, (error) => {
      console.error("[AuthProvider] Error in onAuthStateChanged listener:", error);
      setUser(null);
      setProfile(null);
      setAuthLoading(false);
      setProfileLoading(false);
    });

    return () => {
      console.log("[AuthProvider] Cleaning up auth state listener.");
      unsubAuth();
      if (profileUnsubscribe) {
        console.log("[AuthProvider] Cleaning up profile listener on component unmount.");
        profileUnsubscribe();
      }
    };
  }, []);

  // Show spinner ONLY if initial Firebase auth check is ongoing.
  // Once auth state is known (user or null), authLoading becomes false.
  // Individual pages/components can then decide how to handle profileLoading.
  if (authLoading) {
    console.log("[AuthProvider] Rendering global loading spinner because authLoading is true.");
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Initializing session...</p>
      </div>
    );
  }

  console.log(`[AuthProvider] Rendering children. User: ${user?.uid}, authLoading: ${authLoading}, profileLoading: ${profileLoading}`);
  return (
    <AuthContext.Provider value={{ user, profile, authLoading, profileLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
// src/providers/AuthProvider.tsx
'use client';
import React, { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, firebaseApp } from '@/firebase';
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
  profileLoading: boolean; 
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  authLoading: true,
  profileLoading: true, 
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true); 

  useEffect(() => {
    console.log("[AuthProvider] useEffect triggered. Initializing auth state listener...");
    if (!firebaseApp) {
      console.error("[AuthProvider] Firebase app is not initialized! AuthProvider cannot function.");
      setAuthLoading(false);
      setProfileLoading(false);
      return;
    }

    console.log("[AuthProvider] Initial state: authLoading=true, profileLoading=true");
    setAuthLoading(true); 
    setProfileLoading(true);

    let profileUnsubscribe: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      console.log(`[AuthProvider] onAuthStateChanged fired. User UID: ${currentUser ? currentUser.uid : 'null'}, Anonymous: ${currentUser?.isAnonymous}`);
      setUser(currentUser);
      console.log("[AuthProvider] Setting authLoading to false.");
      setAuthLoading(false); 

      if (profileUnsubscribe) {
        console.log("[AuthProvider] Cleaning up previous profile listener.");
        profileUnsubscribe();
        profileUnsubscribe = null;
      }
      setProfile(null); 
      console.log("[AuthProvider] Profile reset.");

      if (currentUser) {
        if (currentUser.isAnonymous) {
          console.log(`[AuthProvider] Anonymous user (${currentUser.uid}). No profile to fetch.`);
          setProfile(null);
          console.log("[AuthProvider] Setting profileLoading to false (anonymous user).");
          setProfileLoading(false); 
        } else {
          console.log(`[AuthProvider] Authenticated user (${currentUser.uid}). Setting up profile listener. Setting profileLoading to true.`);
          setProfileLoading(true); 
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
              console.log("[AuthProvider] Setting profileLoading to false (profile snapshot received or not found).");
              setProfileLoading(false); 
            },
            (error) => {
              console.error("[AuthProvider] Error listening to profile:", error);
              setProfile(null);
              console.log("[AuthProvider] Setting profileLoading to false (profile snapshot error).");
              setProfileLoading(false); 
            }
          );
        }
      } else {
        console.log("[AuthProvider] No user signed in.");
        setProfile(null);
        console.log("[AuthProvider] Setting profileLoading to false (no current user).");
        setProfileLoading(false); 
      }
    }, (error) => {
      console.error("[AuthProvider] Error in onAuthStateChanged listener:", error);
      setUser(null);
      setProfile(null);
      console.log("[AuthProvider] Setting authLoading and profileLoading to false (onAuthStateChanged error).");
      setAuthLoading(false);
      setProfileLoading(false);
    });

    return () => {
      console.log("[AuthProvider] Cleaning up auth state listener (unsubAuth).");
      unsubAuth();
      if (profileUnsubscribe) {
        console.log("[AuthProvider] Cleaning up profile listener on component unmount (profileUnsubscribe).");
        profileUnsubscribe();
      }
    };
  }, []); // Empty dependency array ensures this runs once on mount

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

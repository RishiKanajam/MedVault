
'use client';
import React, { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/firebase'; // Adjust import path if needed
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { Loader2 } from 'lucide-react'; // Import a spinner icon

interface UserProfile {
  name: string | null;
  email: string | null;
  photoURL?: string | null;
  clinicId?: string; // Keep clinicId if used elsewhere
  settings?: {
    theme?: string | null;
    // modules removed
  };
  createdAt?: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  authLoading: boolean; // Renamed loading to authLoading for clarity
}

// Provide default values matching the interface
export const AuthContext = createContext<AuthContextType>({ user: null, profile: null, authLoading: true });

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // Internal loading state
  let profileUnsubscribe: (() => void) | null = null; // Variable to hold the profile listener cleanup function

  useEffect(() => {
    console.log("[AuthProvider] Setting up auth state listener...");
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      console.log("[AuthProvider] Auth state changed. User:", currentUser?.uid);
      setUser(currentUser); // Update the user state

      // Clean up previous profile listener if it exists
      if (profileUnsubscribe) {
        console.log("[AuthProvider] Cleaning up previous profile listener.");
        profileUnsubscribe();
        profileUnsubscribe = null;
      }

      if (currentUser) {
        // User is signed in, set up profile listener
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
              setProfile(null); // Or set a default profile structure
            }
            // Only set loading to false after profile (or lack thereof) is confirmed
            setLoading(false);
          },
          (error) => {
            console.error("[AuthProvider] Error listening to profile:", error);
            setProfile(null);
            setLoading(false); // Set loading false even on error
          }
        );
      } else {
        // User is signed out
        console.log("[AuthProvider] User signed out.");
        setProfile(null); // Clear profile
        setLoading(false); // Auth state is known (null), loading is finished
      }
    });

    // Cleanup function for the auth listener
    return () => {
      console.log("[AuthProvider] Cleaning up auth listener.");
      unsubAuth();
      // Cleanup profile listener if it's still active
      if (profileUnsubscribe) {
        console.log("[AuthProvider] Cleaning up profile listener on unmount.");
        profileUnsubscribe();
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Display a loading spinner while the initial auth check is in progress
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background"> {/* Added bg-background */}
        {/* Use Loader2 from lucide-react */}
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
      </div>
    );
  }

  // Provide the auth state and profile to children components
  return (
    <AuthContext.Provider value={{ user, profile, authLoading: loading }}>
      {children}
    </AuthContext.Provider>
  );
}

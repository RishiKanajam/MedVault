// src/context/UserContext.tsx
'use client'; // Mark as client component

import { auth, db } from "@/firebase"; // Corrected import path
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot, DocumentData } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";

interface UserProfile {
  name: string | null; // Changed from displayName for consistency with Firestore doc
  email: string | null;
  photoURL: string | null;
  clinicId?: string; // Optional clinic ID
  settings?: {
    modules?: { [key: string]: boolean } | null;
    theme?: string | null;
  };
  // Add an index signature to allow dynamic properties if necessary, but prefer explicit typing
   [key: string]: any;
}

interface UserContextType {
  authUser: User | null; // Renamed from 'user' to avoid conflict with common variable names
  profile: UserProfile | null;
  loading: boolean;
}

// Initialize context with default values matching the interface
const UserContext = createContext<UserContextType>({
  authUser: null,
  profile: null,
  loading: true,
});

export const useUserContext = () => useContext(UserContext); // Renamed hook for clarity

interface Props {
  children: React.ReactNode;
}

export const UserProvider = ({ children }: Props) => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      console.log("[UserProvider] Auth state changed. User:", user?.uid);
      setAuthUser(user);

      // Clean up previous Firestore listener if it exists
      if (unsubscribeFirestore) {
        console.log("[UserProvider] Cleaning up previous Firestore listener.");
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }
       // Reset profile when user logs out
       if (!user) {
        setProfile(null);
        setLoading(false); // Auth state determined, loading false
        return;
      }


      // User is logged in, set up Firestore listener for their profile
      if (user) {
        setLoading(true); // Start loading profile data
        const userDocRef = doc(db, "users", user.uid);
        console.log(`[UserProvider] Setting up Firestore listener for user: ${user.uid}`);

        unsubscribeFirestore = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              console.log("[UserProvider] Profile data received:", docSnap.data());
              setProfile(docSnap.data() as UserProfile);
            } else {
              // Handle case where user exists in Auth but not Firestore (shouldn't happen with proper signup)
              console.warn(`[UserProvider] No Firestore document found for user: ${user.uid}`);
              setProfile(null); // Set profile to null if doc doesn't exist
            }
             // Loading is false once the first snapshot is received (or determined not to exist)
            setLoading(false);
          },
          (error) => {
            // Handle listener errors
            console.error("[UserProvider] Firestore listener error:", error);
            setProfile(null); // Clear profile on error
            setLoading(false); // Stop loading even if there's an error
          }
        );
      } else {
         // Should be handled above, but as a safeguard
         setLoading(false);
      }
    });

    // Cleanup function for the auth listener AND any active Firestore listener
    return () => {
      console.log("[UserProvider] Cleaning up auth listener.");
      unsubscribeAuth();
      if (unsubscribeFirestore) {
        console.log("[UserProvider] Cleaning up Firestore listener on component unmount.");
        unsubscribeFirestore();
      }
    };
  }, []); // Run only once on mount

  return (
    <UserContext.Provider value={{ authUser, profile, loading }}>
      {children}
    </UserContext.Provider>
  );
};

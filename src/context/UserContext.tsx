// src/context/UserContext.tsx
'use client'; // Mark as client component

import { auth, db } from "@/firebase"; // Your Firebase initialization
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot, DocumentData } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

// Define a type for the user profile data you expect from Firestore
interface UserProfile {
  name: string | null;
  email: string | null;
  clinicId?: string | null; // Make clinicId optional/nullable for guests
  photoURL?: string | null;
  settings?: { // Settings object itself can be null or undefined
    theme?: string | null;
    language?: string | null;
    modules?: { // Modules object can be null or undefined
        medTrack?: boolean;
        shipments?: boolean;
        rxAI?: boolean;
        pharmaNet?: boolean;
        patientHistory?: boolean;
        reports?: boolean; // Added reports as per schema
    } | null;
  } | null;
  createdAt?: any; // Firestore Timestamp
  // Add other profile fields as needed
}

// Define the shape of your context state
interface UserContextState {
  authUser: User | null;
  profile: UserProfile | null;
  loading: boolean; // True if either auth state or profile data is loading
}

// Create the context with a default value
const UserContext = createContext<UserContextState>({
  authUser: null,
  profile: null,
  loading: true,
});

// Custom hook to use the UserContext
export const useUserContext = () => useContext(UserContext);

// Provider component
export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // Combined loading state

  useEffect(() => {
    console.log("[UserProvider] Setting up auth state listener...");
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      console.log("[UserProvider] Auth state changed. User:", user?.uid, "Is Anonymous:", user?.isAnonymous);
      setAuthUser(user);

      if (user) {
        // For anonymous users, profile will remain null unless explicitly created.
        if (user.isAnonymous) {
          console.log("[UserProvider] Anonymous user detected. Profile will be null.");
          setProfile(null);
          setLoading(false);
          return; // No profile to fetch for anonymous users by default
        }

        // For non-anonymous users, fetch profile
        console.log("[UserProvider] Non-anonymous user. Setting up profile listener for UID:", user.uid);
        const userDocRef = doc(db, "users", user.uid);
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const profileData = docSnap.data() as UserProfile;
            console.log("[UserProvider] Profile data fetched:", profileData);
            setProfile(profileData);
          } else {
            console.warn(`[UserProvider] No profile document found for user ${user.uid}. This might be an issue if user is not anonymous.`);
            setProfile(null); // Ensure profile is null if doc doesn't exist
          }
          setLoading(false); // Loading finished after profile fetch attempt
        }, (error) => {
            console.error("[UserProvider] Error fetching profile:", error);
            setProfile(null);
            setLoading(false); // Loading finished even on error
        });
        return () => {
            console.log("[UserProvider] Cleaning up profile listener for UID:", user.uid);
            unsubscribeProfile();
        };
      } else {
        console.log("[UserProvider] No user authenticated. Clearing profile.");
        setProfile(null);
        setLoading(false); // Loading finished as there's no user
      }
    });

    // Cleanup auth subscription on unmount
    return () => {
        console.log("[UserProvider] Cleaning up auth state listener.");
        unsubscribeAuth();
    }
  }, []);


  // The provider itself no longer renders a spinner directly.
  // AuthProviderWrapper or individual page logic handles loading UI based on context.
  return (
    <UserContext.Provider value={{ authUser, profile, loading }}>
      {children}
    </UserContext.Provider>
  );
};

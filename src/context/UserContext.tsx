'use client'; // Mark as client component

import { auth, db } from "@/firebase"; // Your Firebase initialization
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot, DocumentData, getDoc, setDoc } from "firebase/firestore"; // Added getDoc, setDoc
import React, { createContext, useContext, useEffect, useState } from "react";

interface UserProfile {
  name: string | null;
  email: string | null;
  photoURL?: string | null; // Made optional
  clinicId?: string;
  settings?: {
    modules?: { [key: string]: boolean } | null; // Removed - no longer used
    theme?: string | null;
  };
  // Add an index signature removed - prefer explicit typing
  createdAt?: any; // Add createdAt field if needed
}

interface UserContextType {
  authUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const UserContext = createContext<UserContextType>({
  authUser: null,
  profile: null,
  loading: true,
});

export const useUserContext = () => useContext(UserContext);

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

      if (unsubscribeFirestore) {
        console.log("[UserProvider] Cleaning up previous Firestore listener.");
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // User is logged in, ensure Firestore doc exists and set up listener
      if (user) {
        setLoading(true);
        const userDocRef = doc(db, "users", user.uid);
        console.log(`[UserProvider] Checking/setting up Firestore listener for user: ${user.uid}`);

        // Check if document exists, create if not (e.g., legacy users or signup issue)
        // This is a fallback, the signup flow should ideally create it.
        try {
          const docSnap = await getDoc(userDocRef);
          if (!docSnap.exists()) {
            console.warn(`[UserProvider] Firestore doc missing for ${user.uid}, creating default.`);
            await setDoc(userDocRef, {
              name: user.displayName || "User", // Use Auth display name as fallback
              email: user.email,
              createdAt: serverTimestamp(), // Assuming you import serverTimestamp
            }, { merge: true }); // Use merge to be safe
          }
        } catch (error) {
          console.error("[UserProvider] Error checking/creating user doc:", error);
          // Decide how to handle this - maybe prevent login or set profile to null
          setProfile(null);
          setLoading(false);
          return; // Exit if we can't ensure the doc exists
        }


        // Now set up the listener
        unsubscribeFirestore = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              console.log("[UserProvider] Profile data received/updated:", docSnap.data());
              setProfile(docSnap.data() as UserProfile);
            } else {
              // This case should be less likely now due to the check above
              console.warn(`[UserProvider] No Firestore document found for user (after check): ${user.uid}`);
              setProfile(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error("[UserProvider] Firestore listener error:", error);
            setProfile(null);
            setLoading(false);
          }
        );
      } else {
         setLoading(false);
      }
    });

    return () => {
      console.log("[UserProvider] Cleaning up auth listener.");
      unsubscribeAuth();
      if (unsubscribeFirestore) {
        console.log("[UserProvider] Cleaning up Firestore listener on component unmount.");
        unsubscribeFirestore();
      }
    };
  }, []);

  return (
    <UserContext.Provider value={{ authUser, profile, loading }}>
      {children}
    </UserContext.Provider>
  );
};

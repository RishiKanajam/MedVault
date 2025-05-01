// src/lib/firebase.ts
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
// import { getFunctions, Functions } from 'firebase/functions'; // Uncomment if using Firebase Functions

// Log missing variables to help debugging
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    console.warn("Firebase Warning: NEXT_PUBLIC_FIREBASE_API_KEY is not set in the environment. Authentication will fail.");
}
// Add similar checks for other required variables if needed

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "MISSING_API_KEY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized");
} else {
  app = getApps()[0];
  console.log("Using existing Firebase app instance");
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);
// const functions: Functions = getFunctions(app); // Uncomment if needed

// TODO: Consider enabling Firestore persistence carefully in Next.js
// import { enableIndexedDbPersistence } from 'firebase/firestore';
// if (typeof window !== 'undefined') { ... }

export { app, auth, db, storage /*, functions */ };

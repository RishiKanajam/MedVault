// src/firebase.ts
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics } from "firebase/analytics"; // Import Analytics

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Optional
};


// Initialize Firebase
let app: FirebaseApp;
let analytics: Analytics | null = null; // Initialize analytics as null

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized with new config");
  if (typeof window !== 'undefined') { // Ensure analytics is initialized only on client
    analytics = getAnalytics(app);
    console.log("Firebase Analytics initialized");
  }
} else {
  app = getApps()[0];
  console.log("Using existing Firebase app instance");
  if (typeof window !== 'undefined' && !analytics) { // Initialize analytics if not already
     try {
        analytics = getAnalytics(app);
        console.log("Firebase Analytics initialized for existing app instance");
     } catch (e) {
        console.warn("Could not initialize Analytics for existing app instance", e);
     }
  }
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);
// const functions: Functions = getFunctions(app); // Uncomment if needed

// TODO: Consider enabling Firestore persistence carefully in Next.js
// import { enableIndexedDbPersistence } from 'firebase/firestore';
// if (typeof window !== 'undefined') { ... }

export { app, auth, db, storage, analytics /*, functions */ };

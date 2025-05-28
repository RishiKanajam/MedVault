// src/firebase.ts
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics } from "firebase/analytics"; // Import Analytics


const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Debug logging
if (typeof window !== 'undefined') {
  console.log('Firebase Config Values:', {
    apiKey: firebaseConfig.apiKey ? 'Set' : 'Not Set',
    authDomain: firebaseConfig.authDomain ? 'Set' : 'Not Set',
    projectId: firebaseConfig.projectId ? 'Set' : 'Not Set',
    storageBucket: firebaseConfig.storageBucket ? 'Set' : 'Not Set',
    messagingSenderId: firebaseConfig.messagingSenderId ? 'Set' : 'Not Set',
    appId: firebaseConfig.appId ? 'Set' : 'Not Set',
    measurementId: firebaseConfig.measurementId ? 'Set' : 'Not Set'
  });
}

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;

// Check if we're running on the client side
const isClient = typeof window !== 'undefined';

if (isClient) {
  // Debug logging for client-side
  console.log('Firebase Config Values:', {
    apiKey: firebaseConfig.apiKey ? 'Set' : 'Not Set',
    authDomain: firebaseConfig.authDomain ? 'Set' : 'Not Set',
    projectId: firebaseConfig.projectId ? 'Set' : 'Not Set',
    storageBucket: firebaseConfig.storageBucket ? 'Set' : 'Not Set',
    messagingSenderId: firebaseConfig.messagingSenderId ? 'Set' : 'Not Set',
    appId: firebaseConfig.appId ? 'Set' : 'Not Set',
    measurementId: firebaseConfig.measurementId ? 'Set' : 'Not Set'
  });

  try {
    // Initialize Firebase only on the client side
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log("Firebase initialized successfully");
    } else {
      app = getApps()[0];
      console.log("Using existing Firebase app instance");
    }

    // Initialize services only on the client side
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    // Enable persistence for auth and firestore
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log("Auth persistence enabled");
      })
      .catch((error) => {
        console.warn("Auth persistence error:", error);
      });

    enableIndexedDbPersistence(db)
      .then(() => {
        console.log("Firestore persistence enabled");
      })
      .catch((error) => {
        if (error.code === 'failed-precondition') {
          console.warn("Firestore persistence failed: Multiple tabs open");
        } else if (error.code === 'unimplemented') {
          console.warn("Firestore persistence not available");
        }
      });

    // Initialize analytics only on the client side
    try {
      analytics = getAnalytics(app);
      console.log("Firebase Analytics initialized");
    } catch (e) {
      console.warn("Could not initialize Analytics:", e);
    }
  } catch (error) {
    console.error("Firebase initialization error:", error);
    throw error;
  }
} else {
  // Server-side: Initialize a minimal app without auth
  console.log('Running on server side, using minimal Firebase initialization');
  app = initializeApp({ projectId: 'dummy' });
  // Don't initialize auth, db, or storage on the server
}

// TODO: Consider enabling Firestore persistence carefully in Next.js
// import { enableIndexedDbPersistence } from 'firebase/firestore';
// if (typeof window !== 'undefined') { ... }

// Export null for server-side, actual instances for client-side
export { 
  app, 
  auth, 
  db, 
  storage, 
  analytics,
  isClient // Export this to check if we're on client side
};

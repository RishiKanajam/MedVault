// src/firebase.ts
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
// import { getFunctions, Functions } from 'firebase/functions'; // Uncomment if using Firebase Functions

// Your web app's Firebase configuration
// Use environment variables for security and flexibility

// --- IMPORTANT ---
// The error "auth/api-key-not-valid" strongly suggests that the
// environment variable `NEXT_PUBLIC_FIREBASE_API_KEY` is either:
// 1. Missing from your .env or .env.local file.
// 2. Present in the file, but the Next.js development server needs to be restarted
//    after adding/modifying the .env file.
// 3. The API key value itself, copied from Firebase Console, is incorrect.
// Please verify these points in your local setup. The code below correctly
// attempts to read the variable.
// ---

// Log missing variables to help debugging
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    console.warn("Firebase Warning: NEXT_PUBLIC_FIREBASE_API_KEY is not set in the environment. Authentication will fail.");
}
if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) {
    console.warn("Firebase Warning: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is not set in the environment.");
}
if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    console.warn("Firebase Warning: NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set in the environment.");
}
// Add similar checks for other required variables if needed

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "MISSING_API_KEY", // Provide fallback to avoid build errors, but auth will fail if missing
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Optional: For Google Analytics
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized");
} else {
  app = getApps()[0]; // Use the existing app if already initialized
  console.log("Using existing Firebase app instance");
}


const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);
// const functions: Functions = getFunctions(app); // Uncomment if using Firebase Functions

// Enable Firestore persistence (optional, for offline support)
// This requires careful handling in Next.js due to server/client differences
// import { enableIndexedDbPersistence } from 'firebase/firestore';
// if (typeof window !== 'undefined') { // Only run on client
//   enableIndexedDbPersistence(db)
//     .catch((err) => {
//       if (err.code == 'failed-precondition') {
//         // Multiple tabs open, persistence can only be enabled
//         // in one tab at a time.
//         console.warn('Firestore persistence failed: Multiple tabs open?');
//       } else if (err.code == 'unimplemented') {
//         // The current browser does not support all of the
//         // features required to enable persistence
//         console.warn('Firestore persistence failed: Browser does not support required features.');
//       } else {
//          console.error("Firestore persistence error:", err);
//       }
//     });
// }


export { app, auth, db, storage /*, functions */ }; // Export initialized services

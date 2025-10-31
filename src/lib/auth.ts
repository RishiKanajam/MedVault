import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { NextRequest } from 'next/server';

// Centralized Firebase Admin initialization
export function ensureFirebaseAdmin() {
  if (!getApps().length) {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error('Missing Firebase Admin configuration');
    }
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }
}

// Centralized session verification
export async function verifySession(req: NextRequest) {
  ensureFirebaseAdmin();
  
  const sessionCookie = req.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('__session='));
  if (!sessionCookie) {
    throw new Error('No session cookie found');
  }

  const token = sessionCookie.split('=')[1];
  if (!token) {
    throw new Error('Invalid session cookie format');
  }
  const decodedToken = await getAuth().verifySessionCookie(token);
  
  if (!decodedToken) {
    throw new Error('Invalid session token');
  }

  return decodedToken;
}

// Centralized session creation
export async function createSession(idToken: string, expiresIn: number = 60 * 60 * 24 * 5) {
  ensureFirebaseAdmin();
  
  const auth = getAuth();
  const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
  
  return sessionCookie;
}

// Centralized session revocation
export async function revokeSession(uid: string) {
  ensureFirebaseAdmin();
  
  const auth = getAuth();
  await auth.revokeRefreshTokens(uid);
}

// Centralized custom claims management
export async function setCustomClaims(uid: string, claims: Record<string, any>) {
  ensureFirebaseAdmin();
  
  const auth = getAuth();
  await auth.setCustomUserClaims(uid, claims);
}

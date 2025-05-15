import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      console.error('Missing Firebase Admin configuration:', {
        hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY
      });
      throw new Error('Missing Firebase Admin configuration');
    }

    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin initialized successfully in set-custom-claims route');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { uid, clinicId } = await req.json();

    if (!uid || !clinicId) {
      return NextResponse.json(
        { error: 'Missing required fields: uid and clinicId are required' },
        { status: 400 }
      );
    }

    // Set custom claims for the user
    await getAuth().setCustomUserClaims(uid, { clinicId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting custom claims:', error);
    return NextResponse.json(
      { error: 'Failed to set custom claims' },
      { status: 500 }
    );
  }
} 
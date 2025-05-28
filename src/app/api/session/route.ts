import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

function ensureFirebaseAdmin() {
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

export async function POST(req: Request) {
  try {
    ensureFirebaseAdmin();

    // Ensure the request is JSON
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    const { idToken } = await req.json();
    console.log('Received request to create session');

    if (!idToken) {
      console.error('No ID token provided');
      return NextResponse.json(
        { error: 'MISSING_ID_TOKEN' },
        { status: 400 }
      );
    }

    try {
      // Create session cookie
      const expiresIn = 60 * 60 * 24 * 5; // 5 days in seconds
      console.log('Creating session cookie...');
      
      const auth = getAuth();
      const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
      console.log('Session cookie created successfully');

      // Create response with cookie
      const response = NextResponse.json(
        { success: true },
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      // Set cookie options
      response.cookies.set({
        name: '__session',
        value: sessionCookie,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: expiresIn,
        path: '/',
        sameSite: 'lax',
      });

      console.log('Session cookie set in response');
      return response;
    } catch (error: any) {
      console.error('Error creating session cookie:', error);
      return NextResponse.json(
        {
          error: 'Failed to create session',
          details: error.message || 'Unknown error',
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  } catch (error: any) {
    console.error('Error in session creation:', error);
    return NextResponse.json(
      {
        error: 'Failed to create session',
        details: error.message || 'Unknown error',
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
} 
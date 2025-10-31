import { NextResponse } from 'next/server';
import { ensureFirebaseAdmin } from '@/lib/auth';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';

const verifySchema = z.object({
  idToken: z.string().min(1, 'ID token is required'),
});

export async function POST(req: Request) {
  try {
    ensureFirebaseAdmin();
    const adminAuth = getAuth();

    const body = await req.json();
    const { idToken } = verifySchema.parse(body);

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Get the user's custom claims
    const user = await adminAuth.getUser(decodedToken.uid);
    const customClaims = user.customClaims || {};

    // Create a new session cookie with the custom claims
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Set the session cookie in the response
    const response = NextResponse.json({ 
      success: true,
      customClaims,
      uid: decodedToken.uid
    });

    response.cookies.set('__session', sessionCookie, {
      maxAge: Math.floor(expiresIn / 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return response;
  } catch (error: any) {
    console.error('Error verifying session:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to verify session', details: error.message },
      { status: 401 }
    );
  }
}

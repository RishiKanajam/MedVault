import { NextResponse } from 'next/server';
import { setCustomClaims, ensureFirebaseAdmin } from '@/lib/auth';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';

const claimsSchema = z.object({
  uid: z.string().min(1, 'User ID is required'),
  clinicId: z.string().min(1, 'Clinic ID is required'),
});

export async function POST(req: Request) {
  try {
    // Require a Firebase ID token in the Authorization header.
    // The caller (signup flow) obtains this immediately after createUserWithEmailAndPassword.
    // This ensures only the authenticated user can set their own claims.
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }
    const idToken = authHeader.slice(7);

    ensureFirebaseAdmin();
    let decodedIdToken;
    try {
      decodedIdToken = await getAuth().verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: 'Invalid or expired ID token' }, { status: 401 });
    }

    const body = await req.json();
    const { uid, clinicId } = claimsSchema.parse(body);

    // Prevent a user from setting claims on a different user's account.
    if (decodedIdToken.uid !== uid) {
      return NextResponse.json({ error: 'Forbidden: uid mismatch' }, { status: 403 });
    }

    await setCustomClaims(uid, { clinicId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error setting custom claims:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to set custom claims', details: error.message },
      { status: 500 }
    );
  }
}
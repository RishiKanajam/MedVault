import { NextResponse } from 'next/server';
import { revokeSession, verifySession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const decodedToken = await verifySession(req as any);
    await revokeSession(decodedToken.uid);

    // Create response with cleared cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('__session', '', {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax' as const,
    });

    return response;
  } catch (error: any) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { error: 'Failed to logout', details: error.message },
      { status: 500 }
    );
  }
}
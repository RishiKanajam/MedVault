import { NextResponse } from 'next/server';
import { auth } from 'firebase-admin';

export async function POST(req: Request) {
  try {
    const sessionCookie = req.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('__session='));
    
    if (sessionCookie) {
      const decodedToken = await auth().verifySessionCookie(sessionCookie.split('=')[1]);
      await auth().revokeRefreshTokens(decodedToken.sub);
    }

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
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
} 
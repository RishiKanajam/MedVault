import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';
import { z } from 'zod';

const sessionSchema = z.object({
  idToken: z.string().min(1, 'ID token is required'),
});

export async function POST(req: Request) {
  try {
    // Validate content type
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const { idToken } = sessionSchema.parse(body);

    // Create session cookie
    const expiresIn = 60 * 60 * 24 * 5; // 5 days in seconds
    const sessionCookie = await createSession(idToken, expiresIn);

    // Create response with cookie
    const response = NextResponse.json({ success: true });
    
    // Set secure cookie
    response.cookies.set({
      name: '__session',
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: expiresIn,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('Error in session creation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create session', details: error.message },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { setCustomClaims } from '@/lib/auth';
import { z } from 'zod';

const claimsSchema = z.object({
  uid: z.string().min(1, 'User ID is required'),
  clinicId: z.string().min(1, 'Clinic ID is required'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, clinicId } = claimsSchema.parse(body);

    // Set custom claims for the user
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
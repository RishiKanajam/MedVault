import { NextResponse } from 'next/server';

export async function GET() {
  // Only check if variables exist, not their values
  const envCheck = {
    hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
    hasFirebaseApiKey: !!process.env.FIREBASE_API_KEY,
    nodeEnv: process.env.NODE_ENV,
    // Add other environment variables you want to check
  };

  return NextResponse.json(envCheck);
} 
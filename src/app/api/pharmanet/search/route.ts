import { NextResponse } from 'next/server';
import { auth } from 'firebase-admin';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

function ensureFirebaseAdmin() {
  if (!getApps().length) {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error('Missing Firebase Admin configuration');
    }
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  }
}

const RX_NORM_API_URL = 'https://rxnav.nlm.nih.gov/REST';

export async function GET(req: Request) {
  try {
    ensureFirebaseAdmin();
    const sessionCookie = req.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('__session='));
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await auth().verifySessionCookie(sessionCookie.split('=')[1]);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Call RxNorm API
    const response = await fetch(
      `${RX_NORM_API_URL}/drugs.json?name=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from RxNorm API');
    }

    const data = await response.json();
    
    // Transform the response to match our frontend interface
    const results = data.drugGroup?.conceptGroup?.flatMap((group: any) =>
      group.conceptProperties?.map((drug: any) => ({
        name: drug.name,
        rxcui: drug.rxcui,
        description: drug.synonym || drug.name,
      })) || []
    ) || [];

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in pharmanet/search:', error);
    return NextResponse.json(
      { error: 'Failed to search drugs' },
      { status: 500 }
    );
  }
} 
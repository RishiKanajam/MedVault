import { NextResponse } from 'next/server';
import { auth } from 'firebase-admin';
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

const RX_NORM_API_URL = 'https://rxnav.nlm.nih.gov/REST';

export async function GET(req: Request) {
  try {
    ensureFirebaseAdmin();
    const sessionCookie = req.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('__session='));
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionToken = sessionCookie.split('=')[1];
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await auth().verifySessionCookie(sessionToken);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    let results: Array<{ name: string; rxcui: string; description: string }> = [];

    try {
      const response = await fetch(
        `${RX_NORM_API_URL}/drugs.json?name=${encodeURIComponent(query)}`,
        { next: { revalidate: 60 * 60 } }
      );

      if (!response.ok) {
        throw new Error(`RxNorm responded with status ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the response to match our frontend interface
      results = data.drugGroup?.conceptGroup?.flatMap((group: any) =>
        group.conceptProperties?.map((drug: any) => ({
          name: drug.name,
          rxcui: drug.rxcui,
          description: drug.synonym || drug.name,
        })) || []
      ) || [];
    } catch (fetchError) {
      console.error('RxNorm fetch failed, serving fallback data:', fetchError);
      results = [
        {
          name: 'Aspirin',
          rxcui: '1191',
          description: 'Analgesic and antipyretic agent',
        },
        {
          name: 'Acetaminophen',
          rxcui: '161',
          description: 'Pain reliever and fever reducer',
        },
        {
          name: 'Ibuprofen',
          rxcui: '5640',
          description: 'Nonsteroidal anti-inflammatory drug (NSAID)',
        },
      ].filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in pharmanet/search:', error);
    return NextResponse.json(
      { error: 'Failed to search drugs' },
      { status: 500 }
    );
  }
} 

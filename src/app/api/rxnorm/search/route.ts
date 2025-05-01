// src/app/api/rxnorm/search/route.ts
import { NextRequest, NextResponse } from 'next/server';

const RXNORM_API_BASE = 'https://rxnav.nlm.nih.gov/REST';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name) {
    return NextResponse.json({ message: 'Drug name query parameter is required' }, { status: 400 });
  }

  try {
    const url = `${RXNORM_API_BASE}/rxcui.json?name=${encodeURIComponent(name)}&allsrc=0&search=1`; // Search within RxNorm source only initially
    console.log(`[API Route] Calling RxNorm Search API: ${url}`);
    const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
       console.error(`[API Route] RxNorm API error: ${response.status} ${response.statusText}`);
       const errorText = await response.text();
       console.error(`[API Route] RxNorm API error body: ${errorText}`);
       throw new Error(`RxNorm API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log(`[API Route] RxNorm Search Response:`, data);

    // Extract relevant information - structure might vary based on RxNorm response
    const results = data.idGroup?.rxnormId?.map((rxcui: string) => ({
        rxNormId: rxcui,
        // Attempt to find name associated with this rxcui - might need another call or better initial query
        // For now, returning the original search term as name - IMPROVE THIS
        name: name,
    })) || [];

    // A more robust approach might involve fetching names for each RxCUI found,
    // or using a different endpoint like /approximateTerm if needed.
    // Example: Fetch names (can be slow if many results)
    // const detailedResults = await Promise.all(results.map(async (res) => {
    //     const nameResponse = await fetch(`${RXNORM_API_BASE}/rxcui/${res.rxNormId}/property.json?propName=RxNorm%20Name`);
    //     const nameData = await nameResponse.json();
    //     return { ...res, name: nameData?.propConceptGroup?.propConcept?.[0]?.propValue || res.name };
    // }));


    return NextResponse.json({ results });

  } catch (error) {
     console.error('[API Route] Error in RxNorm search handler:', error);
     const message = error instanceof Error ? error.message : 'An unknown error occurred during RxNorm search.';
     return NextResponse.json({ message }, { status: 500 });
  }
}

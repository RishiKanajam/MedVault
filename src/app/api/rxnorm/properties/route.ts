// src/app/api/rxnorm/properties/route.ts
import { NextRequest, NextResponse } from 'next/server';

const RXNORM_API_BASE = 'https://rxnav.nlm.nih.gov/REST';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rxcui = searchParams.get('rxcui');

  if (!rxcui) {
    return NextResponse.json({ message: 'RxCUI query parameter is required' }, { status: 400 });
  }

  // --- Fetch All Properties (More Comprehensive) ---
  try {
    const allPropertiesUrl = `${RXNORM_API_BASE}/rxcui/${rxcui}/allProperties.json?prop=names+codes+basics`; // Fetch common properties
    console.log(`[API Route] Calling RxNorm All Properties API: ${allPropertiesUrl}`);
    const response = await fetch(allPropertiesUrl, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
       console.error(`[API Route] RxNorm All Properties API error: ${response.status} ${response.statusText}`);
       const errorText = await response.text();
       console.error(`[API Route] RxNorm All Properties API error body: ${errorText}`);
       throw new Error(`RxNorm All Properties API request failed for RxCUI ${rxcui} with status ${response.status}`);
    }

    const data = await response.json();
    console.log(`[API Route] RxNorm All Properties Response for ${rxcui}:`, data);

    // Extract and structure the properties as needed by the frontend
    // This is a simplified example; you'll need to parse the complex `propConceptGroup` array
    const properties = {
      description: data.propConceptGroup?.propConcept?.find((p: any) => p.propName === 'Definition')?.propValue || 'No description available.',
      // Add more fields by parsing the response, e.g., ingredients, dosage forms, etc.
      // Example: Find ingredients
      ingredients: data.propConceptGroup?.propConcept?.filter((p: any) => p.propName === 'Ingredient Name').map((p: any) => p.propValue) || [],
    };


    return NextResponse.json({ properties });

  } catch (error) {
    console.error(`[API Route] Error in RxNorm properties handler for ${rxcui}:`, error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching RxNorm properties.';
    return NextResponse.json({ message }, { status: 500 });
  }
}

import { NextRequest } from 'next/server';
import { ApiHandler } from '@/lib/api-handler';
import { z } from 'zod';

const RXNORM_API_BASE = 'https://rxnav.nlm.nih.gov/REST';

const searchSchema = z.object({
  name: z.string().min(1, 'Drug name is required').max(200, 'Drug name too long'),
});

export async function GET(req: NextRequest) {
  return ApiHandler.handleGetRequest(req, searchSchema, async (data) => {
    const { name } = data;

    try {
      const url = `${RXNORM_API_BASE}/rxcui.json?name=${encodeURIComponent(name)}&allsrc=0&search=1`;
      console.log(`[API Route] Calling RxNorm Search API: ${url}`);
      
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        // Add timeout
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        console.error(`[API Route] RxNorm API error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`[API Route] RxNorm API error body: ${errorText}`);
        throw new Error(`RxNorm API request failed with status ${response.status}`);
      }

      const apiData = await response.json();
      console.log(`[API Route] RxNorm Search Response:`, apiData);

      // Extract relevant information
      const results = apiData.idGroup?.rxnormId?.map((rxcui: string) => ({
        rxNormId: rxcui,
        name: name, // Using search term as name for now
      })) || [];

      return { results };
    } catch (error) {
      console.error(`[API Route] Error in RxNorm search handler:`, error);
      throw new Error(`RxNorm search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}
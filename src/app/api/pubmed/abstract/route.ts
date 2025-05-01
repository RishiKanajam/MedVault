// src/app/api/pubmed/abstract/route.ts
import { NextRequest, NextResponse } from 'next/server';

// PubMed API endpoint
const PUBMED_API_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';

// Ideally, use an API key if you make frequent requests
const NCBI_API_KEY = process.env.NCBI_API_KEY; // Add this to your .env file if you have one

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pmid = searchParams.get('pmid');

  if (!pmid || !/^\d+$/.test(pmid)) { // Basic validation for PMID
    return NextResponse.json({ message: 'Valid PMID query parameter is required' }, { status: 400 });
  }

  try {
    // Construct the efetch URL to get abstract text
    let url = `${PUBMED_API_BASE}efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml`; // Fetch XML first
    if (NCBI_API_KEY) {
      url += `&api_key=${NCBI_API_KEY}`;
    }

    console.log(`[API Route] Calling PubMed Fetch API: ${url}`);
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`[API Route] PubMed API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`[API Route] PubMed API error body: ${errorText}`);
      throw new Error(`PubMed API request failed for PMID ${pmid} with status ${response.status}`);
    }

    const xmlText = await response.text();
    console.log(`[API Route] PubMed XML Response for ${pmid}:`, xmlText.substring(0, 500) + '...'); // Log snippet

    // --- Simple XML Parsing (Might need a more robust parser for complex cases) ---
    let abstractText = 'Abstract not found or could not be parsed.';
    const abstractMatch = xmlText.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/);
    if (abstractMatch && abstractMatch[1]) {
        // Basic cleanup: remove potential inner tags like <Emphasis> if they exist, trim whitespace
        abstractText = abstractMatch[1].replace(/<[^>]+>/g, '').trim();
    } else {
        // Fallback check for older formats or different structures if needed
        const abstractTagMatch = xmlText.match(/<Abstract>([\s\S]*?)<\/Abstract>/);
        if(abstractTagMatch && abstractTagMatch[1]) {
            abstractText = abstractTagMatch[1].replace(/<[^>]+>/g, '').trim();
        }
    }

     // Extract Title
     let title = 'Title not found.';
     const titleMatch = xmlText.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/);
     if (titleMatch && titleMatch[1]) {
         title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
     }


    console.log(`[API Route] Parsed Abstract for ${pmid}:`, abstractText.substring(0, 200) + '...');

    return NextResponse.json({
       pmid: pmid,
       title: title,
       abstract: abstractText
     });

  } catch (error) {
    console.error(`[API Route] Error in PubMed abstract handler for ${pmid}:`, error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching PubMed abstract.';
    return NextResponse.json({ message }, { status: 500 });
  }
}

// import { getAuth } from '@clerk/nextjs/server';
// TODO: If authentication is needed, use Firebase Auth instead of Clerk.
// If not needed, remove all Clerk-related logic from this file.
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(req: Request) {
  try {
    // const { userId } = getAuth(req);
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await req.json();
    const { trialId } = body;

    if (!trialId) {
      return NextResponse.json(
        { error: 'Trial ID is required' },
        { status: 400 }
      );
    }

    // Fetch trial details from ClinicalTrials.gov
    const trialResponse = await fetch(
      `https://clinicaltrials.gov/api/query/study_fields?expr=NCTId[${trialId}]&fields=BriefTitle,BriefSummary,DetailedDescription&fmt=json`
    );

    if (!trialResponse.ok) {
      throw new Error('Failed to fetch trial details');
    }

    const data = await trialResponse.json();
    const trial = data.StudyFieldsResponse.StudyFields[0];

    if (!trial) {
      return NextResponse.json(
        { error: 'Trial not found' },
        { status: 404 }
      );
    }

    // Construct the prompt for Gemini
    const prompt = `
      As a medical AI assistant, provide a concise summary of this clinical trial:
      
      Title: ${trial.BriefTitle[0]}
      
      Brief Summary: ${trial.BriefSummary?.[0] || 'No brief summary available'}
      
      Detailed Description: ${trial.DetailedDescription?.[0] || 'No detailed description available'}
      
      Please provide a clear, concise summary that highlights:
      1. The main purpose of the trial
      2. Key eligibility criteria
      3. Primary outcomes
      4. Potential impact
      
      Keep the summary under 200 words and use plain language.
    `;

    // Generate response from Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const geminiResponse = await result.response;
    const summary = geminiResponse.text();

    // Get a more detailed analysis from Gamma
    try {
      const gammaModel = genAI.getGenerativeModel({ model: 'gamma' });
      const gammaPrompt = `
        As a medical AI assistant, provide a detailed analysis of this clinical trial:
        
        Title: ${trial.BriefTitle[0]}
        
        Brief Summary: ${trial.BriefSummary?.[0] || 'No brief summary available'}
        
        Detailed Description: ${trial.DetailedDescription?.[0] || 'No detailed description available'}
        
        Please provide:
        1. A comprehensive analysis of the trial design
        2. Statistical methodology
        3. Potential limitations
        4. Clinical significance
        5. Future implications
        
        Format the response as JSON:
        {
          "analysis": "string (detailed analysis)",
          "methodology": "string (statistical approach)",
          "limitations": ["string (list of limitations)"],
          "significance": "string (clinical importance)",
          "implications": ["string (future implications)"]
        }
      `;
      
      const gammaResult = await gammaModel.generateContent(gammaPrompt);
      const gammaResponse = await gammaResult.response;
      const gammaText = gammaResponse.text();
      
      // Extract and parse Gamma's response
      const gammaJsonMatch = gammaText.match(/```json\s*([\s\S]*?)\s*```/) || 
                           gammaText.match(/\{[\s\S]*\}/);
      
      if (gammaJsonMatch) {
        const gammaAnalysis = JSON.parse(gammaJsonMatch[0].replace(/```json\s*|\s*```/g, ''));
        return NextResponse.json({ 
          summary,
          detailedAnalysis: gammaAnalysis
        });
      }
    } catch (gammaError) {
      console.error('Error getting Gamma analysis:', gammaError);
      // Return just the summary if Gamma fails
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error in generate-summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { auth } from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

export async function POST(req: Request) {
  try {
    ensureFirebaseAdmin();
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_AI_API_KEY is not set in environment variables' },
        { status: 500 }
      );
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const sessionCookie = req.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('__session='));
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await auth().verifySessionCookie(sessionCookie.split('=')[1]);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { drugName, rxcui } = body;

    if (!drugName || !rxcui) {
      return NextResponse.json(
        { error: 'Drug name and RxCUI are required' },
        { status: 400 }
      );
    }

    // Construct the prompt for Gemini
    const prompt = `
      As a medical AI assistant, verify if the user should have access to sensitive drug information.
      
      Drug: ${drugName} (RxCUI: ${rxcui})
      
      Consider:
      1. Is this a controlled substance?
      2. Does this drug have high-risk interactions?
      3. Is this drug commonly prescribed?
      4. Is this information typically restricted?
      
      Respond with a JSON object:
      {
        "verified": boolean,
        "reason": "string explaining the decision"
      }
    `;

    // Generate response from Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from markdown code block or fallback to simple extraction
    let jsonStringToParse: string;
    const markdownMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    
    if (markdownMatch && markdownMatch[1]) {
      jsonStringToParse = markdownMatch[1].trim();
    } else {
      // Fallback: try to extract content between first { and last }
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonStringToParse = text.slice(firstBrace, lastBrace + 1).trim();
      } else {
        throw new Error('Could not extract JSON from AI response');
      }
    }
    
    console.log('Extracted JSON string:', jsonStringToParse);
    
    // Parse the JSON response
    let verification;
    try {
      verification = JSON.parse(jsonStringToParse);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Validate the response structure
    if (typeof verification.verified !== 'boolean' || !verification.reason) {
      console.error('Invalid verification response format:', verification);
      throw new Error('Invalid verification response format');
    }

    return NextResponse.json(verification);
  } catch (error) {
    console.error('Error in verify-show-details:', error);
    return NextResponse.json(
      { error: 'Failed to verify access' },
      { status: 500 }
    );
  }
} 
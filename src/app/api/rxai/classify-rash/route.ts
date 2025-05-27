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

    const formData = await req.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Convert image to base64
    const buffer = await image.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');

    // Try Gemini Vision first, fallback to Gamma if needed
    let classification;
    try {
      // Use Gemini Vision for classification
      const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
      
      const prompt = `
        Analyze this medical image of a skin condition and provide a classification.
        Focus on identifying the type of rash or skin condition.
        Consider:
        1. Pattern and distribution
        2. Color and texture
        3. Associated symptoms
        4. Common causes
        
        Format the response as JSON:
        {
          "classification": "string (primary classification)",
          "confidence": number (0-100),
          "differentialDiagnosis": ["string (alternative possibilities)"],
          "recommendations": ["string (next steps)"]
        }
      `;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();
      
      // Parse the JSON response
      classification = JSON.parse(text);
    } catch (error) {
      console.error('Error with Gemini Vision, trying Gamma:', error);
      
      // Fallback to Gamma
      try {
        const gammaModel = genAI.getGenerativeModel({ model: 'gamma' });
        const gammaResult = await gammaModel.generateContent([
          prompt,
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          }
        ]);
        
        const gammaResponse = await gammaResult.response;
        const gammaText = gammaResponse.text();
        
        // Parse Gamma's response
        classification = JSON.parse(gammaText);
      } catch (gammaError) {
        console.error('Error with Gamma:', gammaError);
        throw new Error('Failed to analyze image with both models');
      }
    }

    return NextResponse.json(classification);
  } catch (error) {
    console.error('Error in classify-rash:', error);
    return NextResponse.json(
      { error: 'Failed to classify rash' },
      { status: 500 }
    );
  }
} 
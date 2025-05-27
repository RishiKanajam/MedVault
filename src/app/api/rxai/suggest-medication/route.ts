import { NextResponse, NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

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

// Initialize Gemini
if (!process.env.GOOGLE_AI_API_KEY) {
  throw new Error('GOOGLE_AI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

export async function POST(req: NextRequest) {
  let decodedToken;
  
  try {
    ensureFirebaseAdmin();
    console.log('Received request to suggest medication');
    
    const sessionCookie = req.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('__session='));
    if (!sessionCookie) {
      console.error('No session cookie found in request');
      return NextResponse.json({ error: 'Unauthorized - No session cookie' }, { status: 401 });
    }

    try {
      decodedToken = await getAuth().verifySessionCookie(sessionCookie.split('=')[1]);
      if (!decodedToken) {
        console.error('Invalid session cookie');
        return NextResponse.json({ error: 'Unauthorized - Invalid session' }, { status: 401 });
      }
      console.log('Session verified for user:', decodedToken.uid);
    } catch (authError) {
      console.error('Error verifying session:', authError);
      return NextResponse.json({ error: 'Unauthorized - Session verification failed' }, { status: 401 });
    }

    const body = await req.json();
    console.log('Request body:', { ...body, symptoms: body.symptoms?.substring(0, 100) + '...' });

    const {
      name,
      age,
      weight,
      bloodPressure,
      temperature,
      symptoms,
      photoUrl,
      rashClassification
    } = body;

    // Validate required fields
    if (!name || !age || !symptoms) {
      console.error('Missing required fields:', { name: !!name, age: !!age, symptoms: !!symptoms });
      return NextResponse.json(
        { error: 'Missing required fields: name, age, and symptoms are required' },
        { status: 400 }
      );
    }

    // Validate age is a number
    if (isNaN(Number(age))) {
      console.error('Invalid age format:', age);
      return NextResponse.json(
        { error: 'Age must be a number' },
        { status: 400 }
      );
    }

    // Construct the prompt for Gemini
    const prompt = `
      As a medical AI assistant, analyze the following patient information and suggest appropriate medication:
      
      Patient Information:
      - Name: ${name}
      - Age: ${age}
      - Weight: ${weight || 'Not provided'} kg
      - Blood Pressure: ${bloodPressure || 'Not provided'}
      - Temperature: ${temperature || 'Not provided'}°C
      ${rashClassification ? `- Rash Classification: ${rashClassification}` : ''}
      
      Symptoms:
      ${symptoms}
      
      Please provide:
      1. Recommended drug class
      2. Specific dosage
      3. Duration of treatment
      4. Confidence level (0-100)
      5. Relevant medical citations from PubMed
      
      Format the response as JSON with the following structure:
      {
        "drugClass": "string",
        "dosage": "string",
        "duration": "string",
        "confidence": number,
        "citations": [
          {
            "title": "string",
            "abstract": "string",
            "url": "string"
          }
        ]
      }
    `;

    try {
      console.log('Generating AI response...');
      // Generate response from Gemini
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const rawAiText = response.text();
      console.log('Raw AI response:', rawAiText);
      
      // Extract JSON from markdown code block or fallback to simple extraction
      let jsonStringToParse: string;
      const markdownMatch = rawAiText.match(/```json\s*([\s\S]*?)\s*```/);
      
      if (markdownMatch && markdownMatch[1]) {
        jsonStringToParse = markdownMatch[1].trim();
      } else {
        // Fallback: try to extract content between first { and last }
        const firstBrace = rawAiText.indexOf('{');
        const lastBrace = rawAiText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonStringToParse = rawAiText.slice(firstBrace, lastBrace + 1).trim();
        } else {
          throw new Error('Could not extract JSON from AI response');
        }
      }
      
      console.log('Extracted JSON string:', jsonStringToParse);
      
      // Parse the JSON response
      let aiResponse;
      try {
        aiResponse = JSON.parse(jsonStringToParse);
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        throw new Error('Failed to parse AI response as JSON');
      }
      
      console.log('Parsed AI response:', aiResponse);

      // Validate the response structure
      if (!aiResponse.drugClass || typeof aiResponse.confidence !== 'number') {
        console.error('Invalid AI response format:', aiResponse);
        throw new Error('Invalid AI response format');
      }

      // If confidence is low, get a second opinion from Gamma
      if (aiResponse.confidence < 70) {
        console.log('Low confidence, getting second opinion from Gamma...');
        try {
          const gammaModel = genAI.getGenerativeModel({ model: 'gamma' });
          const gammaResult = await gammaModel.generateContent(prompt);
          const gammaResponse = await gammaResult.response;
          const gammaText = gammaResponse.text();
          
          // Extract and parse Gamma's response
          const gammaJsonMatch = gammaText.match(/```json\s*([\s\S]*?)\s*```/) || 
                               gammaText.match(/\{[\s\S]*\}/);
          
          if (gammaJsonMatch) {
            const gammaJson = JSON.parse(gammaJsonMatch[0].replace(/```json\s*|\s*```/g, ''));
            
            // If Gamma has higher confidence, use its response
            if (gammaJson.confidence > aiResponse.confidence) {
              console.log('Using Gamma response due to higher confidence');
              aiResponse = gammaJson;
            }
          }
        } catch (gammaError) {
          console.error('Error getting Gamma second opinion:', gammaError);
          // Continue with original response if Gamma fails
        }
      }

      // Save to Firestore
      try {
        console.log('Saving to Firestore...');
        // Get the user's clinicId from their custom claims
        const userRecord = await getAuth().getUser(decodedToken.uid);
        const clinicId = userRecord.customClaims?.clinicId;
        
        if (!clinicId) {
          console.error('No clinicId found in user claims');
          throw new Error('User is not associated with a clinic');
        }

        const historyRef = collection(db, 'clinics', clinicId, 'history');
        await addDoc(historyRef, {
          timestamp: new Date(),
          type: 'RxAI Consultation',
          patientInfo: {
            name,
            age,
            weight,
            bloodPressure,
            temperature
          },
          symptoms,
          photoUrl,
          rashClassification,
          aiResponse,
          summary: `RxAI consultation for ${name} (${age} years) with symptoms: ${symptoms.substring(0, 100)}${symptoms.length > 100 ? '...' : ''}`,
          files: photoUrl ? [{ name: 'Symptom Photo', url: photoUrl }] : []
        });
        console.log('Successfully saved to Firestore');
      } catch (dbError) {
        console.error('Error saving to Firestore:', dbError);
        // Continue even if saving fails
      }

      return NextResponse.json(aiResponse);
    } catch (aiError) {
      console.error('Error generating AI response:', aiError);
      return NextResponse.json(
        { 
          error: 'Failed to generate medication suggestion',
          details: aiError instanceof Error ? aiError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in suggest-medication:', error);
    return NextResponse.json(
      { 
        error: 'Failed to suggest medication',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
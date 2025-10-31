import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifySession } from '@/lib/auth';
import { ApiHandler } from '@/lib/api-handler';
import { rxaiSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  return ApiHandler.handleRequest(req, rxaiSchema, async (data, req) => {
    // Verify authentication
    try {
      await verifySession(req);
    } catch (authError: any) {
      // Check if it's an authentication error
      if (authError.message?.includes('session') || authError.message?.includes('cookie') || authError.message?.includes('token')) {
        throw { ...authError, statusCode: 401 };
      }
      throw authError;
    }
    
    // Check for API key
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY is not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Construct the prompt for Gemini
    const prompt = `
      As a medical AI assistant, analyze the following patient information and suggest appropriate medication:
      
      Patient Information:
      - Name: ${data.name}
      - Age: ${data.age} years
      - Weight: ${data.weight || 'Not specified'} kg
      - Blood Pressure: ${data.bloodPressure || 'Not measured'}
      - Temperature: ${data.temperature || 'Not measured'}°C
      - Symptoms: ${data.symptoms}
      ${data.photoUrl ? `- Photo Analysis: ${data.photoUrl}` : ''}
      ${data.rashClassification ? `- Rash Classification: ${data.rashClassification}` : ''}
      
      Please provide a structured response with:
      1. Recommended medication(s)
      2. Dosage instructions
      3. Potential side effects
      4. Drug interactions to watch for
      5. Follow-up recommendations
      
      Format your response as JSON with the following structure:
      {
        "drugClass": "string",
        "recommendedMedications": [
          {
            "name": "string",
            "dosage": "string",
            "frequency": "string",
            "duration": "string"
          }
        ],
        "sideEffects": ["string"],
        "interactions": ["string"],
        "followUp": "string",
        "confidence": "number (0-100)"
      }
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Try to parse JSON response
      let jsonResponse;
      try {
        // Extract JSON from markdown code block if present
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        const jsonString = jsonMatch?.[1] ?? text;
        jsonResponse = JSON.parse(jsonString);
      } catch (parseError) {
        // Fallback to text parsing
        jsonResponse = {
          drugClass: "AI Analysis",
          recommendedMedications: [{
            name: "Consultation Required",
            dosage: "As prescribed by physician",
            frequency: "As needed",
            duration: "Until symptoms resolve"
          }],
          sideEffects: ["Please consult with a healthcare provider"],
          interactions: ["Check with pharmacist for drug interactions"],
          followUp: "Schedule follow-up appointment",
          confidence: 50,
          rawResponse: text
        };
      }

      return jsonResponse;
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      throw new Error(`AI service error: ${error.message}`);
    }
  });
}

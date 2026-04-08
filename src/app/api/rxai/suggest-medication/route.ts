import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifySession } from '@/lib/auth';
import { ApiHandler } from '@/lib/api-handler';
import { rxaiSchema } from '@/lib/validation';
import { sanitizeForPrompt } from '@/lib/security';

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

    // Sanitize all user-supplied strings before interpolating into the prompt
    // to mitigate prompt injection attacks.
    const safeName = sanitizeForPrompt(data.name, 100);
    const safeSymptoms = sanitizeForPrompt(data.symptoms, 2000);
    const safeBloodPressure = data.bloodPressure ? sanitizeForPrompt(data.bloodPressure, 20) : 'Not measured';
    const safeRashClassification = data.rashClassification
      ? sanitizeForPrompt(data.rashClassification, 500)
      : null;

    // Construct the prompt for Gemini
    const prompt = `You are a clinical decision-support assistant providing medication suggestions for review by a licensed physician. This output must NOT be acted upon without professional medical oversight.

Patient Information:
- Name: ${safeName}
- Age: ${data.age} years
- Weight: ${data.weight ?? 'Not specified'} kg
- Blood Pressure: ${safeBloodPressure}
- Temperature: ${data.temperature ?? 'Not measured'}°C
- Symptoms: ${safeSymptoms}
${safeRashClassification ? `- Rash Classification: ${safeRashClassification}` : ''}

Provide a structured clinical decision-support response. Respond with JSON only (no markdown fences):
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
  "confidence": number
}`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Try to parse JSON response
      let jsonResponse;
      try {
        // Strip optional markdown code fences before parsing.
        const jsonString = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
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

import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifySession } from '@/lib/auth';
import { ApiHandler } from '@/lib/api-handler';
import { rxaiSchema } from '@/lib/validation';
import { sanitizeForPrompt } from '@/lib/security';
import { CacheService } from '@/lib/cache';

const LLM_CACHE_TTL = 60 * 60 * 1000; // 1 hour

function cacheKey(data: Record<string, unknown>): string {
  return 'rxai:suggest:' + createHash('sha256').update(JSON.stringify(data)).digest('hex');
}

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

    const key = cacheKey({ name: data.name, age: data.age, weight: data.weight, bloodPressure: data.bloodPressure, temperature: data.temperature, symptoms: data.symptoms, rashClassification: data.rashClassification });

    return CacheService.getOrSet(key, async () => {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        let jsonResponse;
        try {
          const jsonString = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
          jsonResponse = JSON.parse(jsonString);
        } catch {
          jsonResponse = {
            drugClass: 'AI Analysis',
            recommendedMedications: [{ name: 'Consultation Required', dosage: 'As prescribed by physician', frequency: 'As needed', duration: 'Until symptoms resolve' }],
            sideEffects: ['Please consult with a healthcare provider'],
            interactions: ['Check with pharmacist for drug interactions'],
            followUp: 'Schedule follow-up appointment',
            confidence: 50,
            rawResponse: text,
          };
        }

        return jsonResponse;
      } catch (error: any) {
        console.error('Gemini API Error:', error);
        const msg: string = error?.message ?? '';
        const isRateLimit =
          error?.status === 429 ||
          msg.includes('429') ||
          msg.toUpperCase().includes('RESOURCE_EXHAUSTED') ||
          msg.toLowerCase().includes('quota') ||
          msg.toLowerCase().includes('rate limit');
        if (isRateLimit) {
          throw new Error('429: Rate exceeded — high demand, please retry shortly');
        }
        throw new Error(`AI service error: ${msg}`);
      }
    }, { ttl: LLM_CACHE_TTL });
  });
}

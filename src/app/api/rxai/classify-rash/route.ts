import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifySession } from '@/lib/auth';
import { sanitizeForPrompt } from '@/lib/security';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    // Verify session using the shared auth utility.
    try {
      await verifySession(req);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GOOGLE_AI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const image = formData.get('image') as File | null;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Validate file type and size before sending to Gemini.
    if (!ALLOWED_MIME_TYPES.includes(image.type)) {
      return NextResponse.json(
        { error: `Unsupported image type: ${sanitizeForPrompt(image.type)}. Allowed: jpeg, png, webp, gif` },
        { status: 400 }
      );
    }

    if (image.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image exceeds 10 MB limit' }, { status: 400 });
    }

    const buffer = await image.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');

    // gemini-1.5-flash supports multimodal input (text + image) and is not deprecated.
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Analyze this medical image of a skin condition and provide a classification.
Focus on identifying the type of rash or skin condition.
Consider:
1. Pattern and distribution
2. Color and texture
3. Associated symptoms
4. Common causes

IMPORTANT: This is for clinical decision support only. Always recommend professional evaluation.

Respond with JSON only (no markdown fences):
{
  "classification": "string (primary classification)",
  "confidence": number (0-100),
  "differentialDiagnosis": ["string"],
  "recommendations": ["string"]
}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: image.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
          data: base64Image,
        },
      },
    ]);

    const text = result.response.text().trim();

    let classification;
    try {
      // Strip optional markdown code fences before parsing.
      const jsonString = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      classification = JSON.parse(jsonString);
    } catch {
      throw new Error('Model returned non-JSON response');
    }

    return NextResponse.json(classification);
  } catch (error) {
    console.error('Error in classify-rash:', error);
    return NextResponse.json({ error: 'Failed to classify rash' }, { status: 500 });
  }
}

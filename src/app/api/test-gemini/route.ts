import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
if (!process.env.GOOGLE_AI_API_KEY) {
  throw new Error('GOOGLE_AI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

export async function GET() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent('Say "Gemini API is working!"');
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ 
      success: true, 
      message: text,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing Gemini:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to test Gemini API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
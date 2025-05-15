import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Log missing API key to help debugging server-side issues
if (!process.env.GOOGLE_API_KEY) {
    console.warn("Genkit/Google AI Warning: GOOGLE_API_KEY is not set in the server environment (.env file). AI features may fail.");
}

const ai = genkit({
  model: 'googleai/gemini-pro', // Changed default model to gemini-pro as flash is experimental
  plugins: [
    // Use environment variable for the API key
    googleAI({apiKey: process.env.GOOGLE_API_KEY}),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export { ai };

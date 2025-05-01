import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const ai = genkit({
  model: 'googleai/gemini-2.0-flash',
  plugins: [
    googleAI({apiKey: 'AIzaSyBXtIErqPNTGC2fPp1nT9ZN3i-s8Dg0-HI'}),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export { ai };

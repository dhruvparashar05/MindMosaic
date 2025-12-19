import {configureGenkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = configureGenkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

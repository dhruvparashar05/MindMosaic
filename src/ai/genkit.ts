'use server';

import {configureGenkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {genkitx} from '@genkit-ai/next';

export const ai = configureGenkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
    genkitx(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

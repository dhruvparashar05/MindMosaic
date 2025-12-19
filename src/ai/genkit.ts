import {genkit, type Genkit} from 'genkit';
import {googleAI, type GoogleAIGeminiModel} from '@genkit-ai/google-genai';
import {genkitx} from '@genkit-ai/next';

let ai: Genkit<{
  model: GoogleAIGeminiModel;
}>;

if (process.env.GENKIT_ENV === 'dev') {
  ai = genkit({
    plugins: [
      googleAI({
        apiKey: process.env.GEMINI_API_KEY,
      }),
    ],
    model: 'googleai/gemini-1.5-pro-latest',
    enableTracing: true,
  });
} else {
  ai = genkit({
    plugins: [
      genkitx(),
      googleAI({
        apiKey: process.env.GEMINI_API_KEY,
      }),
    ],
    model: 'googleai/gemini-1.5-pro-latest',
    enableTracing: true,
  });
}

export {ai};

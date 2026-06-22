import { ai, geminiModel } from '@/ai/genkit';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const RequestSchema = z.object({
  content: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || geminiKey.trim() === '') {
      // The default API key in environment might be mock or invalid, return fallback to prevent crash
      return new Response(JSON.stringify({
        sentiment: 'neutral',
        emotion: 'Calm',
        summary: 'Your entry reflects a neutral moment of thought.',
        recommendation: 'Try taking 3 deep breaths and doing a 5-minute stretch.'
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    const { content } = await RequestSchema.parseAsync(await req.json());
    
    const response = await ai.generate({
      model: geminiModel,
      prompt: `Analyze the following mental health journal entry. Identify:
1. Sentiment (choose exactly one: positive, neutral, negative)
2. Primary Emotion (choose exactly one: Joy, Stress, Anxiety, Sadness, Anger, Calm)
3. A 1-sentence summary of the entry
4. A personalized actionable wellness recommendation (1-2 sentences).

Return the output as a valid JSON object matching this schema:
{
  "sentiment": "positive | neutral | negative",
  "emotion": "Joy | Stress | Anxiety | Sadness | Anger | Calm",
  "summary": "1-sentence summary",
  "recommendation": "recommendation text"
}

Journal entry content:
"${content}"`,
      output: {
        schema: z.object({
          sentiment: z.enum(['positive', 'neutral', 'negative']),
          emotion: z.string(),
          summary: z.string(),
          recommendation: z.string(),
        })
      }
    });

    return new Response(JSON.stringify(response.output), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('AI Journal Analysis error:', error);
    // Fallback safe mock to prevent crashes
    return new Response(JSON.stringify({
      sentiment: 'neutral',
      emotion: 'Calm',
      summary: 'Analysis unavailable.',
      recommendation: 'Try a 5-minute breathing exercise.'
    }), { headers: { 'Content-Type': 'application/json' } });
  }
}

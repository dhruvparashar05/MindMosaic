'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { streamFlow } from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  parts: z.array(z.object({ text: z.string() })),
});

export const chat = ai.defineFlow(
  {
    name: 'chat',
    inputSchema: z.object({
      history: z.array(MessageSchema),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const { stream, response } = ai.generateStream({
      model: ai.model,
      messages: input.history,
    });

    let finalResponse = '';
    for await (const chunk of stream) {
      finalResponse += chunk.text;
    }
    await response;
    return finalResponse;
  }
);

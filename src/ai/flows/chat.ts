'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

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
    const response = await ai.generate({
      model: ai.model,
      messages: input.history,
    });

    return response.text;
  }
);

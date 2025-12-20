'use server';

import { z } from 'zod';
import { ai } from '@/ai/genkit';

/* ---------- SCHEMAS ---------- */

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  parts: z.array(
    z.object({
      text: z.string(),
    })
  ),
});

const ChatInputSchema = z.object({
  history: z.array(MessageSchema),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

/* ---------- FLOW ---------- */

export async function chat(input: ChatInput): Promise<string> {
  const systemPrompt = `
You are a friendly and supportive AI assistant for an app called Mind Mosaic.
You are not a therapist. Do not provide medical advice.
Be empathetic, calm, and supportive.
`;

  const response = await ai.generate({
    model: ai.model, // comes from genkit.ts
    system: systemPrompt,
    messages: input.history,
    config: {
      temperature: 0.7,
    },
  });

  return response.text();
}

'use server';

import { ai, geminiModel } from '@/ai/genkit';
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
    const formattedMessages = input.history.map((m) => ({
      role: m.role,
      content: m.parts,
    }));

    const response = await ai.generate({
      model: geminiModel,
      messages: formattedMessages,
      system: `You are the Mind Mosaic AI Wellness Coach. Your goal is to provide warm, supportive, and compassionate mental health guidance, productivity advice, stress management tips, sleep recommendations, daily affirmations, and simple breathing/mindfulness exercise steps.
Keep your tone encouraging, non-judgmental, and validating. Be clear, concise, and structured in your advice. If the user indicates extreme emotional distress, self-harm, or danger, remind them that you are an AI wellness companion, provide helpline numbers, and strongly encourage them to connect with human professionals or trusted contacts.`,
    });

    return response.text;
  }
);

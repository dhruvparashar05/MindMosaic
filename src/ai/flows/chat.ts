'use server';
/**
 * @fileOverview A conversational AI flow for the Mind Mosaic chatbot.
 *
 * - chat - A function that takes the conversation history and returns a response from the AI.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ChatInputSchema = z.object({
  history: z.array(MessageSchema),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.string();
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async ({history}) => {
    const systemPrompt = `You are a friendly and supportive AI assistant for an app called Mind Mosaic, a personal space for mental well-being. Your goal is to provide gentle guidance, a listening ear, and encouragement.

    Keep your responses concise, empathetic, and supportive. You are not a therapist, so do not provide medical advice, diagnoses, or treatment plans. Instead, you can offer general wellness tips, mindfulness exercises, or suggest seeking help from a professional.

    Start the first conversation by introducing yourself and asking how you can help.`;

    const {output} = await ai.generate({
      prompt: {
        system: systemPrompt,
        history: history,
      },
      model: ai.model,
      config: {
        temperature: 0.7,
      },
    });

    return output!;
  }
);

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { StreamingTextResponse, streamToResponse } from 'ai';

const MessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const RequestSchema = z.object({
  message: z.string(),
  history: z.array(MessageSchema).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await RequestSchema.parseAsync(
      await req.json()
    );

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
      });
    }

    const flowHistory =
      history?.map((h) => ({
        role: h.role,
        parts: [{ text: h.content }],
      })) ?? [];

    flowHistory.push({ role: 'user', parts: [{ text: message }] });

    const { stream } = ai.generateStream({
      model: ai.model,
      messages: flowHistory,
    });

    const aiStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          controller.enqueue(chunk.text);
        }
        controller.close();
      },
    });

    return new StreamingTextResponse(aiStream);
  } catch (error: any) {
    console.error('Chat API error:', error);
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid request body', details: error.issues }),
        { status: 400 }
      );
    }
    return new Response(JSON.stringify({ error: 'Failed to generate response' }), {
      status: 500,
    });
  }
}

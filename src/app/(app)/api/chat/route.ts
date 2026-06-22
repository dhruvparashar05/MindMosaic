import { chat } from '@/ai/flows/chat';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const MessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema),
});

export async function POST(req: NextRequest) {
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || geminiKey.trim() === '') {
      return new Response("AI Assistant is currently unavailable.", {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    const { messages } = await RequestSchema.parseAsync(
      await req.json()
    );

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
      });
    }

    const flowHistory = messages.map((m) => ({
      role: m.role === 'user' ? ('user' as const) : ('model' as const),
      parts: [{ text: m.content }],
    }));

    const response = await chat({ history: flowHistory });

    return new Response(response, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
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

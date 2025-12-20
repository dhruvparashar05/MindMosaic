import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/ai/flows/chat";
import { z } from "zod";

const MessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "model"]),
  content: z.string(),
});

const RequestSchema = z.object({
  message: z.string(),
  history: z.array(MessageSchema).optional(),
});


export async function POST(req: NextRequest) {
  try {
    const { message, history } = await RequestSchema.parseAsync(await req.json());

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }
    
    // The chat flow expects a `history` object with a specific structure.
    // We need to transform the incoming history to match what the flow expects.
    const flowHistory = history ? history.map(h => ({
      role: h.role,
      parts: [{ text: h.content }],
    })) : [];

    // The current user message is not in the history yet, so we add it.
    flowHistory.push({ role: "user", parts: [{ text: message }] });

    const response = await chat({ history: flowHistory });

    return NextResponse.json({
      reply: response,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    // If it's a validation error
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request body", details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/ai/genkit";
import { chat } from "@/ai/flows/chat";

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }
    
    // The chat flow expects a `history` object. We can construct it here.
    const chatHistory = history || [
      { role: "user", parts: [{ text: message }] },
    ];


    const response = await chat({ history: chatHistory });

    return NextResponse.json({
      reply: response,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}

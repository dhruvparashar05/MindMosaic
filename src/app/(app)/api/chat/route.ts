import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/ai/genkit";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const response = await ai.generate({
      prompt: message,
    });

    return NextResponse.json({
      reply: response.text,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}

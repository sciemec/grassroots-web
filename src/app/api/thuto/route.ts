import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { messages, systemPrompt } = await req.json();

  const response = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 400,
    system: systemPrompt,
    messages,
  });

  const reply = response.content.find(b => b.type === "text")?.text ?? "";
  return NextResponse.json({ reply });
}
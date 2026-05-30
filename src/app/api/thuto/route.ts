import { NextRequest, NextResponse } from "next/server";
import { groqText } from "@/lib/groq";

export async function POST(req: NextRequest) {
  const { messages, systemPrompt } = await req.json();
  const reply = await groqText(systemPrompt, messages, { max_tokens: 400 });
  return NextResponse.json({ reply });
}
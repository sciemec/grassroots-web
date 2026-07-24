import { NextResponse } from "next/server";
import { getPositionConfig } from "@/config/positions"; // ✅ FIXED: Changed to your exact verified function name

export async function POST(req: Request) {
  const { messages, playerPosition, playerAgeGroup } = await req.json();

  // 🛡️ Resolve specific coach profile constraints instantly
  const positionConfig = getPositionConfig(playerPosition, playerAgeGroup); // ✅ FIXED: Bound to matching engine signature

  const payload = {
    model: "gemini-3.5-flash",
    messages: [
      {
        role: "system",
        content: positionConfig.thutoSystemPrompt // Injects localized youth academy rules automatically
      },
      ...messages
    ]
  };

  // Execute standard LLM API fetch calls below...
}
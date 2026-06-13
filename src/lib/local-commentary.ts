import { NextResponse } from "next/server";

export interface LiveMatchPacket {
  minute: number;
  playerName: string;
  teamName: string;
  eventType: "GOAL" | "DANGEROUS_ATTACK" | "YELLOW_CARD";
  language: "shona" | "ndebele" | "zulu" | "tswana";
}

export async function POST(req: Request) {
  try {
    const body: LiveMatchPacket = await req.json();
    const { minute, playerName, teamName, eventType, language } = body;

    // Direct contextual priming prompt ensuring sports-accurate slang
    const systemPrompt = `
      You are an energetic, professional football radio commentator broadcasting live match events.
      You translate raw statistical data into highly engaging, culturally authentic football commentary in the requested language: ${language}.
      
      CRITICAL RULE: Do not perform literal translations. Use genuine local football slang and idiomatic expressions used by fans on the pitch. Keep technical soccer terms accurate to how sports journalists speak them in that language.
    `;

    const userPrompt = `
      Generate a single paragraph of excited, fast-paced commentary for this live match event:
      - Minute: ${minute}
      - Player: ${playerName}
      - Team: ${teamName}
      - Incident Type: ${eventType}
    `;

    // Example calling your integrated LLM endpoint (OpenAI / DeepSeek)
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.85, // Adds natural variance and flair to the speech
      }),
    });

    const data = await response.json();
    const localizedScript = data.choices[0].message.content;

    return NextResponse.json({ 
      success: true, 
      language,
      script: localizedScript 
    });

  } catch (error) {
    console.error("Local commentary generation failure:", error);
    return NextResponse.json({ error: "Processing failure" }, { status: 500 });
  }
}
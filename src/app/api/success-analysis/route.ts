import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { goal, completionRate, strongestAction, weakestAction, streak, daysRemaining } =
      await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
    }

    const prompt = `You are THUTO — a motivational AI coach for Zimbabwean athletes.
A player has shared their weekly progress report.

Goal: "${goal}"
Weekly completion rate: ${completionRate}%
Current streak: ${streak} days
Days remaining until goal target: ${daysRemaining}
Strongest habit this week: "${strongestAction}"
Weakest habit this week: "${weakestAction}"

Write a personal, warm weekly report analysis in 3 short paragraphs:
1. Celebrate their wins this week (use their strongest habit, mention the streak if > 0)
2. Give one honest, constructive insight about the weak habit — keep it kind, not harsh
3. One specific motivational action for next week. End with an encouraging phrase in Shona (Pamberi! / Unokwanisa! / Ramba uchishanda!)

Keep it under 200 words. Write directly to the player (use "you", not "the player").`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }

    const data = await res.json();
    const analysis: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return NextResponse.json({ analysis });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

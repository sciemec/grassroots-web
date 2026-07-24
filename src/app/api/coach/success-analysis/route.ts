import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const {
      goal, completionRate, strongestAction, weakestAction,
      streak, daysRemaining, squadSize,
    } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
    }

    const prompt = `You are THUTO — a motivational AI coach for Zimbabwean grassroots coaches.
A coach has shared their weekly coaching progress report.

Coaching goal: "${goal}"
Weekly completion rate: ${completionRate}%
Current streak: ${streak} days
Days remaining until goal target: ${daysRemaining}
Strongest coaching habit this week: "${strongestAction}"
Weakest coaching habit this week: "${weakestAction}"
${squadSize ? `Squad size: ${squadSize} players` : ""}

Write a personal, warm weekly report in 3 short paragraphs:
1. Celebrate their coaching wins this week — reference the strongest habit and streak if > 0. Remember: showing up for grassroots athletes in Zimbabwe is itself remarkable.
2. Give one honest, constructive insight about the weak habit — frame it as a coach-to-coach conversation, not a criticism.
3. One specific recommendation for next week's coaching focus. End with an encouraging phrase in Shona (Pamberi! / Unokwanisa! / Ramba uchishanda! / Simba rinobva mumoyo!)

Keep it under 200 words. Write directly to the coach (use "you", not "the coach").`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
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

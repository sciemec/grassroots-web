import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { goal, reason, actions } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 500 });
    }

    const prompt = `You are THUTO — a motivational AI coach for Zimbabwean grassroots coaches.
A coach is struggling to complete their daily coaching actions and has told you why.

Their coaching goal: "${goal}"
Their current 3 daily actions:
1. ${actions[0]}
2. ${actions[1]}
3. ${actions[2]}

The reason they're struggling: "${reason}"

Respond in 3 short sections:
1. ACKNOWLEDGE — validate their difficulty in 1 sentence. Coaches face real pressures: no facilities, players dropping out, no budget, family obligations.
2. ADJUST — suggest ONE concrete change to make their actions more doable. Be specific for Zimbabwean grassroots coaching (e.g. no projector for video analysis, training on a dirt pitch, players arriving late, load-shedding).
3. RECOMMIT — a short rallying message ending with a Shona phrase (Pamberi! / Unokwanisa! / Ramba uchishanda! / Simba rinobva mumoyo!)

Keep it under 150 words. Write directly to the coach (use "you").`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }

    const data = await res.json();
    const response = data.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ response });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

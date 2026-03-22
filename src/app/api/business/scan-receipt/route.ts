import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { image, mediaType } = await req.json() as {
      image: string;
      mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
    };

    if (!image) {
      return NextResponse.json({ error: "No image provided." }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI service not configured." }, { status: 500 });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType || "image/jpeg",
                  data: image,
                },
              },
              {
                type: "text",
                text: `You are scanning a financial document for a Zimbabwe sports club.

This could be a receipt, invoice, handwritten budget sheet, or any financial paper.

Extract ALL financial items you can see. For each item return:
- description: what was bought or received (keep it short, max 60 chars)
- amount: the number only (no currency symbols), always positive
- type: "income" if money was received, "expense" if money was spent
- date: in YYYY-MM-DD format if visible, otherwise use today ${new Date().toISOString().slice(0, 10)}

Return ONLY a valid JSON array, no other text. Example:
[
  {"description": "Football boots x10", "amount": 150, "type": "expense", "date": "2026-03-22"},
  {"description": "Gate fees collected", "amount": 320, "type": "income", "date": "2026-03-22"}
]

If you cannot read anything financial from this image, return an empty array: []`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "AI scan failed. Please try again." }, { status: 500 });
    }

    const result = await response.json() as {
      content: Array<{ type: string; text: string }>;
    };

    const text = result.content?.[0]?.text?.trim() ?? "[]";

    // Parse and validate the JSON array Claude returned
    let items: Array<{ description: string; amount: number; type: string; date: string }> = [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        items = parsed.filter(
          (i) =>
            typeof i.description === "string" &&
            typeof i.amount === "number" &&
            (i.type === "income" || i.type === "expense")
        );
      }
    } catch {
      items = [];
    }

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Scan failed. Please try again." }, { status: 500 });
  }
}

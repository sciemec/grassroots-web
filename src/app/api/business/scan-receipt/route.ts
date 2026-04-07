import { NextRequest, NextResponse } from "next/server";
import { groqVision } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json() as { image: string; mediaType?: string };

    if (!image) {
      return NextResponse.json({ error: "No image provided." }, { status: 400 });
    }

    const userText = `You are scanning a financial document for a Zimbabwe sports club.

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

If you cannot read anything financial from this image, return an empty array: []`;

    const text = await groqVision(
      "You are a financial document scanner for a Zimbabwe sports platform.",
      [image],
      userText,
      { max_tokens: 1024 },
    );

    let items: Array<{ description: string; amount: number; type: string; date: string }> = [];
    try {
      const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      const parsed  = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        items = parsed.filter(
          (i) =>
            typeof i.description === "string" &&
            typeof i.amount === "number" &&
            (i.type === "income" || i.type === "expense"),
        );
      }
    } catch {
      items = [];
    }

    return NextResponse.json({ items });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Scan failed";
    console.error("Receipt scan error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

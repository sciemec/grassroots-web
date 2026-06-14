import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { image, context } = await req.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // No image captured (e.g. camera not started, dark frame)
  if (!image) {
    return NextResponse.json({
      feedback: 'No image was captured. Make sure the camera is active and your full body is visible before stopping the scan.',
    });
  }

  // API key not configured
  if (!apiKey) {
    return NextResponse.json({
      feedback: 'AI coach is not available right now. Ask your coach to review your form in person.',
    });
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: image,
                },
              },
              {
                type: 'text',
                text: `You are a grassroots sports coach in Zimbabwe. Look at this image and give honest, specific coaching feedback.

Context: ${context}

Give 2-3 sentences based only on what you can actually observe. If the image is blurry, too dark, or does not clearly show a person, say so honestly — do not invent observations. Keep language simple and encouraging.`,
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({
        feedback: 'AI coach could not be reached. Try again in a moment.',
      });
    }

    const data = await res.json();
    const feedback = data.content?.[0]?.text ?? 'Could not analyse the image. Try again.';
    return NextResponse.json({ feedback });
  } catch {
    return NextResponse.json({
      feedback: 'AI coach is not available right now. Ask your coach to review your form in person.',
    });
  }
}

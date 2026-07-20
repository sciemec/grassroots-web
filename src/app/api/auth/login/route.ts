import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://bhora-ai.onrender.com/api/v1';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);

    let response: Response;
    try {
      response = await fetch(`${BACKEND_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      if ((fetchErr as { name?: string }).name === 'AbortError') {
        return NextResponse.json(
          { message: 'Server is waking up — please try again in 30 seconds.' },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { message: 'Cannot reach server. Check your connection and try again.' },
        { status: 503 }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (response.status >= 500) {
      return NextResponse.json(
        { message: 'Server is waking up — please try again in 30 seconds.' },
        { status: 503 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: 'Could not reach the server. Please try again.' },
      { status: 503 }
    );
  }
}

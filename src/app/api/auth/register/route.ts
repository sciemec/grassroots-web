import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://bhora-ai.onrender.com/api/v1';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);

    // Forward the real visitor IP so Laravel's throttle counts per visitor,
    // not per Next.js container (which is a single shared IP from Laravel's view).
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp       = req.headers.get('x-real-ip');

    let response: Response;
    try {
      response = await fetch(`${BACKEND_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(forwardedFor ? { 'X-Forwarded-For': forwardedFor } : {}),
          ...(realIp       ? { 'X-Real-IP':       realIp }       : {}),
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

    if (response.status === 503 || response.status === 504) {
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

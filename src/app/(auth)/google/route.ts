import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { id_token } = await req.json();

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/google`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      { message: data.message || "Google sign-in failed" },
      { status: response.status }
    );
  }

  return NextResponse.json(data);
}
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { userId, matchId, purchaseType, amount, userEmail, userPhone } = await req.json();
    const reference = `GRS_WC_${matchId}_${userId}_${Date.now()}`;
    
    // In production: Call Paynow API here
    // For now, simulate success
    return NextResponse.json({ success: true, redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/world-cup?payment=success`, reference });
  } catch (error) {
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 });
  }
}
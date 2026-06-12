
// src/app/api/payment/paynow/route.ts
import { NextRequest, NextResponse } from 'next/server';

const PAYNOW_INTEGRATION_ID = process.env.PAYNOW_INTEGRATION_ID;
const PAYNOW_INTEGRATION_KEY = process.env.PAYNOW_INTEGRATION_KEY;
const PAYNOW_URL = 'https://api.paynow.co.zw/v3/transaction/initiate';

export async function POST(req: NextRequest) {
  try {
    const { userId, matchId, purchaseType, amount, userEmail, userPhone } = await req.json();

    // Generate unique reference
    const reference = `GRS_WC_${matchId}_${userId}_${Date.now()}`;

    const payload = {
      result_url: `${process.env.NEXT_PUBLIC_APP_URL}/world-cup?payment=success`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/world-cup`,
      reference,
      amount,
      currency: 'USD',
      email: userEmail,
      phonenumber: userPhone,
      additional_info: `World Cup ${purchaseType === 'match' ? 'Match' : 'Subscription'} - ${matchId}`,
    };

    const auth = Buffer.from(`${PAYNOW_INTEGRATION_ID}:${PAYNOW_INTEGRATION_KEY}`).toString('base64');

    const response = await fetch(PAYNOW_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.status === 'OK') {
      // Store payment intent in database/localStorage
      // Redirect user to Paynow payment page
      return NextResponse.json({ 
        success: true, 
        redirectUrl: data.redirect_url,
        reference 
      });
    } else {
      return NextResponse.json({ error: data.message }, { status: 400 });
    }
  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 });
  }
}
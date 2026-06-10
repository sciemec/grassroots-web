import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Extract delivery parameters from Twilio
    const messageSid = formData.get('MessageSid') as string;
    const messageStatus = formData.get('MessageStatus') as string; // sent, delivered, read, failed
    const recipient = formData.get('To') as string;               // User's WhatsApp number
    const errorCode = formData.get('ErrorCode') as string;         // Present only if failed

    console.log(`\n⚡ [WhatsApp Status Update]`);
    console.log(`📱 To: ${recipient}`);
    console.log(`🆔 Message SID: ${messageSid}`);
    console.log(`📊 Status: ${messageStatus?.toUpperCase() ?? 'UNKNOWN'}`);
    
    if (errorCode) {
      console.log(`❌ Twilio Error Code: ${errorCode}`);
    }
    console.log(`\n`);

    // TODO: Update your database match state or notification tables using Prisma
    // e.g., await prisma.notification.updateMany({ where: { sid: messageSid }, data: { status: messageStatus } })

    // Twilio status callbacks just expect a standard 200 OK response
    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error('❌ Error handling status callback:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
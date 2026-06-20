// src/app/api/sms/stream/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { phoneNumber, command } = await request.json();
  
  // Handle different commands
  if (command === 'LIVE') {
    // Send back the stream URL
    return NextResponse.json({
      message: `📻 Live Commentary: http://139.84.250.73:8000/live`,
      streamUrl: 'http://139.84.250.73:8000/live'
    });
  }
  
  if (command === 'STATUS') {
    // Check if stream is live
    try {
      const response = await fetch('http://139.84.250.73:8000/live', {
        method: 'HEAD'
      });
      
      return NextResponse.json({
        message: response.ok 
          ? '✅ Stream is LIVE! Listen at: http://139.84.250.73:8000/live'
          : '❌ No live stream at the moment'
      });
    } catch {
      return NextResponse.json({
        message: '❌ Stream server unavailable'
      });
    }
  }
  
  if (command === 'MATCH') {
    return NextResponse.json({
      message: '⚽ Brazil vs Argentina · 67\' · Score 2-1'
    });
  }
  
  return NextResponse.json({
    message: `📱 Commands: LIVE, STATUS, MATCH, HELP`
  });
}
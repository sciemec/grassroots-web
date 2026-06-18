// src/app/api/stream/start/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { matchId, audioUrl } = await request.json();
    
    // Command to start streaming to Icecast
    const command = `ffmpeg -re -i "${audioUrl}" -c copy -f mp3 icecast://source:8N%21bF9GFD%29HWput_@139.84.250.73:8000/live`;
    
    // Execute the command (using child_process or a queue system)
    // This should be handled by your Laravel backend
    // For now, we'll just return the command for testing
    
    return NextResponse.json({ 
      success: true, 
      message: 'Stream started',
      command: command
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}
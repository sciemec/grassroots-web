// src/app/api/stream/monitor/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
    const status = {
        icecast: false,
        ffmpeg: false,
        listeners: 0,
        uptime: '0h',
        lastError: null
    };
    
    try {
        // Check Icecast
        const response = await fetch('http://139.84.250.73:8000/status-json.xsl');
        const xml = await response.text();
        // Parse the XML to get listener count
        // (Use xml2js or similar in production)
        
        status.icecast = true;
        
        // Check FFmpeg process
        const ffmpegCheck = await exec('pgrep -f ffmpeg');
        status.ffmpeg = ffmpegCheck.stdout.trim() !== '';
        
        return NextResponse.json({ 
            success: true,
            ...status 
        });
    } catch (error) {
        return NextResponse.json({ 
            success: false,
            ...status,
            error: String(error) 
        });
    }
}
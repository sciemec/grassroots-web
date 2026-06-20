// src/lib/commentary/broadcaster.ts
import { spawn } from 'child_process';
import { PassThrough } from 'stream';
import { generateCommentary } from './engine';
import { synthesizeWithInworld } from './tts';
import type { MatchEvent } from './engine';

export class CommentaryBroadcaster {
  private ffmpegProcess: any = null;
  private isStreaming: boolean = false;
  private audioQueue: Buffer[] = [];
  private isProcessing: boolean = false;
  private lastEventId: string | null = null;

  constructor(
    private icecastUrl: string,
    private icecastPassword: string,
    private mountPoint: string = '/live'
  ) {}

  async start(): Promise<void> {
    console.log('Starting commentary broadcaster...');
    await this.startFFmpeg();
    this.isStreaming = true;
    this.processQueue();
  }

  async stop(): Promise<void> {
    console.log('Stopping commentary broadcaster...');
    this.isStreaming = false;
    if (this.ffmpegProcess) {
      this.ffmpegProcess.stdin.end();
      this.ffmpegProcess.kill();
    }
  }

  async processEvent(event: MatchEvent): Promise<void> {
    // Skip if already processed
    if (this.lastEventId === event.id) return;
    this.lastEventId = event.id;

    console.log(`Processing event: ${event.eventType} at ${event.minute}'`);
    
    // Generate commentary
    const commentary = await generateCommentary(event);
    console.log(`Commentary: ${commentary}`);

    // Generate audio
    const audioBuffer = await synthesizeWithInworld(commentary);

    // Queue for broadcast
    if (audioBuffer.length > 0) {
      this.audioQueue.push(audioBuffer);
    } else {
      // Fallback: use text with browser TTS (client-side)
      console.warn('No audio generated, will use client-side TTS');
    }
  }

  private async startFFmpeg(): Promise<void> {
    const ffmpeg = spawn('ffmpeg', [
      '-re',
      '-f', 'mp3',
      '-i', 'pipe:0', // Input from stdin
      '-acodec', 'libmp3lame',
      '-ab', '32k',
      '-ac', '1',
      '-ar', '44100',
      '-f', 'mp3',
      `icecast://source:${this.icecastPassword}@${this.icecastUrl}/${this.mountPoint}`
    ]);

    ffmpeg.stderr.on('data', (data: Buffer) => {
      // FFmpeg outputs to stderr normally
      console.log(`FFmpeg: ${data.toString()}`);
    });

    ffmpeg.on('error', (error: Error) => {
      console.error('FFmpeg error:', error);
    });

    this.ffmpegProcess = ffmpeg;
    console.log('FFmpeg process started');
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.isStreaming) {
      if (this.audioQueue.length > 0 && this.ffmpegProcess) {
        const audio = this.audioQueue.shift();
        if (audio && this.ffmpegProcess.stdin.writable) {
          this.ffmpegProcess.stdin.write(audio);
        }
      } else {
        // Wait for new audio
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    this.isProcessing = false;
  }

  get isActive(): boolean {
    return this.isStreaming;
  }
}

// Create broadcaster instance
let broadcaster: CommentaryBroadcaster | null = null;

export function getBroadcaster(): CommentaryBroadcaster | null {
  return broadcaster;
}

export function initializeBroadcaster(
  icecastUrl: string,
  icecastPassword: string,
  mountPoint: string = '/live'
): CommentaryBroadcaster {
  broadcaster = new CommentaryBroadcaster(icecastUrl, icecastPassword, mountPoint);
  return broadcaster;
}
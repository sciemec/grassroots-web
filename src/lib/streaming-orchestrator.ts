// src/lib/streaming-orchestrator.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { EventEmitter } from 'events';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ============================================================
// 1. PRODUCER: Stream LLM text and buffer into sentences
// ============================================================
export class CommentaryProducer {
  private model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });
  private buffer = '';
  private sentenceEndings = new Set(['.', '!', '?', '\n']);

  async *streamSentences(eventData: any, matchContext: any): AsyncGenerator<string> {
    const prompt = this.buildPrompt(eventData, matchContext);
    
    try {
      const stream = await this.model.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 200,
        },
      });

      this.buffer = '';

      for await (const chunk of stream.stream) {
        const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        this.buffer += text;

        // Detect complete sentences
        while (this.hasCompleteSentence()) {
          const sentence = this.extractSentence();
          if (sentence.trim()) {
            yield sentence.trim();
          }
        }
      }

      // Yield any remaining buffer as final sentence
      if (this.buffer.trim()) {
        yield this.buffer.trim();
        this.buffer = '';
      }

    } catch (error) {
      console.error('Producer error:', error);
      throw error;
    }
  }

  private hasCompleteSentence(): boolean {
    // Check if buffer ends with sentence boundary
    for (const char of this.buffer) {
      if (this.sentenceEndings.has(char)) {
        return true;
      }
    }
    return false;
  }

  private extractSentence(): string {
    let sentenceEndIndex = -1;
    
    // Find the last sentence boundary
    for (let i = 0; i < this.buffer.length; i++) {
      if (this.sentenceEndings.has(this.buffer[i])) {
        sentenceEndIndex = i + 1;
      }
    }

    if (sentenceEndIndex === -1) return '';

    const sentence = this.buffer.slice(0, sentenceEndIndex);
    this.buffer = this.buffer.slice(sentenceEndIndex);
    return sentence;
  }

  private buildPrompt(event: any, context: any): string {
    const eventEmojis: Record<string, string> = {
      'GOAL': '⚽',
      'SHOT': '💥',
      'CARD': '🟨',
      'PENALTY': '🔴',
      'SUBSTITUTION': '🔄',
      'HALF_TIME': '⏰',
      'FULL_TIME': '🔚'
    };

    const emoji = eventEmojis[event.type] || '📢';

    return `
You are a Zimbabwean football commentator for the FIFA World Cup.

${emoji} ${event.type} EVENT

Match: ${context.homeTeam} vs ${context.awayTeam}
Score: ${context.score}
Time: ${event.time}' minute

Event: ${event.type}
Player: ${event.player || 'a player'}
Team: ${event.team || 'Unknown'}
Description: ${event.description || ''}

RULES:
- Keep commentary SHORT (5-10 words per sentence)
- Use natural spoken language
- Match the emotion of the event
- For GOAL: be enthusiastic
- For CARD: be serious
- Break commentary into 2-3 sentences
- Each sentence should end with . ! or ?

Commentary:`;
  }
}

// ============================================================
// 2. CONSUMER: Convert sentences to audio and stream to Icecast
// ============================================================
export class CommentaryConsumer {
  private audioQueue: string[] = [];
  private isProcessing = false;
  private icecastStream: any = null;
  private speechModel = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash-preview-tts' 
  });

  constructor(icecastUrl?: string) {
    if (icecastUrl) {
      this.initializeIcecast(icecastUrl);
    }
  }

  async consumeSentence(sentence: string, eventType: string): Promise<Buffer | null> {
    try {
      const ttsInput = this.addVocalDirection(sentence, eventType);
      
      const response = await this.speechModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: ttsInput }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      });

      const audioData = (response.response.candidates?.[0]?.content?.parts?.[0] as { inlineData?: { data?: string } })?.inlineData?.data;
      
      if (!audioData) {
        throw new Error('No audio data generated');
      }

      const audioBuffer = Buffer.from(audioData);
      
      // Pipe to Icecast if configured
      if (this.icecastStream) {
        this.pipeToIcecast(audioBuffer);
      }

      return audioBuffer;

    } catch (error) {
      console.error('TTS Consumer error:', error);
      return null;
    }
  }

  private addVocalDirection(text: string, eventType: string): string {
    const directions: Record<string, string> = {
      'GOAL': `[excitement] GOAL! ${text} [cheerful]`,
      'PENALTY': `[excitement] ${text}`,
      'CARD': `[serious] ${text}`,
      'SHOT': `[normal] ${text} [slight excitement]`,
      'SUBSTITUTION': `[normal] ${text}`,
      'HALF_TIME': `[calm] ${text}`,
      'FULL_TIME': `[excitement] ${text} [cheerful]`,
    };
    return directions[eventType] || `[normal] ${text}`;
  }

  private initializeIcecast(icecastUrl: string) {
    // In production, use FFmpeg or a streaming library
    // const { spawn } = require('child_process');
    // this.icecastStream = spawn('ffmpeg', [...]);
    console.log('📻 Icecast initialized:', icecastUrl);
  }

  private pipeToIcecast(audioData: Buffer) {
    // In production, write to FFmpeg stdin
    // this.icecastStream.stdin.write(audioData);
    console.log(`📻 Piped ${audioData.length} bytes to Icecast`);
  }
}

// ============================================================
// 3. STREAMING ORCHESTRATOR (Producer + Consumer)
// ============================================================
export class StreamingOrchestrator {
  private producer: CommentaryProducer;
  private consumer: CommentaryConsumer;
  private eventEmitter = new EventEmitter();
  private eventCallback: ((data: any) => void) | null = null;

  constructor(icecastUrl?: string) {
    this.producer = new CommentaryProducer();
    this.consumer = new CommentaryConsumer(icecastUrl);
  }

  async processEvent(eventData: any, matchContext: any): Promise<void> {
    try {
      console.log(`🔄 Processing event: ${eventData.type} at ${eventData.time}'`);

      // Collect all audio chunks for the event
      const audioChunks: Buffer[] = [];

      // Producer: Stream sentences from LLM
      const sentenceStream = this.producer.streamSentences(eventData, matchContext);

      // Consumer: Convert each sentence to audio
      for await (const sentence of sentenceStream) {
        console.log(`📝 Sentence: "${sentence}"`);
        
        const audioChunk = await this.consumer.consumeSentence(
          sentence, 
          eventData.type
        );

        if (audioChunk) {
          audioChunks.push(audioChunk);
          // Emit audio chunk for real-time streaming
          this.eventEmitter.emit('audio-chunk', {
            sentence,
            audio: audioChunk,
            eventId: eventData.id,
          });
        }
      }

      // Emit complete event with all audio
      this.eventEmitter.emit('event-complete', {
        event: eventData,
        commentary: audioChunks,
        totalAudioSize: audioChunks.reduce((sum, chunk) => sum + chunk.length, 0),
      });

      if (this.eventCallback) {
        this.eventCallback({
          event: eventData,
          commentary: audioChunks,
          sentences: audioChunks.map((_, i) => `Sentence ${i+1}`),
        });
      }

    } catch (error) {
      console.error('Orchestrator error:', error);
      this.eventEmitter.emit('error', { event: eventData, error });
    }
  }

  onAudioChunk(callback: (data: { sentence: string; audio: Buffer; eventId: string }) => void) {
    this.eventEmitter.on('audio-chunk', callback);
    return () => this.eventEmitter.off('audio-chunk', callback);
  }

  onEventComplete(callback: (data: any) => void) {
    this.eventCallback = callback;
  }

  onError(callback: (data: { event: any; error: any }) => void) {
    this.eventEmitter.on('error', callback);
    return () => this.eventEmitter.off('error', callback);
  }
}
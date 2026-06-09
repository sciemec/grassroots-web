// lib/audio-commentary.ts - REAL browser speech synthesis

class RealAudioCommentary {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private queue: string[] = [];
  private isPlayingFlag = false;
  
  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.synth = window.speechSynthesis;
    }
  }
  
  speak(text: string, rate: number = 0.95, pitch: number = 1.0): boolean {
    if (!this.synth) {
      console.error('Speech synthesis not supported in this browser');
      return false;
    }
    
    // Cancel current speech
    if (this.isPlayingFlag) {
      this.synth.cancel();
    }
    
    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.rate = rate;
    this.currentUtterance.pitch = pitch;
    this.currentUtterance.volume = 1;
    
    // Try to use English voice
    const voices = this.synth.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en-'));
    if (englishVoice) {
      this.currentUtterance.voice = englishVoice;
    }
    
    this.currentUtterance.onstart = () => {
      this.isPlayingFlag = true;
    };
    
    this.currentUtterance.onend = () => {
      this.isPlayingFlag = false;
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        if (next) this.speak(next);
      }
    };
    
    this.synth.speak(this.currentUtterance);
    return true;
  }
  
  queueCommentary(text: string, rate?: number, pitch?: number): void {
    if (!this.isPlayingFlag) {
      this.speak(text, rate, pitch);
    } else {
      this.queue.push(text);
    }
  }
  
  stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.isPlayingFlag = false;
      this.queue = [];
    }
  }
  
  get isPlaying(): boolean {
    return this.isPlayingFlag;
  }
}

let audioInstance: RealAudioCommentary | null = null;

export function getAudioCommentary(): RealAudioCommentary {
  if (typeof window === 'undefined') {
    return {} as RealAudioCommentary;
  }
  
  if (!audioInstance) {
    audioInstance = new RealAudioCommentary();
  }
  return audioInstance;
}
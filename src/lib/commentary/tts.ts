// src/lib/commentary/tts.ts

const INWORLD_API_KEY = process.env.INWORLD_TTS_API_KEY;
const INWORLD_URL = 'https://api.inworld.ai/tts/v1/synthesize';

export interface TTSOptions {
  voice?: string;
  speed?: number;
  pitch?: number;
  emotion?: 'neutral' | 'excited' | 'calm';
}

// Inworld TTS-1.5 Max (Recommended)
export async function synthesizeWithInworld(
  text: string,
  options: TTSOptions = {}
): Promise<Buffer> {
  if (!INWORLD_API_KEY) {
    console.warn('INWORLD_TTS_API_KEY not set, using fallback');
    return synthesizeFallback(text);
  }

  try {
    const response = await fetch(INWORLD_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${INWORLD_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice: options.voice || 'en-US-Wavenet-F', // Zimbabwean accent
        speed: options.speed || 1.0,
        pitch: options.pitch || 1.0,
        emotion: options.emotion || 'neutral',
        audio_format: 'mp3',
        sample_rate: 24000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Inworld TTS error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    return Buffer.from(audioBuffer);
  } catch (error) {
    console.error('TTS error:', error);
    return synthesizeFallback(text);
  }
}

// Google Flash-Lite TTS (Cheaper Alternative)
export async function synthesizeWithGoogle(text: string): Promise<Buffer> {
  const API_KEY = process.env.GOOGLE_TTS_API_KEY;
  if (!API_KEY) return synthesizeFallback(text);

  try {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'en-ZW',
            name: 'en-ZW-Studio-A',
            ssmlGender: 'MALE',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 0.95,
            pitch: 0,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google TTS error: ${response.status}`);
    }

    const data = await response.json();
    return Buffer.from(data.audioContent, 'base64');
  } catch (error) {
    console.error('Google TTS error:', error);
    return synthesizeFallback(text);
  }
}

// Azure Neural TTS (with Zimbabwean voices)
export async function synthesizeWithAzure(text: string): Promise<Buffer> {
  const API_KEY = process.env.AZURE_TTS_API_KEY;
  const REGION = process.env.AZURE_TTS_REGION || 'southafricanorth';
  
  if (!API_KEY) return synthesizeFallback(text);

  try {
    const response = await fetch(
      `https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': API_KEY,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        },
        body: `
          <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-ZW">
            <voice name="en-ZW-TendaiNeural">
              <prosody rate="0.95" pitch="0%">
                ${text}
              </prosody>
            </voice>
          </speak>
        `,
      }
    );

    if (!response.ok) {
      throw new Error(`Azure TTS error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    return Buffer.from(audioBuffer);
  } catch (error) {
    console.error('Azure TTS error:', error);
    return synthesizeFallback(text);
  }
}

// Fallback: simple text-only (no audio)
function synthesizeFallback(text: string): Buffer {
  // Return empty buffer - we'll handle this gracefully
  return Buffer.from('');
}
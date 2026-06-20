// src/lib/commentary/engine.ts
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface MatchEvent {
  id: string;
  minute: number;
  eventType: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'shot' | 'corner' | 'offside';
  team: string;
  playerName?: string;
  assistPlayerName?: string;
  homeScore: number;
  awayScore: number;
  homeTeam: string;
  awayTeam: string;
  coordinateX?: number;
  coordinateY?: number;
}

export interface CommentaryResult {
  text: string;
  audio: Buffer;
  duration: number;
}

const COMMENTARY_PROMPTS = {
  goal: (event: MatchEvent) => `
You are a passionate Zimbabwean football commentator at the World Cup.
A GOAL has just been scored!
Team: ${event.team}
Scorer: ${event.playerName || 'A player'}
Assist: ${event.assistPlayerName || 'No assist'}
Score: ${event.homeScore} - ${event.awayScore}
Minute: ${event.minute}'

Generate 2-3 sentences of EXCITING radio commentary in English.
Make it energetic, use phrases like "GOAL! GOAL! GOAL!"
Keep it clear for radio listeners. Return ONLY the commentary text.
`,

  yellow_card: (event: MatchEvent) => `
You are a Zimbabwean football commentator.
A yellow card has been shown.
Player: ${event.playerName || 'A player'}
Team: ${event.team}
Minute: ${event.minute}'

Generate 1-2 sentences describing what happened.
Be neutral and factual. Return ONLY the commentary text.
`,

  red_card: (event: MatchEvent) => `
You are a Zimbabwean football commentator.
A RED CARD has been shown!
Player: ${event.playerName || 'A player'}
Team: ${event.team}
Minute: ${event.minute}'

Generate 2 sentences showing appropriate emotion.
Return ONLY the commentary text.
`,

  shot: (event: MatchEvent) => `
You are a Zimbabwean football commentator.
A shot was taken!
Player: ${event.playerName || 'A player'}
Team: ${event.team}
Minute: ${event.minute}'

Generate 1-2 sentences describing the shot.
Build anticipation, then release. Return ONLY the commentary text.
`,

  substitution: (event: MatchEvent) => `
You are a Zimbabwean football commentator.
A substitution is happening.
Player coming on: ${event.playerName || 'A player'}
Team: ${event.team}
Minute: ${event.minute}'

Generate 1 sentence informing listeners. Return ONLY the commentary text.
`,

  default: (event: MatchEvent) => `
You are a Zimbabwean football commentator.
${event.eventType.replace('_', ' ')} at ${event.minute}' minute.
Score: ${event.homeScore} - ${event.awayScore}

Generate 1 short sentence describing what happened.
Return ONLY the commentary text.
`
};

export async function generateCommentary(event: MatchEvent): Promise<string> {
  const prompt = COMMENTARY_PROMPTS[event.eventType as keyof typeof COMMENTARY_PROMPTS]?.(event) 
    || COMMENTARY_PROMPTS.default(event);

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { 
          role: 'system', 
          content: 'You are a passionate Zimbabwean football commentator. Speak clearly, energetically, and professionally. Return only the commentary text, no other content.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 200,
    });

    return completion.choices[0]?.message?.content || getFallbackCommentary(event);
  } catch (error) {
    console.error('Commentary generation error:', error);
    return getFallbackCommentary(event);
  }
}

function getFallbackCommentary(event: MatchEvent): string {
  switch (event.eventType) {
    case 'goal':
      return `GOAL! ${event.playerName || 'A player'} scores for ${event.team}! The score is now ${event.homeScore} - ${event.awayScore}!`;
    case 'yellow_card':
      return `Yellow card shown to ${event.playerName || 'A player'} of ${event.team} at ${event.minute} minutes.`;
    case 'red_card':
      return `RED CARD! ${event.playerName || 'A player'} is sent off! That changes everything!`;
    case 'shot':
      return `${event.playerName || 'A player'} takes a shot for ${event.team}!`;
    default:
      return `${event.eventType} at ${event.minute} minutes.`;
  }
}
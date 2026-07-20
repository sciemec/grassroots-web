// lib/commentary-engine.ts - NO MOCKS, REAL AI ONLY
import { geminiText } from '@/lib/gemini';

export async function generateCommentary(event: {
  id: string;
  minute: number;
  eventType: string;
  team: string;
  playerName: string;
  homeScore: number;
  awayScore: number;
}): Promise<string> {
  const prompt = getPromptForEvent(event);

  const commentary = await geminiText(
    'You are a live radio commentator. Return ONLY the commentary text.',
    [{ role: 'user', content: prompt }],
    { max_tokens: 100, temperature: 0.7 },
  );

  if (!commentary) {
    throw new Error('No commentary generated');
  }

  return commentary;
}

function getPromptForEvent(event: {
  eventType: string;
  playerName: string;
  minute: number;
  homeScore: number;
  awayScore: number;
}): string {
  const scoreText = `${event.homeScore} - ${event.awayScore}`;
  
  switch (event.eventType) {
    case 'goal':
      return `You are a live radio commentator at the FIFA World Cup.
Create ONE exciting sentence for: GOAL scored by ${event.playerName} at ${event.minute} minutes. Score is now ${scoreText}.
Make it energetic but professional. Return ONLY the commentary text.`;
      
    case 'yellow_card':
      return `You are a live radio commentator.
Create ONE sentence for: YELLOW CARD shown to ${event.playerName} at ${event.minute} minutes.
Be neutral and factual. Return ONLY the commentary text.`;
      
    case 'red_card':
      return `You are a live radio commentator.
Create ONE sentence for: RED CARD! ${event.playerName} is sent off at ${event.minute} minutes.
Show appropriate emotion. Return ONLY the commentary text.`;
      
    default:
      return `You are a live radio commentator.
Create ONE short sentence describing: ${event.eventType} at ${event.minute} minutes.
Return ONLY the commentary text.`;
  }
}
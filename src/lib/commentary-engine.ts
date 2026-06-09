// lib/commentary-engine.ts - NO MOCKS, REAL AI ONLY

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function generateCommentary(event: {
  id: string;
  minute: number;
  eventType: string;
  team: string;
  playerName: string;
  homeScore: number;
  awayScore: number;
}): Promise<string> {
  // Require API key - no fallback mocks
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is required. Get free key from console.groq.com');
  }
  
  const prompt = getPromptForEvent(event);
  
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 100
    })
  });
  
  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }
  
  const data = await response.json();
  const commentary = data.choices[0]?.message?.content;
  
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
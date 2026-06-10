// lib/halftime-bots.ts

const ANALYST_PROMPT = `You are "The Analyst" - a calm, data-driven football expert. 
You speak slowly and deliberately. You use statistics like xG, possession, pass accuracy.
You never shout. You are the voice of reason.`;

const PUNDIT_PROMPT = `You are "The Pundit" - a loud, passionate former player.
You shout. You say "WHAT A SAVE!" and "HOW DID HE MISS THAT?"
You are emotional. You are the voice of the fans in the pub.`;

export async function generateHalftimeDebate(matchData: any): Promise<string> {
  const analystResponse = await callGroq(ANALYST_PROMPT, matchData);
  const punditResponse = await callGroq(PUNDIT_PROMPT, matchData);
  
  return `
🎙️ HALF-TIME ANALYSIS - Spain vs Germany

📊 THE ANALYST: "${analystResponse}"

🔥 THE PUNDIT: "${punditResponse}"

💰 Who wins? Bet on second half: [betway.com/aff?id=GRASSROOTS]

📱 Reply "STATS" for full first-half data
  `;
}
// lib/halftime-bots.ts
import { groqText } from "@/lib/groq";

interface MatchData {
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  homePossession?: number;
  awayPossession?: number;
  homeShots?: number;
  awayShots?: number;
  minute?: number;
}

const ANALYST_PROMPT = `You are "The Analyst" - a calm, data-driven football expert.
You speak slowly and deliberately. You use statistics like xG, possession, pass accuracy.
You never shout. You are the voice of reason.`;

const PUNDIT_PROMPT = `You are "The Pundit" - a loud, passionate former player.
You shout. You say "WHAT A SAVE!" and "HOW DID HE MISS THAT?"
You are emotional. You are the voice of the fans in the pub.`;

export async function generateHalftimeDebate(matchData: MatchData): Promise<string> {
  const matchContext = [{ role: "user" as const, content: JSON.stringify(matchData) }];

  const analystResponse = await groqText(ANALYST_PROMPT, matchContext);
  const punditResponse = await groqText(PUNDIT_PROMPT, matchContext);

  const homeTeam = matchData.homeTeam ?? "Home";
  const awayTeam = matchData.awayTeam ?? "Away";
  const affiliateUrl = process.env.BETWAY_AFFILIATE_URL ?? "";

  return [
    `🎙️ HALF-TIME ANALYSIS - ${homeTeam} vs ${awayTeam}`,
    ``,
    `📊 THE ANALYST: "${analystResponse}"`,
    ``,
    `🔥 THE PUNDIT: "${punditResponse}"`,
    ``,
    ...(affiliateUrl ? [`💰 Who wins? Bet on second half: ${affiliateUrl}`, ``] : []),
    `📱 Reply "STATS" for full first-half data`,
  ].join("\n");
}

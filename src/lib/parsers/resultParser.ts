"use client";

export interface ExtractedMatch {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  league: string;
  source: string;
  extractedAt: string;
}

const MATCH_REGEX = /([A-Za-z0-9\s\.\u00C0-\u017F]+?)\s+(\d+)\s*[\-–:xXvV]\s*(\d+)\s+([A-Za-z0-9\s\.\u00C0-\u017F]+)/;

/**
 * Grassroots Sports - Provincial Result Parser
 * Runs regex pattern-matching across unstructured text inputs to output clean schemas.
 */
export function parseRawFeedText(rawText: string, sourceFeed: string, defaultLeague: string): ExtractedMatch[] {
  const lines = rawText.split('\n');
  const extractedMatches: ExtractedMatch[] = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    const match = line.match(MATCH_REGEX);
    if (match) {
      const homeTeam = match[1].replace(/^(👉|■|⚡|•|\-|\*)\s*/, '').trim();
      const homeScore = parseInt(match[2], 10);
      const awayScore = parseInt(match[3], 10);
      const awayTeam = match[4].replace(/\s*(🔥|⚽|🏆|📍.*|#.*)$/, '').trim();

      // Skip invalid timestamps or date blocks captured by mistake
      if (homeTeam.toLowerCase().includes('kickoff') || homeTeam.toLowerCase().includes('time')) {
        continue;
      }

      extractedMatches.push({
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
        status: "FT",
        league: defaultLeague,
        source: sourceFeed,
        extractedAt: new Date().toISOString()
      });
    }
  }

  return extractedMatches;
}
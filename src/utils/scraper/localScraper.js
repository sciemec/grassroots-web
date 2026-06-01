/**
 * Grassroots Sports - Provincial Result Parser (Option A)
 * This script runs regular expression filters across unstructured text feeds
 * to parse local results without paying for AI endpoints.
 */

// 1. Regular expression optimized for common Zimbabwean match report formats
// Matches patterns like: "Dynamos 2-1 Highlanders", "CAPS Utd 0 - 0 Ngezi", "Real Stars 1 : 3 Mushowani"
const MATCH_REGEX = /([A-Za-z0-9\s\.\u00C0-\u017F]+?)\s+(\d+)\s*[\-–:xXvV]\s*(\d+)\s+([A-Za-z0-9\s\.\u00C0-\u017F]+)/;

/**
 * Parses raw post strings into structured database objects
 */
function parseRawFeedText(rawText, sourceFeed, defaultLeague) {
  // Split post text into individual lines to look for scorelines
  const lines = rawText.split('\n');
  const extractedMatches = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    const match = line.match(MATCH_REGEX);
    if (match) {
      const homeTeam = match[1].replace(/^(👉|■|⚡|•|\-|\*)\s*/, '').trim(); // clean bullet decorators
      const homeScore = parseInt(match[2], 10);
      const awayScore = parseInt(match[3], 10);
      const awayTeam = match[4].replace(/\s*(🔥|⚽|🏆|📍.*|#.*)$/, '').trim(); // clean suffix emojis/tags

      // Skip false positives (like times or dates e.g. "14:30")
      if (homeTeam.toLowerCase().includes('kickoff') || homeTeam.toLowerCase().includes('time')) {
        continue;
      }

      extractedMatches.push({
        homeTeam: homeTeam,
        awayTeam: awayTeam,
        homeScore: homeScore,
        awayScore: awayScore,
        status: "FT", // Defaults to Full-Time since it's an uploaded update report
        league: defaultLeague,
        source: sourceFeed,
        extractedAt: new Date().toISOString()
      });
    }
  }

  return extractedMatches;
}

// ─── RUNNING A SIMULATED SCRAPE TEST ────────────────────────────────────────

// Simulated raw unstructured data pulled from local Facebook groups & community blogs
const mockScrapedFacebookPosts = [
  {
    source: "Mashonaland Central Football Updates Group",
    league: "Division 2 Regional League",
    text: "What a crazy weekend of soccer action across the province! Thank you to all the fans who came out.\n\nHere are the weekend results as confirmed by officials:\nBindura United 3 - 1 Shamva FC\nTrojan Stars 0-2 Mvurwi FC\nGlendale FC 1 : 1 Mazowe Academy\n\nTable updates coming tomorrow morning!"
  },
  {
    source: "Chitungwiza Soccer Fan Corner",
    league: "Harare Provincial League",
    text: "Full time scores from Chibuku Stadium grounds today! \nReal Stars FC 2x1 Seke United.\nThe home side takes all three points after a late penalty decision!"
  }
];

console.log("🚀 Starting Option A Pattern-Matching Parsing Sequence...");
console.log("===============================================================");

let totalParsed = 0;

mockScrapedFacebookPosts.forEach((post) => {
  console.log(`\nReading Feed: "${post.source}"`);
  
  const parsedResults = parseRawFeedText(post.text, post.source, post.league);
  
  if (parsedResults.length > 0) {
    parsedResults.forEach((result) => {
      totalParsed++;
      console.log(`✅ MATCH FOUND [${result.league}]:`);
      console.log(`   👉 ${result.homeTeam} (${result.homeScore}) vs (${result.awayScore}) ${result.awayTeam}`);
    });
  } else {
    console.log("❌ No structured result patterns recognized in this post block.");
  }
});

console.log("\n===============================================================");
console.log(`📊 Parsing complete. Successfully structured ${totalParsed} matches for your database!`);
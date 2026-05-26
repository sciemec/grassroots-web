const axios = require('axios');

// An in-memory tracking map to prevent duplicate database writes across polling ticks
const seenEventIds = new Set();

/**
 * Polling engine loop for API-Football (Updates every 15-30 seconds)
 * @param {string|number} fixtureId - The unique ID of the match from the provider
 */
async function pollApiFootballLive(fixtureId) {
  try {
    // 1. Fetch live data for the active fixture from API-Football
    const response = await axios.get(`https://v3.football.api-sports.io/fixtures`, {
      params: { id: fixtureId },
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': process.env.RAPIDAPI_HOST
      }
    });

    const fixtureData = response.data.response[0];
    if (!fixtureData) return null;

    const events = fixtureData.events || [];
    const newCommentaryLines = [];

    // 2. Loop through incoming events chronologically
    events.forEach(event => {
      // Create a unique hash key for every specific event string
      const eventUid = `${fixtureId}_${event.time.elapsed}_${event.type}_${event.detail || ''}`;
      
      if (!seenEventIds.has(eventUid)) {
        seenEventIds.add(eventUid);
        
        // Translate the raw API payload object into descriptive English commentary
        const textCommentary = formatApiFootballEvent(event);
        newCommentaryLines.push(textCommentary);
      }
    });

    return {
      score: `${fixtureData.goals.home} - ${fixtureData.goals.away}`,
      time: fixtureData.fixture.status.elapsed,
      newCommentary: newCommentaryLines
    };
  } catch (error) {
    console.error('API-Football fetching mismatch:', error.message);
    return null;
  }
}

/**
 * Core translator: Maps raw event object keys into smooth English commentary strings
 */
function formatApiFootballEvent(event) {
  const min = event.time.elapsed;
  const player = event.player && event.player.name ? event.player.name : 'A player';
  const team = event.team && event.team.name ? event.team.name : 'Team';
  const assist = event.assist && event.assist.name ? ` assisted by ${event.assist.name}` : '';

  switch (event.type.toUpperCase()) {
    case 'GOAL':
      return `${min}' - ⚽ GOAAAAAL!!! ${player} scores for ${team}!${assist}. The crowd goes absolutely wild inside the arena!`;
    case 'CARD':
      const cardColor = event.detail.toLowerCase().includes('red') ? '🟥 Red' : '🟨 Yellow';
      return `${min}' - ${cardColor} Card! The referee brandishes a card to ${player} (${team}) after a heavy, mistimed challenge.`;
    case 'SUBST':
      return `${min}' - 🔄 Substitution for ${team}: ${player} leaves the pitch, replaced dynamically by ${event.detail || 'a substitute'}.`;
    case 'VAR':
      return `${min}' - 🖥️ VAR Review! The referee is halting play to consult video assistance for a critical decision regarding: ${event.detail || 'an incident'}. Tense atmosphere.`;
    default:
      return `${min}' - Action for ${team}: ${player} heavily involved in a key sequence (${event.detail || 'play processing'}).`;
  }
}

module.exports = { pollApiFootballLive };
const express = require('express');
const router = express.Router();
const { pollApiFootballLive } = require('../services/liveMatchPolling');

// In-memory array cache acting as a local database repository for testing timeline updates
let fanHubCommentaryFeed = [];

/**
 * GET route for your frontend web interface to pull updates dynamically
 * Endpoint example: GET /api/fan-hub/match/8535517/live-feed
 */
router.get('/match/:id/live-feed', async (req, res) => {
  try {
    const fixtureId = req.params.id;
    
    // Call our polling service logic to get current match data streams
    const liveUpdate = await pollApiFootballLive(fixtureId);
    
    if (liveUpdate) {
      if (liveUpdate.newCommentary && liveUpdate.newCommentary.length > 0) {
        // Insert new commentary lines directly at the top of the feed stack
        fanHubCommentaryFeed = [...liveUpdate.newCommentary, ...fanHubCommentaryFeed];
      }

      return res.status(200).json({
        success: true,
        currentScore: liveUpdate.score || "0 - 0",
        elapsedTime: liveUpdate.time ? `${liveUpdate.time}'` : "0'",
        commentaryTimeline: fanHubCommentaryFeed
      });
    } else {
      return res.status(200).json({
        success: true,
        currentScore: "0 - 0",
        elapsedTime: "0'",
        commentaryTimeline: fanHubCommentaryFeed
      });
    }
  } catch (error) {
    console.error("Router operational failure:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
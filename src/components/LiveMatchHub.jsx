import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LiveMatchHub = ({ matchId }) => {
  const [score, setScore] = useState('0 - 0');
  const [time, setTime] = useState("0'");
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Define the data-fetching function targeting your backend route
    const fetchLiveUpdates = async () => {
      try {
        // Points to the Express router endpoint we created earlier
        const response = await axios.get(`/api/fan-hub/match/${matchId}/live-feed`);
        
        if (response.data.success) {
          setScore(response.data.currentScore);
          setTime(response.data.elapsedTime);
          setTimeline(response.data.commentaryTimeline);
          setError(null);
        }
      } catch (err) {
        console.error("Error connecting to Fan Hub API:", err);
        setError("Temporary connection issue. Reconnecting...");
      } finally {
        setLoading(false);
      }
    };

    // 2. Run the fetch immediately when the page loads
    fetchLiveUpdates();

    // 3. Set up an interval loop to poll the backend every 15 seconds automatically
    const intervalId = setInterval(fetchLiveUpdates, 15000);

    // Clean up the interval loop if the user navigates away from the page
    return () => clearInterval(intervalId);
  }, [matchId]);

  if (loading) return <div style={styles.centerText}>Loading match data...</div>;

  return (
    <div style={styles.container}>
      {/* SCOREBOARD BLOCK */}
      <div style={styles.scoreboard}>
        <div style={styles.header}>LIVE FAN HUB COMMENTARY</div>
        <div style={styles.timeBadge}>{time}</div>
        <div style={styles.scoreText}>{score}</div>
        {error && <div style={styles.errorText}>{error}</div>}
      </div>

      <hr style={styles.divider} />

      {/* TEXT TIMELINE FEED */}
      <div style={styles.feedContainer}>
        <h3 style={styles.feedTitle}>Match Timeline</h3>
        {timeline.length === 0 ? (
          <p style={styles.emptyText}>The match is preparing to kick off. Stay tuned for live event commentary!</p>
        ) : (
          <div style={styles.list}>
            {timeline.map((line, index) => (
              <div key={index} style={index === 0 ? styles.latestCard : styles.oldCard}>
                {index === 0 && <span style={styles.liveIndicator}>● LATEST</span>}
                <p style={styles.commentaryText}>{line}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Clean, scannable inline UI styles
const styles = {
  container: { maxWidth: '700px', margin: '20px auto', padding: '15px', fontFamily: 'Arial, sans-serif' },
  scoreboard: { backgroundColor: '#1e3a8a', color: '#ffffff', borderRadius: '8px', padding: '20px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  header: { fontSize: '12px', letterSpacing: '1px', color: '#93c5fd', fontWeight: 'bold', marginBottom: '10px' },
  timeBadge: { display: 'inline-block', backgroundColor: '#ef4444', padding: '3px 8px', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' },
  scoreText: { fontSize: '42px', fontWeight: 'bold', marginTop: '10px' },
  errorText: { color: '#fca5a5', fontSize: '12px', marginTop: '8px' },
  divider: { border: '0', height: '1px', backgroundColor: '#e5e7eb', margin: '25px 0' },
  feedContainer: { display: 'flex', flexDirection: 'column' },
  feedTitle: { fontSize: '18px', color: '#1f2937', marginBottom: '15px' },
  emptyText: { color: '#6b7280', fontStyle: 'italic', textAlign: 'center' },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  latestCard: { backgroundColor: '#f0fdf4', borderLeft: '4px solid #22c55e', padding: '15px', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  oldCard: { backgroundColor: '#f9fafb', borderLeft: '4px solid #d1d5db', padding: '12px', borderRadius: '4px' },
  liveIndicator: { display: 'inline-block', fontSize: '10px', color: '#22c55e', fontWeight: 'bold', marginBottom: '5px' },
  commentaryText: { fontSize: '15px', color: '#374151', margin: 0, lineHeight: '1.5' },
  centerText: { textAlign: 'center', marginTop: '50px', color: '#6b7280' }
};

export default LiveMatchHub;
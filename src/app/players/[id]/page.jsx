'use client';
import React from 'react';
import { useParams } from 'next/navigation';

export default function PlayerScoutingProfile() {
  const params = useParams();
  const playerId = params.id;

  // Mock telemetry data matching our grassroots metrics structure
  const playerStats = {
    name: "Tinashe Moyo",
    age: 14,
    team: "Highlanders U14 Academy",
    position: "Forward",
    metrics: { pace: 88, shooting: 82, passing: 75, dribbling: 85, stamina: 80 },
    matchHistory: [
      { opponent: "Dynamos Juniors", goals: 2, assists: 1, rating: 8.9 },
      { opponent: "CAPS Jnr Academy", goals: 1, assists: 0, rating: 7.5 }
    ]
  };

  return (
    <div style={styles.container}>
      {/* HEADER SECTION */}
      <div style={styles.profileHeader}>
        <div style={styles.avatarMock}>🏃‍♂️</div>
        <div>
          <h1 style={styles.playerName}>{playerStats.name}</h1>
          <p style={styles.playerMeta}>{playerStats.position} • {playerStats.team}</p>
        </div>
      </div>

      {/* METRICS PERFORMANCE MATRIX */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Scouting Attribute Metrics</h3>
          {Object.entries(playerStats.metrics).map(([key, value]) => (
            <div key={key} style={styles.metricRow}>
              <span style={styles.metricName}>{key.toUpperCase()}</span>
              <div style={styles.barOuter}>
                <div style={{...styles.barInner, width: `${value}%`}}></div>
              </div>
              <span style={styles.metricValue}>{value}</span>
            </div>
          ))}
        </div>

        {/* MATCH TIMELINE HISTORY */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Recent Match Log Performance</h3>
          {playerStats.matchHistory.map((match, idx) => (
            <div key={idx} style={styles.matchRow}>
              <div>
                <strong style={{color: '#111827'}}>vs {match.opponent}</strong>
                <p style={{margin: 0, fontSize: '12px', color: '#6b7280'}}>Goals: {match.goals} | Assists: {match.assists}</p>
              </div>
              <span style={styles.ratingTag}>⭐ {match.rating}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '30px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' },
  profileHeader: { display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#1e3a8a', padding: '25px', borderRadius: '12px', color: '#ffffff', marginBottom: '30px' },
  avatarMock: { width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' },
  playerName: { margin: 0, fontSize: '24px', fontWeight: 'bold' },
  playerMeta: { margin: '4px 0 0 0', color: '#93c5fd', fontSize: '14px', fontWeight: '500' },
  grid: { display: 'flex', gap: '25px', flexWrap: 'wrap' },
  card: { flex: 1, minWidth: '300px', backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' },
  cardTitle: { margin: '0 0 20px 0', fontSize: '16px', color: '#1f2937', fontWeight: 'bold', borderBottom: '2px solid #f3f4f6', paddingBottom: '10px' },
  metricRow: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '12px' },
  metricName: { width: '90px', fontSize: '11px', fontWeight: 'bold', color: '#4b5563' },
  barOuter: { flex: 1, height: '10px', backgroundColor: '#e5e7eb', borderRadius: '5px', overflow: 'hidden' },
  barInner: { height: '100%', backgroundColor: '#10b981', borderRadius: '5px' },
  metricValue: { width: '25px', fontSize: '13px', fontWeight: 'bold', color: '#111827', textAlign: 'right' },
  matchRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' },
  ratingTag: { backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }
};
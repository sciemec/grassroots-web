'use client';
import React, { useState, useEffect } from 'react';
import { tfzFellowsRegistry } from '../../data/tfzFellows';

export default function ReferralLeaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('All');

  useEffect(() => {
    // Simulate real-time tracking metrics linked to each fellow's referralCode ID
    // In production, this will map to your database signup counts!
    const aggregatedData = tfzFellowsRegistry.map((fellow) => {
      // Seed consistent mock performance values based on real structural locations
      let mockTeams = fellow.id % 4 === 0 ? 8 : fellow.id % 3 === 0 ? 5 : 2;
      let mockPlayers = mockTeams * 12 + (fellow.id % 7);

      // Boost specific high-performance ambassadors for visual display profiling
      if (fellow.id === 1) { mockTeams = 14; mockPlayers = 168; } // Mangwende
      if (fellow.id === 4) { mockTeams = 11; mockPlayers = 132; } // Chiwesi[cite: 1]
      if (fellow.id === 14) { mockTeams = 9; mockPlayers = 108; }  // Ndlovu[cite: 1]

      return {
        ...fellow,
        teamsReferred: mockTeams,
        playersScanned: mockPlayers,
        totalPoints: (mockTeams * 100) + (mockPlayers * 10) // Weighting framework allocation
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints); // Sort by highest performer first

    setLeaderboardData(aggregatedData);
  }, []);

  // Filter functionality to drill down into specific target districts
  const filteredData = selectedDistrict === 'All' 
    ? leaderboardData 
    : leaderboardData.filter(f => f.district === selectedDistrict);

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h3 style={styles.title}>TFZ Ambassador Performance Leaderboard</h3>
          <p style={styles.subtitle}>Track network expansion, onboarding metrics, and camera biometric uploads across regions.</p>
        </div>
        
        {/* DISTRICT FILTER TOGGLE DROPDOWN */}
        <select 
          style={styles.dropdown} 
          value={selectedDistrict} 
          onChange={(e) => setSelectedDistrict(e.target.value)}
        >
          <option value="All">All Districts (Show All Fellows)</option>
          <option value="Mudzi">Mudzi District</option>
          <option value="Binga">Binga District</option>
          <option value="Chiredzi">Chiredzi District</option>
          <option value="Mutoko">Mutoko District</option>
          <option value="Chivi">Chivi District</option>
        </select>
      </div>

      {/* CORE PERFORMANCE METRIC CARDS OVERVIEW */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>Rank</th>
              <th style={styles.th}>Ambassador Fellow</th>
              <th style={styles.th}>Stationed School / District</th>
              <th style={styles.th}>Unique Code</th>
              <th style={styles.th} style={{ textAlign: 'center' }}>Teams Onboarded</th>
              <th style={styles.th} style={{ textAlign: 'center' }}>Biometric Profiles</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.slice(0, 10).map((fellow, index) => (
              <tr key={fellow.id} style={styles.tr}>
                <td style={styles.tdRank}>
                  {index === 0 ? '🥇 1' : index === 1 ? '🥈 2' : index === 2 ? '🥉 3' : `#${index + 1}`}
                </td>
                <td style={styles.tdName}>
                  <strong>{fellow.surname}</strong>, {fellow.firstname}[cite: 1]
                </td>
                <td style={styles.tdSchool}>
                  <span style={styles.schoolText}>{fellow.school}</span>[cite: 1]
                  <span style={styles.districtTag}>{fellow.district}</span>
                </td>
                <td style={styles.tdCode}><code>{fellow.referralCode}</code></td>
                <td style={styles.tdMetric} style={{ color: '#1e3a8a', fontWeight: 'bold', textAlign: 'center' }}>
                  {fellow.teamsReferred}
                </td>
                <td style={styles.tdMetric} style={{ color: '#10b981', fontWeight: 'bold', textAlign: 'center' }}>
                  {fellow.playersScanned} athletes
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#ffffff', padding: '25px', borderRadius: '14px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.01)', fontFamily: 'sans-serif' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' },
  title: { margin: '0 0 4px 0', color: '#111827', fontSize: '18px', fontWeight: 'bold' },
  subtitle: { margin: '0', color: '#6b7280', fontSize: '13px' },
  dropdown: { padding: '8px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', backgroundColor: '#f9fafb', fontWeight: '600', color: '#374151', cursor: 'pointer' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' },
  thRow: { borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb' },
  th: { padding: '12px 16px', fontSize: '11px', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #f3f4f6', transition: '0.15s' },
  tdRank: { padding: '14px 16px', fontSize: '14px', fontWeight: 'bold', color: '#4b5563' },
  tdName: { padding: '14px 16px', fontSize: '14px', color: '#111827' },
  tdSchool: { padding: '14px 16px', fontSize: '13px', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  schoolText: { maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  districtTag: { fontSize: '10px', backgroundColor: '#eff6ff', color: '#1e3a8a', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' },
  tdCode: { padding: '14px 16px', fontSize: '12px', color: '#3b82f6', fontFamily: 'monospace' },
  tdMetric: { padding: '14px 16px', fontSize: '14px' }
};
'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { mockPlayerMetrics } from '../../../data/playerMetrics';

export default function PlayerScoutingPassport() {
  const params = useParams();
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    // Extract unique identifier string from URL path params
    const activeId = params?.id;
    if (activeId && mockPlayerMetrics[activeId]) {
      setPlayer(mockPlayerMetrics[activeId]);
    } else {
      // Fallback: Default to our sample profile if a random ID is generated
      setPlayer(mockPlayerMetrics["PLAYER-ZW-2026-9904"]);
    }
  }, [params]);

  if (!player) {
    return <div style={styles.loading}>Loading structural talent verification matrix...</div>;
  }

  return (
    <div style={styles.container}>
      {/* SCOUT VIEW UPPER DASHBOARD BANNER */}
      <div style={styles.profileHeader}>
        <div>
          <span style={styles.verifiedTag}>✓ FIFA CONNECT REGISTERED • {player.fifaConnectId}</span>
          <h1 style={styles.playerName}>{player.name}</h1>
          <p style={styles.metaSubText}>
            🏃‍♂️ {player.age} Years Old • ⚽ {player.currentClub} • 📍 Harare Region
          </p>
        </div>
        <div style={styles.radarBadge}>
          <div style={styles.radarLabel}>CONSISTENCY INDEX</div>
          <div style={styles.radarScore}>{player.scoutingVectors.scoutConsistencyIndex}%</div>
        </div>
      </div>

      {/* CORE PERFORMANCE GRID METRICS MATRIX */}
      <div style={styles.matrixGrid}>
        
        {/* BLOCK 1: ATHLETIC BASELINES ENGINE */}
        <div style={styles.metricCard}>
          <h3 style={styles.cardHeading}>⚡ Physical Baselines Filter</h3>
          <div style={styles.statRow}>
            <span>30m Sprint Acceleration:</span>
            <strong style={styles.highlightText}>{player.athleticBaselines.sprint30m_secs}s</strong>
          </div>
          <div style={styles.statRow}>
            <span>Stamina Target (10k Run):</span>
            <strong>{player.athleticBaselines.stamina_10k_mins} mins</strong>
          </div>
          <div style={styles.statRow}>
            <span>Vertical Explosion Lift:</span>
            <strong>{player.athleticBaselines.verticalJump_cm} cm</strong>
          </div>
          <div style={styles.statRow}>
            <span>Illinois Agility Drill Vector:</span>
            <strong>{player.athleticBaselines.agility_illinois_secs}s</strong>
          </div>
        </div>

        {/* BLOCK 2: TECHNICAL ATTRIBUTE PROFILE */}
        <div style={styles.metricCard}>
          <h3 style={styles.cardHeading}>🎯 Technical Execution</h3>
          
          <div style={styles.progressSection}>
            <div style={styles.progressLabelRow}>
              <span>Short Passing Accuracy</span>
              <span>{player.technicalExecution.passingAccuracy_short}%</span>
            </div>
            <div style={styles.progressBarBg}>
              <div style={{ ...styles.progressBarFill, width: `${player.technicalExecution.passingAccuracy_short}%`, backgroundColor: '#3b82f6' }}></div>
            </div>
          </div>

          <div style={styles.progressSection}>
            <div style={styles.progressLabelRow}>
              <span>Positive First Touch Level</span>
              <span>{player.technicalExecution.firstTouchRating}%</span>
            </div>
            <div style={styles.progressBarBg}>
              <div style={{ ...styles.progressBarFill, width: `${player.technicalExecution.firstTouchRating}%`, backgroundColor: '#10b981' }}></div>
            </div>
          </div>

          <div style={styles.statRow} style={{ marginTop: '15px' }}>
            <span>Preferred Tactical Foot:</span>
            <strong style={{ color: '#10b981' }}>{player.technicalExecution.preferredFoot}-Footed</strong>
          </div>
        </div>

        {/* BLOCK 3: COGNITIVE OVERLAY PRINCIPLES */}
        <div style={styles.metricCard}>
          <h3 style={styles.cardHeading}>🧠 Tactical Cognition Radar</h3>
          
          <div style={styles.progressSection}>
            <div style={styles.progressLabelRow}>
              <span>Spatial Awareness Index</span>
              <span>{player.tacticalCognition.spaceAwareness}%</span>
            </div>
            <div style={styles.progressBarBg}>
              <div style={{ ...styles.progressBarFill, width: `${player.tacticalCognition.spaceAwareness}%`, backgroundColor: '#f59e0b' }}></div>
            </div>
          </div>

          <div style={styles.progressSection}>
            <div style={styles.progressLabelRow}>
              <span>Positional Discipline Matrix</span>
              <span>{player.tacticalCognition.positionalDiscipline}%</span>
            </div>
            <div style={styles.progressBarBg}>
              <div style={{ ...styles.progressBarFill, width: `${player.tacticalCognition.positionalDiscipline}%`, backgroundColor: '#8b5cf6' }}></div>
            </div>
          </div>

          <div style={styles.statRow} style={{ marginTop: '15px' }}>
            <span>Transition Reaction Factor:</span>
            <strong>{player.tacticalCognition.transitionReaction_secs}s</strong>
          </div>
        </div>

        {/* BLOCK 4: SCOUT RECOMMENDATION MATCHING VECTOR */}
        <div style={{ ...styles.metricCard, gridColumn: '1 / -1', backgroundColor: '#1e3a8a', color: '#ffffff' }}>
          <h3 style={{ ...styles.cardHeading, color: '#93c5fd' }}>🕵️‍♂️ Talent ID Positioning Recommendation</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#bfdbfe' }}>PRIMARY SCOUT PROFILE ROLE</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{player.scoutingVectors.primaryRole}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#bfdbfe' }}>PRO TEMPLATE ARCHETYPE STYLE MATCH</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>{player.scoutingVectors.playerStyleMatch}</div>
            </div>
            <button 
              style={styles.actionBtn}
              onClick={() => alert(`Opening connection loop request channel for profile ID: ${player.playerId}`)}
            >
              Request Verification Data Log
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// Scannable interface styling object model parameters
const styles = {
  container: { maxWidth: '1000px', margin: '40px auto', padding: '25px', fontFamily: 'Segoe UI, Roboto, sans-serif', backgroundColor: '#f9fafb', borderRadius: '16px', border: '1px solid #e5e7eb' },
  profileHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px dashed #e5e7eb', paddingBottom: '25px', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' },
  verifiedTag: { fontSize: '11px', backgroundColor: '#d1fae5', color: '#065f46', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', letterSpacing: '0.5px' },
  playerName: { fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: '8px 0 4px 0' },
  metaSubText: { margin: 0, fontSize: '14px', color: '#4b5563', fontWeight: '500' },
  radarBadge: { backgroundColor: '#111827', color: '#ffffff', padding: '15px 20px', borderRadius: '12px', textAlign: 'center' },
  radarLabel: { fontSize: '10px', color: '#9ca3af', letterSpacing: '1px', fontWeight: 'bold' },
  radarScore: { fontSize: '28px', fontWeight: 'bold', color: '#10b981', marginTop: '2px' },
  matrixGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' },
  metricCard: { backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' },
  cardHeading: { margin: '0 0 15px 0', fontSize: '15px', fontWeight: 'bold', color: '#1f2937', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' },
  statRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#4b5563', padding: '6px 0', borderBottom: '1px inset #f9fafb' },
  highlightText: { color: '#ef4444', fontSize: '14px' },
  progressSection: { marginBottom: '12px' },
  progressLabelRow: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#4b5563', marginBottom: '4px', fontWeight: '500' },
  progressBarBg: { width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: '4px' },
  actionBtn: { backgroundColor: '#ffffff', color: '#1e3a8a', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', transition: '0.2s', alignSelf: 'center' },
  loading: { textAlign: 'center', marginTop: '120px', color: '#6b7280', fontSize: '14px', fontFamily: 'sans-serif' }
};
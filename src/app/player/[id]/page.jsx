'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { mockPlayerMetrics } from '../../../data/playerMetrics';
import { classifyAthleteProfile } from '../../../data/sportsClassifier'; // Import our new biometric engine logic

export default function PlayerScoutingPassport() {
  const params = useParams();
  const [player, setPlayer] = useState(null);
  const [allocation, setAllocation] = useState(null);

  useEffect(() => {
    const activeId = params?.id;
    const selectedPlayer = mockPlayerMetrics[activeId] || mockPlayerMetrics["PLAYER-ZW-2026-9904"];
    
    if (selectedPlayer) {
      setPlayer(selectedPlayer);
      
      // Pass the player's raw physical baselines into the Biomechanical Classifier Engine
      const evaluation = classifyAthleteProfile({
        verticalTakeoffVelocity: selectedPlayer.athleticBaselines.verticalJump_cm > 55 ? 4.3 : 3.4,
        decelerationFrames: selectedPlayer.athleticBaselines.agility_illinois_secs < 15 ? 11 : 16,
        tSpineRotationDeg: selectedPlayer.tacticalCognition.spaceAwareness > 80 ? 52 : 38,
        limbSymmetryIndex: selectedPlayer.scoutingVectors.scoutConsistencyIndex
      });
      setAllocation(evaluation);
    }
  }, [params]);

  if (!player || !allocation) {
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

      {/* BIOMECHANICAL PHENOTYPE ENGINE MATCH (SMARTPHONE DISCOVERY HUD) */}
      <div style={styles.phenotypeBanner}>
        <div style={{ flex: 1 }}>
          <span style={styles.engineBadge}>📱 PHONE CAMERA BIOMETRIC ANALYSIS RESULT</span>
          <h2 style={styles.allocationTitle}>Optimal Role: {allocation.recommendedPosition}</h2>
          <p style={styles.allocationDesc}>
            Target Discipline: <strong>{allocation.recommendedSport}</strong> • Dominant Trait: <em>{allocation.primaryAttribute}</em>
          </p>
        </div>
        <div style={styles.confidenceZone}>
          <div style={styles.confidenceLabel}>PLACEMENT CONFIDENCE</div>
          <div style={styles.confidenceScore}>{allocation.scoutingConfidence}%</div>
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

      </div>
    </div>
  );
}

// Scannable layout styles matrix
const styles = {
  container: { maxWidth: '1000px', margin: '40px auto', padding: '25px', fontFamily: 'Segoe UI, Roboto, sans-serif', backgroundColor: '#f9fafb', borderRadius: '16px', border: '1px solid #e5e7eb' },
  profileHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '25px', marginBottom: '20px', flexWrap: 'wrap', gap: '20px' },
  verifiedTag: { fontSize: '11px', backgroundColor: '#d1fae5', color: '#065f46', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', letterSpacing: '0.5px' },
  playerName: { fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: '8px 0 4px 0' },
  metaSubText: { margin: 0, fontSize: '14px', color: '#4b5563', fontWeight: '500' },
  radarBadge: { backgroundColor: '#111827', color: '#ffffff', padding: '15px 20px', borderRadius: '12px', textAlign: 'center' },
  radarLabel: { fontSize: '10px', color: '#9ca3af', letterSpacing: '1px', fontWeight: 'bold' },
  radarScore: { fontSize: '28px', fontWeight: 'bold', color: '#10b981', marginTop: '2px' },
  phenotypeBanner: { display: 'flex', backgroundColor: '#1e3a8a', color: '#ffffff', padding: '20px', borderRadius: '12px', marginBottom: '30px', alignItems: 'center', gap: '20px', flexWrap: 'wrap', borderLeft: '6px solid #3b82f6' },
  engineBadge: { fontSize: '10px', backgroundColor: '#3b82f6', color: '#ffffff', padding: '3px 6px', borderRadius: '4px', fontWeight: 'bold' },
  allocationTitle: { margin: '6px 0', fontSize: '20px', fontWeight: 'bold' },
  allocationDesc: { margin: 0, fontSize: '13px', color: '#bfdbfe' },
  confidenceZone: { backgroundColor: 'rgba(255,255,255,0.1)', padding: '12px 18px', borderRadius: '8px', textAlign: 'center' },
  confidenceLabel: { fontSize: '9px', color: '#bfdbfe', fontWeight: 'bold', letterSpacing: '0.5px' },
  confidenceScore: { fontSize: '22px', fontWeight: 'bold', color: '#10b981', marginTop: '2px' },
  matrixGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' },
  metricCard: { backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.01)' },
  cardHeading: { margin: '0 0 15px 0', fontSize: '15px', fontWeight: 'bold', color: '#1f2937', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' },
  statRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#4b5563', padding: '6px 0' },
  highlightText: { color: '#ef4444', fontSize: '14px' },
  progressSection: { marginBottom: '12px' },
  progressLabelRow: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#4b5563', marginBottom: '4px', fontWeight: '500' },
  progressBarBg: { width: '100%', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: '4px' },
  loading: { textAlign: 'center', marginTop: '120px', color: '#6b7280', fontSize: '14px', fontFamily: 'sans-serif' }
};
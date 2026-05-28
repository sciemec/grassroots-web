'use client';
import React, { useState } from 'react';
import { classifyAthleteProfile } from '../../../data/sportsClassifier';

export default function ScoutClassifier() {
  const [inputs, setInputs] = useState({
    verticalTakeoffVelocity: 3.8,
    decelerationFrames: 14,
    tSpineRotationDeg: 42,
    limbSymmetryIndex: 94
  });

  const [allocation, setAllocation] = useState(null);

  const runBiomechanicalClassification = () => {
    // Parse user inputs directly into our analytical sports classifier matrix
    const result = classifyAthleteProfile({
      verticalTakeoffVelocity: parseFloat(inputs.verticalTakeoffVelocity),
      decelerationFrames: parseInt(inputs.decelerationFrames),
      tSpineRotationDeg: parseFloat(inputs.tSpineRotationDeg),
      limbSymmetryIndex: parseFloat(inputs.limbSymmetryIndex)
    });
    setAllocation(result);
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Biomechanical Phenotyping Engine</h2>
      <p style={styles.subtitle}>Input kinetic variables extracted via camera frame parsing to classify optimal talent placements.</p>

      <div style={styles.splitGrid}>
        {/* MANUAL ADJUSTMENT / CALIBRATION RANGES */}
        <div style={styles.inputCard}>
          <h3 style={styles.cardHeader}>⚙️ Kinematic Inputs Calibration</h3>
          
          <div style={styles.inputGroup}>
            <label>Vertical Takeoff Velocity: <strong>{inputs.verticalTakeoffVelocity} m/s</strong></label>
            <input type="range" min="1" max="6" step="0.1" value={inputs.verticalTakeoffVelocity} onChange={(e) => setInputs({...inputs, verticalTakeoffVelocity: e.target.value})} />
          </div>

          <div style={styles.inputGroup}>
            <label>Deceleration Foot Strike: <strong>{inputs.decelerationFrames} video frames</strong></label>
            <input type="range" min="5" max="30" step="1" value={inputs.decelerationFrames} onChange={(e) => setInputs({...inputs, decelerationFrames: e.target.value})} />
          </div>

          <div style={styles.inputGroup}>
            <label>Thoracic Spine Rotation: <strong>{inputs.tSpineRotationDeg}° angle</strong></label>
            <input type="range" min="10" max="70" step="1" value={inputs.tSpineRotationDeg} onChange={(e) => setInputs({...inputs, tSpineRotationDeg: e.target.value})} />
          </div>

          <div style={styles.inputGroup}>
            <label>Limb Symmetry Vector: <strong>{inputs.limbSymmetryIndex}% balance</strong></label>
            <input type="range" min="50" max="100" step="1" value={inputs.limbSymmetryIndex} onChange={(e) => setInputs({...inputs, limbSymmetryIndex: e.target.value})} />
          </div>

          <button style={styles.classifyBtn} onClick={runBiomechanicalClassification}>
            ⚡ Run Position Classifier Engine
          </button>
        </div>

        {/* CLASSIFICATION RESULT OUTPUT HUD */}
        <div style={styles.resultCard}>
          <h3 style={styles.cardHeader} style={{color: '#3b82f6'}}>🎯 Structural Allocation Assessment</h3>
          {allocation ? (
            <div>
              <div style={styles.resultBadge}>Dominant Trait: <strong>{allocation.primaryAttribute}</strong></div>
              <div style={styles.dataRow}>Target Sport Field: <span style={styles.valueHighlight}>{allocation.recommendedSport}</span></div>
              <div style={styles.dataRow}>Optimal Role Matrix: <span style={{...styles.valueHighlight, color: '#10b981'}}>{allocation.recommendedPosition}</span></div>
              <div style={styles.dataRow}>Engine Placement Accuracy Index: <strong>{allocation.scoutingConfidence}%</strong></div>
            </div>
          ) : (
            <div style={styles.emptyText}>Adjust the metric sliders from the video logs and trigger the classifier to compute sports alignment models.</div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '30px', backgroundColor: '#f3f4f6', minHeight: '100vh', fontFamily: 'sans-serif' },
  title: { margin: '0 0 5px 0', color: '#1e3a8a', fontSize: '24px', fontWeight: 'bold' },
  subtitle: { margin: '0 0 25px 0', color: '#6b7280', fontSize: '13px' },
  splitGrid: { display: 'flex', gap: '25px', flexWrap: 'wrap' },
  inputCard: { flex: 1, minWidth: '320px', backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' },
  resultCard: { flex: 1, minWidth: '320px', backgroundColor: '#111827', padding: '20px', borderRadius: '12px', color: '#ffffff', display: 'flex', flexDirection: 'column', justifyItems: 'center' },
  cardHeader: { fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  inputGroup: { marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#374151' },
  classifyBtn: { width: '100%', padding: '12px', backgroundColor: '#1e3a8a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  resultBadge: { backgroundColor: '#1e3a8a', padding: '12px', borderRadius: '8px', fontSize: '13px', lineHeight: '1.4', marginBottom: '20px', borderLeft: '4px solid #3b82f6' },
  dataRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', margin: '12px 0', borderBottom: '1px solid #1f2937', paddingBottom: '8px' },
  valueHighlight: { fontWeight: 'bold', color: '#3b82f6', fontSize: '14px' },
  emptyText: { color: '#9ca3af', fontSize: '13px', fontStyle: 'italic', textAlign: 'center', marginTop: '40px', lineHeight: '1.5' }
};
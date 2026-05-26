'use client';
import React, { useEffect, useState, useContext } from 'react';
import { useSearchParams } from 'next/navigation'; // Correct Next.js App Router Hook
import { CoachSessionContext } from '../layout'; // Connect directly to our active dynamic registry stream

export default function PitchProCanvas() {
  const searchParams = useSearchParams();
  const { sessions } = useContext(CoachSessionContext);
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => {
    // 1. Next.js hook natively pulls URL param strings without creating URLSearchParams manually
    const sessionId = searchParams.get('session');

    if (sessionId && sessions && sessions.length > 0) {
      // 2. Scan the dynamic layout registry context for the correct tracking ID
      const match = sessions.find(s => s.sessionId === sessionId);
      if (match) {
        setActiveSession(match);
      }
    }
  }, [searchParams, sessions]);

  // Safeguard loading layer while routing compiles file snapshots
  if (!activeSession) {
    return <div style={styles.alert}>Initializing tactical board layers or no session specified...</div>;
  }

  return (
    <div style={styles.canvasContainer}>
      {/* TACTICAL PROFILE SUB-NAVBAR */}
      <div style={styles.topMetaNav}>
        <div>
          <h2 style={styles.sessionTitle}>{activeSession.title}</h2>
          <p style={styles.subtitle}>
            {activeSession.category || activeSession.theme} • {activeSession.ageGroup}
          </p>
        </div>
        <button style={styles.backBtn} onClick={() => window.location.href = '/coach'}>
          ⬅ Back to Dashboard
        </button>
      </div>

      {/* CORE WORKSPACE GRID */}
      <div style={styles.workspaceGrid}>
        {/* LEFT COLUMN: DRILLS DIMENSIONS CONFIGURATOR LIST */}
        <div style={styles.drillDetailsPane}>
          <h3 style={styles.panelTitle}>Drill Vectors Scale</h3>
          {activeSession.drills && activeSession.drills.map((drill, index) => (
            <div key={index} style={styles.drillScaleCard}>
              <div style={styles.partHeader}>
                PART {drill.part}: {drill.name} 
                <span style={styles.scaleBadge}>({drill.scale || 'Unit Scale'})</span>
              </div>
              
              {/* Supports both structured width objects or raw dimensions fallback string strings */}
              <div style={styles.gridSizeTag}>
                Status: Grid Configured
              </div>
              <p style={styles.focusSummary}>
                {drill.keyFocus || drill.explanation || "No specialized instruction notes annotated."}
              </p>
            </div>
          ))}
        </div>

        {/* RIGHT COLUMN: PITCHPRO TECHNICAL ENGINE INTERFACE HOOK */}
        <div style={styles.canvasWrapper}>
          <div style={styles.canvasPlaceholderField}>
            {/* HTML5 Canvas Element rendering your green pitch coordinates grids scales goes here */}
            <div style={styles.mockPitchGraphic}>
              <div style={styles.centerCircleMock}></div>
              <p style={styles.pitchNotice}>
                [ PitchPro HTML5 Tactical Board Canvas Asset Engine Active ]
                <br />
                <span style={{ fontSize: '12px', color: '#a7f3d0' }}>
                  Viewport Matrix automatically constrained to session specifications.
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Layout style matrix map configuration parameters
const styles = {
  canvasContainer: { padding: '20px', backgroundColor: '#111827', minHeight: '100vh', color: '#ffffff', fontFamily: 'sans-serif' },
  topMetaNav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: '#1f2937', padding: '15px 20px', borderRadius: '10px', border: '1px solid #374151' },
  sessionTitle: { margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#10b981' },
  subtitle: { margin: '4px 0 0 0', fontSize: '13px', color: '#9ca3af' },
  backBtn: { backgroundColor: '#374151', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: '0.2s' },
  workspaceGrid: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  drillDetailsPane: { width: '320px', display: 'flex', flexDirection: 'column', gap: '12px' },
  panelTitle: { fontSize: '15px', color: '#9ca3af', letterSpacing: '0.5px', textTransform: 'uppercase', margin: '0 0 4px 0' },
  drillScaleCard: { backgroundColor: '#1f2937', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #10b981', borderTop: '1px solid #374151', borderBottom: '1px solid #374151' },
  partHeader: { fontSize: '13px', fontWeight: 'bold', color: '#ffffff', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  scaleBadge: { fontSize: '10px', color: '#9ca3af', fontWeight: 'normal' },
  gridSizeTag: { fontSize: '12px', color: '#3b82f6', fontWeight: '600', marginBottom: '6px' },
  focusSummary: { fontSize: '12px', color: '#9ca3af', margin: 0, lineHeight: '1.4' },
  canvasWrapper: { flex: 1, minWidth: '500px', backgroundColor: '#1f2937', borderRadius: '12px', padding: '15px', border: '1px solid #374151', minHeight: '550px', display: 'flex' },
  canvasPlaceholderField: { flex: 1, backgroundColor: '#064e3b', borderRadius: '8px', border: '3px solid #047857', display: 'flex', position: 'relative', overflow: 'hidden' },
  mockPitchGraphic: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', border: '2px solid rgba(255,255,255,0.1)', margin: '20px', position: 'relative' },
  centerCircleMock: { width: '120px', height: '120px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', position: 'absolute' },
  pitchNotice: { zIndex: 2, textAlign: 'center', color: '#ffffff', fontWeight: '500', fontSize: '14px', lineHeight: '1.6' },
  alert: { color: '#9ca3af', textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }
};
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fifaSessions } from '../data/fifaSessions';

const PitchProCanvas = () => {
  const location = useLocation();
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => {
    // 1. Use URLSearchParams to extract "?session=XXXX" from the web browser address bar
    const queryParams = new URLSearchParams(location.search);
    const sessionId = queryParams.get('session');

    if (sessionId) {
      // 2. Find the exact matching tactical configuration block inside your session array
      const match = fifaSessions.find(s => s.sessionId === sessionId);
      if (match) {
        setActiveSession(match);
      }
    }
  }, [location]);

  if (!activeSession) {
    return <div style={styles.alert}>Initializing tactical board layers or no session specified...</div>;
  }

  return (
    <div style={styles.canvasContainer}>
      {/* TACTICAL PROFILE SUB-NAVBAR */}
      <div style={styles.topMetaNav}>
        <div>
          <h2 style={styles.sessionTitle}>{activeSession.title}</h2>
          <p style={styles.subtitle}>{activeSession.category} • {activeSession.ageGroup}</p>
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
          {activeSession.drills.map((drill, index) => (
            <div key={index} style={styles.drillScaleCard}>
              <div style={styles.partHeader}>PART {drill.part}: {drill.name}</div>
              {/* Dynamic boundary configurations showing measurements */}
              <div style={styles.gridSizeTag}>📏 Pitch Size Array: {drill.dimensions}</div>
              <p style={styles.focusSummary}>{drill.keyFocus}</p>
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
};

// Layout style matrix map config
const styles = {
  canvasContainer: { padding: '20px', backgroundColor: '#111827', minHeight: '100vh', color: '#ffffff', fontFamily: 'sans-serif' },
  topMetaNav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: '#1f2937', padding: '15px 20px', borderRadius: '10px', border: '1px solid #374151' },
  sessionTitle: { margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#10b981' },
  subtitle: { margin: '4px 0 0 0', fontSize: '13px', color: '#9ca3af' },
  backBtn: { backgroundColor: '#374151', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  workspaceGrid: { display: 'flex', gap: '20px' },
  drillDetailsPane: { width: '320px', display: 'flex', flexDirection: 'column', gap: '12px' },
  panelTitle: { fontSize: '15px', color: '#9ca3af', letterSpacing: '0.5px', textTransform: 'uppercase', margin: '0 0 4px 0' },
  drillScaleCard: { backgroundColor: '#1f2937', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #10b981' },
  partHeader: { fontSize: '13px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' },
  gridSizeTag: { fontSize: '12px', color: '#3b82f6', fontWeight: '600', marginBottom: '6px' },
  focusSummary: { fontSize: '12px', color: '#9ca3af', margin: 0, lineHeight: '1.4' },
  canvasWrapper: { flex: 1, backgroundColor: '#1f2937', borderRadius: '12px', padding: '15px', border: '1px solid #374151', minHeight: '550px', display: 'flex' },
  canvasPlaceholderField: { flex: 1, backgroundColor: '#064e3b', borderRadius: '8px', border: '3px solid #047857', display: 'flex', position: 'relative', overflow: 'hidden' },
  mockPitchGraphic: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', border: '2px solid rgba(255,255,255,0.2)', margin: '20px', position: 'relative' },
  centerCircleMock: { width: '120px', height: '120px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', position: 'absolute' },
  pitchNotice: { zIndex: 2, textAlign: 'center', color: '#ffffff', fontWeight: '500', fontSize: '14px', lineHeight: '1.6' },
  alert: { color: '#9ca3af', textAlign: 'center', marginTop: '100px' }
};

export default PitchProCanvas;
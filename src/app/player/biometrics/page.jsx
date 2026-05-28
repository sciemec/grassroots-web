'use client';
import React from 'react';
import dynamic from 'next/dynamic';

// 🚀 FIX 1 & 2 combined: 
// 1. We use the absolute '@/' path alias so Webpack doesn't look in the wrong directory levels.
// 2. We use next/dynamic with ssr: false so it safely renders exclusively in the user's browser.
const BiometricEngine = dynamic(
  () => import('@/components/BiometricEngine'),
  { 
    ssr: false,
    loading: () => (
      <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '600', textAlign: 'center', padding: '40px' }}>
        Initializing MediaPipe Telemetry Camera Engine...
      </div>
    )
  }
);

export default function PlayerBiometricMentor() {
  return (
    <div style={styles.container}>
      {/* HEADER BANNER SECTION */}
      <div style={styles.headerBanner}>
        <div style={styles.headerTextContainer}>
          <span style={styles.liveBadge}>● LIVE BIOMETRIC FEED</span>
          <h1 style={styles.mainTitle}>Player Athletic Performance Portal</h1>
          <p style={styles.subTitle}>
            Real-time mechanical kinematic rendering, skeletal joint tracking, and talent profiling metrics.
          </p>
        </div>
        <div style={styles.statusBox}>
          <div style={styles.statusLabel}>DEVICE ENGINE STATUS</div>
          <div style={styles.statusValue}>⚡ WebCAM-Vision Ready</div>
        </div>
      </div>

      {/* CORE FRAMEWORK WORKSPACE */}
      <div style={styles.workspaceGrid}>
        {/* LEFT COLUMN: THE COMPUTER VISION CAMERA CORE */}
        <div style={styles.cameraCard}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardHeaderTitle}>📹 Telemetry Scanner Feed</h2>
            <span style={styles.pulseDot}></span>
          </div>
          <div style={styles.engineWrapper}>
            {/* Renders beautifully exclusively in the browser */}
            <BiometricEngine />
          </div>
        </div>

        {/* RIGHT COLUMN: STRUCTURAL COACHING METRIC DETAILS */}
        <div style={styles.detailsCard}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardHeaderTitle}>📋 Diagnostic Guidelines</h2>
          </div>
          <div style={styles.cardBody}>
            <div style={styles.guidelineBlock}>
              <div style={styles.guidelineNum}>1</div>
              <div style={styles.guidelineText}>
                <strong>Optimal Positioning:</strong> Step back roughly 2–3 meters from the lens until your entire skeletal silhouette is captured from head to toe within the viewfinder.
              </div>
            </div>

            <div style={styles.guidelineBlock}>
              <div style={styles.guidelineNum}>2</div>
              <div style={styles.guidelineText}>
                <strong>High Knee Drive Test:</strong> Drive your knees dynamically above hips. The engine automatically logs angle velocity and stride ground contact displacement metrics.
              </div>
            </div>

            <div style={styles.guidelineBlock}>
              <div style={styles.guidelineNum}>3</div>
              <div style={styles.guidelineText}>
                <strong>Juggling Rhythm Scale:</strong> Maintain control within the tracking frame to map your core stabilizer balancing distribution parameters.
              </div>
            </div>

            <div style={styles.metricNoticeBox}>
              <span style={styles.noticeIcon}>💡</span>
              <p style={styles.noticeMessage}>
                All capture sequences sync with local Dexie offline index storage registries before parsing reports to the live database cloud.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Seamless layout dashboard inline styles configuration
const styles = {
  container: { padding: '40px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', boxSizing: 'border-box' },
  headerBanner: { backgroundColor: '#0f172a', borderRadius: '16px', padding: '32px', color: '#ffffff', display: 'flex', justifyContext: 'space-between', alignItems: 'center', marginBottom: '32px', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)', flexWrap: 'wrap', gap: '20px' },
  headerTextContainer: { flex: 1 },
  liveBadge: { backgroundColor: '#ef4444', color: '#ffffff', fontSize: '11px', fontWeight: '800', padding: '4px 8px', borderRadius: '6px', letterSpacing: '0.5px', display: 'inline-block', marginBottom: '12px' },
  mainTitle: { fontSize: '26px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
  subTitle: { fontSize: '14px', color: '#94a3b8', margin: '0', lineHeight: '1.5', maxWidth: '650px' },
  statusBox: { backgroundColor: '#1e293b', padding: '16px 20px', borderRadius: '12px', border: '1px solid #334155', textAlign: 'right' },
  statusLabel: { fontSize: '10px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px', marginBottom: '4px' },
  statusValue: { fontSize: '14px', fontWeight: '700', color: '#10b981' },
  workspaceGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'start', flexWrap: 'wrap' },
  cameraCard: { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', overflow: 'hidden' },
  cardHeader: { padding: '20px 24px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardHeaderTitle: { fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0' },
  pulseDot: { width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '50%', boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.2)' },
  engineWrapper: { padding: '24px', backgroundColor: '#000000', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '480px' },
  detailsCard: { backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
  cardBody: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' },
  guidelineBlock: { display: 'flex', gap: '16px', alignItems: 'flex-start' },
  guidelineNum: { backgroundColor: '#ef4444', color: '#ffffff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 },
  guidelineText: { fontSize: '13px', color: '#475569', lineHeight: '1.6', margin: '0' },
  metricNoticeBox: { marginTop: '12px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' },
  noticeIcon: { fontSize: '16px' },
  noticeMessage: { fontSize: '12px', color: '#1e40af', margin: '0', lineHeight: '1.5', fontWeight: '500' }
};
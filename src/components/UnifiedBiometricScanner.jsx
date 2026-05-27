'use client';
import React, { useRef, useEffect, useState } from 'react';
import { processBiometricFrame } from '../utils/biomechanicsEngine';

export default function UnifiedBiometricScanner({ onCaptureMetric }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [activeMode, setActiveMode] = useState('SPRINT_KNEE_DRIVE');
  const [streamActive, setStreamActive] = useState(false);
  const [liveTelemetry, setLiveTelemetry] = useState({ rating: 'Ready', score: 0, color: '#94a3b8' });

  useEffect(() => {
    // Import MediaPipe dynamically to keep server-side rendering loops clean
    let poseInstance = null;
    let localStream = null;

    async function initializeScanner() {
      const { Pose } = await import('@mediapipe/pose');
      
      poseInstance = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      poseInstance.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6
      });

      poseInstance.onResults((results) => {
        if (!results.poseLandmarks || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        // Run your custom metrics processing calculation logic
        const telemetry = processBiometricFrame(results.poseLandmarks, activeMode);
        setLiveTelemetry(telemetry);

        // Draw basic visual tracking lines over critical skeletal joints
        if (results.poseLandmarks[24] && results.poseLandmarks[26]) {
          ctx.beginPath();
          ctx.moveTo(results.poseLandmarks[24].x * canvas.width, results.poseLandmarks[24].y * canvas.height);
          ctx.lineTo(results.poseLandmarks[26].x * canvas.width, results.poseLandmarks[26].y * canvas.height);
          ctx.strokeStyle = telemetry.color || '#3b82f6';
          ctx.lineWidth = 6;
          ctx.stroke();
        }
      });

      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: 640, height: 480 }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
          videoRef.current.play();
          setStreamActive(true);
        }
      } catch (err) {
        console.error("Camera access failed:", err);
      }
    }

    initializeScanner();

    // Frame loops processing update cycles
    let frameLoopActive = true;
    const triggerFrameProcessing = async () => {
      if (videoRef.current && videoRef.current.readyState >= 2 && poseInstance && frameLoopActive) {
        await poseInstance.send({ image: videoRef.current });
      }
      requestAnimationFrame(triggerFrameProcessing);
    };
    
    setTimeout(triggerFrameProcessing, 1500);

    return () => {
      frameLoopActive = false;
      if (localStream) localStream.getTracks().forEach(track => track.stop());
    };
  }, [activeMode]);

  return (
    <div style={styles.container}>
      {/* MODE SELECTOR TOGGLE HUD BAR */}
      <div style={styles.toggleBar}>
        <button style={activeMode === 'SPRINT_KNEE_DRIVE' ? styles.activeTab : styles.tab} onClick={() => setActiveMode('SPRINT_KNEE_DRIVE')}>
          🏃‍♂️ Knee Drive Sprint Test
        </button>
        <button style={activeMode === 'JUGGLING_CUSHION' ? styles.activeTab : styles.tab} onClick={() => setActiveMode('JUGGLING_CUSHION')}>
          ⚽ Juggling Rhythm Evaluation
        </button>
      </div>

      <div style={styles.previewContainer}>
        <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
        <canvas ref={canvasRef} style={styles.canvasView} width="640" height="480" />
        
        {/* TELEMETRY HEADING CARD MATRICES */}
        <div style={{ ...styles.hudMetricsOverlay, borderLeftColor: liveTelemetry.color }}>
          <div style={styles.hudMetaLabel}>LIVE BIOMETRIC TELEMETRY</div>
          <div style={{ ...styles.hudRatingText, color: liveTelemetry.color }}>{liveTelemetry.rating}</div>
          {liveTelemetry.score !== undefined && (
            <div style={styles.hudScore}>Value: <strong>{liveTelemetry.score}°</strong></div>
          )}
        </div>
      </div>

      <button style={styles.commitBtn} onClick={() => onCaptureMetric && onCaptureMetric(liveTelemetry)}>
        💾 Capture and Append to Player Profile
      </button>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: 'sans-serif' },
  toggleBar: { display: 'flex', gap: '10px', backgroundColor: '#1e293b', padding: '8px', borderRadius: '10px' },
  tab: { flex: 1, padding: '10px', border: 'none', background: 'transparent', color: '#94a3b8', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  activeTab: { flex: 1, padding: '10px', border: 'none', backgroundColor: '#3b82f6', color: '#ffffff', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)' },
  previewContainer: { position: 'relative', width: '100%', maxWidth: '640px', margin: '0 auto', overflow: 'hidden', borderRadius: '14px', border: '3px solid #0f172a', backgroundColor: '#000' },
  canvasView: { width: '100%', height: 'auto', display: 'block' },
  hudMetricsOverlay: { position: 'absolute', top: '16px', left: '16px', backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: '14px 18px', borderRadius: '10px', borderLeft: '5px solid #3b82f6', minWidth: '220px' },
  hudMetaLabel: { fontSize: '10px', color: '#64748b', letterSpacing: '0.5px', fontWeight: 'bold' },
  hudRatingText: { fontSize: '16px', fontWeight: 'bold', margin: '4px 0' },
  hudScore: { fontSize: '13px', color: '#cbd5e1' },
  commitBtn: { padding: '14px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', alignSelf: 'center', minWidth: '300px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }
};
'use client';
import React, { useRef, useEffect, useState } from 'react';
import { Pose } from '@mediapipe/pose';

export default function BiometricEngine({ mode = 'coach', onAnalysisComplete }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [techMetrics, setTechMetrics] = useState({
    bodyLean: 0,
    supportBaseWidth: 0,
    controlStability: 100,
    technicalRating: 'Evaluating...'
  });

  useEffect(() => {
    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });

    pose.onResults((results) => {
      if (!results.poseLandmarks || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      // Extract critical mechanics joints
      const leftShoulder = results.poseLandmarks[11];
      const rightShoulder = results.poseLandmarks[12];
      const leftHip = results.poseLandmarks[23];
      const rightHip = results.poseLandmarks[24];
      const leftAnkle = results.poseLandmarks[27];
      const rightAnkle = results.poseLandmarks[28];

      if (leftShoulder && leftHip && leftAnkle && rightAnkle) {
        // 1. Calculate Shooting Angle / Body Lean Vector
        const trunkLeanAngle = Math.abs(
          (Math.atan2(leftHip.y - leftShoulder.y, leftHip.x - leftShoulder.x) * 180) / Math.PI
        );
        const displayLean = Math.round(trunkLeanAngle);

        // 2. Calculate Foot Placement / Support Base Width
        const baseWidth = Math.abs(leftAnkle.x - rightAnkle.x) * 100; // Relative pixel distance scale
        const displayBase = Math.round(baseWidth);

        // 3. Estimate Ball Control Stability via Hip-to-Ankle Proximity Drift
        const centerOfGravityX = (leftHip.x + rightHip.x) / 2;
        const driftDistance = Math.abs(leftAnkle.x - centerOfGravityX) * 100;
        const stabilityScore = Math.max(0, Math.min(100, Math.round(100 - (driftDistance * 2.5))));

        // 4. Determine Automated Technical Quality Rating
        let rating = 'Developing Form';
        if (displayLean >= 83 && displayLean <= 95 && stabilityScore > 75) {
          rating = 'Elite Tier Execution';
        } else if (stabilityScore > 60) {
          rating = 'Proficient Mechanics';
        }

        setTechMetrics({
          bodyLean: displayLean,
          supportBaseWidth: displayBase,
          controlStability: stabilityScore,
          technicalRating: rating
        });

        // Render color-coded visual feedback directly onto the video overlay
        ctx.beginPath();
        ctx.moveTo(leftShoulder.x * canvas.width, leftShoulder.y * canvas.height);
        ctx.lineTo(leftHip.x * canvas.width, leftHip.y * canvas.height);
        ctx.lineTo(leftAnkle.x * canvas.width, leftAnkle.y * canvas.height);
        // Green lines indicate strong, controlled mechanics; red highlights technical drift
        ctx.strokeStyle = stabilityScore > 70 ? '#10b981' : '#ef4444';
        ctx.lineWidth = 5;
        ctx.stroke();
      }
    });

    let active = true;
    const processVideo = () => {
      if (videoRef.current && videoRef.current.readyState >= 2 && active) {
        pose.send({ image: videoRef.current });
      }
      requestAnimationFrame(processVideo);
    };

    if (analyzing) processVideo();
    return () => { active = false; };
  }, [analyzing]);

  return (
    <div style={styles.container}>
      <div style={styles.hudContainer}>
        <video ref={videoRef} style={{ display: 'none' }} playsInline muted loop />
        <canvas ref={canvasRef} style={styles.canvasView} width="640" height="480" />
        
        {/* HUD TECHNICAL INSIGHTS PANEL OVERLAY */}
        <div style={styles.dataCard}>
          <div style={styles.cardHeader}>📊 CORE PERFORMANCE RATINGS</div>
          <div style={styles.metricItem}>🎯 Mechanics Class: <span style={{color: '#10b981', fontWeight: 'bold'}}>{techMetrics.technicalRating}</span></div>
          <div style={styles.metricItem}>📐 Shooting Lean Angle: <strong>{techMetrics.bodyLean}°</strong></div>
          <div style={styles.metricItem}>🦶 Support Foot Placement: <strong>{techMetrics.supportBaseWidth}cm scale</strong></div>
          <div style={styles.metricItem}>⚽ Control Radius Stability: <strong>{techMetrics.controlStability}%</strong></div>
        </div>
      </div>

      <div style={styles.controlRow}>
        <input 
          type="file" 
          accept="video/*" 
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              videoRef.current.src = URL.createObjectURL(file);
              videoRef.current.play();
              setAnalyzing(true);
            }
          }} 
          style={styles.fileInput}
        />
        {mode === 'coach' && (
          <button 
            style={styles.commitBtn}
            onClick={() => onAnalysisComplete && onAnalysisComplete(techMetrics)}
          >
            💾 Append Tech Scores to Player Card
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#111827', padding: '20px', borderRadius: '12px', color: '#fff', fontFamily: 'sans-serif' },
  hudContainer: { position: 'relative', width: '100%', maxWidth: '640px', margin: '0 auto', overflow: 'hidden', borderRadius: '8px', border: '2px solid #374151' },
  canvasView: { width: '100%', height: 'auto', display: 'block', backgroundColor: '#000' },
  dataCard: { position: 'absolute', top: '15px', right: '15px', backgroundColor: 'rgba(17, 24, 39, 0.9)', padding: '15px', borderRadius: '8px', border: '1px solid #3b82f6', minWidth: '260px' },
  cardHeader: { fontSize: '11px', color: '#3b82f6', fontWeight: 'bold', marginBottom: '10px', letterSpacing: '0.5px' },
  metricItem: { fontSize: '13px', margin: '6px 0', display: 'flex', justifyContent: 'space-between' },
  controlRow: { marginTop: '15px', display: 'flex', gap: '15px', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center' },
  fileInput: { fontSize: '13px', color: '#9ca3af' },
  commitBtn: { backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)' }
};
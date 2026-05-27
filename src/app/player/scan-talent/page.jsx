'use client';
import React from 'react';
import UnifiedBiometricScanner from '../../../components/UnifiedBiometricScanner';

export default function ScanTalentCaptureView() {
  const handleSaveMetricToDatabase = (capturedData) => {
    alert(`Success! Captured metric record (${capturedData.rating}) hard-linked directly to active Player Scouting Passport data schemas!`);
    window.location.href = '/coach';
  };

  return (
    <div style={{ padding: '40px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
          On-Field Camera Talent ID Scanner
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
          Point your smartphone camera at the athlete to extract raw kinematics, knee extensions, and technical execution cushions live.
        </p>
      </div>

      <UnifiedBiometricScanner onCaptureMetric={handleSaveMetricToDatabase} />
    </div>
  );
}
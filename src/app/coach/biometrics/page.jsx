
'use client';
import React from 'react';
import dynamic from 'next/dynamic';

// 🚀 THE FIX: Dynamically load the engine with SSR disabled for the coach route
const BiometricEngine = dynamic(
  () => import('@/components/BiometricEngine'),
  { 
    ssr: false,
    loading: () => (
      <div style={{ color: '#94a3b8', padding: '20px', fontWeight: '600' }}>
        Loading Live Coach Telemetry Canvas...
      </div>
    )
  }
);

export default function CoachBiometricsPage() {
  return (
    <div style={{ padding: '40px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '20px' }}>
        Coach Biometric Overview
      </h1>
      <div style={{ backgroundColor: '#000', padding: '24px', borderRadius: '12px' }}>
        <BiometricEngine />
      </div>
    </div>
  );
}
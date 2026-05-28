'use client';
import React from 'react';
import BiometricEngine from '../../components/BiometricEngine';

export default function PlayerBiometricMentor() {
  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', backgroundColor: '#111827', minHeight: '100vh', color: '#fff' }}>
      <h2 style={{ color: '#10b981', margin: '0 0 5px 0' }}>AI Biometric Mentor Studio</h2>
      <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '25px' }}>
        Position your camera to calibrate extension angles, track repetitions, and evaluate fatigue levels.
      </p>
      <BiometricEngine mode="player" />
    </div>
  );
}
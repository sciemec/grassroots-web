'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Activity, ShieldCheck } from 'lucide-react';

// --- Permanent Arena Premium Light Theme Colors ---
const COLORS = {
  bg: "#f4f2ee",     // Warm Off-White
  primary: "#1a5c2a", // Forest Green
  accent: "#c8962a",  // Gold
  border: "#e5e7eb"
};

export default function PlayerBiometricMentor() {
  return (
    <div style={{ backgroundColor: COLORS.bg }} className="min-h-screen text-gray-900 font-sans antialiased pb-12">
      {/* Sticky Premium Light Nav Bar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 h-16 shadow-sm">
        <div className="max-w-4xl mx-auto h-full px-4 flex items-center justify-between">
          <Link href="/player" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition">
            <ArrowLeft size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Back to Hub</span>
          </Link>
          <div style={{ color: COLORS.primary }} className="text-sm font-black uppercase tracking-wider">
            Biometric Engine
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-md mx-auto px-4 mt-12 text-center">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6">
          <div 
            style={{ backgroundColor: `${COLORS.primary}10`, color: COLORS.primary }} 
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
          >
            <Activity size={32} />
          </div>
          
          <div>
            <h1 className="text-xl font-black tracking-tight text-gray-900">Biometric Tracking Module</h1>
            <p className="text-xs text-gray-500 font-medium mt-2 leading-relaxed">
              Your physical workloads, training intensities, and fatigue metrics are actively managed here to optimize performance and prevent overtraining.
            </p>
          </div>

          {/* XGBoost Status Indicator Card */}
          <div className="bg-slate-50 border border-gray-100 rounded-xl p-4 flex items-center space-x-3 text-left">
            <ShieldCheck style={{ color: COLORS.accent }} className="shrink-0" size={20} />
            <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
              XGBoost Biometric Load Radar Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Activity, ShieldCheck } from 'lucide-react';

export default function PlayerBiometricMentor() {
  return (
    <div className="min-h-screen bg-[#f4f2ee] text-gray-900 font-sans antialiased pb-12">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 h-16 shadow-sm">
        <div className="max-w-4xl mx-auto h-full px-4 flex items-center justify-between">
          <Link href="/player" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition">
            <ArrowLeft size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Back to Hub</span>
          </Link>
          <div className="text-sm font-black uppercase tracking-wider text-[#1a5c2a]">
            Biometric Engine
          </div>
        </div>
      </nav>

      <div className="max-w-md mx-auto px-4 mt-12 text-center">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6">
          <div className="w-16 h-16 mx-auto bg-emerald-50 text-[#1a5c2a] rounded-2xl flex items-center justify-center">
            <Activity size={32} />
          </div>
          
          <div>
            <h1 className="text-xl font-black tracking-tight text-gray-900">Biometric Tracking Module</h1>
            <p className="text-xs text-gray-500 font-medium mt-2 leading-relaxed">
              Your physical workloads, stress factors, and fatigue metrics are actively synced through your athlete performance profiles.
            </p>
          </div>

          <div className="bg-slate-50 border border-gray-100 rounded-xl p-4 flex items-center space-x-3 text-left">
            <ShieldCheck className="text-[#c8962a] shrink-0" size={20} />
            <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
              XGBoost Biometric Safety Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
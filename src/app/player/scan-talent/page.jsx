"use client";

import React from "react";
import BiometricScanner from "@/components/BiometricScanner";
import { ArrowLeft, Award, Flame, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function ScanTalentPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Context Top Header Banner */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/player" 
              className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-lg font-black text-gray-900 tracking-tight">Talent Scout Panel</h1>
              <p className="text-xs text-gray-400">Identify athletic profiles natively without external runtime bloat</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Processing Scan Console Interface */}
        <div className="lg:col-span-2 space-y-6">
          <BiometricScanner 
            onScanComplete={(entry) => {
              console.log("Custom performance biometric entry broadcasted natively:", entry);
            }} 
          />
        </div>

        {/* Informational Context Blueprint Panel (INM Guidelines) */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Proprietary Engine Rules
            </h3>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Award size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Identify Drive Phases</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                    Maps explosive hip extension ranges across dynamic high-speed mechanical target windows.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <ShieldAlert size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Nurture Balance Deficits</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                    Flags bilateral asymmetry variations above 10% thresholds to prevent soft tissue strain injury risks.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <Flame size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Market Profile Verification</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                    Converts telemetry files directly into validated talent parameters ready for systemic scout export.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
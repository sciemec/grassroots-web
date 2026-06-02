"use client";

import { useEffect, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { User, Shield, Target, Heart, Loader2, Award } from "lucide-react";

function RegisterRolePickerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const role = searchParams.get("role");
    const name = searchParams.get("name");
    const pipeline = searchParams.get("pipeline");

    // ⚡ SAFE PIPELINE INTERCEPTION
    // Redirects incoming sandbox users directly to their designated wizard folder
    if (pipeline === "complete" && role) {
      router.replace(`/register/${role}?name=${encodeURIComponent(name || "")}&pipeline=complete`);
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#f4f2ee] flex items-center justify-center p-4 selection:bg-[#f0b429]/30">
      <div className="max-w-4xl w-full space-y-8 bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-sm">
        
        <div className="text-center space-y-2">
          <div className="bg-[#1c3d22] text-[#f0b429] inline-flex p-2 rounded-xl font-black text-xs uppercase tracking-wider shadow-2xs">GRS Network</div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-gray-900 uppercase">Create Your Account</h1>
          <p className="text-xs sm:text-sm font-semibold text-gray-500 max-w-md mx-auto">
            Select your primary classification below to initialize your customized grassroots development profile.
          </p>
        </div>

        {/* 🎛️ STANDARD CONFIRMED ROLE PICKER GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          
          {/* PLAYER ACCESS CARD */}
          <Link href="/register/player" className="border border-gray-200 hover:border-[#1c3d22] bg-gray-50/50 hover:bg-white rounded-2xl p-5 text-center transition-all group space-y-3 flex flex-col justify-between h-48 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto transition-transform group-hover:scale-105"><Target size={18} /></div>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Athlete</h3>
              <p className="text-[11px] text-gray-500 font-semibold mt-1 leading-snug">Track performance, build your biometric passport, and get discovered.</p>
            </div>
            <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Join Profile →</span>
          </Link>

          {/* COACH ACCESS CARD */}
          <Link href="/register/coach" className="border border-gray-200 hover:border-[#1c3d22] bg-gray-50/50 hover:bg-white rounded-2xl p-5 text-center transition-all group space-y-3 flex flex-col justify-between h-48 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto transition-transform group-hover:scale-105"><Shield size={18} /></div>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Coach Focus</h3>
              <p className="text-[11px] text-gray-500 font-semibold mt-1 leading-snug">Manage squads, coordinate tactics, and get dynamic team analytics.</p>
            </div>
            <span className="text-[10px] font-black uppercase text-blue-700 tracking-wider">Join Profile →</span>
          </Link>

          {/* SCOUT ACCESS CARD */}
          <Link href="/register/scout" className="border border-gray-200 hover:border-[#1c3d22] bg-gray-50/50 hover:bg-white rounded-2xl p-5 text-center transition-all group space-y-3 flex flex-col justify-between h-48 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mx-auto transition-transform group-hover:scale-105"><Award size={18} /></div>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Talent Scout</h3>
              <p className="text-[11px] text-gray-500 font-semibold mt-1 leading-snug">Unlock advanced search metrics and compile secure PDF reports.</p>
            </div>
            <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider">Join Profile →</span>
          </Link>

          {/* FAN ACCESS CARD */}
          <Link href="/register/fan" className="border border-gray-200 hover:border-[#1c3d22] bg-gray-50/50 hover:bg-white rounded-2xl p-5 text-center transition-all group space-y-3 flex flex-col justify-between h-48 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto transition-transform group-hover:scale-105"><Heart size={18} /></div>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Supporter</h3>
              <p className="text-[11px] text-gray-500 font-semibold mt-1 leading-snug">Discover rising local talent across provinces and follow fixtures.</p>
            </div>
            <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Join Profile →</span>
          </Link>

        </div>

        <div className="border-t border-gray-100 pt-5 text-center">
          <p className="text-xs text-gray-500 font-semibold">
            Already have an active account?{" "}
            <Link href="/login" className="text-[#1c3d22] hover:text-[#244c2b] font-black underline tracking-wide">
              Sign In Here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

export default function RegisterRolePicker() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f4f2ee] flex flex-col items-center justify-center gap-2">
        <Loader2 className="animate-spin text-[#1c3d22]" size={28} />
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Verifying Pipeline Trajectory...</p>
      </div>
    }>
      <RegisterRolePickerContent />
    </Suspense>
  );
}
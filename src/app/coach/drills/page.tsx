"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Flame, Target, Users, Loader2, Play } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { getRoleConfig } from "@/config/coaching-staff";

// 🛡️ ROLE-TO-DRILL MAPPING
const COACH_ROLE_DRILLS: Record<string, any[]> = {
  defence_coach: [
    { name: "Shifting Shuttles & Block Alignment", desc: "Defend gates as a trio, shifting laterally to maintain compact horizontal lines." },
    { id: "df_01", name: "Angled Pressing & Directional Dictation", duration: "15 mins", description: "Approach attackers at an angle to force play wide." },
    { id: "df_02", name: "Line Cover and Press 2v2", duration: "20 mins", description: "Seamless press-and-cover transitions." }
  ],
  attack_coach: [
    { id: "st_01", name: "Lions' Den Central Turning", duration: "15 mins", description: "Receive vertical passes in tight squares, protect, turn, and finish." },
    { id: "st_02", name: "Three-Goal Endline Finale", duration: "15 mins", description: "Small-sided match targeting three separate goal zones." }
  ],
  gk_coach: [
    { id: "gk_01", name: "Ground Side-Diving & Recovery", duration: "15 mins", description: "Low-center gravity dives with immediate chest-hugging recovery." }
  ]
};

export default function CoachDrillLab() {
  const { user, _hasHydrated } = useAuthStore();
  const router = useRouter();
  
  useEffect(() => {
    if (_hasHydrated && (!user || user.role !== 'coach')) router.push('/login');
  }, [_hasHydrated, user, router]);

  if (!_hasHydrated) return <div className="p-10"><Loader2 className="animate-spin" /></div>;

  // 🎯 LOCK DRILLS TO THE COACH'S ROLE
  const roleDrills = COACH_ROLE_DRILLS[user?.role_focus || "defence_coach"] || COACH_ROLE_DRILLS.defence_coach;

  return (
    <div className="p-8 bg-[#f4f2ee] min-h-screen">
      <h1 className="text-2xl font-black uppercase mb-6 flex items-center gap-2">
        {user?.role_focus === 'defence_coach' ? <Shield className="text-blue-600" /> : <Flame className="text-red-600" />}
        {getRoleConfig(user?.role_focus || "defence_coach")?.title} Nurture Lab
      </h1>

      <div className="grid gap-4">
        {roleDrills.map((drill, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="font-black">{drill.name}</h3>
              <p className="text-xs text-gray-500">{drill.description}</p>
            </div>
            <button className="bg-[#1c3d22] text-white px-4 py-2 rounded-xl text-xs font-black">
              <Play size={12} className="inline mr-1"/> Initialize
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
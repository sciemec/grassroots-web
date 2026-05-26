"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { POSITION_FOCUS_MAP } from "@/config/position-focus";
import ProUpgradeBanner from "@/components/player/ProUpgradeBanner";
import * as Icons from "lucide-react";
import Link from "next/link";

export default function SpecializedPlayerHub() {
  const user = useAuthStore((s) => s.user);
  const userPosition = (user?.position || "striker").toLowerCase();
  const focus = POSITION_FOCUS_MAP[userPosition] || POSITION_FOCUS_MAP.striker;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", padding: "1.5rem" }}>
      <ProUpgradeBanner />

      {/* Dynamic Profile Hub Identity Block */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className={`text-xs font-bold uppercase tracking-wider border px-3 py-1 rounded-full ${focus.badgeColor}`}>
            🛡️ {focus.title} Academy
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Mhoroi, {user?.name || "Athlete"}</h1>
          <p className="text-gray-500 text-sm">Your dashboard is customized for target development as an elite {userPosition}.</p>
        </div>
      </div>

      {/* Position Development Matrix Split Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Core Drills Library Quick Gateway */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Icons.Dumbbell className="text-[#1a5c2a]" /> Targeted Position Drills
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {focus.targetDrillCategories.map((cat) => (
              <Link 
                key={cat}
                href={`/player/drills?category=${cat}`}
                className="p-4 border border-gray-100 bg-gray-50 rounded-xl flex items-center justify-between hover:border-[#1a5c2a] transition-all group"
              >
                <span className="font-bold text-sm text-gray-800 capitalize">{cat.replace(/_/g, " ")} Workouts</span>
                <Icons.ChevronRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            ))}
          </div>
        </div>

        {/* Physical Attributes Checklist */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Icons.Activity className="text-[#c8962a]" /> Physical Focus
          </h3>
          <ul className="space-y-2.5">
            {focus.physicalFocus.map((stat) => (
              <li key={stat} className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                <Icons.CheckCircle2 size={16} className="text-[#1a5c2a] shrink-0" />
                {stat.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
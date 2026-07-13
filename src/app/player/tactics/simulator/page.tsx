// src/app/player/tactics/simulator/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import TacticsSimulator from "@/components/tactics/TacticsSimulator";
import type { ChemistryIntegration } from "@/types/tactics";

export default function PlayerTacticsSimulatorPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [position, setPosition] = useState<string | undefined>(undefined);
  const [chemistryData, setChemistryData] = useState<ChemistryIntegration | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlayerData = async () => {
      if (!token || !user) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/player/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const pos = data.position_primary || data.position || undefined;
          setPosition(pos);

          if (pos && user.id) {
            const chemRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/chemistry/player/${user.id}/position/${pos}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (chemRes.ok) {
              const chemData = await chemRes.json();
              setChemistryData(chemData);
            }
          }
        }
      } catch {
        // profile fetch failed — continue without chemistry data
      } finally {
        setLoading(false);
      }
    };
    loadPlayerData();
  }, [token, user]);

  return (
    <div className="min-h-screen bg-[#f4f2ee] text-gray-900">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/player/tactics" className="text-gray-400 hover:text-gray-600">
            <Icons.ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-gray-900">Tactics Simulator</h1>
            <p className="text-xs text-gray-500">
              Interactive simulation for your position
              {position && ` · ${position}`}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Welcome banner */}
        <div className="bg-gradient-to-r from-[#1a5c2a] to-[#0f3318] rounded-2xl p-6 text-white">
          <h2 className="text-xl font-black">Your Position Simulator</h2>
          <p className="text-white/70 text-sm mt-1">
            Run attack, defence, midfield and set-piece scenarios and see exactly
            where you should be on the pitch
            {position && ` as a ${position}`}.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Icons.Loader2 size={32} className="animate-spin text-[#1a5c2a]" />
          </div>
        ) : (
          <TacticsSimulator
            mode="player"
            userId={user?.id ? String(user.id) : undefined}
            position={position}
            chemistryData={chemistryData ?? undefined}
            onSimulationComplete={() => {}}
          />
        )}

        {/* Phase learning cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: "⚔️", label: "Attacking",  desc: "Learn how to create and finish chances" },
            { icon: "🛡️", label: "Defending",  desc: "Understand defensive positioning" },
            { icon: "🔄", label: "Midfield",   desc: "Control the game through the middle" },
            { icon: "🎯", label: "Set Pieces", desc: "Master dead-ball situations" },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-2">{item.icon}</div>
              <h3 className="font-bold text-gray-900">{item.label}</h3>
              <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

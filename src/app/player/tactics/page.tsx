// src/app/player/tactics/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import TacticsSimulator from "@/components/tactics/TacticsSimulator";
import type { ChemistryIntegration } from "@/types/tactics";

export default function PlayerTacticsPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [position, setPosition] = useState<string | null>(null);
  const [chemistryData, setChemistryData] = useState<ChemistryIntegration | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlayerData = async () => {
      if (!token || !user) return;
      try {
        // Get player's position from profile
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/player/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPosition(data.position_primary || data.position || null);
          
          // Get chemistry data for this position
          if (data.position_primary) {
            const chemRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/chemistry/player/${user.id}/position/${data.position_primary}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (chemRes.ok) {
              const chemData = await chemRes.json();
              setChemistryData(chemData);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load player data:", error);
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
          <Link href="/player" className="text-gray-400 hover:text-gray-600">
            <Icons.ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-gray-900">Tactics Learning</h1>
            <p className="text-xs text-gray-500">
              Visual simulations to understand your position better
              {position && ` • ${position}`}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Welcome banner */}
        <div className="bg-gradient-to-r from-[#1a5c2a] to-[#0f3318] rounded-2xl p-6 text-white">
          <h2 className="text-xl font-black">Learn Your Position Visually</h2>
          <p className="text-white/70 text-sm mt-1">
            Watch simulations of attacking, defending, midfield, and set piece scenarios
            {position && ` for your position: ${position}`}
          </p>
        </div>

        {/* Simulator */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Icons.Loader2 size={32} className="animate-spin text-[#1a5c2a]" />
          </div>
        ) : (
          <TacticsSimulator
            mode="player"
            userId={user?.id ? String(user.id) : undefined}
            position={position || undefined}
            chemistryData={chemistryData ?? undefined}
            onSimulationComplete={() => {}}
          />
        )}

        {/* Position learning cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: "⚔️", label: "Attacking", desc: "Learn how to create chances" },
            { icon: "🛡️", label: "Defending", desc: "Understand defensive positioning" },
            { icon: "🔄", label: "Midfield", desc: "Control the game" },
            { icon: "🎯", label: "Set Pieces", desc: "Master dead ball situations" },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md transition-shadow">
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
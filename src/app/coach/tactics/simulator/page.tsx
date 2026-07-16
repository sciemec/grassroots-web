// src/app/coach/tactics/simulator/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import TacticsSimulator from "@/components/tactics/TacticsSimulator";
import type { ChemistryIntegration } from "@/types/tactics";
import type { SquadMember } from "@/types";

export default function CoachTacticsSimulatorPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [squad, setSquad] = useState<SquadMember[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedPlayerPosition, setSelectedPlayerPosition] = useState<string | undefined>(undefined);
  const [chemistryData, setChemistryData] = useState<ChemistryIntegration | null>(null);
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    const loadSquad = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/coach/squad`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSquad(data.data || []);
        }
      } catch (error) {
        console.error("Failed to load squad:", error);
      }
    };
    loadSquad();
  }, [token]);

  const loadPlayerChemistry = async (playerId: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chemistry/player/${playerId}/position`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setChemistryData(data);
      }
    } catch (error) {
      console.error("Failed to load chemistry:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2ee] text-gray-900">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/coach" className="text-gray-400 hover:text-gray-600">
            <Icons.ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-gray-900">Tactics Simulator</h1>
            <p className="text-xs text-gray-500">
              Visualize tactics and teach positioning to players
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Player selector */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
            Select Player to Analyze
          </p>
          <div className="flex flex-wrap gap-2">
            {squad.map((player: SquadMember) => (
              <button
                key={player.id}
                onClick={() => {
                  setSelectedPlayer(player.id);
                  setSelectedPlayerPosition(player.position);
                  loadPlayerChemistry(player.id);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                  selectedPlayer === player.id
                    ? "bg-[#1a5c2a] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {player.name} ({player.position})
              </button>
            ))}
          </div>
        </div>

        {/* Simulator */}
        <TacticsSimulator
          mode="coach"
          userId={user?.id}
          position={selectedPlayerPosition}
          chemistryData={chemistryData}
          onSimulationComplete={(result) => setLastResult(result)}
        />

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              showToast("Link copied — share with a player");
            }}
            className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md transition-shadow flex items-center justify-center gap-2"
          >
            <Icons.Film size={16} className="text-[#1a5c2a]" />
            <span className="text-sm font-medium text-gray-700">Share with Player</span>
          </button>

          <button
            onClick={() => {
              const canvas = document.querySelector("canvas") as HTMLCanvasElement | null;
              if (!canvas) { showToast("Run a simulation first"); return; }
              const a = document.createElement("a");
              a.href = canvas.toDataURL("image/png");
              a.download = `tactics-${Date.now()}.png`;
              a.click();
              showToast("Pitch exported as PNG");
            }}
            className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md transition-shadow flex items-center justify-center gap-2"
          >
            <Icons.Download size={16} className="text-[#1a5c2a]" />
            <span className="text-sm font-medium text-gray-700">Export Simulation</span>
          </button>

          <button
            onClick={async () => {
              const url = window.location.href;
              if (navigator.share) {
                await navigator.share({ title: "GrassRoots Tactics", url });
              } else {
                navigator.clipboard.writeText(url);
                showToast("Link copied — share with your squad");
              }
            }}
            className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md transition-shadow flex items-center justify-center gap-2"
          >
            <Icons.Share2 size={16} className="text-[#1a5c2a]" />
            <span className="text-sm font-medium text-gray-700">Send to Squad</span>
          </button>

          <button
            onClick={() => {
              const existing: Record<string, unknown>[] = JSON.parse(
                localStorage.getItem("grassroots_saved_drills") ?? "[]"
              );
              existing.push({ id: Date.now(), saved_at: new Date().toISOString(), result: lastResult });
              localStorage.setItem("grassroots_saved_drills", JSON.stringify(existing));
              showToast("Saved as drill");
            }}
            className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md transition-shadow flex items-center justify-center gap-2"
          >
            <Icons.BookOpen size={16} className="text-[#1a5c2a]" />
            <span className="text-sm font-medium text-gray-700">Save as Drill</span>
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl z-50 animate-fade-in">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
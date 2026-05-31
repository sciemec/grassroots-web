"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Search, Award, FileText } from "lucide-react";
import BiometricScanner from "@/components/BiometricScanner";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuthStore } from "@/lib/auth-store";

interface Player {
  id: string;
  name: string;
  position: string;
  club: string;
}

export default function CoachBiometricsPage() {
  const user = useAuthStore((s) => s.user);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [squad, setSquad] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Load coach's squad
  useEffect(() => {
    const loadSquad = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/coach/squad`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const players = Array.isArray(data.data) ? data.data : [];
        setSquad(players.slice(0, 30));
      } catch (err) {
        console.error(err);
        // Mock data for demo
        setSquad([
          { id: "1", name: "Tendai Musona", position: "Winger", club: "Harare City" },
          { id: "2", name: "Blessing Moyo", position: "Striker", club: "Dynamos" },
          { id: "3", name: "Knowledge Chikwanda", position: "Midfielder", club: "CAPS United" },
        ]);
      } finally {
        setLoading(false);
      }
    };
    loadSquad();
  }, []);

  const filteredPlayers = squad.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">
          {/* Header */}
          <div className="mb-6 flex items-center gap-4">
            <Link
              href="/coach"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-800 bg-gray-900/50 text-gray-400 hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                Biometric Talent ID
              </h1>
              <p className="text-xs font-medium text-gray-500">
                AI-powered movement analysis for your squad
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Player Selection Panel */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-gray-800 bg-gray-900/30 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-500" />
                  <h2 className="text-sm font-bold text-white">Your Squad</h2>
                </div>
                
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search players..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-gray-800 bg-gray-900/50 py-2 pl-9 pr-3 text-sm text-white placeholder:text-gray-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-800/50" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {filteredPlayers.map((player) => (
                      <button
                        key={player.id}
                        onClick={() => setSelectedPlayer(player)}
                        className={`w-full rounded-xl p-3 text-left transition-all ${
                          selectedPlayer?.id === player.id
                            ? "bg-emerald-600/20 border border-emerald-500/50"
                            : "bg-gray-900/50 border border-gray-800 hover:border-gray-700"
                        }`}
                      >
                        <p className="text-sm font-semibold text-white">{player.name}</p>
                        <p className="text-[10px] font-medium text-gray-500">
                          {player.position} • {player.club}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Biometric Scanner Panel */}
            <div className="lg:col-span-2">
              {selectedPlayer ? (
                <>
                  <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-600/10 px-4 py-2 border border-emerald-500/20">
                    <Award className="h-4 w-4 text-emerald-500" />
                    <p className="text-xs font-medium text-emerald-400">
                      Assessing: {selectedPlayer.name} ({selectedPlayer.position})
                    </p>
                  </div>
                  <BiometricScanner onScanComplete={(data) => console.log("Scan complete for", selectedPlayer?.name, data)} />
                </>
              ) : (
                <div className="rounded-2xl border border-gray-800 bg-gray-900/30 p-12 text-center">
                  <p className="text-sm font-semibold text-white">
                    Select a player to begin biometric scanning.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
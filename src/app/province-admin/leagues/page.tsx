"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { safeArray } from "@/lib/safe-array";
import {
  Trophy,
  Plus,
  Calendar,
  Users,
  ClipboardList,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

interface League {
  id: number;
  name: string;
  sport: string;
  season: string;
  status: "upcoming" | "active" | "completed";
  start_date: string | null;
  end_date: string | null;
  zone_name: string | null;
  club_count: number;
  fixture_count: number;
}

const STATUS_STYLES: Record<string, string> = {
  upcoming:  "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  active:    "bg-green-500/20 text-green-300 border border-green-500/30",
  completed: "bg-white/10 text-white/50 border border-white/10",
};

export default function LeaguesPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/province-admin/leagues`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setLeagues(safeArray<League>(json));
      } catch {
        setError("Failed to load leagues.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/province-admin")}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">League Management</h1>
          <p className="text-white/60 text-sm">ZIFA Province Leagues</p>
        </div>
        <button
          onClick={() => router.push("/province-admin/leagues/new")}
          className="ml-auto flex items-center gap-2 bg-[#f0b429] hover:bg-amber-400 text-[#1a3a1a] font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          New League
        </button>
      </div>

      {/* Content */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && leagues.length === 0 && (
        <div className="text-center py-20">
          <Trophy className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 mb-4">No leagues yet.</p>
          <button
            onClick={() => router.push("/province-admin/leagues/new")}
            className="bg-[#f0b429] hover:bg-amber-400 text-[#1a3a1a] font-semibold px-6 py-2 rounded-xl transition-colors"
          >
            Create First League
          </button>
        </div>
      )}

      {!loading && leagues.length > 0 && (
        <div className="space-y-3">
          {leagues.map((league) => (
            <button
              key={league.id}
              onClick={() => router.push(`/province-admin/leagues/${league.id}`)}
              className="w-full text-left rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 p-5 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[league.status]}`}
                    >
                      {league.status}
                    </span>
                    {league.zone_name && (
                      <span className="text-xs text-white/40">{league.zone_name}</span>
                    )}
                  </div>
                  <h2 className="text-white font-semibold truncate">{league.name}</h2>
                  <p className="text-white/50 text-sm mt-0.5 capitalize">
                    {league.sport} · Season {league.season}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30 flex-shrink-0 mt-1" />
              </div>

              <div className="flex gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-sm text-white/50">
                  <Users className="w-4 h-4" />
                  {league.club_count} clubs
                </span>
                <span className="flex items-center gap-1.5 text-sm text-white/50">
                  <ClipboardList className="w-4 h-4" />
                  {league.fixture_count} fixtures
                </span>
                {league.start_date && (
                  <span className="flex items-center gap-1.5 text-sm text-white/50">
                    <Calendar className="w-4 h-4" />
                    {new Date(league.start_date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import {
  Users, ChevronLeft, Star, MapPin,
  Activity, Loader2, Filter,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

interface Zone {
  id:   number;
  name: string;
}

interface Player {
  id:             string;
  player_id:      string;
  name:           string;
  position:       string | null;
  sport:          string | null;
  zone_name:      string | null;
  age_group:      string | null;
  avg_form_score: number | null;
  is_shortlisted: boolean;
}

export default function ProvinceAdminPlayersPage() {
  const token = useAuthStore((s) => s.token);

  const [zones, setZones]         = useState<Zone[]>([]);
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [players, setPlayers]     = useState<Player[]>([]);
  const [loading, setLoading]     = useState(true);
  const [adding, setAdding]       = useState<string | null>(null);

  // Load zones for filter
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/province-admin/zones`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const raw = data?.data ?? data;
        setZones(Array.isArray(raw) ? raw : []);
      })
      .catch(() => setZones([]));
  }, [token]);

  const loadPlayers = useCallback((zone: string) => {
    if (!token) return;
    setLoading(true);
    const url = zone === "all"
      ? `${API_URL}/province-admin/players`
      : `${API_URL}/province-admin/players?zone_id=${zone}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const raw = data?.data ?? data;
        setPlayers(Array.isArray(raw) ? raw : []);
      })
      .catch(() => setPlayers([]))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { loadPlayers(zoneFilter); }, [zoneFilter, loadPlayers]);

  const addToShortlist = async (playerId: string) => {
    if (!token) return;
    setAdding(playerId);
    try {
      const res = await fetch(`${API_URL}/province-admin/shortlist/${playerId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.ok) {
        setPlayers(prev =>
          prev.map(p => p.id === playerId ? { ...p, is_shortlisted: true } : p)
        );
      }
    } finally {
      setAdding(null);
    }
  };

  const formScoreColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score >= 75) return "text-green-400";
    if (score >= 55) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/province-admin"
            className="rounded-xl border border-[#f0b429]/10 bg-white/5 p-2 hover:border-[#f0b429]/20 transition-all">
            <ChevronLeft className="h-4 w-4 text-white" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-[#f0b429]" /> Players in Province
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {loading ? "Loading…" : `${players.length} player${players.length !== 1 ? "s" : ""} found`}
            </p>
          </div>
        </div>

        {/* Zone filter */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Filter by zone</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setZoneFilter("all")}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all
                ${zoneFilter === "all"
                  ? "bg-[#f0b429] text-[#1a3a1a]"
                  : "border border-[#f0b429]/10 bg-white/5 text-white/60 hover:border-[#f0b429]/20"}`}>
              All Zones
            </button>
            {zones.map(z => (
              <button key={z.id}
                onClick={() => setZoneFilter(String(z.id))}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all
                  ${zoneFilter === String(z.id)
                    ? "bg-[#f0b429] text-[#1a3a1a]"
                    : "border border-[#f0b429]/10 bg-white/5 text-white/60 hover:border-[#f0b429]/20"}`}>
                {z.name}
              </button>
            ))}
          </div>
        </div>

        {/* Player list */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground py-16">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading players…</span>
          </div>
        ) : players.length === 0 ? (
          <div className="rounded-2xl border border-[#f0b429]/10 bg-card/60 p-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No players found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try selecting a different zone or check back once players have registered.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {players.map(player => (
              <div key={player.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-[#f0b429]/10 bg-card/60 px-4 py-3 backdrop-blur-sm">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{player.name}</p>
                    {player.player_id && (
                      <span className="text-xs text-muted-foreground font-mono">{player.player_id}</span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    {player.position && <span>{player.position}</span>}
                    {player.sport    && <span>· {player.sport}</span>}
                    {player.zone_name && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" /> {player.zone_name}
                      </span>
                    )}
                    {player.age_group && <span>· {player.age_group}</span>}
                  </div>
                </div>

                {/* Form score */}
                {player.avg_form_score !== null && (
                  <div className="shrink-0 text-right">
                    <p className={`text-sm font-bold ${formScoreColor(player.avg_form_score)}`}>
                      {player.avg_form_score}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-0.5 justify-end">
                      <Activity className="h-3 w-3" /> Form
                    </p>
                  </div>
                )}

                {/* Shortlist button */}
                <button
                  onClick={() => addToShortlist(player.id)}
                  disabled={player.is_shortlisted || adding === player.id}
                  className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all
                    ${player.is_shortlisted
                      ? "bg-yellow-500/20 text-yellow-400 cursor-default"
                      : "bg-[#f0b429] text-[#1a3a1a] hover:bg-[#f5c542]"}`}>
                  {adding === player.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Star className="h-3.5 w-3.5" fill={player.is_shortlisted ? "currentColor" : "none"} />}
                  {player.is_shortlisted ? "Shortlisted" : "Shortlist"}
                </button>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

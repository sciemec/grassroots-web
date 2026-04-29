"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { safeArray } from "@/lib/safe-array";
import { ArrowLeft, Map, Building2, Users, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

interface Zone {
  id: number;
  name: string;
  club_count: number;
  player_count: number;
  active_leagues: number;
}

export default function ZonesPage() {
  const router  = useRouter();
  const token   = useAuthStore((s) => s.token);
  const [zones, setZones]     = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/province-admin/zones`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((j) => setZones(safeArray<Zone>(j)))
      .catch(() => setError("Failed to load zones."))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-4xl">

        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Province Administration
            </p>
            <h1 className="text-2xl font-bold text-foreground">Zone Overview</h1>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading zones…</span>
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-300 text-sm">
            {error}
          </div>
        ) : zones.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-card/60 p-8 text-center">
            <Map className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No zones found for your province.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {zones.map((z) => (
              <div
                key={z.id}
                className="rounded-2xl border border-white/10 bg-card/60 p-5 backdrop-blur-sm"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="rounded-xl p-2.5 bg-teal-500/20 text-teal-300">
                    <Map className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{z.name}</p>
                    {z.active_leagues > 0 && (
                      <span className="text-xs font-medium text-green-400">
                        {z.active_leagues} active league{z.active_leagues > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/5 p-3">
                    <Building2 className="h-4 w-4 text-blue-400 mb-1" />
                    <p className="text-xl font-bold text-foreground">{z.club_count ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Clubs</p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <Users className="h-4 w-4 text-green-400 mb-1" />
                    <p className="text-xl font-bold text-foreground">{z.player_count ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Players</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

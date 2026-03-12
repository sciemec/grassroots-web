"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import api from "@/lib/api";
import { Send } from "lucide-react";

interface ScoutPlayer {
  id: string;
  initials: string;
  region: string;
  position: string;
  age_group: string;
  overall_score: number | null;
  sessions_count: number;
}

export default function ScoutPage() {
  const [position, setPosition] = useState("");
  const [province, setProvince] = useState("");
  const [contactReason, setContactReason] = useState<Record<string, string>>({});
  const [sent, setSent] = useState<Record<string, boolean>>({});

  const { data: players, isLoading, refetch } = useQuery<ScoutPlayer[]>({
    queryKey: ["scout-players", position, province],
    queryFn: async () => {
      const res = await api.get("/scout/players", {
        params: { position: position || undefined, province: province || undefined },
      });
      return res.data?.data ?? res.data;
    },
    enabled: false,
  });

  const contact = useMutation({
    mutationFn: ({ player_id, reason }: { player_id: string; reason: string }) =>
      api.post("/scout/contact-requests", { player_id, reason }),
    onSuccess: (_, vars) => setSent((prev) => ({ ...prev, [vars.player_id]: true })),
  });

  const positions = ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"];
  const provinces = ["Harare", "Bulawayo", "Manicaland", "Masvingo", "Mashonaland East", "Mashonaland West", "Mashonaland Central", "Matabeleland North", "Matabeleland South", "Midlands"];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Find Players</h1>
        <p className="text-sm text-muted-foreground">Search verified players — names are hidden until contact is approved</p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-3">
        <select value={position} onChange={(e) => setPosition(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="">Any position</option>
          {positions.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={province} onChange={(e) => setProvince(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="">Any province</option>
          {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button
          onClick={() => refetch()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Search
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : players ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((p) => (
            <div key={p.id} className="rounded-xl border bg-card p-4">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="text-lg font-bold">{p.initials}</p>
                  <p className="text-sm text-muted-foreground">{p.position} · {p.region}</p>
                  <p className="text-xs text-muted-foreground">{p.age_group}</p>
                </div>
                {p.overall_score !== null && (
                  <div className="rounded-lg bg-primary/10 px-2 py-1 text-center">
                    <p className="text-lg font-bold">{p.overall_score}</p>
                    <p className="text-xs text-muted-foreground">score</p>
                  </div>
                )}
              </div>
              <p className="mb-2 text-xs text-muted-foreground">{p.sessions_count} sessions recorded</p>
              {sent[p.id] ? (
                <p className="text-xs font-medium text-green-600">Request sent — awaiting admin review</p>
              ) : (
                <div className="space-y-2">
                  <input
                    value={contactReason[p.id] ?? ""}
                    onChange={(e) => setContactReason((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    placeholder="Reason for contact…"
                    className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                  />
                  <button
                    onClick={() => contact.mutate({ player_id: p.id, reason: contactReason[p.id] ?? "" })}
                    disabled={!contactReason[p.id]?.trim() || contact.isPending}
                    className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
                  >
                    <Send className="h-3 w-3" /> Contact Player
                  </button>
                </div>
              )}
            </div>
          ))}
          {!players.length && (
            <p className="col-span-3 py-8 text-center text-muted-foreground">No players found for these filters.</p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
          Use the filters above to search for players
        </div>
      )}
    </DashboardLayout>
  );
}

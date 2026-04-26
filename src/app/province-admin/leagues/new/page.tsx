"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { safeArray } from "@/lib/safe-array";
import { ArrowLeft, Trophy } from "lucide-react";

interface Zone {
  id: number;
  name: string;
}

const SPORTS = [
  "football", "rugby", "netball", "athletics", "basketball",
  "cricket", "swimming", "tennis", "volleyball", "hockey",
];

export default function NewLeaguePage() {
  const { token } = useAuthStore();
  const router = useRouter();

  const [zones, setZones] = useState<Zone[]>([]);
  const [form, setForm] = useState({
    name:       "",
    sport:      "football",
    season:     new Date().getFullYear().toString(),
    zone_id:    "",
    status:     "upcoming",
    start_date: "",
    end_date:   "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/province-admin/zones`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((j) => setZones(safeArray<Zone>(j)))
      .catch(() => {});
  }, [token]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("League name is required."); return; }

    setSubmitting(true);
    setError("");

    try {
      const body: Record<string, unknown> = {
        name:   form.name.trim(),
        sport:  form.sport,
        season: form.season,
        status: form.status,
      };
      if (form.zone_id)    body.zone_id    = parseInt(form.zone_id);
      if (form.start_date) body.start_date = form.start_date;
      if (form.end_date)   body.end_date   = form.end_date;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/province-admin/leagues`,
        {
          method:  "POST",
          headers: {
            Authorization:  `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || `HTTP ${res.status}`);
      }

      const json = await res.json();
      router.push(`/province-admin/leagues/${json.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create league.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Create League</h1>
          <p className="text-white/60 text-sm">Set up a new province league</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* League Name */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <label className="block text-white/70 text-sm mb-2">League Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Zone North U-17 League 2026"
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#f0b429]"
            required
          />
        </div>

        {/* Sport + Season */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">Sport *</label>
            <select
              value={form.sport}
              onChange={(e) => set("sport", e.target.value)}
              className="w-full bg-[#1a3d26] border border-white/20 rounded-xl px-3 py-3 text-white capitalize focus:outline-none focus:border-[#f0b429]"
            >
              {SPORTS.map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-2">Season *</label>
            <input
              type="text"
              value={form.season}
              onChange={(e) => set("season", e.target.value)}
              placeholder="2026"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#f0b429]"
            />
          </div>
        </div>

        {/* Zone + Status */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">Zone (optional)</label>
            <select
              value={form.zone_id}
              onChange={(e) => set("zone_id", e.target.value)}
              className="w-full bg-[#1a3d26] border border-white/20 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-[#f0b429]"
            >
              <option value="">Whole Province</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-2">Status</label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="w-full bg-[#1a3d26] border border-white/20 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-[#f0b429]"
            >
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Dates */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">Start Date</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => set("start_date", e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f0b429]"
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-2">End Date</label>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => set("end_date", e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f0b429]"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-[#f0b429] hover:bg-amber-400 disabled:opacity-50 text-[#1a3a1a] font-bold py-3 rounded-xl transition-colors"
        >
          <Trophy className="w-5 h-5" />
          {submitting ? "Creating..." : "Create League"}
        </button>
      </form>
    </div>
  );
}

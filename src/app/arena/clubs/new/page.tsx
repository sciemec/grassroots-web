"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const API = process.env.NEXT_PUBLIC_API_URL;
const GRS_GREEN = "#1a5c2a";
const BG = "#f4f2ee";

const SPORTS    = ["Football", "Rugby", "Netball", "Basketball", "Cricket", "Athletics", "Swimming", "Tennis", "Volleyball", "Hockey"];
const PROVINCES = ["Harare", "Bulawayo", "Manicaland", "Mashonaland Central", "Mashonaland East", "Mashonaland West", "Masvingo", "Matabeleland North", "Matabeleland South", "Midlands"];
const TIERS     = ["School", "Division 3", "Division 2", "Division 1", "Premier League"];
const FORMATIONS = ["4-4-2", "4-3-3", "4-2-3-1", "3-5-2", "5-3-2", "N/A (non-football)"];

export default function NewClubPage() {
  const router      = useRouter();
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [form, setForm] = useState({
    name:          "",
    sport:         "Football",
    province:      "Harare",
    tier:          "Division 2",
    formation:     "4-4-2",
    playing_style: "",
    description:   "",
    open_for_trials: true,
    scouting_open:   false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  const set = (field: string, value: string | boolean) => setForm((f) => ({ ...f, [field]: value }));

  const submit = async () => {
    if (!form.name.trim()) { setError("Club name is required."); return; }
    if (!token) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/arena/clubs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const json = await res.json();
        const newId = json.data?.id ?? json.id;
        router.push(newId ? `/arena/clubs/${newId}` : "/arena/clubs");
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.message ?? "Failed to create club. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  };

  if (!hasHydrated || !user) return null;

  const isCoach = user.role === "coach" || user.role === "admin";
  if (!isCoach) {
    return (
      <div style={{ minHeight: "100vh", background: BG }} className="flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-500">Only coaches can create clubs.</p>
          <Link href="/arena/clubs" className="mt-2 text-sm font-medium" style={{ color: GRS_GREEN }}>Back to Clubs</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG }}>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/arena/clubs" className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={18} className="text-gray-600" />
          </Link>
          <span className="font-semibold text-sm text-gray-900">Create Club</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {/* Club name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Club Name *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Harare City FC"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-400" />
          </div>

          {/* Sport + Province */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sport</label>
              <select value={form.sport} onChange={(e) => set("sport", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none">
                {SPORTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Province</label>
              <select value={form.province} onChange={(e) => set("province", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none">
                {PROVINCES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Tier + Formation */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tier / Division</label>
              <select value={form.tier} onChange={(e) => set("tier", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none">
                {TIERS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Formation</label>
              <select value={form.formation} onChange={(e) => set("formation", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none">
                {FORMATIONS.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* Playing style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Playing Style</label>
            <input value={form.playing_style} onChange={(e) => set("playing_style", e.target.value)}
              placeholder="e.g. High press, possession-based, counter-attack..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-400" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">About the Club</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
              placeholder="Tell players and scouts about your club..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none resize-none focus:border-gray-400" />
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            {[
              { field: "open_for_trials", label: "Open for Trials", desc: "Players can apply to trial at your club" },
              { field: "scouting_open",   label: "Scouting Open",   desc: "Scouts can view your club's player list" },
            ].map(({ field, label, desc }) => (
              <label key={field} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
                <div onClick={() => set(field, !form[field as keyof typeof form])}
                  className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${form[field as keyof typeof form] ? "justify-end" : "justify-start"}`}
                  style={{ background: form[field as keyof typeof form] ? GRS_GREEN : "#d1d5db" }}>
                  <div className="w-4 h-4 rounded-full bg-white" />
                </div>
              </label>
            ))}
          </div>

          {/* Submit */}
          <button onClick={submit} disabled={submitting || !form.name.trim()}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
            style={{ background: GRS_GREEN }}>
            {submitting ? "Creating..." : "Create Club"}
          </button>
        </div>
      </div>
    </div>
  );
}

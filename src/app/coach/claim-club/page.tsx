"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Search, CheckCircle2, Clock, Shield, Plus, X } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const API = process.env.NEXT_PUBLIC_API_URL;
const GRS_GREEN = "#1a5c2a";
const GOLD = "#c8962a";
const BG = "#f4f2ee";

const SPORTS = ["Football","Rugby","Athletics","Netball","Basketball","Cricket","Swimming","Tennis","Volleyball","Hockey"];
const PROVINCES = ["Harare","Bulawayo","Manicaland","Mashonaland Central","Mashonaland East","Mashonaland West","Masvingo","Matabeleland North","Matabeleland South","Midlands"];

type ClaimStatus = "pending" | "approved" | "rejected";

type Club = {
  id: string;
  name: string;
  sport: string;
  province: string;
  district: string | null;
  tier: string | null;
  coach_id: string | null;
};

type MyClaim = {
  id: string;
  club_id: string;
  status: ClaimStatus;
};

function TierBadge({ tier }: { tier: string | null }) {
  if (!tier) return null;
  const colors: Record<string, string> = {
    "Premier League": "#7c3aed",
    "Division 1": "#1d4ed8",
    "Division 2": "#0369a1",
    "Schools": "#065f46",
  };
  const bg = colors[tier] ?? "#374151";
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-white text-xs font-medium" style={{ background: bg }}>
      {tier}
    </span>
  );
}

export default function ClaimClubPage() {
  const router = useRouter();
  const user     = useAuthStore((s) => s.user);
  const token    = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [search, setSearch]       = useState("");
  const [sport, setSport]         = useState("");
  const [province, setProvince]   = useState("");
  const [clubs, setClubs]         = useState<Club[]>([]);
  const [loading, setLoading]     = useState(false);
  const [myClaims, setMyClaims]   = useState<Record<string, MyClaim>>({});

  // Claim modal state
  const [claimTarget, setClaimTarget] = useState<Club | null>(null);
  const [claimNote, setClaimNote]     = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted]     = useState<string | null>(null); // club id just claimed

  if (!hasHydrated) return null;

  const loadMyClaims = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/coach/club-claims`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const map: Record<string, MyClaim> = {};
        (json.data ?? json ?? []).forEach((c: MyClaim) => { map[c.club_id] = c; });
        setMyClaims(map);
      }
    } catch { /* silent */ }
  }, [token]);

  const loadClubs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sport)    params.set("sport", sport);
      if (province) params.set("province", province);
      params.set("per_page", "150");
      const res = await fetch(`${API}/arena/clubs?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        const list: Club[] = json.data ?? json.clubs ?? json ?? [];
        setClubs(Array.isArray(list) ? list : []);
      }
    } catch { setClubs([]); }
    finally { setLoading(false); }
  }, [sport, province, token]);

  useEffect(() => { loadMyClaims(); }, [loadMyClaims]);
  useEffect(() => { loadClubs(); }, [loadClubs]);

  const filtered = clubs.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleClaim = async () => {
    if (!claimTarget || !token) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`${API}/coach/club-claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ club_id: claimTarget.id, coach_note: claimNote.trim() }),
      });
      const json = await res.json();
      if (res.ok) {
        setSubmitted(claimTarget.id);
        setMyClaims((prev) => ({
          ...prev,
          [claimTarget.id]: { id: json.data?.id ?? json.id, club_id: claimTarget.id, status: "pending" },
        }));
        setClaimTarget(null);
        setClaimNote("");
      } else {
        setSubmitError(json.message ?? "Failed to submit claim");
      }
    } catch { setSubmitError("Network error — try again"); }
    finally { setSubmitting(false); }
  };

  const getClubStatus = (club: Club): ClaimStatus | "claimed_other" | null => {
    const mine = myClaims[club.id];
    if (mine) return mine.status;
    if (club.coach_id && club.coach_id !== user?.id) return "claimed_other";
    return null;
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG }}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <div>
            <p className="font-semibold text-sm text-gray-900">Claim Your Club</p>
            <p className="text-xs text-gray-400">Link your coach account to your club</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Info banner */}
        <div className="rounded-2xl p-4 border" style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}>
          <div className="flex gap-3">
            <Shield size={18} style={{ color: GRS_GREEN }} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-900">What happens when you claim?</p>
              <p className="text-xs text-gray-600 mt-0.5">
                Our team reviews your request and verifies you're with the club. Once approved, your contact
                details appear on the club page so players and scouts can reach you directly.
              </p>
            </div>
          </div>
        </div>

        {/* Success toast */}
        {submitted && (
          <div className="rounded-2xl p-4 border flex items-center gap-3" style={{ background: "#f0fdf4", borderColor: "#86efac" }}>
            <CheckCircle2 size={18} style={{ color: GRS_GREEN }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: GRS_GREEN }}>Claim submitted!</p>
              <p className="text-xs text-gray-600">We'll review it and notify you within 24 hours.</p>
            </div>
            <button onClick={() => setSubmitted(null)} className="ml-auto text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Search + Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clubs by name..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={sport} onChange={(e) => setSport(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none">
              <option value="">All sports</option>
              {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={province} onChange={(e) => setProvince(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none">
              <option value="">All provinces</option>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map((i) => (
              <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm font-medium">No clubs found</p>
            <p className="text-gray-400 text-xs mt-1 mb-4">Try a different name, sport or province</p>
            <Link href="/arena/clubs/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
              style={{ background: GRS_GREEN }}>
              <Plus size={15} /> Add your club
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">{filtered.length} club{filtered.length !== 1 ? "s" : ""} found</p>
            {filtered.map((club) => {
              const status = getClubStatus(club);
              return (
                <div key={club.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ background: GRS_GREEN }}>
                    {club.name.slice(0, 2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{club.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {club.sport} · {club.province}{club.district ? ` · ${club.district}` : ""}
                    </p>
                    {club.tier && <TierBadge tier={club.tier} />}
                  </div>

                  {/* Action */}
                  <div className="flex-shrink-0">
                    {status === "approved" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                        style={{ background: GRS_GREEN }}>
                        <CheckCircle2 size={12} /> Your club
                      </span>
                    )}
                    {status === "pending" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                        style={{ background: "#fef9c3", color: "#854d0e" }}>
                        <Clock size={12} /> Pending
                      </span>
                    )}
                    {status === "rejected" && (
                      <button onClick={() => { setClaimTarget(club); setClaimNote(""); }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold border"
                        style={{ borderColor: GRS_GREEN, color: GRS_GREEN }}>
                        Re-apply
                      </button>
                    )}
                    {status === "claimed_other" && (
                      <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        Claimed
                      </span>
                    )}
                    {status === null && (
                      <button onClick={() => { setClaimTarget(club); setClaimNote(""); setSubmitError(""); }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                        style={{ background: GOLD }}>
                        Claim
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add club CTA at bottom */}
            <div className="rounded-2xl border border-dashed border-gray-300 p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gray-100 flex-shrink-0">
                <Plus size={18} className="text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700">Can't find your club?</p>
                <p className="text-xs text-gray-500">Add it to the directory yourself</p>
              </div>
              <Link href="/arena/clubs/new"
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border"
                style={{ borderColor: GRS_GREEN, color: GRS_GREEN }}>
                Add club
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Claim modal */}
      {claimTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-gray-900">Claim {claimTarget.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{claimTarget.sport} · {claimTarget.province}</p>
              </div>
              <button onClick={() => setClaimTarget(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={18} />
              </button>
            </div>

            <label className="text-xs font-semibold text-gray-500 uppercase block mb-2">
              Your role at this club
            </label>
            <textarea
              value={claimNote}
              onChange={(e) => setClaimNote(e.target.value)}
              rows={3}
              placeholder="e.g. Head coach since 2022, registered with ZIFA..."
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-100"
              maxLength={300}
            />
            <p className="text-xs text-gray-400 text-right mb-4">{claimNote.length}/300</p>

            {submitError && <p className="text-sm text-red-500 mb-3">{submitError}</p>}

            <div className="flex gap-3">
              <button onClick={() => setClaimTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium">
                Cancel
              </button>
              <button onClick={handleClaim} disabled={submitting}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                style={{ background: GRS_GREEN }}>
                {submitting ? "Submitting..." : "Submit Claim"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

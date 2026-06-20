"use client";
import { useState, useEffect, use } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Calendar, Users, ChevronLeft, X } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const API = process.env.NEXT_PUBLIC_API_URL;
const GRS_GREEN = "#1a5c2a";
const GOLD = "#c8962a";
const BG = "#f4f2ee";

interface TalentPosting {
  id: string;
  title?: string;
  sport: string;
  position: string;
  province?: string;
  age_min?: number;
  age_max?: number;
  thuto_min?: number;
  style_of_play?: string;
  stipend?: boolean;
  description: string;
  status: "open" | "closed";
  closes_at?: string;
  applications_count: number;
  applied?: boolean;
  poster?: { id: string; name: string; role: string };
  club?: { id: string; name: string } | null;
}

function daysLeft(closes_at?: string): number {
  if (!closes_at) return 999;
  return Math.max(0, Math.ceil((new Date(closes_at).getTime() - Date.now()) / 86400000));
}

function ArenaNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const initials = userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const links = [
    { href: "/arena",             label: "Feed" },
    { href: "/arena/network",     label: "Network" },
    { href: "/arena/clubs",       label: "Clubs" },
    { href: "/arena/recruitment", label: "Talent Board" },
    { href: "/arena/messages",    label: "Messages" },
  ];
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/arena" className="font-bold text-lg flex-shrink-0" style={{ color: GRS_GREEN }}>The Arena</Link>
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link key={href} href={href}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${pathname === href ? "text-white" : "text-gray-600 hover:bg-gray-100"}`}
              style={pathname === href ? { background: GRS_GREEN } : {}}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ background: GRS_GREEN }}>{initials}</div>
      </div>
    </header>
  );
}

export default function RecruitmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [posting, setPosting]         = useState<TalentPosting | null>(null);
  const [loading, setLoading]         = useState(true);
  const [showApply, setShowApply]     = useState(false);
  const [message, setMessage]         = useState("");
  const [availability, setAvailability] = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [applied, setApplied]         = useState(false);
  const [error, setError]             = useState("");

  useEffect(() => {
    if (!hasHydrated) return;
    fetch(`${API}/arena/talent-wanted/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json) {
          const data = json.data ?? json;
          setPosting(data);
          setApplied(data.applied ?? false);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, hasHydrated, token]);

  const handleApply = async () => {
    if (!message.trim()) { setError("Please write a message"); return; }
    setSubmitting(true); setError("");
    try {
      const res = await fetch(`${API}/arena/talent-wanted/${id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: message.trim(), availability: availability.trim() }),
      });
      if (res.ok) {
        setApplied(true);
        setShowApply(false);
        setPosting((prev) => prev ? { ...prev, applications_count: prev.applications_count + 1 } : prev);
      } else {
        const json = await res.json();
        setError(json.message ?? "Failed to apply");
      }
    } catch { setError("Network error — try again"); }
    finally { setSubmitting(false); }
  };

  if (!hasHydrated || loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: BG }}>
      <ArenaNav userName={user?.name ?? "A"} />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {[1,2,3].map((i) => <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse"><div className="h-16 bg-gray-100 rounded-xl" /></div>)}
      </div>
    </div>
  );

  if (!posting) return (
    <div style={{ minHeight: "100vh", backgroundColor: BG }}>
      <ArenaNav userName={user?.name ?? "A"} />
      <div className="text-center py-20">
        <p className="text-gray-400">Posting not found</p>
        <Link href="/arena/recruitment" className="text-sm font-medium mt-3 inline-block hover:underline" style={{ color: GRS_GREEN }}>Back to Talent Board</Link>
      </div>
    </div>
  );

  const left = daysLeft(posting.closes_at);
  const isClosed = posting.status === "closed" || left === 0;
  const isPlayer = user?.role === "player" || user?.role === "athlete";
  const isCoach  = user?.role === "coach" || user?.role === "admin";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG }}>
      <ArenaNav userName={user?.name ?? "A"} />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ChevronLeft size={16} /> Back
        </button>

        {/* Posting card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{posting.title ?? `${posting.position} Wanted`}</h1>
              {posting.club && <p className="text-sm text-gray-500 mt-0.5">{posting.club.name}</p>}
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {isClosed ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600">Closed</span>
              ) : left < 99 ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: left <= 3 ? "#fef2f2" : "#f0fdf4", color: left <= 3 ? "#dc2626" : GRS_GREEN }}>
                  {left}d left
                </span>
              ) : null}
              {posting.stipend && <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: "#fffbeb", color: GOLD }}>Stipend Available</span>}
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: "Sport",    value: posting.sport },
              { label: "Position", value: posting.position },
              posting.province ? { label: "Province", value: posting.province } : null,
              (posting.age_min || posting.age_max) ? { label: "Age", value: `${posting.age_min ?? "?"} – ${posting.age_max ?? "?"}` } : null,
              posting.thuto_min ? { label: "Min THUTO", value: `${posting.thuto_min}+` } : null,
              { label: "Applications", value: String(posting.applications_count) },
            ].filter(Boolean).map((item) => item && (
              <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 font-medium">{item.label}</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>

          {posting.style_of_play && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Playing Style</p>
              <p className="text-sm text-gray-600 italic">"{posting.style_of_play}"</p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Description</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{posting.description}</p>
          </div>

          {posting.poster && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-500">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: GRS_GREEN }}>{posting.poster.name[0]}</div>
              Posted by <span className="text-gray-700 font-medium">{posting.poster.name}</span>
              <span className="text-gray-400">({posting.poster.role})</span>
            </div>
          )}
        </div>

        {/* CTA */}
        {isPlayer && !isClosed && (
          applied ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
              <p className="text-sm font-semibold" style={{ color: GRS_GREEN }}>Application submitted</p>
              <p className="text-xs text-gray-400 mt-1">The coach will be in touch if you're shortlisted.</p>
            </div>
          ) : (
            <button onClick={() => setShowApply(true)}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm" style={{ background: GOLD }}>
              Apply Now
            </button>
          )
        )}

        {isCoach && (
          <Link href={`/coach/recruitment?posting=${id}`}
            className="block w-full py-3 rounded-xl text-center font-semibold text-sm text-white" style={{ background: GRS_GREEN }}>
            View Applications ({posting.applications_count})
          </Link>
        )}
      </div>

      {/* Apply modal */}
      {showApply && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Apply for {posting.position}</h2>
              <button onClick={() => setShowApply(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Your Message <span className="text-red-400">*</span></label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4}
                  placeholder="Tell the coach why you're a good fit..."
                  className="w-full mt-1 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2"
                  maxLength={1000} />
                <p className="text-xs text-gray-400 text-right">{message.length}/1000</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Availability</label>
                <input value={availability} onChange={(e) => setAvailability(e.target.value)}
                  placeholder="e.g. Available from July 2026"
                  className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" maxLength={200} />
              </div>
            </div>
            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setShowApply(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600">Cancel</button>
              <button onClick={handleApply} disabled={submitting}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                style={{ background: GOLD }}>
                {submitting ? "Sending..." : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

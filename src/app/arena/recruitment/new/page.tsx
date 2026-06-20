"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const API = process.env.NEXT_PUBLIC_API_URL;
const GRS_GREEN = "#1a5c2a";
const GOLD = "#c8962a";
const BG = "#f4f2ee";

const SPORTS = ["Football","Rugby","Athletics","Netball","Basketball","Cricket","Swimming","Tennis","Volleyball","Hockey"];
const PROVINCES = ["Harare","Bulawayo","Manicaland","Mashonaland Central","Mashonaland East","Mashonaland West","Masvingo","Matabeleland North","Matabeleland South","Midlands"];
const SCORE_CHIPS = [0,40,55,65,75];

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

export default function NewRecruitmentPage() {
  const router = useRouter();
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [sport, setSport]               = useState("");
  const [position, setPosition]         = useState("");
  const [ageMin, setAgeMin]             = useState("");
  const [ageMax, setAgeMax]             = useState("");
  const [thutoMin, setThutoMin]         = useState(0);
  const [province, setProvince]         = useState("");
  const [stipend, setStipend]           = useState(false);
  const [styleOfPlay, setStyleOfPlay]   = useState("");
  const [description, setDescription]   = useState("");
  const [closesAt, setClosesAt]         = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState("");

  if (!hasHydrated) return null;

  if (!token || (user?.role !== "coach" && user?.role !== "admin")) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: BG }}>
        <ArenaNav userName={user?.name ?? "A"} />
        <div className="text-center py-20">
          <p className="text-gray-500 text-sm">Only coaches can post talent listings.</p>
          <Link href="/arena/recruitment" className="text-sm font-medium mt-3 inline-block hover:underline" style={{ color: GRS_GREEN }}>Back to Talent Board</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sport || !position || !description.trim()) { setError("Sport, position and description are required"); return; }
    setSubmitting(true); setError("");
    try {
      const res = await fetch(`${API}/arena/talent-wanted`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          sport, position,
          age_min: ageMin ? parseInt(ageMin) : undefined,
          age_max: ageMax ? parseInt(ageMax) : undefined,
          thuto_min: thutoMin || undefined,
          province: province || undefined,
          stipend,
          style_of_play: styleOfPlay.trim() || undefined,
          description: description.trim(),
          closes_at: closesAt || undefined,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const newId = json.data?.id ?? json.id;
        router.push(newId ? `/arena/recruitment/${newId}` : "/arena/recruitment");
      } else {
        const json = await res.json();
        setError(json.message ?? "Failed to create posting");
      }
    } catch { setError("Network error — try again"); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG }}>
      <ArenaNav userName={user?.name ?? "A"} />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ChevronLeft size={16} /> Back
        </button>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-5">Post a Talent Wanted</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Sport */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-2">Sport <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-5 gap-2">
                {SPORTS.map((s) => (
                  <button key={s} type="button" onClick={() => setSport(sport === s ? "" : s)}
                    className="py-2 px-1 rounded-xl text-xs font-medium border text-center transition-colors"
                    style={{ background: sport === s ? GRS_GREEN : "#f9fafb", color: sport === s ? "white" : "#374151", borderColor: sport === s ? GRS_GREEN : "#e5e7eb" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Position */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Position <span className="text-red-400">*</span></label>
              <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. Striker, Centre Back..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
            </div>

            {/* Age range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Min Age</label>
                <input type="number" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} placeholder="e.g. 15"
                  min={10} max={40} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Max Age</label>
                <input type="number" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} placeholder="e.g. 21"
                  min={10} max={40} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
              </div>
            </div>

            {/* Province */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Province</label>
              <select value={province} onChange={(e) => setProvince(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none">
                <option value="">Any province</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Min THUTO score */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-2">Minimum THUTO Score</label>
              <div className="flex gap-2 flex-wrap">
                {SCORE_CHIPS.map((c) => (
                  <button key={c} type="button" onClick={() => setThutoMin(c)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                    style={{ background: thutoMin === c ? GRS_GREEN : "white", color: thutoMin === c ? "white" : "#374151", borderColor: thutoMin === c ? GRS_GREEN : "#d1d5db" }}>
                    {c === 0 ? "No minimum" : `${c}+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Style of play */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Playing Style / Culture</label>
              <input value={styleOfPlay} onChange={(e) => setStyleOfPlay(e.target.value)}
                placeholder="e.g. High press, technically gifted, hard worker..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Description <span className="text-red-400">*</span></label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5}
                placeholder="Describe what you're looking for, trial dates, training schedule..."
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none"
                maxLength={1000} />
              <p className="text-xs text-gray-400 text-right">{description.length}/1000</p>
            </div>

            {/* Closes at */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Application Deadline</label>
              <input type="date" value={closesAt} onChange={(e) => setClosesAt(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
            </div>

            {/* Stipend toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={stipend} onChange={(e) => setStipend(e.target.checked)} />
                <div className="w-10 h-6 rounded-full transition-colors" style={{ background: stipend ? GOLD : "#d1d5db" }} />
                <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform" style={{ transform: stipend ? "translateX(16px)" : "translateX(0)" }} />
              </div>
              <span className="text-sm text-gray-700">Stipend / payment available</span>
            </label>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => router.back()}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium">
                Cancel
              </button>
              <button type="submit" disabled={submitting || !sport || !position || !description.trim()}
                className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                style={{ background: GOLD }}>
                {submitting ? "Posting..." : "Post Listing"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

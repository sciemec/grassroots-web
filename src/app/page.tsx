"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award, Zap, Lock, BookOpen, Activity,
  GraduationCap, MapPin, Users, Globe, ChevronRight,
  Radio, ArrowRight, Camera, Dumbbell, IdCard,
  Video, Share2, Globe2, TrendingUp
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface LeaderboardAthlete {
  id:       string;
  name:     string;
  sport:    string;
  province: string;
  score:    number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const GRS_GREEN = "#1c3d22";
const GRS_GOLD  = "#c8962a";

// ─────────────────────────────────────────────────────────────────────────────
// CoreGoals — Identify · Nurture · Market (with WORKING links)
// ─────────────────────────────────────────────────────────────────────────────
function CoreGoals() {
  return (
    <section className="py-16 px-4" style={{ background: GRS_GREEN }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div
            className="text-xs font-medium tracking-widest uppercase mb-2"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            What GrassRoots Sports does
          </div>
          <h2 className="text-3xl font-black text-white">
            Identify. Nurture. Market.
          </h2>
          <p className="text-white/60 text-sm mt-3 max-w-xl mx-auto">
            Every feature on the platform serves one of these three goals.
            Geography should not determine a player's destiny.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              number:  "01",
              title:   "Identify",
              color:   GRS_GOLD,
              desc:    "Six athletic tests run with a single phone — no equipment, no timing gates. AI-powered AQ scoring benchmarks every player against Zimbabwe-calibrated norms.",
              bullets: [
                "Jump, sprint, balance, reaction, endurance, ball mastery",
                "AQ score vs age-group norms",
                "Position match scores for all 5 positions",
              ],
              link: "/athlete/scan",
              icon: <Camera size={20} />,
              cta:  "Take your test →",
            },
            {
              number:  "02",
              title:   "Nurture",
              color:   "#4ade80",
              desc:    "125 structured drills unlock as players improve. THUTO AI coaches boys and Amara coaches girls. Weekly DQ tracking shows trajectory, not just snapshots.",
              bullets: [
                "Drill curriculum from EFL, Costa Rica U14, France U17",
                "THUTO and Amara coaching on web + WhatsApp",
                "Technique degradation score under fatigue",
              ],
              link: "/player/drills",
              icon: <Dumbbell size={20} />,
              cta:  "See your drills →",
            },
            {
              number:  "03",
              title:   "Market",
              color:   "#60a5fa",
              desc:    "Two ways to get discovered: Your personal Talent Passport and the Arena social network. Share videos, connect with scouts, and build your brand.",
              bullets: [
                "🎫 Talent Passport — Verified profile with QR code",
                "📹 Arena — Post videos, get noticed by scouts",
                "🤝 Connect directly with clubs and academies",
              ],
              links: [
                { href: "/player/talent-id", label: "Talent Passport", icon: <IdCard size={14} />, color: "#60a5fa" },
                { href: "/arena", label: "Arena Network", icon: <Globe2 size={14} />, color: "#a78bfa" },
              ],
              icon: <Share2 size={20} />,
            },
          ].map((g) => (
            <div
              key={g.title}
              className="rounded-2xl p-6 border border-[#f0b429]/10 hover:border-[#f0b429]/30 transition-all duration-300"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <div className="text-4xl font-black mb-3 opacity-30 text-white">
                {g.number}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-xl bg-white/10">
                  {g.icon}
                </div>
                <h3
                  className="text-xl font-black text-white"
                  style={{ color: g.color }}
                >
                  {g.title}
                </h3>
              </div>
              <p className="text-sm text-white/60 leading-relaxed mb-4">
                {g.desc}
              </p>
              <ul className="space-y-1.5 mb-5">
                {g.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-xs text-white/70">
                    <span style={{ color: g.color }} className="mt-0.5">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              
              {/* Special handling for MARKET section with two buttons */}
              {g.links ? (
                <div className="flex gap-3">
                  {g.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex-1 inline-flex items-center justify-center gap-2 text-xs font-bold px-3 py-2 rounded-full transition-all hover:opacity-80"
                      style={{ background: link.color, color: "#fff" }}
                    >
                      {link.icon}
                      {link.label}
                      <ChevronRight size={10} />
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  href={g.link}
                  className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full transition-all hover:opacity-80"
                  style={{ background: g.color, color: "#fff" }}
                >
                  {g.cta}
                  <ChevronRight size={12} />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VideoUpload — direct R2 upload, no auth required
// ─────────────────────────────────────────────────────────────────────────────
function VideoUpload() {
  const [file,   setFile]   = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [label,  setLabel]  = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");

    try {
      const res = await fetch("/api/upload/presigned", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName:    file.name,
          contentType: file.type || "video/mp4",
          source:      "player_upload",
          label:       label || file.name,
        }),
      });

      if (!res.ok) throw new Error("Could not get upload URL");
      const { uploadUrl } = await res.json();

      const uploadRes = await fetch(uploadUrl, {
        method:  "PUT",
        body:    file,
        headers: { "Content-Type": file.type || "video/mp4" },
      });

      if (!uploadRes.ok) throw new Error("Upload failed");
      setStatus("done");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <section className="py-16 px-4 bg-[#F4F2EE]">
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-xs font-medium tracking-widest uppercase mb-2 text-gray-400">
          Upload your training footage
        </div>
        <h2 className="text-2xl font-black mb-3" style={{ color: GRS_GREEN }}>
          Share your video — get seen
        </h2>
        <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
          Upload a training clip or match highlight. It goes straight to your
          vault and can be shared with scouts via your Talent Passport.
        </p>

        <div
          className="rounded-2xl border-2 border-dashed p-8 mb-4 cursor-pointer hover:border-green-400 transition-colors"
          style={{ borderColor: file ? GRS_GREEN : "#d1d5db" }}
          onClick={() => fileRef.current?.click()}
        >
          {file ? (
            <div>
              <div className="text-2xl mb-2">🎥</div>
              <div className="text-sm font-medium text-gray-900">{file.name}</div>
              <div className="text-xs text-gray-400 mt-1">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </div>
            </div>
          ) : (
            <div>
              <div className="text-3xl mb-3 text-gray-300">📤</div>
              <div className="text-sm font-medium text-gray-600">Tap to choose a video</div>
              <div className="text-xs text-gray-400 mt-1">MP4, MOV · max 100MB</div>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setStatus("idle");
            }}
          />
        </div>

        {file && status === "idle" && (
          <div className="space-y-3">
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label this video (e.g. Sprint training June 2026)"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400"
            />
            <button
              onClick={handleUpload}
              className="w-full py-4 rounded-xl font-bold text-white text-base"
              style={{ background: GRS_GREEN }}
            >
              Upload video
            </button>
          </div>
        )}

        {status === "uploading" && (
          <div className="py-4">
            <div className="text-sm text-gray-600 animate-pulse">
              Uploading your video...
            </div>
          </div>
        )}

        {status === "done" && (
          <div className="py-4 space-y-3">
            <div className="text-sm font-bold" style={{ color: GRS_GREEN }}>
              ✓ Video uploaded to your vault
            </div>
            <Link
              href="/player/profile"
              className="inline-block text-sm font-medium px-5 py-2 rounded-full text-white"
              style={{ background: GRS_GREEN }}
            >
              View in your profile →
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="py-4">
            <div className="text-sm text-red-600">
              Upload failed. Please try again.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WorldCupBanner — links to /world-cup
// ─────────────────────────────────────────────────────────────────────────────
function WorldCupBanner() {
  return (
    <section className="py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/world-cup"
          className="block rounded-2xl overflow-hidden p-6 text-center transition-opacity hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #1c3d22 0%, #185fa5 100%)",
          }}
        >
          <div
            className="text-xs font-medium tracking-widest uppercase mb-1"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            World Cup 2026
          </div>
          <div className="text-xl font-black text-white">
            Live Scores · AI Commentary · All Fixtures →
          </div>
          <div className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
            48 teams · 104 matches · USA · Canada · Mexico
          </div>
        </Link>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page component
// ─────────────────────────────────────────────────────────────────────────────
export default function GrassrootsSportsLanding() {
  const [activityWire, setActivityWire] = useState<string[]>([]);
  const [wireIndex,    setWireIndex]    = useState(0);
  const [topTalents,   setTopTalents]   = useState<LeaderboardAthlete[]>([]);
  const [talentsLoading, setTalentsLoading] = useState(true);

  // Fetch live ticker and leaderboard on mount
  useEffect(() => {
    async function fetchLandingMetrics() {
      try {
        const [wireRes, leaderboardRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/ticker-wire`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/talent-leaderboard?limit=3`),
        ]);

        if (wireRes.ok) {
          const wireData = await wireRes.json();
          if (wireData.ticker_items) setActivityWire(wireData.ticker_items);
        }

        if (leaderboardRes.ok) {
          const leaderboardData = await leaderboardRes.json();
          const transformed = (leaderboardData.data || []).map((item: any) => ({
            id:       item.user_id,
            name:     item.initials || "Athlete",
            sport:    item.sport    || "Multi-sport",
            province: item.province || "Zimbabwe",
            score:    item.percentile || 0,
          }));
          setTopTalents(transformed);
        }
      } catch (err) {
        console.error("Landing metrics fetch error:", err);
      } finally {
        setTalentsLoading(false);
      }
    }
    fetchLandingMetrics();
  }, []);

  // Rotate live wire ticker
  useEffect(() => {
    if (activityWire.length === 0) return;
    const interval = setInterval(() => {
      setWireIndex((prev) => (prev + 1) % activityWire.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [activityWire.length]);

  return (
    <div className="min-h-screen bg-[#f4f2ee] text-[#1c3d22] selection:bg-[#f0b429]/30 antialiased font-sans">

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <nav className="bg-[#e2f0d9] border-b-2 border-[#f0b429] px-4 sm:px-6 py-4 shadow-xs sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-[#1c3d22] p-1.5 rounded-lg text-[#f0b429] font-black text-xs">
              GRS
            </div>
            <span className="text-[#1c3d22] font-black text-sm tracking-wider uppercase group-hover:text-emerald-700 transition-colors">
              Grassroots Sports
            </span>
          </Link>

          <div className="flex items-center gap-2 bg-[#f0f9e8] px-4 py-1.5 rounded-xl border border-[#1c3d22]/10 shadow-3xs">
            <GraduationCap size={16} className="text-[#1c3d22]" />
            <div className="text-left">
              <span className="block text-[8px] font-black uppercase tracking-widest text-emerald-800 leading-none">
                Strategic Education Partner
              </span>
              <span className="text-[11px] font-black tracking-tight text-[#1c3d22] uppercase">
                Teach For Zimbabwe
              </span>
            </div>
          </div>

          <Link
            href="/login"
            className="bg-white text-[#1c3d22] border-2 border-[#1c3d22] hover:bg-[#f0f9e8] px-4 py-1.75 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-3xs"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* ── Live activity wire ─────────────────────────────────────────────── */}
      {activityWire.length > 0 && (
        <div className="bg-[#fffbeb] border-b border-amber-200 py-2.5 px-4 overflow-hidden">
          <div className="max-w-6xl mx-auto flex items-center gap-2">
            <span className="flex items-center gap-1 bg-[#1c3d22] text-[#f0b429] text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm shrink-0">
              <Radio size={10} className="animate-pulse" /> Live
            </span>
            <p className="text-xs font-bold text-amber-950 truncate transition-all duration-500">
              {activityWire[wireIndex]}
            </p>
          </div>
        </div>
      )}

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#e2f0d9] via-[#f0f9e8] to-[#f4f2ee] border-b border-[#1c3d22]/10 py-16 lg:py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/80 border border-[#1c3d22]/10 rounded-full px-4 py-1.5 mb-2 shadow-3xs">
            <Zap size={14} className="text-[#1c3d22]" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
              Zimbabwe's #1 Talent Discovery Platform
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-gray-900 leading-none">
            Identify. Nurture.{" "}
            <span className="text-[#1c3d22] border-b-4 border-[#f0b429]">Market.</span>
          </h1>
          <p className="text-sm sm:text-base font-semibold text-zinc-600 max-w-2xl mx-auto leading-relaxed">
            AI-powered athletic scoring, personalised training curricula, and a
            digital Talent Passport built to get African grassroots athletes
            discovered by scouts — with nothing but a smartphone.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link
              href="/register"
              className="bg-[#f0b429] text-[#1c3d22] border-2 border-[#1c3d22] px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              Get Started <ChevronRight size={14} />
            </Link>
            <Link
              href="/talent-leaderboard"
              className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-3xs"
            >
              Discover Talent <Users size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Core goals: Identify · Nurture · Market ────────────────────────── */}
      <CoreGoals />

      {/* ── Video upload ───────────────────────────────────────────────────── */}
      <VideoUpload />

      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-12">

        {/* ── Ecosystem quick-links ─────────────────────────────────────────── */}
        <section className="space-y-2">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
            Platform quick-links
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/athlete/scan"
              className="bg-white border border-gray-200 hover:border-[#1c3d22] p-4 rounded-2xl flex items-center justify-between group shadow-3xs transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-amber-50 text-[#c8962a]">
                  <Camera size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wide">
                    Biometric Testing
                  </h4>
                  <p className="text-[11px] text-gray-400 font-semibold truncate">
                    6 tests · AQ score · position profile
                  </p>
                </div>
              </div>
              <ArrowRight size={14} className="text-gray-300 group-hover:text-[#1c3d22] transition-colors shrink-0" />
            </Link>

            <Link
              href="/player/drills"
              className="bg-white border border-gray-200 hover:border-[#1c3d22] p-4 rounded-2xl flex items-center justify-between group shadow-3xs transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700">
                  <Dumbbell size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wide">
                    Drill Library
                  </h4>
                  <p className="text-[11px] text-gray-400 font-semibold truncate">
                    125 drills · unlocks as you improve
                  </p>
                </div>
              </div>
              <ArrowRight size={14} className="text-gray-300 group-hover:text-[#1c3d22] transition-colors shrink-0" />
            </Link>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/player/talent-id"
                className="bg-white border border-gray-200 hover:border-[#1c3d22] p-4 rounded-2xl flex items-center justify-between group shadow-3xs transition-all"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-2 rounded-xl bg-green-50 text-green-700">
                    <IdCard size={14} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[10px] font-black text-gray-900 uppercase">Passport</h4>
                  </div>
                </div>
                <ArrowRight size={12} className="text-gray-300 group-hover:text-[#1c3d22]" />
              </Link>
              <Link
                href="/arena"
                className="bg-white border border-gray-200 hover:border-[#1c3d22] p-4 rounded-2xl flex items-center justify-between group shadow-3xs transition-all"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                    <Globe2 size={14} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[10px] font-black text-gray-900 uppercase">Arena</h4>
                  </div>
                </div>
                <ArrowRight size={12} className="text-gray-300 group-hover:text-[#1c3d22]" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Sport grid ────────────────────────────────────────────────────── */}
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 space-y-6 shadow-3xs">
          <div className="text-center max-w-md mx-auto space-y-1">
            <Globe size={28} className="mx-auto text-[#1c3d22]" />
            <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">
              All Sports. One Platform.
            </h2>
            <p className="text-xs text-gray-400 font-semibold">
              Our scoring engine maps athletic performance across multi-sport streams.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {["Football", "Athletics", "Rugby", "Netball", "Basketball", "Swimming", "Tennis", "Boxing"].map(
              (sport) => (
                <div
                  key={sport}
                  className="p-3.5 bg-[#f0f9e8]/50 text-[#1c3d22] border border-[#e2f0d9] font-black text-xs rounded-xl uppercase tracking-wide"
                >
                  {sport}
                </div>
              )
            )}
          </div>
        </section>

        {/* ── Leaderboard ───────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                Top National Talent
              </h2>
              <p className="text-xs text-gray-400 font-semibold">
                Verified profiles receiving active scout evaluations
              </p>
            </div>
            <Link
              href="/talent-leaderboard"
              className="text-[#1c3d22] hover:text-emerald-800 font-black text-xs uppercase tracking-wider flex items-center gap-0.5 underline"
            >
              Full leaderboard <ChevronRight size={14} />
            </Link>
          </div>

          {talentsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse border" />
              ))}
            </div>
          ) : topTalents.length === 0 ? (
            <div className="text-center py-6 border border-dashed text-xs text-gray-400 italic rounded-2xl bg-white">
              No leaderboard entries yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topTalents.map((athlete, index) => (
                <div
                  key={athlete.id}
                  className="bg-white rounded-2xl p-4 border border-gray-200 flex items-center justify-between gap-4 shadow-3xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#e2f0d9] flex items-center justify-center text-[#1c3d22] font-black text-xs border border-[#1c3d22]/10">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-sm uppercase">
                        {athlete.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase mt-0.5">
                        <span>{athlete.sport}</span>
                        <span>•</span>
                        <MapPin size={10} className="text-gray-300" />
                        <span>{athlete.province}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-[#1c3d22] leading-none">
                      {athlete.score}th
                    </p>
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">
                      Percentile
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* ── World Cup banner ──────────────────────────────────────────────── */}
      <WorldCupBanner />

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white py-8 text-center px-4">
        <Award size={32} className="mx-auto text-[#1c3d22] mb-2" />
        <p className="text-[10px] font-black text-gray-800 uppercase tracking-widest">
          Grassroots Sports Development Network © 2026 · Identify, Nurture, and Market Talent
        </p>
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1">
          Zimbabwe's First AI-Powered Multi-Sport Talent Discovery Platform
        </p>
      </footer>
    </div>
  );
}
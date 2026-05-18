"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Download, ExternalLink, Award, GraduationCap, Film,
  MapPin, Shield, Star, Loader2, BookOpen, Users,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PublicProfile {
  id: string;
  first_name: string;
  surname: string;
  position: string;
  sport: string;
  province: string;
  age_group: string;
  height_cm: number | null;
  weight_kg: number | null;
  dominant_foot: string | null;
  avatar_url: string | null;
  bio: string | null;
  overall_score: number | null;
  club: string | null;
  school: string | null;
  ai_narrative: string | null;
  scout_visible: boolean;
  // Passport-specific fields (added via migration)
  school_name?: string | null;
  grade_level?: string | null;
  academic_average?: string | null;
  academic_year?: string | null;
  coach_endorsements?: Endorsement[] | null;
}

interface Endorsement {
  coachName: string;
  role: string;
  comment: string;
}

interface ShowcaseClip {
  id: string;
  skill_type: string;
  ai_rating: number;
  top_strength: string | null;
  scout_note: string | null;
  view_count: number;
}

interface SimilarStylePlayer {
  matched_player_id: string;
  similarity_score: number;
  position: string | null;
  province: string | null;
  initials: string;
}

// ─── Rating bar ───────────────────────────────────────────────────────────────
function RatingBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round((value / 10) * 100);
  return (
    <div className="mb-2">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="capitalize text-white/70">{label}</span>
        <span className="font-bold text-[#f0b429]">{value.toFixed(1)}/10</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10">
        <div
          className="h-1.5 rounded-full bg-[#f0b429]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function Section({ icon: Icon, title, children }: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#f0b429]" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#f0b429]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PublicPassportPage() {
  const params = useParams();
  const id = params?.id as string;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [clips, setClips] = useState<ShowcaseClip[]>([]);
  const [similar, setSimilar] = useState<SimilarStylePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [exporting, setExporting] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

  useEffect(() => {
    if (!id) return;
    Promise.allSettled([
      fetch(`${API}/player/public/${id}`).then((r) => {
        if (!r.ok) throw new Error("not_found");
        return r.json();
      }),
      fetch(`${API}/showcase/discover?user_id=${id}&per_page=6`).then((r) => r.json()).catch(() => null),
      fetch(`${API}/chemistry/public-similar/${id}`).then((r) => r.ok ? r.json() : null).catch(() => null),
    ]).then(([profResult, clipsResult, similarResult]) => {
      if (profResult.status === "fulfilled") {
        const raw = profResult.value;
        setProfile(raw.data ?? raw);
      } else {
        setNotFound(true);
      }
      if (clipsResult.status === "fulfilled" && clipsResult.value) {
        const _r = clipsResult.value?.data?.data ?? clipsResult.value?.data ?? clipsResult.value;
        setClips(Array.isArray(_r) ? _r : []);
      }
      if (similarResult.status === "fulfilled" && similarResult.value) {
        const _s = similarResult.value?.data ?? similarResult.value;
        setSimilar(Array.isArray(_s) ? _s.slice(0, 3) : []);
      }
    }).finally(() => setLoading(false));
  }, [id, API]);

  const exportPDF = async () => {
    if (!profile) return;
    setExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210;
      let y = 0;

      // Header
      doc.setFillColor(26, 92, 42);
      doc.rect(0, 0, W, 38, "F");
      doc.setFillColor(240, 180, 41);
      doc.rect(0, 36, W, 2, "F");

      doc.setTextColor(240, 180, 41);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("TALENT PASSPORT — GRASSROOTS SPORTS ZIMBABWE", W / 2, 12, { align: "center" });

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text(`${profile.first_name} ${profile.surname}`.toUpperCase(), W / 2, 24, { align: "center" });

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`${profile.position} · ${profile.sport} · ${profile.province}`, W / 2, 32, { align: "center" });

      y = 48;

      const gold = () => { doc.setTextColor(180, 120, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(9); };
      const body = () => { doc.setTextColor(40, 40, 40); doc.setFont("helvetica", "normal"); doc.setFontSize(9); };
      const newPage = () => { doc.addPage(); y = 20; };
      const checkPage = (needed = 12) => { if (y + needed > 275) newPage(); };

      // Identity
      gold(); doc.text("PLAYER IDENTITY", 15, y); y += 5;
      body();
      const idLines = [
        `Position: ${profile.position}`,
        `Sport: ${profile.sport}`,
        `Province: ${profile.province}`,
        `Age Group: ${profile.age_group?.toUpperCase() ?? "—"}`,
        profile.club ? `Club: ${profile.club}` : null,
        profile.height_cm ? `Height: ${profile.height_cm} cm` : null,
        profile.weight_kg ? `Weight: ${profile.weight_kg} kg` : null,
        profile.dominant_foot ? `Dominant Foot: ${profile.dominant_foot}` : null,
      ].filter(Boolean) as string[];
      idLines.forEach((l) => { checkPage(); doc.text(l, 20, y); y += 5; });
      y += 3;

      // AI Summary
      if (profile.ai_narrative) {
        checkPage(20);
        gold(); doc.text("AI PERFORMANCE SUMMARY (Generated by THUTO)", 15, y); y += 5;
        body();
        const wrapped = doc.splitTextToSize(profile.ai_narrative, W - 35);
        wrapped.forEach((line: string) => { checkPage(); doc.text(line, 20, y); y += 5; });
        y += 3;
      }

      // Academic
      const hasAcademic = profile.school_name || profile.grade_level || profile.academic_average;
      if (hasAcademic) {
        checkPage(15);
        gold(); doc.text("ACADEMIC STANDING", 15, y); y += 5;
        body();
        if (profile.school_name) { doc.text(`School: ${profile.school_name}`, 20, y); y += 5; }
        if (profile.grade_level) { doc.text(`Grade / Level: ${profile.grade_level}`, 20, y); y += 5; }
        if (profile.academic_average) { doc.text(`Academic Average: ${profile.academic_average}`, 20, y); y += 5; }
        if (profile.academic_year) { doc.text(`Year: ${profile.academic_year}`, 20, y); y += 5; }
        y += 3;
      }

      // Endorsements
      const endorsements: Endorsement[] = Array.isArray(profile.coach_endorsements)
        ? profile.coach_endorsements
        : [];
      if (endorsements.length > 0) {
        checkPage(15);
        gold(); doc.text("COACH ENDORSEMENTS", 15, y); y += 5;
        body();
        endorsements.forEach((e) => {
          checkPage(15);
          doc.setFont("helvetica", "bold"); doc.text(`${e.coachName} — ${e.role}`, 20, y); y += 5;
          doc.setFont("helvetica", "italic");
          const lines = doc.splitTextToSize(`"${e.comment}"`, W - 35);
          lines.forEach((l: string) => { checkPage(); doc.text(l, 20, y); y += 5; });
          y += 2;
        });
        y += 3;
      }

      // Showcase clips
      if (clips.length > 0) {
        checkPage(15);
        gold(); doc.text("VIDEO HIGHLIGHTS", 15, y); y += 5;
        body();
        clips.forEach((c) => {
          checkPage(8);
          doc.text(`• ${c.skill_type.charAt(0).toUpperCase() + c.skill_type.slice(1)} — Rating: ${c.ai_rating?.toFixed(1) ?? "—"}/10`, 20, y); y += 5;
          if (c.top_strength) {
            const lines = doc.splitTextToSize(`  ${c.top_strength}`, W - 35);
            lines.forEach((l: string) => { checkPage(); doc.setFont("helvetica", "italic"); doc.text(l, 20, y); y += 4; });
            doc.setFont("helvetica", "normal");
          }
        });
        y += 3;
      }

      // Footer
      const footerY = 287;
      doc.setFillColor(26, 92, 42);
      doc.rect(0, footerY - 6, W, 10, "F");
      doc.setTextColor(240, 180, 41);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(
        `grassrootssports.live/passport/${id}  ·  Generated by GrassRoots Sports AI  ·  Confidential`,
        W / 2,
        footerY,
        { align: "center" }
      );

      doc.save(`${profile.first_name}-${profile.surname}-talent-passport.pdf`.toLowerCase());
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a5c2a]">
        <Loader2 className="h-8 w-8 animate-spin text-[#f0b429]" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#1a5c2a] text-white">
        <Shield className="h-12 w-12 text-white/30" />
        <p className="text-lg font-semibold">Passport not found</p>
        <p className="text-sm text-white/60">This player may not have a public passport yet.</p>
        <Link href="/" className="mt-2 rounded-lg bg-[#f0b429] px-5 py-2 text-sm font-bold text-[#1a3a1a]">
          Go to GrassRoots Sports
        </Link>
      </div>
    );
  }

  const initials = `${profile.first_name?.[0] ?? ""}${profile.surname?.[0] ?? ""}`.toUpperCase();
  const endorsements: Endorsement[] = Array.isArray(profile.coach_endorsements)
    ? profile.coach_endorsements
    : [];

  return (
    <div className="min-h-screen bg-[#1a5c2a]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(-45deg,transparent 0px,transparent 8px,rgba(180,160,0,0.05) 8px,rgba(180,160,0,0.05) 10px)," +
          "repeating-linear-gradient(45deg,transparent 0px,transparent 8px,rgba(180,160,0,0.05) 8px,rgba(180,160,0,0.05) 10px)",
      }}
    >
      <div className="mx-auto max-w-lg px-4 py-8">

        {/* Header brand */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#f0b429]">GrassRoots Sports</p>
            <p className="text-xs text-white/50">Zimbabwe's AI Sports Platform</p>
          </div>
          <Link href="/" className="flex items-center gap-1 rounded-lg bg-[#f0b429] px-3 py-1.5 text-xs font-bold text-[#1a3a1a]">
            <ExternalLink className="h-3 w-3" />
            Join Platform
          </Link>
        </div>

        {/* Identity card */}
        <div className="mb-5 rounded-2xl border border-[#f0b429]/30 bg-[#0d2b1a] p-6 text-center shadow-xl">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-[#f0b429] text-2xl font-black text-[#1a3a1a]">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={initials} className="h-20 w-20 rounded-full object-cover" />
            ) : initials}
          </div>
          <h1 className="text-xl font-black text-white">{profile.first_name} {profile.surname}</h1>
          <p className="mt-0.5 text-sm font-semibold text-[#f0b429]">{profile.position} · {profile.sport}</p>
          <div className="mt-1 flex items-center justify-center gap-1 text-xs text-white/60">
            <MapPin className="h-3 w-3" />
            {profile.province} · {profile.age_group?.toUpperCase()}
          </div>
          {profile.club && <p className="mt-1 text-xs text-white/50">{profile.club}</p>}

          {profile.overall_score && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#f0b429]/15 px-3 py-1">
              <Star className="h-3.5 w-3.5 text-[#f0b429]" />
              <span className="text-xs font-bold text-[#f0b429]">Overall Score: {profile.overall_score}/100</span>
            </div>
          )}

          {/* Physical stats */}
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
            {[
              { label: "Height", value: profile.height_cm ? `${profile.height_cm}cm` : "—" },
              { label: "Weight", value: profile.weight_kg ? `${profile.weight_kg}kg` : "—" },
              { label: "Foot", value: profile.dominant_foot ?? "—" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-white/40">{label}</p>
                <p className="text-sm font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm italic text-white/70">
            &ldquo;{profile.bio}&rdquo;
          </div>
        )}

        {/* AI Summary */}
        {profile.ai_narrative && (
          <Section icon={Award} title="AI Performance Summary">
            <p className="text-sm leading-relaxed text-white/80">{profile.ai_narrative}</p>
            <p className="mt-2 text-xs text-white/40">Generated by THUTO AI · GrassRoots Sports</p>
          </Section>
        )}

        {/* Academic Standing */}
        {(profile.school_name || profile.grade_level || profile.academic_average) && (
          <Section icon={GraduationCap} title="Academic Standing">
            <div className="grid grid-cols-2 gap-3">
              {profile.school_name && (
                <div>
                  <p className="text-xs text-white/40">School</p>
                  <p className="text-sm font-semibold text-white">{profile.school_name}</p>
                </div>
              )}
              {profile.grade_level && (
                <div>
                  <p className="text-xs text-white/40">Grade / Level</p>
                  <p className="text-sm font-semibold text-white">{profile.grade_level}</p>
                </div>
              )}
              {profile.academic_average && (
                <div>
                  <p className="text-xs text-white/40">Academic Average</p>
                  <p className="text-sm font-bold text-[#f0b429]">{profile.academic_average}</p>
                </div>
              )}
              {profile.academic_year && (
                <div>
                  <p className="text-xs text-white/40">Year</p>
                  <p className="text-sm font-semibold text-white">{profile.academic_year}</p>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Coach Endorsements */}
        {endorsements.length > 0 && (
          <Section icon={Shield} title="Coach Endorsements">
            <div className="space-y-4">
              {endorsements.map((e, i) => (
                <div key={i} className="border-l-2 border-[#f0b429]/40 pl-3">
                  <p className="text-xs font-bold text-white">{e.coachName}</p>
                  <p className="text-xs text-white/50">{e.role}</p>
                  <p className="mt-1 text-sm italic text-white/70">&ldquo;{e.comment}&rdquo;</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Video Highlights */}
        {clips.length > 0 && (
          <Section icon={Film} title="Video Highlights">
            <div className="space-y-3">
              {clips.map((clip) => (
                <div key={clip.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-[#f0b429]/15 px-2 py-0.5 text-xs font-semibold capitalize text-[#f0b429]">
                      {clip.skill_type}
                    </span>
                    <span className="text-xs text-white/40">{clip.view_count} views</span>
                  </div>
                  {clip.ai_rating && <RatingBar label={clip.skill_type} value={clip.ai_rating} />}
                  {clip.scout_note && (
                    <p className="mt-1 text-xs italic text-white/60">&ldquo;{clip.scout_note}&rdquo;</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Similar Style Players */}
        {similar.length > 0 && (
          <Section icon={Users} title="Similar Style Players">
            <div className="mb-2 flex items-center gap-1.5">
              <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-300">
                Style Compatibility v1
              </span>
              <span className="text-[10px] text-white/30">· Full Chemistry Rating coming soon</span>
            </div>
            <div className="space-y-3">
              {similar.map((p) => (
                <div key={p.matched_player_id} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#1a5c2a]/60 border border-white/10 text-xs font-bold text-[#f0b429]">
                    {p.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {p.position && (
                          <span className="text-xs text-white/60 capitalize">{p.position}</span>
                        )}
                        {p.province && (
                          <span className="flex items-center gap-0.5 text-[10px] text-white/40">
                            <MapPin className="h-2.5 w-2.5" />{p.province}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-[#f0b429] flex-shrink-0">
                        {Math.round(p.similarity_score)}%
                      </span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-purple-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, p.similarity_score)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-white/25 text-center">
              Anonymised · calculated from training style data
            </p>
          </Section>
        )}

        {/* Actions */}
        <div className="mb-8 flex gap-3">
          <button
            onClick={exportPDF}
            disabled={exporting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#f0b429] py-3 text-sm font-bold text-[#1a3a1a] disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? "Generating PDF…" : "Download Passport PDF"}
          </button>
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-[#f0b429]/20 bg-[#0d2b1a] p-5 text-center">
          <BookOpen className="mx-auto mb-2 h-6 w-6 text-[#f0b429]" />
          <p className="text-sm font-bold text-white">Discover Zimbabwe&apos;s Athletes</p>
          <p className="mt-0.5 text-xs text-white/60">GrassRoots Sports — AI-Powered Talent Discovery</p>
          <Link
            href="/"
            className="mt-3 inline-block rounded-lg bg-[#f0b429] px-5 py-2 text-xs font-bold text-[#1a3a1a]"
          >
            Join Free — grassrootssports.live
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-white/30">
          Train Anywhere in Zimbabwe. Use AI to Get Recognised. 🇿🇼
        </p>
      </div>
    </div>
  );
}

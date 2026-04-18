"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Trophy, MapPin, Shield, Star, Globe, ArrowLeft,
  CheckCircle2, UserCircle2, BookOpen, Award,
} from "lucide-react";

interface TournamentPlayerProfile {
  id: string;
  regId: string;
  clubName: string;
  ageGroup: "U14" | "U16";
  gender: "Boys" | "Girls";
  name: string;
  position: string;
  age: string;
  school: string;
  openForScouting: boolean;
  scholarshipEligible: boolean;
  registeredAt: string;
}

interface PlayerStats {
  goals?: number;
  assists?: number;
  minutesPlayed?: number;
  yellowCards?: number;
  redCards?: number;
  saves?: number;     // GK only
  cleanSheets?: number;
  coachNote?: string;
  matchesPlayed?: number;
}

const POSITION_FULL: Record<string, string> = {
  GK: "Goalkeeper", CB: "Centre Back", LB: "Left Back", RB: "Right Back",
  CDM: "Defensive Midfielder", CM: "Central Midfielder", CAM: "Attacking Midfielder",
  LW: "Left Winger", RW: "Right Winger", ST: "Striker",
};

export default function TournamentPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<TournamentPlayerProfile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Load from localStorage
    try {
      const raw = localStorage.getItem("munhumutapa_2026_player_profiles");
      if (raw) {
        const profiles: TournamentPlayerProfile[] = JSON.parse(raw);
        const found = profiles.find((p) => p.id === id);
        if (found) {
          setPlayer(found);
        } else {
          setNotFound(true);
        }
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    }

    // Load stats if any have been entered
    try {
      const rawStats = localStorage.getItem(`munhumutapa_2026_stats_${id}`);
      if (rawStats) setStats(JSON.parse(rawStats));
    } catch { /* ok */ }
  }, [id]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#0a1f0e] flex items-center justify-center px-5">
        <div className="text-center">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-white/20" />
          <h2 className="text-lg font-bold text-white">Player profile not found</h2>
          <p className="mt-2 text-sm text-white/50">
            This QR card may have been generated on a different device.<br />
            The coach who registered the club can view QR cards from their phone.
          </p>
          <Link
            href="/tournaments/munhumutapa-2026"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#f0b429] px-5 py-3 text-sm font-bold text-[#0a1f0e]"
          >
            <ArrowLeft className="h-4 w-4" /> Tournament Page
          </Link>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-[#0a1f0e] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f0b429] border-t-transparent" />
      </div>
    );
  }

  const isGK = player.position === "GK";
  const positionFull = POSITION_FULL[player.position] ?? player.position;

  return (
    <div className="min-h-screen bg-[#0a1f0e]">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0D4A1F] to-[#0a1f0e] px-5 pb-8 pt-10">
        {/* Gold chevron pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-5"
          style={{ backgroundImage: "repeating-linear-gradient(-45deg,#f0b429 0,#f0b429 1px,transparent 0,transparent 50%)", backgroundSize: "12px 12px" }}
        />

        {/* Back link */}
        <div className="relative mb-6 flex items-center justify-between">
          <Link href="/tournaments/munhumutapa-2026" className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Tournament
          </Link>
          <div className="rounded-xl border border-[#f0b429]/30 bg-[#f0b429]/10 px-3 py-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#f0b429]">Munhumutapa 2026</p>
          </div>
        </div>

        {/* Avatar + name */}
        <div className="relative text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-[#f0b429]/10 ring-2 ring-[#f0b429]/40">
            <UserCircle2 className="h-14 w-14 text-[#f0b429]/60" />
          </div>

          <h1 className="text-2xl font-black text-white">{player.name}</h1>
          <p className="mt-1 text-sm font-semibold text-[#f0b429]">{positionFull}</p>

          {/* Badges */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f0b429]/20 px-2.5 py-1 text-xs font-semibold text-[#f0b429]">
              <Trophy className="h-3 w-3" /> {player.ageGroup} {player.gender}
            </span>
            {player.openForScouting && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-semibold text-green-400">
                <CheckCircle2 className="h-3 w-3" /> Open for Scouting
              </span>
            )}
            {player.scholarshipEligible && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-2.5 py-1 text-xs font-semibold text-purple-300">
                <Star className="h-3 w-3" /> Scholarship Eligible
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 pb-16 pt-6 space-y-5">

        {/* ── Info card ─────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Player Details</p>

          {[
            { icon: Shield,  label: "Club",       value: player.clubName },
            { icon: BookOpen,label: "School",     value: player.school },
            { icon: MapPin,  label: "Province",   value: "Harare" },
            { icon: Award,   label: "Age Group",  value: `${player.ageGroup} (Age ${player.age})` },
            { icon: Trophy,  label: "Tournament", value: "Munhumutapa Challenge Cup 2026" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon className="h-4 w-4 flex-shrink-0 text-[#f0b429]/60" />
              <span className="w-24 text-xs text-white/40">{label}</span>
              <span className="text-sm font-medium text-white">{value || "—"}</span>
            </div>
          ))}
        </div>

        {/* ── Stats card ────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-white/40">
            Tournament Statistics
          </p>

          {stats ? (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Matches",  value: stats.matchesPlayed ?? 0 },
                ...(!isGK ? [
                  { label: "Goals",    value: stats.goals ?? 0 },
                  { label: "Assists",  value: stats.assists ?? 0 },
                ] : [
                  { label: "Saves",    value: stats.saves ?? 0 },
                  { label: "Clean Sh.",value: stats.cleanSheets ?? 0 },
                ]),
                { label: "Mins",     value: stats.minutesPlayed ?? 0 },
                { label: "Yellow",   value: stats.yellowCards ?? 0 },
                { label: "Red",      value: stats.redCards ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-white/5 p-3 text-center">
                  <p className="text-xl font-bold text-white">{value}</p>
                  <p className="text-[10px] text-white/40">{label}</p>
                </div>
              ))}

              {stats.coachNote && (
                <div className="col-span-3 mt-2 rounded-xl border border-[#f0b429]/20 bg-[#f0b429]/5 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#f0b429] mb-1">Coach&apos;s Note</p>
                  <p className="text-sm text-white/80 italic">&quot;{stats.coachNote}&quot;</p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
              <p className="text-sm text-white/30">Statistics will appear here after the tournament begins</p>
            </div>
          )}
        </div>

        {/* ── Girls scholarship section ──────────────────────────────────────── */}
        {player.scholarshipEligible && (
          <div className="rounded-2xl border border-purple-500/30 bg-purple-900/10 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20">
                <Globe className="h-4 w-4 text-purple-300" />
              </div>
              <div>
                <p className="font-bold text-purple-200">International Scholarship Visibility</p>
                <p className="mt-1 text-sm text-purple-300/70 leading-relaxed">
                  This player&apos;s profile is visible to international scouts and scholarship
                  programmes participating in the Munhumutapa Challenge Cup 2026.
                  Scouts from regional and international academies can view this page
                  by scanning the player&apos;s QR card.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Scout contact CTA ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[#f0b429]/20 bg-[#f0b429]/5 p-5 text-center space-y-3">
          <p className="text-sm font-bold text-[#f0b429]">Scout or Coach interested in this player?</p>
          <p className="text-xs text-white/50">
            Contact the club through the tournament organisers at the event,
            or create a free account to add this player to your shortlist.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-[#f0b429] px-5 py-2.5 text-sm font-bold text-[#0a1f0e]"
          >
            <Star className="h-4 w-4" /> Create Scout Account — Free
          </Link>
        </div>

        {/* ── Platform CTA ──────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center space-y-2">
          <p className="text-xs text-white/40">
            Player — claim this profile and take control of your career
          </p>
          <Link
            href="/register"
            className="inline-block text-sm font-semibold text-[#f0b429] hover:underline"
          >
            Join Grassroots Sports — Free →
          </Link>
          <p className="text-[10px] text-white/20">
            Build your full profile, upload skill videos, and be found by scouts worldwide
          </p>
        </div>

      </div>
    </div>
  );
}

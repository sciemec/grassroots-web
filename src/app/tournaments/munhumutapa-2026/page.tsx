"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy, MapPin, Calendar, Users, CheckCircle2, Shield,
  Phone, Loader2, Plus, Trash2, Download, Share2, ChevronRight,
  Star, Globe, QrCode,
} from "lucide-react";
import { QRProfileCard } from "@/components/ui/qr-profile-card";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TournamentPlayer {
  name: string;
  age: string;
  position: string;
  school: string;
}

interface ClubRegistration {
  id: string;
  club_name: string;
  age_group: "U14" | "U16";
  gender: "Boys" | "Girls";
  coach_name: string;
  coach_phone: string;
  coach_whatsapp: string;
  players: TournamentPlayer[];
  registered_at: string;
}

type Step = "details" | "players" | "confirm" | "done";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TournamentPlayerProfile {
  id: string;           // e.g. MCC2026-abc123-0
  regId: string;
  clubName: string;
  ageGroup: "U14" | "U16";
  gender: "Boys" | "Girls";
  name: string;
  position: string;
  age: string;
  school: string;
  openForScouting: boolean;
  scholarshipEligible: boolean;  // true for all Girls
  registeredAt: string;
}

// ── localStorage ──────────────────────────────────────────────────────────────

const LS_ALL      = "munhumutapa_2026_registrations";
const LS_MINE     = "munhumutapa_2026_my_registration";
const LS_PROFILES = "munhumutapa_2026_player_profiles";

function loadAll(): ClubRegistration[] {
  try { return JSON.parse(localStorage.getItem(LS_ALL) ?? "[]"); } catch { return []; }
}

function loadProfiles(): TournamentPlayerProfile[] {
  try { return JSON.parse(localStorage.getItem(LS_PROFILES) ?? "[]"); } catch { return []; }
}

function saveReg(reg: ClubRegistration) {
  const all = loadAll().filter(r => r.id !== reg.id);
  localStorage.setItem(LS_ALL,  JSON.stringify([...all, reg]));
  localStorage.setItem(LS_MINE, JSON.stringify(reg));

  // Create individual player profiles
  const shortId = reg.id.slice(-6);
  const existing = loadProfiles().filter(p => p.regId !== reg.id);
  const newProfiles: TournamentPlayerProfile[] = reg.players.map((p, i) => ({
    id:                  `MCC2026-${shortId}-${i}`,
    regId:               reg.id,
    clubName:            reg.club_name,
    ageGroup:            reg.age_group,
    gender:              reg.gender,
    name:                p.name,
    position:            p.position,
    age:                 p.age,
    school:              p.school || reg.club_name,
    openForScouting:     true,
    scholarshipEligible: reg.gender === "Girls",
    registeredAt:        reg.registered_at,
  }));
  localStorage.setItem(LS_PROFILES, JSON.stringify([...existing, ...newProfiles]));
}

// ── Constants ─────────────────────────────────────────────────────────────────

const POSITIONS = ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"];

const EMPTY_PLAYER = (): TournamentPlayer => ({ name: "", age: "", position: "", school: "" });

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MunhumutapaPage() {
  const [allRegs, setAllRegs]     = useState<ClubRegistration[]>([]);
  const [myReg, setMyReg]         = useState<ClubRegistration | null>(null);
  const [showForm, setShowForm]   = useState(false);
  const [step, setStep]           = useState<Step>("details");
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [clubName, setClubName]         = useState("");
  const [ageGroup, setAgeGroup]         = useState<"U14" | "U16">("U16");
  const [gender, setGender]             = useState<"Boys" | "Girls">("Boys");
  const [coachName, setCoachName]       = useState("");
  const [coachPhone, setCoachPhone]     = useState("");
  const [coachWA, setCoachWA]           = useState("");
  const [players, setPlayers]           = useState<TournamentPlayer[]>(
    Array.from({ length: 16 }, EMPTY_PLAYER)
  );

  useEffect(() => {
    setAllRegs(loadAll());
    try {
      const mine = localStorage.getItem(LS_MINE);
      if (mine) setMyReg(JSON.parse(mine));
    } catch { /* ok */ }
  }, []);

  const filledPlayers = players.filter(p => p.name.trim());

  const updatePlayer = (i: number, field: keyof TournamentPlayer, val: string) =>
    setPlayers(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p));

  const addRow = () => setPlayers(prev => [...prev, EMPTY_PLAYER()]);
  const removeRow = (i: number) => setPlayers(prev => prev.filter((_, idx) => idx !== i));

  const detailsValid = clubName.trim() && coachName.trim() && coachPhone.trim();
  const playersValid = filledPlayers.length >= 7;

  const handleSubmit = async () => {
    setSubmitting(true);
    const reg: ClubRegistration = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      club_name:     clubName.trim(),
      age_group:     ageGroup,
      gender,
      coach_name:    coachName.trim(),
      coach_phone:   coachPhone.trim(),
      coach_whatsapp: coachWA.trim() || coachPhone.trim(),
      players:       filledPlayers,
      registered_at: new Date().toISOString(),
    };

    saveReg(reg);
    setMyReg(reg);
    setAllRegs(loadAll());

    // Best-effort backend sync
    try {
      await fetch("/api/tournaments/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(reg),
      });
    } catch { /* localStorage is source of truth */ }

    setSubmitting(false);
    setStep("done");
  };

  const shareViaWhatsApp = () => {
    const text = `🏆 Register for the Munhumutapa Challenge Cup 2026!\n\nU14 & U16 | Boys & Girls | Open to Clubs & Schools Across Zimbabwe\n\nRegister free at:\nhttps://grassrootssports.live/tournaments/munhumutapa-2026`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  return (
    <div className="min-h-screen bg-[#0a1f0e]">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0D4A1F] to-[#0a1f0e] px-5 pb-10 pt-12">

        {/* Co-branding */}
        <div className="relative mb-6 flex items-center justify-between">
          <div className="rounded-xl border border-[#f0b429]/30 bg-[#f0b429]/10 px-3 py-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#f0b429]">Zimbabwe · Open National</p>
          </div>
          <div className="rounded-xl border border-[#f0b429]/20 bg-white/5 px-3 py-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Grassroots Sports</p>
          </div>
        </div>

        {/* Trophy + title */}
        <div className="relative text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#f0b429]/10 ring-2 ring-[#f0b429]/40">
            <Trophy className="h-10 w-10 text-[#f0b429]" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-wide text-white">
            Munhumutapa<br />Challenge Cup 2026
          </h1>
          <p className="mt-2 text-sm font-semibold text-[#f0b429]">Open to Clubs &amp; Schools Across Zimbabwe</p>

          {/* Category pills */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {["U14 Boys", "U16 Boys", "U14 Girls", "U16 Girls"].map(c => (
              <span key={c} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">{c}</span>
            ))}
          </div>
        </div>

      </div>

      <div className="px-5 pb-16 space-y-6 pt-6">

        {/* ── My registration (returning user) ─────────────────────────────── */}
        {myReg && step !== "done" && (
          <div className="rounded-2xl border border-green-500/30 bg-green-900/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <p className="text-sm font-bold text-green-300">Your club is registered!</p>
            </div>
            <p className="text-xs text-white/60">{myReg.club_name} · {myReg.age_group} {myReg.gender} · {myReg.players.length} players</p>
            <p className="mt-2 text-xs text-white/40">Registered {new Date(myReg.registered_at).toLocaleDateString("en-GB")}</p>
          </div>
        )}

        {/* ── Registration CTA ──────────────────────────────────────────────── */}
        {!showForm && step !== "done" && (
          <div className="space-y-3">
            <button
              onClick={() => setShowForm(true)}
              className="w-full rounded-2xl bg-[#f0b429] py-4 text-sm font-black uppercase tracking-wide text-[#0a1f0e] transition-opacity hover:opacity-90"
            >
              Register Your Club Online — Free
            </button>
            <button
              onClick={shareViaWhatsApp}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#f0b429]/10 bg-white/5 py-3 text-sm font-semibold text-white"
            >
              <Share2 className="h-4 w-4 text-green-400" />
              Share Registration Link via WhatsApp
            </button>
          </div>
        )}

        {/* ── Registration Form ─────────────────────────────────────────────── */}
        {showForm && step !== "done" && (
          <div className="rounded-2xl border border-[#f0b429]/10 bg-white/5 p-5">

            {/* Step indicator */}
            <div className="mb-5 flex items-center gap-2">
              {(["details", "players", "confirm"] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    step === s ? "bg-[#f0b429] text-[#0a1f0e]" :
                    ["details", "players", "confirm"].indexOf(step) > i ? "bg-green-500 text-white" :
                    "bg-white/10 text-white/40"
                  }`}>{i + 1}</div>
                  {i < 2 && <div className="h-px flex-1 bg-white/10" />}
                </div>
              ))}
            </div>

            {/* ── Step 1: Club Details ── */}
            {step === "details" && (
              <div className="space-y-4">
                <h2 className="font-bold text-white">Club Details</h2>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-white/60">Club / School Name *</label>
                  <input
                    value={clubName}
                    onChange={e => setClubName(e.target.value)}
                    placeholder="e.g. Harare City FC, Churchill High School"
                    className="w-full rounded-xl border border-[#f0b429]/10 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:ring-1 focus:ring-[#f0b429]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-white/60">Team Category *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { ag: "U14", g: "Boys",  label: "U14 Boys",  emoji: "⚽" },
                      { ag: "U14", g: "Girls", label: "U14 Girls", emoji: "⚽" },
                      { ag: "U16", g: "Boys",  label: "U16 Boys",  emoji: "⚽" },
                      { ag: "U16", g: "Girls", label: "U16 Girls", emoji: "⚽" },
                    ] as { ag: "U14"|"U16"; g: "Boys"|"Girls"; label: string; emoji: string }[]).map(({ ag, g, label, emoji }) => {
                      const active = ageGroup === ag && gender === g;
                      return (
                        <button
                          key={label}
                          onClick={() => { setAgeGroup(ag); setGender(g); }}
                          className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-colors ${
                            active
                              ? "bg-[#f0b429] text-[#0a1f0e]"
                              : "border border-[#f0b429]/10 bg-white/5 text-white/60 hover:bg-white/10"
                          }`}
                        >
                          <span>{emoji}</span>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-white/60">Coach / Official Name *</label>
                  <input
                    value={coachName}
                    onChange={e => setCoachName(e.target.value)}
                    placeholder="Full name"
                    className="w-full rounded-xl border border-[#f0b429]/10 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:ring-1 focus:ring-[#f0b429]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-white/60">Phone Number *</label>
                  <input
                    value={coachPhone}
                    onChange={e => setCoachPhone(e.target.value)}
                    placeholder="07X XXX XXXX"
                    type="tel"
                    className="w-full rounded-xl border border-[#f0b429]/10 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:ring-1 focus:ring-[#f0b429]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-white/60">WhatsApp Number (if different)</label>
                  <input
                    value={coachWA}
                    onChange={e => setCoachWA(e.target.value)}
                    placeholder="Leave blank if same as phone"
                    type="tel"
                    className="w-full rounded-xl border border-[#f0b429]/10 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:ring-1 focus:ring-[#f0b429]"
                  />
                </div>

                <button
                  onClick={() => setStep("players")}
                  disabled={!detailsValid}
                  className="w-full rounded-xl bg-[#f0b429] py-3 text-sm font-bold text-[#0a1f0e] disabled:opacity-40"
                >
                  Next — Add Players
                </button>
              </div>
            )}

            {/* ── Step 2: Players ── */}
            {step === "players" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-white">Player List</h2>
                  <span className="text-xs text-white/40">{filledPlayers.length} entered (min 7)</span>
                </div>

                <div className="rounded-xl border border-[#f0b429]/20 bg-[#f0b429]/5 p-3 text-xs text-[#f0b429]">
                  Every player you enter gets a free Grassroots Sports profile and a QR card after registration. Include their school — this appears on their player card.
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-12 gap-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-white/30">
                  <span className="col-span-4">Name</span>
                  <span className="col-span-2">Age</span>
                  <span className="col-span-3">Position</span>
                  <span className="col-span-2">School</span>
                  <span className="col-span-1" />
                </div>

                {players.map((p, i) => (
                  <div key={i} className="grid grid-cols-12 gap-1 items-center">
                    <input
                      value={p.name}
                      onChange={e => updatePlayer(i, "name", e.target.value)}
                      placeholder={`Player ${i + 1}`}
                      className="col-span-4 rounded-lg border border-[#f0b429]/10 bg-black/20 px-2 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:ring-1 focus:ring-[#f0b429]"
                    />
                    <input
                      value={p.age}
                      onChange={e => updatePlayer(i, "age", e.target.value)}
                      placeholder="Age"
                      type="number"
                      min="10" max="17"
                      className="col-span-2 rounded-lg border border-[#f0b429]/10 bg-black/20 px-2 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:ring-1 focus:ring-[#f0b429]"
                    />
                    <select
                      value={p.position}
                      onChange={e => updatePlayer(i, "position", e.target.value)}
                      className="col-span-3 rounded-lg border border-[#f0b429]/10 bg-black/20 px-1 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-[#f0b429]"
                    >
                      <option value="">Pos</option>
                      {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                    </select>
                    <input
                      value={p.school}
                      onChange={e => updatePlayer(i, "school", e.target.value)}
                      placeholder="School"
                      className="col-span-2 rounded-lg border border-[#f0b429]/10 bg-black/20 px-2 py-2 text-xs text-white placeholder:text-white/20 outline-none focus:ring-1 focus:ring-[#f0b429]"
                    />
                    <button
                      onClick={() => removeRow(i)}
                      className="col-span-1 flex items-center justify-center text-white/20 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={addRow}
                  className="flex items-center gap-2 text-xs text-[#f0b429] hover:opacity-80"
                >
                  <Plus className="h-3.5 w-3.5" /> Add another player
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("details")}
                    className="flex-1 rounded-xl border border-[#f0b429]/10 py-3 text-sm font-semibold text-white/60"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep("confirm")}
                    disabled={!playersValid}
                    className="flex-1 rounded-xl bg-[#f0b429] py-3 text-sm font-bold text-[#0a1f0e] disabled:opacity-40"
                  >
                    Review & Submit
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Confirm ── */}
            {step === "confirm" && (
              <div className="space-y-4">
                <h2 className="font-bold text-white">Confirm Registration</h2>

                <div className="rounded-xl border border-[#f0b429]/10 bg-black/20 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/50">Club</span>
                    <span className="font-semibold text-white">{clubName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Category</span>
                    <span className="font-semibold text-white">{ageGroup} {gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Coach</span>
                    <span className="font-semibold text-white">{coachName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Phone</span>
                    <span className="font-semibold text-white">{coachPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Players</span>
                    <span className="font-semibold text-white">{filledPlayers.length} registered</span>
                  </div>
                </div>

                <div className="rounded-xl border border-[#f0b429]/20 bg-[#f0b429]/5 p-3">
                  <p className="text-xs font-semibold text-[#f0b429] mb-1">After submitting you will receive:</p>
                  <ul className="space-y-1 text-xs text-white/70">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-400" /> QR player card for every player (downloadable)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-400" /> Grassroots Sports profile for each player</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-400" /> Munhumutapa 2026 badge on all player cards</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-400" /> Fixture notifications via WhatsApp</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("players")}
                    className="flex-1 rounded-xl border border-[#f0b429]/10 py-3 text-sm font-semibold text-white/60"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 rounded-xl bg-[#f0b429] py-3 text-sm font-bold text-[#0a1f0e] disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit Registration"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Success + QR Cards ───────────────────────────────────────────── */}
        {step === "done" && myReg && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-green-500/30 bg-green-900/20 p-5 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-400" />
              <p className="text-lg font-black text-white">Registration Complete!</p>
              <p className="mt-1 text-sm text-white/60">{myReg.club_name} — {myReg.age_group} {myReg.gender}</p>
            </div>

            {/* Player QR cards */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <QrCode className="h-4 w-4 text-[#f0b429]" />
                <p className="text-sm font-bold text-white">Player QR Cards</p>
                <span className="ml-auto text-xs text-white/40">Share with each player</span>
              </div>
              <div className="space-y-3">
                {myReg.players.map((player, i) => {
                  const shortId = myReg.id.slice(-6);
                  const pid = `MCC2026-${shortId}-${i}`;
                  const url = `${typeof window !== "undefined" ? window.location.origin : "https://grassrootssports.live"}/tournaments/munhumutapa-2026/players/${pid}`;
                  return (
                    <QRProfileCard
                      key={i}
                      playerId={pid}
                      playerName={player.name}
                      ageGroup={myReg.age_group}
                      province="Zimbabwe"
                      school={player.school || myReg.club_name}
                      tournament="Munhumutapa Challenge Cup 2026"
                      profileUrl={url}
                    />
                  );
                })}
              </div>
            </div>

            <button
              onClick={shareViaWhatsApp}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-green-500/30 bg-green-900/20 py-3 text-sm font-semibold text-green-300"
            >
              <Share2 className="h-4 w-4" />
              Share Registration Link with Other Clubs
            </button>
          </div>
        )}

        {/* ── What clubs get ───────────────────────────────────────────────── */}
        {step !== "done" && (
          <div className="rounded-2xl border border-[#f0b429]/10 bg-white/5 p-5">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#f0b429]">What Your Club Gets — Free</p>
            <div className="space-y-3">
              {[
                { icon: QrCode,       text: "A QR player card for every registered player — scannable by scouts" },
                { icon: Globe,        text: "Every player profile visible to scouts nationally and internationally" },
                { icon: Star,         text: "Tournament performance stats permanently on each player's profile" },
                { icon: Trophy,       text: "Live fixture schedule and standings on the platform" },
                { icon: Shield,       text: "Girls who participate get profiles visible to international scouts and scholarship programmes" },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#f0b429]/10">
                    <Icon className="h-3.5 w-3.5 text-[#f0b429]" />
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Registered clubs (public list) ───────────────────────────────── */}
        {allRegs.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-white/40">
              Registered Clubs ({allRegs.length})
            </p>
            <div className="space-y-2">
              {allRegs.map(r => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-[#f0b429]/10 bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{r.club_name}</p>
                    <p className="text-xs text-white/40">{r.age_group} {r.gender} · {r.players.length} players</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Fixtures & Standings ─────────────────────────────────────────── */}
        <Link
          href="/tournaments/munhumutapa-2026/fixtures"
          className="group flex items-center justify-between rounded-2xl border border-[#f0b429]/30 bg-[#f0b429]/5 p-5 hover:bg-[#f0b429]/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0b429]/20">
              <Calendar className="h-5 w-5 text-[#f0b429]" />
            </div>
            <div>
              <p className="font-bold text-white">Fixtures &amp; Standings</p>
              <p className="text-xs text-white/50">Live schedule, results and group tables</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-[#f0b429] group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* ── Admin link ───────────────────────────────────────────────────── */}
        <div className="text-center">
          <Link href="/admin/tournaments/munhumutapa-2026" className="text-xs text-white/20 hover:text-white/40">
            Admin View →
          </Link>
        </div>

      </div>
    </div>
  );
}

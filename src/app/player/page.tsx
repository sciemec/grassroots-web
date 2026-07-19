"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Zap, BookOpen, Dumbbell, Activity, Award,
  Video, TrendingUp, ShieldCheck, GraduationCap,
  Radio, ChevronRight, Trophy, Flame, Star, ClipboardList, Crosshair,
  MapPin, Brain, BookMarked, Sparkles, Globe, CheckCircle2, ArrowRight, Lock,
  Layers, UserCircle, BarChart2, ListChecks, Milestone, BadgeCheck,
  Wind, Footprints, Target, Swords, Hand, Palette, Sprout, Dna,
  Play, HeartPulse, ScanLine, Camera, Wand2, ArrowUpRight,
  Bell, Users, Eye,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { getCurrentStreak } from "@/lib/success/streak";
import api from "@/lib/api";
import WeeklyChallenges from "@/components/challenges/WeeklyChallenges";
import { useSport } from "@/lib/use-sport";
import SportSwitcher from "@/components/ui/SportSwitcher";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const WIRE = [
  "K.M. (U17 Striker, Harare) just clocked a 2.84s 20m sprint benchmark",
  "T.N. (U13 Midfielder, Bulawayo) cleared a 45cm vertical leap threshold",
  "Coach Moyo logged a 4-3-3 tactical blueprint for Matabeleland North",
  "Zimbiru Primary School NASH cohort synced to National Talent Database",
  "S.G. (Senior Wingback, Manicaland) logged a 15s heart rate recovery index",
  "Teach for Zimbabwe Mobile Lab activated for Hwange District schools",
];

// Pathway stages â€” a player progresses through these over their career
const PATHWAY_STAGES = [
  { id: "primary",    label: "Primary",    sub: "U10â€“U12", ageGroups: ["u10", "u11", "u12"] },
  { id: "secondary",  label: "Secondary",  sub: "U13â€“U16", ageGroups: ["u13", "u14", "u15", "u16"] },
  { id: "junior_pro", label: "Junior Pro", sub: "U17â€“U19", ageGroups: ["u17", "u18", "u19"] },
  { id: "senior",     label: "Senior",     sub: "20+",     ageGroups: ["senior", "open"] },
  { id: "pro",        label: "Pro / Scholarship", sub: "Goal",  ageGroups: [] },
];

function getPathwayStage(ageGroup?: string): number {
  if (!ageGroup) return 1; // default Secondary
  const ag = ageGroup.toLowerCase().replace(/\s/g, "");
  for (let i = 0; i < PATHWAY_STAGES.length - 1; i++) {
    if (PATHWAY_STAGES[i].ageGroups.some((a) => ag.includes(a))) return i;
  }
  return 1;
}

function LiveWireTicker() {
  const [wireIndex, setWireIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setWireIndex((p) => (p + 1) % WIRE.length), 4500);
    return () => clearInterval(id);
  }, []);
  return (
    <p className="text-xs font-semibold truncate" style={{ color: "#92400e" }}>
      {WIRE[wireIndex]}
    </p>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[9px] font-black uppercase tracking-[0.18em] mb-3 ml-0.5 flex items-center gap-2"
      style={{ color: "#9ca3af" }}>
      <span className="inline-block w-4 h-px bg-gray-300" />
      {children}
    </p>
  );
}

function HubCard({
  href, icon: Icon, iconBg, iconColor, label, desc, badge,
}: {
  href: string; icon: React.ElementType; iconBg: string; iconColor: string;
  label: string; desc: string; badge?: string;
}) {
  return (
    <Link href={href}
      className="group bg-white rounded-2xl p-4 flex flex-col gap-3 border border-gray-200 hover:border-[#1a5c2a] shadow-sm hover:shadow-md transition-all relative overflow-hidden">
      {badge && (
        <span className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full text-white"
          style={{ backgroundColor: "#1a5c2a" }}>{badge}</span>
      )}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
        <Icon size={16} style={{ color: iconColor }} />
      </div>
      <div>
        <h4 className="text-xs font-black uppercase tracking-wide leading-none text-gray-900">{label}</h4>
        <p className="text-[11px] font-medium mt-1 leading-snug text-gray-400">{desc}</p>
      </div>
      <ChevronRight size={12} className="absolute bottom-4 right-4 text-gray-300 group-hover:text-[#1a5c2a] group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}

function DarkCTA({ href, icon: Icon, iconColor, title, sub }: {
  href: string; icon: React.ElementType; iconColor: string; title: string; sub: string;
}) {
  return (
    <Link href={href}
      className="group rounded-2xl p-4 flex items-center justify-between transition-all hover:opacity-90"
      style={{ background: "linear-gradient(135deg, #1a5c2a 0%, #14472a 100%)", border: "1px solid rgba(240,180,41,0.12)" }}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(240,180,41,0.13)", border: "1px solid rgba(240,180,41,0.18)" }}>
          <Icon size={15} style={{ color: iconColor }} />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-wide" style={{ color: "#f0b429" }}>{title}</p>
          <p className="text-[10px] font-medium mt-0.5" style={{ color: "rgba(240,180,41,0.65)" }}>{sub}</p>
        </div>
      </div>
      <ArrowRight size={13} style={{ color: "#f0b429" }} className="group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}

// Sport-specific Skill Lab cards
const SPORT_SKILL_CARDS: Record<string, { href: string; icon: React.ElementType; iconBg: string; iconColor: string; label: string; desc: string }[]> = {
  football:   [
    { href: "/player/dribbling",   icon: Wind,        iconBg: "#dbeafe", iconColor: "#2563eb", label: "Dribbling",      desc: "1v1 Â· close control Â· AI feedback" },
    { href: "/player/first-touch", icon: Hand,        iconBg: "#dcfce7", iconColor: "#16a34a", label: "First Touch",    desc: "Receive Â· control Â· turn under pressure" },
    { href: "/player/shooting",    icon: Target,      iconBg: "#fee2e2", iconColor: "#dc2626", label: "Shooting",       desc: "Technique Â· power Â· placement Â· AI score" },
    { href: "/player/sprint",      icon: Footprints,  iconBg: "#fef3c7", iconColor: "#d97706", label: "Sprint",         desc: "Speed Â· acceleration Â· 20m benchmark" },
    { href: "/player/passing",     icon: ArrowUpRight,iconBg: "#dcfce7", iconColor: "#059669", label: "Passing",        desc: "Vision Â· technique Â· AI score" },
    { href: "/player/tackling",    icon: Swords,      iconBg: "#ede9fe", iconColor: "#7c3aed", label: "Tackling",       desc: "Timing Â· body shape Â· defensive skills" },
    { href: "/player/similar",     icon: ScanLine,    iconBg: "#f0fdf4", iconColor: "#15803d", label: "Players Like Me",desc: "Find athletes with your style" },
  ],
  rugby: [
    { href: "/player/sprint",   icon: Footprints,  iconBg: "#fef3c7", iconColor: "#d97706", label: "Speed & Evasion",desc: "Acceleration Â· side-step Â· line breaks" },
    { href: "/player/passing",  icon: ArrowUpRight,iconBg: "#dcfce7", iconColor: "#059669", label: "Passing",        desc: "Offloads Â· spiral pass Â· quick ball" },
    { href: "/player/tackling", icon: Swords,      iconBg: "#ede9fe", iconColor: "#7c3aed", label: "Tackling",       desc: "Low body position Â· wrap Â· drive" },
    { href: "/player/drills",   icon: Dumbbell,    iconBg: "#dbeafe", iconColor: "#2563eb", label: "Rugby Drills",   desc: "Lineout Â· scrum Â· contact drills" },
  ],
  netball: [
    { href: "/player/passing",  icon: ArrowUpRight,iconBg: "#dcfce7", iconColor: "#059669", label: "Passing",        desc: "Chest pass Â· lob Â· shoulder pass" },
    { href: "/player/shooting", icon: Target,      iconBg: "#fee2e2", iconColor: "#dc2626", label: "Shooting",       desc: "Goal circle Â· angles Â· under pressure" },
    { href: "/player/sprint",   icon: Footprints,  iconBg: "#fef3c7", iconColor: "#d97706", label: "Footwork",       desc: "Pivoting Â· landing Â· court movement" },
    { href: "/player/drills",   icon: Dumbbell,    iconBg: "#dbeafe", iconColor: "#2563eb", label: "Netball Drills", desc: "Intercepts Â· feeds Â· defending" },
  ],
  athletics: [
    { href: "/player/sprint",        icon: Footprints,iconBg: "#fef3c7", iconColor: "#d97706", label: "Sprint",           desc: "Reaction Â· acceleration Â· finish" },
    { href: "/player/biomechanics",  icon: Activity,  iconBg: "#dcfce7", iconColor: "#15803d", label: "Movement Check",   desc: "Stride Â· arm mechanics Â· technique AI" },
    { href: "/player/drills",        icon: Dumbbell,  iconBg: "#dbeafe", iconColor: "#2563eb", label: "Athletics Drills", desc: "Bounding Â· hurdles Â· plyometrics" },
    { href: "/player/assessment",    icon: Star,      iconBg: "#fdf4ff", iconColor: "#a21caf", label: "Athletic Profile", desc: "6-test battery Â· speed Â· jump Â· balance" },
  ],
  basketball: [
    { href: "/player/dribbling", icon: Wind,        iconBg: "#dbeafe", iconColor: "#2563eb", label: "Ball Handling",     desc: "Crossover Â· hesitation Â· tight control" },
    { href: "/player/shooting",  icon: Target,      iconBg: "#fee2e2", iconColor: "#dc2626", label: "Shooting",          desc: "Form Â· mid-range Â· three-point AI score" },
    { href: "/player/passing",   icon: ArrowUpRight,iconBg: "#dcfce7", iconColor: "#059669", label: "Passing",           desc: "Bounce pass Â· assist vision Â· timing" },
    { href: "/player/drills",    icon: Dumbbell,    iconBg: "#dbeafe", iconColor: "#2563eb", label: "Basketball Drills", desc: "Pick & roll Â· layup Â· defensive slides" },
  ],
  cricket: [
    { href: "/player/drills",    icon: Dumbbell,    iconBg: "#dbeafe", iconColor: "#2563eb", label: "Batting Drills",    desc: "Stance Â· shot selection Â· footwork" },
    { href: "/player/drills",    icon: Target,      iconBg: "#fee2e2", iconColor: "#dc2626", label: "Bowling Drills",    desc: "Run-up Â· release Â· swing / seam" },
    { href: "/player/sprint",    icon: Footprints,  iconBg: "#fef3c7", iconColor: "#d97706", label: "Running",           desc: "Between wickets Â· acceleration" },
    { href: "/player/drills",    icon: Star,        iconBg: "#fdf4ff", iconColor: "#a21caf", label: "Cricket Drills",    desc: "Fielding Â· catching Â· throwing" },
  ],
  swimming: [
    { href: "/player/sprint",       icon: Footprints,iconBg: "#fef3c7", iconColor: "#d97706", label: "Speed Sets",      desc: "Sprint intervals Â· turn training" },
    { href: "/player/biomechanics", icon: Activity,  iconBg: "#dcfce7", iconColor: "#15803d", label: "Stroke Check",    desc: "Technique analysis Â· AI feedback" },
    { href: "/player/drills",       icon: Dumbbell,  iconBg: "#dbeafe", iconColor: "#2563eb", label: "Swimming Drills", desc: "Catch Â· pull Â· kick patterns" },
    { href: "/player/drills",       icon: TrendingUp,iconBg: "#dcfce7", iconColor: "#16a34a", label: "Endurance",       desc: "Distance sets Â· pace control" },
  ],
  tennis: [
    { href: "/player/sprint",   icon: Footprints,  iconBg: "#fef3c7", iconColor: "#d97706", label: "Footwork",       desc: "Split step Â· recovery Â· court coverage" },
    { href: "/player/drills",   icon: Target,      iconBg: "#fee2e2", iconColor: "#dc2626", label: "Groundstrokes",  desc: "Forehand Â· backhand Â· consistency" },
    { href: "/player/drills",   icon: ArrowUpRight,iconBg: "#dcfce7", iconColor: "#059669", label: "Serve",          desc: "Toss Â· contact Â· spin variation" },
    { href: "/player/drills",   icon: Dumbbell,    iconBg: "#dbeafe", iconColor: "#2563eb", label: "Tennis Drills",  desc: "Net play Â· approach Â· volleys" },
  ],
  volleyball: [
    { href: "/player/passing",  icon: ArrowUpRight,iconBg: "#dcfce7", iconColor: "#059669", label: "Setting",           desc: "Hand position Â· tempo Â· vision" },
    { href: "/player/sprint",   icon: Footprints,  iconBg: "#fef3c7", iconColor: "#d97706", label: "Court Movement",    desc: "Dig Â· chase Â· dive technique" },
    { href: "/player/drills",   icon: Target,      iconBg: "#fee2e2", iconColor: "#dc2626", label: "Attacking",         desc: "Approach Â· arm swing Â· block" },
    { href: "/player/drills",   icon: Dumbbell,    iconBg: "#dbeafe", iconColor: "#2563eb", label: "Volleyball Drills", desc: "Serve Â· receive Â· transition" },
  ],
  hockey: [
    { href: "/player/dribbling", icon: Wind,        iconBg: "#dbeafe", iconColor: "#2563eb", label: "Stick Skills",   desc: "Close control Â· 3D skills Â· evasion" },
    { href: "/player/passing",   icon: ArrowUpRight,iconBg: "#dcfce7", iconColor: "#059669", label: "Passing",        desc: "Flat Â· hit Â· aerial Â· self-pass" },
    { href: "/player/shooting",  icon: Target,      iconBg: "#fee2e2", iconColor: "#dc2626", label: "Shooting",       desc: "Drag flick Â· slap Â· deflection" },
    { href: "/player/drills",    icon: Dumbbell,    iconBg: "#dbeafe", iconColor: "#2563eb", label: "Hockey Drills",  desc: "Press Â· defence Â· penalty corners" },
  ],
};

const SPORT_PATHWAY_LABEL: Record<string, string> = {
  football:   "Professional Football Pathway",
  rugby:      "Rugby Development Pathway",
  netball:    "Netball Excellence Pathway",
  athletics:  "Athletics Career Pathway",
  basketball: "Basketball Development Pathway",
  cricket:    "Cricket Career Pathway",
  swimming:   "Swimming Development Pathway",
  tennis:     "Tennis Career Pathway",
  volleyball: "Volleyball Development Pathway",
  hockey:     "Hockey Development Pathway",
};

export default function PlayerDashboardHome() {
  const router   = useRouter();
  const user     = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const { activeSport, setActiveSport } = useSport();
  const [sessionCount,  setSessionCount]  = useState<number | null>(null);
  const [streak,        setStreak]        = useState<number | null>(null);
  const [aqScore,       setAqScore]       = useState<number | null>(null);
  const [todayDone,     setTodayDone]     = useState(false);
  const [athleticScore, setAthleteScore]  = useState<number | null>(null);
  const [lastTestDays,  setLastTestDays]  = useState<number | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/login");
  }, [hydrated, user, router]);

  useEffect(() => {
    if (!hydrated || !user) return;

    // THUTO Score from localStorage
    try {
      const raw = localStorage.getItem("grs_active_session");
      if (raw) {
        const state = JSON.parse(raw);
        if (state?.result?.aq != null) setAqScore(Math.round(state.result.aq));
      }
      // Check if today's check-in is done
      const checkins = JSON.parse(localStorage.getItem("gs_goal_missions") || "[]");
      const today = new Date().toISOString().slice(0, 10);
      setTodayDone(checkins.some((c: { mission_date?: string; status?: string }) =>
        c.mission_date === today && c.status === "done"));
    } catch { /* storage unavailable */ }

    // GRS Athletic Test Battery results
    try {
      const athleticRaw = localStorage.getItem("grs_athletic_results");
      if (athleticRaw) {
        const results = JSON.parse(athleticRaw);
        if (Array.isArray(results) && results.length > 0) {
          const latest = results[results.length - 1];
          if (latest?.composite != null) setAthleteScore(Math.round(latest.composite));
          if (latest?.date) {
            const days = Math.floor((Date.now() - new Date(latest.date).getTime()) / 86_400_000);
            setLastTestDays(days);
          }
        }
      }
    } catch { /* storage unavailable */ }

    setStreak(getCurrentStreak());

    api.get("/sessions")
      .then((res) => {
        const data = res.data;
        const items: Array<{ aq_score?: number; overall_score?: number }> = Array.isArray(data)
          ? data : Array.isArray(data?.data) ? data.data : [];
        setSessionCount(items.length);
        const latest = items[0];
        if (latest?.aq_score != null) setAqScore(Math.round(latest.aq_score));
        else if (latest?.overall_score != null) setAqScore(Math.round(latest.overall_score));
      })
      .catch(() => {});
  }, [hydrated, user]);

  if (!hydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f4f2ee" }}>
        <Activity className="animate-spin" size={28} style={{ color: "#1a5c2a" }} />
      </div>
    );
  }

  const initials    = user.name ? user.name.slice(0, 2).toUpperCase() : "GR";
  const stageIndex  = getPathwayStage((user as unknown as Record<string, string>).age_group);
  const currentStage = PATHWAY_STAGES[stageIndex];
  const nextStage    = PATHWAY_STAGES[stageIndex + 1];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f4f2ee" }}>

      {/* â”€â”€ Brand header â”€â”€ */}
      <div style={{ backgroundColor: "#1a5c2a", borderBottom: "3px solid #f0b429" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs"
              style={{ backgroundColor: "#f0b429", color: "#1a5c2a" }}>GRS</div>
            <div>
              <p className="font-black text-sm uppercase tracking-wider leading-none" style={{ color: "#f0b429" }}>GrassRoots Sports</p>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(240,180,41,0.7)" }}>Player Hub</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ backgroundColor: "rgba(240,180,41,0.1)", border: "1px solid rgba(240,180,41,0.15)" }}>
            <GraduationCap size={13} style={{ color: "#f0b429" }} />
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest leading-none" style={{ color: "#f0b429" }}>Education Partner</p>
              <p className="text-[10px] font-black uppercase" style={{ color: "#f0b429" }}>Teach For Zimbabwe</p>
            </div>
          </div>
        </div>
      </div>

      {/* â”€â”€ Live wire ticker â”€â”€ */}
      <div style={{ backgroundColor: "#fffbeb", borderBottom: "1px solid #fde68a" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3">
          <span className="shrink-0 inline-flex items-center gap-1 rounded text-[9px] font-black uppercase tracking-widest px-2 py-0.5 text-white"
            style={{ backgroundColor: "#dc2626" }}>
            <Radio size={9} className="animate-pulse" /> Live
          </span>
          <LiveWireTicker />
        </div>
      </div>

      {/* â”€â”€ Sport switcher bar â”€â”€ */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5">
          <SportSwitcher activeSport={activeSport} onSelect={setActiveSport} size="sm" />
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-7">

        {/* â”€â”€ Hero card â”€â”€ */}
        <div className="rounded-2xl overflow-hidden shadow-sm">
          <div className="relative px-5 pt-6 pb-5" style={{ background: "#1a5c2a" }}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: "rgba(240,180,41,0.7)" }}>{greeting()},</p>
                <h2 className="text-2xl font-black mt-0.5 leading-tight truncate" style={{ color: "#f0b429" }}>{user.name || "Athlete"}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "rgba(240,180,41,0.15)", color: "#f0b429", border: "1px solid rgba(240,180,41,0.25)" }}>
                    <ShieldCheck size={9} /> {currentStage.label} Â· {currentStage.sub}
                  </span>
                  {(user as unknown as Record<string, string>).province && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: "rgba(240,180,41,0.7)" }}>
                      <MapPin size={9} /> {(user as unknown as Record<string, string>).province}
                    </span>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0"
                style={{ backgroundColor: "#f0b429", color: "#1a5c2a" }}>{initials}</div>
            </div>

            {/* Stat tiles */}
            <div className="grid grid-cols-3 gap-2.5 mt-5">
              {[
                { label: "Sessions",    value: sessionCount !== null ? String(sessionCount) : "â€”", Icon: Activity },
                { label: "Day Streak",  value: streak       !== null ? `${streak}d`         : "â€”", Icon: Flame },
                { label: "THUTO Score", value: aqScore      !== null ? String(aqScore)       : "â€”", Icon: Star },
              ].map(({ label, value, Icon }) => (
                <div key={label} className="rounded-xl px-3 py-2.5 text-center"
                  style={{ backgroundColor: "rgba(240,180,41,0.07)", border: "1px solid rgba(240,180,41,0.15)" }}>
                  <Icon size={11} className="mx-auto mb-1" style={{ color: "rgba(240,180,41,0.55)" }} />
                  <p className="text-base font-black leading-none" style={{ color: "#f0b429" }}>{value}</p>
                  <p className="text-[9px] uppercase tracking-wide mt-0.5" style={{ color: "rgba(240,180,41,0.55)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-[#1a5c2a]/10"
            style={{ backgroundColor: "#f0fdf4", borderTop: "1px solid rgba(26,92,42,0.15)" }}>
            {[
              { href: "/player/profile",   label: "My Profile" },
              { href: "/player/progress",  label: "Progress" },
              { href: "/player/talent-id", label: "Scout CV" },
            ].map(({ href, label }) => (
              <Link key={href} href={href}
                className="py-2.5 text-center text-[10px] font-black uppercase tracking-wider transition-colors hover:text-[#1a5c2a]"
                style={{ color: "#6b7280" }}>{label}</Link>
            ))}
          </div>
        </div>
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            SECTION 1 â€” MY PATHWAY
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <section>
          <SectionLabel>1 Â· My Pathway</SectionLabel>
          {/* Stage progress bar */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-gray-900">{SPORT_PATHWAY_LABEL[activeSport] ?? "My Sports Pathway"}</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">From grassroots to professional club or college scholarship</p>
              </div>
              <Link href="/player/pathway"
                className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors hover:bg-green-50"
                style={{ color: "#1a5c2a", border: "1px solid #1a5c2a" }}>
                Full Plan
              </Link>
            </div>
            {/* Progress steps */}
            <div className="relative">
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-100" />
              <div className="absolute top-4 left-0 h-0.5 bg-[#1a5c2a] transition-all"
                style={{ width: `${(stageIndex / (PATHWAY_STAGES.length - 1)) * 100}%` }} />
              <div className="relative flex justify-between">
                {PATHWAY_STAGES.map((stage, i) => {
                  const done    = i < stageIndex;
                  const current = i === stageIndex;
                  const goal    = i === PATHWAY_STAGES.length - 1;
                  return (
                    <div key={stage.id} className="flex flex-col items-center gap-1.5" style={{ flex: 1 }}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] border-2 transition-all ${
                        goal    ? "border-yellow-400 bg-yellow-50" :
                        current ? "border-[#1a5c2a] bg-[#1a5c2a] text-white" :
                        done    ? "border-[#1a5c2a] bg-[#1a5c2a]/10 text-[#1a5c2a]" :
                                  "border-gray-200 bg-white text-gray-300"
                      }`}>
                        {goal ? <Trophy size={12} style={{ color: "#d97706" }} /> :
                         done ? <CheckCircle2 size={12} /> :
                         current ? <Star size={10} /> : i + 1}
                      </div>
                      <div className="text-center">
                        <p className={`text-[9px] font-black uppercase tracking-wide leading-none ${current ? "text-[#1a5c2a]" : goal ? "text-yellow-600" : done ? "text-gray-500" : "text-gray-300"}`}>
                          {stage.label.split(" ")[0]}
                        </p>
                        <p className={`text-[8px] mt-0.5 font-medium leading-none ${current ? "text-[#1a5c2a]/70" : "text-gray-300"}`}>{stage.sub}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {nextStage && (
              <div className="mt-4 flex items-center gap-2 rounded-xl p-3"
                style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <ArrowRight size={13} style={{ color: "#1a5c2a" }} />
                <p className="text-[11px] font-bold text-green-800">
                  Next stage: <span className="font-black">{nextStage.label}</span> ({nextStage.sub}) â€” keep training and logging sessions to progress.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            SECTION 2 â€” TODAY
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <section>
          <SectionLabel>2 Â· Today</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Daily check-in status */}
            <Link href="/player/success/checkin"
              className="group bg-white rounded-2xl border shadow-sm p-4 flex flex-col gap-3 hover:border-[#1a5c2a] transition-all"
              style={{ borderColor: todayDone ? "#bbf7d0" : "#e5e7eb", backgroundColor: todayDone ? "#f0fdf4" : "white" }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} style={{ color: todayDone ? "#16a34a" : "#d1d5db" }} />
                <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: todayDone ? "#16a34a" : "#9ca3af" }}>
                  {todayDone ? "Day Complete" : "Today's Check-In"}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-snug">
                {todayDone ? "Well done â€” you logged today." : "Tap to log your daily actions and mood."}
              </p>
            </Link>
            {/* Start training */}
            <Link href="/player/weekly-session"
              className="group rounded-2xl p-4 flex flex-col gap-3 hover:opacity-90 transition-all shadow-sm"
              style={{ background: "linear-gradient(135deg, #1a5c2a 0%, #14472a 100%)", border: "1px solid rgba(240,180,41,0.15)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList size={15} style={{ color: "#f0b429" }} />
                  <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#f0b429" }}>GRS Weekly Test</span>
                </div>
                {athleticScore !== null && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: "rgba(240,180,41,0.2)", color: "#f0b429" }}>
                    {athleticScore}/100
                  </span>
                )}
              </div>
              <p className="text-xs leading-snug" style={{ color: "rgba(240,180,41,0.7)" }}>
                {lastTestDays === null
                  ? "6-test battery Â· sprint, jump, ball, reaction, balance, endurance"
                  : lastTestDays === 0
                  ? "Tested today Â· great work!"
                  : `Last tested ${lastTestDays}d ago Â· ${lastTestDays >= 7 ? "test due!" : "keep it up"}`}
              </p>
              <ArrowRight size={12} style={{ color: "#f0b429" }} className="mt-auto group-hover:translate-x-0.5 transition-transform" />
            </Link>
            {/* THUTO AI tip */}
            <Link href="/player/ai-coach"
              className="group bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col gap-3 hover:border-purple-300 transition-all">
              <div className="flex items-center gap-2">
                <Brain size={15} style={{ color: "#7c3aed" }} />
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">THUTO AI Coach</span>
              </div>
              <p className="text-xs text-gray-500 leading-snug">Ask THUTO anything â€” technique, tactics, nutrition, mental game.</p>
              <ArrowRight size={12} className="text-purple-400 mt-auto group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </section>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            SECTION 3 â€” MY DRILLS
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <section>
          <SectionLabel>3 Â· My Drills</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <HubCard href="/player/drills" icon={Dumbbell} iconBg="#dbeafe" iconColor="#2563eb"
              label="Drill Library" desc="500+ drills Â· age group Â· position-specific" />
            <HubCard href="/player/sessions/new" icon={Activity} iconBg="#dcfce7" iconColor="#16a34a"
              label="Log Session" desc="Record training Â· track load Â· save notes" />
            <HubCard href="/player/sessions" icon={ListChecks} iconBg="#f0fdf4" iconColor="#15803d"
              label="My Sessions" desc="Full history Â· filter by sport Â· stats" />
            <HubCard href="/player/position-fit" icon={Crosshair} iconBg="#ffe4e6" iconColor="#dc2626"
              label="Position Finder" desc="GRS Engine finds your best position" />
            <HubCard href="/player/pitch" icon={Play} iconBg="#dcfce7" iconColor="#15803d"
              label="Train Now" desc="Pitch mode Â· live session Â· THUTO coaching" />
            <HubCard href="/player/training-formats" icon={Layers} iconBg="#dbeafe" iconColor="#1d4ed8"
              label="Training Formats" desc="Rondo Â· SSG Â· shooting Â· drills" />
            <HubCard href="/player/conditioning" icon={HeartPulse} iconBg="#fee2e2" iconColor="#dc2626"
              label="Conditioning" desc="Fitness plans Â· endurance Â· speed work" />
            <HubCard href="/coach/tactics/learn" icon={Layers} iconBg="#f0fdf4" iconColor="#1a5c2a"
              label="Tactics Learn" desc="Formations Â· principles Â· coaching badges" />
          </div>
        </section>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            SECTION 4 â€” AI ANALYSIS
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <section>
          <SectionLabel>4 Â· AI Analysis</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <HubCard href="/player/match-eye" icon={Eye} iconBg="#fee2e2" iconColor="#dc2626"
              label="Match Eye" desc="Upload match video Â· AI analyses your performance" badge="ai" />
            <HubCard href="/player/analyse" icon={Sparkles} iconBg="#f3e8ff" iconColor="#9333ea"
              label="Drill Analysis" desc="Upload video Â· Gemini AI coaching feedback" badge="Free trial" />
            <HubCard href="/player/biomechanics" icon={Activity} iconBg="#dcfce7" iconColor="#15803d"
              label="Movement Check" desc="Film a drill Â· AI scores your movement Â· see your weak spots" />
            <HubCard href="/player/gemini-drills" icon={Wand2} iconBg="#fdf4ff" iconColor="#7c3aed"
              label="Gemini Drills" desc="AI drill coaching Â· 10 sports Â· guided sessions" />
            <HubCard href="/player/capture" icon={Camera} iconBg="#f0fdf4" iconColor="#15803d"
              label="Video Capture" desc="Record live Â· Claude vision Â· instant feedback" />
            <HubCard href="/player/assessment" icon={Star} iconBg="#fdf4ff" iconColor="#a21caf"
              label="Athletic Profile" desc="6-test battery Â· jump Â· sprint Â· balance Â· drill analysis" />
            <HubCard href="/player/goal" icon={Zap} iconBg="#fef3c7" iconColor="#d97706"
              label="Success Engine" desc="Daily check-in Â· streak Â· goal tracking" />
            <HubCard href="/player/potential" icon={TrendingUp} iconBg="#dcfce7" iconColor="#16a34a"
              label="My Potential" desc="THUTO score Â· peak level Â· comparable players" />
            <HubCard href="/player/valuation" icon={BarChart2} iconBg="#fef3c7" iconColor="#b45309"
              label="My Valuation" desc="Estimated market value Â· Zimbabwe percentile" />
            <HubCard href="/player/dna" icon={Dna} iconBg="#ede9fe" iconColor="#7c3aed"
              label="Player DNA" desc="Playing style fingerprint Â· traits" />
          </div>
        </section>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            SECTION 4b â€” SKILL LAB (sport-specific)
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <section>
          <SectionLabel>4b Â· Skill Lab</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(SPORT_SKILL_CARDS[activeSport] ?? SPORT_SKILL_CARDS.football).map((card) => (
              <HubCard key={card.label} href={card.href} icon={card.icon}
                iconBg={card.iconBg} iconColor={card.iconColor}
                label={card.label} desc={card.desc} />
            ))}
          </div>
        </section>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            SECTION 5 â€” MY ACADEMICS
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <section>
          <SectionLabel>5 Â· My Academics</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Academic tracker card */}
            <Link href="/player/academics"
              className="group bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:border-[#1a5c2a] transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#fef3c7" }}>
                    <BookMarked size={18} style={{ color: "#d97706" }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900">Academic Tracker</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">Grades Â· school Â· scholarship score</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-[#1a5c2a] group-hover:translate-x-0.5 transition-all mt-1" />
              </div>
              <p className="text-xs text-gray-500 mt-4 leading-relaxed">
                Scouts and colleges look at both your sports ability <em>and</em> your grades.
                Log your results term by term and track your scholarship readiness.
              </p>
              <div className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}>
                <GraduationCap size={12} style={{ color: "#d97706" }} />
                <p className="text-[10px] font-bold text-amber-700">Two pillars to go pro: Athletics + Academics</p>
              </div>
            </Link>

            {/* Scholarship pathway */}
            <Link href="/player/pathway"
              className="group rounded-2xl p-5 flex flex-col justify-between hover:opacity-90 transition-all shadow-sm"
              style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #152d4a 100%)", border: "1px solid rgba(96,165,250,0.15)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(96,165,250,0.13)", border: "1px solid rgba(96,165,250,0.2)" }}>
                  <Globe size={17} style={{ color: "#60a5fa" }} />
                </div>
                <div>
                  <p className="text-sm font-black" style={{ color: "#f0b429" }}>Scholarship Pathway</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "rgba(240,180,41,0.65)" }}>NCAA Â· European academies Â· local clubs</p>
                </div>
              </div>
              <p className="text-xs mt-4 leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                Map your route from Zimbabwe to a football scholarship or professional contract. Coach outreach templates included.
              </p>
              <div className="flex items-center gap-1.5 mt-4">
                <ArrowRight size={12} style={{ color: "#f0b429" }} className="group-hover:translate-x-0.5 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#f0b429" }}>View My Plan</span>
              </div>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
            <HubCard href="/player/business-school" icon={BookOpen} iconBg="#fef3c7" iconColor="#b45309"
              label="Business School" desc="Sports business · sponsorship · contracts" />
          </div>
        </section>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            SECTION 6 â€” MY SHOWCASE
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <section>
          <SectionLabel>6 Â· My Showcase</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <HubCard href="/player/talent-id" icon={Award} iconBg="#f3e8ff" iconColor="#9333ea"
              label="Scout Profile" desc="Visibility Â· Plays Like Â· CV share" />
            <HubCard href="/player/passport" icon={BookOpen} iconBg="#e0f2fe" iconColor="#0284c7"
              label="Talent Passport" desc="Shareable QR profile for scouts" />
            <HubCard href="/player/vault" icon={Video} iconBg="#fce7f3" iconColor="#db2777"
              label="Highlight Vault" desc="Upload clips Â· reels Â· AI highlights" />
            <HubCard href="/player/scholarship-reel" icon={TrendingUp} iconBg="#fdf4ff" iconColor="#7c3aed"
              label="Scholarship Reel" desc="10 best clips Â· scouts see this first" />
            <HubCard href="/player/showcase" icon={Radio} iconBg="#fce7f3" iconColor="#be185d"
              label="Showcase Clips" desc="Skill videos Â· AI rating Â· open for scouting" />
            <HubCard href="/player/media" icon={Layers} iconBg="#ede9fe" iconColor="#6d28d9"
              label="Media Gallery" desc="Photos Â· videos Â· display order" />
            <HubCard href="/player/profile" icon={UserCircle} iconBg="#f0fdf4" iconColor="#15803d"
              label="My Profile" desc="Photo Â· bio Â· stats Â· club Â· school" />
            <HubCard href="/player/verification" icon={BadgeCheck} iconBg="#dbeafe" iconColor="#1d4ed8"
              label="Verification" desc="ID check Â· verified badge Â· QR card" />
            <HubCard href="/player/stats" icon={BarChart2} iconBg="#fef3c7" iconColor="#b45309"
              label="My Stats" desc="Match stats history Â· all sports" />
            <HubCard href="/player/progress" icon={TrendingUp} iconBg="#dcfce7" iconColor="#15803d"
              label="My Progress" desc="Form trends Â· improvement over time" />
            <HubCard href="/player/milestones" icon={Milestone} iconBg="#fce7f3" iconColor="#db2777"
              label="Milestones" desc="Achievements Â· goals reached Â· career wins" />
            <HubCard href="/player/coaching" icon={Users} iconBg="#dbeafe" iconColor="#1d4ed8"
              label="Find a Coach" desc="Book sessions · match with local coaches" />
            <HubCard href="/player/notifications" icon={Bell} iconBg="#fef3c7" iconColor="#d97706"
              label="Notifications" desc="Alerts · scout views · opportunity updates" />
          </div>
          {/* Leaderboard + Arena CTAs */}
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <DarkCTA href="/talent-leaderboard" icon={Trophy} iconColor="#f0b429"
              title="THUTO Leaderboard" sub="See your national ranking" />
            <DarkCTA href="/arena" icon={Globe} iconColor="#60a5fa"
              title="The Arena" sub="Post Â· connect Â· get discovered" />
          </div>
        </section>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            SECTION 7 â€” MY STORY
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <section>
          <SectionLabel>7 Â· My Story</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <HubCard href="/player/story" icon={BookOpen} iconBg="#f0fdf4" iconColor="#15803d"
              label="My Story" desc="Your personal journey in football" />
            <HubCard href="/player/nutrition" icon={TrendingUp} iconBg="#f0fdf4" iconColor="#15803d"
              label="Nutrition" desc="Meal logging Â· macros Â· recovery" />
            <HubCard href="/player/subscription" icon={Star} iconBg="#fef3c7" iconColor="#d97706"
              label="Upgrade" desc="EcoCash Â· Stripe Â· unlock all features" badge="Pro" />
            <HubCard href="/player/development" icon={Sprout} iconBg="#dcfce7" iconColor="#15803d"
              label="Development" desc="Long-term tracking Â· growth plan" />
            <HubCard href="/player/brand" icon={Palette} iconBg="#fce7f3" iconColor="#be185d"
              label="Brand Studio" desc="Photo Â· profile enhancement Â· image" />
            <HubCard href="/player/sports" icon={Globe} iconBg="#e0f2fe" iconColor="#0284c7"
              label="My Sports" desc="Switch sport · multi-sport profile" />
          </div>
        </section>

        {/* â”€â”€ 8 Â· Guardian Access â”€â”€ */}
        <section>
          <SectionLabel>8 Â· Guardian</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <HubCard href="/parent/invite" icon={ShieldCheck} iconBg="#dcfce7" iconColor="#15803d"
              label="Invite Parent" desc="Share a code Â· give guardian access to your progress" />
            <HubCard href="/parent" icon={UserCircle} iconBg="#eff6ff" iconColor="#2563eb"
              label="Guardian Hub" desc="Parent dashboard Â· alerts Â· WhatsApp reports" />
          </div>
        </section>

        {/* â”€â”€ Weekly Challenges â”€â”€ */}
        <WeeklyChallenges
          playerAqScore={aqScore ?? 0}
          playerSessionCount={sessionCount ?? 0}
        />

        {/* â”€â”€ Identity footer â”€â”€ */}
        <div className="rounded-2xl bg-white border border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-[10px]"
              style={{ backgroundColor: "#1a5c2a", color: "#f0b429" }}>{initials}</div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-gray-900 leading-none">{user.name || "Active Session"}</p>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">
                {(user as unknown as Record<string, string>).province || "Zimbabwe"} Â· {currentStage.label}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg"
            style={{ backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>
            <ShieldCheck size={11} /> Sync Active
          </div>
        </div>

      </main>
    </div>
  );
}

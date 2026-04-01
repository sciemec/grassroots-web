"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Send, RotateCcw } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";

// ─── Types ────────────────────────────────────────────────────────────────────

type FanEvent = {
  id: string;
  type: string;
  emoji: string;
  team: "home" | "away" | "neutral";
  min: number;
  commentary: string;
  generating: boolean;
};

type Phase = "setup" | "live" | "ended";

const FAN_EVENTS = [
  { type: "goal",      emoji: "⚽", label: "GOAL!",       team: null, color: "bg-green-500/10 border-green-500/40 text-green-400" },
  { type: "shot",      emoji: "🎯", label: "Shot",         team: null, color: "bg-red-500/10 border-red-500/40 text-red-400" },
  { type: "save",      emoji: "🧤", label: "Save",         team: null, color: "bg-blue-500/10 border-blue-500/40 text-blue-400" },
  { type: "foul",      emoji: "🤿", label: "Foul",         team: null, color: "bg-orange-500/10 border-orange-500/40 text-orange-400" },
  { type: "card",      emoji: "🟨", label: "Card",         team: null, color: "bg-yellow-500/10 border-yellow-500/40 text-yellow-300" },
  { type: "corner",    emoji: "📐", label: "Corner",       team: null, color: "bg-purple-500/10 border-purple-500/40 text-purple-400" },
  { type: "pass",      emoji: "✨", label: "Great Pass",   team: null, color: "bg-teal-500/10 border-teal-500/40 text-teal-400" },
  { type: "tackle",    emoji: "💥", label: "Big Tackle",   team: null, color: "bg-amber-500/10 border-amber-500/40 text-amber-400" },
  { type: "miss",      emoji: "😬", label: "Missed!",      team: null, color: "bg-red-500/10 border-red-500/30 text-red-300" },
  { type: "offside",   emoji: "⚠️", label: "Offside",      team: null, color: "bg-white/5 border-white/20 text-white/50" },
  { type: "freekick",  emoji: "🌀", label: "Free Kick",    team: null, color: "bg-indigo-500/10 border-indigo-500/40 text-indigo-400" },
  { type: "injury",    emoji: "🚑", label: "Injury",       team: null, color: "bg-white/5 border-red-500/20 text-red-300/70" },
] as const;

const COMMENTARY_PROMPTS: Record<string, (home: string, away: string, min: number, team: string) => string> = {
  goal:     (h, a, m, t) => `Generate ONE exciting football commentary line for a goal scored by ${t} at minute ${m}. Match: ${h} vs ${a}. No quotes, just the line. Max 20 words. Very energetic.`,
  shot:     (h, a, m, t) => `Generate ONE football commentary line for a shot on goal by ${t} at ${m}'. Match: ${h} vs ${a}. No quotes. Max 15 words.`,
  save:     (h, a, m, t) => `Generate ONE football commentary line for a brilliant goalkeeper save at ${m}'. Match: ${h} vs ${a}. No quotes. Max 15 words.`,
  foul:     (h, a, m, t) => `Generate ONE commentary line for a foul by ${t} at ${m}'. Match: ${h} vs ${a}. No quotes. Max 12 words.`,
  card:     (h, a, m, t) => `Generate ONE commentary line for a yellow/red card shown to ${t} at ${m}'. Match: ${h} vs ${a}. No quotes. Max 12 words.`,
  corner:   (h, a, m, t) => `Generate ONE commentary line for a corner kick for ${t} at ${m}'. Match: ${h} vs ${a}. No quotes. Max 12 words.`,
  pass:     (h, a, m, t) => `Generate ONE commentary line for a brilliant pass by ${t} at ${m}'. Match: ${h} vs ${a}. No quotes. Max 12 words.`,
  tackle:   (h, a, m, t) => `Generate ONE commentary line for a crunching tackle by ${t} at ${m}'. Match: ${h} vs ${a}. No quotes. Max 12 words.`,
  miss:     (h, a, m, t) => `Generate ONE football commentary line for a missed chance by ${t} at ${m}'. Match: ${h} vs ${a}. No quotes. Slightly dramatic. Max 15 words.`,
  offside:  (h, a, m) => `Generate ONE commentary line for an offside call at ${m}'. Match: ${h} vs ${a}. No quotes. Max 10 words.`,
  freekick: (h, a, m, t) => `Generate ONE commentary line for a free kick awarded to ${t} at ${m}'. Match: ${h} vs ${a}. No quotes. Max 12 words.`,
  injury:   (h, a, m) => `Generate ONE commentary line for a player down injured at ${m}'. Match: ${h} vs ${a}. Concerned tone. No quotes. Max 12 words.`,
};

export default function FanLiveCommentaryPage() {
  const [homeTeam, setHomeTeam] = useState("Home");
  const [awayTeam, setAwayTeam] = useState("Away");
  const [phase, setPhase] = useState<Phase>("setup");
  const [elapsed, setElapsed] = useState(0);
  const [feed, setFeed] = useState<FanEvent[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<"home" | "away">("home");
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [shareText, setShareText] = useState("");
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [feed]);

  const startMatch = () => {
    setPhase("live");
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => setElapsed(Date.now() - startTimeRef.current), 1000);
  };

  const endMatch = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("ended");
    buildShareText();
  };

  const resetAll = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("setup");
    setFeed([]);
    setElapsed(0);
    setHomeScore(0);
    setAwayScore(0);
    setShareText("");
  };

  const fmtTime = (ms: number) => {
    const m = Math.floor(ms / 60000);
    return `${m}'`;
  };

  const tapEvent = async (eventType: string, emoji: string) => {
    if (phase !== "live") return;
    const min = Math.floor(elapsed / 60000);
    const team = selectedTeam === "home" ? homeTeam : awayTeam;
    const tempId = Date.now().toString();

    // Score goals immediately
    if (eventType === "goal") {
      if (selectedTeam === "home") setHomeScore(s => s + 1);
      else setAwayScore(s => s + 1);
    }

    // Add placeholder while AI generates
    const placeholder: FanEvent = {
      id: tempId,
      type: eventType,
      emoji,
      team: selectedTeam,
      min,
      commentary: "…",
      generating: true,
    };
    setFeed(prev => [...prev, placeholder]);

    // Generate AI commentary
    try {
      const promptFn = COMMENTARY_PROMPTS[eventType];
      const prompt = promptFn ? promptFn(homeTeam, awayTeam, min, team) : `Commentary for ${eventType} at ${min}'. ${homeTeam} vs ${awayTeam}.`;

      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, stream: false }),
      });
      const data = await res.json();
      const line = data.response?.trim() ?? fallbackCommentary(eventType, team, min);

      setFeed(prev => prev.map(e =>
        e.id === tempId ? { ...e, commentary: line, generating: false } : e
      ));
    } catch {
      setFeed(prev => prev.map(e =>
        e.id === tempId ? { ...e, commentary: fallbackCommentary(eventType, team, min), generating: false } : e
      ));
    }
  };

  const fallbackCommentary = (type: string, team: string, min: number) => {
    const fallbacks: Record<string, string> = {
      goal:     `GOAL! ${team} score at ${min}'! The crowd erupts!`,
      shot:     `${min}' — ${team} testing the keeper!`,
      save:     `${min}' — What a save! The goalkeeper denies ${team}!`,
      foul:     `${min}' — Foul given against ${team}.`,
      card:     `${min}' — Card shown! Referee reaches for his pocket.`,
      corner:   `${min}' — Corner for ${team}. Danger in the box.`,
      pass:     `${min}' — Brilliant vision from ${team}!`,
      tackle:   `${min}' — ${team} win it back with a big tackle!`,
      miss:     `${min}' — So close! ${team} should have scored there!`,
      offside:  `${min}' — Flag goes up. Offside called.`,
      freekick: `${min}' — Free kick in a dangerous position for ${team}.`,
      injury:   `${min}' — Play stopped. Player receiving treatment.`,
    };
    return fallbacks[type] ?? `${min}' — ${team} action on the pitch.`;
  };

  const buildShareText = () => {
    const lines = [`🔴 LIVE: ${homeTeam} ${homeScore}–${awayScore} ${awayTeam}`, ""];
    feed.filter(e => !e.generating).forEach(e => {
      lines.push(`${e.min}' ${e.emoji} ${e.commentary}`);
    });
    lines.push("", `Powered by Grassroots Sport 🇿🇼`);
    setShareText(lines.join("\n"));
  };

  const copyFeed = async () => {
    buildShareText();
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareWhatsApp = () => {
    buildShareText();
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4">

        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <Link href="/fan" className="rounded-lg border border-white/10 p-1.5 hover:bg-white/5">
            <ArrowLeft className="h-4 w-4 text-white/60" />
          </Link>
          <div>
            <h1 className="text-sm font-black text-white">Live Commentary</h1>
            <p className="text-[10px] text-white/40">Tap what you see · AI writes the commentary</p>
          </div>
          {phase !== "setup" && (
            <button onClick={resetAll} className="ml-auto rounded-lg border border-white/10 p-1.5 hover:bg-white/5">
              <RotateCcw className="h-3.5 w-3.5 text-white/40" />
            </button>
          )}
        </div>

        {/* Setup */}
        {phase === "setup" && (
          <div className="space-y-4 rounded-2xl border border-white/10 bg-card/60 p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/40">Home Team</p>
                <input value={homeTeam} onChange={e => setHomeTeam(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent" />
              </div>
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/40">Away Team</p>
                <input value={awayTeam} onChange={e => setAwayTeam(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent" />
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/3 p-3">
              <p className="text-[10px] font-semibold text-white/40 mb-1">How it works</p>
              <p className="text-[10px] text-white/30 leading-relaxed">
                Watch the match live and tap each event as it happens. Claude generates commentary for each tap. Share the full feed with friends who aren&apos;t watching.
              </p>
            </div>

            <button onClick={startMatch}
              className="w-full rounded-xl bg-[#1A6B3C] py-3 text-sm font-bold text-white hover:bg-[#1A6B3C]/80 flex items-center justify-center gap-2">
              <Send className="h-4 w-4" /> Start Live Commentary
            </button>
          </div>
        )}

        {/* Scoreboard */}
        {phase !== "setup" && (
          <div className="mb-4 rounded-2xl border border-white/10 bg-card/60 p-3">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="text-xs font-black text-blue-400 uppercase">{homeTeam}</p>
                <p className="text-4xl font-black text-white">{homeScore}</p>
              </div>
              <div className="text-center px-4">
                <p className="text-[10px] text-white/40 font-bold">{fmtTime(elapsed)}</p>
                <p className="text-xs text-white/20">LIVE</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-xs font-black text-orange-400 uppercase">{awayTeam}</p>
                <p className="text-4xl font-black text-white">{awayScore}</p>
              </div>
            </div>
            {/* Team selector */}
            {phase === "live" && (
              <div className="mt-3 flex gap-2">
                <button onClick={() => setSelectedTeam("home")}
                  className={`flex-1 rounded-lg py-1.5 text-[10px] font-black transition-colors ${selectedTeam === "home" ? "bg-blue-600 text-white" : "border border-white/10 text-white/40"}`}>
                  {homeTeam}
                </button>
                <button onClick={() => setSelectedTeam("away")}
                  className={`flex-1 rounded-lg py-1.5 text-[10px] font-black transition-colors ${selectedTeam === "away" ? "bg-orange-600 text-white" : "border border-white/10 text-white/40"}`}>
                  {awayTeam}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Event buttons */}
        {phase === "live" && (
          <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {FAN_EVENTS.map(ev => (
              <button
                key={ev.type}
                onPointerDown={() => tapEvent(ev.type, ev.emoji)}
                className={`flex flex-col items-center rounded-2xl border py-3 transition-transform active:scale-95 select-none ${ev.color}`}
              >
                <span className="text-xl mb-0.5">{ev.emoji}</span>
                <span className="text-[9px] font-black">{ev.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Commentary Feed */}
        {feed.length > 0 && (
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Live Feed</p>
              <div className="flex gap-1.5">
                <button onClick={copyFeed} className="rounded-lg border border-white/10 px-2 py-1 text-[9px] font-bold text-white/50 hover:text-white">
                  {copied ? "✓ Copied" : "Copy"}
                </button>
                <button onClick={shareWhatsApp} className="rounded-lg border border-green-500/30 bg-green-500/10 px-2 py-1 text-[9px] font-bold text-green-400">
                  WhatsApp
                </button>
              </div>
            </div>
            <div className="max-h-80 space-y-1.5 overflow-y-auto rounded-2xl border border-white/10 bg-card/40 p-3">
              {feed.map(ev => (
                <div key={ev.id} className={`flex items-start gap-2 rounded-lg px-2 py-1.5 ${ev.team === "home" ? "bg-blue-500/5" : ev.team === "away" ? "bg-orange-500/5" : "bg-white/3"}`}>
                  <span className="text-xs mt-0.5 shrink-0">{ev.emoji}</span>
                  <div>
                    <span className="text-[9px] font-black text-white/30 mr-1.5">{ev.min}&apos;</span>
                    {ev.generating ? (
                      <span className="text-[10px] text-white/30 animate-pulse">generating…</span>
                    ) : (
                      <span className="text-[10px] text-white/70 leading-relaxed">{ev.commentary}</span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </div>
        )}

        {/* End match */}
        {phase === "live" && (
          <button onClick={endMatch}
            className="w-full rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/20">
            End Match · Generate Full Report
          </button>
        )}

        {/* Ended */}
        {phase === "ended" && (
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4 space-y-3">
            <p className="text-center text-xs font-black text-green-400">
              Full time · {homeTeam} {homeScore}–{awayScore} {awayTeam}
            </p>
            <p className="text-center text-[10px] text-white/40">{feed.length} events · {fmtTime(elapsed)} covered</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={copyFeed} className="rounded-xl border border-white/20 py-2.5 text-xs font-bold text-white/70 hover:bg-white/10 flex items-center justify-center gap-1.5">
                {copied ? "✓ Copied!" : "📋 Copy Report"}
              </button>
              <button onClick={shareWhatsApp} className="rounded-xl border border-green-500/40 bg-green-500/10 py-2.5 text-xs font-bold text-green-400 flex items-center justify-center gap-1.5">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                Share on WhatsApp
              </button>
            </div>
            <button onClick={resetAll} className="w-full rounded-xl border border-white/10 py-2 text-xs font-bold text-white/30 hover:text-white/60">
              New Match
            </button>
          </div>
        )}

      </main>
    </div>
  );
}

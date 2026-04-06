"use client";

/**
 * /player/ubuntu/live/[sessionId]
 *
 * Innovation 05 — Ubuntu Live Session
 * Two Ubuntu partners train together in real time.
 * THUTO coaches both players, alternating demonstrator / observer roles.
 *
 * Sync mechanism: polling every 3 seconds against /api/ubuntu/session-state
 * (no WebSocket required — works on 2G/3G Zimbabwe networks)
 *
 * Phase machine:
 *   waiting → intro → drill → feedback → rest → (next drill) → done
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import {
  Users, ArrowLeft, Wifi, WifiOff,
  ChevronRight, Star, Trophy, Zap, Eye, Hand,
} from "lucide-react";
import type { GroupDrill } from "@/app/api/ubuntu/group-plan/route";

// ── Types ──────────────────────────────────────────────────────────────────────

type SessionPhase =
  | "loading"      // fetching plan
  | "waiting"      // host waits for partner to join
  | "intro"        // 5-second countdown before first drill
  | "drill"        // active drill
  | "feedback"     // observer gives verbal feedback (15s)
  | "rest"         // rest between drills
  | "done";        // session complete

interface LiveState {
  phase:          SessionPhase;
  drillIndex:     number;         // 0-based index into drills array
  startAt:        number | null;  // absolute epoch ms when current phase began
  partnerJoined:  boolean;
  partnerName:    string | null;
  playerAName:    string;
  playerBName:    string;
  isHost:         boolean;        // true = created session, playerA slot
}

interface GroupPlan {
  sessionId:   string;
  focus:       string;
  drills:      GroupDrill[];
  generatedAt: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const INTRO_DURATION  = 5;    // seconds
const FEEDBACK_DURATION = 15; // seconds observer gives feedback
const POLL_INTERVAL_MS = 3000;

// Leadership points
const DEMO_PTS = 10;
const OBS_PTS  = 5;

// ── localStorage helpers (session state shared via server — localStorage for own identity) ──

const LS_SESSION_KEY = (sid: string) => `gs_ubuntu_live_${sid}`;

interface LocalSession {
  sessionId:  string;
  role:       "A" | "B";
  playerName: string;
  joinedAt:   number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function UbuntuLivePage() {
  const router    = useRouter();
  const params    = useParams();
  const sessionId = params?.sessionId as string;
  const user      = useAuthStore((s) => s.user);

  // ── Plan ────────────────────────────────────────────────────────────────────
  const [plan,  setPlan]  = useState<GroupPlan | null>(null);
  const [focus, setFocus] = useState("Football skills");

  // ── Session identity ────────────────────────────────────────────────────────
  const [myRole,       setMyRole]       = useState<"A" | "B" | null>(null);
  const [partnerName,  setPartnerName]  = useState<string | null>(null);
  const [partnerOnline, setPartnerOnline] = useState(false);

  // ── Phase ───────────────────────────────────────────────────────────────────
  const [phase,      setPhase]      = useState<SessionPhase>("loading");
  const [drillIndex, setDrillIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // ── Score ───────────────────────────────────────────────────────────────────
  const [myPoints,      setMyPoints]      = useState(0);
  const [partnerPoints, setPartnerPoints] = useState(0);

  // ── Sync ────────────────────────────────────────────────────────────────────
  const [syncing, setSyncing] = useState(false);
  const startAtRef = useRef<number | null>(null);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const drill       = plan?.drills[drillIndex] ?? null;
  const myDemoRole  = drill ? drill.demonstrator === myRole : false;
  const playerAName = (useAuthStore.getState().user?.name ?? "Player A");

  // ── Wake Lock ────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } }).wakeLock.request("screen");
        }
      } catch { /* non-critical */ }
    })();
    return () => { wakeLockRef.current?.release().catch(() => {}); };
  }, []);

  // ── Establish identity ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;

    const stored = localStorage.getItem(LS_SESSION_KEY(sessionId));
    if (stored) {
      const local = JSON.parse(stored) as LocalSession;
      setMyRole(local.role);
      return;
    }

    // First visit — determine role from URL search param or default to A
    const params = new URLSearchParams(window.location.search);
    const role = (params.get("role") === "B" ? "B" : "A") as "A" | "B";
    const name = user?.name ?? (role === "A" ? "Player A" : "Player B");
    const local: LocalSession = { sessionId, role, playerName: name, joinedAt: Date.now() };
    localStorage.setItem(LS_SESSION_KEY(sessionId), JSON.stringify(local));
    setMyRole(role);
  }, [sessionId, user]);

  // ── Load group plan ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId || !myRole) return;

    const stored = sessionStorage.getItem(`gs_ubuntu_plan_${sessionId}`);
    if (stored) {
      const p = JSON.parse(stored) as GroupPlan;
      setPlan(p);
      setFocus(p.focus);
      setPhase("waiting");
      return;
    }

    // Fetch or generate
    const params    = new URLSearchParams(window.location.search);
    const focusParam = params.get("focus") ?? "Football skills";
    const peerName  = params.get("peer")  ?? "Your partner";

    setFocus(focusParam);
    setPartnerName(peerName);

    fetch("/api/ubuntu/group-plan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId,
        playerA: myRole === "A" ? (user?.name ?? "Player A") : peerName,
        playerB: myRole === "B" ? (user?.name ?? "Player B") : peerName,
        focus:   focusParam,
      }),
    })
      .then((r) => r.json())
      .then((p: GroupPlan) => {
        sessionStorage.setItem(`gs_ubuntu_plan_${sessionId}`, JSON.stringify(p));
        setPlan(p);
        setPhase("waiting");
      })
      .catch(() => setPhase("waiting"));
  }, [sessionId, myRole, user]);

  // ── Polling — sync both clients ──────────────────────────────────────────────
  const syncState = useCallback(async () => {
    if (!sessionId || !myRole) return;
    setSyncing(true);
    try {
      const name = user?.name ?? (myRole === "A" ? "Player A" : "Player B");
      const res  = await fetch(`/api/ubuntu/session-state?id=${sessionId}&role=${myRole}&name=${encodeURIComponent(name)}`);
      if (!res.ok) return;
      const state = await res.json() as {
        partnerJoined: boolean;
        partnerName:   string | null;
        phase:         SessionPhase;
        drillIndex:    number;
        startAt:       number | null;
        partnerPoints: number;
      };

      setPartnerOnline(state.partnerJoined);
      if (state.partnerName) setPartnerName(state.partnerName);

      // Sync phase from server (host drives phase transitions)
      if (state.phase !== "loading" && state.phase !== phase) {
        setPhase(state.phase);
        setDrillIndex(state.drillIndex);
        if (state.startAt) startAtRef.current = state.startAt;
      }
      setPartnerPoints(state.partnerPoints ?? 0);
    } catch { /* ignore — network hiccup */ } finally {
      setSyncing(false);
    }
  }, [sessionId, myRole, user, phase]);

  useEffect(() => {
    pollRef.current = setInterval(syncState, POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [syncState]);

  // ── Phase timer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (phase === "loading" || phase === "waiting" || phase === "done") return;

    const phaseDurations: Partial<Record<SessionPhase, number>> = {
      intro:    INTRO_DURATION,
      drill:    drill?.duration ?? 90,
      feedback: FEEDBACK_DURATION,
      rest:     drill?.rest_seconds ?? 30,
    };

    const dur = phaseDurations[phase];
    if (!dur) return;

    if (!startAtRef.current) startAtRef.current = Date.now();
    const elapsed = Math.floor((Date.now() - startAtRef.current) / 1000);
    setSecondsLeft(Math.max(0, dur - elapsed));

    timerRef.current = setInterval(() => {
      const el = Math.floor((Date.now() - (startAtRef.current ?? Date.now())) / 1000);
      const rem = Math.max(0, dur - el);
      setSecondsLeft(rem);

      if (rem === 0) {
        clearInterval(timerRef.current!);
        advancePhase();
      }
    }, 500);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, drillIndex]);

  // ── Phase advancement (host only) ────────────────────────────────────────────
  const advancePhase = useCallback(async () => {
    startAtRef.current = Date.now();

    if (phase === "intro") {
      setPhase("drill");
      await pushPhase("drill", drillIndex, startAtRef.current);
      return;
    }

    if (phase === "drill") {
      // Award demonstrator points
      if (drill) {
        const pts = myDemoRole ? DEMO_PTS : OBS_PTS;
        setMyPoints((p) => p + pts);
      }
      setPhase("feedback");
      await pushPhase("feedback", drillIndex, startAtRef.current);
      return;
    }

    if (phase === "feedback") {
      if (drill && drill.rest_seconds > 0) {
        setPhase("rest");
        await pushPhase("rest", drillIndex, startAtRef.current);
      } else {
        goNextDrill();
      }
      return;
    }

    if (phase === "rest") {
      goNextDrill();
      return;
    }
  }, [phase, drillIndex, drill, myDemoRole]);

  const goNextDrill = useCallback(async () => {
    startAtRef.current = Date.now();
    if (!plan) return;
    if (drillIndex + 1 >= plan.drills.length) {
      setPhase("done");
      await pushPhase("done", drillIndex, startAtRef.current);
      return;
    }
    const next = drillIndex + 1;
    setDrillIndex(next);
    setPhase("drill");
    await pushPhase("drill", next, startAtRef.current);
  }, [plan, drillIndex]);

  const pushPhase = async (newPhase: SessionPhase, idx: number, startAt: number) => {
    try {
      await fetch("/api/ubuntu/session-state", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId, phase: newPhase, drillIndex: idx, startAt }),
      });
    } catch { /* non-critical */ }
  };

  // ── Host starts session when partner has joined ──────────────────────────────
  const startSession = useCallback(async () => {
    startAtRef.current = Date.now();
    setPhase("intro");
    await pushPhase("intro", 0, startAtRef.current);
  }, []);

  // ── Render helpers ────────────────────────────────────────────────────────────
  const myName      = user?.name ?? (myRole === "A" ? "Player A" : "Player B");
  const peerName    = partnerName ?? (myRole === "A" ? "Player B" : "Player A");
  const totalDrills = plan?.drills.length ?? 4;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, "0")}` : `${sec}s`;
  };

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (phase === "loading" || !plan || !myRole) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a1f0e] px-6">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-teal-500/30 bg-teal-900/30">
          <Users className="h-8 w-8 text-teal-400 animate-pulse" />
        </div>
        <p className="text-lg font-semibold text-white">Setting up your session…</p>
        <p className="mt-1 text-sm text-white/40">THUTO is building your group plan</p>
        <div className="mt-6 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-2 w-2 rounded-full bg-teal-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Waiting for partner ────────────────────────────────────────────────────────
  if (phase === "waiting") {
    const joinUrl = typeof window !== "undefined"
      ? `${window.location.origin}/player/ubuntu/live/${sessionId}?role=B&peer=${encodeURIComponent(myName)}&focus=${encodeURIComponent(focus)}`
      : "";

    return (
      <div className="flex min-h-screen flex-col bg-[#0a1f0e]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-safe-top pb-4 pt-6">
          <button onClick={() => router.push("/player/ubuntu")}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
            <ArrowLeft className="h-4 w-4 text-white/60" />
          </button>
          <div>
            <p className="text-sm font-bold text-white">Ubuntu Live Session</p>
            <p className="text-xs text-teal-400">{focus}</p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm flex-1 px-5 py-6 space-y-6">
          {/* THUTO message */}
          <div className="rounded-2xl border border-teal-500/20 bg-teal-900/20 p-5 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-teal-800/50">
              <span className="text-2xl">🤖</span>
            </div>
            <p className="text-sm font-semibold text-teal-300">
              {partnerOnline
                ? `${peerName} is here. You're ready to train.`
                : `Waiting for ${peerName} to join…`}
            </p>
            <p className="mt-1 text-xs text-white/40">
              {partnerOnline
                ? "Press Start when both of you are ready."
                : "Share the link below so they can join on their phone."}
            </p>
          </div>

          {/* Partner status */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className={`h-3 w-3 rounded-full flex-shrink-0 ${partnerOnline ? "bg-green-400 animate-pulse" : "bg-white/20"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{peerName}</p>
              <p className="text-xs text-white/40">{partnerOnline ? "Online — ready to train" : "Not yet joined"}</p>
            </div>
            {partnerOnline
              ? <Wifi className="h-4 w-4 text-green-400 flex-shrink-0" />
              : <WifiOff className="h-4 w-4 text-white/20 flex-shrink-0" />}
          </div>

          {/* Plan preview */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30">
              Today&apos;s {totalDrills} Drills
            </p>
            {plan.drills.map((d, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/3 px-3 py-2">
                <span className="text-xs font-bold text-white/20">{i + 1}</span>
                <p className="flex-1 text-xs text-white/60">{d.name}</p>
                <span className="text-xs text-white/30">{formatTime(d.duration)}</span>
              </div>
            ))}
          </div>

          {/* Share link */}
          {!partnerOnline && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30">
                Share with {peerName}
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={joinUrl}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/50 outline-none"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(joinUrl).catch(() => {})}
                  className="flex-shrink-0 rounded-xl bg-teal-700/40 px-3 py-2 text-xs font-medium text-teal-300 transition-colors hover:bg-teal-700/60"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          {/* Start button */}
          {myRole === "A" && (
            <button
              onClick={startSession}
              disabled={!partnerOnline}
              className="w-full rounded-2xl bg-teal-600 py-4 text-sm font-bold text-white shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-40 hover:bg-teal-500 active:scale-95"
            >
              {partnerOnline ? "Start Session Together →" : `Waiting for ${peerName}…`}
            </button>
          )}

          {myRole === "B" && partnerOnline && (
            <div className="rounded-2xl border border-teal-500/20 bg-teal-900/10 py-4 text-center">
              <p className="text-sm text-teal-300">You&apos;re in! Waiting for {plan.drills[0] ? `${plan.drills[0].demonstrator === "A" ? peerName : myName}` : "your partner"} to start.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Intro countdown ────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a1f0e] px-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-teal-400">Session starting in</p>
        <div className="my-6 text-9xl font-black text-white tabular-nums">{secondsLeft}</div>
        <p className="text-white/50">Get ready — {myName} &amp; {peerName}</p>
        <p className="mt-1 text-xs text-teal-300">{focus}</p>
      </div>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────────────
  if (phase === "done") {
    const totalPts = myPoints;
    return (
      <div className="flex min-h-screen flex-col bg-[#0a1f0e]">
        <div className="mx-auto w-full max-w-sm flex-1 px-5 py-10 space-y-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/20">
            <Trophy className="h-10 w-10 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Session Complete</h1>
            <p className="mt-1 text-sm text-white/50">You trained together. That takes character.</p>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-teal-500/20 bg-teal-900/20 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-400">{myName}</p>
              <p className="mt-1 text-3xl font-black text-white">{totalPts}</p>
              <p className="text-xs text-white/30">leadership pts</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">{peerName}</p>
              <p className="mt-1 text-3xl font-black text-white/60">{partnerPoints}</p>
              <p className="text-xs text-white/30">leadership pts</p>
            </div>
          </div>

          {/* THUTO message */}
          <div className="rounded-2xl border border-teal-500/20 bg-teal-900/10 p-5 text-left">
            <p className="text-sm font-semibold text-teal-300">THUTO says:</p>
            <p className="mt-2 text-sm leading-relaxed text-white/70 italic">
              &quot;When you teach, you learn twice. Both of you showed the Ubuntu spirit today.
              {totalPts > partnerPoints
                ? ` ${myName}, you led well — carry that confidence into your next session.`
                : totalPts < partnerPoints
                ? ` ${peerName} earned more points today — study what they did and challenge them next time.`
                : " Equal points — perfectly balanced. Train together again soon."}&quot;
            </p>
          </div>

          <button
            onClick={() => router.push("/player/ubuntu")}
            className="w-full rounded-2xl bg-teal-600 py-4 text-sm font-bold text-white hover:bg-teal-500 active:scale-95 transition-all"
          >
            Back to Ubuntu Hub
          </button>
        </div>
      </div>
    );
  }

  // ── Active drill / feedback / rest ────────────────────────────────────────────
  const isDemo   = myDemoRole;
  const isDrill  = phase === "drill";
  const isFback  = phase === "feedback";
  const isRest   = phase === "rest";

  // Progress
  const progress = ((drillIndex) / totalDrills) * 100;

  return (
    <div className="flex min-h-screen flex-col bg-[#0a1f0e]">

      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-3">
        <button onClick={() => router.push("/player/ubuntu")}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
          <ArrowLeft className="h-4 w-4 text-white/60" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-white truncate">{focus}</p>
            <span className={`flex h-2 w-2 rounded-full flex-shrink-0 ${partnerOnline ? "bg-green-400 animate-pulse" : "bg-white/20"}`} />
          </div>
          <p className="text-xs text-white/40">Drill {drillIndex + 1} of {totalDrills}</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2 py-1">
          <Star className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs font-bold text-white">{myPoints}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-white/5">
        <div className="h-full bg-teal-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="mx-auto w-full max-w-sm flex-1 px-5 py-5 flex flex-col gap-5">

        {/* ── Role badge ── */}
        <div className={`flex items-center gap-3 rounded-2xl p-4 ${
          isDemo
            ? "border border-amber-500/30 bg-amber-900/20"
            : "border border-teal-500/20 bg-teal-900/20"
        }`}>
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
            isDemo ? "bg-amber-800/50" : "bg-teal-800/50"
          }`}>
            {isDemo ? <Hand className="h-5 w-5 text-amber-400" /> : <Eye className="h-5 w-5 text-teal-400" />}
          </div>
          <div>
            <p className={`text-sm font-bold ${isDemo ? "text-amber-300" : "text-teal-300"}`}>
              {isDemo ? "You are DEMONSTRATING" : "You are OBSERVING"}
            </p>
            <p className="text-xs text-white/40">
              {isDemo
                ? `${peerName} watches and learns from you (+${DEMO_PTS} pts)`
                : `Watch ${peerName} closely — you give feedback (+${OBS_PTS} pts)`}
            </p>
          </div>
        </div>

        {/* ── Phase content ── */}
        {isDrill && drill && (
          <div className="space-y-4 flex-1">
            {/* Drill name + timer */}
            <div className="text-center">
              <p className="text-2xl font-black text-white">{drill.name}</p>
              <div className="mt-2 text-6xl font-black text-teal-400 tabular-nums">{formatTime(secondsLeft)}</div>
              {/* Countdown bar */}
              <div className="mt-3 h-2 w-full rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-teal-500 transition-all duration-1000"
                  style={{ width: `${(secondsLeft / (drill.duration)) * 100}%` }}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30 mb-2">What to do</p>
              <p className="text-sm leading-relaxed text-white/80">{drill.instructions}</p>
            </div>

            {/* Observer coaching cue */}
            {!isDemo && (
              <div className="rounded-2xl border border-teal-500/20 bg-teal-900/10 p-4 flex gap-3">
                <span className="text-xl flex-shrink-0">🤖</span>
                <div>
                  <p className="text-xs font-semibold text-teal-400 mb-1">THUTO says to you:</p>
                  <p className="text-sm italic text-white/70 leading-relaxed">&ldquo;{drill.coaching_cue}&rdquo;</p>
                </div>
              </div>
            )}

            {/* Demo encouragement */}
            {isDemo && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-900/10 p-4 flex gap-3">
                <span className="text-xl flex-shrink-0">🤖</span>
                <div>
                  <p className="text-xs font-semibold text-amber-400 mb-1">THUTO says to you:</p>
                  <p className="text-sm italic text-white/70 leading-relaxed">
                    &ldquo;Show {peerName} exactly how you do it. Slow it down if needed — teaching is learning twice.&rdquo;
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Feedback phase ── */}
        {isFback && drill && (
          <div className="space-y-4 flex-1">
            <div className="text-center">
              <p className="text-xl font-black text-white">Give Feedback</p>
              <div className="mt-1 text-5xl font-black text-teal-400 tabular-nums">{secondsLeft}s</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
              {isDemo ? (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/30">Listen to {peerName}</p>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {peerName} watched you closely. Listen to their observation — it will help both of you improve.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-400">Your turn to speak</p>
                  <p className="text-sm text-white/80 leading-relaxed">
                    Tell {peerName} one specific thing you noticed. Be kind. Be exact.
                  </p>
                  <div className="rounded-xl border border-teal-500/20 bg-teal-900/20 p-3">
                    <p className="text-xs text-teal-300 italic">&ldquo;{drill.coaching_cue}&rdquo;</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-white/30">
              <Zap className="h-3.5 w-3.5" />
              <span>Next drill in {secondsLeft} seconds</span>
            </div>
          </div>
        )}

        {/* ── Rest phase ── */}
        {isRest && drill && (
          <div className="space-y-4 flex-1 text-center">
            <div>
              <p className="text-xl font-black text-white">Rest</p>
              <div className="mt-2 text-6xl font-black text-white/40 tabular-nums">{formatTime(secondsLeft)}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-white/50">
                {drillIndex + 1 < totalDrills
                  ? `Next: Drill ${drillIndex + 2} — ${plan.drills[drillIndex + 1]?.name ?? ""}`
                  : "Final drill coming up"}
              </p>
              <p className="mt-2 text-xs text-white/30">
                {drillIndex + 1 < totalDrills
                  ? (plan.drills[drillIndex + 1]?.demonstrator === myRole
                    ? "You will DEMONSTRATE next"
                    : "You will OBSERVE next")
                  : ""}
              </p>
            </div>

            {/* Drink water reminder */}
            <p className="text-xs text-white/20 flex items-center justify-center gap-1.5">
              💧 Take a breath. Drink water if you have it.
            </p>
          </div>
        )}

        {/* ── Skip / Next button (host only, during drill / feedback / rest) ── */}
        {myRole === "A" && phase !== "waiting" && phase !== "intro" && phase !== "done" && (
          <button
            onClick={advancePhase}
            className="mt-auto flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 text-xs text-white/40 transition-colors hover:bg-white/10"
          >
            Skip <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

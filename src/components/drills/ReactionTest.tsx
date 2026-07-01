"use client";
// src/components/drills/ReactionTest.tsx
// Browser-based reaction test — no video needed.
// 5 rounds: random colour appears, player taps as fast as possible.
// Returns average reaction time in ms and a 0-100 score.

import { useState, useEffect, useRef, useCallback } from "react";

interface ReactionTestProps {
  onComplete: (result: { avg_ms: number; score: number; rounds: number[] }) => void;
  onSkip?: () => void;
}

const COLOURS = [
  { bg: "#16a34a", label: "GREEN",  text: "#fff" },
  { bg: "#2563eb", label: "BLUE",   text: "#fff" },
  { bg: "#dc2626", label: "RED",    text: "#fff" },
  { bg: "#c8962a", label: "GOLD",   text: "#fff" },
  { bg: "#7c3aed", label: "PURPLE", text: "#fff" },
];

const TOTAL_ROUNDS = 5;
const MIN_WAIT_MS  = 1500;
const MAX_WAIT_MS  = 4000;

type Phase = "intro" | "waiting" | "react" | "too_early" | "done";

export default function ReactionTest({ onComplete, onSkip }: ReactionTestProps) {
  const [phase,       setPhase]       = useState<Phase>("intro");
  const [round,       setRound]       = useState(0);
  const [colour,      setColour]      = useState(COLOURS[0]);
  const [times,       setTimes]       = useState<number[]>([]);
  const [lastTime,    setLastTime]    = useState<number | null>(null);
  const [countdown,   setCountdown]   = useState(3);

  const startRef    = useRef<number>(0);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (timerRef.current)  clearTimeout(timerRef.current);
    if (countRef.current)  clearInterval(countRef.current);
  };

  // Score formula: 100 = 150ms (elite), 0 = 700ms+ (very slow)
  const msToScore = (ms: number): number =>
    Math.max(0, Math.min(100, Math.round(100 - ((ms - 150) / 5.5))));

  const startRound = useCallback(() => {
    clearTimers();
    setPhase("waiting");
    setLastTime(null);

    const wait = MIN_WAIT_MS + Math.random() * (MAX_WAIT_MS - MIN_WAIT_MS);
    const col  = COLOURS[Math.floor(Math.random() * COLOURS.length)];

    timerRef.current = setTimeout(() => {
      setColour(col);
      startRef.current = performance.now();
      setPhase("react");
    }, wait);
  }, []);

  const handleTap = useCallback(() => {
    if (phase === "waiting") {
      // Too early
      clearTimers();
      setPhase("too_early");
      return;
    }

    if (phase !== "react") return;

    const elapsed = Math.round(performance.now() - startRef.current);
    setLastTime(elapsed);

    setTimes(prev => {
      const newTimes = [...prev, elapsed];
      const nextRound = round + 1;

      if (nextRound >= TOTAL_ROUNDS) {
        // All rounds done
        const avg = Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length);
        const score = msToScore(avg);
        setTimeout(() => {
          setPhase("done");
          onComplete({ avg_ms: avg, score, rounds: newTimes });
        }, 800);
      } else {
        setRound(nextRound);
        setTimeout(() => startRound(), 1200);
      }

      return newTimes;
    });

    setPhase("waiting"); // brief pause state before next round
  }, [phase, round, startRound, onComplete]);

  // Countdown before first round
  useEffect(() => {
    if (phase !== "intro") return;
    setCountdown(3);
    let c = 3;
    countRef.current = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(countRef.current!);
        setRound(0);
        setTimes([]);
        startRound();
      }
    }, 1000);
    return () => clearTimers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => () => clearTimers(), []);

  const avg = times.length > 0
    ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    : 0;

  const ratingLabel = (ms: number) =>
    ms < 200 ? "Elite" : ms < 250 ? "Excellent" : ms < 300 ? "Good" : ms < 400 ? "Average" : "Developing";

  const ratingColor = (ms: number) =>
    ms < 200 ? "#059669" : ms < 250 ? "#16a34a" : ms < 300 ? "#c8962a" : ms < 400 ? "#ea580c" : "#dc2626";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>

      {/* Countdown overlay */}
      {phase === "intro" && countdown > 0 && (
        <div style={{
          width: "100%", minHeight: 320, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "#1a5c2a", borderRadius: 16, gap: 12,
        }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Get ready…
          </div>
          <div style={{ fontSize: 96, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
            {countdown}
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
            Tap as fast as you can when the colour appears
          </div>
        </div>
      )}

      {/* Main tap area */}
      {(phase === "waiting" || phase === "react") && (
        <button
          onClick={handleTap}
          style={{
            width: "100%", minHeight: 320, borderRadius: 16, border: "none",
            cursor: "pointer", transition: "background 0.05s",
            background: phase === "react" ? colour.bg : "#1f2937",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 12,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {phase === "waiting" ? (
            <>
              <div style={{ fontSize: 48 }}>⏳</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>
                Wait for the colour…
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                Round {round + 1} of {TOTAL_ROUNDS}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 48 }}>👆</div>
              <div style={{ fontSize: 20, color: colour.text, fontWeight: 900 }}>
                TAP NOW!
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                {colour.label}
              </div>
            </>
          )}
        </button>
      )}

      {/* Too early */}
      {phase === "too_early" && (
        <div style={{
          width: "100%", minHeight: 280, background: "#fef2f2", borderRadius: 16,
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 12, border: "2px solid #fecaca",
        }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#dc2626" }}>Too early!</div>
          <div style={{ fontSize: 13, color: "#991b1b" }}>Wait for the colour before tapping</div>
          <button
            onClick={() => { setPhase("intro"); }}
            style={{ marginTop: 8, padding: "10px 24px", background: "#1a5c2a", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Round result flash */}
      {lastTime !== null && phase === "waiting" && times.length < TOTAL_ROUNDS && (
        <div style={{ marginTop: 12, fontSize: 13, color: "#059669", fontWeight: 700 }}>
          {lastTime}ms ✓ — {ratingLabel(lastTime)}
        </div>
      )}

      {/* Progress dots */}
      {(phase === "waiting" || phase === "react") && (
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
            <div key={i} style={{
              width: 10, height: 10, borderRadius: "50%",
              background: i < times.length ? "#059669" : i === times.length ? "#c8962a" : "#e5e7eb",
              transition: "background 0.3s",
            }} />
          ))}
        </div>
      )}

      {/* Done — mini summary shown inline, parent handles full results */}
      {phase === "done" && (
        <div style={{
          width: "100%", background: "#f0fdf4", borderRadius: 16,
          padding: 24, textAlign: "center", border: "2px solid #bbf7d0",
        }}>
          <div style={{ fontSize: 11, color: "#059669", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            Reaction Test Complete
          </div>
          <div style={{ fontSize: 56, fontWeight: 900, color: "#1a5c2a", lineHeight: 1 }}>{avg}<span style={{ fontSize: 16 }}>ms</span></div>
          <div style={{ fontSize: 13, color: ratingColor(avg), fontWeight: 800, marginTop: 4 }}>{ratingLabel(avg)}</div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 8 }}>
            Score: {msToScore(avg)}/100
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
            {times.map((t, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>R{i + 1}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: ratingColor(t) }}>{t}ms</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skip option */}
      {onSkip && phase !== "done" && (
        <button
          onClick={onSkip}
          style={{ marginTop: 16, fontSize: 11, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
        >
          Skip this test
        </button>
      )}
    </div>
  );
}
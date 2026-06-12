"use client";

import { useEffect, useState, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Challenge {
  id: string;
  title: string;
  description: string;
  target: string;
  icon: string;
  completed: boolean;
  progress: number; // 0-100
}

interface WeeklyState {
  weekKey: string;
  challenges: Challenge[];
  streakDays: number;
  notifScheduled: boolean;
}

interface LeaderboardEntry {
  initials: string;
  school: string;
  score: number;
  rank: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getISOWeekKey(): string {
  const d = new Date();
  const thursday = new Date(d);
  thursday.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const yearStart = new Date(thursday.getFullYear(), 0, 4);
  const weekNum = Math.round(
    ((thursday.getTime() - yearStart.getTime()) / 86400000 -
      3 +
      ((yearStart.getDay() + 6) % 7)) /
      7
  );
  return `${thursday.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function isFriday(): boolean {
  return new Date().getDay() === 5;
}

function buildDefaultChallenges(): Challenge[] {
  return [
    {
      id: "personal_best_hunt",
      title: "Personal Best Hunt",
      description: "Beat your highest session score from last week",
      target: "Score higher than your PB",
      icon: "fire",
      completed: false,
      progress: 0,
    },
    {
      id: "position_king",
      title: "Position King",
      description: "Complete 3 drills specific to your position",
      target: "3 position drills",
      icon: "crown",
      completed: false,
      progress: 0,
    },
    {
      id: "balance_master",
      title: "Balance Master",
      description: "Achieve a symmetry score above 80 in a biometric scan",
      target: "Symmetry score 80+",
      icon: "target",
      completed: false,
      progress: 0,
    },
    {
      id: "ball_wizard",
      title: "Ball Wizard",
      description: "Log a juggling or first-touch drill session this week",
      target: "Complete 1 touch drill",
      icon: "star",
      completed: false,
      progress: 0,
    },
  ];
}

function loadWeeklyState(): WeeklyState {
  const weekKey = getISOWeekKey();
  try {
    const raw = localStorage.getItem("gs_weekly_challenges");
    if (raw) {
      const stored: WeeklyState = JSON.parse(raw);
      if (stored.weekKey === weekKey) return stored;
    }
  } catch {
    // corrupted — reset
  }
  return {
    weekKey,
    challenges: buildDefaultChallenges(),
    streakDays: 0,
    notifScheduled: false,
  };
}

function saveWeeklyState(state: WeeklyState): void {
  localStorage.setItem("gs_weekly_challenges", JSON.stringify(state));
}

// ── Icons (inline SVG strings rendered via dangerouslySetInnerHTML) ──────────

const ICON_MAP: Record<string, string> = {
  fire: "🔥",
  crown: "👑",
  target: "🎯",
  star: "⭐",
};

// ── Mock leaderboard (replaced by API data when backend is ready) ─────────────

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { initials: "T.M.", school: "Prince Edward HS", score: 94, rank: 1 },
  { initials: "K.C.", school: "St Georges College", score: 88, rank: 2 },
  { initials: "R.N.", school: "Harare HS", score: 82, rank: 3 },
  { initials: "F.D.", school: "Churchill HS", score: 79, rank: 4 },
  { initials: "O.M.", school: "Allan Wilson HS", score: 74, rank: 5 },
];

// ── Component ────────────────────────────────────────────────────────────────

interface WeeklyChallengesProps {
  playerAqScore?: number;
  playerSessionCount?: number;
  className?: string;
}

export default function WeeklyChallenges({
  playerAqScore = 0,
  playerSessionCount = 0,
  className = "",
}: WeeklyChallengesProps) {
  const [state, setState] = useState<WeeklyState | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD);
  const [activeTab, setActiveTab] = useState<"challenges" | "leaderboard">("challenges");
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadWeeklyState();

    // Seed progress from player stats
    const updated = { ...loaded };
    updated.challenges = loaded.challenges.map((c) => {
      if (c.id === "personal_best_hunt" && playerAqScore > 0) {
        return { ...c, progress: Math.min(100, playerAqScore) };
      }
      if (c.id === "position_king" && playerSessionCount > 0) {
        return { ...c, progress: Math.min(100, Math.round((Math.min(playerSessionCount, 3) / 3) * 100)) };
      }
      return c;
    });

    setState(updated);
    saveWeeklyState(updated);

    // Check notification permission
    if (typeof Notification !== "undefined") {
      setNotifPermission(Notification.permission);
    }
  }, [playerAqScore, playerSessionCount]);

  // Fetch leaderboard from backend (no-op if unavailable)
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL;
    if (!API) return;
    fetch(`${API}/challenges/school-leaderboard`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
          setLeaderboard(data.data);
        }
      })
      .catch(() => {/* use mock */});
  }, []);

  const markComplete = useCallback(
    (challengeId: string) => {
      if (!state) return;
      const updated: WeeklyState = {
        ...state,
        challenges: state.challenges.map((c) =>
          c.id === challengeId ? { ...c, completed: true, progress: 100 } : c
        ),
      };
      setState(updated);
      saveWeeklyState(updated);
    },
    [state]
  );

  const scheduleFridayReminder = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission !== "granted") return;
    }
    if (isFriday()) {
      new Notification("Keep your GrassRoots streak alive!", {
        body: "It is Friday — complete a session today to keep your streak.",
        icon: "/icons/icon-192.png",
      });
    }
    if (!state) return;
    const updated = { ...state, notifScheduled: true };
    setState(updated);
    saveWeeklyState(updated);
  }, [state]);

  if (!state) return null;

  const completedCount = state.challenges.filter((c) => c.completed).length;
  const allDone = completedCount === state.challenges.length;

  return (
    <div
      className={`rounded-2xl border overflow-hidden ${className}`}
      style={{ borderColor: "rgba(255,255,255,0.12)", background: "#1a3d26" }}
    >
      {/* Header */}
      <div
        className="px-5 pt-5 pb-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div>
          <h3 className="font-bold text-base" style={{ color: "#f0b429" }}>
            Weekly Challenges
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
            {getISOWeekKey()} &bull; {completedCount}/{state.challenges.length} complete
          </p>
        </div>

        {allDone && (
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: "#22c55e", color: "#fff" }}
          >
            Week done!
          </span>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        {(["challenges", "leaderboard"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2.5 text-xs font-medium capitalize transition-colors"
            style={{
              color: activeTab === tab ? "#f0b429" : "rgba(255,255,255,0.45)",
              borderBottom: activeTab === tab ? "2px solid #f0b429" : "2px solid transparent",
              background: "transparent",
            }}
          >
            {tab === "challenges" ? "Challenges" : "School Board"}
          </button>
        ))}
      </div>

      {/* Challenges tab */}
      {activeTab === "challenges" && (
        <div className="p-4 space-y-3">
          {state.challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="rounded-xl p-3.5"
              style={{
                background: challenge.completed
                  ? "rgba(34,197,94,0.1)"
                  : "rgba(255,255,255,0.05)",
                border: challenge.completed
                  ? "1px solid rgba(34,197,94,0.3)"
                  : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl leading-none mt-0.5">
                  {ICON_MAP[challenge.icon] ?? "🏆"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white truncate">
                      {challenge.title}
                    </p>
                    {challenge.completed ? (
                      <span className="text-xs font-bold shrink-0" style={{ color: "#22c55e" }}>
                        Done ✓
                      </span>
                    ) : (
                      <button
                        onClick={() => markComplete(challenge.id)}
                        className="text-xs font-medium px-2.5 py-1 rounded-lg shrink-0 transition-opacity hover:opacity-80"
                        style={{ background: "#f0b429", color: "#1a2e1a" }}
                      >
                        Mark done
                      </button>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {challenge.description}
                  </p>

                  {/* Progress bar */}
                  {challenge.progress > 0 && (
                    <div
                      className="mt-2 rounded-full overflow-hidden"
                      style={{ height: 4, background: "rgba(255,255,255,0.1)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${challenge.progress}%`,
                          background: challenge.completed ? "#22c55e" : "#f0b429",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Friday streak reminder */}
          <div
            className="rounded-xl p-3.5 flex items-center justify-between gap-3"
            style={{
              background: "rgba(240,180,41,0.08)",
              border: "1px solid rgba(240,180,41,0.2)",
            }}
          >
            <div>
              <p className="text-xs font-semibold" style={{ color: "#f0b429" }}>
                Friday Streak Reminder
              </p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                {state.notifScheduled
                  ? "Reminder is set for this Friday"
                  : "Get a push alert every Friday to protect your streak"}
              </p>
            </div>
            {!state.notifScheduled && notifPermission !== "denied" && (
              <button
                onClick={scheduleFridayReminder}
                className="text-xs font-medium px-3 py-1.5 rounded-lg shrink-0 transition-opacity hover:opacity-80"
                style={{ background: "rgba(240,180,41,0.2)", color: "#f0b429", border: "1px solid rgba(240,180,41,0.4)" }}
              >
                Remind me
              </button>
            )}
            {state.notifScheduled && (
              <span className="text-lg shrink-0">🔔</span>
            )}
            {notifPermission === "denied" && (
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                Blocked
              </span>
            )}
          </div>
        </div>
      )}

      {/* School leaderboard tab */}
      {activeTab === "leaderboard" && (
        <div className="p-4">
          <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>
            Top players by weekly challenge score — anonymised
          </p>
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div
                key={entry.rank}
                className="flex items-center gap-3 rounded-xl px-3.5 py-2.5"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <span
                  className="text-sm font-bold w-6 text-center shrink-0"
                  style={{
                    color:
                      entry.rank === 1
                        ? "#f0b429"
                        : entry.rank === 2
                        ? "#94a3b8"
                        : entry.rank === 3
                        ? "#cd7f32"
                        : "rgba(255,255,255,0.4)",
                  }}
                >
                  {entry.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{entry.initials}</p>
                  <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {entry.school}
                  </p>
                </div>
                <span
                  className="text-sm font-bold shrink-0"
                  style={{ color: "#f0b429" }}
                >
                  {entry.score}
                </span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs mt-4" style={{ color: "rgba(255,255,255,0.3)" }}>
            Complete challenges to climb the board
          </p>
        </div>
      )}
    </div>
  );
}

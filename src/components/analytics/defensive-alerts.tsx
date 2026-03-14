"use client";

import { useState } from "react";
import { AlertTriangle, X, ShieldCheck } from "lucide-react";

export interface MatchRecord {
  id: string;
  opponent: string;
  venue: "home" | "away" | "neutral";
  date: string;
  our_score: number;
  their_score: number;
  formation: string;
  scorers: string;
  yellow_cards: number;
  red_cards: number;
  notes: string;
}

interface Alert {
  id: string;
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
}

/** Returns outcome of a single match. */
function outcome(m: MatchRecord): "W" | "D" | "L" {
  return m.our_score > m.their_score ? "W" : m.our_score === m.their_score ? "D" : "L";
}

/** Runs rule-based tactical analysis and returns alert objects. */
function computeAlerts(matches: MatchRecord[]): Alert[] {
  if (matches.length === 0) return [];

  const alerts: Alert[] = [];

  // ── High goals conceded ────────────────────────────────────────────────────
  const avgConceded =
    matches.reduce((s, m) => s + m.their_score, 0) / matches.length;
  if (avgConceded > 2) {
    alerts.push({
      id: "high-conceded",
      title: "Defensive line too high or disorganised",
      detail: `You are conceding an average of ${avgConceded.toFixed(1)} goals per match. Review your defensive shape and line height.`,
      severity: "high",
    });
  }

  // ── Red card correlation ────────────────────────────────────────────────────
  const redCardMatches = matches.filter((m) => m.red_cards > 0);
  if (redCardMatches.length >= 2) {
    const redLosses = redCardMatches.filter((m) => outcome(m) === "L").length;
    const redLossPct = redLosses / redCardMatches.length;
    if (redLossPct >= 0.8) {
      alerts.push({
        id: "red-card-losses",
        title: "Discipline is costing you matches",
        detail: `${Math.round(redLossPct * 100)}% of matches where you received a red card ended in defeat. Focus on reducing unnecessary fouls.`,
        severity: "high",
      });
    }
  }

  // ── 3-back formation alert ─────────────────────────────────────────────────
  const threeBackFormations = ["3-5-2", "3-4-3", "3-4-2-1"];
  const threeBackMatches = matches.filter((m) =>
    threeBackFormations.includes(m.formation)
  );
  if (threeBackMatches.length >= 3) {
    const losses = threeBackMatches.filter((m) => outcome(m) === "L").length;
    const lossPct = losses / threeBackMatches.length;
    if (lossPct > 0.6) {
      alerts.push({
        id: "3back-vulnerable",
        title: "3-back system may be costing you",
        detail: `You lose ${Math.round(lossPct * 100)}% of matches played with a 3-back formation. Consider switching to a 4-4-2 or 4-3-3 for more defensive cover.`,
        severity: "medium",
      });
    }
  }

  // ── Second half collapse ────────────────────────────────────────────────────
  const secondHalfKeywords = ["2h", "second half", "late goal", "tired", "fitness"];
  const collapseMatches = matches.filter((m) =>
    secondHalfKeywords.some((kw) => m.notes.toLowerCase().includes(kw))
  );
  if (collapseMatches.length >= 2) {
    alerts.push({
      id: "second-half-collapse",
      title: "Potential fitness issue — goals conceded late",
      detail: `${collapseMatches.length} match notes mention second-half problems. Review conditioning sessions and squad rotation.`,
      severity: "medium",
    });
  }

  // ── Clean sheet rate ────────────────────────────────────────────────────────
  const cleanSheets = matches.filter((m) => m.their_score === 0).length;
  const cleanSheetPct = (cleanSheets / matches.length) * 100;
  if (cleanSheetPct < 20) {
    alerts.push({
      id: "low-clean-sheets",
      title: "Very low clean sheet rate",
      detail: `Only ${cleanSheetPct.toFixed(0)}% clean sheets (${cleanSheets}/${matches.length} matches). Defensive drills and set-piece training recommended.`,
      severity: "high",
    });
  }

  return alerts;
}

const SEVERITY_STYLES: Record<Alert["severity"], string> = {
  high: "border-red-500/30 bg-red-500/5",
  medium: "border-amber-500/30 bg-amber-500/5",
  low: "border-blue-500/30 bg-blue-500/5",
};

const SEVERITY_ICON_STYLES: Record<Alert["severity"], string> = {
  high: "text-red-500",
  medium: "text-amber-500",
  low: "text-blue-500",
};

interface DefensiveAlertsProps {
  matches: MatchRecord[];
}

/** Displays rule-based defensive and tactical alerts derived from match history. */
export function DefensiveAlerts({ matches }: DefensiveAlertsProps) {
  const allAlerts = computeAlerts(matches);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = allAlerts.filter((a) => !dismissed.has(a.id));

  const dismiss = (id: string) =>
    setDismissed((prev) => new Set(Array.from(prev).concat(id)));

  if (matches.length === 0) return null;

  if (visible.length === 0) {
    const cleanSheets = matches.filter((m) => m.their_score === 0).length;
    const pct = ((cleanSheets / matches.length) * 100).toFixed(0);
    return (
      <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <p className="text-sm font-medium text-green-700">
            No defensive alerts — looking solid!
          </p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Clean sheet rate: {pct}% ({cleanSheets}/{matches.length} matches)
        </p>
      </div>
    );
  }

  const cleanSheets = matches.filter((m) => m.their_score === 0).length;
  const cleanSheetPct = ((cleanSheets / matches.length) * 100).toFixed(0);
  const cleanSheetColor =
    Number(cleanSheetPct) >= 40
      ? "text-green-600"
      : Number(cleanSheetPct) >= 20
      ? "text-amber-600"
      : "text-red-600";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Defensive Alerts</h3>
        <span className={`text-xs font-medium ${cleanSheetColor}`}>
          Clean sheets: {cleanSheetPct}%
        </span>
      </div>

      {visible.map((alert) => (
        <div
          key={alert.id}
          className={`relative rounded-xl border p-4 pr-10 ${SEVERITY_STYLES[alert.severity]}`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={`mt-0.5 h-4 w-4 flex-shrink-0 ${SEVERITY_ICON_STYLES[alert.severity]}`}
            />
            <div>
              <p className="text-sm font-semibold">{alert.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {alert.detail}
              </p>
            </div>
          </div>
          <button
            onClick={() => dismiss(alert.id)}
            className="absolute right-3 top-3 rounded p-0.5 text-muted-foreground hover:bg-muted/60 transition-colors"
            aria-label="Dismiss alert"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

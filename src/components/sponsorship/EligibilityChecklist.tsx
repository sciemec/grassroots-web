"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

// ── Types ────────────────────────────────────────────────────────────────────

interface Gate {
  gate: string;
  passed: boolean;
  detail: string;
}

interface EligibilityResult {
  eligible: boolean;
  level: 1 | 2 | null;
  strong_case: boolean;
  l2_required: boolean;
  gates: Gate[];
}

interface AdvisoryItem {
  item: string;
  met: boolean;
  tip: string;
}

interface Props {
  caseId: string;
  token: string;
  /** If true, show the admin override reason textarea. */
  adminMode?: boolean;
  /** Override reason controlled externally (admin page needs it for the publish call). */
  overrideReason?: string;
  onOverrideReasonChange?: (v: string) => void;
  /** Called when eligibility data loads so the parent can decide whether to gate submit. */
  onResult?: (result: EligibilityResult) => void;
}

// ── Gate metadata (labels + fix links) ───────────────────────────────────────

const GATE_META: Record<string, { label: string; fixHref?: string; fixLabel?: string }> = {
  // Level 1 — required to go live
  owner_verified:    { label: "Owner verified (WhatsApp or identity)" },
  cover_photo:       { label: "Cover photo set" },
  story_needs:       { label: "Story written + at least 1 need item" },
  trust_level:       { label: "Vouched by a coach or GRS-verified" },
  minor_consent:     { label: "Guardian consent on file" },
  payee_verified:    { label: "Payee details verified by GRS" },
  // Level 2 — Strong case badge
  passport_physical: { label: "Physical passport axes",  fixHref: "/player/passport", fixLabel: "AI Physical Test" },
  passport_technical:{ label: "Technical passport axes", fixHref: "/player/passport", fixLabel: "AI Drill Test" },
  arena_videos:      { label: "Arena / Vault videos",    fixHref: "/arena",           fixLabel: "Upload to Arena" },
  match_eye_report:  { label: "Match Eye analysis done", fixHref: "/player/analyse",  fixLabel: "Run Match Eye" },
  thuto_report:      { label: "THUTO/Amara scouting report" },
  // Team gates
  squad_min:         { label: "Active squad members" },
  team_videos:       { label: "Team tagged arena videos", fixHref: "/arena", fixLabel: "Tag videos" },
  team_photo:        { label: "Team / cover photo" },
  no_player:         { label: "Beneficiary player linked" },
};

const L1_GATES = new Set([
  "owner_verified", "cover_photo", "story_needs", "trust_level",
  "minor_consent", "payee_verified",
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseVideoDetail(detail: string) {
  // "Strong case: ≥ 5 videos on ≥ 5 different days over ≥ 14 days (found 3 videos, 2 days, 6-day span)"
  const m = detail.match(/found (\d+) videos?, (\d+) days?, (\d+)-day span/);
  if (!m) return null;
  return { videos: +m[1], days: +m[2], span: +m[3] };
}

function parseTeamVideoDetail(detail: string) {
  // "Need ≥ 3 tagged videos spanning ≥ 14 days (found 1 videos, 3-day span)"
  const m = detail.match(/found (\d+) videos?, (\d+)-day span/);
  if (!m) return null;
  return { videos: +m[1], span: +m[2] };
}

function parsePhysicalDetail(detail: string) {
  // "Passport needs ≥ 3 physical axes (found 2 of 7)"
  const req  = detail.match(/≥ (\d+)/);
  const found = detail.match(/found (\d+)/);
  if (!req || !found) return null;
  return { found: +found[1], req: +req[1] };
}

function CountBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-1.5 text-xs font-mono text-gray-500">{children}</span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function EligibilityChecklist({
  caseId,
  token,
  adminMode = false,
  overrideReason = "",
  onOverrideReasonChange,
  onResult,
}: Props) {
  const [result, setResult]     = useState<EligibilityResult | null>(null);
  const [loading, setLoading]   = useState(true);
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const [advisory, setAdvisory] = useState<AdvisoryItem[]>([]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setFetchErr(null);
    fetch(`${BASE}/sponsorships/${caseId}/eligibility`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((json) => {
        const data: EligibilityResult = json.data ?? json;
        setResult(data);
        onResult?.(data);
      })
      .catch(() => setFetchErr("Could not load eligibility status."))
      .finally(() => setLoading(false));

    // Load advisory tips (non-blocking — ignore errors)
    fetch(`${BASE}/sponsorships/${caseId}/advisory`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.data) setAdvisory(j.data); })
      .catch(() => {});
  }, [caseId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
        <Loader2 size={14} className="animate-spin" />
        Checking eligibility…
      </div>
    );
  }

  if (fetchErr || !result) {
    return (
      <div className="text-xs text-red-600 py-2">{fetchErr ?? "No eligibility data."}</div>
    );
  }

  const l1Gates = result.gates.filter((g) => L1_GATES.has(g.gate));
  const l2Gates = result.gates.filter((g) => !L1_GATES.has(g.gate));

  function renderGate(g: Gate) {
    const meta = GATE_META[g.gate] ?? { label: g.gate.replace(/_/g, " ") };
    let extra: React.ReactNode = null;

    if (!g.passed) {
      if (g.gate === "arena_videos") {
        const v = parseVideoDetail(g.detail);
        if (v) extra = <CountBadge>Videos: {v.videos}/5 · Days: {v.days}/5 · Span: {v.span}/14</CountBadge>;
      } else if (g.gate === "passport_physical") {
        const v = parsePhysicalDetail(g.detail);
        if (v) extra = <CountBadge>{v.found}/{v.req} axes</CountBadge>;
      } else if (g.gate === "passport_technical") {
        const v = parsePhysicalDetail(g.detail);
        if (v) extra = <CountBadge>{v.found}/{v.req} axes</CountBadge>;
      } else if (g.gate === "squad_min") {
        const m = g.detail.match(/found (\d+)\)/);
        if (m) extra = <CountBadge>{m[1]}/8 members</CountBadge>;
      } else if (g.gate === "team_videos") {
        const v = parseTeamVideoDetail(g.detail);
        if (v) extra = <CountBadge>Videos: {v.videos}/3 · Span: {v.span}/14</CountBadge>;
      }
    }

    return (
      <li key={g.gate} className="flex items-start gap-2.5 py-1.5">
        <span className="mt-0.5 flex-shrink-0">
          {g.passed
            ? <CheckCircle2 size={15} className="text-green-600" />
            : <XCircle      size={15} className="text-red-500" />
          }
        </span>
        <div className="min-w-0 flex-1">
          <span className={`text-sm ${g.passed ? "text-gray-700" : "text-gray-900 font-medium"}`}>
            {meta.label}
          </span>
          {extra}
          {!g.passed && meta.fixHref && (
            <Link
              href={meta.fixHref}
              className="ml-2 text-xs text-[#1a5c2a] hover:underline font-medium"
            >
              {meta.fixLabel ?? "Fix →"}
            </Link>
          )}
        </div>
      </li>
    );
  }

  const l1Passed = l1Gates.every((g) => g.passed);
  const l2Passed = l2Gates.every((g) => g.passed);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-semibold text-gray-900 text-sm">Eligibility Checklist</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {result.eligible ? (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">
              Level {result.level} — Eligible
            </span>
          ) : (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
              Not yet eligible
            </span>
          )}
          {result.l2_required && !result.strong_case && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
              Level 2 required (target &gt; $300)
            </span>
          )}
        </div>
      </div>

      {/* Level 1 gates — required to go live */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Required to go live</p>
        <ul className="divide-y divide-gray-50">
          {l1Gates.map(renderGate)}
        </ul>
      </div>

      {/* Level 2 gates — strong case badge */}
      {l2Gates.length > 0 && (
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
            result.l2_required ? "text-amber-700" : "text-[#1a5c2a]"
          }`}>
            {result.l2_required
              ? "Strong case badge — required (target > $300)"
              : "Boost your case: get the Strong case badge"}
          </p>
          <ul className="divide-y divide-gray-50">
            {l2Gates.map(renderGate)}
          </ul>
          {l2Passed && (
            <p className="text-xs text-green-700 font-medium mt-1.5">Strong case badge earned — sponsors will see this.</p>
          )}
          {!l2Passed && !result.l2_required && (
            <p className="text-xs text-gray-400 mt-1.5">These are optional for cases under $300, but help attract more sponsors.</p>
          )}
        </div>
      )}

      {/* Advisory tips — shown as hints, never as blockers */}
      {advisory.length > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tips to strengthen your case</p>
          <ul className="space-y-1.5">
            {advisory.map((a) => (
              <li key={a.item} className="flex items-start gap-2">
                <span className={`mt-0.5 text-xs font-bold ${a.met ? "text-green-500" : "text-amber-500"}`}>
                  {a.met ? "✓" : "→"}
                </span>
                <p className="text-xs text-gray-600">{a.tip}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Admin override */}
      {adminMode && !result.eligible && (
        <div className="border-t border-dashed border-gray-200 pt-4">
          <p className="text-xs font-semibold text-gray-500 mb-1">
            Admin Override — reason required (≥ 10 chars)
          </p>
          <textarea
            value={overrideReason}
            onChange={(e) => onOverrideReasonChange?.(e.target.value)}
            rows={2}
            placeholder="Describe why this case should be published despite failing a gate…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
          />
          {overrideReason.trim().length > 0 && overrideReason.trim().length < 10 && (
            <p className="text-xs text-red-500 mt-1">Reason must be at least 10 characters.</p>
          )}
        </div>
      )}
    </div>
  );
}

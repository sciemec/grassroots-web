"use client";
// src/app/admin/engagement/page.tsx
// Engagement Sponsor Dashboard — live + historical KPIs

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";
import {
  Users, Eye, Play, CheckCircle2, MessageSquare,
  Search, TrendingUp, ArrowLeft, RefreshCw, MapPin,
  Activity, Smartphone,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface Snapshot {
  report_date: string;
  active_users: number;
  profile_views: number;
  video_starts: number;
  video_completions: number;
  video_completion_pct: number;
  under_18_events: number;
  by_region: { region: string; event_count: number }[];
  by_event_type: { event_type: string; count: number }[];
  position_demand: { position: string; search_count: number }[];
}

interface LiveData {
  date: string;
  active_users: number;
  profile_views: number;
  video_starts: number;
  video_completions: number;
  video_completion_pct: number;
  under_18_events: number;
  searches: number;
  whatsapp_intakes: number;
  whatsapp_biometric: number;
  whatsapp_vault: number;
  by_region: { region: string; event_count: number }[];
  by_event_type: { event_type: string; count: number }[];
  position_demand: { position: string; search_count: number }[];
}

// ── Colours ────────────────────────────────────────────────────────────────

const GRS_GREEN  = "#1a5c2a";
const GRS_GOLD   = "#c8962a";
const BG         = "#f4f2ee";
const CARD_BG    = "#ffffff";
const BORDER     = "#e5e7eb";
const TEXT_MUTED = "#6b7280";

// ── Sub-components ─────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon, label, value, sub, accent = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div style={{
      backgroundColor: CARD_BG,
      border: `1px solid ${BORDER}`,
      borderRadius: 12,
      padding: "16px 18px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon size={15} color={accent ? GRS_GOLD : GRS_GREEN} />
        <span style={{ fontSize: 11, fontWeight: 700, color: TEXT_MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#111827" }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: TEXT_MUTED }}>{sub}</div>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 800, color: "#9ca3af",
      textTransform: "uppercase", letterSpacing: "0.08em",
      margin: "24px 0 10px",
    }}>
      {children}
    </div>
  );
}

function TableRow({ label, value, pct }: { label: string; value: number; pct?: number }) {
  return (
    <tr>
      <td style={{ padding: "7px 0", fontSize: 13, color: "#374151" }}>{label}</td>
      <td style={{ padding: "7px 0", fontSize: 13, fontWeight: 700, textAlign: "right", color: "#111827" }}>
        {value.toLocaleString()}
      </td>
      {pct !== undefined && (
        <td style={{ padding: "7px 0 7px 12px", width: 80 }}>
          <div style={{ height: 4, borderRadius: 2, backgroundColor: "#e5e7eb" }}>
            <div style={{ height: 4, borderRadius: 2, width: `${Math.min(pct, 100)}%`, backgroundColor: GRS_GREEN }} />
          </div>
        </td>
      )}
    </tr>
  );
}

function SkeletonCard() {
  return (
    <div style={{
      backgroundColor: CARD_BG, border: `1px solid ${BORDER}`,
      borderRadius: 12, padding: "16px 18px", height: 90,
      animation: "pulse 1.5s ease-in-out infinite",
    }} />
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function AdminEngagementPage() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<"live" | "history">("live");

  const { data: liveData, isLoading: liveLoading, refetch: refetchLive, dataUpdatedAt } = useQuery<LiveData>({
    queryKey: ["admin-engagement-live"],
    queryFn: async () => { const res = await api.get("/admin/engagement/live"); return res.data; },
    enabled: !!user && tab === "live",
    refetchInterval: 30_000,
  });

  const { data: snapData, isLoading: snapLoading } = useQuery<{ data: Snapshot[] }>({
    queryKey: ["admin-engagement-snapshots"],
    queryFn: async () => { const res = await api.get("/admin/engagement/snapshots"); return res.data; },
    enabled: !!user && tab === "history",
  });

  const snapshots = snapData?.data ?? [];

  // Compute totals for the 14-day window
  const last14 = snapshots.slice(0, 14);
  const totals14 = last14.reduce(
    (acc, s) => ({
      active_users: acc.active_users + s.active_users,
      profile_views: acc.profile_views + s.profile_views,
      video_starts: acc.video_starts + s.video_starts,
      video_completions: acc.video_completions + s.video_completions,
      under_18_events: acc.under_18_events + s.under_18_events,
    }),
    { active_users: 0, profile_views: 0, video_starts: 0, video_completions: 0, under_18_events: 0 }
  );
  const pct14 = totals14.video_starts > 0
    ? Math.round((totals14.video_completions / totals14.video_starts) * 100)
    : 0;

  // Aggregate top regions across 14 days
  const regionMap: Record<string, number> = {};
  last14.forEach((s) =>
    (s.by_region ?? []).forEach((r) => {
      regionMap[r.region] = (regionMap[r.region] ?? 0) + r.event_count;
    })
  );
  const topRegions = Object.entries(regionMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([region, event_count]) => ({ region, event_count }));

  const maxRegion = topRegions[0]?.event_count ?? 1;

  // Aggregate position demand across 14 days
  const posMap: Record<string, number> = {};
  last14.forEach((s) =>
    (s.position_demand ?? []).forEach((p) => {
      posMap[p.position] = (posMap[p.position] ?? 0) + p.search_count;
    })
  );
  const topPositions = Object.entries(posMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([position, search_count]) => ({ position, search_count }));
  const maxPos = topPositions[0]?.search_count ?? 1;

  const updatedTime = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : "—";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG }}>

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 10,
        backgroundColor: "#fff", borderBottom: `1px solid ${BORDER}`,
        padding: "12px 20px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <Link href="/admin" style={{ color: TEXT_MUTED, display: "flex", alignItems: "center" }}>
          <ArrowLeft size={16} />
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Engagement Dashboard</div>
          <div style={{ fontSize: 11, color: TEXT_MUTED }}>Sponsor & partnership reporting</div>
        </div>
        <button
          onClick={() => refetchLive()}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 12px", borderRadius: 8,
            backgroundColor: GRS_GREEN, border: "none",
            fontSize: 11, fontWeight: 600, color: "#fff", cursor: "pointer",
          }}
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </header>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px 16px 56px" }}>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
          {(["live", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "7px 18px", borderRadius: 8, border: "none",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                backgroundColor: tab === t ? GRS_GREEN : "#e5e7eb",
                color: tab === t ? "#fff" : "#374151",
              }}
            >
              {t === "live" ? "Live — Today" : "14-Day History"}
            </button>
          ))}
          {tab === "live" && (
            <span style={{ marginLeft: "auto", fontSize: 11, color: TEXT_MUTED, alignSelf: "center" }}>
              Last updated: {updatedTime} · auto-refresh 30s
            </span>
          )}
        </div>

        {/* ── LIVE TAB ──────────────────────────────────────────────────── */}
        {tab === "live" && (
          <>
            <SectionTitle>Today&apos;s KPIs</SectionTitle>
            {liveLoading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : liveData ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  <KpiCard icon={Users}        label="Active Users"       value={liveData.active_users.toLocaleString()} accent />
                  <KpiCard icon={Eye}          label="Profile Views"      value={liveData.profile_views.toLocaleString()} />
                  <KpiCard icon={Play}         label="Video Starts"       value={liveData.video_starts.toLocaleString()} />
                  <KpiCard icon={CheckCircle2} label="Video Completions"  value={liveData.video_completions.toLocaleString()} sub={`${liveData.video_completion_pct}% completion rate`} />
                  <KpiCard icon={Search}       label="Searches"           value={liveData.searches.toLocaleString()} />
                  <KpiCard icon={Smartphone}   label="Under-18 Events"    value={liveData.under_18_events.toLocaleString()} sub="Safeguarding coverage" />
                </div>

                <SectionTitle>WhatsApp Intake</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  <KpiCard icon={MessageSquare} label="Videos Received"   value={liveData.whatsapp_intakes} accent />
                  <KpiCard icon={Activity}      label="Biometric Scan"    value={liveData.whatsapp_biometric} sub="Chose option 1" />
                  <KpiCard icon={TrendingUp}    label="Video Vault"       value={liveData.whatsapp_vault} sub="Chose option 2" />
                </div>

                {/* Regions */}
                {liveData.by_region.length > 0 && (
                  <>
                    <SectionTitle>Activity by Region</SectionTitle>
                    <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 20px" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <tbody>
                          {liveData.by_region.map((r) => (
                            <TableRow
                              key={r.region}
                              label={r.region ?? "Unknown"}
                              value={r.event_count}
                              pct={(r.event_count / (liveData.by_region[0]?.event_count ?? 1)) * 100}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* Event type breakdown */}
                {liveData.by_event_type.length > 0 && (
                  <>
                    <SectionTitle>Events by Type</SectionTitle>
                    <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 20px" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <tbody>
                          {liveData.by_event_type.map((e) => (
                            <TableRow
                              key={e.event_type}
                              label={e.event_type.replace(/_/g, " ")}
                              value={e.count}
                              pct={(e.count / (liveData.by_event_type[0]?.count ?? 1)) * 100}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* Position demand */}
                {liveData.position_demand.length > 0 && (
                  <>
                    <SectionTitle>Position Demand (Searches)</SectionTitle>
                    <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 20px" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <tbody>
                          {liveData.position_demand.map((p) => (
                            <TableRow
                              key={p.position}
                              label={p.position}
                              value={p.search_count}
                              pct={(p.search_count / (liveData.position_demand[0]?.search_count ?? 1)) * 100}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div style={{ textAlign: "center", padding: 48, color: TEXT_MUTED, fontSize: 14 }}>
                No data yet today. Check back after the first engagement event.
              </div>
            )}
          </>
        )}

        {/* ── HISTORY TAB ───────────────────────────────────────────────── */}
        {tab === "history" && (
          <>
            {snapLoading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <>
                {/* 14-day totals */}
                <SectionTitle>14-Day Totals</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  <KpiCard icon={Users}        label="Active Users"      value={totals14.active_users.toLocaleString()} accent />
                  <KpiCard icon={Eye}          label="Profile Views"     value={totals14.profile_views.toLocaleString()} />
                  <KpiCard icon={Play}         label="Video Starts"      value={totals14.video_starts.toLocaleString()} />
                  <KpiCard icon={CheckCircle2} label="Video Completions" value={totals14.video_completions.toLocaleString()} sub={`${pct14}% avg completion`} />
                  <KpiCard icon={Smartphone}   label="Under-18 Events"  value={totals14.under_18_events.toLocaleString()} sub="Safeguarding coverage" />
                </div>

                {/* Daily trend table */}
                {snapshots.length > 0 && (
                  <>
                    <SectionTitle>Daily Trend (last 30 days)</SectionTitle>
                    <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                        <thead>
                          <tr style={{ backgroundColor: "#f9fafb" }}>
                            {["Date", "Active Users", "Profile Views", "Video Starts", "Completions", "Cmplt %", "U18"].map((h) => (
                              <th key={h} style={{
                                padding: "10px 14px", textAlign: h === "Date" ? "left" : "right",
                                fontSize: 11, fontWeight: 700, color: TEXT_MUTED,
                                textTransform: "uppercase", letterSpacing: "0.05em",
                                borderBottom: `1px solid ${BORDER}`,
                              }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {snapshots.map((s, idx) => (
                            <tr key={s.report_date} style={{ backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                              <td style={{ padding: "9px 14px", fontSize: 12, color: "#374151", fontFamily: "monospace" }}>
                                {s.report_date}
                              </td>
                              <td style={{ padding: "9px 14px", fontSize: 13, fontWeight: 700, textAlign: "right", color: GRS_GREEN }}>
                                {s.active_users.toLocaleString()}
                              </td>
                              <td style={{ padding: "9px 14px", fontSize: 13, textAlign: "right", color: "#374151" }}>
                                {s.profile_views.toLocaleString()}
                              </td>
                              <td style={{ padding: "9px 14px", fontSize: 13, textAlign: "right", color: "#374151" }}>
                                {s.video_starts.toLocaleString()}
                              </td>
                              <td style={{ padding: "9px 14px", fontSize: 13, textAlign: "right", color: "#374151" }}>
                                {s.video_completions.toLocaleString()}
                              </td>
                              <td style={{ padding: "9px 14px", fontSize: 12, textAlign: "right", color: TEXT_MUTED }}>
                                {s.video_completion_pct}%
                              </td>
                              <td style={{ padding: "9px 14px", fontSize: 12, textAlign: "right", color: TEXT_MUTED }}>
                                {s.under_18_events.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* Top regions (14-day aggregate) */}
                {topRegions.length > 0 && (
                  <>
                    <SectionTitle>Top Regions (14 days)</SectionTitle>
                    <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 20px" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <tbody>
                          {topRegions.map((r) => (
                            <TableRow
                              key={r.region}
                              label={r.region ?? "Unknown"}
                              value={r.event_count}
                              pct={(r.event_count / maxRegion) * 100}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* Position demand (14-day aggregate) */}
                {topPositions.length > 0 && (
                  <>
                    <SectionTitle>Position Demand (14 days)</SectionTitle>
                    <div style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 20px" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <tbody>
                          {topPositions.map((p) => (
                            <TableRow
                              key={p.position}
                              label={p.position}
                              value={p.search_count}
                              pct={(p.search_count / maxPos) * 100}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {snapshots.length === 0 && (
                  <div style={{ textAlign: "center", padding: 48, color: TEXT_MUTED, fontSize: 14 }}>
                    No snapshot data yet. The nightly report runs at 03:00 Africa/Harare.
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Footer note */}
        <div style={{
          marginTop: 40, padding: "16px 20px",
          backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
          borderRadius: 10, fontSize: 12, color: "#166534",
        }}>
          <strong>Sponsor Reporting Note:</strong> Live tab refreshes every 30 seconds from
          the engagement_events table. History tab reads nightly snapshots generated at 03:00 Africa/Harare.
          Under-18 events are tracked separately for ZIFA safeguarding compliance.
          WhatsApp intake counts are from the Meta Cloud API webhook.
        </div>

      </div>
    </div>
  );
}

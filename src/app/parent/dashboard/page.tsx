"use client";
// src/app/parent/dashboard/page.tsx
// Parent/Guardian Dashboard — read-only view of linked child's progress

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft, AlertCircle, CheckCircle2,
  Activity, Zap, Shield, Trophy, MessageCircle,
} from "lucide-react";

const GRS_GREEN = "#1a5c2a";
const GRS_GOLD  = "#c8962a";
const API       = process.env.NEXT_PUBLIC_API_URL;

interface DashboardData {
  player: {
    first_name: string;
    surname: string;
    age_group: string;
    position: string;
    is_premium: boolean;
    subscription_status: string;
  };
  athletic_profile: {
    power: number; pace: number; balance: number;
    reaction: number; endurance: number; technique: number;
    overall: number; recommended_position: string; tested_at: string;
  } | null;
  activity: {
    sessions_this_week: number;
    drills_this_week: number;
    total_drills_ever: number;
    thuto_sessions_week: number;
  };
  injury_risk: {
    score: number; level: string;
    asymmetry_score: number; session_date: string;
  } | null;
  milestones: Array<{ title: string; achieved_at: string }>;
  whatsapp_reports: boolean;
  addon_expires_at: string;
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ height: 6, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 3, transition: "width 0.8s" }} />
    </div>
  );
}

function riskColor(level: string): string {
  switch (level) {
    case "Critical": return "#dc2626";
    case "High":     return "#ea580c";
    case "Moderate": return GRS_GOLD;
    case "Low":      return "#3b82f6";
    default:         return "#059669";
  }
}

export default function ParentDashboardPage() {
  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [addonRequired, setAddonRequired] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) { setError("Please log in."); setLoading(false); return; }

    fetch(`${API}/guardian/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (r.status === 403) { setAddonRequired(true); setLoading(false); return null; }
        if (r.status === 404) { setError("No linked child found. Ask your child to share their invite code."); setLoading(false); return null; }
        return r.json();
      })
      .then(d => { if (d) setData(d); setLoading(false); })
      .catch(() => { setError("Could not load dashboard."); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#f4f2ee", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 14, color: "#666" }}>Loading dashboard...</div>
    </div>
  );

  if (addonRequired) return (
    <div style={{ minHeight: "100vh", background: "#f4f2ee" }}>
      <div style={{ background: GRS_GREEN, padding: 16 }}>
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/player" style={{ color: "rgba(255,255,255,0.7)" }}><ChevronLeft size={20} /></Link>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Parent Dashboard</div>
        </div>
      </div>
      <div style={{ maxWidth: 480, margin: "24px auto", padding: 16 }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e5e5e5", textAlign: "center" }}>
          <Shield size={40} color={GRS_GOLD} style={{ margin: "0 auto 16px" }} />
          <div style={{ fontSize: 18, fontWeight: 800, color: "#111", marginBottom: 8 }}>Parent Dashboard Addon Required</div>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 20, lineHeight: 1.7 }}>
            Unlock full visibility into your child's training progress, athletic scores, injury risk flags, and weekly WhatsApp reports.
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: GRS_GREEN, marginBottom: 4 }}>$2 / month</div>
          <div style={{ fontSize: 12, color: "#999", marginBottom: 20 }}>Billed monthly via EcoCash or InnBucks</div>
          <Link
            href="/parent/subscribe"
            style={{
              display: "block", padding: "16px", borderRadius: 12,
              background: GRS_GREEN, color: "#fff", fontWeight: 800,
              fontSize: 15, textDecoration: "none", textAlign: "center",
            }}
          >
            Activate Parent Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: "#f4f2ee", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fef2f2", borderRadius: 16, padding: 24, maxWidth: 360, textAlign: "center", border: "1px solid #fecaca" }}>
        <AlertCircle size={32} color="#dc2626" style={{ margin: "0 auto 12px" }} />
        <div style={{ fontSize: 14, color: "#dc2626" }}>{error}</div>
        <Link href="/parent/link" style={{ display: "inline-block", marginTop: 16, padding: "10px 24px", background: GRS_GREEN, color: "#fff", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 13 }}>
          Link to Child
        </Link>
      </div>
    </div>
  );

  if (!data) return null;

  const { player, athletic_profile, activity, injury_risk, milestones } = data;
  const name = `${player.first_name} ${player.surname}`;
  const position = athletic_profile?.recommended_position
    ? athletic_profile.recommended_position.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
    : player.position;

  return (
    <div style={{ minHeight: "100vh", background: "#f4f2ee" }}>

      {/* Header */}
      <div style={{ background: GRS_GREEN, padding: 16, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/player" style={{ color: "rgba(255,255,255,0.7)" }}><ChevronLeft size={20} /></Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Parent Dashboard</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>
              {name} · {player.age_group.toUpperCase()} · {position}
            </div>
          </div>
          <div style={{
            fontSize: 10, fontWeight: 800, padding: "4px 10px", borderRadius: 20,
            background: player.is_premium ? GRS_GOLD : "rgba(255,255,255,0.2)",
            color: player.is_premium ? GRS_GREEN : "rgba(255,255,255,0.7)",
          }}>
            {player.is_premium ? "Premium" : "Free"}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Activity this week */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e5e5e5" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#111", marginBottom: 14 }}>This Week</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Training Sessions", value: activity.sessions_this_week, emoji: "🏃", color: GRS_GREEN },
              { label: "Drills Completed",  value: activity.drills_this_week,   emoji: "⚽", color: "#2563eb" },
              { label: "Total Drills Ever", value: activity.total_drills_ever,  emoji: "🏆", color: GRS_GOLD },
              { label: "AI Coach Sessions", value: activity.thuto_sessions_week, emoji: "🤖", color: "#7c3aed" },
            ].map(item => (
              <div key={item.label} style={{ background: "#f9fafb", borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{item.emoji}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: item.color }}>{item.value}</div>
                <div style={{ fontSize: 10, color: "#888", fontWeight: 600, marginTop: 2 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Athletic Profile */}
        {athletic_profile ? (
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e5e5e5" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#111" }}>Athletic Profile</div>
              <div style={{
                fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20,
                background: GRS_GREEN + "15", color: GRS_GREEN,
              }}>
                Overall: {athletic_profile.overall}/100
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {([
                { key: "power",     label: "Power",     emoji: "🦘", color: "#7c3aed" },
                { key: "pace",      label: "Pace",      emoji: "💨", color: "#2563eb" },
                { key: "balance",   label: "Balance",   emoji: "⚖️", color: "#059669" },
                { key: "reaction",  label: "Reaction",  emoji: "⚡", color: GRS_GOLD  },
                { key: "endurance", label: "Endurance", emoji: "🔥", color: "#dc2626" },
                { key: "technique", label: "Technique", emoji: "⚽", color: GRS_GREEN },
              ] as const).map(dim => (
                <div key={dim.key}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14 }}>{dim.emoji}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#333", flex: 1 }}>{dim.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: dim.color }}>{athletic_profile[dim.key]}</span>
                  </div>
                  <ScoreBar value={athletic_profile[dim.key]} color={dim.color} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: "10px 14px", background: GRS_GREEN + "10", borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: GRS_GREEN, fontWeight: 700 }}>
                🏆 Best position: {position}
              </div>
              <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>
                Last tested: {new Date(athletic_profile.tested_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: "#f9fafb", borderRadius: 16, padding: 20, border: "1px dashed #e5e5e5", textAlign: "center" }}>
            <Activity size={28} color="#d1d5db" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: "#888" }}>No athletic tests yet</div>
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>
              Ask {player.first_name} to complete the GRS Fitness Test Battery
            </div>
          </div>
        )}

        {/* Injury Risk */}
        {injury_risk && (
          <div style={{
            background: riskColor(injury_risk.level) + "10",
            borderRadius: 16, padding: 20,
            border: `1px solid ${riskColor(injury_risk.level)}30`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Shield size={20} color={riskColor(injury_risk.level)} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#111" }}>Injury Risk</div>
                <div style={{ fontSize: 11, color: riskColor(injury_risk.level), fontWeight: 700 }}>
                  {injury_risk.level} · Score: {injury_risk.score}/100
                </div>
              </div>
            </div>
            <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${injury_risk.score}%`, background: riskColor(injury_risk.level), borderRadius: 4 }} />
            </div>
            {injury_risk.level === "High" || injury_risk.level === "Critical" ? (
              <div style={{ fontSize: 11, color: riskColor(injury_risk.level), marginTop: 8, fontWeight: 600 }}>
                ⚠️ Please review the full report and consider consulting a physio.
              </div>
            ) : (
              <div style={{ fontSize: 11, color: "#666", marginTop: 8 }}>
                Low risk detected. Movement patterns are healthy.
              </div>
            )}
          </div>
        )}

        {/* Milestones */}
        {milestones.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e5e5e5" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#111", marginBottom: 12 }}>Recent Achievements</div>
            {milestones.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <CheckCircle2 size={16} color={GRS_GREEN} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#333" }}>{m.title}</div>
                  <div style={{ fontSize: 10, color: "#999" }}>{new Date(m.achieved_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* WhatsApp reports toggle */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e5e5e5" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <MessageCircle size={20} color={GRS_GREEN} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>Weekly WhatsApp Reports</div>
              <div style={{ fontSize: 11, color: "#666" }}>
                {data.whatsapp_reports
                  ? "Sent every Sunday at 8am"
                  : "Currently disabled"}
              </div>
            </div>
            <div style={{
              fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 20,
              background: data.whatsapp_reports ? "#f0fdf4" : "#f9fafb",
              color: data.whatsapp_reports ? GRS_GREEN : "#9ca3af",
              border: `1px solid ${data.whatsapp_reports ? "#bbf7d0" : "#e5e7eb"}`,
            }}>
              {data.whatsapp_reports ? "ON" : "OFF"}
            </div>
          </div>
        </div>

        {/* Addon expiry */}
        <div style={{ fontSize: 11, color: "#aaa", textAlign: "center" }}>
          Parent Dashboard active until {new Date(data.addon_expires_at).toLocaleDateString()}
        </div>

        <div style={{ height: 32 }} />
      </div>
    </div>
  );
}
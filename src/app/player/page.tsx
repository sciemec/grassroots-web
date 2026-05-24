"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Play, Dumbbell, Brain, Target, User, BookOpen, ChevronRight,
  Bell, Settings, LogOut, Eye, Users, Activity, Calendar,
  TrendingUp, Zap, Flame, Star, Image
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";
import { safeArray } from "@/lib/safe-array";
import { ProUpgradeBanner } from "@/components/player/ProUpgradeBanner";

interface Session {
  id: string;
  focus_area: string;
  overall_score?: number;
  status: string;
  created_at: string;
}

interface Profile {
  position?: string;
  province?: string;
  age_group?: string;
  scout_visible?: boolean;
  joy_score?: number;
  first_name?: string;
  surname?: string;
  avatar_url?: string;
}

interface Prediction {
  projected_score?: number;
  peak_level_label?: string;
  upside_rating?: number;
  percentile?: number;
  data_quality?: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function AttributeBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>{label}</span>
        <span style={{ fontSize: 12, color: "white", fontWeight: 600 }}>{value}</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 4, height: 6 }}>
        <div style={{ background: color, borderRadius: 4, height: 6, width: `${value}%`, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

const TABS = ["Overview", "Sessions", "THUTO", "Drills", "Passport"] as const;
type Tab = typeof TABS[number];

export default function PlayerHub() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [scoutViews, setScoutViews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.push("/login"); return; }
  }, [hasHydrated, user, router]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const [sessRes, profRes, predRes, viewRes] = await Promise.allSettled([
          api.get("/sessions?per_page=5"),
          api.get("/profile"),
          api.get(`/players/${user.id}/prediction`),
          api.get(`/players/${user.id}/view-count`),
        ]);
        if (sessRes.status === "fulfilled") {
          const raw = sessRes.value.data?.data ?? sessRes.value.data;
          setSessions(safeArray<Session>(raw));
        }
        if (profRes.status === "fulfilled") {
          const raw = profRes.value.data?.data ?? profRes.value.data;
          setProfile(Array.isArray(raw) ? (raw[0] as Profile) : (raw as Profile));
        }
        if (predRes.status === "fulfilled") {
          const raw = predRes.value?.data?.data ?? predRes.value?.data;
          if (raw && typeof raw === "object") setPrediction(raw as Prediction);
        }
        if (viewRes.status === "fulfilled") {
          const raw = viewRes.value?.data;
          setScoutViews(typeof (raw as { count?: number })?.count === "number" ? (raw as { count: number }).count : 0);
        }
      } catch {
        // silently fail — show empty state
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (!hasHydrated || !user) return null;

  const completedSessions = sessions.filter((s) => s.status === "completed").length;
  const thutoScore = prediction?.projected_score ?? 0;
  const displayName = profile?.first_name
    ? `${profile.first_name}${profile.surname ? " " + profile.surname : ""}`
    : user.name ?? "Player";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  // Derived attribute scores scaled from thuto score
  const base = thutoScore || 55;
  const technical = Math.min(100, Math.round(base * 1.0));
  const physical  = Math.min(100, Math.round(base * 0.92));
  const tactical  = Math.min(100, Math.round(base * 0.88));
  const mental    = Math.min(100, Math.round(base * 0.95));

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Suppress unused warning for token (used implicitly by api interceptor)
  void token;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", fontFamily: "Inter, sans-serif" }}>
      {/* Top Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        backgroundColor: "white", borderBottom: "1px solid #e5e7eb",
        padding: "0 16px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #1a5c2a, #2d7a3a)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <span style={{ color: "#f5c518", fontWeight: 800, fontSize: 14 }}>G</span>
          </div>
          <span style={{ fontWeight: 700, color: "#1a5c2a", fontSize: 15 }}>Player Hub</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/player/notifications" style={{ color: "#6b7280", display: "flex" }}>
            <Bell size={20} />
          </Link>
          <Link href="/settings" style={{ color: "#6b7280", display: "flex" }}>
            <Settings size={20} />
          </Link>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowUserMenu((v) => !v)}
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "linear-gradient(135deg, #1a5c2a, #2d7a3a)",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: 700, fontSize: 12
              }}
            >
              {initials}
            </button>
            {showUserMenu && (
              <div style={{
                position: "absolute", right: 0, top: 40, zIndex: 100,
                background: "white", borderRadius: 12,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                border: "1px solid #e5e7eb", width: 180, overflow: "hidden"
              }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6" }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{displayName}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{user.email}</div>
                </div>
                <Link href="/player/profile" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", color: "#374151", fontSize: 13, textDecoration: "none" }}>
                  <User size={15} /> My Profile
                </Link>
                <Link href="/settings" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", color: "#374151", fontSize: 13, textDecoration: "none" }}>
                  <Settings size={15} /> Settings
                </Link>
                <button
                  onClick={handleLogout}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", color: "#dc2626", fontSize: 13, background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {showUserMenu && (
        <div onClick={() => setShowUserMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
      )}

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 16px 48px" }}>
        <ProUpgradeBanner />

        {/* Green Profile Header */}
        <div style={{
          background: "linear-gradient(135deg, #1a5c2a 0%, #2d7a3a 60%, #1a5c2a 100%)",
          borderRadius: "0 0 24px 24px",
          padding: "20px 20px 24px",
          marginBottom: 20,
          color: "white"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "rgba(245,197,24,0.25)",
              border: "2px solid rgba(245,197,24,0.6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 18, color: "#f5c518"
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17 }}>{displayName}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
                {profile?.position ?? "Player"}{profile?.province ? ` · ${profile.province}` : ""}
              </div>
            </div>
          </div>

          {/* 3 Stat Boxes */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {([
              { label: "Completed", value: loading ? "—" : completedSessions, icon: <Activity size={15} /> },
              { label: "THUTO Score", value: loading ? "—" : (thutoScore ? Math.round(thutoScore) : "—"), icon: <Zap size={15} /> },
              { label: "Scout Views", value: loading ? "—" : scoutViews, icon: <Eye size={15} /> },
            ] as const).map(({ label, value, icon }) => (
              <div key={label} style={{
                background: "rgba(255,255,255,0.12)",
                borderRadius: 12, padding: "10px 12px", textAlign: "center"
              }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 4, color: "#f5c518" }}>{icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 4, marginBottom: 20,
          background: "white", borderRadius: 12, padding: 4,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
        }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: "8px 4px", borderRadius: 8,
                border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: activeTab === tab ? "#1a5c2a" : "transparent",
                color: activeTab === tab ? "white" : "#6b7280",
                transition: "all 0.15s"
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "Overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* THUTO Score Card */}
            <div style={{
              background: "linear-gradient(135deg, #1a5c2a, #2d7a3a)",
              borderRadius: 16, padding: 20, color: "white"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>THUTO Score</div>
                  <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>
                    {thutoScore ? Math.round(thutoScore) : "—"}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                    {prediction?.peak_level_label ?? "Complete sessions to unlock"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {prediction?.percentile != null && (
                    <div style={{
                      background: "rgba(245,197,24,0.2)", border: "1px solid rgba(245,197,24,0.4)",
                      borderRadius: 20, padding: "4px 10px", fontSize: 11, color: "#f5c518", fontWeight: 600
                    }}>
                      Top {100 - prediction.percentile}%
                    </div>
                  )}
                  {(prediction?.upside_rating ?? 0) > 0 && (
                    <div style={{ marginTop: 6, display: "flex", gap: 2, justifyContent: "flex-end" }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12} fill={i < (prediction?.upside_rating ?? 0) ? "#f5c518" : "transparent"} color="#f5c518" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <AttributeBar label="Technical" value={technical} color="#f5c518" />
              <AttributeBar label="Physical"  value={physical}  color="#4ade80" />
              <AttributeBar label="Tactical"  value={tactical}  color="#60a5fa" />
              <AttributeBar label="Mental"    value={mental}    color="#f472b6" />
              <Link href="/player/talent-id" style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                marginTop: 12, padding: "10px",
                background: "rgba(255,255,255,0.12)", borderRadius: 10,
                color: "white", textDecoration: "none", fontSize: 13, fontWeight: 600
              }}>
                <TrendingUp size={14} /> View Full Scout Profile
              </Link>
            </div>

            {/* Quick Action Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {([
                { label: "Start Session", sub: "Begin training now", icon: <Play size={20} />, href: "/player/sessions/new", color: "#1a5c2a" },
                { label: "Drills Library", sub: "500+ drills", icon: <Dumbbell size={20} />, href: "/player/drills", color: "#c8962a" },
                { label: "AI Coach", sub: "Ask THUTO anything", icon: <Brain size={20} />, href: "/player/ai-coach", color: "#7c3aed" },
                { label: "My Progress", sub: "Track milestones", icon: <Target size={20} />, href: "/player/progress", color: "#0891b2" },
              ] as const).map(({ label, sub, icon, href, color }) => (
                <Link key={label} href={href} style={{
                  background: "white", borderRadius: 14, padding: "16px",
                  borderLeft: `4px solid ${color}`,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  textDecoration: "none", display: "block"
                }}>
                  <div style={{ color, marginBottom: 8 }}>{icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}>{label}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{sub}</div>
                </Link>
              ))}
            </div>

            {/* Recent Sessions */}
            <div style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ padding: "14px 16px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f3f4f6" }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>Recent Sessions</span>
                <Link href="/player/sessions" style={{ fontSize: 12, color: "#1a5c2a", fontWeight: 600, textDecoration: "none" }}>See all</Link>
              </div>
              {loading ? (
                <div style={{ padding: 16 }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
                      <div style={{ width: 4, minHeight: 40, borderRadius: 4, background: "#f3f4f6" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 12, background: "#f3f4f6", borderRadius: 4, marginBottom: 6, width: "60%" }} />
                        <div style={{ height: 10, background: "#f3f4f6", borderRadius: 4, width: "40%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center" }}>
                  <Activity size={28} color="#d1d5db" style={{ margin: "0 auto 8px", display: "block" }} />
                  <div style={{ fontSize: 13, color: "#6b7280" }}>No sessions yet</div>
                  <Link href="/player/sessions/new" style={{
                    display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10,
                    background: "#1a5c2a", color: "white", borderRadius: 8, padding: "8px 16px",
                    fontSize: 12, fontWeight: 600, textDecoration: "none"
                  }}>
                    <Play size={12} /> Start First Session
                  </Link>
                </div>
              ) : (
                <div style={{ padding: "8px 16px" }}>
                  {sessions.map((s) => (
                    <div key={s.id} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid #f9fafb", alignItems: "center" }}>
                      <div style={{ width: 4, borderRadius: 4, background: s.status === "completed" ? "#1a5c2a" : "#d1d5db", minHeight: 40, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#111827", textTransform: "capitalize" }}>{s.focus_area}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                          {s.status === "completed" ? "Completed" : "In Progress"} · {timeAgo(s.created_at)}
                        </div>
                      </div>
                      {s.overall_score != null && (
                        <div style={{
                          background: s.overall_score >= 70 ? "#dcfce7" : "#fef9c3",
                          color: s.overall_score >= 70 ? "#166534" : "#854d0e",
                          borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700
                        }}>
                          {s.overall_score}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* More Links */}
            <div style={{ background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              {([
                { label: "Training Plan", sub: "THUTO programme", icon: <Calendar size={16} />, href: "/player/pitch" },
                { label: "Nutrition", sub: "Fuel your performance", icon: <Flame size={16} />, href: "/player/nutrition" },
                { label: "My Videos", sub: "Highlight vault", icon: <Activity size={16} />, href: "/player/vault" },
                { label: "Media Gallery", sub: "Manage showcase clips", icon: <Image size={16} />, href: "/player/media" },
                { label: "Ubuntu Mode", sub: "Team challenges", icon: <Users size={16} />, href: "/player/ubuntu" },
                { label: "Success Engine", sub: "Daily goals & streaks", icon: <Star size={16} />, href: "/player/success" },
              ] as const).map(({ label, sub, icon, href }, idx, arr) => (
                <Link key={label} href={href} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                  textDecoration: "none", borderBottom: idx < arr.length - 1 ? "1px solid #f3f4f6" : "none"
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#1a5c2a", flexShrink: 0
                  }}>{icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{label}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{sub}</div>
                  </div>
                  <ChevronRight size={16} color="#d1d5db" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── SESSIONS TAB ── */}
        {activeTab === "Sessions" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Link href="/player/sessions/new" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: "#1a5c2a", color: "white", borderRadius: 14, padding: "14px",
              textDecoration: "none", fontWeight: 700, fontSize: 14
            }}>
              <Play size={16} /> Start New Session
            </Link>
            <Link href="/player/sessions" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: "white", color: "#1a5c2a", borderRadius: 14, padding: "14px",
              textDecoration: "none", fontWeight: 700, fontSize: 14,
              border: "2px solid #1a5c2a", boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
            }}>
              <Activity size={16} /> View All Sessions
            </Link>
            <div style={{ background: "white", borderRadius: 16, padding: "0 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ padding: "14px 0 12px", fontWeight: 700, fontSize: 14, color: "#111827", borderBottom: "1px solid #f3f4f6" }}>Recent</div>
              {sessions.length === 0 ? (
                <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "20px 0" }}>No sessions yet</div>
              ) : sessions.map((s) => (
                <Link key={s.id} href={`/sessions/${s.id}`} style={{
                  display: "flex", gap: 12, padding: "12px 0",
                  borderBottom: "1px solid #f9fafb", textDecoration: "none", alignItems: "center"
                }}>
                  <div style={{ width: 4, borderRadius: 4, background: "#1a5c2a", minHeight: 40 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#111827", textTransform: "capitalize" }}>{s.focus_area}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{timeAgo(s.created_at)}</div>
                  </div>
                  {s.overall_score != null && (
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1a5c2a" }}>{s.overall_score}%</div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── THUTO TAB ── */}
        {activeTab === "THUTO" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{
              background: "linear-gradient(135deg, #1a5c2a, #2d7a3a)",
              borderRadius: 16, padding: 24, color: "white", textAlign: "center"
            }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>Your THUTO Score</div>
              <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1 }}>{thutoScore ? Math.round(thutoScore) : "—"}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 8 }}>
                {prediction?.peak_level_label ?? "Complete 3+ sessions to unlock"}
              </div>
              {prediction?.percentile != null && (
                <div style={{
                  display: "inline-block", marginTop: 12,
                  background: "rgba(245,197,24,0.2)", border: "1px solid rgba(245,197,24,0.4)",
                  borderRadius: 20, padding: "6px 16px", fontSize: 13, color: "#f5c518", fontWeight: 700
                }}>
                  Top {100 - prediction.percentile}% in Zimbabwe
                </div>
              )}
            </div>
            <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 16 }}>Attribute Breakdown</div>
              {([
                { label: "Technical", value: technical, color: "#f5c518" },
                { label: "Physical",  value: physical,  color: "#22c55e" },
                { label: "Tactical",  value: tactical,  color: "#3b82f6" },
                { label: "Mental",    value: mental,    color: "#ec4899" },
              ] as const).map(({ label, value, color }) => (
                <div key={label} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{value}</span>
                  </div>
                  <div style={{ background: "#f3f4f6", borderRadius: 6, height: 8 }}>
                    <div style={{ background: color, borderRadius: 6, height: 8, width: `${value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <Link href="/player/ai-coach" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: "#7c3aed", color: "white", borderRadius: 14, padding: "14px",
              textDecoration: "none", fontWeight: 700, fontSize: 14
            }}>
              <Brain size={16} /> Chat with THUTO
            </Link>
            <Link href="/talent-leaderboard" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: "white", color: "#1a5c2a", borderRadius: 14, padding: "14px",
              textDecoration: "none", fontWeight: 700, fontSize: 14,
              border: "2px solid #1a5c2a", boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
            }}>
              <TrendingUp size={16} /> Zimbabwe Talent Leaderboard
            </Link>
          </div>
        )}

        {/* ── DRILLS TAB ── */}
        {activeTab === "Drills" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {([
              { label: "All Drills", sub: "Browse 500+ drills", href: "/player/drills", icon: <Dumbbell size={20} />, color: "#1a5c2a" },
              { label: "Rondo", sub: "Possession & pressing", href: "/player/training-formats/rondo", icon: <Activity size={20} />, color: "#c8962a" },
              { label: "Small-Sided Games", sub: "Game-realistic drills", href: "/player/training-formats/ssg", icon: <Users size={20} />, color: "#7c3aed" },
              { label: "Shooting Drills", sub: "Finishing practice", href: "/player/training-formats/shooting", icon: <Target size={20} />, color: "#dc2626" },
            ] as const).map(({ label, sub, href, icon, color }) => (
              <Link key={label} href={href} style={{
                display: "flex", alignItems: "center", gap: 14,
                background: "white", borderRadius: 14, padding: "16px",
                textDecoration: "none", borderLeft: `4px solid ${color}`,
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
              }}>
                <div style={{ color, flexShrink: 0 }}>{icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{label}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{sub}</div>
                </div>
                <ChevronRight size={16} color="#d1d5db" />
              </Link>
            ))}
          </div>
        )}

        {/* ── PASSPORT TAB ── */}
        {activeTab === "Passport" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{
              background: "linear-gradient(135deg, #7c3aed, #9333ea)",
              borderRadius: 16, padding: 20, color: "white", textAlign: "center"
            }}>
              <BookOpen size={32} style={{ margin: "0 auto 12px", display: "block" }} />
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Player Passport</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
                Your public profile for scouts and scholarship agencies
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {([
                { label: "Edit My Passport", href: "/player/passport", icon: <User size={16} /> },
                { label: "Scout Profile", href: "/player/talent-id", icon: <Eye size={16} /> },
                { label: "Market Value", href: "/player/valuation", icon: <TrendingUp size={16} /> },
                { label: "My Potential", href: "/player/potential", icon: <Star size={16} /> },
                { label: "View Public CV", href: `/passport/${user.id}`, icon: <ChevronRight size={16} /> },
              ] as const).map(({ label, href, icon }) => (
                <Link key={label} href={href} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  background: "white", borderRadius: 14, padding: "14px 16px",
                  textDecoration: "none", boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
                }}>
                  <div style={{ color: "#7c3aed" }}>{icon}</div>
                  <div style={{ flex: 1, fontWeight: 600, fontSize: 13, color: "#111827" }}>{label}</div>
                  <ChevronRight size={16} color="#d1d5db" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

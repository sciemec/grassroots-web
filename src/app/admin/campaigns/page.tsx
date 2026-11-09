"use client";
// src/app/admin/campaigns/page.tsx
// Admin campaign review queue — tabs: Needs Review / Live / Flagged / All

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, Clock, TrendingUp, Flag, Search,
  ChevronRight, Users, DollarSign, AlertTriangle,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

const GRS_GREEN = "#1a5c2a";
const GOLD      = "#c8962a";
const BG        = "#f4f2ee";

interface CampaignRow {
  id: string;
  title: string;
  beneficiary_name: string;
  category: string;
  status: string;
  target_cents: number;
  raised_cents: number;
  donor_count: number;
  owner_name: string;
  created_at: string;
  vouched_by: string | null;
  flag_count: number;
}

type Tab = "pending_review" | "live" | "flagged" | "all";

const TAB_CONFIG: { id: Tab; label: string; Icon: React.ElementType; color: string }[] = [
  { id: "pending_review", label: "Needs Review", Icon: Clock,      color: "#b45309" },
  { id: "live",           label: "Live",         Icon: TrendingUp,  color: GRS_GREEN },
  { id: "flagged",        label: "Flagged",      Icon: Flag,        color: "#dc2626" },
  { id: "all",            label: "All",          Icon: ShieldCheck, color: "#374151" },
];

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  draft:          { label: "Draft",          color: "#6b7280", bg: "#f3f4f6" },
  pending_review: { label: "Pending Review", color: "#b45309", bg: "#fef3c7" },
  live:           { label: "Live",           color: GRS_GREEN, bg: "#f0fdf4" },
  paused:         { label: "Paused",         color: "#6b7280", bg: "#f3f4f6" },
  closed:         { label: "Closed",         color: "#374151", bg: "#f3f4f6" },
  rejected:       { label: "Rejected",       color: "#dc2626", bg: "#fef2f2" },
};

function fmt(cents: number): string {
  return "USD " + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export default function AdminCampaignsPage() {
  const router      = useRouter();
  const user        = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [tab, setTab]           = useState<Tab>("pending_review");
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [counts, setCounts]     = useState<Record<Tab, number>>({ pending_review: 0, live: 0, flagged: 0, all: 0 });

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "admin") { router.replace("/"); return; }
  }, [hasHydrated, user, router]);

  useEffect(() => {
    if (!hasHydrated || !user || user.role !== "admin") return;
    setLoading(true);
    const params = new URLSearchParams({ status: tab });
    if (search.trim()) params.set("search", search.trim());
    api.get(`/admin/campaigns?${params}`)
      .then((res) => {
        const d = res.data;
        setCampaigns(Array.isArray(d.data) ? d.data : []);
        if (d.counts) setCounts(d.counts);
      })
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  }, [hasHydrated, user, tab, search]);

  if (!hasHydrated || !user) return null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG }}>
      {/* Header */}
      <header style={{ backgroundColor: GRS_GREEN, color: "#fff", padding: "20px 16px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <ShieldCheck size={20} color={GOLD} />
            <span style={{ fontSize: 18, fontWeight: 800 }}>Campaign Review</span>
          </div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>Review and manage athlete crowdfunding campaigns</div>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e5e5" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 16px", display: "flex", gap: 0, overflowX: "auto" }}>
          {TAB_CONFIG.map(({ id: tabId, label, Icon, color }) => {
            const active = tab === tabId;
            const count  = counts[tabId];
            return (
              <button
                key={tabId}
                onClick={() => setTab(tabId)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "12px 16px",
                  borderBottom: active ? `2px solid ${GRS_GREEN}` : "2px solid transparent",
                  color: active ? GRS_GREEN : "#6b7280",
                  fontWeight: active ? 700 : 500,
                  fontSize: 13,
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  borderBottom: active ? `2px solid ${GRS_GREEN}` : "2px solid transparent",
                  whiteSpace: "nowrap",
                }}
              >
                <Icon size={14} color={active ? GRS_GREEN : color} />
                {label}
                {count > 0 && (
                  <span style={{
                    backgroundColor: tabId === "pending_review" ? "#fef3c7" : tabId === "flagged" ? "#fef2f2" : "#f3f4f6",
                    color: tabId === "pending_review" ? "#b45309" : tabId === "flagged" ? "#dc2626" : "#374151",
                    borderRadius: 999, padding: "1px 7px", fontSize: 11, fontWeight: 700,
                  }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px 16px 60px" }}>
        {/* Search */}
        <div style={{ position: "relative", marginBottom: 20 }}>
          <Search size={15} color="#9ca3af" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: 10, border: "1px solid #e5e5e5", fontSize: 13, backgroundColor: "#fff", boxSizing: "border-box", outline: "none" }}
          />
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", height: 80, animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
            <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }`}</style>
          </div>
        ) : campaigns.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b7280" }}>
            <AlertTriangle size={36} color="#d1d5db" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: "#374151" }}>
              {tab === "pending_review" ? "No campaigns awaiting review" : "No campaigns found"}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {campaigns.map((c) => {
              const badge = STATUS_BADGE[c.status] ?? STATUS_BADGE.draft;
              const pct   = Math.min(100, c.target_cents > 0 ? Math.round((c.raised_cents / c.target_cents) * 100) : 0);
              return (
                <div
                  key={c.id}
                  onClick={() => router.push(`/admin/campaigns/${c.id}`)}
                  style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", padding: "14px 16px", cursor: "pointer", transition: "box-shadow 0.15s" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "none")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
                        <span style={{ backgroundColor: badge.bg, color: badge.color, borderRadius: 999, padding: "2px 8px", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{badge.label}</span>
                        {c.vouched_by && <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: GRS_GREEN, fontWeight: 600 }}><ShieldCheck size={10} /> Vouched</span>}
                        {c.flag_count > 0 && <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "#dc2626", fontWeight: 600 }}><Flag size={10} /> {c.flag_count} flags</span>}
                      </div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        {c.beneficiary_name} · {c.category.replace("_", " ")} · by {c.owner_name}
                      </div>
                      <div style={{ display: "flex", gap: 16, marginTop: 8, alignItems: "center" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#6b7280" }}>
                          <DollarSign size={11} /> {fmt(c.raised_cents)}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#6b7280" }}>
                          <Users size={11} /> {c.donor_count} donors
                        </span>
                        <span style={{ fontSize: 11, color: "#9ca3af" }}>Submitted {timeAgo(c.created_at)}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: GRS_GREEN }}>{pct}%</span>
                      <div style={{ width: 60, height: 4, backgroundColor: "#f0f0f0", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, backgroundColor: GRS_GREEN, borderRadius: 999 }} />
                      </div>
                      <ChevronRight size={16} color="#9ca3af" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

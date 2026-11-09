"use client";
// src/app/campaigns/page.tsx
// Public campaign discovery — no auth required.

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Heart, Users, Clock, ShieldCheck, ArrowRight,
  Target, Shirt, Plane, BookOpen, Dumbbell, Stethoscope,
  Building2, Sparkles, TrendingUp,
} from "lucide-react";
import api from "@/lib/api";

const GRS_GREEN = "#1a5c2a";
const GOLD      = "#c8962a";
const BG        = "#f4f2ee";

// ── Types ─────────────────────────────────────────────────────────────────────
interface CampaignSummary {
  id: string;
  title: string;
  beneficiary_name: string;
  beneficiary_type: "individual" | "team" | "school";
  category: string;
  story_short: string;
  target_cents: number;
  raised_cents: number;
  donor_count: number;
  deadline_at: string | null;
  vouched_by: string | null;
  sport: string | null;
  province: string | null;
}

// ── Category config ───────────────────────────────────────────────────────────
const CATEGORIES: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  trial_fee:  { label: "Trial Fee",   Icon: Target,     color: "#7c3aed" },
  kit:        { label: "Kit & Gear",  Icon: Shirt,      color: GRS_GREEN },
  travel:     { label: "Travel",      Icon: Plane,      color: "#0369a1" },
  scholarship:{ label: "Scholarship", Icon: BookOpen,   color: GOLD },
  training:   { label: "Training",    Icon: Dumbbell,   color: "#b45309" },
  medical:    { label: "Medical",     Icon: Stethoscope,color: "#dc2626" },
  facility:   { label: "Facility",    Icon: Building2,  color: "#059669" },
  other:      { label: "Other",       Icon: Sparkles,   color: "#6b7280" },
};

function daysLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

function pct(raised: number, target: number): number {
  return Math.min(100, target > 0 ? Math.round((raised / target) * 100) : 0);
}

function fmt(cents: number): string {
  return "USD " + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ── Campaign card ─────────────────────────────────────────────────────────────
function CampaignCard({ c }: { c: CampaignSummary }) {
  const cat     = CATEGORIES[c.category] ?? CATEGORIES.other;
  const { Icon } = cat;
  const progress = pct(c.raised_cents, c.target_cents);
  const days     = daysLeft(c.deadline_at);

  return (
    <Link href={`/campaigns/${c.id}`} style={{ textDecoration: "none" }}>
      <div style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        border: "1px solid #e5e5e5",
        overflow: "hidden",
        transition: "box-shadow 0.15s",
        cursor: "pointer",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.10)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = "none")}
      >
        {/* Category banner */}
        <div style={{
          backgroundColor: cat.color + "18",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          borderBottom: "1px solid #f0f0f0",
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            backgroundColor: cat.color + "22",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={15} color={cat.color} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: cat.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {cat.label}
          </span>
          {c.vouched_by && (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
              <ShieldCheck size={12} color={GRS_GREEN} />
              <span style={{ fontSize: 10, color: GRS_GREEN, fontWeight: 600 }}>Vouched</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: "14px 14px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 2, lineHeight: 1.3 }}>
              {c.title}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              {c.beneficiary_name}
              {c.province && ` · ${c.province}`}
            </div>
          </div>

          {c.story_short && (
            <p style={{ fontSize: 12, color: "#555", lineHeight: 1.5, margin: 0,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {c.story_short}
            </p>
          )}

          {/* Progress */}
          <div style={{ marginTop: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: GRS_GREEN }}>{fmt(c.raised_cents)}</span>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>of {fmt(c.target_cents)}</span>
            </div>
            <div style={{ height: 6, backgroundColor: "#f0f0f0", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, backgroundColor: GRS_GREEN, borderRadius: 999, transition: "width 0.4s" }} />
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 7 }}>
              <span style={{ fontSize: 11, color: "#6b7280", display: "flex", alignItems: "center", gap: 3 }}>
                <Users size={11} /> {c.donor_count} donor{c.donor_count !== 1 ? "s" : ""}
              </span>
              {days !== null && (
                <span style={{ fontSize: 11, color: days <= 3 ? "#dc2626" : "#6b7280", display: "flex", alignItems: "center", gap: 3 }}>
                  <Clock size={11} /> {days === 0 ? "Last day!" : `${days}d left`}
                </span>
              )}
              <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: GRS_GREEN }}>{progress}%</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "10px 14px",
          borderTop: "1px solid #f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 11, color: "#9ca3af", textTransform: "capitalize" }}>{c.beneficiary_type}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: GRS_GREEN, display: "flex", alignItems: "center", gap: 4 }}>
            Donate <ArrowRight size={11} />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e5e5", overflow: "hidden" }}>
      <div style={{ height: 50, backgroundColor: "#f3f4f6" }} />
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ height: 16, width: "75%", backgroundColor: "#f3f4f6", borderRadius: 4 }} />
        <div style={{ height: 12, width: "50%", backgroundColor: "#f3f4f6", borderRadius: 4 }} />
        <div style={{ height: 36, backgroundColor: "#f3f4f6", borderRadius: 4, marginTop: 4 }} />
        <div style={{ height: 6, backgroundColor: "#f3f4f6", borderRadius: 999 }} />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns]   = useState<CampaignSummary[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [category, setCategory]     = useState("all");
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (category !== "all") params.set("category", category);
    if (search.trim())      params.set("search", search.trim());

    api.get(`/campaigns?${params}`)
      .then((res) => {
        const d = res.data;
        setCampaigns(Array.isArray(d.data) ? d.data : []);
        setTotalPages(d.last_page ?? 1);
      })
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  }, [page, category, search]);

  const categoryKeys = ["all", ...Object.keys(CATEGORIES)];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG }}>
      {/* Header */}
      <header style={{
        backgroundColor: GRS_GREEN,
        color: "#fff",
        padding: "24px 16px 20px",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Heart size={20} color={GOLD} fill={GOLD} />
                <span style={{ fontSize: 20, fontWeight: 800 }}>Athlete Crowdfunding</span>
              </div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                Support Zimbabwe's grassroots athletes — every dollar goes directly to the need
              </div>
            </div>
            <button
              onClick={() => router.push("/campaigns/new")}
              style={{
                backgroundColor: GOLD,
                color: "#1a1a1a",
                border: "none",
                borderRadius: 10,
                padding: "10px 16px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Start Campaign
            </button>
          </div>

          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={15} color="#9ca3af" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search campaigns..."
              style={{
                width: "100%", padding: "10px 12px 10px 36px",
                borderRadius: 10, border: "none", outline: "none",
                fontSize: 13, backgroundColor: "rgba(255,255,255,0.15)",
                color: "#fff", boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      </header>

      {/* Category filter */}
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e5e5", overflowX: "auto" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px", display: "flex", gap: 4, padding: "8px 16px" }}>
          {categoryKeys.map((k) => {
            const cfg = k === "all" ? null : CATEGORIES[k];
            return (
              <button
                key={k}
                onClick={() => { setCategory(k); setPage(1); }}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "1px solid",
                  borderColor: category === k ? GRS_GREEN : "#e5e5e5",
                  backgroundColor: category === k ? GRS_GREEN : "#fff",
                  color: category === k ? "#fff" : "#555",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
              >
                {k === "all" ? "All Campaigns" : cfg!.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px 40px" }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : campaigns.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b7280" }}>
            <TrendingUp size={40} color="#d1d5db" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 6 }}>No campaigns found</div>
            <div style={{ fontSize: 13 }}>
              {search ? "Try a different search term." : "Be the first to start a campaign."}
            </div>
            <button
              onClick={() => router.push("/campaigns/new")}
              style={{
                marginTop: 16,
                backgroundColor: GRS_GREEN, color: "#fff",
                border: "none", borderRadius: 10, padding: "10px 20px",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
            >
              Start a Campaign
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {campaigns.map((c) => <CampaignCard key={c.id} c={c} />)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 32 }}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  style={{
                    padding: "8px 16px", borderRadius: 8, border: "1px solid #e5e5e5",
                    backgroundColor: page === 1 ? "#f9fafb" : "#fff",
                    color: page === 1 ? "#d1d5db" : "#374151",
                    cursor: page === 1 ? "default" : "pointer", fontSize: 13, fontWeight: 600,
                  }}
                >
                  Previous
                </button>
                <span style={{ padding: "8px 16px", fontSize: 13, color: "#6b7280" }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  style={{
                    padding: "8px 16px", borderRadius: 8, border: "1px solid #e5e5e5",
                    backgroundColor: page === totalPages ? "#f9fafb" : "#fff",
                    color: page === totalPages ? "#d1d5db" : "#374151",
                    cursor: page === totalPages ? "default" : "pointer", fontSize: 13, fontWeight: 600,
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

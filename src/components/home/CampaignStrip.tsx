"use client";
// src/components/home/CampaignStrip.tsx
// Landing page preview of live campaigns — shows 3 cards + "See all" link.

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Users, Clock, ShieldCheck, ArrowRight, ChevronRight } from "lucide-react";

const GRS_GREEN = "#1a5c2a";
const GOLD      = "#c8962a";

interface Campaign {
  id: string;
  title: string;
  beneficiary_name: string;
  category: string;
  target_cents: number;
  raised_cents: number;
  donor_count: number;
  deadline_at: string | null;
  vouched_by: string | null;
  province: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  trial_fee:   "#7c3aed",
  kit:         GRS_GREEN,
  travel:      "#0369a1",
  scholarship: GOLD,
  training:    "#b45309",
  medical:     "#dc2626",
  facility:    "#059669",
  other:       "#6b7280",
};

const CATEGORY_LABELS: Record<string, string> = {
  trial_fee:   "Trial Fee",
  kit:         "Kit & Gear",
  travel:      "Travel",
  scholarship: "Scholarship",
  training:    "Training",
  medical:     "Medical",
  facility:    "Facility",
  other:       "Other",
};

function pct(raised: number, target: number) {
  return Math.min(100, target > 0 ? Math.round((raised / target) * 100) : 0);
}

function fmt(cents: number) {
  return "USD " + (cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function daysLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000));
}

export default function CampaignStrip() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loaded, setLoaded]       = useState(false);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";
    fetch(`${base}/campaigns?page=1&per_page=3`)
      .then((r) => r.json())
      .then((d) => {
        const rows = Array.isArray(d.data) ? d.data : [];
        setCampaigns(rows.slice(0, 3));
      })
      .catch(() => {/* silent — section just won't render */})
      .finally(() => setLoaded(true));
  }, []);

  // Don't render until loaded, and don't render if no live campaigns
  if (!loaded || campaigns.length === 0) return null;

  return (
    <section className="py-14 px-6" style={{ background: "#f4f2ee" }}>
      <div className="max-w-5xl mx-auto">

        {/* Header row */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart size={18} fill={GOLD} color={GOLD} />
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: GOLD }}>
                Athlete Crowdfunding
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Support our athletes</h2>
            <p className="text-sm text-gray-500 mt-1">Every dollar goes directly to the need — kit, travel fees, trials.</p>
          </div>
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-colors hover:brightness-110"
            style={{ background: GRS_GREEN, color: "#fff" }}
          >
            See all campaigns <ChevronRight size={13} />
          </Link>
        </div>

        {/* Campaign cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((c) => {
            const color   = CATEGORY_COLORS[c.category] ?? "#6b7280";
            const label   = CATEGORY_LABELS[c.category] ?? "Other";
            const progress = pct(c.raised_cents, c.target_cents);
            const days     = daysLeft(c.deadline_at);

            return (
              <Link key={c.id} href={`/campaigns/${c.id}`} style={{ textDecoration: "none" }}>
                <div
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full"
                >
                  {/* Category banner */}
                  <div
                    className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50"
                    style={{ backgroundColor: color + "12" }}
                  >
                    <span
                      className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: color + "22", color }}
                    >
                      {label}
                    </span>
                    {c.vouched_by && (
                      <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold" style={{ color: GRS_GREEN }}>
                        <ShieldCheck size={11} /> Vouched
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <div>
                      <div className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{c.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {c.beneficiary_name}{c.province ? ` · ${c.province}` : ""}
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mt-auto pt-2">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-sm font-bold" style={{ color: GRS_GREEN }}>{fmt(c.raised_cents)}</span>
                        <span className="text-xs text-gray-400">of {fmt(c.target_cents)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${progress}%`, backgroundColor: GRS_GREEN }}
                        />
                      </div>
                      <div className="flex gap-3 mt-1.5 items-center">
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <Users size={10} /> {c.donor_count} donor{c.donor_count !== 1 ? "s" : ""}
                        </span>
                        {days !== null && (
                          <span
                            className="flex items-center gap-1 text-[11px]"
                            style={{ color: days <= 3 ? "#dc2626" : "#9ca3af" }}
                          >
                            <Clock size={10} /> {days === 0 ? "Last day!" : `${days}d left`}
                          </span>
                        )}
                        <span className="ml-auto text-[11px] font-bold" style={{ color: GRS_GREEN }}>{progress}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2.5 border-t border-gray-50 flex justify-end">
                    <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: GRS_GREEN }}>
                      Donate <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}

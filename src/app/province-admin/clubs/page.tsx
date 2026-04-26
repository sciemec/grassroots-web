"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import {
  Building2, ChevronLeft, CheckCircle2, XCircle,
  Clock, MapPin, User, QrCode, Loader2,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

interface Club {
  id:              number;
  name:            string;
  suburb:          string;
  home_ground:     string | null;
  is_verified:     boolean;
  is_active:       boolean;
  qr_code_token:   string;
  created_at:      string;
  zone_name:       string;
  contact_name:    string;
  contact_email:   string;
}

type StatusFilter = "pending" | "active" | "all";

const TABS: { key: StatusFilter; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "active",  label: "Active"  },
  { key: "all",     label: "All"     },
];

export default function ProvinceAdminClubsPage() {
  const token       = useAuthStore((s) => s.token);
  const searchParams = useSearchParams();
  const initStatus  = (searchParams.get("status") as StatusFilter) ?? "pending";

  const [tab, setTab]         = useState<StatusFilter>(initStatus);
  const [clubs, setClubs]     = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState<number | null>(null); // club id being approved/rejected

  const loadClubs = useCallback((status: StatusFilter) => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_URL}/province-admin/clubs?status=${status}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const raw = data?.data ?? data;
        setClubs(Array.isArray(raw) ? raw : []);
      })
      .catch(() => setClubs([]))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { loadClubs(tab); }, [tab, loadClubs]);

  const handleAction = async (clubId: number, action: "verify" | "reject") => {
    if (!token) return;
    setActing(clubId);
    try {
      const res = await fetch(`${API_URL}/province-admin/clubs/${clubId}/${action}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.ok) loadClubs(tab);
    } finally {
      setActing(null);
    }
  };

  const statusBadge = (club: Club) => {
    if (club.is_verified && club.is_active)
      return <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">Active</span>;
    if (!club.is_verified && !club.is_active)
      return <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs text-orange-400">Pending</span>;
    return <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">Rejected</span>;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/province-admin"
            className="rounded-xl border border-white/10 bg-white/5 p-2 hover:border-white/20 transition-all">
            <ChevronLeft className="h-4 w-4 text-white" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#f0b429]" /> Club Management
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Approve and manage clubs in your province</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all
                ${tab === t.key
                  ? "bg-[#f0b429] text-[#1a3a1a]"
                  : "border border-white/10 bg-white/5 text-white/60 hover:border-white/20"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Club list */}
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading clubs…</span>
          </div>
        ) : clubs.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-card/60 p-12 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No {tab} clubs found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {tab === "pending" ? "All clubs have been reviewed." : "No clubs in this category yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {clubs.map(club => (
              <div key={club.id}
                className="rounded-2xl border border-white/10 bg-card/60 p-5 backdrop-blur-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{club.name}</h3>
                      {statusBadge(club)}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {club.suburb} · {club.zone_name}
                      </span>
                      {club.home_ground && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {club.home_ground}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> {club.contact_name} · {club.contact_email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Registered {new Date(club.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {club.is_verified && club.is_active && (
                      <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                        <QrCode className="h-4 w-4 text-[#f0b429] shrink-0" />
                        <p className="text-xs text-muted-foreground truncate">
                          QR: grassrootssports.live/club/{club.qr_code_token}/join
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action buttons — only shown for pending clubs */}
                  {!club.is_verified && !club.is_active && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => handleAction(club.id, "verify")}
                        disabled={acting === club.id}
                        className="flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-500 transition-all disabled:opacity-50">
                        {acting === club.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(club.id, "reject")}
                        disabled={acting === club.id}
                        className="flex items-center gap-1.5 rounded-xl bg-red-900/40 border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-900/60 transition-all disabled:opacity-50">
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

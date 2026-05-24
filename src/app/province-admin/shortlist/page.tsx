"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import {
  Star, ChevronLeft, Trash2, Download,
  Users, MapPin, Activity, Loader2,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

interface ShortlistedPlayer {
  id:             string;
  player_id:      string;
  name:           string;
  position:       string | null;
  sport:          string | null;
  zone_name:      string | null;
  age_group:      string | null;
  avg_form_score: number | null;
  shortlist_note: string | null;
  shortlisted_at: string;
}

export default function ProvinceAdminShortlistPage() {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [players, setPlayers]       = useState<ShortlistedPlayer[]>([]);
  const [loading, setLoading]       = useState(true);
  const [removing, setRemoving]     = useState<string | null>(null);
  const [exporting, setExporting]   = useState(false);

  const loadShortlist = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_URL}/province-admin/shortlist`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const raw = data?.data ?? data;
        setPlayers(Array.isArray(raw) ? raw : []);
      })
      .catch(() => setPlayers([]))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { loadShortlist(); }, [loadShortlist]);

  const removeFromShortlist = async (playerId: string) => {
    if (!token) return;
    setRemoving(playerId);
    try {
      const res = await fetch(`${API_URL}/province-admin/shortlist/${playerId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setPlayers(prev => prev.filter(p => p.id !== playerId));
    } finally {
      setRemoving(null);
    }
  };

  const exportPDF = async () => {
    if (players.length === 0) return;
    setExporting(true);

    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

      // ── Header bar ──
      doc.setFillColor(26, 92, 42); // #1a5c2a
      doc.rect(0, 0, pageW, 28, "F");
      doc.setTextColor(240, 180, 41); // gold
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("ZIFA Province Administration", 14, 12);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(255, 255, 255);
      doc.text("Provincial Talent Shortlist Report", 14, 20);
      doc.text(`Generated: ${today}`, pageW - 14, 20, { align: "right" });

      // ── Province / admin info ──
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Province Administrator: ${user?.name ?? ""}`, 14, 38);
      doc.text(`Total Players Shortlisted: ${players.length}`, 14, 45);

      // ── Table ──
      autoTable(doc, {
        startY: 52,
        head: [["#", "Player ID", "Name", "Sport / Position", "Zone", "Age Group", "Form Score"]],
        body: players.map((p, i) => [
          i + 1,
          p.player_id ?? "—",
          p.name,
          [p.sport, p.position].filter(Boolean).join(" · ") || "—",
          p.zone_name ?? "—",
          p.age_group ?? "—",
          p.avg_form_score !== null ? `${p.avg_form_score}/100` : "—",
        ]),
        headStyles: {
          fillColor: [26, 92, 42],
          textColor: [240, 180, 41],
          fontStyle:  "bold",
          fontSize:   9,
        },
        bodyStyles:      { fontSize: 9, textColor: [40, 40, 40] },
        alternateRowStyles: { fillColor: [245, 250, 246] },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 28 },
          6: { halign: "center" },
        },
      });

      // ── Footer ──
      const finalY = (doc as InstanceType<typeof jsPDF> & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(
        "CONFIDENTIAL — This report is produced by GrassRoots Sports for official ZIFA use only.",
        14,
        Math.min(finalY, 280)
      );

      doc.save(`ZIFA-talent-shortlist-${today.replace(/ /g, "-")}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/province-admin"
              className="rounded-xl border border-white/10 bg-white/5 p-2 hover:border-white/20 transition-all">
              <ChevronLeft className="h-4 w-4 text-white" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Star className="h-5 w-5 text-[#f0b429]" fill="currentColor" /> Talent Shortlist
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {loading ? "Loading…" : `${players.length} player${players.length !== 1 ? "s" : ""} shortlisted`}
              </p>
            </div>
          </div>

          <button
            onClick={exportPDF}
            disabled={exporting || players.length === 0}
            className="flex items-center gap-2 rounded-xl bg-[#f0b429] px-4 py-2.5 text-sm font-semibold text-[#1a3a1a] hover:bg-[#f5c542] transition-all disabled:opacity-50">
            {exporting
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Download className="h-4 w-4" />}
            Export PDF
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground py-16">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading shortlist…</span>
          </div>
        ) : players.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-card/60 p-12 text-center">
            <Star className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No players shortlisted yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Browse players in your province and tap Shortlist to add them here.
            </p>
            <Link href="/province-admin/players"
              className="inline-flex items-center gap-2 rounded-xl bg-[#f0b429] px-4 py-2 text-sm font-semibold text-[#1a3a1a]">
              <Users className="h-4 w-4" /> Browse Players
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {players.map((player, idx) => (
              <div key={player.id}
                className="flex items-center gap-4 rounded-xl border border-white/10 bg-card/60 px-4 py-3 backdrop-blur-sm">

                {/* Rank */}
                <div className="shrink-0 w-7 h-7 rounded-full bg-[#f0b429]/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-[#f0b429]">{idx + 1}</span>
                </div>

                {/* Player info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{player.name}</p>
                    {player.player_id && (
                      <span className="text-xs text-muted-foreground font-mono">{player.player_id}</span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    {player.sport    && <span>{player.sport}</span>}
                    {player.position && <span>· {player.position}</span>}
                    {player.zone_name && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" /> {player.zone_name}
                      </span>
                    )}
                    {player.age_group && <span>· {player.age_group}</span>}
                  </div>
                </div>

                {/* Form score */}
                {player.avg_form_score !== null && (
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-green-400">{player.avg_form_score}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-0.5 justify-end">
                      <Activity className="h-3 w-3" /> Form
                    </p>
                  </div>
                )}

                {/* Remove button */}
                <button
                  onClick={() => removeFromShortlist(player.id)}
                  disabled={removing === player.id}
                  className="shrink-0 rounded-xl border border-red-500/20 bg-red-900/20 p-2 text-red-400 hover:bg-red-900/40 transition-all disabled:opacity-50">
                  {removing === player.id
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

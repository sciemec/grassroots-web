"use client";
// src/app/admin/disbursements/overdue/page.tsx
// Admin: paid disbursements where proof_file_url is still missing past the due date.

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Clock, ExternalLink, AlertTriangle,
  DollarSign, RefreshCw, CheckCircle2,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

const GRS_GREEN = "#1a5c2a";
const BG        = "#f4f2ee";

interface OverdueDisbursement {
  id: string;
  campaign_id: string;
  campaign_title: string;
  payee_name: string;
  payee_ref: string;
  amount_cents: number;
  quote_file_url: string | null;
  paid_at: string | null;
  proof_due_at: string | null;
  days_overdue: number;
  requested_by: string;
}

function fmt(cents: number): string {
  return "USD " + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function daysColor(days: number): string {
  if (days >= 14) return "#dc2626";
  if (days >= 7)  return "#b45309";
  return "#6b7280";
}

function SkeletonRow() {
  return (
    <div style={{ border: "1px solid #e5e5e5", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
      {[120, 80, 60].map((w) => (
        <div key={w} style={{ height: 12, width: w, backgroundColor: "#f0f0f0", borderRadius: 6 }} />
      ))}
    </div>
  );
}

export default function OverdueProofsPage() {
  const router      = useRouter();
  const user        = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [items, setItems]     = useState<OverdueDisbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "admin") { router.replace("/"); return; }
  }, [hasHydrated, user, router]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.get("/admin/disbursements/overdue");
      setItems(Array.isArray(res.data.data) ? res.data.data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (hasHydrated && user?.role === "admin") load();
  }, [hasHydrated, user, load]);

  const isReady = hasHydrated && !loading;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG }}>
      {/* Header */}
      <header style={{ backgroundColor: GRS_GREEN, color: "#fff", padding: "18px 16px 16px", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <button
            onClick={() => router.push("/admin")}
            style={{ background: "none", border: "none", color: "#fff", display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", marginBottom: 12, opacity: 0.85 }}
          >
            <ArrowLeft size={15} /> Admin Hub
          </button>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Clock size={18} />
                <span style={{ fontSize: 18, fontWeight: 800 }}>Overdue Proofs</span>
                {isReady && items.length > 0 && (
                  <span style={{ backgroundColor: "#dc2626", color: "#fff", borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 800 }}>
                    {items.length}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 3 }}>
                Paid disbursements where the receipt has not been uploaded
              </div>
            </div>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "8px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}
              title="Refresh"
            >
              <RefreshCw size={15} color="#fff" style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }} />
            </button>
          </div>
        </div>
        <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 16px 60px" }}>

        {/* Loading skeletons */}
        {!isReady && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3].map((n) => <SkeletonRow key={n} />)}
          </div>
        )}

        {/* Empty state */}
        {isReady && items.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <CheckCircle2 size={48} color="#bbf7d0" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 6 }}>All clear</div>
            <div style={{ fontSize: 13, color: "#9ca3af" }}>No paid disbursements are missing a receipt right now.</div>
          </div>
        )}

        {/* List */}
        {isReady && items.length > 0 && (
          <>
            {/* Summary banner */}
            <div style={{
              backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10,
              padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10,
            }}>
              <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#7f1d1d" }}>
                <strong>{items.length} disbursement{items.length !== 1 ? "s" : ""}</strong> are overdue for proof of payment.
                GRS pays vendors directly — receipts are required for financial accountability.
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {items.map((d) => {
                const color = daysColor(d.days_overdue);
                return (
                  <div
                    key={d.id}
                    style={{ backgroundColor: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, padding: 16 }}
                  >
                    {/* Top row: campaign + days overdue */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                      <button
                        onClick={() => router.push(`/admin/campaigns/${d.campaign_id}`)}
                        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: GRS_GREEN, textDecoration: "underline", textDecorationColor: "#bbf7d0" }}>
                          {d.campaign_title}
                        </div>
                      </button>
                      <span style={{
                        backgroundColor: color + "18", color, border: `1px solid ${color}40`,
                        borderRadius: 999, padding: "2px 10px", fontSize: 11, fontWeight: 800, flexShrink: 0,
                      }}>
                        {d.days_overdue}d overdue
                      </span>
                    </div>

                    {/* Payee + amount */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{d.payee_name}</div>
                        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>{d.payee_ref}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <DollarSign size={13} color={GRS_GREEN} />
                        <span style={{ fontSize: 16, fontWeight: 800, color: GRS_GREEN }}>{fmt(d.amount_cents)}</span>
                      </div>
                    </div>

                    {/* Dates */}
                    <div style={{ display: "flex", gap: 20, marginTop: 10, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>
                        Paid: <strong style={{ color: "#374151" }}>
                          {d.paid_at ? new Date(d.paid_at).toLocaleDateString() : "—"}
                        </strong>
                      </div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>
                        Receipt due: <strong style={{ color }}>
                          {d.proof_due_at ? new Date(d.proof_due_at).toLocaleDateString() : "—"}
                        </strong>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
                      <button
                        onClick={() => router.push(`/admin/campaigns/${d.campaign_id}`)}
                        style={{
                          backgroundColor: GRS_GREEN, color: "#fff", border: "none", borderRadius: 8,
                          padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                        }}
                      >
                        View Campaign
                      </button>
                      {d.quote_file_url && (
                        <a
                          href={d.quote_file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#0369a1", textDecoration: "none", fontWeight: 600 }}
                        >
                          <ExternalLink size={12} /> View quote
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

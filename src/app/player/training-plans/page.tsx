"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Layers, ChevronDown, ChevronUp, Clock, User, Calendar, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssignedPlan {
  assignment_id: string;
  assigned_at: string;
  assignment_notes: string | null;
  plan_id: string;
  title: string;
  sport: string;
  description: string | null;
  duration: number | null;
  drills: Drill[];
  coach_name: string;
  coach_club: string | null;
}

interface Drill {
  name?: string;
  description?: string;
  duration_minutes?: number;
  reps?: number;
  sets?: number;
}

// ─── Sport colour map ─────────────────────────────────────────────────────────

const SPORT_COLOR: Record<string, string> = {
  football:   "#15803d",
  netball:    "#7c3aed",
  rugby:      "#b45309",
  basketball: "#c2410c",
  cricket:    "#0369a1",
  athletics:  "#6d28d9",
};

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({ plan }: { plan: AssignedPlan }) {
  const [open, setOpen] = useState(false);
  const sportColor = SPORT_COLOR[plan.sport] ?? "#1a5c2a";

  const assignedDate = new Date(plan.assigned_at).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div style={{
      backgroundColor: "white", borderRadius: 16,
      border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 12,
    }}>
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", padding: "16px", display: "flex",
          alignItems: "flex-start", gap: 14,
          background: "none", border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        {/* Sport icon */}
        <div style={{
          width: 46, height: 46, borderRadius: 12, flexShrink: 0,
          backgroundColor: `${sportColor}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Layers size={20} color={sportColor} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Sport + duration badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{
              backgroundColor: `${sportColor}15`, color: sportColor,
              border: `1px solid ${sportColor}40`,
              borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700, textTransform: "capitalize",
            }}>
              {plan.sport}
            </span>
            {plan.duration && (
              <span style={{
                display: "flex", alignItems: "center", gap: 3,
                fontSize: 11, color: "#6b7280",
              }}>
                <Clock size={11} /> {plan.duration} min
              </span>
            )}
          </div>

          <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#111", lineHeight: 1.3 }}>
            {plan.title}
          </p>

          {/* Coach + date */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#6b7280" }}>
              <User size={11} />
              {plan.coach_name}{plan.coach_club ? ` · ${plan.coach_club}` : ""}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#6b7280" }}>
              <Calendar size={11} /> Assigned {assignedDate}
            </span>
          </div>
        </div>

        {open
          ? <ChevronUp size={16} color="#9ca3af" style={{ flexShrink: 0, marginTop: 4 }} />
          : <ChevronDown size={16} color="#9ca3af" style={{ flexShrink: 0, marginTop: 4 }} />}
      </button>

      {/* Expanded detail */}
      {open && (
        <div style={{ borderTop: "1px solid #f3f4f6", padding: "16px" }}>
          {plan.description && (
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
              {plan.description}
            </p>
          )}

          {plan.assignment_notes && (
            <div style={{
              backgroundColor: "#fffbeb", border: "1px solid #fde68a",
              borderRadius: 10, padding: "10px 14px", marginBottom: 16,
            }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>
                Coach note
              </p>
              <p style={{ margin: 0, fontSize: 13, color: "#78350f", lineHeight: 1.5 }}>
                {plan.assignment_notes}
              </p>
            </div>
          )}

          {plan.drills && plan.drills.length > 0 && (
            <>
              <p style={{
                fontSize: 11, fontWeight: 700, color: "#6b7280",
                textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10,
              }}>
                Drills ({plan.drills.length})
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {plan.drills.map((drill, i) => (
                  <div key={i} style={{
                    backgroundColor: "#f9fafb", border: "1px solid #e5e7eb",
                    borderRadius: 10, padding: "10px 14px",
                  }}>
                    <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#111" }}>
                      {drill.name ?? `Drill ${i + 1}`}
                    </p>
                    {drill.description && (
                      <p style={{ margin: "0 0 6px", fontSize: 12, color: "#6b7280", lineHeight: 1.4 }}>
                        {drill.description}
                      </p>
                    )}
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {drill.duration_minutes && (
                        <span style={{ fontSize: 11, color: "#1a5c2a", fontWeight: 600 }}>
                          {drill.duration_minutes} min
                        </span>
                      )}
                      {drill.sets && (
                        <span style={{ fontSize: 11, color: "#6b7280" }}>
                          {drill.sets} sets
                        </span>
                      )}
                      {drill.reps && (
                        <span style={{ fontSize: 11, color: "#6b7280" }}>
                          {drill.reps} reps
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!plan.description && (!plan.drills || plan.drills.length === 0) && !plan.assignment_notes && (
            <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "12px 0" }}>
              No additional details added to this plan.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlayerTrainingPlansPage() {
  const token  = useAuthStore((s) => s.token);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

  const [plans, setPlans]     = useState<AssignedPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${apiUrl}/player/training-plans`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((j) => setPlans(Array.isArray(j.data) ? j.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, apiUrl]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>

      {/* Nav */}
      <div style={{
        backgroundColor: "white", borderBottom: "1px solid #e5e5e5",
        padding: "12px 20px", display: "flex", alignItems: "center", gap: 10,
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <Link
          href="/player"
          style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: 4, textDecoration: "none", fontSize: 14 }}
        >
          <ArrowLeft size={15} /> Player Hub
        </Link>
        <span style={{ color: "#d1d5db" }}>›</span>
        <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>Training Plans</span>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 16px 48px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, backgroundColor: "#1a5c2a",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Layers size={22} color="#f0b429" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111" }}>Training Plans</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Plans assigned to you by your coach</p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", color: "#6b7280" }}>
            <Loader2 size={20} style={{ marginRight: 8, animation: "spin 1s linear infinite" }} />
            Loading…
          </div>
        ) : plans.length === 0 ? (
          <div style={{
            backgroundColor: "white", borderRadius: 16,
            border: "2px dashed #d1fae5", padding: "40px 24px", textAlign: "center",
          }}>
            <Layers size={36} color="#d1fae5" style={{ margin: "0 auto 12px" }} />
            <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#374151", fontSize: 15 }}>
              No plans assigned yet
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
              When your coach assigns a training plan to you, it will appear here.
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
              {plans.length} plan{plans.length !== 1 ? "s" : ""} assigned to you
            </p>
            {plans.map((plan) => (
              <PlanCard key={plan.assignment_id} plan={plan} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

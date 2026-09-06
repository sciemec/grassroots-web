"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList, MapPin, Clock, CheckCircle2, Loader2, UserCheck } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";
import { safeArray } from "@/lib/safe-array";

interface FieldTestRequest {
  id: string;
  player_user_id: string;
  province: string | null;
  position: string | null;
  preferred_time: string | null;
  note: string | null;
  created_at: string;
  player_id: string | null;
  age_group: string | null;
  sport: string | null;
  initials: string;
}

const POSITION_LABELS: Record<string, string> = {
  goalkeeper: "Goalkeeper",
  defender:   "Defender",
  midfielder: "Midfielder",
  forward:    "Forward / Striker",
};

export default function FieldTestRequestsPage() {
  const token = useAuthStore((s) => s.token);

  const [requests,      setRequests]      = useState<FieldTestRequest[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [coachProvince, setCoachProvince] = useState<string | null>(null);
  const [accepting,     setAccepting]     = useState<string | null>(null);
  const [accepted,      setAccepted]      = useState<Record<string, string>>({});
  const [error,         setError]         = useState("");

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.get("/coach/field-test-requests")
      .then((res) => {
        setRequests(safeArray<FieldTestRequest>(res.data?.data ?? res.data));
        setCoachProvince(res.data?.coach_province ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async (reqId: string) => {
    setAccepting(reqId);
    setError("");
    try {
      const res = await api.post(`/coach/field-test-requests/${reqId}/accept`);
      const registrationId = res.data?.data?.registration_id ?? null;
      setAccepted((prev) => ({ ...prev, [reqId]: registrationId ?? "ok" }));
      setRequests((prev) => prev.filter((r) => r.id !== reqId));
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Could not accept request. Please try again.");
    } finally {
      setAccepting(null);
    }
  };

  const successCount = Object.keys(accepted).length;

  return (
    <div style={{ minHeight: "100vh", background: "#0a120b", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#0f1f12", borderBottom: "1px solid #1a2e1c", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/coach" style={{ color: "#888", display: "flex", alignItems: "center" }}>
          <ArrowLeft size={18} />
        </Link>
        <ClipboardList size={18} color="#f0b429" />
        <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Assessment Requests</h1>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px 60px" }}>

        {/* Province context */}
        {coachProvince && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, color: "#888", fontSize: 13 }}>
            <MapPin size={14} color="#f0b429" />
            <span>Showing requests in or near <strong style={{ color: "#f0b429" }}>{coachProvince}</strong></span>
          </div>
        )}

        {/* Success banner */}
        {successCount > 0 && (
          <div style={{
            marginBottom: 16, padding: "12px 16px", background: "#0d2d0d",
            borderRadius: 10, border: "1px solid #1a5c2a", display: "flex", gap: 10, alignItems: "flex-start",
          }}>
            <CheckCircle2 size={16} color="#4ade80" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#4ade80" }}>
                {successCount} request{successCount > 1 ? "s" : ""} accepted
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>
                The player{successCount > 1 ? "s have" : " has"} been added to your Player Registry.
                Go to <Link href="/coach/registered-players" style={{ color: "#f0b429" }}>Player Registry</Link> to run their field tests.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: 12, padding: "10px 14px", background: "#1a0000",
            borderRadius: 8, color: "#f87171", fontSize: 12,
          }}>
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>
            <Loader2 size={28} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        )}

        {/* Empty state */}
        {!loading && requests.length === 0 && successCount === 0 && (
          <div style={{
            textAlign: "center", padding: "48px 24px",
            borderRadius: 16, border: "1px solid #1a2e1c", background: "#0d1a0f",
          }}>
            <ClipboardList size={40} color="#2a3d2c" style={{ margin: "0 auto 12px" }} />
            <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#ddd" }}>No open requests</p>
            <p style={{ margin: 0, fontSize: 13, color: "#666" }}>
              Players in your area haven&apos;t submitted any assessment requests yet.
            </p>
            {!coachProvince && (
              <p style={{ marginTop: 12, fontSize: 12, color: "#555" }}>
                Set your province in your{" "}
                <Link href="/coach/profile" style={{ color: "#f0b429" }}>coach profile</Link>
                {" "}to filter requests by area.
              </p>
            )}
          </div>
        )}

        {/* Request cards */}
        {requests.map((req) => (
          <div
            key={req.id}
            style={{
              marginBottom: 14, padding: "16px 18px",
              borderRadius: 14, border: "1px solid #1a2e1c", background: "#0d1a0f",
            }}
          >
            {/* Player identifier (initials only — name not shown until accepted) */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "#1a3d26", border: "1px solid #2a5c36",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, color: "#f0b429", flexShrink: 0,
              }}>
                {req.initials || "?"}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff" }}>
                  Player {req.initials}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "#666" }}>
                  {req.age_group ? `Age group: ${req.age_group}` : ""}
                  {req.sport ? ` · ${req.sport}` : ""}
                </p>
              </div>
            </div>

            {/* Details row */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
              {req.position && (
                <span style={{
                  padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                  background: "#1a3d26", color: "#4ade80", border: "1px solid #2a5c36",
                }}>
                  {POSITION_LABELS[req.position] ?? req.position}
                </span>
              )}
              {req.province && (
                <span style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "3px 10px", borderRadius: 99, fontSize: 11,
                  background: "#111", color: "#888", border: "1px solid #222",
                }}>
                  <MapPin size={10} /> {req.province}
                </span>
              )}
              {req.preferred_time && (
                <span style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "3px 10px", borderRadius: 99, fontSize: 11,
                  background: "#111", color: "#888", border: "1px solid #222",
                }}>
                  <Clock size={10} /> {req.preferred_time}
                </span>
              )}
            </div>

            {/* Note */}
            {req.note && (
              <p style={{
                margin: "0 0 12px", fontSize: 12, color: "#888",
                fontStyle: "italic", lineHeight: 1.5,
              }}>
                &ldquo;{req.note}&rdquo;
              </p>
            )}

            {/* Time ago */}
            <p style={{ margin: "0 0 12px", fontSize: 11, color: "#555" }}>
              Requested {new Date(req.created_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}
            </p>

            {/* Accept button */}
            <button
              onClick={() => handleAccept(req.id)}
              disabled={accepting === req.id}
              style={{
                width: "100%", padding: "11px 0", borderRadius: 10,
                border: "none", cursor: accepting === req.id ? "not-allowed" : "pointer",
                background: accepting === req.id ? "#1a3d26" : "#f0b429",
                color: accepting === req.id ? "#4ade80" : "#1a1a1a",
                fontSize: 13, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                opacity: accepting === req.id ? 0.7 : 1,
              }}
            >
              {accepting === req.id
                ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Accepting…</>
                : <><UserCheck size={14} /> Accept &amp; Add to My Registry</>}
            </button>
          </div>
        ))}

        {/* Explanation */}
        <div style={{
          marginTop: 24, padding: "14px 16px",
          borderRadius: 12, border: "1px solid #1a2e1c", background: "#080f09",
          fontSize: 12, color: "#555", lineHeight: 1.6,
        }}>
          <p style={{ margin: "0 0 6px", color: "#888", fontWeight: 600 }}>How this works</p>
          <p style={{ margin: 0 }}>
            When you accept a request, the player is automatically added to your Player Registry.
            Go to <strong style={{ color: "#888" }}>Skill Ratings → Field Tests</strong> to enter their
            results. The player will see their scores on their Assessment page and public Talent Passport.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

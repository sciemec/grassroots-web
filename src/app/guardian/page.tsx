"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import {
  Shield, UserPlus, Users, Link as LinkIcon, LogOut,
  ChevronRight, AlertTriangle, Trash2, Clock, X,
} from "lucide-react";

interface Dependent {
  id: string;
  dependent_first_name: string;
  dependent_surname: string;
  dependent_dob: string;
  dependent_sport: string | null;
  dependent_position: string | null;
  age_group: string;
  status: string;
}

interface LinkedPlayer {
  id: string;
  player_user_id: string | null;
  player?: { name: string; sport?: string };
  age_group: string;
  status: string;
}

interface WithdrawTarget {
  linkId: string;
  playerUserId: string | null;   // null = owned dependent
  displayName: string;
  type: "owned" | "linked";
}

const API = process.env.NEXT_PUBLIC_API_URL || "https://bhora-ai.onrender.com/api/v1";

const SPORTS = [
  "Football","Rugby","Athletics","Netball","Basketball",
  "Cricket","Swimming","Tennis","Volleyball","Hockey",
];

const POSITIONS: Record<string, string[]> = {
  Football:   ["Goalkeeper","Defender","Midfielder","Striker","Winger"],
  Rugby:      ["Prop","Hooker","Lock","Flanker","Number 8","Scrum-half","Fly-half","Centre","Wing","Fullback"],
  Netball:    ["Goal Shooter","Goal Attack","Wing Attack","Centre","Wing Defence","Goal Defence","Goal Keeper"],
  Basketball: ["Point Guard","Shooting Guard","Small Forward","Power Forward","Centre"],
  default:    ["Forward","Midfield","Defender","Goalkeeper","All-rounder"],
};

const STATUS_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  withdrawal_pending: { label: "Deletion in progress…", bg: "#fef3c7", color: "#92400e" },
  withdrawn:          { label: "Data deleted",           bg: "#f3f4f6", color: "#6b7280" },
  active:             { label: "Active",                 bg: "#dcfce7", color: "#1a5c2a" },
  pending:            { label: "Pending",                bg: "#e0f2fe", color: "#0369a1" },
  revoked:            { label: "Revoked",                bg: "#fee2e2", color: "#991b1b" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_LABEL[status] ?? { label: status, bg: "#f3f4f6", color: "#374151" };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
      backgroundColor: cfg.bg, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.04em",
    }}>
      {status === "withdrawal_pending" && <Clock size={9} style={{ marginRight: 3, verticalAlign: "middle" }} />}
      {cfg.label}
    </span>
  );
}

function WithdrawModal({
  target, onCancel, onConfirmed,
}: {
  target: WithdrawTarget;
  onCancel: () => void;
  onConfirmed: (target: WithdrawTarget, reason: string) => Promise<void>;
}) {
  const [step, setStep]     = useState<1 | 2>(target.type === "owned" ? 1 : 1);
  const [reason, setReason] = useState("");
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState("");

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      await onConfirmed(target, reason || "guardian_requested");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  const isLinked = target.type === "linked";

  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, padding: "16px",
    }}>
      <div style={{
        backgroundColor: "#fff", borderRadius: 16, width: "100%", maxWidth: 440,
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden",
      }}>
        {/* Modal header */}
        <div style={{
          backgroundColor: "#fef2f2", borderBottom: "1px solid #fecaca",
          padding: "18px 20px", display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", backgroundColor: "#fee2e2",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <AlertTriangle size={18} color="#dc2626" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#dc2626", margin: 0 }}>
              {isLinked ? "Withdraw Consent & Delete Data" : "Remove Child Profile"}
            </p>
            <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>{target.displayName}</p>
          </div>
          <button onClick={onCancel}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "20px" }}>
          {step === 1 && (
            <>
              <p style={{ fontSize: 13, color: "#374151", marginBottom: 14, lineHeight: 1.5 }}>
                {isLinked
                  ? `This will permanently delete all data belonging to ${target.displayName} from GrassRoots Sports.`
                  : `This will permanently remove ${target.displayName}'s profile.`}
              </p>

              {isLinked && (
                <div style={{
                  backgroundColor: "#fef2f2", border: "1px solid #fecaca",
                  borderRadius: 10, padding: "12px 14px", marginBottom: 16,
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#dc2626",
                    textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                    What will be deleted
                  </p>
                  {[
                    "All uploaded videos and showcase clips",
                    "Biometric and biomechanics data",
                    "AI highlight clips",
                    "Arena posts and activity",
                    "Profile view history",
                    "Public profile visibility",
                  ].map((item) => (
                    <p key={item} style={{ fontSize: 12, color: "#7f1d1d", margin: "3px 0",
                      display: "flex", alignItems: "center", gap: 6 }}>
                      <Trash2 size={10} style={{ flexShrink: 0 }} /> {item}
                    </p>
                  ))}
                  <p style={{ fontSize: 11, color: "#6b7280", marginTop: 10, marginBottom: 0 }}>
                    Match stats and training logs are kept in anonymised form for club records.
                  </p>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700,
                  color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em",
                  marginBottom: 4 }}>
                  Reason (optional)
                </label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. No longer using the platform"
                  maxLength={100}
                  style={{
                    width: "100%", padding: "9px 12px", border: "1px solid #d1d5db",
                    borderRadius: 8, fontSize: 13, color: "#111", boxSizing: "border-box",
                  }}
                />
              </div>

              {error && (
                <p style={{ fontSize: 12, color: "#dc2626", backgroundColor: "#fee2e2",
                  padding: "8px 12px", borderRadius: 8, marginBottom: 12 }}>
                  {error}
                </p>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={onCancel} disabled={busy}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 8,
                    border: "1px solid #d1d5db", backgroundColor: "#fff",
                    color: "#374151", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  Cancel
                </button>
                <button
                  onClick={() => isLinked ? setStep(2) : confirm()}
                  disabled={busy}
                  style={{ flex: 2, padding: "10px 0", borderRadius: 8, border: "none",
                    backgroundColor: busy ? "#d1d5db" : "#dc2626",
                    color: "#fff", fontWeight: 700, fontSize: 13,
                    cursor: busy ? "not-allowed" : "pointer" }}>
                  {busy ? "Processing…" : isLinked ? "Continue" : "Remove profile"}
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{
                backgroundColor: "#fff7ed", border: "1px solid #fed7aa",
                borderRadius: 10, padding: "14px", marginBottom: 16,
              }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#c2410c", margin: "0 0 6px" }}>
                  This action cannot be undone.
                </p>
                <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.5 }}>
                  All of {target.displayName}&apos;s videos, biometric data, and public profile will be
                  permanently deleted. Deletion happens in the background and takes up to a minute.
                </p>
              </div>

              {error && (
                <p style={{ fontSize: 12, color: "#dc2626", backgroundColor: "#fee2e2",
                  padding: "8px 12px", borderRadius: 8, marginBottom: 12 }}>
                  {error}
                </p>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setStep(1)} disabled={busy}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 8,
                    border: "1px solid #d1d5db", backgroundColor: "#fff",
                    color: "#374151", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  Back
                </button>
                <button onClick={confirm} disabled={busy}
                  style={{ flex: 2, padding: "10px 0", borderRadius: 8, border: "none",
                    backgroundColor: busy ? "#d1d5db" : "#dc2626",
                    color: "#fff", fontWeight: 700, fontSize: 13,
                    cursor: busy ? "not-allowed" : "pointer" }}>
                  {busy ? "Deleting…" : "Yes, delete all data"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GuardianPage() {
  const router = useRouter();
  const token  = useAuthStore((s) => s.token);
  const user   = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [dependents,    setDependents]    = useState<Dependent[]>([]);
  const [linkedPlayers, setLinkedPlayers] = useState<LinkedPlayer[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [showAddForm,   setShowAddForm]   = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [formError,     setFormError]     = useState("");
  const [withdrawTarget, setWithdrawTarget] = useState<WithdrawTarget | null>(null);

  const [form, setForm] = useState({
    first_name: "", surname: "", dob: "", sport: "", position: "",
  });

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [depsRes, linkedRes] = await Promise.allSettled([
        fetch(`${API}/guardian/dependents`, { headers }),
        fetch(`${API}/guardian/linked`,     { headers }),
      ]);
      if (depsRes.status === "fulfilled" && depsRes.value.ok) {
        const j = await depsRes.value.json();
        setDependents(j.data ?? []);
      }
      if (linkedRes.status === "fulfilled" && linkedRes.value.ok) {
        const j = await linkedRes.value.json();
        setLinkedPlayers(j.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  async function addDependent() {
    setFormError("");
    if (!form.first_name.trim() || !form.surname.trim() || !form.dob) {
      setFormError("First name, surname and date of birth are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/guardian/dependents`, {
        method: "POST", headers,
        body: JSON.stringify({
          first_name: form.first_name.trim(),
          surname:    form.surname.trim(),
          dob:        form.dob,
          sport:      form.sport    || null,
          position:   form.position || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        setFormError(j.message || "Failed to add profile. Please try again.");
        return;
      }
      setForm({ first_name: "", surname: "", dob: "", sport: "", position: "" });
      setShowAddForm(false);
      await load();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleWithdrawal(target: WithdrawTarget, reason: string) {
    const body: Record<string, string> = { reason };
    if (target.playerUserId) {
      body.player_user_id = target.playerUserId;
    } else {
      body.link_id = target.linkId;
    }

    const res = await fetch(`${API}/guardian/withdraw-consent`, {
      method: "POST", headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error ?? j.message ?? "Request failed.");
    }

    setWithdrawTarget(null);

    // Update local state to reflect new status immediately.
    if (target.type === "owned") {
      setDependents((prev) => prev.filter((d) => d.id !== target.linkId));
    } else {
      setLinkedPlayers((prev) =>
        prev.map((lp) =>
          lp.id === target.linkId ? { ...lp, status: "withdrawal_pending" } : lp
        )
      );
    }
  }

  function ageFromDob(dob: string): number {
    return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
  }

  const positionOptions = POSITIONS[form.sport] ?? POSITIONS.default;

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 12px", border: "1px solid #d1d5db",
    borderRadius: 8, fontSize: 14, color: "#111", backgroundColor: "#fff",
    boxSizing: "border-box", outline: "none",
  };
  const lbl: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 700, color: "#6b7280",
    textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4,
  };

  const canWithdraw = (status: string) =>
    !["withdrawal_pending", "withdrawn", "revoked"].includes(status);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", padding: "24px 16px" }}>
      {withdrawTarget && (
        <WithdrawModal
          target={withdrawTarget}
          onCancel={() => setWithdrawTarget(null)}
          onConfirmed={handleWithdrawal}
        />
      )}

      <div style={{ maxWidth: 600, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "#dcfce7",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={20} color="#1a5c2a" />
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: 0 }}>Guardian Hub</h1>
              <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
                Welcome, {user?.name?.split(" ")[0] ?? "Guardian"}
              </p>
            </div>
          </div>
          <button onClick={() => { logout(); router.push("/login"); }}
            style={{ display: "flex", alignItems: "center", gap: 4,
              background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 12 }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>

        {/* Owned Dependents */}
        <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e5e5",
          padding: "20px", marginBottom: 16 }}>

          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={16} color="#1a5c2a" />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>My Children</span>
              <span style={{ fontSize: 11, backgroundColor: "#dcfce7", color: "#1a5c2a",
                borderRadius: 20, padding: "1px 8px", fontWeight: 700 }}>
                {dependents.length}
              </span>
            </div>
            <button onClick={() => setShowAddForm(!showAddForm)}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "7px 12px",
                borderRadius: 8, border: "none", backgroundColor: "#1a5c2a",
                color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              <UserPlus size={13} /> Add child
            </button>
          </div>

          {/* Add form */}
          {showAddForm && (
            <div style={{ backgroundColor: "#f9fafb", borderRadius: 12,
              border: "1px solid #e5e5e5", padding: "16px", marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 14 }}>
                New child profile
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={lbl}>First Name *</label>
                  <input style={inp} placeholder="e.g. Tino" value={form.first_name}
                    onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))} />
                </div>
                <div>
                  <label style={lbl}>Surname *</label>
                  <input style={inp} placeholder="e.g. Moyo" value={form.surname}
                    onChange={(e) => setForm((p) => ({ ...p, surname: e.target.value }))} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={lbl}>Date of Birth *</label>
                <input style={inp} type="date" value={form.dob}
                  max={new Date(Date.now() - 365.25 * 24 * 3600 * 1000 * 5).toISOString().split("T")[0]}
                  onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={lbl}>Sport</label>
                  <select style={{ ...inp }} value={form.sport}
                    onChange={(e) => setForm((p) => ({ ...p, sport: e.target.value, position: "" }))}>
                    <option value="">Select…</option>
                    {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Position</label>
                  <select style={{ ...inp }} value={form.position}
                    onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}>
                    <option value="">Select…</option>
                    {positionOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              {formError && (
                <p style={{ fontSize: 12, color: "#dc2626", backgroundColor: "#fee2e2",
                  padding: "8px 12px", borderRadius: 8, marginBottom: 10 }}>
                  {formError}
                </p>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setShowAddForm(false); setFormError(""); }}
                  style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid #d1d5db",
                    backgroundColor: "#fff", color: "#374151", fontWeight: 700,
                    fontSize: 13, cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={addDependent} disabled={saving}
                  style={{ flex: 2, padding: "9px 0", borderRadius: 8, border: "none",
                    backgroundColor: saving ? "#d1d5db" : "#1a5c2a",
                    color: "#fff", fontWeight: 700, fontSize: 13,
                    cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "Saving…" : "Save profile"}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>
              Loading…
            </p>
          ) : dependents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>No children added yet.</p>
              <p style={{ fontSize: 12, color: "#9ca3af" }}>
                Add your child&apos;s profile to track their progress.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {dependents.map((d) => (
                <div key={d.id} style={{ display: "flex", alignItems: "center",
                  justifyContent: "space-between", backgroundColor: "#f9fafb",
                  borderRadius: 10, padding: "12px 14px", border: "1px solid #e5e5e5" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%",
                      backgroundColor: "#dcfce7", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#1a5c2a" }}>
                      {d.dependent_first_name[0]}{d.dependent_surname[0]}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#111", margin: 0 }}>
                        {d.dependent_first_name} {d.dependent_surname}
                      </p>
                      <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>
                        Age {ageFromDob(d.dependent_dob)}
                        {d.dependent_sport    ? ` · ${d.dependent_sport}`    : ""}
                        {d.dependent_position ? ` · ${d.dependent_position}` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setWithdrawTarget({
                      linkId:       d.id,
                      playerUserId: null,
                      displayName:  `${d.dependent_first_name} ${d.dependent_surname}`,
                      type:         "owned",
                    })}
                    style={{ background: "none", border: "none", cursor: "pointer",
                      fontSize: 11, color: "#dc2626", padding: "4px 8px", fontWeight: 600 }}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Linked (platform) accounts */}
        <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e5e5",
          padding: "20px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <LinkIcon size={16} color="#1a5c2a" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>Linked Accounts</span>
            <span style={{ fontSize: 12, color: "#6b7280" }}>(13–17, player links)</span>
          </div>

          {linkedPlayers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                No linked player accounts yet.
              </p>
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                Ask your 13–17 year old to generate an invite code in their dashboard.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {linkedPlayers.map((lp) => (
                <div key={lp.id} style={{ padding: "12px 14px", backgroundColor: "#f9fafb",
                  borderRadius: 10, border: "1px solid #e5e5e5" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%",
                        backgroundColor: "#e0f2fe", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#0369a1" }}>
                        {(lp.player?.name ?? "?")[0]}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#111", margin: 0 }}>
                          {lp.player?.name ?? "Linked Player"}
                        </p>
                        <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>
                          {lp.age_group === "u13" ? "Under 13" : "13–17"}
                          {lp.player?.sport ? ` · ${lp.player.sport}` : ""}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <StatusBadge status={lp.status} />
                      {canWithdraw(lp.status) && (
                        <button
                          onClick={() => setWithdrawTarget({
                            linkId:       lp.id,
                            playerUserId: lp.player_user_id,
                            displayName:  lp.player?.name ?? "this player",
                            type:         "linked",
                          })}
                          style={{
                            display: "flex", alignItems: "center", gap: 4,
                            padding: "5px 10px", borderRadius: 7,
                            border: "1px solid #fecaca", backgroundColor: "#fef2f2",
                            color: "#dc2626", fontWeight: 700, fontSize: 11, cursor: "pointer",
                          }}>
                          <Trash2 size={11} /> Withdraw
                        </button>
                      )}
                      {!canWithdraw(lp.status) && lp.status !== "withdrawal_pending" && (
                        <ChevronRight size={14} color="#9ca3af" />
                      )}
                    </div>
                  </div>

                  {lp.status === "withdrawal_pending" && (
                    <div style={{ marginTop: 10, padding: "8px 10px",
                      backgroundColor: "#fef3c7", borderRadius: 8,
                      display: "flex", alignItems: "center", gap: 6 }}>
                      <Clock size={12} color="#92400e" />
                      <p style={{ fontSize: 11, color: "#92400e", margin: 0 }}>
                        Deletion in progress — this may take up to a minute.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer note */}
        <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center" }}>
          Guardian Addon ($2/month) — WhatsApp match alerts — activate in Settings
        </p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Activity, Target, Trophy, TrendingUp, AlertTriangle,
  Brain, Loader2, Calendar, Shield, Dumbbell, Users, Phone, Star,
  CheckCircle2, Clock, X, ShieldCheck, AlertCircle, Download,
  Camera, Pencil, Lock, Trash2, RotateCcw,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";
import { queryAI } from "@/lib/ai-query";
import jsPDF from "jspdf";
import type { SquadMember, TrainingSession } from "@/types";

// ── Fitness status badge ──────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
  fit:     "bg-green-500/15 text-green-700",
  injured: "bg-red-500/15 text-red-700",
  caution: "bg-amber-500/15 text-amber-700",
};

// ── Skill ratings bar ─────────────────────────────────────────────────────────
const SKILLS = [
  { code: "dribbling",   label: "Dribbling",   emoji: "🏃" },
  { code: "first_touch", label: "First Touch",  emoji: "🎯" },
  { code: "shooting",    label: "Shooting",     emoji: "⚽" },
  { code: "sprint",      label: "Sprint",       emoji: "💨" },
  { code: "passing",     label: "Passing",      emoji: "🔄" },
  { code: "tackling",    label: "Tackling",     emoji: "🛡️" },
] as const;

function segColor(v: number): string {
  if (v <= 3) return "#ef4444";
  if (v <= 5) return "#f59e0b";
  if (v <= 7) return "#4ade80";
  if (v <= 9) return "#c0dd97";
  return "#c8962a";
}

// ── Registration match_status config ─────────────────────────────────────────
const STATUS_CONFIG = {
  unmatched:            { label: "Not yet on platform",    color: "#6b7280", bg: "#f3f4f6", icon: Clock },
  pending_confirmation: { label: "Match found — confirm?", color: "#d97706", bg: "#fef3c7", icon: AlertCircle },
  confirmed:            { label: "Linked to Passport",     color: "#16a34a", bg: "#dcfce7", icon: CheckCircle2 },
  rejected:             { label: "Match rejected",          color: "#dc2626", bg: "#fee2e2", icon: X },
  standalone_confirmed: { label: "Confirmed by academy",   color: "#0369a1", bg: "#e0f2fe", icon: ShieldCheck },
};

type MatchStatus = keyof typeof STATUS_CONFIG;

function StatusBadge({ status }: { status: MatchStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.unmatched;
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

const ZW_PROVINCES = [
  "Harare", "Bulawayo", "Manicaland", "Mashonaland Central",
  "Mashonaland East", "Mashonaland West", "Masvingo",
  "Matabeleland North", "Matabeleland South", "Midlands",
];

// ── Interfaces ────────────────────────────────────────────────────────────────
interface Registration {
  id: string;
  organisation_name: string;
  first_name: string;
  surname: string;
  date_of_birth: string;
  sport: string | null;
  position: string | null;
  phone: string | null;
  gender: string | null;
  province: string | null;
  school: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  dominant_foot: string | null;
  photo_url: string | null;
  notes: string | null;
  video_url: string | null;
  whatsapp_number: string | null;
  number_owner: string | null;
  consent_status: string | null;
  linked_user_id: string | null;
  match_status: MatchStatus;
  match_flagged_at: string | null;
  confirmed_at: string | null;
  created_at: string;
}

interface PlayerStats {
  overall_score: number;
  sessions_total: number;
  sessions_this_week: number;
  avg_score: number;
  top_skill: string;
  improvement_area: string;
  streak_days: number;
}

interface FieldTest {
  id: string;
  position: string;
  test_date: string | null;
  results: Record<string, number | string>;
  position_verified: boolean;
  created_at: string;
}

interface Guardian {
  id: string;
  guardian_name: string;
  guardian_whatsapp: string | null;
  age_group: string | null;
  linked_at: string | null;
  whatsapp_reports: boolean;
  addon_active: boolean;
}

interface GuardiansPayload {
  player_on_platform: boolean;
  guardians: Guardian[];
}

// ── Certificate generator (moved here from registered-players) ────────────────
function generateCertificate(reg: Registration, coachName: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;

  doc.setFillColor(26, 92, 42);
  doc.rect(0, 0, W, 32, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("GRASSROOTS SPORTS ZIMBABWE", W / 2, 13, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Zimbabwe's AI-Powered Sports Platform  ·  grassrootssports.live", W / 2, 21, { align: "center" });

  doc.setFillColor(200, 150, 42);
  doc.rect(0, 32, W, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(26, 92, 42);
  doc.text("PLAYER REGISTRATION CERTIFICATE", W / 2, 50, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(110, 110, 110);
  doc.text("Official Provenance Record — GrassRoots Sports Platform", W / 2, 57, { align: "center" });

  let y = 67;
  doc.setFillColor(240, 247, 242);
  doc.setDrawColor(26, 92, 42);
  doc.setLineWidth(0.3);
  doc.rect(15, y, W - 30, 50, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(26, 92, 42);
  doc.text("PLAYER DETAILS", 20, y + 8);

  const playerName = `${reg.first_name} ${reg.surname}`;
  const dob = new Date(reg.date_of_birth).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
  const playerFields: [string, string][] = [
    ["Full Name",     playerName],
    ["Date of Birth", dob],
    ["Sport",         reg.sport ? reg.sport.charAt(0).toUpperCase() + reg.sport.slice(1) : "Not specified"],
    ["Position",      reg.position || "Not specified"],
  ];
  playerFields.forEach(([label, value], i) => {
    const fy = y + 16 + i * 9;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(100, 100, 100);
    doc.text(label + ":", 22, fy);
    doc.setFont("helvetica", "bold"); doc.setTextColor(17, 17, 17);
    doc.text(value, 78, fy);
  });

  y = 126;
  doc.setFillColor(240, 247, 242);
  doc.rect(15, y, W - 30, 60, "FD");
  doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(26, 92, 42);
  doc.text("REGISTRATION DETAILS", 20, y + 8);

  const registrationDate = new Date(reg.created_at).toLocaleString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  }) + " UTC";
  const confirmedDate = reg.confirmed_at
    ? new Date(reg.confirmed_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const statusLabel =
    reg.match_status === "confirmed"
      ? `Linked to Talent Passport${confirmedDate ? ` (${confirmedDate})` : ""}`
      : reg.match_status === "standalone_confirmed"
      ? `Confirmed by Academy${confirmedDate ? ` (${confirmedDate})` : ""}`
      : reg.match_status === "pending_confirmation"
      ? "Pending Coach Confirmation"
      : "Awaiting Player Registration";
  const refShort = reg.id.toUpperCase().slice(0, 8);
  const regFields: [string, string][] = [
    ["Academy / Club",  reg.organisation_name],
    ["Registered by",   coachName],
    ["Date Registered", registrationDate],
    ["Status",          statusLabel],
    ["GRS Reference",   `GRS-${refShort}`],
  ];
  regFields.forEach(([label, value], i) => {
    const fy = y + 16 + i * 9;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(100, 100, 100);
    doc.text(label + ":", 22, fy);
    doc.setFont("helvetica", "bold"); doc.setTextColor(17, 17, 17);
    doc.text(value, 78, fy);
  });

  y = 196;
  doc.setFillColor(255, 253, 235);
  doc.setDrawColor(200, 150, 42); doc.setLineWidth(0.4);
  doc.rect(15, y, W - 30, 46, "FD");
  doc.setFont("helvetica", "bolditalic"); doc.setFontSize(8.5); doc.setTextColor(70, 50, 0);
  const lines = [
    `This document certifies that ${playerName}, born ${dob},`,
    `was first registered and trained under ${reg.organisation_name}`,
    `on ${registrationDate}.`,
    "This timestamp is stored on GrassRoots Sports Zimbabwe servers",
    "and constitutes the official provenance record for this athlete.",
  ];
  lines.forEach((line, i) => { doc.text(line, W / 2, y + 10 + i * 7, { align: "center" }); });
  doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(26, 92, 42);
  doc.text(`Verify: grassrootssports.live/verify/${reg.id}`, W / 2, y + 41, { align: "center" });

  doc.setFillColor(200, 150, 42); doc.rect(0, 268, W, 1.5, "F");
  doc.setFillColor(26, 92, 42);   doc.rect(0, 269.5, W, 27.5, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
  doc.text("GrassRoots Sports Zimbabwe  ·  Empowering Athletes Across Zimbabwe", W / 2, 279, { align: "center" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(160, 210, 175);
  const genDate = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  doc.text(`Certificate generated: ${genDate}  ·  This is an official GrassRoots Sports document`, W / 2, 287, { align: "center" });

  doc.save(`GRS-Certificate-${reg.first_name}-${reg.surname}.pdf`);
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CoachPlayerDetailPage() {
  const router = useRouter();
  const params = useParams();
  // Fix React #185: select individual fields, never destructure from selector
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const memberId = params?.id as string;

  const coachName = (user as { name?: string } | null)?.name ?? "Coach";

  // ── Core member data ───────────────────────────────────────────────────────
  const [member,          setMember]          = useState<SquadMember | null>(null);
  const [registration,    setRegistration]    = useState<Registration | null>(null);
  const [sessions,        setSessions]        = useState<TrainingSession[]>([]);
  const [stats,           setStats]           = useState<PlayerStats | null>(null);
  const [guardiansPayload,setGuardiansPayload]= useState<GuardiansPayload | null>(null);
  const [skillRatings,    setSkillRatings]    = useState<{ skill_code: string; rating: number; notes: string | null }[]>([]);
  const [biometricScore,  setBiometricScore]  = useState<{ drill: string; resilience_index: number; flags: string[]; created_at: string } | null>(null);
  const [fieldTests,      setFieldTests]      = useState<FieldTest[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [fetchError,      setFetchError]      = useState(false);
  const [retryCount,      setRetryCount]      = useState(0);

  // ── AI report ──────────────────────────────────────────────────────────────
  const [aiReport,   setAiReport]   = useState("");
  const [loadingAi,  setLoadingAi]  = useState(false);

  // ── Registration actions ───────────────────────────────────────────────────
  const [actionId,    setActionId]    = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // ── Edit form ──────────────────────────────────────────────────────────────
  const [editingId,       setEditingId]       = useState<string | null>(null);
  const [editSubmitting,  setEditSubmitting]  = useState(false);
  const [editError,       setEditError]       = useState<string | null>(null);
  const [editPhotoFile,   setEditPhotoFile]   = useState<File | null>(null);
  const [editPhotoPreview,setEditPhotoPreview]= useState<string | null>(null);
  const editPhotoInputRef = useRef<HTMLInputElement>(null);
  const [editForm, setEditForm] = useState({
    first_name: "", surname: "", date_of_birth: "",
    sport: "", position: "", phone: "",
    gender: "", province: "", school: "",
    height_cm: "", weight_kg: "", dominant_foot: "",
    notes: "", whatsapp_number: "", number_owner: "",
  });

  // ── Archive dialog ─────────────────────────────────────────────────────────
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [archiving,      setArchiving]      = useState(false);
  const [archiveError,   setArchiveError]   = useState<string | null>(null);

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setFetchError(false);
    Promise.all([
      api.get(`/coach/squad/${memberId}`),
      api.get(`/coach/squad/${memberId}/sessions`).catch(() => ({ data: [] })),
      api.get(`/coach/squad/${memberId}/stats`).catch(() => ({ data: null })),
      api.get(`/coach/squad/${memberId}/guardians`).catch(() => ({ data: null })),
      api.get(`/coach/squad/${memberId}/skill-ratings`).catch(() => ({ data: { data: [] } })),
      api.get(`/coach/squad/${memberId}/biometric-scores`).catch(() => ({ data: { data: [] } })),
    ]).then(([memberRes, sessionsRes, statsRes, guardiansRes, ratingsRes, bioRes]) => {
      const m = memberRes.data?.data ?? memberRes.data;
      setMember(m);
      // Backend show() embeds the full registration sub-object
      if (m?.registration) setRegistration(m.registration as Registration);
      setSessions(sessionsRes.data?.data ?? sessionsRes.data ?? []);
      setStats(statsRes.data?.data ?? statsRes.data);
      if (guardiansRes.data) setGuardiansPayload(guardiansRes.data);
      setSkillRatings(Array.isArray(ratingsRes.data?.data) ? ratingsRes.data.data : []);
      const bioPayload = bioRes.data?.data ?? {};
      const bioRows  = Array.isArray(bioPayload.biometric_scores) ? bioPayload.biometric_scores : [];
      const ftRows   = Array.isArray(bioPayload.field_tests)      ? bioPayload.field_tests      : [];
      if (bioRows.length > 0) setBiometricScore(bioRows[0] as typeof biometricScore);
      setFieldTests(ftRows as FieldTest[]);
    }).catch(() => {
      setFetchError(true);
    }).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId, retryCount]);

  // ── AI report ──────────────────────────────────────────────────────────────
  const getAiReport = async () => {
    if (!member) return;
    setLoadingAi(true);
    setAiReport("");
    try {
      const reply = await queryAI(
        `Generate a player development report for ${member.name}, position: ${member.position}, status: ${member.status}. Recent sessions: ${sessions.length}. Avg score: ${stats?.avg_score ?? "N/A"}. Top skill: ${stats?.top_skill ?? "N/A"}. Area to improve: ${stats?.improvement_area ?? "N/A"}. Provide: 1) Current form assessment, 2) Recommended training focus for next 2 weeks, 3) Tactical role suitability.`,
        "coach"
      );
      setAiReport(reply);
    } catch { setAiReport("Unable to generate report. Please try again."); }
    finally   { setLoadingAi(false); }
  };

  // ── Photo upload helper ────────────────────────────────────────────────────
  async function uploadPhoto(file: File): Promise<string | null> {
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const key = `player-photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const presignRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ key, contentType: file.type }),
      });
      if (!presignRes.ok) return null;
      const { url, publicUrl } = await presignRes.json();
      const putRes = await fetch(url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!putRes.ok) return null;
      return publicUrl as string;
    } catch { return null; }
  }

  // ── Registration actions ───────────────────────────────────────────────────
  async function handleConfirm() {
    if (!registration) return;
    setActionId(registration.id); setActionError(null);
    try {
      const res = await api.post(`/coach/registered-players/${registration.id}/confirm`);
      setRegistration((prev) => prev ? { ...prev, ...res.data.data } : prev);
    } catch { setActionError("Could not confirm match. Please try again."); }
    finally   { setActionId(null); }
  }

  async function handleStandaloneConfirm() {
    if (!registration) return;
    setActionId(registration.id); setActionError(null);
    try {
      const res = await api.post(`/coach/registered-players/${registration.id}/standalone-confirm`);
      setRegistration((prev) => prev ? { ...prev, ...res.data.data } : prev);
    } catch { setActionError("Could not confirm player. Please try again."); }
    finally   { setActionId(null); }
  }

  async function handleReject() {
    if (!registration) return;
    setActionId(registration.id); setActionError(null);
    try {
      const res = await api.post(`/coach/registered-players/${registration.id}/reject`);
      setRegistration((prev) => prev ? { ...prev, ...res.data.data } : prev);
    } catch { setActionError("Could not reject match. Please try again."); }
    finally   { setActionId(null); }
  }

  // ── Edit registration ──────────────────────────────────────────────────────
  function openEdit() {
    if (!registration) return;
    setEditingId(registration.id);
    setEditForm({
      first_name:      registration.first_name,
      surname:         registration.surname,
      date_of_birth:   registration.date_of_birth?.slice(0, 10) ?? "",
      sport:           registration.sport          ?? "",
      position:        registration.position       ?? "",
      phone:           registration.phone          ?? "",
      gender:          registration.gender         ?? "",
      province:        registration.province       ?? "",
      school:          registration.school         ?? "",
      height_cm:       registration.height_cm      != null ? String(registration.height_cm) : "",
      weight_kg:       registration.weight_kg      != null ? String(registration.weight_kg) : "",
      dominant_foot:   registration.dominant_foot  ?? "",
      notes:           registration.notes          ?? "",
      whatsapp_number: registration.whatsapp_number ?? "",
      number_owner:    registration.number_owner   ?? "",
    });
    setEditError(null);
    setEditPhotoFile(null);
    setEditPhotoPreview(null);
  }

  function handleEditPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Photo must be under 5 MB"); return; }
    setEditPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setEditPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setEditSubmitting(true); setEditError(null);
    try {
      let photoUrl: string | undefined;
      if (editPhotoFile) {
        const uploaded = await uploadPhoto(editPhotoFile);
        if (!uploaded) { setEditError("Photo upload failed. Please try again."); return; }
        photoUrl = uploaded;
      }
      const payload: Record<string, unknown> = {
        sport:           editForm.sport          || undefined,
        position:        editForm.position       || undefined,
        phone:           editForm.phone          || undefined,
        gender:          editForm.gender         || undefined,
        province:        editForm.province       || undefined,
        school:          editForm.school         || undefined,
        height_cm:       editForm.height_cm      ? Number(editForm.height_cm)  : undefined,
        weight_kg:       editForm.weight_kg      ? Number(editForm.weight_kg)  : undefined,
        dominant_foot:   editForm.dominant_foot  || undefined,
        notes:           editForm.notes          || undefined,
        whatsapp_number: editForm.whatsapp_number || undefined,
        number_owner:    editForm.number_owner   || undefined,
      };
      if (photoUrl) payload.photo_url = photoUrl;
      if (editForm.first_name)    payload.first_name    = editForm.first_name;
      if (editForm.surname)       payload.surname       = editForm.surname;
      if (editForm.date_of_birth) payload.date_of_birth = editForm.date_of_birth;

      const res = await api.patch(`/coach/registered-players/${editingId}`, payload);
      setRegistration((prev) => prev ? { ...prev, ...res.data.data } : prev);
      setEditingId(null);
      setEditPhotoFile(null);
      setEditPhotoPreview(null);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string; locked_fields?: string[] } } };
      const lockedMsg = apiErr?.response?.data?.locked_fields?.length
        ? ` Locked: ${apiErr.response.data.locked_fields.join(", ")}.`
        : "";
      setEditError((apiErr?.response?.data?.message ?? "Update failed. Please try again.") + lockedMsg);
    } finally { setEditSubmitting(false); }
  }

  // ── Archive / restore ──────────────────────────────────────────────────────
  async function handleArchive() {
    setArchiving(true);
    setArchiveError(null);
    try {
      await api.delete(`/coach/squad/${memberId}`);
      setMember((prev) => prev ? { ...prev, removed_at: new Date().toISOString() } as typeof prev : prev);
      setConfirmArchive(false);
    } catch {
      setArchiveError("Archive failed. Please try again.");
    } finally {
      setArchiving(false);
    }
  }

  async function handleRestore() {
    setArchiving(true);
    setArchiveError(null);
    try {
      await api.post(`/coach/squad/${memberId}/restore`);
      setMember((prev) => prev ? { ...prev, removed_at: null } as typeof prev : prev);
    } catch {
      setArchiveError("Restore failed. Please try again.");
    } finally {
      setArchiving(false);
    }
  }

  const isArchived = !!(member as { removed_at?: string | null } | null)?.removed_at;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-background">
      <main className="flex-1 overflow-auto p-6">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/coach/squad" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Player Profile</h1>
            <p className="text-sm text-muted-foreground">Individual performance and development</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map((i) => <div key={i} className="h-32 rounded-xl border bg-muted/40 animate-pulse" />)}
          </div>
        ) : fetchError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-12 text-center">
            <p className="font-medium text-destructive mb-3">Could not load player profile</p>
            <button
              onClick={() => setRetryCount((c) => c + 1)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : !member ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <p className="text-muted-foreground">Player not found.</p>
            <Link href="/coach/squad" className="mt-4 inline-block text-sm text-primary hover:underline">Back to squad</Link>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Archive banner */}
            {isArchived && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-amber-700">This player has been archived from your squad.</p>
                  <button
                    onClick={handleRestore}
                    disabled={archiving}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500 disabled:opacity-50"
                  >
                    {archiving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                    Restore
                  </button>
                </div>
                {archiveError && (
                  <p className="mt-1.5 text-xs text-red-600">{archiveError}</p>
                )}
              </div>
            )}

            {/* Player card */}
            <div className="rounded-2xl border bg-card p-6">
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-black">
                  {member.shirt_no ?? "—"}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{member.name ?? "—"}</h2>
                  <p className="text-sm text-muted-foreground capitalize">{member.position}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[member.status] ?? "bg-muted"}`}>
                      {member.status}
                    </span>
                    {member.age_phase && (
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs uppercase">{member.age_phase}</span>
                    )}
                    {registration && (
                      <StatusBadge status={registration.match_status} />
                    )}
                  </div>
                  {member.status_note && (
                    <p className="mt-3 flex items-center gap-1.5 text-sm text-amber-700">
                      <AlertTriangle className="h-3.5 w-3.5" /> {member.status_note}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/injury-tracker?player_id=${member.player_user_id}&position=${member.position}`}
                    className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <Activity className="h-4 w-4 text-orange-500" /> Injury Risk
                  </Link>
                  {!isArchived && (
                    <button
                      onClick={() => setConfirmArchive(true)}
                      className="flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" /> Archive
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Archive confirm dialog */}
            {confirmArchive && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
                <p className="text-sm font-semibold text-red-700">Remove {member.name} from active squad?</p>
                <p className="mt-1 text-xs text-red-500">You can restore them later. Their training history is preserved.</p>
                <div className="mt-3 flex gap-3">
                  <button
                    onClick={handleArchive}
                    disabled={archiving}
                    className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50"
                  >
                    {archiving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    Yes, archive
                  </button>
                  <button onClick={() => { setConfirmArchive(false); setArchiveError(null); }} className="rounded-lg border px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
                {archiveError && (
                  <p className="mt-2 text-xs text-red-600">{archiveError}</p>
                )}
              </div>
            )}

            {/* Registration panel */}
            {registration && (
              <div className="rounded-2xl border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-semibold flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-blue-500" /> Registration Record
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => generateCertificate(registration, coachName)}
                      className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      <Download className="h-3.5 w-3.5" /> Certificate
                    </button>
                    <button
                      onClick={openEdit}
                      className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                  </div>
                </div>

                {/* Match status actions */}
                {actionError && (
                  <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    <span>{actionError}</span>
                    <button onClick={() => setActionError(null)}><X className="h-3.5 w-3.5" /></button>
                  </div>
                )}
                {registration.match_status === "pending_confirmation" && (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="mb-2 text-xs font-bold text-amber-700">
                      A platform match was found — confirm or reject:
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleConfirm}
                        disabled={actionId === registration.id}
                        className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-500 disabled:opacity-50"
                      >
                        {actionId === registration.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Confirm match
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={actionId === registration.id}
                        className="flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {actionId === registration.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                        Not this player
                      </button>
                    </div>
                  </div>
                )}
                {registration.match_status === "unmatched" && (
                  <div className="mb-4">
                    <button
                      onClick={handleStandaloneConfirm}
                      disabled={actionId === registration.id}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                      {actionId === registration.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                      Mark confirmed (player won&apos;t join platform)
                    </button>
                  </div>
                )}

                {/* Registration details */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  {registration.photo_url && (
                    <div className="col-span-2 mb-2">
                      <img src={registration.photo_url} alt={registration.first_name} className="h-20 w-20 rounded-xl object-cover border" />
                    </div>
                  )}
                  {[
                    ["Full Name",    `${registration.first_name} ${registration.surname}`],
                    ["Date of Birth", new Date(registration.date_of_birth).toLocaleDateString("en-GB")],
                    ["Sport",        registration.sport ?? "—"],
                    ["Position",     registration.position ?? "—"],
                    ["Gender",       registration.gender ?? "—"],
                    ["Province",     registration.province ?? "—"],
                    ["School / Club",registration.school ?? "—"],
                    ["Height",       registration.height_cm ? `${registration.height_cm} cm` : "—"],
                    ["Weight",       registration.weight_kg ? `${registration.weight_kg} kg` : "—"],
                    ["Dominant Foot",registration.dominant_foot ?? "—"],
                    ["Phone",        registration.phone ?? "—"],
                    ["WhatsApp",     registration.whatsapp_number ?? "—"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-muted-foreground">{label}</p>
                      <p className="font-semibold capitalize">{value}</p>
                    </div>
                  ))}
                  {registration.notes && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Coach Notes</p>
                      <p className="font-semibold">{registration.notes}</p>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
                  <StatusBadge status={registration.match_status} />
                  {registration.consent_status && (
                    <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-700 capitalize">
                      Consent: {registration.consent_status}
                    </span>
                  )}
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    Registered {new Date(registration.created_at).toLocaleDateString("en-GB")}
                  </span>
                </div>
              </div>
            )}

            {/* Edit registration form */}
            {editingId && registration && (() => {
              const identityLocked = registration.match_status !== "unmatched" || registration.consent_status === "verified";
              const editingPhotoUrl = editPhotoPreview ?? registration.photo_url;
              return (
                <div className="rounded-2xl border-2 border-[#1a5c2a] bg-card p-5 shadow-md">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wide">
                        Edit — {registration.first_name} {registration.surname}
                      </h3>
                      {identityLocked && (
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-amber-600">
                          <Lock className="h-2.5 w-2.5" /> Name and DOB are locked (record is matched or consent verified)
                        </p>
                      )}
                    </div>
                    <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <form onSubmit={handleUpdate} className="space-y-4">

                    {/* Photo */}
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Player Photo</label>
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => editPhotoInputRef.current?.click()}
                          className="flex h-16 w-16 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed hover:border-[#1a5c2a] transition-colors"
                        >
                          {editingPhotoUrl
                            ? <img src={editingPhotoUrl} alt="preview" className="h-full w-full object-cover" />
                            : <Camera className="h-5 w-5 text-muted-foreground" />
                          }
                        </div>
                        <div>
                          <button type="button" onClick={() => editPhotoInputRef.current?.click()} className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted">
                            {editingPhotoUrl ? "Change photo" : "Add photo"}
                          </button>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">JPG or PNG · max 5 MB</p>
                        </div>
                        <input ref={editPhotoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleEditPhotoSelect} />
                      </div>
                    </div>

                    {/* Identity */}
                    <div>
                      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#1a5c2a]">
                        Identity {identityLocked && <span className="text-amber-500">· Locked</span>}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">First Name *</label>
                          <input value={editForm.first_name}
                            onChange={(e) => !identityLocked && setEditForm({ ...editForm, first_name: e.target.value })}
                            required disabled={identityLocked}
                            className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">Surname *</label>
                          <input value={editForm.surname}
                            onChange={(e) => !identityLocked && setEditForm({ ...editForm, surname: e.target.value })}
                            required disabled={identityLocked}
                            className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">Date of Birth *</label>
                          <input type="date" value={editForm.date_of_birth}
                            onChange={(e) => !identityLocked && setEditForm({ ...editForm, date_of_birth: e.target.value })}
                            required disabled={identityLocked}
                            className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">Gender</label>
                          <select value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none">
                            <option value="">Select...</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#1a5c2a]">Location & School</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">Province</label>
                          <select value={editForm.province} onChange={(e) => setEditForm({ ...editForm, province: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none">
                            <option value="">Select...</option>
                            {ZW_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">School / Club</label>
                          <input value={editForm.school} onChange={(e) => setEditForm({ ...editForm, school: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none" placeholder="e.g. Harare High School" />
                        </div>
                      </div>
                    </div>

                    {/* Sport Profile */}
                    <div>
                      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#1a5c2a]">Sport Profile</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">Sport</label>
                          <select value={editForm.sport} onChange={(e) => setEditForm({ ...editForm, sport: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none">
                            <option value="">Select...</option>
                            {["Football", "Rugby", "Athletics", "Netball", "Basketball", "Cricket", "Swimming", "Tennis", "Volleyball", "Hockey"].map((s) => (
                              <option key={s} value={s.toLowerCase()}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">Position</label>
                          <input value={editForm.position} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none" placeholder="e.g. Striker" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">Dominant Foot</label>
                        <div className="flex gap-2">
                          {["Right", "Left", "Both"].map((f) => (
                            <button key={f} type="button"
                              onClick={() => setEditForm({ ...editForm, dominant_foot: editForm.dominant_foot === f.toLowerCase() ? "" : f.toLowerCase() })}
                              className="flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors"
                              style={{
                                borderColor: editForm.dominant_foot === f.toLowerCase() ? "#1a5c2a" : undefined,
                                backgroundColor: editForm.dominant_foot === f.toLowerCase() ? "#f0fdf4" : undefined,
                                color: editForm.dominant_foot === f.toLowerCase() ? "#1a5c2a" : undefined,
                              }}
                            >{f}</button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Physical */}
                    <div>
                      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#1a5c2a]">Physical</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">Height (cm)</label>
                          <input type="number" min="50" max="250" value={editForm.height_cm} onChange={(e) => setEditForm({ ...editForm, height_cm: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none" placeholder="165" />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">Weight (kg)</label>
                          <input type="number" min="20" max="200" value={editForm.weight_kg} onChange={(e) => setEditForm({ ...editForm, weight_kg: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none" placeholder="60" />
                        </div>
                      </div>
                    </div>

                    {/* Contact */}
                    <div>
                      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#1a5c2a]">Contact</p>
                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">Player / Guardian Phone</label>
                          <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none" placeholder="+263 77 123 4567" />
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">Parent / Guardian WhatsApp</label>
                          <input value={editForm.whatsapp_number} onChange={(e) => setEditForm({ ...editForm, whatsapp_number: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none" placeholder="+263712345678" />
                          <p className="mt-0.5 text-[10px] text-amber-600">⚠ Changing this number will cancel any pending consent request.</p>
                        </div>
                        {editForm.whatsapp_number && (
                          <div>
                            <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">WhatsApp number belongs to</label>
                            <div className="flex gap-2">
                              {[{ value: "parent", label: "Parent" }, { value: "guardian", label: "Guardian" }].map(({ value, label }) => (
                                <button key={value} type="button"
                                  onClick={() => setEditForm({ ...editForm, number_owner: editForm.number_owner === value ? "" : value })}
                                  className="flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors"
                                  style={{
                                    borderColor: editForm.number_owner === value ? "#1a5c2a" : undefined,
                                    backgroundColor: editForm.number_owner === value ? "#f0fdf4" : undefined,
                                    color: editForm.number_owner === value ? "#1a5c2a" : undefined,
                                  }}
                                >{label}</button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#1a5c2a]">Coach Notes</p>
                      <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={2} className="w-full rounded-lg border px-3 py-2 text-sm bg-background focus:outline-none resize-none" placeholder="e.g. Excellent pace, needs work on left foot" />
                    </div>

                    {editError && (
                      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{editError}</p>
                    )}

                    <div className="flex gap-3">
                      <button type="button" onClick={() => setEditingId(null)} className="flex-1 rounded-lg border py-2.5 text-sm font-semibold hover:bg-muted">
                        Cancel
                      </button>
                      <button type="submit" disabled={editSubmitting}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-white disabled:opacity-60"
                        style={{ backgroundColor: "#1a5c2a" }}
                      >
                        {editSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                        {editSubmitting ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </div>
              );
            })()}

            {/* Parents / Guardians */}
            {guardiansPayload?.player_on_platform && (
              <div className="rounded-xl border bg-card p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <h2 className="font-semibold text-sm">Parent / Guardian Contacts</h2>
                  {guardiansPayload.guardians.length === 0 && (
                    <span className="ml-auto text-xs text-muted-foreground">None registered</span>
                  )}
                </div>
                {guardiansPayload.guardians.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No parent or guardian has linked to this player&apos;s account yet.</p>
                ) : (
                  <div className="space-y-2">
                    {guardiansPayload.guardians.map((g) => (
                      <div key={g.id} className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15 shrink-0">
                            <Users className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{g.guardian_name}</p>
                            {g.linked_at && (
                              <p className="text-xs text-muted-foreground">Linked {new Date(g.linked_at).toLocaleDateString("en-ZW")}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {g.age_group && (
                            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">{g.age_group}</span>
                          )}
                          {g.guardian_whatsapp && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" /> {g.guardian_whatsapp}
                            </span>
                          )}
                          {g.whatsapp_reports && (
                            <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-700">WA reports on</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stats grid */}
            {stats && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { icon: Target,    label: "Overall Score",    value: `${stats.overall_score ?? "—"}%`, color: "text-primary" },
                  { icon: Dumbbell,  label: "Sessions Total",   value: stats.sessions_total,              color: "text-blue-500" },
                  { icon: TrendingUp,label: "Avg Session Score",value: `${stats.avg_score ?? "—"}%`,     color: "text-green-600" },
                  { icon: Trophy,    label: "Training Streak",  value: `${stats.streak_days} days`,      color: "text-amber-500" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="rounded-xl border bg-card p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`h-4 w-4 ${color}`} />
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                    <p className="text-2xl font-bold">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Skills insight */}
            {stats && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border bg-green-500/5 border-green-500/20 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <h3 className="font-semibold text-sm">Strongest Skill</h3>
                  </div>
                  <p className="text-lg font-bold capitalize">{stats.top_skill || "—"}</p>
                </div>
                <div className="rounded-xl border bg-amber-500/5 border-amber-500/20 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-amber-600" />
                    <h3 className="font-semibold text-sm">Focus Area</h3>
                  </div>
                  <p className="text-lg font-bold capitalize">{stats.improvement_area || "—"}</p>
                </div>
              </div>
            )}

            {/* Skill Ratings */}
            <div className="rounded-xl border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" /> Coach Skill Ratings
                </h2>
                <Link href="/coach/skill-ratings" className="text-xs text-primary hover:underline">
                  Rate / Edit →
                </Link>
              </div>
              {skillRatings.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No ratings yet.{" "}
                  <Link href="/coach/skill-ratings" className="text-primary hover:underline">Rate this player →</Link>
                </p>
              ) : (
                <div className="space-y-3">
                  {SKILLS.map((skill) => {
                    const r = skillRatings.find((x) => x.skill_code === skill.code);
                    const v = r?.rating ?? 0;
                    return (
                      <div key={skill.code}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">{skill.emoji} {skill.label}</span>
                          <span className="text-sm font-bold" style={{ color: v ? segColor(v) : "var(--muted-foreground)" }}>
                            {v ? `${v}/10` : "—"}
                          </span>
                        </div>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 10 }, (_, i) => (
                            <div key={i} className="flex-1 h-1.5 rounded-full" style={{ background: i < v ? segColor(i + 1) : "var(--muted)" }} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {(() => {
                    const rated = skillRatings.filter((r) => r.rating > 0);
                    if (rated.length === 0) return null;
                    const avg = rated.reduce((s, r) => s + r.rating, 0) / rated.length;
                    return (
                      <div className="mt-3 pt-3 border-t flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Overall ({rated.length}/{SKILLS.length} skills rated)</span>
                        <span className="text-lg font-bold" style={{ color: segColor(Math.round(avg)) }}>{avg.toFixed(1)}/10</span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Body Safety Score */}
            {biometricScore && (() => {
              const FLAG_LABELS: Record<string, string> = {
                knee_valgus:         "Knee alignment",
                bilateral_asymmetry: "Movement asymmetry",
                heel_recovery_poor:  "Heel recovery",
                arm_swing_weak:      "Arm swing",
                landing_too_stiff:   "Landing stiffness",
                trunk_too_upright:   "Trunk lean",
              };
              const ri = Math.round(biometricScore.resilience_index);
              const barColor = ri >= 70 ? "#22c55e" : ri >= 45 ? "#f59e0b" : "#ef4444";
              return (
                <div className="rounded-xl border bg-card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-600" /> Body Safety Score
                    </h2>
                    <span className="text-xs text-muted-foreground">{biometricScore.drill}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${ri}%`, backgroundColor: barColor }} />
                    </div>
                    <span className="text-sm font-bold tabular-nums" style={{ color: barColor }}>{ri}/100</span>
                  </div>
                  {biometricScore.flags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {biometricScore.flags.map((f) => (
                        <span key={f} className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-red-500/10 text-red-700">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          {FLAG_LABELS[f] ?? f.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No movement flags detected.</p>
                  )}
                </div>
              );
            })()}

            {/* Field Tests */}
            <div className="rounded-xl border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" /> Field Tests
                </h2>
                {fieldTests.length > 0 && (
                  <span className="text-xs text-muted-foreground">{fieldTests.length} test{fieldTests.length !== 1 ? "s" : ""}</span>
                )}
              </div>
              {fieldTests.length === 0 ? (
                <div className="rounded-lg border border-dashed p-5 text-center">
                  <Target className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No field tests recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fieldTests.map((ft) => {
                    const resultEntries = Object.entries(ft.results ?? {});
                    return (
                      <div key={ft.id} className="rounded-lg border bg-muted/20 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-semibold capitalize">{ft.position}</span>
                          <div className="flex items-center gap-2">
                            {ft.position_verified && (
                              <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-bold text-green-700">Verified</span>
                            )}
                            {ft.test_date && (
                              <span className="text-xs text-muted-foreground">{new Date(ft.test_date).toLocaleDateString("en-ZW")}</span>
                            )}
                          </div>
                        </div>
                        {resultEntries.length > 0 ? (
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                            {resultEntries.map(([key, val]) => (
                              <div key={key} className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                                <span className="text-xs font-semibold tabular-nums">{String(val)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No result data.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent sessions */}
            <div className="rounded-xl border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Recent Sessions
                </h2>
                <span className="text-xs text-muted-foreground">{sessions.length} total</span>
              </div>
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {sessions.slice(0, 8).map((s) => (
                    <Link
                      key={s.id}
                      href={`/sessions/${s.id}`}
                      className="flex items-center justify-between rounded-lg px-4 py-3 hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium capitalize">{s.focus_area}</p>
                        <p className="text-xs text-muted-foreground capitalize">{s.session_type} · {new Date(s.created_at).toLocaleDateString("en-ZW")}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {s.overall_score != null && (
                          <span className={`text-sm font-bold ${s.overall_score >= 70 ? "text-green-600" : s.overall_score >= 50 ? "text-amber-600" : "text-red-500"}`}>
                            {s.overall_score}%
                          </span>
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${s.status === "completed" ? "bg-green-500/15 text-green-700" : "bg-muted text-muted-foreground"}`}>
                          {s.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* AI Development Report */}
            <div className="rounded-xl border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" /> AI Development Report
                </h2>
                <button
                  onClick={getAiReport}
                  disabled={loadingAi}
                  className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50 transition-colors"
                >
                  {loadingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                  {aiReport ? "Regenerate" : "Generate Report"}
                </button>
              </div>
              {aiReport ? (
                <div className="rounded-xl bg-purple-500/5 border border-purple-500/20 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{aiReport}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Generate an AI-powered development report for {member.name?.split(" ")[0] ?? "this player"} based on their training history and performance data.
                </p>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import {
  Shield,
  Users,
  Flame,
  ShieldAlert,
  Target,
  Activity,
  Dumbbell,
  HeartPulse,
  Briefcase,
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  Trash2,
  BookOpen,
  Layers,
  Video,
  ChevronRight,
  UserCheck,
  UserPlus,
  Phone,
  Mail,
  Pencil,
  X,
  StickyNote,
  Send,
  ChevronDown,
  Swords,
} from "lucide-react";
import { getRoleConfig, type StaffRoleConfig } from "@/config/coaching-staff";
import { getDrillsByDepartment, type Drill } from "@/lib/department-drills";
import { safeArray } from "@/lib/safe-array";
import { useAuthStore } from "@/lib/auth-store";

// ─── Icon map ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Shield,
  Users,
  Flame,
  ShieldAlert,
  Target,
  Activity,
  Dumbbell,
  HeartPulse,
  Briefcase,
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrainingPlan {
  id: string;
  title: string;
  sport: string;
  description: string | null;
  duration: number | null;
  coaching_role: string | null;
  created_at: string;
}

interface StaffMember {
  name: string;
  phone: string;
  email: string;
}

interface Note {
  id: string;
  text: string;
  createdAt: string;
}

type Tab = "overview" | "staff" | "drills" | "plans" | "notes";

// ─── localStorage helpers ──────────────────────────────────────────────────

const ROSTER_KEY = "gs_staff_roster";

function loadRoster(): Record<string, StaffMember> {
  try {
    return JSON.parse(localStorage.getItem(ROSTER_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveRoster(roster: Record<string, StaffMember>) {
  localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
}

function loadNotes(roleId: string): Note[] {
  try {
    return JSON.parse(localStorage.getItem(`gs_dept_notes_${roleId}`) ?? "[]");
  } catch {
    return [];
  }
}

function saveNotes(roleId: string, notes: Note[]) {
  localStorage.setItem(`gs_dept_notes_${roleId}`, JSON.stringify(notes));
}

// ─── DrillCard ───────────────────────────────────────────────────────────────

const DIFFICULTY_COLOR: Record<string, { bg: string; text: string }> = {
  beginner:     { bg: "#dcfce7", text: "#166534" },
  intermediate: { bg: "#fef3c7", text: "#92400e" },
  advanced:     { bg: "#fee2e2", text: "#991b1b" },
};

function DrillCard({ drill, roleId }: { drill: Drill; roleId: string }) {
  const [expanded, setExpanded] = useState(false);
  const diff = DIFFICULTY_COLOR[drill.difficulty] ?? { bg: "#f3f4f6", text: "#374151" };

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-sm transition-shadow">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full capitalize"
                style={{ backgroundColor: diff.bg, color: diff.text }}
              >
                {drill.difficulty}
              </span>
              <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {drill.phase}
              </span>
            </div>
            <h4 className="font-semibold text-gray-900 text-[14px] leading-snug mb-0.5">
              {drill.name}
            </h4>
            <div className="flex items-center gap-1 text-[12px] text-gray-400">
              <Clock size={11} />
              <span>{drill.duration}</span>
            </div>
          </div>
          <ChevronDown
            size={15}
            className={`text-gray-300 shrink-0 mt-1 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          <p className="text-[13px] text-gray-600 leading-relaxed">{drill.description}</p>

          {drill.coachingPoints.length > 0 && (
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                Coaching Points
              </p>
              <ul className="space-y-1">
                {drill.coachingPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-gray-700">
                    <span
                      className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: "#1a5c2a" }}
                    />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {drill.equipment.length > 0 && (
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
                Equipment
              </p>
              <div className="flex flex-wrap gap-1.5">
                {drill.equipment.map((eq, i) => (
                  <span key={i} className="text-[12px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {eq}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Link
            href={`/coach/tactics/board?dept=${roleId}`}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white px-3 py-1.5 rounded-full transition-colors"
            style={{ backgroundColor: "#1a5c2a" }}
          >
            Draw on Board
            <ChevronRight size={11} />
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── PlanCard ─────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  token,
  onDelete,
}: {
  plan: TrainingPlan;
  token: string | null;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${plan.title}"?`)) return;
    setDeleting(true);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/coach/training-plans/${plan.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      onDelete(plan.id);
    } finally {
      setDeleting(false);
    }
  };

  const date = new Date(plan.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-start justify-between gap-4 hover:shadow-sm transition-shadow">
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 text-[14px] truncate mb-1">{plan.title}</h4>
        {plan.description && (
          <p className="text-gray-500 text-[13px] line-clamp-2 mb-2">{plan.description}</p>
        )}
        <div className="flex items-center gap-3 text-[12px] text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {date}
          </span>
          {plan.duration && (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {plan.duration} min
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {plan.sport}
          </span>
        </div>
      </div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-gray-300 hover:text-red-400 transition-colors shrink-0 mt-0.5"
        aria-label="Delete plan"
      >
        {deleting ? (
          <div className="w-4 h-4 border border-gray-300 border-t-red-400 rounded-full animate-spin" />
        ) : (
          <Trash2 size={16} />
        )}
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RoleWorkspacePage() {
  const params = useParams();
  const roleId = params?.roleId as string;
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [role, setRole] = useState<StaffRoleConfig | null>(null);
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Staff
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [editing, setEditing] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: "", phone: "", email: "" });

  // Plans
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansFetched, setPlansFetched] = useState(false);

  // Drills
  const [drills, setDrills] = useState<Drill[]>([]);

  // Notes
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteInput, setNoteInput] = useState("");
  const noteRef = useRef<HTMLTextAreaElement>(null);

  // Auth guard
  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "coach" && user.role !== "admin") { router.replace("/dashboard"); return; }
    const cfg = getRoleConfig(roleId);
    if (!cfg) { router.replace("/coach/technical-staff"); return; }
    setRole(cfg);

    // Load staff
    const roster = loadRoster();
    setStaff(roster[roleId] ?? null);

    // Load drills
    setDrills(getDrillsByDepartment(cfg.department === "all" ? "all" : cfg.department));

    // Load notes
    setNotes(loadNotes(roleId));

    setReady(true);
  }, [hasHydrated, user, router, roleId]);

  // Fetch plans when tab is activated
  useEffect(() => {
    if (activeTab !== "plans" || plansFetched || !token) return;
    setPlansLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/coach/training-plans`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        const all = safeArray<TrainingPlan>(res);
        setPlans(all.filter((p) => !p.coaching_role || p.coaching_role === roleId));
      })
      .catch(() => {})
      .finally(() => { setPlansLoading(false); setPlansFetched(true); });
  }, [activeTab, plansFetched, token, roleId]);

  // ── Staff actions ──────────────────────────────────────────────────────────

  const openAddStaff = () => {
    setStaffForm(staff ? { ...staff } : { name: "", phone: "", email: "" });
    setEditing(true);
  };

  const saveStaff = () => {
    if (!staffForm.name.trim()) return;
    const member: StaffMember = {
      name: staffForm.name.trim(),
      phone: staffForm.phone.trim(),
      email: staffForm.email.trim(),
    };
    const roster = loadRoster();
    roster[roleId] = member;
    saveRoster(roster);
    setStaff(member);
    setEditing(false);
  };

  const removeStaff = () => {
    if (!confirm("Remove this staff member?")) return;
    const roster = loadRoster();
    delete roster[roleId];
    saveRoster(roster);
    setStaff(null);
  };

  // ── Note actions ───────────────────────────────────────────────────────────

  const addNote = () => {
    const text = noteInput.trim();
    if (!text) return;
    const note: Note = { id: Date.now().toString(), text, createdAt: new Date().toISOString() };
    const updated = [note, ...notes];
    setNotes(updated);
    saveNotes(roleId, updated);
    setNoteInput("");
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    saveNotes(roleId, updated);
  };

  // ─── Loading ───────────────────────────────────────────────────────────────

  if (!ready || !role) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }} className="flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-green-700 rounded-full animate-spin" />
      </div>
    );
  }

  const Icon = ICON_MAP[role.icon] ?? Shield;

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "staff",    label: staff ? "Staff ✓" : "Staff" },
    { id: "drills",   label: `Drills (${drills.length})` },
    { id: "plans",    label: "Plans" },
    { id: "notes",    label: notes.length > 0 ? `Notes (${notes.length})` : "Notes" },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Sticky nav */}
      <nav className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/coach/technical-staff"
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm transition-colors"
            >
              <ArrowLeft size={16} />
              Coaching Center
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">
              {role.title}
            </span>
          </div>

          <Link
            href={`/coach/training-plans/new?role=${roleId}`}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-full text-white transition-colors"
            style={{ backgroundColor: "#1a5c2a" }}
          >
            <Plus size={14} />
            New Plan
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Role identity header */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-5">
          <div className={`h-1.5 w-full bg-gradient-to-r ${role.gradient}`} />
          <div className="p-5">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${role.gradient} text-white shrink-0`}>
                <Icon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900 leading-tight">{role.title} Desk</h1>
                <p className="text-gray-500 text-[13px] mt-0.5">{role.description}</p>
              </div>
              {staff && (
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full shrink-0">
                  <UserCheck size={11} />
                  {staff.name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-5 bg-white border border-gray-200 rounded-xl p-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-shrink-0 text-[13px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === t.id
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-900"
              }`}
              style={activeTab === t.id ? { backgroundColor: "#1a5c2a" } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Tool cards */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400 mb-3 flex items-center gap-2">
                <span className="inline-block w-4 h-px bg-gray-300" />
                Department Tools
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href={`/coach/tactics/board?dept=${roleId}`}
                  className="group rounded-2xl border border-gray-200 bg-white p-4 hover:border-[#1a5c2a] hover:shadow-md transition-all relative overflow-hidden"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "#dbeafe" }}>
                    <Layers size={16} style={{ color: "#2563eb" }} />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wide text-gray-900 leading-none">
                    Tactical Board
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-1 leading-snug">Illustrate drills on pitch</p>
                  <ChevronRight size={12} className="absolute bottom-4 right-4 text-gray-300 group-hover:text-[#1a5c2a] transition-colors" />
                </Link>

                <Link
                  href={`/coach/drills?dept=${roleId}`}
                  className="group rounded-2xl border border-gray-200 bg-white p-4 hover:border-[#1a5c2a] hover:shadow-md transition-all relative overflow-hidden"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "#dcfce7" }}>
                    <Dumbbell size={16} style={{ color: "#16a34a" }} />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wide text-gray-900 leading-none">
                    Drills Library
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-1 leading-snug">Browse department drills</p>
                  <ChevronRight size={12} className="absolute bottom-4 right-4 text-gray-300 group-hover:text-[#1a5c2a] transition-colors" />
                </Link>

                <Link
                  href="/coach/set-pieces"
                  className="group rounded-2xl border border-gray-200 bg-white p-4 hover:border-[#1a5c2a] hover:shadow-md transition-all relative overflow-hidden"
                >
                  <span
                    className="absolute top-3 right-8 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: "#1a5c2a" }}
                  >
                    ai
                  </span>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "#fdf4ff" }}>
                    <Video size={16} style={{ color: "#a21caf" }} />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wide text-gray-900 leading-none">
                    Set Piece Lab
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-1 leading-snug">Upload clips · Gemini Vision</p>
                  <ChevronRight size={12} className="absolute bottom-4 right-4 text-gray-300 group-hover:text-[#1a5c2a] transition-colors" />
                </Link>

                <Link
                  href={`/coach/training-plans/new?role=${roleId}`}
                  className="group rounded-2xl border border-gray-200 bg-white p-4 hover:border-[#1a5c2a] hover:shadow-md transition-all relative overflow-hidden"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "#fef3c7" }}>
                    <Plus size={16} style={{ color: "#d97706" }} />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wide text-gray-900 leading-none">
                    New Plan
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-1 leading-snug">Create training plan</p>
                  <ChevronRight size={12} className="absolute bottom-4 right-4 text-gray-300 group-hover:text-[#1a5c2a] transition-colors" />
                </Link>

                <Link
                  href="/coach/tactics/simulator"
                  className="group rounded-2xl border border-gray-200 bg-white p-4 hover:border-[#1a5c2a] hover:shadow-md transition-all relative overflow-hidden"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "#fce7f3" }}>
                    <Swords size={16} style={{ color: "#be185d" }} />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wide text-gray-900 leading-none">
                    Simulator
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-1 leading-snug">Tactics simulator</p>
                  <ChevronRight size={12} className="absolute bottom-4 right-4 text-gray-300 group-hover:text-[#1a5c2a] transition-colors" />
                </Link>

                <Link
                  href="/coach/live-match"
                  className="group rounded-2xl border border-gray-200 bg-white p-4 hover:border-[#1a5c2a] hover:shadow-md transition-all relative overflow-hidden"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "#fee2e2" }}>
                    <Activity size={16} style={{ color: "#dc2626" }} />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wide text-gray-900 leading-none">
                    Live Match
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-1 leading-snug">Real-time match hub</p>
                  <ChevronRight size={12} className="absolute bottom-4 right-4 text-gray-300 group-hover:text-[#1a5c2a] transition-colors" />
                </Link>
              </div>
            </div>

            {/* Focus drill shortcuts */}
            {role.focusCategories.length > 0 && (
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400 mb-3 flex items-center gap-2">
                  <span className="inline-block w-4 h-px bg-gray-300" />
                  Focus Areas
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {role.focusCategories.map((cat) => (
                    <Link
                      key={cat}
                      href={`/coach/drills?category=${cat}&dept=${roleId}`}
                      className="group rounded-xl border border-gray-200 bg-white p-3 hover:border-[#1a5c2a] hover:shadow-sm transition-all flex items-center gap-3"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "#f0fdf4" }}
                      >
                        <Target size={14} style={{ color: "#16a34a" }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-gray-900 capitalize leading-tight truncate">
                          {cat.replace(/_/g, " ")}
                        </p>
                        <p className="text-[11px] text-gray-400">View drills</p>
                      </div>
                      <ChevronRight size={12} className="ml-auto text-gray-300 group-hover:text-[#1a5c2a] shrink-0 transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STAFF TAB ─────────────────────────────────────────────────────── */}
        {activeTab === "staff" && (
          <div>
            {!editing && staff ? (
              // Assigned card
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className={`h-1.5 w-full bg-gradient-to-r ${role.gradient}`} />
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-5">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.gradient} flex items-center justify-center text-white text-xl font-black shrink-0`}
                    >
                      {staff.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 leading-tight">{staff.name}</h3>
                      <p className="text-[13px] font-medium mt-0.5" style={{ color: "#1a5c2a" }}>{role.title}</p>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full shrink-0">
                      <UserCheck size={9} />
                      Assigned
                    </span>
                  </div>

                  <div className="space-y-2 mb-5">
                    {staff.phone && (
                      <div className="flex items-center gap-2 text-[13px] text-gray-600">
                        <Phone size={14} className="text-gray-400 shrink-0" />
                        <span>{staff.phone}</span>
                      </div>
                    )}
                    {staff.email && (
                      <div className="flex items-center gap-2 text-[13px] text-gray-600">
                        <Mail size={14} className="text-gray-400 shrink-0" />
                        <span className="truncate">{staff.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={openAddStaff}
                      className="flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>
                    <button
                      onClick={removeStaff}
                      className="flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-full border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : !editing ? (
              // Vacant state
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: "#f0fdf4" }}
                >
                  <UserPlus size={22} style={{ color: "#1a5c2a" }} />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">No Staff Assigned</h3>
                <p className="text-gray-400 text-[13px] mb-5">
                  Assign a staff member to the {role.title} desk.
                </p>
                <button
                  onClick={openAddStaff}
                  className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full text-white transition-colors"
                  style={{ backgroundColor: "#1a5c2a" }}
                >
                  <UserPlus size={14} />
                  Assign Staff Member
                </button>
              </div>
            ) : (
              // Edit form
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-gray-900">
                    {staff ? "Edit Staff Member" : "Assign Staff Member"}
                  </h3>
                  <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[12px] font-semibold text-gray-600 block mb-1">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={staffForm.name}
                      onChange={(e) => setStaffForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Tafadzwa Moyo"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1a5c2a] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-gray-600 block mb-1">Phone</label>
                    <input
                      type="tel"
                      value={staffForm.phone}
                      onChange={(e) => setStaffForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="e.g. +263 77 123 4567"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1a5c2a] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-gray-600 block mb-1">Email</label>
                    <input
                      type="email"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="e.g. moyo@club.co.zw"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1a5c2a] transition-colors"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-5">
                  <button
                    onClick={saveStaff}
                    disabled={!staffForm.name.trim()}
                    className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-full text-white transition-colors disabled:opacity-40"
                    style={{ backgroundColor: "#1a5c2a" }}
                  >
                    <UserCheck size={14} />
                    {staff ? "Save Changes" : "Assign"}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2.5 rounded-full border border-gray-200 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Role info below form */}
            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">Responsibilities</p>
              <div className="flex flex-wrap gap-1.5">
                {role.focusCategories.map((cat) => (
                  <span
                    key={cat}
                    className="text-[12px] font-medium px-2.5 py-1 rounded-full border border-gray-200 text-gray-700 bg-gray-50"
                  >
                    {cat.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── DRILLS TAB ───────────────────────────────────────────────────── */}
        {activeTab === "drills" && (
          <div>
            {drills.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                <Dumbbell size={36} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-semibold mb-1">No drills in this department</p>
                <Link
                  href="/coach/drills"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full text-white"
                  style={{ backgroundColor: "#1a5c2a" }}
                >
                  Browse All Drills
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[12px] text-gray-500">{drills.length} drills in this department</p>
                  <Link
                    href={`/coach/drills?dept=${roleId}`}
                    className="text-[12px] font-semibold flex items-center gap-1"
                    style={{ color: "#1a5c2a" }}
                  >
                    Full Library <ChevronRight size={12} />
                  </Link>
                </div>
                {drills.map((drill) => (
                  <DrillCard key={drill.id} drill={drill} roleId={roleId} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PLANS TAB ────────────────────────────────────────────────────── */}
        {activeTab === "plans" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen size={16} className="text-gray-400" />
                Training Plans
                {plans.length > 0 && (
                  <span className="text-[12px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                    {plans.length}
                  </span>
                )}
              </h2>
              <Link
                href={`/coach/training-plans/new?role=${roleId}`}
                className="text-[12px] font-semibold flex items-center gap-1 px-3 py-1.5 rounded-full text-white"
                style={{ backgroundColor: "#1a5c2a" }}
              >
                <Plus size={12} />
                New
              </Link>
            </div>

            {plansLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : plans.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                <BookOpen size={36} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium mb-1">No training plans yet</p>
                <p className="text-gray-400 text-[13px] mb-5">
                  Create your first plan for the {role.title} desk.
                </p>
                <Link
                  href={`/coach/training-plans/new?role=${roleId}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full text-white transition-colors"
                  style={{ backgroundColor: "#1a5c2a" }}
                >
                  <Plus size={14} />
                  Create First Plan
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {plans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    token={token}
                    onDelete={(id) => setPlans((prev) => prev.filter((p) => p.id !== id))}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── NOTES TAB ────────────────────────────────────────────────────── */}
        {activeTab === "notes" && (
          <div>
            {/* Add note */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 mb-4">
              <p className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">
                Briefing Note
              </p>
              <textarea
                ref={noteRef}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addNote();
                }}
                placeholder="Add a briefing note for this department… (Ctrl+Enter to submit)"
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1a5c2a] transition-colors resize-none"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={addNote}
                  disabled={!noteInput.trim()}
                  className="flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-full text-white transition-colors disabled:opacity-40"
                  style={{ backgroundColor: "#1a5c2a" }}
                >
                  <Send size={13} />
                  Add Note
                </button>
              </div>
            </div>

            {/* Notes list */}
            {notes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
                <StickyNote size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No notes yet</p>
                <p className="text-gray-400 text-[13px] mt-1">
                  Add briefing notes, reminders, or tactical instructions for this desk.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 flex gap-3 group"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: "#f0fdf4" }}
                    >
                      <StickyNote size={14} style={{ color: "#1a5c2a" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] text-gray-800 leading-relaxed whitespace-pre-wrap">{note.text}</p>
                      <p className="text-[11px] text-gray-400 mt-1.5">
                        {new Date(note.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="text-gray-200 hover:text-red-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                      aria-label="Delete note"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

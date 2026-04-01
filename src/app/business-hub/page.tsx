"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  BarChart3, Calendar, DollarSign, Search, BookOpen,
  Users, Trophy, GraduationCap, Building2, Handshake,
  CheckCircle, ArrowRight, Star, TrendingUp, FileText,
  PiggyBank, Target, Lightbulb, ChevronDown, ChevronUp,
  Trash2, Plus, Loader2, AlertCircle, Camera, X, Pencil, Check, Share2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "budget" | "sponsors" | "tracker" | "events" | "skills" | "members";

interface BudgetItem {
  id: string;
  category: string;
  label: string | null;
  budgeted: number;
  spent: number;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  date: string;
}

interface BusinessEvent {
  id: string;
  name: string;
  date_range: string | null;
  sport: string;
  teams: number;
  status: "Draft" | "Planning" | "Open" | "Completed";
  icon: string;
  checklist_done: number[];
  is_fundraiser?: boolean;
  fundraiser_purpose?: string | null;
  fundraiser_goal?: number;
  fundraiser_raised?: number;
}

interface Member {
  id: string;
  name: string;
  role: "Player" | "Coach" | "Staff" | "Parent" | "Other";
  subscription_amount: number;
  status: "paid" | "unpaid" | "partial";
  due_date: string | null;
  paid_date: string | null;
  notes: string | null;
}

interface MemberSummary {
  total: number;
  paid: number;
  unpaid: number;
  partial: number;
  collected: number;
  outstanding: number;
}

interface ScannedItem {
  description: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  selected: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const USER_TYPES = [
  { key: "club-admin", icon: <Trophy className="h-6 w-6" />, title: "Club Administrator", description: "Manage your club's finances, sponsorships, and events in one place.", color: "from-green-600 to-emerald-500", features: ["Budget tracking", "Sponsor management", "Player registration", "Event planning"] },
  { key: "event-organiser", icon: <Calendar className="h-6 w-6" />, title: "Event Organiser", description: "Plan and manage tournaments, leagues, and sports gala events.", color: "from-amber-600 to-yellow-500", features: ["Event scheduling", "Registration management", "Budget forecasting", "Venue coordination"] },
  { key: "school-coordinator", icon: <GraduationCap className="h-6 w-6" />, title: "School Sports Coordinator", description: "Coordinate inter-school competitions and manage school sports programmes.", color: "from-blue-600 to-sky-500", features: ["Team management", "Competition scheduling", "Budget reporting", "Parent communications"] },
  { key: "league-manager", icon: <Users className="h-6 w-6" />, title: "League Manager", description: "Run provincial or national leagues with complete financial oversight.", color: "from-purple-600 to-violet-500", features: ["League administration", "Financial tracking", "Sponsor ROI reports", "Standings management"] },
  { key: "sponsor", icon: <Handshake className="h-6 w-6" />, title: "Sponsor / Company", description: "Find sports teams and events to sponsor across Zimbabwe.", color: "from-orange-600 to-red-500", features: ["Sponsorship discovery", "ROI tracking", "Brand exposure reports", "Direct team contact"] },
];

const TABS = [
  { key: "budget" as Tab, label: "Budget Planner", icon: <PiggyBank className="h-4 w-4" /> },
  { key: "sponsors" as Tab, label: "Sponsor Finder", icon: <Search className="h-4 w-4" /> },
  { key: "tracker" as Tab, label: "Financial Tracker", icon: <BarChart3 className="h-4 w-4" /> },
  { key: "events" as Tab, label: "Event Planner", icon: <Calendar className="h-4 w-4" /> },
  { key: "members" as Tab, label: "Members", icon: <Users className="h-4 w-4" /> },
  { key: "skills" as Tab, label: "Business Skills", icon: <BookOpen className="h-4 w-4" /> },
];

const CHECKLIST = [
  "Book venue", "Set registration deadline", "Assign referees", "Arrange transport",
  "Confirm sponsors", "Print banners/programmes", "Medical team on standby", "Post on Grassroots Sport app",
];

// ─── Shared ───────────────────────────────────────────────────────────────────

function LoadingSpinner() {
  return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-green-400" /></div>;
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      <AlertCircle className="h-4 w-4 shrink-0" /> {message}
    </div>
  );
}

function GuestBanner() {
  return (
    <div className="mb-5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-amber-300">You&apos;re viewing demo data</p>
          <p className="mt-0.5 text-xs text-amber-300/70">
            Register free to save your real budgets, sponsors, events and members.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href="/register"
            className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:bg-amber-400 transition-colors"
          >
            Register free
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-amber-500/40 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/10 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Receipt Scanner Modal ────────────────────────────────────────────────────

function ReceiptScanner({ onConfirm, onClose }: {
  onConfirm: (items: ScannedItem[]) => void;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [preview, setPreview] = useState<string>("");

  const scan = async (file: File) => {
    setScanning(true);
    setError("");
    setItems([]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
      const base64 = dataUrl.split(",")[1];
      const mediaType = file.type as "image/jpeg" | "image/png" | "image/webp";

      try {
        const res = await fetch("/api/business/scan-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, mediaType }),
        });
        const data = await res.json() as { items?: ScannedItem[]; error?: string };
        if (data.error) { setError(data.error); setScanning(false); return; }
        if (!data.items?.length) { setError("No financial items found in this image. Try a clearer photo."); setScanning(false); return; }
        setItems(data.items.map((i) => ({ ...i, selected: true })));
      } catch {
        setError("Scan failed. Please try again.");
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggle = (i: number) => setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, selected: !item.selected } : item));

  const confirmed = items.filter((i) => i.selected);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a3d10] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-black text-white text-lg">Scan Receipt / Budget Sheet</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-white/50 hover:text-white" /></button>
        </div>

        {!items.length && !scanning && (
          <div>
            <p className="mb-4 text-sm text-green-300/70">Take a photo or upload an image of a receipt, invoice, or handwritten budget. AI will extract the numbers automatically.</p>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { if (e.target.files?.[0]) scan(e.target.files[0]); }} />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-2 rounded-xl border border-white/20 bg-white/5 p-5 hover:bg-white/10 transition-colors">
                <Camera className="h-8 w-8 text-amber-400" />
                <span className="text-sm font-semibold text-white">Take Photo</span>
                <span className="text-xs text-green-400/50">Use camera</span>
              </button>
              <button
                onClick={() => { if (fileRef.current) { fileRef.current.removeAttribute("capture"); fileRef.current.click(); } }}
                className="flex flex-col items-center gap-2 rounded-xl border border-white/20 bg-white/5 p-5 hover:bg-white/10 transition-colors"
              >
                <FileText className="h-8 w-8 text-green-400" />
                <span className="text-sm font-semibold text-white">Upload Image</span>
                <span className="text-xs text-green-400/50">From gallery</span>
              </button>
            </div>
            {error && <div className="mt-3"><ErrorBanner message={error} /></div>}
          </div>
        )}

        {scanning && (
          <div className="flex flex-col items-center gap-3 py-8">
            {preview && <Image src={preview} alt="Receipt" width={128} height={128} unoptimized className="h-32 w-auto rounded-lg object-cover opacity-60" />}
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
            <p className="text-sm text-green-300">AI is reading your document...</p>
          </div>
        )}

        {items.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-green-300/70">Found <span className="font-bold text-white">{items.length}</span> item{items.length !== 1 ? "s" : ""}. Tick the ones to import:</p>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {items.map((item, i) => (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${item.selected ? "border-green-500/40 bg-green-500/10" : "border-white/10 bg-white/5 opacity-50"}`}
                >
                  <div>
                    <p className="text-sm font-medium text-white">{item.description}</p>
                    <p className="text-xs text-green-400/50">{item.date} · {item.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${item.type === "income" ? "text-green-400" : "text-red-400"}`}>
                      {item.type === "income" ? "+" : "-"}${item.amount}
                    </span>
                    <CheckCircle className={`h-4 w-4 ${item.selected ? "text-green-400" : "text-white/20"}`} />
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => onConfirm(items.filter((i) => i.selected))}
                disabled={!confirmed.length}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-40 transition-colors"
              >
                <Plus className="h-4 w-4" /> Add {confirmed.length} item{confirmed.length !== 1 ? "s" : ""}
              </button>
              <button onClick={onClose} className="rounded-xl border border-white/20 px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Budget Planner ───────────────────────────────────────────────────────────

const DEMO_BUDGET: BudgetItem[] = [
  { id: "d1", category: "Equipment", label: "Balls, bibs, cones", budgeted: 500, spent: 320 },
  { id: "d2", category: "Transport", label: "Away match travel", budgeted: 300, spent: 180 },
  { id: "d3", category: "Venue hire", label: "Training ground", budgeted: 200, spent: 200 },
  { id: "d4", category: "Referee fees", label: "Home matches", budgeted: 150, spent: 90 },
  { id: "d5", category: "Medical", label: "First aid supplies", budgeted: 100, spent: 45 },
];

function BudgetPlanner({ isGuest }: { isGuest: boolean }) {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(!isGuest);
  const [error, setError] = useState("");
  const [newCat, setNewCat] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [saving, setSaving] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBudgeted, setEditBudgeted] = useState("");
  const [editSpent, setEditSpent] = useState("");

  const load = useCallback(async () => {
    if (isGuest) { setItems(DEMO_BUDGET); return; }
    try {
      setLoading(true);
      const res = await api.get<{ data: BudgetItem[] }>("/business/budget");
      setItems(res.data.data.length ? res.data.data : DEMO_BUDGET);
    } catch { setError("Could not load budget items."); setItems(DEMO_BUDGET); }
    finally { setLoading(false); }
  }, [isGuest]);

  useEffect(() => { load(); }, [load]);

  const addItem = async () => {
    if (!newCat.trim() || !newBudget) return;
    if (isGuest) {
      setItems((prev) => [...prev, { id: Date.now().toString(), category: newCat.trim(), label: "New item", budgeted: Number(newBudget), spent: 0 }]);
      setNewCat(""); setNewBudget(""); return;
    }
    try {
      setSaving(true);
      const res = await api.post<{ data: BudgetItem }>("/business/budget", { category: newCat.trim(), budgeted: Number(newBudget), label: "New item" });
      setItems((prev) => [...prev, res.data.data]);
      setNewCat(""); setNewBudget("");
    } catch { setError("Could not add item."); }
    finally { setSaving(false); }
  };

  const deleteItem = async (id: string) => {
    if (isGuest) { setItems((prev) => prev.filter((i) => i.id !== id)); return; }
    try { await api.delete(`/business/budget/${id}`); setItems((prev) => prev.filter((i) => i.id !== id)); }
    catch { setError("Could not delete item."); }
  };

  const startEdit = (item: BudgetItem) => { setEditingId(item.id); setEditBudgeted(String(item.budgeted)); setEditSpent(String(item.spent)); };

  const saveEdit = async (id: string) => {
    const updated = items.map((i) => i.id === id ? { ...i, budgeted: Number(editBudgeted) || 0, spent: Number(editSpent) || 0 } : i);
    setItems(updated);
    setEditingId(null);
    if (!isGuest) {
      try { await api.patch(`/business/budget/${id}`, { budgeted: Number(editBudgeted) || 0, spent: Number(editSpent) || 0 }); }
      catch { setError("Could not save changes."); load(); }
    }
  };

  const handleScannedBudget = async (scanned: ScannedItem[]) => {
    setShowScanner(false);
    for (const s of scanned) {
      if (isGuest) {
        setItems((prev) => [...prev, { id: Date.now().toString() + Math.random(), category: s.description, label: "Scanned", budgeted: s.amount, spent: s.type === "expense" ? s.amount : 0 }]);
      } else {
        try {
          const res = await api.post<{ data: BudgetItem }>("/business/budget", { category: s.description, budgeted: s.amount, spent: s.type === "expense" ? s.amount : 0, label: "Scanned" });
          setItems((prev) => [...prev, res.data.data]);
        } catch { setError("Could not save scanned item."); }
      }
    }
  };

  const totalBudgeted = items.reduce((s, i) => s + i.budgeted, 0);
  const totalSpent = items.reduce((s, i) => s + i.spent, 0);
  const remaining = totalBudgeted - totalSpent;
  const pct = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {showScanner && <ReceiptScanner onConfirm={handleScannedBudget} onClose={() => setShowScanner(false)} />}
      {isGuest && <GuestBanner />}
      {error && <ErrorBanner message={error} />}

      <div className="grid grid-cols-3 gap-4">
        {[{ label: "Total Budget", value: `$${totalBudgeted}`, color: "text-green-400" }, { label: "Spent", value: `$${totalSpent}`, color: "text-amber-400" }, { label: "Remaining", value: `$${remaining}`, color: remaining >= 0 ? "text-emerald-400" : "text-red-400" }].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-xs text-green-400/60">{s.label}</p>
            <p className={`mt-1 text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs text-green-300/70"><span>Budget used</span><span>{pct}%</span></div>
        <div className="h-2 w-full rounded-full bg-white/10">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, background: pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#22c55e" }} />
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const itemPct = item.budgeted > 0 ? Math.round((item.spent / item.budgeted) * 100) : 0;
          const isEditing = editingId === item.id;
          return (
            <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-semibold text-white">{item.category}</p><p className="text-xs text-green-400/50">{item.label}</p></div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <div className="flex items-center gap-1 text-xs text-green-300/70">
                        <span>Spent</span>
                        <input type="number" value={editSpent} onChange={(e) => setEditSpent(e.target.value)} className="w-16 rounded border border-white/20 bg-white/10 px-2 py-1 text-white outline-none focus:border-green-400" />
                        <span>/ Budget</span>
                        <input type="number" value={editBudgeted} onChange={(e) => setEditBudgeted(e.target.value)} className="w-16 rounded border border-white/20 bg-white/10 px-2 py-1 text-white outline-none focus:border-green-400" />
                      </div>
                      <button onClick={() => saveEdit(item.id)} className="text-green-400 hover:text-green-300 transition-colors"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setEditingId(null)} className="text-white/30 hover:text-white/60 transition-colors"><X className="h-4 w-4" /></button>
                    </>
                  ) : (
                    <>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">${item.spent} <span className="text-xs font-normal text-green-400/50">/ ${item.budgeted}</span></p>
                        <p className="text-xs text-green-400/50">{itemPct}% used</p>
                      </div>
                      <button onClick={() => startEdit(item)} className="text-green-400/40 hover:text-green-400 transition-colors" title="Edit amounts"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => deleteItem(item.id)} className="text-red-400/50 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-2 h-1 w-full rounded-full bg-white/10">
                <div className="h-full rounded-full" style={{ width: `${Math.min(itemPct, 100)}%`, background: itemPct > 90 ? "#ef4444" : "#22c55e" }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input type="text" placeholder="Category name" value={newCat} onChange={(e) => setNewCat(e.target.value)} className="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-400/40 outline-none focus:border-green-400" />
        <input type="number" placeholder="$" value={newBudget} onChange={(e) => setNewBudget(e.target.value)} className="w-20 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-400/40 outline-none focus:border-green-400" />
        <button onClick={addItem} disabled={saving} className="flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-500 transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Add
        </button>
        <button onClick={() => setShowScanner(true)} title="Scan receipt or paper" className="flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors">
          <Camera className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Sponsor Finder ───────────────────────────────────────────────────────────

const SPONSORS = [
  { name: "NetOne Zimbabwe", sector: "Telecom", budget: "$5,000–$50,000", sports: ["Football", "Rugby", "Netball"], logo: "📡", status: "Open", email: "sponsorships@netone.co.zw" },
  { name: "Econet Wireless", sector: "Telecom", budget: "$10,000–$100,000", sports: ["All sports"], logo: "📶", status: "Open", email: "csr@econet.co.zw" },
  { name: "Delta Beverages", sector: "FMCG", budget: "$2,000–$20,000", sports: ["Football", "Athletics"], logo: "🍺", status: "Open", email: "marketing@delta.co.zw" },
  { name: "CBZ Bank", sector: "Finance", budget: "$5,000–$30,000", sports: ["All sports"], logo: "🏦", status: "Reviewing", email: "info@cbz.co.zw" },
  { name: "OK Zimbabwe", sector: "Retail", budget: "$1,000–$10,000", sports: ["Netball", "Basketball"], logo: "🛒", status: "Open", email: "marketing@okzim.co.zw" },
  { name: "Innscor Africa", sector: "Food", budget: "$3,000–$25,000", sports: ["Youth sports"], logo: "🍗", status: "Open", email: "communications@innscor.com" },
];

function SponsorFinder() {
  const user = useAuthStore((s) => s.user);
  const [filter, setFilter] = useState("");
  const filtered = SPONSORS.filter((s) => !filter || s.sector.toLowerCase().includes(filter.toLowerCase()) || s.name.toLowerCase().includes(filter.toLowerCase()) || s.sports.some((sp) => sp.toLowerCase().includes(filter.toLowerCase())));

  const sendProposal = (sponsor: typeof SPONSORS[0]) => {
    const subject = encodeURIComponent(`Sports Sponsorship Proposal — Grassroots Sport Zimbabwe`);
    const body = encodeURIComponent(
`Dear ${sponsor.name} Sponsorship Team,

My name is ${user?.name ?? "[ Your Name ]"} and I represent a sports club registered on the Grassroots Sport platform (grassrootssports.live) — Zimbabwe's AI-powered sports management platform.

We are seeking a sponsorship partner in the ${sponsor.budget} range for our upcoming season. Your company's support of ${sponsor.sports.join(", ")} aligns directly with our programme.

We would love to present a full sponsorship proposal at your convenience.

Please feel free to contact me to arrange a meeting.

Kind regards,
${user?.name ?? "[ Your Name ]"}
Grassroots Sport — grassrootssports.live`
    );
    window.open(`mailto:${sponsor.email}?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5">
        <Search className="h-4 w-4 text-green-400/50 shrink-0" />
        <input type="text" placeholder="Search by company, sector, or sport…" value={filter} onChange={(e) => setFilter(e.target.value)} className="flex-1 bg-transparent text-sm text-white placeholder-green-400/40 outline-none" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((s) => (
          <div key={s.name} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{s.logo}</span>
                <div><p className="font-bold text-white text-sm">{s.name}</p><p className="text-xs text-green-400/60">{s.sector}</p></div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.status === "Open" ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}`}>{s.status}</span>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-xs text-green-300/70"><DollarSign className="inline h-3 w-3" /> {s.budget}</p>
              <p className="text-xs text-green-300/70">{s.sports.map((sp) => <span key={sp} className="mr-1 rounded-full bg-white/10 px-2 py-0.5">{sp}</span>)}</p>
            </div>
            <button
              onClick={() => sendProposal(s)}
              disabled={s.status !== "Open"}
              className="mt-3 w-full rounded-lg border border-green-500/40 py-1.5 text-xs font-semibold text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {s.status === "Open" ? "Send proposal →" : "Currently not accepting"}
            </button>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-green-400/40">Clicking &quot;Send proposal&quot; opens your email app with a pre-filled sponsorship letter</p>
    </div>
  );
}

// ─── Financial Tracker ────────────────────────────────────────────────────────

const DEMO_TRANSACTIONS: Transaction[] = [
  { id: "d1", date: "2026-03-18", description: "Sponsorship — NetOne", amount: 2000, type: "income" },
  { id: "d2", date: "2026-03-16", description: "Equipment purchase", amount: -320, type: "expense" },
  { id: "d3", date: "2026-03-14", description: "Match day gate fees", amount: 450, type: "income" },
  { id: "d4", date: "2026-03-12", description: "Transport — away match", amount: -180, type: "expense" },
  { id: "d5", date: "2026-03-10", description: "Registration fees (players)", amount: 600, type: "income" },
  { id: "d6", date: "2026-03-08", description: "Venue hire", amount: -200, type: "expense" },
];

function FinancialTracker({ isGuest }: { isGuest: boolean }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(!isGuest);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [form, setForm] = useState({ description: "", amount: "", type: "income" as "income" | "expense", date: new Date().toISOString().slice(0, 10) });

  const load = useCallback(async () => {
    if (isGuest) { setTransactions(DEMO_TRANSACTIONS); return; }
    try {
      setLoading(true);
      const res = await api.get<{ data: Transaction[] }>("/business/transactions");
      setTransactions(res.data.data.length ? res.data.data : DEMO_TRANSACTIONS);
    } catch { setError("Could not load transactions."); setTransactions(DEMO_TRANSACTIONS); }
    finally { setLoading(false); }
  }, [isGuest]);

  useEffect(() => { load(); }, [load]);

  const addTransaction = async () => {
    if (!form.description.trim() || !form.amount) return;
    if (isGuest) {
      const amount = form.type === "expense" ? -Math.abs(Number(form.amount)) : Math.abs(Number(form.amount));
      setTransactions((prev) => [{ id: Date.now().toString(), ...form, amount }, ...prev]);
      setShowForm(false); return;
    }
    try {
      setSaving(true);
      const res = await api.post<{ data: Transaction }>("/business/transactions", { description: form.description, amount: Number(form.amount), type: form.type, date: form.date });
      setTransactions((prev) => [res.data.data, ...prev]);
      setShowForm(false);
      setForm({ description: "", amount: "", type: "income", date: new Date().toISOString().slice(0, 10) });
    } catch { setError("Could not add transaction."); }
    finally { setSaving(false); }
  };

  const deleteTransaction = async (id: string) => {
    if (isGuest) { setTransactions((prev) => prev.filter((t) => t.id !== id)); return; }
    try { await api.delete(`/business/transactions/${id}`); setTransactions((prev) => prev.filter((t) => t.id !== id)); }
    catch { setError("Could not delete transaction."); }
  };

  const handleScanned = async (scanned: ScannedItem[]) => {
    setShowScanner(false);
    for (const s of scanned) {
      if (isGuest) {
        const amount = s.type === "expense" ? -Math.abs(s.amount) : Math.abs(s.amount);
        setTransactions((prev) => [{ id: Date.now().toString() + Math.random(), description: s.description, amount, type: s.type, date: s.date }, ...prev]);
      } else {
        try {
          const res = await api.post<{ data: Transaction }>("/business/transactions", { description: s.description, amount: s.amount, type: s.type, date: s.date });
          setTransactions((prev) => [res.data.data, ...prev]);
        } catch { setError("Could not save scanned transaction."); }
      }
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Math.abs(t.amount), 0);
    const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);
    const net = income - expense;

    // Header
    doc.setFillColor(0, 100, 0);
    doc.rect(0, 0, 210, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Grassroots Sport", 14, 14);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Financial Report", 14, 22);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-ZW", { day: "numeric", month: "long", year: "numeric" })}`, 14, 30);

    // Summary boxes
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("SUMMARY", 14, 46);
    autoTable(doc, {
      startY: 50,
      head: [["Total Income", "Total Expenses", "Net Balance"]],
      body: [[`$${income.toFixed(2)}`, `$${expense.toFixed(2)}`, `$${net.toFixed(2)}`]],
      headStyles: { fillColor: [0, 100, 0], textColor: 255 },
      bodyStyles: { fontSize: 11, fontStyle: "bold" },
    });

    // Transaction table
    const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    doc.setFont("helvetica", "bold");
    doc.text("TRANSACTIONS", 14, finalY);
    autoTable(doc, {
      startY: finalY + 4,
      head: [["Date", "Description", "Type", "Amount"]],
      body: transactions.map((t) => [
        new Date(t.date).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" }),
        t.description,
        t.type.charAt(0).toUpperCase() + t.type.slice(1),
        `${t.type === "income" ? "+" : "-"}$${Math.abs(t.amount).toFixed(2)}`,
      ]),
      headStyles: { fillColor: [0, 100, 0], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 255, 240] },
      columnStyles: { 3: { halign: "right" } },
    });

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("grassrootssports.live  |  Zimbabwe's Sports Management Platform", 14, pageHeight - 10);

    doc.save(`grassroots-financial-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Math.abs(t.amount), 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);
  const net = income - expense;
  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-ZW", { day: "numeric", month: "short" });

  // Build monthly chart data from transactions
  const monthlyMap: Record<string, { month: string; income: number; expense: number }> = {};
  transactions.forEach((t) => {
    const key = t.date.slice(0, 7); // "YYYY-MM"
    const label = new Date(t.date + "T00:00:00").toLocaleDateString("en-ZW", { month: "short", year: "2-digit" });
    if (!monthlyMap[key]) monthlyMap[key] = { month: label, income: 0, expense: 0 };
    if (t.type === "income") monthlyMap[key].income += Math.abs(t.amount);
    else monthlyMap[key].expense += Math.abs(t.amount);
  });
  const chartData = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      {showScanner && <ReceiptScanner onConfirm={handleScanned} onClose={() => setShowScanner(false)} />}
      {isGuest && <GuestBanner />}
      {error && <ErrorBanner message={error} />}

      <div className="grid grid-cols-3 gap-4">
        {[{ label: "Income", value: `$${income}`, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" }, { label: "Expenses", value: `$${expense}`, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" }, { label: "Net", value: `$${net}`, color: net >= 0 ? "text-emerald-400" : "text-red-400", bg: "bg-white/5 border-white/10" }].map((s) => (
          <div key={s.label} className={`rounded-xl border ${s.bg} p-4 text-center`}>
            <p className="text-xs text-green-400/60">{s.label}</p>
            <p className={`mt-1 text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {chartData.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="mb-3 text-xs font-semibold text-green-300">Income vs Expenses by Month</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barCategoryGap="30%">
              <XAxis dataKey="month" tick={{ fill: "#86efac", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#86efac", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: "#0a3d10", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#86efac" }}
                formatter={(value, name) => [`$${value ?? 0}`, name === "income" ? "Income" : "Expenses"]}
              />
              <Bar dataKey="income" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill="#22c55e" />)}
              </Bar>
              <Bar dataKey="expense" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill="#ef4444" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center gap-4 justify-center text-xs text-green-300/60">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-green-500 inline-block" /> Income</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-500 inline-block" /> Expenses</span>
          </div>
        </div>
      )}

      {showForm && (
        <div className="rounded-xl border border-white/20 bg-white/5 p-4 space-y-3">
          <p className="text-xs font-semibold text-green-300">Add transaction</p>
          <input type="text" placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-400/40 outline-none focus:border-green-400" />
          <div className="flex gap-2">
            <input type="number" placeholder="Amount ($)" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-400/40 outline-none focus:border-green-400" />
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "income" | "expense" }))} className="rounded-lg border border-white/20 bg-[#0a3d10] px-3 py-2 text-sm text-white outline-none focus:border-green-400">
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-green-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={addTransaction} disabled={saving} className="flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null} Save
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {transactions.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <div><p className="text-sm font-medium text-white">{t.description}</p><p className="text-xs text-green-400/50">{formatDate(t.date)}</p></div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-bold ${t.type === "income" ? "text-green-400" : "text-red-400"}`}>{t.type === "income" ? "+" : "-"}${Math.abs(t.amount)}</span>
              <button onClick={() => deleteTransaction(t.id)} className="text-red-400/40 hover:text-red-400 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={() => setShowForm(true)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 py-2.5 text-sm font-semibold text-green-300 hover:bg-white/5 transition-colors">
          <Plus className="h-4 w-4" /> Add transaction
        </button>
        <button onClick={() => setShowScanner(true)} title="Scan receipt" className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors">
          <Camera className="h-4 w-4" /> Scan receipt
        </button>
        <button onClick={exportPDF} className="flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-green-300 hover:bg-white/5 transition-colors">
          <FileText className="h-4 w-4" /> Export PDF
        </button>
      </div>
    </div>
  );
}

// ─── Event Planner ────────────────────────────────────────────────────────────

const DEMO_EVENTS: BusinessEvent[] = [
  { id: "d1", name: "April Holiday Sports Gala 2026", date_range: "Apr 14–18, 2026", sport: "Multi-sport", teams: 24, status: "Planning", icon: "🏅", checklist_done: [0, 1, 4] },
  { id: "d2", name: "Inter-schools Football Cup", date_range: "May 3, 2026", sport: "Football", teams: 16, status: "Open", icon: "⚽", checklist_done: [0, 1, 2, 3, 4] },
  { id: "d3", name: "Netball Provincial Championships", date_range: "Jun 7–8, 2026", sport: "Netball", teams: 12, status: "Draft", icon: "🏐", checklist_done: [] },
];

function EventPlanner({ isGuest }: { isGuest: boolean }) {
  const [events, setEvents] = useState<BusinessEvent[]>([]);
  const [loading, setLoading] = useState(!isGuest);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", date_range: "", sport: "Multi-sport", teams: "", icon: "🏅", is_fundraiser: false, fundraiser_purpose: "", fundraiser_goal: "" });

  const load = useCallback(async () => {
    if (isGuest) { setEvents(DEMO_EVENTS); return; }
    try {
      setLoading(true);
      const res = await api.get<{ data: BusinessEvent[] }>("/business/events");
      setEvents(res.data.data.length ? res.data.data : DEMO_EVENTS);
    } catch { setError("Could not load events."); setEvents(DEMO_EVENTS); }
    finally { setLoading(false); }
  }, [isGuest]);

  useEffect(() => { load(); }, [load]);

  const toggleChecklist = async (eventId: string, idx: number) => {
    const ev = events.find((e) => e.id === eventId);
    if (!ev) return;
    const done = ev.checklist_done.includes(idx) ? ev.checklist_done.filter((i) => i !== idx) : [...ev.checklist_done, idx];
    setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, checklist_done: done } : e));
    if (!isGuest) {
      try { await api.patch(`/business/events/${eventId}`, { checklist_done: done }); }
      catch { setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, checklist_done: ev.checklist_done } : e)); }
    }
  };

  const createEvent = async () => {
    if (!form.name.trim()) return;
    if (isGuest) {
      setEvents((prev) => [...prev, { id: Date.now().toString(), ...form, teams: Number(form.teams) || 0, is_fundraiser: form.is_fundraiser, fundraiser_purpose: form.fundraiser_purpose || null, fundraiser_goal: Number(form.fundraiser_goal) || 0, fundraiser_raised: 0, status: "Planning", checklist_done: [] }]);
      setShowForm(false); return;
    }
    try {
      setSaving(true);
      const res = await api.post<{ data: BusinessEvent }>("/business/events", {
        ...form,
        teams:              Number(form.teams) || 0,
        is_fundraiser:      form.is_fundraiser,
        fundraiser_purpose: form.fundraiser_purpose || undefined,
        fundraiser_goal:    Number(form.fundraiser_goal) || undefined,
      });
      setEvents((prev) => [...prev, res.data.data]);
      setShowForm(false);
      setForm({ name: "", date_range: "", sport: "Multi-sport", teams: "", icon: "🏅", is_fundraiser: false, fundraiser_purpose: "", fundraiser_goal: "" });
    } catch { setError("Could not create event."); }
    finally { setSaving(false); }
  };

  const deleteEvent = async (id: string) => {
    if (isGuest) { setEvents((prev) => prev.filter((e) => e.id !== id)); return; }
    try { await api.delete(`/business/events/${id}`); setEvents((prev) => prev.filter((e) => e.id !== id)); if (expanded === id) setExpanded(null); }
    catch { setError("Could not delete event."); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      {isGuest && <GuestBanner />}
      {error && <ErrorBanner message={error} />}
      {events.map((ev) => (
        <div key={ev.id} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="flex w-full items-center justify-between p-4">
            <button onClick={() => setExpanded(expanded === ev.id ? null : ev.id)} className="flex flex-1 items-center gap-3 text-left">
              <span className="text-2xl">{ev.icon}</span>
              <div><p className="font-bold text-white text-sm">{ev.name}</p><p className="text-xs text-green-400/60">{ev.date_range} · {ev.sport} · {ev.teams} teams</p></div>
            </button>
            <div className="flex items-center gap-2">
              {ev.is_fundraiser && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400">🎗 Fundraiser</span>}
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ev.status === "Open" ? "bg-green-500/20 text-green-400" : ev.status === "Planning" ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-white/50"}`}>{ev.status}</span>
              <button onClick={() => deleteEvent(ev.id)} className="text-red-400/40 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
              {expanded === ev.id ? <ChevronUp className="h-4 w-4 text-green-400" /> : <ChevronDown className="h-4 w-4 text-green-400" />}
            </div>
          </div>
          {expanded === ev.id && (
            <div className="border-t border-white/10 px-4 pb-4 pt-3">
              <p className="mb-3 text-xs font-semibold text-green-300">Event checklist</p>
              <div className="grid grid-cols-2 gap-2">
                {CHECKLIST.map((item, j) => (
                  <button key={j} onClick={() => toggleChecklist(ev.id, j)} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs text-left transition-all ${ev.checklist_done.includes(j) ? "border-green-500/30 bg-green-500/10 text-green-300" : "border-white/10 bg-white/5 text-white/60"}`}>
                    <CheckCircle className={`h-3.5 w-3.5 shrink-0 ${ev.checklist_done.includes(j) ? "text-green-400" : "text-white/20"}`} />
                    {item}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-green-400/50">{ev.checklist_done.length}/{CHECKLIST.length} tasks complete</p>
              {ev.is_fundraiser && (
                <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
                  <p className="text-xs font-semibold text-amber-300">
                    {ev.fundraiser_purpose ?? "Match Day Fundraiser"}
                  </p>
                  {(ev.fundraiser_goal ?? 0) > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-white/50">
                        <span>${Number(ev.fundraiser_raised ?? 0).toFixed(2)} raised</span>
                        <span>Goal: ${Number(ev.fundraiser_goal ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400"
                          style={{ width: `${Math.min(100, (ev.fundraiser_goal ?? 0) > 0 ? Math.round((Number(ev.fundraiser_raised ?? 0) / Number(ev.fundraiser_goal)) * 100) : 0)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      const url = `${typeof window !== "undefined" ? window.location.origin : "https://grassrootssports.live"}/match/${ev.id}`;
                      navigator.clipboard.writeText(url).catch(() => {});
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/10 transition-colors"
                  >
                    <Share2 className="h-3 w-3" /> Copy Match Day Link
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      {showForm && (
        <div className="rounded-xl border border-white/20 bg-white/5 p-4 space-y-3">
          <p className="text-xs font-semibold text-green-300">New event</p>
          <input type="text" placeholder="Event name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-400/40 outline-none focus:border-green-400" />
          <div className="grid grid-cols-2 gap-2">
            <input type="text" placeholder="Date range (e.g. Apr 14–18)" value={form.date_range} onChange={(e) => setForm((f) => ({ ...f, date_range: e.target.value }))} className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-400/40 outline-none focus:border-green-400" />
            <input type="text" placeholder="Sport" value={form.sport} onChange={(e) => setForm((f) => ({ ...f, sport: e.target.value }))} className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-400/40 outline-none focus:border-green-400" />
            <input type="number" placeholder="No. of teams" value={form.teams} onChange={(e) => setForm((f) => ({ ...f, teams: e.target.value }))} className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-400/40 outline-none focus:border-green-400" />
            <input type="text" placeholder="Icon emoji" value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-400/40 outline-none focus:border-green-400" />
          </div>
          {/* Fundraiser toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div className={`relative h-5 w-9 rounded-full transition-colors ${form.is_fundraiser ? "bg-amber-500" : "bg-white/20"}`}>
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.is_fundraiser ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
            <input type="checkbox" className="sr-only" checked={form.is_fundraiser} onChange={(e) => setForm((f) => ({ ...f, is_fundraiser: e.target.checked }))} />
            <span className="text-xs text-white/70">This event has a Match Day fundraiser</span>
          </label>
          {form.is_fundraiser && (
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <input type="text" placeholder="Fundraiser purpose (e.g. Buy jerseys)" value={form.fundraiser_purpose} onChange={(e) => setForm((f) => ({ ...f, fundraiser_purpose: e.target.value }))} className="col-span-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-400/40 outline-none focus:border-amber-400" />
              <input type="number" placeholder="Goal amount ($)" value={form.fundraiser_goal} onChange={(e) => setForm((f) => ({ ...f, fundraiser_goal: e.target.value }))} min="0" className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-400/40 outline-none focus:border-amber-400" />
              <p className="flex items-center text-xs text-amber-300/70 pl-1">Parents donate via EcoCash on match day.</p>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={createEvent} disabled={saving} className="flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null} Create event
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors">Cancel</button>
          </div>
        </div>
      )}
      {!showForm && (
        <button onClick={() => setShowForm(true)} className="w-full rounded-xl border border-dashed border-green-500/30 py-3 text-sm font-semibold text-green-400 hover:bg-green-500/5 transition-colors flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> Create new event
        </button>
      )}
    </div>
  );
}

// ─── Members Dashboard ────────────────────────────────────────────────────────

const DEMO_MEMBERS: Member[] = [
  { id: "d1", name: "Tendai Moyo", role: "Player", subscription_amount: 50, status: "paid", due_date: "2026-03-01", paid_date: "2026-03-02", notes: null },
  { id: "d2", name: "Farai Ncube", role: "Player", subscription_amount: 50, status: "unpaid", due_date: "2026-03-01", paid_date: null, notes: null },
  { id: "d3", name: "Coach Dube", role: "Coach", subscription_amount: 0, status: "paid", due_date: null, paid_date: null, notes: null },
  { id: "d4", name: "Tinashe Choto", role: "Player", subscription_amount: 50, status: "partial", due_date: "2026-03-01", paid_date: null, notes: "Paid $25" },
  { id: "d5", name: "Memory Mhaka", role: "Player", subscription_amount: 50, status: "paid", due_date: "2026-03-01", paid_date: "2026-02-28", notes: null },
  { id: "d6", name: "Staff — Kit Manager", role: "Staff", subscription_amount: 0, status: "paid", due_date: null, paid_date: null, notes: null },
];

const DEMO_SUMMARY: MemberSummary = { total: 6, paid: 3, unpaid: 2, partial: 1, collected: 150, outstanding: 75 };

const membersLocalKey = (userId: string) => `grassroots_biz_members_${userId || "guest"}`;

function membersFromLocal(userId: string): Member[] {
  try { return JSON.parse(localStorage.getItem(membersLocalKey(userId)) ?? "[]") as Member[]; }
  catch { return []; }
}
function MembersDashboard({ isGuest, userId }: { isGuest: boolean; userId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [summary, setSummary] = useState<MemberSummary>(DEMO_SUMMARY);
  const [loading, setLoading] = useState(!isGuest);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid" | "partial">("all");
  const [form, setForm] = useState({ name: "", role: "Player" as Member["role"], subscription_amount: "", due_date: "", notes: "" });
  const [localMode, setLocalMode] = useState(false);

  const membersToLocal = (list: Member[]) => {
    try { localStorage.setItem(membersLocalKey(userId), JSON.stringify(list)); } catch { /* ignore */ }
  };

  const load = useCallback(async () => {
    if (isGuest) { setMembers(DEMO_MEMBERS); setSummary(DEMO_SUMMARY); return; }
    try {
      setLoading(true);
      const res = await api.get<{ data: Member[]; summary: MemberSummary }>("/business/members");
      setMembers(res.data.data.length ? res.data.data : DEMO_MEMBERS);
      setSummary(res.data.data.length ? res.data.summary : DEMO_SUMMARY);
    } catch (err) {
      // If endpoint not found (404) or network error, fall back to localStorage
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (!status || status === 404 || status === 405) {
        setLocalMode(true);
        const local = membersFromLocal(userId);
        setMembers(local.length ? local : DEMO_MEMBERS);
        updateSummary(local.length ? local : DEMO_MEMBERS);
      } else {
        setError("Could not load members.");
        setMembers(DEMO_MEMBERS);
      }
    }
    finally { setLoading(false); }
  }, [isGuest]);

  useEffect(() => { load(); }, [load]);

  const toggleStatus = async (member: Member) => {
    const next: Member["status"] = member.status === "unpaid" ? "paid" : member.status === "partial" ? "paid" : "unpaid";
    const updated = { ...member, status: next, paid_date: next === "paid" ? new Date().toISOString().slice(0, 10) : null };
    const newList = members.map((m) => m.id === member.id ? updated : m);
    setMembers(newList);
    updateSummary(newList);
    if (localMode || isGuest) { membersToLocal(newList); return; }
    try { await api.patch(`/business/members/${member.id}`, { status: next }); }
    catch { setMembers((prev) => prev.map((m) => m.id === member.id ? member : m)); }
  };

  const updateSummary = (list: Member[]) => {
    setSummary({
      total: list.length,
      paid: list.filter((m) => m.status === "paid").length,
      unpaid: list.filter((m) => m.status === "unpaid").length,
      partial: list.filter((m) => m.status === "partial").length,
      collected: list.filter((m) => m.status === "paid").reduce((s, m) => s + m.subscription_amount, 0),
      outstanding: list.filter((m) => m.status !== "paid").reduce((s, m) => s + m.subscription_amount, 0),
    });
  };

  const addMember = async () => {
    if (!form.name.trim()) return;
    if (localMode || isGuest) {
      const m: Member = { id: Date.now().toString(), name: form.name, role: form.role, subscription_amount: Number(form.subscription_amount) || 0, status: "unpaid", due_date: form.due_date || null, paid_date: null, notes: form.notes || null };
      const updated = [...members, m];
      setMembers(updated); updateSummary(updated); membersToLocal(updated);
      setShowForm(false); setForm({ name: "", role: "Player", subscription_amount: "", due_date: "", notes: "" }); return;
    }
    try {
      setSaving(true);
      const res = await api.post<{ data: Member }>("/business/members", { name: form.name, role: form.role, subscription_amount: Number(form.subscription_amount) || 0, due_date: form.due_date || null, notes: form.notes || null });
      const updated = [...members, res.data.data];
      setMembers(updated); updateSummary(updated);
      setShowForm(false);
      setForm({ name: "", role: "Player", subscription_amount: "", due_date: "", notes: "" });
    } catch { setError("Could not add member."); }
    finally { setSaving(false); }
  };

  const deleteMember = async (id: string) => {
    const updated = members.filter((m) => m.id !== id);
    if (localMode || isGuest) { setMembers(updated); updateSummary(updated); membersToLocal(updated); return; }
    try { await api.delete(`/business/members/${id}`); setMembers(updated); updateSummary(updated); }
    catch { setError("Could not remove member."); }
  };

  const exportStakeholderPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(0, 100, 0);
    doc.rect(0, 0, 210, 38, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Grassroots Sport", 14, 14);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Member Subscription Report — Stakeholder Copy", 14, 22);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-ZW", { day: "numeric", month: "long", year: "numeric" })}`, 14, 30);

    doc.setTextColor(0, 0, 0);
    autoTable(doc, {
      startY: 44,
      head: [["Total Members", "Paid", "Unpaid / Partial", "Collected", "Outstanding"]],
      body: [[summary.total, summary.paid, summary.unpaid + summary.partial, `$${summary.collected.toFixed(2)}`, `$${summary.outstanding.toFixed(2)}`]],
      headStyles: { fillColor: [0, 100, 0], textColor: 255 },
      bodyStyles: { fontSize: 11, fontStyle: "bold" },
    });

    const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("MEMBER PAYMENT STATUS", 14, finalY);
    autoTable(doc, {
      startY: finalY + 4,
      head: [["Name", "Role", "Fee ($)", "Status", "Due Date", "Paid Date"]],
      body: members.map((m) => [
        m.name,
        m.role,
        `$${m.subscription_amount.toFixed(2)}`,
        m.status.charAt(0).toUpperCase() + m.status.slice(1),
        m.due_date ? new Date(m.due_date).toLocaleDateString("en-ZW", { day: "numeric", month: "short" }) : "—",
        m.paid_date ? new Date(m.paid_date).toLocaleDateString("en-ZW", { day: "numeric", month: "short" }) : "—",
      ]),
      headStyles: { fillColor: [0, 100, 0], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 255, 240] },
      didParseCell: (data) => {
        if (data.column.index === 3 && data.section === "body") {
          const val = String(data.cell.raw);
          data.cell.styles.textColor = val === "Paid" ? [0, 128, 0] : val === "Unpaid" ? [200, 0, 0] : [180, 120, 0];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("grassrootssports.live  |  Zimbabwe's Sports Management Platform  |  CONFIDENTIAL", 14, pageHeight - 10);
    doc.save(`grassroots-member-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const filtered = filter === "all" ? members : members.filter((m) => m.status === filter);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      {isGuest && <GuestBanner />}
      {!isGuest && localMode && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">Saving to this device only</p>
            <p className="text-xs text-amber-400/70 mt-0.5">Member data is stored in your browser until the server endpoint is ready. Your data is safe here but won&apos;t sync to other devices.</p>
          </div>
        </div>
      )}
      {error && <ErrorBanner message={error} />}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Total Members", value: summary.total, color: "text-white", bg: "border-white/10" },
          { label: "Paid", value: summary.paid, color: "text-green-400", bg: "border-green-500/20 bg-green-500/5" },
          { label: "Unpaid", value: summary.unpaid, color: "text-red-400", bg: "border-red-500/20 bg-red-500/5" },
          { label: "Collected", value: `$${summary.collected}`, color: "text-emerald-400", bg: "border-emerald-500/20" },
          { label: "Outstanding", value: `$${summary.outstanding}`, color: "text-amber-400", bg: "border-amber-500/20" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border ${s.bg} bg-white/5 p-3 text-center`}>
            <p className="text-[10px] text-green-400/60">{s.label}</p>
            <p className={`mt-1 text-xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "paid", "unpaid", "partial"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all capitalize ${filter === f ? "border-amber-500/50 bg-amber-500/15 text-amber-300" : "border-white/10 bg-white/5 text-green-300 hover:bg-white/10"}`}>
            {f === "all" ? `All (${summary.total})` : f === "paid" ? `Paid (${summary.paid})` : f === "unpaid" ? `Unpaid (${summary.unpaid})` : `Partial (${summary.partial})`}
          </button>
        ))}
      </div>

      {/* Member list */}
      <div className="space-y-2">
        {filtered.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${m.status === "paid" ? "bg-green-500/20 text-green-400" : m.status === "partial" ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"}`}>
                {m.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{m.name}</p>
                <p className="text-xs text-green-400/50">{m.role} {m.due_date ? `· Due ${new Date(m.due_date).toLocaleDateString("en-ZW", { day: "numeric", month: "short" })}` : ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-bold text-white">${m.subscription_amount}</span>
              <button
                onClick={() => toggleStatus(m)}
                className={`rounded-full px-3 py-1 text-[10px] font-bold transition-all ${m.status === "paid" ? "bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400" : "bg-red-500/20 text-red-400 hover:bg-green-500/20 hover:text-green-400"}`}
                title="Click to toggle paid/unpaid"
              >
                {m.status === "paid" ? "✓ Paid" : m.status === "partial" ? "~ Partial" : "✗ Unpaid"}
              </button>
              <button onClick={() => deleteMember(m.id)} className="text-red-400/40 hover:text-red-400 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="py-8 text-center text-sm text-green-400/40">No members in this category.</p>}
      </div>

      {/* Add member form */}
      {showForm && (
        <div className="rounded-xl border border-white/20 bg-white/5 p-4 space-y-3">
          <p className="text-xs font-semibold text-green-300">Add member</p>
          <div className="grid grid-cols-2 gap-2">
            <input type="text" placeholder="Full name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="col-span-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-400/40 outline-none focus:border-green-400" />
            <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Member["role"] }))} className="rounded-lg border border-white/20 bg-[#0a3d10] px-3 py-2 text-sm text-white outline-none focus:border-green-400">
              {["Player", "Coach", "Staff", "Parent", "Other"].map((r) => <option key={r}>{r}</option>)}
            </select>
            <input type="number" placeholder="Fee ($)" value={form.subscription_amount} onChange={(e) => setForm((f) => ({ ...f, subscription_amount: e.target.value }))} className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-400/40 outline-none focus:border-green-400" />
            <input type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-green-400" />
            <input type="text" placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-400/40 outline-none focus:border-green-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={addMember} disabled={saving} className="flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null} Add member
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 py-2.5 text-sm font-semibold text-green-300 hover:bg-white/5 transition-colors">
            <Plus className="h-4 w-4" /> Add member
          </button>
        )}
        <button onClick={exportStakeholderPDF} className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors">
          <FileText className="h-4 w-4" /> Stakeholder Report PDF
        </button>
      </div>
    </div>
  );
}

// ─── Business Skills ──────────────────────────────────────────────────────────

const SKILLS = [
  {
    icon: <Target className="h-5 w-5" />, title: "Writing a Winning Sponsorship Proposal", duration: "12 min read", level: "Beginner", color: "text-green-400",
    excerpt: "Learn how to craft a proposal that gets companies to say yes — including a template for Zimbabwe sports clubs.",
    content: `A sponsorship proposal is a sales document — your goal is to show the sponsor what they get, not just what you need.

**The 5-section formula:**

1. EXECUTIVE SUMMARY (1 page) — who you are, what you do, how many people you reach. Lead with your audience size: "We reach 200+ families in Chitungwiza every weekend."

2. ABOUT YOUR CLUB/EVENT — founding year, achievements, community impact. Include photos. Sponsors want to feel proud of backing you.

3. SPONSORSHIP PACKAGES — offer 3 tiers:
   • Bronze ($500): logo on kit, social media mention, 2 match banners
   • Silver ($2,000): all Bronze + PA announcements, programme ad, half-time promo
   • Gold ($5,000): all Silver + jersey front logo, exclusivity, press release naming rights

4. BENEFITS TO SPONSOR — reach, demographics, community goodwill, brand visibility. Use numbers: "12 home matches × avg 300 fans = 3,600 impressions per season."

5. CALL TO ACTION — one specific ask. "Can we meet on Tuesday to discuss the Silver package?" Never leave it open-ended.

**Zimbabwe-specific tips:**
- Target companies with CSR budgets (NetOne, Econet, Delta, CBZ all have these)
- Send to the Marketing Manager or CSR Manager — not the CEO directly
- Follow up exactly 5 business days later with a polite reminder
- Reference community impact — urban companies value rural/township reach`,
  },
  {
    icon: <TrendingUp className="h-5 w-5" />, title: "Setting Gate Fee Prices for Tournaments", duration: "8 min read", level: "Beginner", color: "text-amber-400",
    excerpt: "How to price entry fees to cover costs, attract crowds, and still make a profit.",
    content: `Gate fees are your most reliable tournament revenue. Price them wrong and you either lose money or lose your crowd.

**The break-even formula:**
Total costs ÷ Expected attendance = Minimum gate fee

Example: Costs = $800, Expected crowd = 300 people → Minimum = $2.67 per person → Set gate at $3.00

**Zimbabwe-specific pricing guide (2026):**

| Event Type | Recommended Gate | Notes |
|---|---|---|
| Primary school match | Free or $0.50 | Parents won't pay more |
| Club league fixture | $1–$2 | Local derbies can go $3 |
| Regional tournament | $3–$5 | Friday/Saturday premium |
| Finals/Gala Day | $5–$10 | Includes programme |

**Revenue multipliers:**
- VIP seating: charge 3× standard gate for chairs + shade
- Parking: $1–$2 per vehicle (negotiate with landowner)
- Food/drinks concession: don't sell yourself — rent pitch to vendors for $20–$50/day
- Programme booklet: $1 each, include sponsor ads to cover printing costs

**Reducing no-shows:** Sell "early bird" tickets at 20% discount via WhatsApp 2 weeks before. Pre-sold tickets reduce gate day chaos and guarantee minimum revenue.`,
  },
  {
    icon: <DollarSign className="h-5 w-5" />, title: "Budgeting for a Multi-Sport School Gala", duration: "15 min read", level: "Intermediate", color: "text-blue-400",
    excerpt: "A step-by-step budget template for school sports coordinators running holiday galas.",
    content: `A school sports gala with 20+ teams and 3+ sports requires careful planning. Most coordinators underestimate costs by 30–40%.

**Standard cost categories:**

VENUE & FACILITIES
- Ground hire: $50–$200/day
- Marquee/tent rental: $80–$150
- Portable toilets (if needed): $30/day each
- Electricity/generator: $50–$100/day

OFFICIALS & STAFF
- Referees: $15–$30 per match per referee
- Timekeepers/scorers: $10–$20 each
- Medical officer: $50–$100/day (mandatory for NASH events)
- Security: $20–$40/person/day

EQUIPMENT
- Balls (replacements): $20–$40 each
- Bibs, cones, markers: $30–$80
- First aid kit restock: $30–$60
- Trophies/medals: $5–$20 per award

CATERING
- Budget $3–$5 per team member per day for water/snacks
- VIP tent catering: $10–$15 per person

MARKETING
- Banners (2m×1m vinyl): $15–$25 each
- Programme printing (50 copies): $0.50–$1 each

**Template totals (3-day, 16-team gala):**
Venues: $450 | Officials: $600 | Equipment: $200 | Catering: $400 | Marketing: $150
Total costs: ~$1,800

Revenue needed: $1,800 ÷ 300 expected crowd = $6 gate fee to break even
Add 25% profit margin: Set gate at $8, target $2,250 revenue`,
  },
  {
    icon: <Building2 className="h-5 w-5" />, title: "Registering a Sports Club as a Legal Entity", duration: "20 min read", level: "Intermediate", color: "text-purple-400",
    excerpt: "How to register with ZIMRA, open a club bank account, and stay compliant in Zimbabwe.",
    content: `Running a sports club as an informal group limits you. You can't open a bank account, can't sign contracts, and can't apply for grants. Formalising takes 2–4 weeks.

**Option 1: Register as a Private Business Corporation (PBC)**
- Cost: $50–$100 at CIPAZ (Companies and Intellectual Property Authority of Zimbabwe)
- Required: Club name (check availability at cipaz.co.zw), 2 directors, physical address
- Timeline: 5–10 business days
- Best for: Clubs that want to trade, hire staff, sign sponsorship contracts

**Option 2: Register as an Association / NPO**
- Cost: $30–$60 at Deeds Registry
- Required: Constitution, 3 founding members, AGM minutes
- Timeline: 2–4 weeks
- Best for: Community clubs focused on development, not profit

**Step-by-step (PBC route):**
1. Check name availability: email cipaz@cipaz.co.zw
2. Complete CR1 form (download from cipaz.co.zw)
3. Submit with $50 fee + 2 certified IDs + proof of address
4. Receive Certificate of Incorporation
5. Get ZIMRA Business Partner Number (free, same week)

**Opening a club bank account (after incorporation):**
- Take Certificate of Incorporation + 2 signatories' IDs
- CBZ and ZB Bank have community club accounts with low fees
- Require 2 signatures on all transactions above $500 (governance best practice)

**Annual compliance:**
- File annual returns with CIPAZ: $20/year
- Keep minutes of AGM on file
- ZIMRA: file nil returns if no taxable income`,
  },
  {
    icon: <Lightbulb className="h-5 w-5" />, title: "Generating Revenue Beyond Gate Fees", duration: "10 min read", level: "Advanced", color: "text-orange-400",
    excerpt: "Merchandise, streaming rights, coaching academies, and 8 other revenue streams for sports clubs.",
    content: `The most financially resilient sports clubs in Zimbabwe have 3–5 revenue streams. Gate fees alone create a fragile business that stops in the off-season.

**8 revenue streams to add this year:**

1. COACHING ACADEMIES ($20–$50/child/month)
   Run weekend skills sessions for 8–12 year olds. 20 kids × $30 = $600/month. Use your existing coaches and ground. This is the most scalable option.

2. KIT & MERCHANDISE
   Order 50 printed T-shirts at $4 each, sell at $12. One order = $400 profit. WhatsApp groups are your sales channel — no shop needed.

3. STREAMING RIGHTS
   Use the Grassroots Sport app to broadcast matches live. Charge viewers $0.50–$1 per match via EcoCash. 200 viewers = $100–$200 per match.

4. GROUND HIRE (if you own/lease the ground)
   Rent to other clubs/schools on days you don't train: $30–$80/day. 3 days/week = $360–$720/month additional income.

5. TRAINING CAMPS (holidays)
   School holiday camps: 5 days, $30 per child. 30 kids = $900. All profit after printing a programme and buying water.

6. SPORTS PHOTOGRAPHY
   Partner with a local photographer. They attend your matches for free; you take 15% of any photo sales to parents/families.

7. CORPORATE TEAM-BUILDING
   Companies pay $500–$2,000 for a half-day sports day. Approach HR departments of local companies. You provide venue, equipment, and prizes.

8. TOURNAMENT HOSTING FEES
   Charge visiting clubs an "administration fee" of $10–$20 per team to participate in your tournament. 16 teams = $160–$320 immediate revenue.

**Priority order:** Start with the coaching academy (most recurring income), then merchandise, then ground hire. Only add more streams once the first three are running smoothly.`,
  },
];

function BusinessSkills() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      {SKILLS.map((s) => {
        const isOpen = open === s.title;
        return (
          <div key={s.title} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            <button
              onClick={() => setOpen(isOpen ? null : s.title)}
              className="w-full p-4 text-left hover:bg-white/[0.04] transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 shrink-0 ${s.color}`}>{s.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-white text-sm group-hover:text-green-300 transition-colors">{s.title}</p>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-green-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-green-400/40 group-hover:text-green-400 shrink-0" />}
                  </div>
                  <p className="mt-1 text-xs text-green-400/50">{s.duration} · {s.level}</p>
                  <p className="mt-1.5 text-xs text-green-300/70 leading-relaxed">{s.excerpt}</p>
                </div>
              </div>
            </button>
            {isOpen && (
              <div className="border-t border-white/10 px-4 pb-5 pt-4">
                <div className="prose prose-invert prose-sm max-w-none">
                  {s.content.split("\n\n").map((para, i) => (
                    <p key={i} className="text-xs text-green-200/80 leading-relaxed mb-3 whitespace-pre-line">{para}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
      <p className="text-center text-xs text-green-400/40 pt-2">More articles and downloadable templates coming soon</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BusinessHubPage() {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const isGuest = !hasHydrated || !user;

  const [activeTab, setActiveTab] = useState<Tab>("budget");

  // Pre-select tab when arriving from coach hub (?tab=events etc.)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab") as Tab | null;
    const valid: Tab[] = ["budget", "sponsors", "tracker", "events", "members", "skills"];
    if (tab && valid.includes(tab)) setActiveTab(tab);
  }, []);

  const tabContent: Record<Tab, React.ReactNode> = {
    budget:   <BudgetPlanner isGuest={isGuest} />,
    sponsors: <SponsorFinder />,
    tracker:  <FinancialTracker isGuest={isGuest} />,
    events:   <EventPlanner isGuest={isGuest} />,
    members:  <MembersDashboard isGuest={isGuest} userId={user?.id ?? ""} />,
    skills:   <BusinessSkills />,
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">

        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30">
              <Building2 className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Business Hub</h1>
              <p className="text-sm text-muted-foreground">Budget · Sponsors · Finance · Events · Members</p>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="mb-5 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === t.key
                  ? "border-amber-500/50 bg-amber-500/15 text-amber-400"
                  : "border-muted bg-muted/30 text-muted-foreground hover:bg-muted"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="rounded-2xl border bg-card p-6">
          {tabContent[activeTab]}
        </div>

      </main>
    </div>
  );
}

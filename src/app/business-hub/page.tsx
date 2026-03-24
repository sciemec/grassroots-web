"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { useAuthStore } from "@/lib/auth-store";
import { ProGate } from "@/components/pro-gate";
import api from "@/lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart3, Calendar, DollarSign, Search, BookOpen,
  Users, Trophy, GraduationCap, Building2, Handshake,
  CheckCircle, ArrowRight, Star, TrendingUp, FileText,
  PiggyBank, Target, Lightbulb, ChevronDown, ChevronUp,
  Trash2, Plus, Loader2, AlertCircle, Camera, X,
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
    <div className="mb-5 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
      <p className="text-xs text-amber-300">
        Viewing demo data. <Link href="/login" className="font-bold underline">Sign in</Link> to save your real data.
      </p>
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
            {preview && <img src={preview} alt="Receipt" className="h-32 w-auto rounded-lg object-cover opacity-60" />}
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
          return (
            <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-semibold text-white">{item.category}</p><p className="text-xs text-green-400/50">{item.label}</p></div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">${item.spent} <span className="text-xs font-normal text-green-400/50">/ ${item.budgeted}</span></p>
                    <p className="text-xs text-green-400/50">{itemPct}% used</p>
                  </div>
                  <button onClick={() => deleteItem(item.id)} className="text-red-400/50 hover:text-red-400 transition-colors"><Trash2 className="h-4 w-4" /></button>
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
  { name: "NetOne Zimbabwe", sector: "Telecom", budget: "$5,000–$50,000", sports: ["Football", "Rugby", "Netball"], logo: "📡", status: "Open" },
  { name: "Econet Wireless", sector: "Telecom", budget: "$10,000–$100,000", sports: ["All sports"], logo: "📶", status: "Open" },
  { name: "Delta Beverages", sector: "FMCG", budget: "$2,000–$20,000", sports: ["Football", "Athletics"], logo: "🍺", status: "Open" },
  { name: "CBZ Bank", sector: "Finance", budget: "$5,000–$30,000", sports: ["All sports"], logo: "🏦", status: "Reviewing" },
  { name: "OK Zimbabwe", sector: "Retail", budget: "$1,000–$10,000", sports: ["Netball", "Basketball"], logo: "🛒", status: "Open" },
  { name: "Innscor Africa", sector: "Food", budget: "$3,000–$25,000", sports: ["Youth sports"], logo: "🍗", status: "Open" },
];

function SponsorFinder() {
  const [filter, setFilter] = useState("");
  const filtered = SPONSORS.filter((s) => !filter || s.sector.toLowerCase().includes(filter.toLowerCase()) || s.name.toLowerCase().includes(filter.toLowerCase()) || s.sports.some((sp) => sp.toLowerCase().includes(filter.toLowerCase())));
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
            <button className="mt-3 w-full rounded-lg border border-green-500/40 py-1.5 text-xs font-semibold text-green-400 hover:bg-green-500/10 transition-colors">Send proposal →</button>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-green-400/40">Pro plan unlocks direct contact details and proposal templates</p>
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
  const [form, setForm] = useState({ name: "", date_range: "", sport: "Multi-sport", teams: "", icon: "🏅" });

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
      setEvents((prev) => [...prev, { id: Date.now().toString(), ...form, teams: Number(form.teams) || 0, status: "Planning", checklist_done: [] }]);
      setShowForm(false); return;
    }
    try {
      setSaving(true);
      const res = await api.post<{ data: BusinessEvent }>("/business/events", { ...form, teams: Number(form.teams) || 0 });
      setEvents((prev) => [...prev, res.data.data]);
      setShowForm(false);
      setForm({ name: "", date_range: "", sport: "Multi-sport", teams: "", icon: "🏅" });
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

const MEMBERS_LOCAL_KEY = "grassroots_biz_members";

function membersFromLocal(): Member[] {
  try { return JSON.parse(localStorage.getItem(MEMBERS_LOCAL_KEY) ?? "[]") as Member[]; }
  catch { return []; }
}
function MembersDashboard({ isGuest }: { isGuest: boolean }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [summary, setSummary] = useState<MemberSummary>(DEMO_SUMMARY);
  const [loading, setLoading] = useState(!isGuest);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid" | "partial">("all");
  const [form, setForm] = useState({ name: "", role: "Player" as Member["role"], subscription_amount: "", due_date: "", notes: "" });

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
        const local = membersFromLocal();
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
    setMembers((prev) => prev.map((m) => m.id === member.id ? updated : m));
    updateSummary(members.map((m) => m.id === member.id ? updated : m));
    if (!isGuest) {
      try { await api.patch(`/business/members/${member.id}`, { status: next }); }
      catch { setMembers((prev) => prev.map((m) => m.id === member.id ? member : m)); }
    }
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
    if (isGuest) {
      const m: Member = { id: Date.now().toString(), name: form.name, role: form.role, subscription_amount: Number(form.subscription_amount) || 0, status: "unpaid", due_date: form.due_date || null, paid_date: null, notes: form.notes || null };
      const updated = [...members, m];
      setMembers(updated); updateSummary(updated); setShowForm(false); return;
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
    if (isGuest) { const updated = members.filter((m) => m.id !== id); setMembers(updated); updateSummary(updated); return; }
    try { await api.delete(`/business/members/${id}`); const updated = members.filter((m) => m.id !== id); setMembers(updated); updateSummary(updated); }
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
  { icon: <Target className="h-5 w-5" />, title: "Writing a Winning Sponsorship Proposal", duration: "12 min read", level: "Beginner", color: "text-green-400", excerpt: "Learn how to craft a proposal that gets companies to say yes — including a template for Zimbabwe sports clubs." },
  { icon: <TrendingUp className="h-5 w-5" />, title: "Setting Gate Fee Prices for Tournaments", duration: "8 min read", level: "Beginner", color: "text-amber-400", excerpt: "How to price entry fees to cover costs, attract crowds, and still make a profit." },
  { icon: <DollarSign className="h-5 w-5" />, title: "Budgeting for a Multi-Sport School Gala", duration: "15 min read", level: "Intermediate", color: "text-blue-400", excerpt: "A step-by-step budget template for school sports coordinators running holiday galas." },
  { icon: <Building2 className="h-5 w-5" />, title: "Registering a Sports Club as a Legal Entity", duration: "20 min read", level: "Intermediate", color: "text-purple-400", excerpt: "How to register with ZIMRA, open a club bank account, and stay compliant in Zimbabwe." },
  { icon: <Lightbulb className="h-5 w-5" />, title: "Generating Revenue Beyond Gate Fees", duration: "10 min read", level: "Advanced", color: "text-orange-400", excerpt: "Merchandise, streaming rights, coaching academies, and 8 other revenue streams for sports clubs." },
];

function BusinessSkills() {
  return (
    <div className="space-y-3">
      {SKILLS.map((s) => (
        <div key={s.title} className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/[0.08] transition-colors cursor-pointer group">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 ${s.color}`}>{s.icon}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-bold text-white text-sm group-hover:text-green-300 transition-colors">{s.title}</p>
                <ArrowRight className="h-4 w-4 text-green-400/40 group-hover:text-green-400 transition-colors shrink-0 ml-2" />
              </div>
              <p className="mt-1 text-xs text-green-400/50">{s.duration} · {s.level}</p>
              <p className="mt-2 text-xs text-green-300/70 leading-relaxed">{s.excerpt}</p>
            </div>
          </div>
        </div>
      ))}
      <p className="text-center text-xs text-green-400/40 pt-2">Pro plan unlocks full articles, templates, and downloadable resources</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BusinessHubPage() {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const isGuest = !hasHydrated || !user;

  const [activeTab, setActiveTab] = useState<Tab>("budget");
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const tabContent: Record<Tab, React.ReactNode> = {
    budget:   <BudgetPlanner isGuest={isGuest} />,
    sponsors: <SponsorFinder />,
    tracker:  <FinancialTracker isGuest={isGuest} />,
    events:   <EventPlanner isGuest={isGuest} />,
    members:  <MembersDashboard isGuest={isGuest} />,
    skills:   <BusinessSkills />,
  };

  return (
    <ProGate feature="Business Hub">
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #052e0a 0%, #0a3d10 50%, #0d2f1a 100%)" }}>
      <PublicNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-16 px-4">
        <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cpolygon points='60,10 90,50 60,90 30,50' fill='none' stroke='%23E6A817' stroke-width='1'/%3E%3Ccircle cx='60' cy='50' r='8' fill='%23E6A817' opacity='0.4'/%3E%3Cline x1='0' y1='60' x2='120' y2='60' stroke='%23E6A817' stroke-width='0.5'/%3E%3Cline x1='60' y1='0' x2='60' y2='120' stroke='%23E6A817' stroke-width='0.5'/%3E%3C/svg%3E")`, backgroundSize: "120px 120px" }} />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5">
            <Building2 className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-amber-300">Sports Business Hub</span>
          </div>
          <h1 className="text-4xl font-black text-white sm:text-5xl lg:text-6xl">Run Your Sports<br /><span style={{ color: "#F5C842" }}>Business Smarter</span></h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-green-300/80 sm:text-lg">Budget planning, sponsor discovery, financial tracking, member management and event tools — everything a Zimbabwe sports administrator needs.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#dashboard" className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition hover:opacity-90" style={{ background: "#E6A817", color: "#2C2416" }}>
              Try the tools free <ArrowRight className="h-4 w-4" />
            </a>
            {isGuest ? (
              <Link href="/register" className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10">Create free account</Link>
            ) : (
              <span className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-6 py-3 text-sm font-bold text-green-300">
                <CheckCircle className="h-4 w-4" /> Signed in as {user?.name?.split(" ")[0]}
              </span>
            )}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-green-400/60">
            {["Free basic plan", "No credit card needed", "Scan receipts with AI", "Stakeholder PDF reports"].map((f) => (
              <span key={f} className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-green-500" /> {f}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Who is this for */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-5xl">
          <p className="mb-6 text-center text-sm font-semibold text-green-400/60 uppercase tracking-widest">Who is this for?</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {USER_TYPES.map((ut) => (
              <button key={ut.key} onClick={() => setSelectedType(selectedType === ut.key ? null : ut.key)} className={`rounded-2xl border p-5 text-left transition-all ${selectedType === ut.key ? "border-amber-500/50 bg-amber-500/10 shadow-lg shadow-amber-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${ut.color} text-white`}>{ut.icon}</div>
                <p className="font-bold text-white text-sm">{ut.title}</p>
                <p className="mt-1 text-xs text-green-400/60 leading-relaxed">{ut.description}</p>
                {selectedType === ut.key && (
                  <ul className="mt-3 space-y-1">
                    {ut.features.map((f) => <li key={f} className="flex items-center gap-1.5 text-xs text-green-300"><CheckCircle className="h-3 w-3 text-green-500 shrink-0" /> {f}</li>)}
                  </ul>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard */}
      <section id="dashboard" className="px-4 pb-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-black text-white">Your Business Tools</h2>
            <p className="mt-2 text-sm text-green-400/60">{isGuest ? "Try the tools below — sign in to save your data" : "Your data is saved automatically"}</p>
          </div>
          <div className="mb-6 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${activeTab === t.key ? "border-amber-500/50 bg-amber-500/15 text-amber-300" : "border-white/10 bg-white/5 text-green-300 hover:bg-white/10"}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            {tabContent[activeTab]}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 pb-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-3xl font-black text-white">Simple Pricing</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-7">
              <p className="text-lg font-black text-white">Free</p>
              <p className="mt-1 text-4xl font-black text-white">$0<span className="text-lg font-normal text-green-400/60">/mo</span></p>
              <p className="mt-2 text-xs text-green-400/60">Perfect for getting started</p>
              <ul className="mt-6 space-y-3">
                {["Budget Planner (up to 10 items)", "Sponsor directory (names only)", "Basic financial tracker + receipt scan", "1 active event", "Up to 20 members", "5 business skills articles"].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-green-300"><CheckCircle className="mt-0.5 h-4 w-4 text-green-500 shrink-0" /> {f}</li>
                ))}
              </ul>
              <Link href="/register" className="mt-6 flex w-full items-center justify-center rounded-xl border border-white/20 py-2.5 text-sm font-bold text-white hover:bg-white/10 transition-colors">Get started free</Link>
            </div>
            <div className="rounded-2xl border border-amber-500/40 p-7 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(230,168,23,0.12), rgba(230,168,23,0.05))" }}>
              <div className="absolute top-4 right-4 rounded-full bg-amber-500 px-3 py-0.5 text-[10px] font-black text-amber-950">POPULAR</div>
              <p className="text-lg font-black text-white">Pro</p>
              <p className="mt-1 text-4xl font-black" style={{ color: "#F5C842" }}>$5<span className="text-lg font-normal text-amber-400/60">/mo</span></p>
              <p className="mt-2 text-xs text-amber-400/60">For serious clubs &amp; organisers</p>
              <ul className="mt-6 space-y-3">
                {["Unlimited budget items", "Full sponsor directory + contact details", "Advanced financial reports + PDF export", "Unlimited events + checklist export", "Unlimited members + stakeholder reports", "Receipt / paper scanning (AI)", "All business skills articles + templates", "Priority support via WhatsApp"].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-amber-200"><Star className="mt-0.5 h-4 w-4 text-amber-400 shrink-0" /> {f}</li>
                ))}
              </ul>
              <Link href="/register" className="mt-6 flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-bold transition-colors hover:opacity-90" style={{ background: "#E6A817", color: "#2C2416" }}>Start Pro — $5/month</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20">
        <div className="mx-auto max-w-2xl rounded-2xl border border-amber-500/20 p-10 text-center" style={{ background: "rgba(230,168,23,0.06)" }}>
          <h2 className="text-3xl font-black text-white">Ready to grow Zimbabwe sport?</h2>
          <p className="mt-3 text-sm text-green-300/70">Join clubs, schools, and event organisers already using Grassroots Sport Business Hub.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition hover:opacity-90" style={{ background: "#E6A817", color: "#2C2416" }}>Register free <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/login" className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10">Sign in</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-8 text-center text-xs text-green-400/40">
        © {new Date().getFullYear()} Grassroots Sport · Business Hub · Zimbabwe
      </footer>
    </div>
    </ProGate>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/public-navbar";
import {
  BarChart3, Calendar, DollarSign, Search, BookOpen,
  Users, Trophy, GraduationCap, Building2, Handshake,
  CheckCircle, ArrowRight, Star, TrendingUp, FileText,
  PiggyBank, Target, Lightbulb, ChevronDown, ChevronUp,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type UserType = {
  key: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  features: string[];
};

type Tab = "budget" | "sponsors" | "tracker" | "events" | "skills";

// ─── Data ────────────────────────────────────────────────────────────────────

const USER_TYPES: UserType[] = [
  {
    key: "club-admin",
    icon: <Trophy className="h-6 w-6" />,
    title: "Club Administrator",
    description: "Manage your club's finances, sponsorships, and events in one place.",
    color: "from-green-600 to-emerald-500",
    features: ["Budget tracking", "Sponsor management", "Player registration", "Event planning"],
  },
  {
    key: "event-organiser",
    icon: <Calendar className="h-6 w-6" />,
    title: "Event Organiser",
    description: "Plan and manage tournaments, leagues, and sports gala events.",
    color: "from-amber-600 to-yellow-500",
    features: ["Event scheduling", "Registration management", "Budget forecasting", "Venue coordination"],
  },
  {
    key: "school-coordinator",
    icon: <GraduationCap className="h-6 w-6" />,
    title: "School Sports Coordinator",
    description: "Coordinate inter-school competitions and manage school sports programmes.",
    color: "from-blue-600 to-sky-500",
    features: ["Team management", "Competition scheduling", "Budget reporting", "Parent communications"],
  },
  {
    key: "league-manager",
    icon: <Users className="h-6 w-6" />,
    title: "League Manager",
    description: "Run provincial or national leagues with complete financial oversight.",
    color: "from-purple-600 to-violet-500",
    features: ["League administration", "Financial tracking", "Sponsor ROI reports", "Standings management"],
  },
  {
    key: "sponsor",
    icon: <Handshake className="h-6 w-6" />,
    title: "Sponsor / Company",
    description: "Find sports teams and events to sponsor across Zimbabwe.",
    color: "from-orange-600 to-red-500",
    features: ["Sponsorship discovery", "ROI tracking", "Brand exposure reports", "Direct team contact"],
  },
];

const TABS = [
  { key: "budget" as Tab, label: "Budget Planner", icon: <PiggyBank className="h-4 w-4" /> },
  { key: "sponsors" as Tab, label: "Sponsor Finder", icon: <Search className="h-4 w-4" /> },
  { key: "tracker" as Tab, label: "Financial Tracker", icon: <BarChart3 className="h-4 w-4" /> },
  { key: "events" as Tab, label: "Event Planner", icon: <Calendar className="h-4 w-4" /> },
  { key: "skills" as Tab, label: "Business Skills", icon: <BookOpen className="h-4 w-4" /> },
];

// ─── Budget Planner ───────────────────────────────────────────────────────────

function BudgetPlanner() {
  const [items, setItems] = useState([
    { id: 1, category: "Equipment", budgeted: 500, spent: 320, label: "Balls, bibs, cones" },
    { id: 2, category: "Transport", budgeted: 300, spent: 180, label: "Away match travel" },
    { id: 3, category: "Venue hire", budgeted: 200, spent: 200, label: "Training ground" },
    { id: 4, category: "Referee fees", budgeted: 150, spent: 90, label: "Home matches" },
    { id: 5, category: "Medical", budgeted: 100, spent: 45, label: "First aid supplies" },
  ]);
  const [newCat, setNewCat] = useState("");
  const [newBudget, setNewBudget] = useState("");

  const totalBudgeted = items.reduce((s, i) => s + i.budgeted, 0);
  const totalSpent    = items.reduce((s, i) => s + i.spent, 0);
  const remaining     = totalBudgeted - totalSpent;
  const pct           = Math.round((totalSpent / totalBudgeted) * 100);

  const addItem = () => {
    if (!newCat.trim() || !newBudget) return;
    setItems((prev) => [
      ...prev,
      { id: Date.now(), category: newCat.trim(), budgeted: Number(newBudget), spent: 0, label: "New item" },
    ]);
    setNewCat(""); setNewBudget("");
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Budget", value: `$${totalBudgeted}`, color: "text-green-400" },
          { label: "Spent", value: `$${totalSpent}`, color: "text-amber-400" },
          { label: "Remaining", value: `$${remaining}`, color: remaining >= 0 ? "text-emerald-400" : "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-xs text-green-400/60">{s.label}</p>
            <p className={`mt-1 text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div>
        <div className="mb-1 flex justify-between text-xs text-green-300/70">
          <span>Budget used</span><span>{pct}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(pct, 100)}%`, background: pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#22c55e" }}
          />
        </div>
      </div>

      {/* Line items */}
      <div className="space-y-2">
        {items.map((item) => {
          const itemPct = Math.round((item.spent / item.budgeted) * 100);
          return (
            <div key={item.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{item.category}</p>
                  <p className="text-xs text-green-400/50">{item.label}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">${item.spent} <span className="text-xs font-normal text-green-400/50">/ ${item.budgeted}</span></p>
                  <p className="text-xs text-green-400/50">{itemPct}% used</p>
                </div>
              </div>
              <div className="mt-2 h-1 w-full rounded-full bg-white/10">
                <div className="h-full rounded-full" style={{ width: `${Math.min(itemPct, 100)}%`, background: itemPct > 90 ? "#ef4444" : "#22c55e" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add item */}
      <div className="flex gap-2">
        <input
          type="text" placeholder="Category name" value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          className="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-400/40 outline-none focus:border-green-400"
        />
        <input
          type="number" placeholder="$" value={newBudget}
          onChange={(e) => setNewBudget(e.target.value)}
          className="w-20 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-400/40 outline-none focus:border-green-400"
        />
        <button onClick={addItem} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-500 transition-colors">
          Add
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
  const filtered = SPONSORS.filter(
    (s) => !filter || s.sector.toLowerCase().includes(filter.toLowerCase()) ||
           s.name.toLowerCase().includes(filter.toLowerCase()) ||
           s.sports.some((sp) => sp.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5">
        <Search className="h-4 w-4 text-green-400/50 shrink-0" />
        <input
          type="text" placeholder="Search by company, sector, or sport…"
          value={filter} onChange={(e) => setFilter(e.target.value)}
          className="flex-1 bg-transparent text-sm text-white placeholder-green-400/40 outline-none"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((s) => (
          <div key={s.name} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{s.logo}</span>
                <div>
                  <p className="font-bold text-white text-sm">{s.name}</p>
                  <p className="text-xs text-green-400/60">{s.sector}</p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.status === "Open" ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}`}>
                {s.status}
              </span>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-xs text-green-300/70"><DollarSign className="inline h-3 w-3" /> {s.budget}</p>
              <p className="text-xs text-green-300/70">
                {s.sports.map((sp) => (
                  <span key={sp} className="mr-1 rounded-full bg-white/10 px-2 py-0.5">{sp}</span>
                ))}
              </p>
            </div>
            <button className="mt-3 w-full rounded-lg border border-green-500/40 py-1.5 text-xs font-semibold text-green-400 hover:bg-green-500/10 transition-colors">
              Send proposal →
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-green-400/40">
        Pro plan unlocks direct contact details and proposal templates
      </p>
    </div>
  );
}

// ─── Financial Tracker ────────────────────────────────────────────────────────

const TRANSACTIONS = [
  { date: "Mar 18", desc: "Sponsorship — NetOne", amount: 2000, type: "income" },
  { date: "Mar 16", desc: "Equipment purchase", amount: -320, type: "expense" },
  { date: "Mar 14", desc: "Match day gate fees", amount: 450, type: "income" },
  { date: "Mar 12", desc: "Transport — away match", amount: -180, type: "expense" },
  { date: "Mar 10", desc: "Registration fees (players)", amount: 600, type: "income" },
  { date: "Mar 08", desc: "Venue hire", amount: -200, type: "expense" },
  { date: "Mar 05", desc: "Training kit sale", amount: 340, type: "income" },
  { date: "Mar 02", desc: "Referee fees", amount: -90, type: "expense" },
];

function FinancialTracker() {
  const income  = TRANSACTIONS.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = TRANSACTIONS.filter((t) => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);
  const net     = income - expense;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Income", value: `$${income}`, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
          { label: "Expenses", value: `$${expense}`, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
          { label: "Net", value: `$${net}`, color: net >= 0 ? "text-emerald-400" : "text-red-400", bg: "bg-white/5 border-white/10" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border ${s.bg} p-4 text-center`}>
            <p className="text-xs text-green-400/60">{s.label}</p>
            <p className={`mt-1 text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-1">
        {TRANSACTIONS.map((t, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">{t.desc}</p>
              <p className="text-xs text-green-400/50">{t.date}</p>
            </div>
            <span className={`text-sm font-bold ${t.type === "income" ? "text-green-400" : "text-red-400"}`}>
              {t.type === "income" ? "+" : ""}${Math.abs(t.amount)}
            </span>
          </div>
        ))}
      </div>

      <button className="w-full rounded-xl border border-white/20 py-2.5 text-sm font-semibold text-green-300 hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
        <FileText className="h-4 w-4" /> Export financial report (PDF)
      </button>
    </div>
  );
}

// ─── Event Planner ────────────────────────────────────────────────────────────

const EVENTS = [
  { name: "April Holiday Sports Gala 2026", date: "Apr 14–18, 2026", sport: "Multi-sport", teams: 24, status: "Planning", icon: "🏅" },
  { name: "Inter-schools Football Cup", date: "May 3, 2026", sport: "Football", teams: 16, status: "Open", icon: "⚽" },
  { name: "Netball Provincial Championships", date: "Jun 7–8, 2026", sport: "Netball", teams: 12, status: "Draft", icon: "🏐" },
];

function EventPlanner() {
  const [expanded, setExpanded] = useState<number | null>(null);

  const checklist = [
    "Book venue", "Set registration deadline", "Assign referees", "Arrange transport",
    "Confirm sponsors", "Print banners/programmes", "Medical team on standby", "Post on Grassroots Sport app",
  ];
  const [done, setDone] = useState<Set<number>>(new Set([0, 1, 4]));

  return (
    <div className="space-y-5">
      {EVENTS.map((ev, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{ev.icon}</span>
              <div>
                <p className="font-bold text-white text-sm">{ev.name}</p>
                <p className="text-xs text-green-400/60">{ev.date} · {ev.sport} · {ev.teams} teams</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ev.status === "Open" ? "bg-green-500/20 text-green-400" : ev.status === "Planning" ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-white/50"}`}>
                {ev.status}
              </span>
              {expanded === i ? <ChevronUp className="h-4 w-4 text-green-400" /> : <ChevronDown className="h-4 w-4 text-green-400" />}
            </div>
          </button>
          {expanded === i && (
            <div className="border-t border-white/10 px-4 pb-4 pt-3">
              <p className="mb-3 text-xs font-semibold text-green-300">Event checklist</p>
              <div className="grid grid-cols-2 gap-2">
                {checklist.map((item, j) => (
                  <button
                    key={j}
                    onClick={() => setDone((prev) => { const n = new Set(prev); if (n.has(j)) { n.delete(j); } else { n.add(j); } return n; })}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs text-left transition-all ${done.has(j) ? "border-green-500/30 bg-green-500/10 text-green-300" : "border-white/10 bg-white/5 text-white/60"}`}
                  >
                    <CheckCircle className={`h-3.5 w-3.5 shrink-0 ${done.has(j) ? "text-green-400" : "text-white/20"}`} />
                    {item}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-green-400/50">{done.size}/{checklist.length} tasks complete</p>
            </div>
          )}
        </div>
      ))}

      <button className="w-full rounded-xl border border-dashed border-green-500/30 py-3 text-sm font-semibold text-green-400 hover:bg-green-500/5 transition-colors flex items-center justify-center gap-2">
        + Create new event
      </button>
    </div>
  );
}

// ─── Business Skills ──────────────────────────────────────────────────────────

const SKILLS = [
  {
    icon: <Target className="h-5 w-5" />,
    title: "Writing a Winning Sponsorship Proposal",
    duration: "12 min read",
    level: "Beginner",
    color: "text-green-400",
    excerpt: "Learn how to craft a proposal that gets companies to say yes — including a template for Zimbabwe sports clubs.",
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    title: "Setting Gate Fee Prices for Tournaments",
    duration: "8 min read",
    level: "Beginner",
    color: "text-amber-400",
    excerpt: "How to price entry fees to cover costs, attract crowds, and still make a profit.",
  },
  {
    icon: <DollarSign className="h-5 w-5" />,
    title: "Budgeting for a Multi-Sport School Gala",
    duration: "15 min read",
    level: "Intermediate",
    color: "text-blue-400",
    excerpt: "A step-by-step budget template for school sports coordinators running holiday galas.",
  },
  {
    icon: <Building2 className="h-5 w-5" />,
    title: "Registering a Sports Club as a Legal Entity",
    duration: "20 min read",
    level: "Intermediate",
    color: "text-purple-400",
    excerpt: "How to register with ZIMRA, open a club bank account, and stay compliant in Zimbabwe.",
  },
  {
    icon: <Lightbulb className="h-5 w-5" />,
    title: "Generating Revenue Beyond Gate Fees",
    duration: "10 min read",
    level: "Advanced",
    color: "text-orange-400",
    excerpt: "Merchandise, streaming rights, coaching academies, and 8 other revenue streams for sports clubs.",
  },
];

function BusinessSkills() {
  return (
    <div className="space-y-3">
      {SKILLS.map((s) => (
        <div key={s.title} className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/8 transition-colors cursor-pointer group">
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
      <p className="text-center text-xs text-green-400/40 pt-2">
        Pro plan unlocks full articles, templates, and downloadable resources
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BusinessHubPage() {
  const [activeTab, setActiveTab] = useState<Tab>("budget");
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const tabContent: Record<Tab, React.ReactNode> = {
    budget:   <BudgetPlanner />,
    sponsors: <SponsorFinder />,
    tracker:  <FinancialTracker />,
    events:   <EventPlanner />,
    skills:   <BusinessSkills />,
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #052e0a 0%, #0a3d10 50%, #0d2f1a 100%)" }}>
      <PublicNavbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-16 px-4">
        {/* African pattern background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cpolygon points='60,10 90,50 60,90 30,50' fill='none' stroke='%23E6A817' stroke-width='1'/%3E%3Ccircle cx='60' cy='50' r='8' fill='%23E6A817' opacity='0.4'/%3E%3Cline x1='0' y1='60' x2='120' y2='60' stroke='%23E6A817' stroke-width='0.5'/%3E%3Cline x1='60' y1='0' x2='60' y2='120' stroke='%23E6A817' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: "120px 120px",
          }}
        />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5">
            <Building2 className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-amber-300">Sports Business Hub</span>
          </div>

          <h1 className="text-4xl font-black text-white sm:text-5xl lg:text-6xl">
            Run Your Sports<br />
            <span style={{ color: "#F5C842" }}>Business Smarter</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base text-green-300/80 sm:text-lg">
            Budget planning, sponsor discovery, financial tracking, and event management —
            everything a Zimbabwe sports administrator needs, in one place.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#dashboard"
              className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: "#E6A817", color: "#2C2416" }}
            >
              Try the tools free <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Create free account
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-green-400/60">
            {["Free basic plan", "No credit card needed", "Zimbabwe-focused tools", "Bilingual support"].map((f) => (
              <span key={f} className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-green-500" /> {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── User Types ───────────────────────────────────────────────────── */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-5xl">
          <p className="mb-6 text-center text-sm font-semibold text-green-400/60 uppercase tracking-widest">Who is this for?</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {USER_TYPES.map((ut) => (
              <button
                key={ut.key}
                onClick={() => setSelectedType(selectedType === ut.key ? null : ut.key)}
                className={`rounded-2xl border p-5 text-left transition-all ${
                  selectedType === ut.key
                    ? "border-amber-500/50 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${ut.color} text-white`}>
                  {ut.icon}
                </div>
                <p className="font-bold text-white text-sm">{ut.title}</p>
                <p className="mt-1 text-xs text-green-400/60 leading-relaxed">{ut.description}</p>
                {selectedType === ut.key && (
                  <ul className="mt-3 space-y-1">
                    {ut.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-green-300">
                        <CheckCircle className="h-3 w-3 text-green-500 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dashboard ────────────────────────────────────────────────────── */}
      <section id="dashboard" className="px-4 pb-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-black text-white">Your Business Tools</h2>
            <p className="mt-2 text-sm text-green-400/60">Try the tools below — no login required</p>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                  activeTab === t.key
                    ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                    : "border-white/10 bg-white/5 text-green-300 hover:bg-white/10"
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            {tabContent[activeTab]}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section className="px-4 pb-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-3xl font-black text-white">Simple Pricing</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Free */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-7">
              <p className="text-lg font-black text-white">Free</p>
              <p className="mt-1 text-4xl font-black text-white">$0<span className="text-lg font-normal text-green-400/60">/mo</span></p>
              <p className="mt-2 text-xs text-green-400/60">Perfect for getting started</p>
              <ul className="mt-6 space-y-3">
                {[
                  "Budget Planner (up to 10 items)",
                  "Sponsor directory (names only)",
                  "Basic financial tracker",
                  "1 active event",
                  "5 business skills articles",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-green-300">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-green-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-6 flex w-full items-center justify-center rounded-xl border border-white/20 py-2.5 text-sm font-bold text-white hover:bg-white/10 transition-colors"
              >
                Get started free
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border border-amber-500/40 p-7 relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(230,168,23,0.12), rgba(230,168,23,0.05))" }}>
              <div className="absolute top-4 right-4 rounded-full bg-amber-500 px-3 py-0.5 text-[10px] font-black text-amber-950">POPULAR</div>
              <p className="text-lg font-black text-white">Pro</p>
              <p className="mt-1 text-4xl font-black" style={{ color: "#F5C842" }}>$5<span className="text-lg font-normal text-amber-400/60">/mo</span></p>
              <p className="mt-2 text-xs text-amber-400/60">For serious clubs &amp; organisers</p>
              <ul className="mt-6 space-y-3">
                {[
                  "Unlimited budget items",
                  "Full sponsor directory + contact details",
                  "Proposal templates (Word/PDF)",
                  "Advanced financial reports",
                  "Unlimited events + checklist export",
                  "All business skills articles + templates",
                  "Priority support via WhatsApp",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-amber-200">
                    <Star className="mt-0.5 h-4 w-4 text-amber-400 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-6 flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-bold transition-colors hover:opacity-90"
                style={{ background: "#E6A817", color: "#2C2416" }}
              >
                Start Pro — $5/month
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="px-4 pb-20">
        <div className="mx-auto max-w-2xl rounded-2xl border border-amber-500/20 p-10 text-center" style={{ background: "rgba(230,168,23,0.06)" }}>
          <h2 className="text-3xl font-black text-white">Ready to grow Zimbabwe sport?</h2>
          <p className="mt-3 text-sm text-green-300/70">
            Join hundreds of clubs, schools, and event organisers already using Grassroots Sport Business Hub.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition hover:opacity-90"
              style={{ background: "#E6A817", color: "#2C2416" }}
            >
              Register free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-4 py-8 text-center text-xs text-green-400/40">
        © {new Date().getFullYear()} Grassroots Sport · Business Hub · Zimbabwe
      </footer>
    </div>
  );
}

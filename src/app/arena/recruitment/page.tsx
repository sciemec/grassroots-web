"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Users, Briefcase, MessageSquare, Home, Plus, MapPin, ChevronDown, ChevronUp, Send } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const API = process.env.NEXT_PUBLIC_API_URL;
const GRS_GREEN = "#1a5c2a";
const BG = "#f4f2ee";

function safeArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

interface TalentPosting {
  id: string;
  title: string;
  sport: string;
  position: string;
  province: string;
  age_min?: number;
  age_max?: number;
  tier: string;
  description: string;
  status: "open" | "closed";
  posted_by: string;
  poster_name: string;
  poster_role: string;
  application_count: number;
  has_applied: boolean;
  created_at: string;
}

function ArenaNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const initials = userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const links = [
    { href: "/arena",             label: "Feed",         icon: Home },
    { href: "/arena/network",     label: "Network",      icon: Users },
    { href: "/arena/clubs",       label: "Clubs",        icon: Users },
    { href: "/arena/recruitment", label: "Talent Board", icon: Briefcase },
    { href: "/arena/messages",    label: "Messages",     icon: MessageSquare },
  ];
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/arena" className="font-bold text-lg flex-shrink-0" style={{ color: GRS_GREEN }}>The Arena</Link>
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link key={href} href={href}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${pathname === href ? "text-white" : "text-gray-600 hover:bg-gray-100"}`}
              style={pathname === href ? { background: GRS_GREEN } : {}}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: GRS_GREEN }}>{initials}</div>
      </div>
    </header>
  );
}

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7)  return `${d} days ago`;
  return new Date(iso).toLocaleDateString();
}

function PostingCard({ posting, token, onApply, onClose }: {
  posting: TalentPosting;
  token: string;
  onApply: (id: string) => void;
  onClose: (id: string) => void;
}) {
  const [expanded,  setExpanded]  = useState(false);
  const [applying,  setApplying]  = useState(false);
  const [note,      setNote]      = useState("");
  const [showForm,  setShowForm]  = useState(false);
  const [submitted, setSubmitted] = useState(posting.has_applied);

  const apply = async () => {
    setApplying(true);
    try {
      await fetch(`${API}/arena/talent-wanted/${posting.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cover_note: note }),
      });
      setSubmitted(true);
      setShowForm(false);
      onApply(posting.id);
    } catch {}
    setApplying(false);
  };

  const age = [posting.age_min, posting.age_max].filter(Boolean).join(" – ");

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm text-gray-900">{posting.title}</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${posting.status === "open" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {posting.status}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-gray-500">
            <span className="capitalize">{posting.sport}</span>
            <span>·</span>
            <span>{posting.position}</span>
            {age && <><span>·</span><span>Age {age}</span></>}
            <span>·</span>
            <span className="flex items-center gap-1"><MapPin size={10} />{posting.province}</span>
          </div>
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(posting.created_at)}</span>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: GRS_GREEN }}>
          {posting.poster_name.charAt(0).toUpperCase()}
        </div>
        <span>{posting.poster_name}</span>
        <span className="capitalize text-gray-400">· {posting.poster_role}</span>
        <span className="ml-auto">{posting.application_count} applicant{posting.application_count !== 1 ? "s" : ""}</span>
      </div>

      {/* Description toggle */}
      {posting.description && (
        <button onClick={() => setExpanded((v) => !v)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {expanded ? "Less" : "More details"}
        </button>
      )}
      {expanded && posting.description && (
        <p className="text-xs text-gray-600 leading-relaxed">{posting.description}</p>
      )}

      {/* Apply */}
      {posting.status === "open" && (
        <div>
          {submitted ? (
            <div className="flex items-center gap-2 text-xs font-medium" style={{ color: GRS_GREEN }}>
              <span>✓</span><span>Application submitted</span>
            </div>
          ) : !showForm ? (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full text-white"
              style={{ background: GRS_GREEN }}>
              <Send size={12} /> Apply Now
            </button>
          ) : (
            <div className="space-y-2">
              <textarea value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Why are you a good fit? (optional)"
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none resize-none" />
              <div className="flex gap-2">
                <button onClick={apply} disabled={applying}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-white disabled:opacity-50"
                  style={{ background: GRS_GREEN }}>
                  {applying ? "Sending..." : "Submit Application"}
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-full text-xs border border-gray-200 text-gray-600">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NewPostingModal({ token, onCreated, onClose }: {
  token: string;
  onCreated: (posting: TalentPosting) => void;
  onClose: () => void;
}) {
  const SPORTS    = ["Football", "Rugby", "Netball", "Basketball", "Cricket", "Athletics", "Swimming", "Tennis", "Volleyball", "Hockey"];
  const PROVINCES = ["Harare", "Bulawayo", "Manicaland", "Mashonaland Central", "Mashonaland East", "Mashonaland West", "Masvingo", "Matabeleland North", "Matabeleland South", "Midlands"];

  const [form, setForm] = useState({
    title: "", sport: "Football", position: "", province: "Harare",
    tier: "Division 2", age_min: "", age_max: "", description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title.trim() || !form.position.trim()) { setError("Title and position are required."); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/arena/talent-wanted`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          age_min: form.age_min ? parseInt(form.age_min) : null,
          age_max: form.age_max ? parseInt(form.age_max) : null,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        onCreated(json.data ?? json);
      } else {
        setError("Failed to post. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base text-gray-900">Post Talent Listing</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-xs text-red-700">{error}</div>}

        <div className="space-y-3">
          <input value={form.title} onChange={(e) => set("title", e.target.value)}
            placeholder="Title (e.g. Seeking centre forward U18)"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.sport} onChange={(e) => set("sport", e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none">
              {SPORTS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <input value={form.position} onChange={(e) => set("position", e.target.value)}
              placeholder="Position / Role"
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.province} onChange={(e) => set("province", e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none">
              {PROVINCES.map((p) => <option key={p}>{p}</option>)}
            </select>
            <input value={form.tier} onChange={(e) => set("tier", e.target.value)}
              placeholder="Division / Tier"
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.age_min} onChange={(e) => set("age_min", e.target.value)}
              placeholder="Min age (optional)" type="number"
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
            <input value={form.age_max} onChange={(e) => set("age_max", e.target.value)}
              placeholder="Max age (optional)" type="number"
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
          </div>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
            placeholder="What are you looking for? Requirements, trial details, contact info..."
            rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none resize-none" />
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={submit} disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: GRS_GREEN }}>
            {submitting ? "Posting..." : "Post Listing"}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-600">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function RecruitmentPage() {
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [postings,    setPostings]    = useState<TalentPosting[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showCreate,  setShowCreate]  = useState(false);
  const [sport,       setSport]       = useState("");
  const [province,    setProvince]    = useState("");

  const SPORTS    = ["Football", "Rugby", "Netball", "Basketball", "Cricket", "Athletics", "Swimming", "Tennis", "Volleyball", "Hockey"];
  const PROVINCES = ["Harare", "Bulawayo", "Manicaland", "Mashonaland Central", "Mashonaland East", "Mashonaland West", "Masvingo", "Matabeleland North", "Matabeleland South", "Midlands"];

  useEffect(() => {
    if (!token) return;
    const params = new URLSearchParams();
    if (sport)    params.set("sport", sport);
    if (province) params.set("province", province);
    setLoading(true);
    fetch(`${API}/arena/talent-wanted?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : { data: [] })
      .then((json) => setPostings(safeArray(json.data ?? json)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, sport, province]);

  if (!hasHydrated || !user) return null;
  const userName = user.name ?? "You";
  const canPost  = user.role === "coach" || user.role === "scout" || user.role === "admin";

  return (
    <div style={{ minHeight: "100vh", background: BG }}>
      <ArenaNav userName={userName} />

      {showCreate && token && (
        <NewPostingModal
          token={token}
          onCreated={(p) => { setPostings((ps) => [p, ...ps]); setShowCreate(false); }}
          onClose={() => setShowCreate(false)}
        />
      )}

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Talent Board</h1>
            <p className="text-sm text-gray-500 mt-0.5">Coaches and scouts posting opportunities across Zimbabwe</p>
          </div>
          {canPost && (
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full text-white"
              style={{ background: GRS_GREEN }}>
              <Plus size={15} /> Post Listing
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <select value={sport} onChange={(e) => setSport(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-full border border-gray-200 bg-white outline-none">
            <option value="">All sports</option>
            {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={province} onChange={(e) => setProvince(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-full border border-gray-200 bg-white outline-none">
            <option value="">All provinces</option>
            {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Listings */}
        {loading ? (
          <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-28 bg-white rounded-xl animate-pulse" />)}</div>
        ) : postings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <Briefcase className="mx-auto mb-3 text-gray-300" size={32} />
            <p className="text-sm text-gray-500">No listings yet.</p>
            {canPost && (
              <button onClick={() => setShowCreate(true)} className="mt-2 text-sm font-semibold" style={{ color: GRS_GREEN }}>
                Post the first listing
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {postings.map((p) => (
              <PostingCard
                key={p.id}
                posting={p}
                token={token ?? ""}
                onApply={(id) => setPostings((ps) => ps.map((x) => x.id === id ? { ...x, has_applied: true, application_count: x.application_count + 1 } : x))}
                onClose={(id) => setPostings((ps) => ps.map((x) => x.id === id ? { ...x, status: "closed" } : x))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

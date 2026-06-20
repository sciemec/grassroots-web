"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Users, Briefcase, MessageSquare, Home, UserPlus, Check, X } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const API = process.env.NEXT_PUBLIC_API_URL;
const GRS_GREEN = "#1a5c2a";
const BG        = "#f4f2ee";

function safeArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

interface Connection {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  requester?: { id: string; name: string; role: string; sport?: string; province?: string };
  recipient?: { id: string; name: string; role: string; sport?: string; province?: string };
}

interface SuggestedUser {
  id: string;
  name: string;
  role: string;
  sport?: string;
  province?: string;
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

function UserCard({ user, token, onConnect }: { user: SuggestedUser; token: string; onConnect: (id: string) => void }) {
  const [sent, setSent] = useState(false);
  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const connect = async () => {
    setSent(true);
    try {
      await fetch(`${API}/arena/connect/${user.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      onConnect(user.id);
    } catch { setSent(false); }
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: GRS_GREEN }}>{initials}</div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900 truncate">{user.name}</p>
        <p className="text-xs text-gray-500 capitalize">{[user.role, user.sport, user.province].filter(Boolean).join(" · ")}</p>
      </div>
      <button onClick={connect} disabled={sent}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50"
        style={sent ? { background: "#f0fdf4", borderColor: "#bbf7d0", color: GRS_GREEN } : { borderColor: GRS_GREEN, color: GRS_GREEN }}>
        <UserPlus size={13} />
        {sent ? "Sent" : "Connect"}
      </button>
    </div>
  );
}

export default function NetworkPage() {
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [connections, setConnections]   = useState<Connection[]>([]);
  const [pending, setPending]           = useState<Connection[]>([]);
  const [suggested, setSuggested]       = useState<SuggestedUser[]>([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState<"connections" | "pending" | "discover">("connections");

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setLoading(true);
      try {
        const [connRes, pendingRes, sugRes] = await Promise.allSettled([
          fetch(`${API}/arena/connections`,         { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/arena/connections/pending`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/arena/discover`,            { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (connRes.status === "fulfilled" && connRes.value.ok) {
          const json = await connRes.value.json();
          setConnections(safeArray<Connection>(json.data ?? json));
        }
        if (pendingRes.status === "fulfilled" && pendingRes.value.ok) {
          const json = await pendingRes.value.json();
          setPending(safeArray<Connection>(json.data ?? json));
        }
        if (sugRes.status === "fulfilled" && sugRes.value.ok) {
          const json = await sugRes.value.json();
          setSuggested(safeArray<SuggestedUser>(json.data ?? json).slice(0, 12));
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [token]);

  const respond = async (id: string, status: "accepted" | "declined") => {
    try {
      await fetch(`${API}/arena/connect/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({ status }),
      });
      setPending((p) => p.filter((c) => c.id !== id));
      if (status === "accepted") {
        const conn = pending.find((c) => c.id === id);
        if (conn) setConnections((c) => [...c, { ...conn, status: "accepted" }]);
      }
    } catch {}
  };

  if (!hasHydrated || !user) return null;
  const userName = user.name ?? "You";

  const renderConnection = (c: Connection) => {
    const other = c.requester_id === user.id ? c.recipient : c.requester;
    const initials = other?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "?";
    const isPending = c.status === "pending" && c.recipient_id === user.id;
    return (
      <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: GRS_GREEN }}>{initials}</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900">{other?.name ?? "User"}</p>
          <p className="text-xs text-gray-500 capitalize">{[other?.role, other?.sport, other?.province].filter(Boolean).join(" · ")}</p>
        </div>
        {isPending && (
          <div className="flex gap-2">
            <button onClick={() => respond(c.id, "accepted")} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full text-white" style={{ background: GRS_GREEN }}><Check size={12} /> Accept</button>
            <button onClick={() => respond(c.id, "declined")} className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-300 text-gray-600"><X size={12} /> Decline</button>
          </div>
        )}
        {!isPending && c.status === "accepted" && (
          <Link href={`/arena/messages?user=${other?.id}`} className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors" style={{ borderColor: GRS_GREEN, color: GRS_GREEN }}>Message</Link>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: BG }}>
      <ArenaNav userName={userName} />
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div className="flex gap-2">
          {(["connections", "pending", "discover"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === t ? "text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              style={tab === t ? { background: GRS_GREEN } : {}}>
              {t === "connections" ? `Connections (${connections.length})` : t === "pending" ? `Pending (${pending.length})` : "Discover"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}</div>
        ) : tab === "connections" ? (
          connections.length === 0
            ? <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-500">No connections yet. Discover people to connect with.</div>
            : <div className="space-y-3">{connections.map(renderConnection)}</div>
        ) : tab === "pending" ? (
          pending.length === 0
            ? <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-500">No pending requests.</div>
            : <div className="space-y-3">{pending.map(renderConnection)}</div>
        ) : (
          suggested.length === 0
            ? <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-500">No suggestions available right now.</div>
            : <div className="space-y-3">{suggested.map((u) => <UserCard key={u.id} user={u} token={token ?? ""} onConnect={(id) => setSuggested((s) => s.filter((x) => x.id !== id))} />)}</div>
        )}
      </div>
    </div>
  );
}

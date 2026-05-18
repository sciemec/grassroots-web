"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, UserCheck, UserPlus, Clock, MessageSquare,
  Search, UserMinus, Check, X, Zap, ChevronDown,
} from "lucide-react";
import { useAuthStore, roleHomePath } from "@/lib/auth-store";
import { safeArray } from "@/lib/safe-array";
import type { ArenaConnection, ArenaFollow, ArenaUser } from "@/types/arena";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

type Tab = "connections" | "followers" | "following" | "pending";

const ROLE_BADGE: Record<string, string> = {
  player: "bg-emerald-50 text-emerald-700 border-emerald-200",
  coach:  "bg-blue-50 text-blue-700 border-blue-200",
  scout:  "bg-purple-50 text-purple-700 border-purple-200",
  fan:    "bg-amber-50 text-amber-700 border-amber-200",
  admin:  "bg-red-50 text-red-700 border-red-200",
};

function initials(name: string): string {
  if (!name) return "??";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Arena Top Nav ────────────────────────────────────────────────────────────
function ArenaNav() {
  const { user } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const hubs = [
    { label: "Player Hub",   href: "/player" },
    { label: "Coach Hub",    href: "/coach" },
    { label: "Fan Hub",      href: "/fan-hub" },
    { label: "Analysis Hub", href: "/analyst" },
    { label: "Scout Hub",    href: "/scout" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_v2.png" alt="Grassroots" width={28} height={28} className="rounded" />
          <span className="font-black text-sm tracking-tight" style={{ color: "#1a5c2a" }}>
            The Arena
          </span>
        </Link>

        {/* Hub links — desktop */}
        <nav className="hidden md:flex items-center gap-5">
          {hubs.map((h) => (
            <Link
              key={h.href}
              href={h.href}
              className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
            >
              {h.label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/arena/messages"
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors"
            style={{ borderColor: "#1a5c2a", color: "#1a5c2a" }}
          >
            <MessageSquare size={12} />
            Messages
          </Link>

          {user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 text-xs font-semibold text-gray-700 hover:text-gray-900 transition-colors"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black shrink-0"
                  style={{ background: "#1a5c2a" }}
                >
                  {initials(user.name ?? "")}
                </div>
                <span className="hidden sm:block">{user.name?.split(" ")[0]}</span>
                <ChevronDown size={12} className="text-gray-400" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-9 w-44 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50">
                  <Link
                    href={roleHomePath(user.role)}
                    className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    My Hub
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    Settings
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-9 h-9 text-xs" : "w-11 h-11 text-sm";
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center text-white font-black shrink-0`}
      style={{ background: "linear-gradient(135deg, #1a5c2a 0%, #2d7a3e 100%)" }}
    >
      {initials(name)}
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-5 py-4 animate-pulse">
      <div className="w-11 h-11 rounded-full bg-gray-100 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-gray-100 rounded-full w-1/3" />
        <div className="h-3 bg-gray-100 rounded-full w-1/4" />
      </div>
      <div className="h-8 w-20 bg-gray-100 rounded-full" />
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, body }: {
  icon: React.ElementType; title: string; body: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
        <Icon size={20} className="text-gray-300" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-700">{title}</p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">{body}</p>
      </div>
      <Link
        href="/arena/discover"
        className="text-xs font-bold px-4 py-2 rounded-full transition-opacity hover:opacity-85 mt-1"
        style={{ backgroundColor: "#1a5c2a", color: "#fff" }}
      >
        Discover Athletes
      </Link>
    </div>
  );
}

// ── Person card ───────────────────────────────────────────────────────────────
interface PersonCardProps {
  user: ArenaUser;
  tab: Tab;
  onMessage?: (id: string) => void;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onUnfollow?: (id: string) => void;
  onConnect?: (id: string) => void;
  connectionId?: string;
  connectedAt?: string | null;
  message?: string | null;
  isConnecting?: boolean;
}

function PersonCard({
  user, tab, onMessage, onAccept, onDecline, onUnfollow, onConnect,
  connectionId, connectedAt, message, isConnecting,
}: PersonCardProps) {
  const [busy, setBusy] = useState(false);
  const badgeClass = ROLE_BADGE[user.role] ?? ROLE_BADGE.player;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  return (
    <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
      <Avatar name={user.name} />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user.name || "Arena User"}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold capitalize ${badgeClass}`}>
                {user.role}
              </span>
              {user.sport && (
                <span className="text-[10px] text-gray-400 capitalize">{user.sport}</span>
              )}
              {user.province && (
                <span className="text-[10px] text-gray-400">· {user.province}</span>
              )}
            </div>
            {tab === "pending" && message && (
              <p className="text-xs text-gray-400 mt-1.5 italic truncate">&ldquo;{message}&rdquo;</p>
            )}
            {tab === "connections" && connectedAt && (
              <p className="text-[10px] text-gray-400 mt-1">Connected {timeAgo(connectedAt)}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0 items-center">
            {tab === "connections" && (
              <button
                onClick={() => onMessage?.(user.id)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <MessageSquare size={11} />
                Message
              </button>
            )}

            {tab === "pending" && connectionId && (
              <>
                <button
                  disabled={busy}
                  onClick={() => run(() => onAccept!(connectionId))}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-bold text-white disabled:opacity-40 transition-opacity hover:opacity-85"
                  style={{ backgroundColor: "#1a5c2a" }}
                >
                  <Check size={11} />
                  Accept
                </button>
                <button
                  disabled={busy}
                  onClick={() => run(() => onDecline!(connectionId))}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-semibold border border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors"
                >
                  <X size={11} />
                  Decline
                </button>
              </>
            )}

            {tab === "following" && (
              <button
                disabled={busy}
                onClick={() => run(() => onUnfollow!(user.id))}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold border border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors"
              >
                <UserMinus size={11} />
                Unfollow
              </button>
            )}

            {tab === "followers" && (
              <button
                disabled={busy || isConnecting}
                onClick={() => run(() => onConnect!(user.id))}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-bold text-white disabled:opacity-40 transition-opacity hover:opacity-85"
                style={{ backgroundColor: "#c8962a" }}
              >
                <UserPlus size={11} />
                Connect
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Discover card ─────────────────────────────────────────────────────────────
interface DiscoverPlayer {
  id: string;
  name?: string;
  initials?: string;
  role?: string;
  sport?: string;
  province?: string;
}

function DiscoverCard({ player, onConnect, sent }: {
  player: DiscoverPlayer;
  onConnect: (id: string) => Promise<void>;
  sent: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const badgeClass = ROLE_BADGE[player.role ?? "player"] ?? ROLE_BADGE.player;
  const displayName = player.name ?? player.initials ?? "Arena User";

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
      <Avatar name={displayName} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-900 truncate">{displayName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold capitalize ${badgeClass}`}>
            {player.role ?? "player"}
          </span>
          {player.sport && <span className="text-[10px] text-gray-400 capitalize">{player.sport}</span>}
          {player.province && <span className="text-[10px] text-gray-400">· {player.province}</span>}
        </div>
      </div>
      {sent ? (
        <span className="text-[10px] text-gray-400 font-semibold">Sent ✓</span>
      ) : (
        <button
          disabled={busy}
          onClick={async () => { setBusy(true); await onConnect(player.id); setBusy(false); }}
          className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-full font-bold text-white disabled:opacity-40 transition-opacity hover:opacity-85 shrink-0"
          style={{ backgroundColor: "#c8962a" }}
        >
          <UserPlus size={10} />
          Connect
        </button>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MyNetworkPage() {
  const router = useRouter();
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [tab, setTab]               = useState<Tab>("connections");
  const [loading, setLoading]       = useState(true);
  const [connections, setConnections] = useState<ArenaConnection[]>([]);
  const [followers, setFollowers]   = useState<ArenaFollow[]>([]);
  const [following, setFollowing]   = useState<ArenaFollow[]>([]);
  const [pending, setPending]       = useState<ArenaConnection[]>([]);

  const [query, setQuery]           = useState("");
  const [searching, setSearching]   = useState(false);
  const [results, setResults]       = useState<DiscoverPlayer[]>([]);
  const [sentIds, setSentIds]       = useState<Set<string>>(new Set());

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [c, flr, flo, p] = await Promise.allSettled([
      fetch(`${API}/arena/connections`,        { headers }).then((r) => r.json()),
      fetch(`${API}/arena/followers`,           { headers }).then((r) => r.json()),
      fetch(`${API}/arena/following`,           { headers }).then((r) => r.json()),
      fetch(`${API}/arena/connections/pending`, { headers }).then((r) => r.json()),
    ]);
    if (c.status   === "fulfilled") setConnections(safeArray(c.value));
    if (flr.status === "fulfilled") setFollowers(safeArray(flr.value));
    if (flo.status === "fulfilled") setFollowing(safeArray(flo.value));
    if (p.status   === "fulfilled") setPending(safeArray(p.value));
    setLoading(false);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `${API}/players/discover?search=${encodeURIComponent(query)}&per_page=8`,
          { headers }
        );
        const data = await res.json();
        setResults(safeArray<DiscoverPlayer>(data?.data ?? data));
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAccept = async (connectionId: string) => {
    await fetch(`${API}/arena/connect/${connectionId}`, {
      method: "PATCH", headers,
      body: JSON.stringify({ status: "accepted" }),
    });
    fetchAll();
  };

  const handleDecline = async (connectionId: string) => {
    await fetch(`${API}/arena/connect/${connectionId}`, {
      method: "PATCH", headers,
      body: JSON.stringify({ status: "declined" }),
    });
    fetchAll();
  };

  const handleUnfollow = async (userId: string) => {
    await fetch(`${API}/arena/follow/${userId}`, { method: "POST", headers });
    fetchAll();
  };

  const handleConnect = async (userId: string) => {
    await fetch(`${API}/arena/connect/${userId}`, {
      method: "POST", headers,
      body: JSON.stringify({ message: "Hi, I'd like to connect!" }),
    });
    setSentIds((prev) => new Set(prev).add(userId));
  };

  const getOtherUser = (conn: ArenaConnection): ArenaUser | undefined => {
    if (!user) return undefined;
    return conn.requester_id === user.id ? conn.recipient : conn.requester;
  };

  const TABS: { key: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { key: "connections", label: "Connections", icon: UserCheck, count: connections.length },
    { key: "followers",   label: "Followers",   icon: Users,     count: followers.length },
    { key: "following",   label: "Following",   icon: Zap,       count: following.length },
    { key: "pending",     label: "Pending",     icon: Clock,     count: pending.length },
  ];

  return (
    <div style={{ backgroundColor: "#f4f2ee", minHeight: "100vh" }}>
      <ArenaNav />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "#1a5c2a" }}>
            My Network
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Your professional sports circle on The Arena
          </p>
        </div>

        {/* Stats / Tab picker */}
        <div className="grid grid-cols-4 gap-2">
          {TABS.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`relative flex flex-col items-center gap-1 py-3 rounded-2xl border text-center transition-all ${
                tab === key
                  ? "bg-white border-gray-200 shadow-sm"
                  : "bg-white/60 border-transparent hover:bg-white hover:border-gray-200"
              }`}
            >
              <span
                className={`text-xl font-black leading-none ${
                  tab === key ? "" : "text-gray-400"
                }`}
                style={tab === key ? { color: "#1a5c2a" } : {}}
              >
                {loading ? "—" : count}
              </span>
              <span
                className={`text-[10px] font-semibold ${
                  tab === key ? "text-gray-700" : "text-gray-400"
                }`}
              >
                {label}
              </span>
              {key === "pending" && !loading && count > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Discover panel — only on connections tab */}
        {tab === "connections" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Discover People</p>
            </div>
            <div className="px-5 py-3">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200 focus-within:border-gray-300 transition-colors">
                <Search size={14} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, sport or province…"
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
                />
                {searching && (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 border-t-gray-500 animate-spin shrink-0" />
                )}
              </div>
            </div>

            {results.length > 0 && (
              <div className="border-t border-gray-100">
                {results
                  .filter((p) => p.id !== user?.id)
                  .map((p) => (
                    <DiscoverCard
                      key={p.id}
                      player={p}
                      onConnect={handleConnect}
                      sent={sentIds.has(p.id)}
                    />
                  ))}
              </div>
            )}
            {query.trim() && !searching && results.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-5 px-4">
                No players found for &ldquo;{query}&rdquo;
              </p>
            )}
          </div>
        )}

        {/* List card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {TABS.find((t) => t.key === tab)?.label}
            </p>
            {!loading && (
              <span className="text-xs text-gray-400">
                {TABS.find((t) => t.key === tab)?.count ?? 0} total
              </span>
            )}
          </div>

          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          ) : (
            <>
              {tab === "connections" && (
                connections.length === 0 ? (
                  <EmptyState
                    icon={UserCheck}
                    title="No connections yet"
                    body="Search for players and coaches above to start building your network."
                  />
                ) : (
                  connections.map((conn) => {
                    const other = getOtherUser(conn);
                    return other ? (
                      <PersonCard
                        key={conn.id}
                        user={other}
                        tab="connections"
                        connectedAt={conn.accepted_at}
                        onMessage={(id) => router.push(`/arena/messages?with=${id}`)}
                      />
                    ) : null;
                  })
                )
              )}

              {tab === "followers" && (
                followers.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No followers yet"
                    body="Share your passport link and people will start following you."
                  />
                ) : (
                  followers.map((f) =>
                    f.follower ? (
                      <PersonCard
                        key={f.id}
                        user={f.follower}
                        tab="followers"
                        onConnect={handleConnect}
                        isConnecting={sentIds.has(f.follower.id)}
                      />
                    ) : null
                  )
                )
              )}

              {tab === "following" && (
                following.length === 0 ? (
                  <EmptyState
                    icon={Zap}
                    title="Not following anyone yet"
                    body="Follow coaches, scouts and players to stay up to date with their activity."
                  />
                ) : (
                  following.map((f) =>
                    f.following ? (
                      <PersonCard
                        key={f.id}
                        user={f.following}
                        tab="following"
                        onUnfollow={handleUnfollow}
                      />
                    ) : null
                  )
                )
              )}

              {tab === "pending" && (
                pending.length === 0 ? (
                  <EmptyState
                    icon={Clock}
                    title="No pending requests"
                    body="When someone sends you a connection request, it will appear here."
                  />
                ) : (
                  pending.map((conn) =>
                    conn.requester ? (
                      <PersonCard
                        key={conn.id}
                        user={conn.requester}
                        tab="pending"
                        connectionId={conn.id}
                        message={conn.message}
                        onAccept={handleAccept}
                        onDecline={handleDecline}
                      />
                    ) : null
                  )
                )
              )}
            </>
          )}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 pb-6">
          Only connected users can send direct messages to each other.
        </p>
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users, UserCheck, UserPlus, Clock, MessageSquare,
  Search, UserMinus, Check, X, ArrowLeft, Zap,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuthStore } from "@/lib/auth-store";
import { safeArray } from "@/lib/safe-array";
import type { ArenaConnection, ArenaFollow, ArenaUser } from "@/types/arena";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

type Tab = "connections" | "followers" | "following" | "pending";

const ROLE_META: Record<string, { label: string; color: string; dot: string }> = {
  player: { label: "Player", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400" },
  coach:  { label: "Coach",  color: "bg-blue-500/20 text-blue-300 border-blue-500/30",          dot: "bg-blue-400" },
  scout:  { label: "Scout",  color: "bg-purple-500/20 text-purple-300 border-purple-500/30",    dot: "bg-purple-400" },
  fan:    { label: "Fan",    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",        dot: "bg-amber-400" },
  admin:  { label: "Admin",  color: "bg-red-500/20 text-red-300 border-red-500/30",              dot: "bg-red-400" },
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

// ── Avatar ─────────────────────────────────────────────────────────────────
function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sz = { sm: "w-9 h-9 text-xs", md: "w-11 h-11 text-sm", lg: "w-14 h-14 text-base" }[size];
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ background: "linear-gradient(135deg, #1a5c2a 0%, #2d7a3e 100%)" }}>
      {initials(name)}
    </div>
  );
}

// ── Skeleton ────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 p-4 animate-pulse">
      <div className="w-11 h-11 rounded-full bg-white/10 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-white/10 rounded-full w-1/3" />
        <div className="h-3 bg-white/10 rounded-full w-1/4" />
      </div>
      <div className="h-8 w-20 bg-white/10 rounded-xl" />
    </div>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, body, cta, onCta }: {
  icon: React.ElementType; title: string; body: string;
  cta?: string; onCta?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center gap-4">
      <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
        <Icon size={22} className="text-white/30" />
      </div>
      <div>
        <p className="text-white font-semibold text-sm">{title}</p>
        <p className="text-white/40 text-xs mt-1 max-w-xs mx-auto">{body}</p>
      </div>
      {cta && onCta && (
        <button
          onClick={onCta}
          className="text-xs px-4 py-2 rounded-xl font-bold text-[#1a3a1a] transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#f0b429" }}
        >
          {cta}
        </button>
      )}
    </div>
  );
}

// ── Person card ─────────────────────────────────────────────────────────────
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
  const meta = ROLE_META[user.role] ?? ROLE_META.player;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  return (
    <div className="group flex items-start gap-3 p-4 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
      <Avatar name={user.name} />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm truncate leading-snug">
              {user.name || "Arena User"}
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold ${meta.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
              {user.sport && (
                <span className="text-[10px] text-white/40 capitalize">{user.sport}</span>
              )}
              {user.province && (
                <span className="text-[10px] text-white/30">· {user.province}</span>
              )}
            </div>
            {tab === "pending" && message && (
              <p className="text-xs text-white/40 mt-1.5 italic truncate">&ldquo;{message}&rdquo;</p>
            )}
            {tab === "connections" && connectedAt && (
              <p className="text-[10px] text-white/25 mt-1">Connected {timeAgo(connectedAt)}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-1.5 shrink-0 items-center">
            {tab === "connections" && (
              <button
                onClick={() => onMessage?.(user.id)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-semibold border border-white/15 text-white/70 hover:border-[#f0b429]/50 hover:text-[#f0b429] transition-colors"
              >
                <MessageSquare size={12} />
                <span>Message</span>
              </button>
            )}

            {tab === "pending" && connectionId && (
              <>
                <button
                  disabled={busy}
                  onClick={() => run(() => onAccept!(connectionId))}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl font-bold text-white disabled:opacity-40 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#1a5c2a" }}
                >
                  <Check size={12} />
                  Accept
                </button>
                <button
                  disabled={busy}
                  onClick={() => run(() => onDecline!(connectionId))}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl font-semibold border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-colors"
                >
                  <X size={12} />
                  Decline
                </button>
              </>
            )}

            {tab === "following" && (
              <button
                disabled={busy}
                onClick={() => run(() => onUnfollow!(user.id))}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-semibold border border-white/15 text-white/50 hover:border-red-500/40 hover:text-red-400 disabled:opacity-40 transition-colors"
              >
                <UserMinus size={12} />
                Unfollow
              </button>
            )}

            {tab === "followers" && (
              <button
                disabled={busy || isConnecting}
                onClick={() => run(() => onConnect!(user.id))}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-bold disabled:opacity-40 transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#f0b429", color: "#1a3a1a" }}
              >
                <UserPlus size={12} />
                Connect
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Discover search result ──────────────────────────────────────────────────
interface DiscoverPlayer {
  id: string;
  name?: string;
  initials?: string;
  role?: string;
  sport?: string;
  province?: string;
  age_group?: string;
}

function DiscoverCard({
  player, onConnect, sent,
}: { player: DiscoverPlayer; onConnect: (id: string) => Promise<void>; sent: boolean }) {
  const [busy, setBusy] = useState(false);
  const meta = ROLE_META[player.role ?? "player"] ?? ROLE_META.player;
  const displayName = player.name ?? player.initials ?? "Arena User";

  return (
    <div className="flex items-center gap-3 p-3 border-b border-white/5 last:border-0">
      <Avatar name={displayName} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-semibold truncate">{displayName}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${meta.color}`}>
            {meta.label}
          </span>
          {player.sport && <span className="text-[10px] text-white/40 capitalize">{player.sport}</span>}
          {player.province && <span className="text-[10px] text-white/30">· {player.province}</span>}
        </div>
      </div>
      {sent ? (
        <span className="text-[10px] text-white/30 font-semibold px-2">Sent ✓</span>
      ) : (
        <button
          disabled={busy}
          onClick={async () => { setBusy(true); await onConnect(player.id); setBusy(false); }}
          className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg font-bold disabled:opacity-40 transition-opacity hover:opacity-90 shrink-0"
          style={{ backgroundColor: "#f0b429", color: "#1a3a1a" }}
        >
          <UserPlus size={10} />
          Connect
        </button>
      )}
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function MyNetworkPage() {
  const router = useRouter();
  const { user, token } = useAuthStore((s) => ({ user: s.user, token: s.token }));

  const [tab, setTab]               = useState<Tab>("connections");
  const [loading, setLoading]       = useState(true);
  const [connections, setConnections] = useState<ArenaConnection[]>([]);
  const [followers, setFollowers]   = useState<ArenaFollow[]>([]);
  const [following, setFollowing]   = useState<ArenaFollow[]>([]);
  const [pending, setPending]       = useState<ArenaConnection[]>([]);

  // Discover panel
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

  // Discover search
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
    await fetch(`${API}/arena/connect/${userId}`, { method: "POST", headers,
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
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

          {/* Back + header */}
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs mb-3 transition-colors"
            >
              <ArrowLeft size={13} /> Back
            </button>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">My Network</h1>
                <p className="text-white/40 text-sm mt-0.5">The Arena · your professional sports circle</p>
              </div>
              <button
                onClick={() => router.push("/arena/messages")}
                className="flex items-center gap-2 text-xs px-4 py-2 rounded-xl font-bold transition-opacity hover:opacity-90 shrink-0"
                style={{ backgroundColor: "#f0b429", color: "#1a3a1a" }}
              >
                <MessageSquare size={13} />
                Messages
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2">
            {TABS.map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex flex-col items-center gap-1 py-3 rounded-2xl border transition-all ${
                  tab === key
                    ? "border-[#f0b429]/40 bg-[#f0b429]/10"
                    : "border-white/8 bg-white/4 hover:bg-white/7"
                }`}
              >
                <Icon size={16} className={tab === key ? "text-[#f0b429]" : "text-white/40"} />
                <span className={`text-lg font-black leading-none ${tab === key ? "text-[#f0b429]" : "text-white"}`}>
                  {loading ? "—" : count}
                </span>
                <span className={`text-[10px] font-semibold ${tab === key ? "text-[#f0b429]/80" : "text-white/30"}`}>
                  {label}
                </span>
                {key === "pending" && !loading && count > 0 && (
                  <span className="w-2 h-2 rounded-full bg-red-500 mt-0.5" />
                )}
              </button>
            ))}
          </div>

          {/* Discover people (connections tab only) */}
          {tab === "connections" && (
            <div className="rounded-2xl border border-white/10 bg-white/4 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/8">
                <p className="text-xs font-bold text-white/60 uppercase tracking-wider">Discover People</p>
              </div>
              <div className="px-4 py-3">
                <div className="flex items-center gap-2 bg-white/6 rounded-xl px-3 py-2 border border-white/10 focus-within:border-[#f0b429]/40">
                  <Search size={14} className="text-white/30 shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, sport or province…"
                    className="flex-1 bg-transparent text-sm text-white placeholder-white/25 focus:outline-none"
                  />
                  {searching && (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white/60 animate-spin shrink-0" />
                  )}
                </div>
              </div>
              {results.length > 0 && (
                <div className="border-t border-white/8">
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
                <p className="text-xs text-white/30 text-center py-5 px-4">No players found for &ldquo;{query}&rdquo;</p>
              )}
            </div>
          )}

          {/* List panel */}
          <div className="rounded-2xl border border-white/10 bg-white/4 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
              <p className="text-xs font-bold text-white/60 uppercase tracking-wider">
                {TABS.find((t) => t.key === tab)?.label}
              </p>
              {!loading && (
                <span className="text-xs text-white/30">
                  {TABS.find((t) => t.key === tab)?.count ?? 0} total
                </span>
              )}
            </div>

            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              <>
                {/* Connections */}
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

                {/* Followers */}
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

                {/* Following */}
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

                {/* Pending */}
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

        </div>
      </main>
    </div>
  );
}

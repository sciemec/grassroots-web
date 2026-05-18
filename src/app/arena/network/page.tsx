"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { safeArray } from "@/lib/safe-array";
import type { ArenaConnection, ArenaFollow, ArenaUser } from "@/types/arena";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

type Tab = "connections" | "followers" | "following" | "pending";

const ROLE_COLOURS: Record<string, string> = {
  player: "bg-green-100 text-green-800",
  coach:  "bg-blue-100 text-blue-800",
  scout:  "bg-purple-100 text-purple-800",
  fan:    "bg-amber-100 text-amber-800",
  admin:  "bg-red-100 text-red-800",
};

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-4 animate-pulse">
      <div className="w-11 h-11 rounded-full bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
  );
}

interface UserCardProps {
  user: ArenaUser;
  tab: Tab;
  currentUserId: number;
  onAccept?: (id: number) => void;
  onDecline?: (id: number) => void;
  onUnfollow?: (id: number) => void;
  connectionId?: number;
}

function UserCard({ user, tab, onAccept, onDecline, onUnfollow, connectionId }: UserCardProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handle = async (action: () => Promise<void>) => {
    setBusy(true);
    try { await action(); } finally { setBusy(false); }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
        style={{ backgroundColor: "#1a5c2a" }}
      >
        {initials(user.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">{user.name}</p>
        <div className="flex flex-wrap items-center gap-1 mt-0.5">
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLOURS[user.role] ?? "bg-gray-100 text-gray-600"}`}>
            {user.role}
          </span>
          {user.sport && <span className="text-xs text-gray-500">{user.sport}</span>}
          {user.province && <span className="text-xs text-gray-400">· {user.province}</span>}
          {user.thuto_score != null && (
            <span className="text-xs text-amber-600 font-medium">⭐ {user.thuto_score}</span>
          )}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        {tab === "connections" && (
          <button
            onClick={() => router.push(`/arena/messages?with=${user.id}`)}
            className="text-xs px-3 py-1.5 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Message
          </button>
        )}
        {tab === "pending" && connectionId != null && (
          <>
            <button
              disabled={busy}
              onClick={() => handle(() => onAccept!(connectionId))}
              className="text-xs px-3 py-1.5 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              Accept
            </button>
            <button
              disabled={busy}
              onClick={() => handle(() => onDecline!(connectionId))}
              className="text-xs px-3 py-1.5 rounded-lg font-medium border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Decline
            </button>
          </>
        )}
        {tab === "following" && (
          <button
            disabled={busy}
            onClick={() => handle(() => onUnfollow!(user.id))}
            className="text-xs px-3 py-1.5 rounded-lg font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Unfollow
          </button>
        )}
      </div>
    </div>
  );
}

export default function MyNetworkPage() {
  const { user, token } = useAuthStore((s) => ({ user: s.user, token: s.token }));
  const [tab, setTab] = useState<Tab>("connections");
  const [loading, setLoading] = useState(true);

  const [connections, setConnections] = useState<ArenaConnection[]>([]);
  const [followers, setFollowers]     = useState<ArenaFollow[]>([]);
  const [following, setFollowing]     = useState<ArenaFollow[]>([]);
  const [pending, setPending]         = useState<ArenaConnection[]>([]);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [c, flr, flo, p] = await Promise.allSettled([
      fetch(`${API}/arena/connections`,         { headers }).then((r) => r.json()),
      fetch(`${API}/arena/followers`,            { headers }).then((r) => r.json()),
      fetch(`${API}/arena/following`,            { headers }).then((r) => r.json()),
      fetch(`${API}/arena/connections/pending`,  { headers }).then((r) => r.json()),
    ]);
    if (c.status   === "fulfilled") setConnections(safeArray(c.value));
    if (flr.status === "fulfilled") setFollowers(safeArray(flr.value));
    if (flo.status === "fulfilled") setFollowing(safeArray(flo.value));
    if (p.status   === "fulfilled") setPending(safeArray(p.value));
    setLoading(false);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAccept = async (connectionId: number) => {
    await fetch(`${API}/arena/connect/${connectionId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "accepted" }),
    });
    fetchAll();
  };

  const handleDecline = async (connectionId: number) => {
    await fetch(`${API}/arena/connect/${connectionId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "declined" }),
    });
    fetchAll();
  };

  const handleUnfollow = async (userId: number) => {
    await fetch(`${API}/arena/follow/${userId}`, { method: "POST", headers });
    fetchAll();
  };

  const getOtherUser = (conn: ArenaConnection): ArenaUser | undefined => {
    if (!user) return undefined;
    return conn.requester_id === Number(user.id) ? conn.recipient : conn.requester;
  };

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: "connections", label: "Connections", count: connections.length },
    { key: "followers",   label: "Followers",   count: followers.length },
    { key: "following",   label: "Following",   count: following.length },
    { key: "pending",     label: "Pending",     count: pending.length },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f4f2ee" }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Network</h1>
          <p className="text-sm text-gray-500 mt-1">
            Connections, followers and direct messages — The Arena
          </p>
        </div>

        {/* Tab bar */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className="flex border-b border-gray-100">
            {TABS.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 py-3 text-xs font-semibold relative transition-colors
                  ${tab === key ? "text-green-700 border-b-2 border-green-700" : "text-gray-500 hover:text-gray-700"}`}
              >
                {label}
                {count != null && count > 0 && (
                  <span
                    className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-bold
                      ${key === "pending" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div>
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : (
            <>
              {/* Connections */}
              {tab === "connections" && (
                connections.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-10">No connections yet. Find players and coaches to connect with.</p>
                ) : (
                  connections.map((conn) => {
                    const other = getOtherUser(conn);
                    return other ? (
                      <UserCard
                        key={conn.id}
                        user={other}
                        tab="connections"
                        currentUserId={Number(user?.id)}
                      />
                    ) : null;
                  })
                )
              )}

              {/* Followers */}
              {tab === "followers" && (
                followers.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-10">Nobody is following you yet.</p>
                ) : (
                  followers.map((f) =>
                    f.follower ? (
                      <UserCard
                        key={f.id}
                        user={f.follower}
                        tab="followers"
                        currentUserId={Number(user?.id)}
                      />
                    ) : null
                  )
                )
              )}

              {/* Following */}
              {tab === "following" && (
                following.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-10">You are not following anyone yet.</p>
                ) : (
                  following.map((f) =>
                    f.following ? (
                      <UserCard
                        key={f.id}
                        user={f.following}
                        tab="following"
                        currentUserId={Number(user?.id)}
                        onUnfollow={handleUnfollow}
                      />
                    ) : null
                  )
                )
              )}

              {/* Pending */}
              {tab === "pending" && (
                pending.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-10">No pending connection requests.</p>
                ) : (
                  pending.map((conn) =>
                    conn.requester ? (
                      <UserCard
                        key={conn.id}
                        user={conn.requester}
                        tab="pending"
                        currentUserId={Number(user?.id)}
                        connectionId={conn.id}
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
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Wifi, WifiOff, Clock, RefreshCw, X, LogIn } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

// localStorage keys that hold pending/local data to sync
const PENDING_KEYS = [
  { key: "gs_goal_missions",        label: "Goal missions",      endpoint: "/player/goal/mission" },
  { key: "gs_player_goal",          label: "Player goal",        endpoint: "/player/goal" },
  { key: "thuto_training_schedule", label: "Training schedule",  endpoint: "/training/schedule" },
  { key: "grs_active_session",      label: "Active session",     endpoint: null },
  { key: "grassroots_biz_members",  label: "Business members",   endpoint: null },
];

type SyncState = "checking" | "synced" | "pending" | "offline";

function countPendingItems(): { total: number; items: string[] } {
  if (typeof window === "undefined") return { total: 0, items: [] };
  const items: string[] = [];
  for (const { key, label } of PENDING_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) items.push(`${parsed.length} ${label}`);
      else if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) items.push(label);
    } catch {
      // ignore
    }
  }
  return { total: items.length, items };
}

async function pingApi(token: string | null): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/profile`, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: AbortSignal.timeout(5000),
    });
    return res.status !== 0;
  } catch {
    return false;
  }
}

export default function SyncStatusBadge() {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [state,       setState]       = useState<SyncState>("checking");
  const [open,        setOpen]        = useState(false);
  const [lastSynced,  setLastSynced]  = useState<Date | null>(null);
  const [pending,     setPending]     = useState<{ total: number; items: string[] }>({ total: 0, items: [] });
  const [syncing,     setSyncing]     = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const check = async () => {
    setState("checking");
    const isOnline = navigator.onLine;
    if (!isOnline) { setState("offline"); return; }
    const reachable = await pingApi(token);
    if (!reachable) { setState("offline"); return; }
    const p = countPendingItems();
    setPending(p);
    if (p.total > 0) { setState("pending"); }
    else { setState("synced"); setLastSynced(new Date()); }
  };

  // Check on mount and when online/offline
  useEffect(() => {
    check();
    const onOnline  = () => check();
    const onOffline = () => setState("offline");
    window.addEventListener("online",  onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online",  onOnline);
      window.removeEventListener("offline", onOffline);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSyncNow = async () => {
    if (!user || !token) return;
    setSyncing(true);
    try {
      // Sync goal missions
      const rawMissions = localStorage.getItem("gs_goal_missions");
      if (rawMissions) {
        const missions = JSON.parse(rawMissions);
        if (Array.isArray(missions)) {
          for (const m of missions) {
            try {
              await fetch(`${API_URL}/player/goal/mission`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(m),
              });
            } catch { /* continue */ }
          }
        }
      }
      // Sync training schedule
      const rawSchedule = localStorage.getItem("thuto_training_schedule");
      if (rawSchedule) {
        try {
          await fetch(`${API_URL}/training/schedule`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: rawSchedule,
          });
        } catch { /* continue */ }
      }
    } finally {
      setSyncing(false);
      await check();
    }
  };

  const COLOR: Record<SyncState, { bg: string; text: string; border: string }> = {
    checking: { bg: "#f3f4f6", text: "#6b7280", border: "#e5e7eb" },
    synced:   { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
    pending:  { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
    offline:  { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
  };

  const LABEL: Record<SyncState, string> = {
    checking: "Checking...",
    synced:   "Synced",
    pending:  `${pending.total} Pending`,
    offline:  "Offline",
  };

  const ICON: Record<SyncState, React.ReactNode> = {
    checking: <RefreshCw size={11} className="animate-spin" />,
    synced:   <ShieldCheck size={11} />,
    pending:  <Clock size={11} />,
    offline:  <WifiOff size={11} />,
  };

  const c = COLOR[state];

  return (
    <div className="relative" ref={dropRef}>
      {/* Badge button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg transition-all"
        style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}
        aria-label="Sync status"
      >
        {ICON[state]}
        {LABEL[state]}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 bottom-full mb-2 w-64 rounded-2xl shadow-xl z-50 overflow-hidden"
          style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #f3f4f6" }}>
            <p className="text-xs font-black uppercase tracking-wide text-gray-900">Sync Status</p>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700">
              <X size={14} />
            </button>
          </div>

          <div className="px-4 py-3 space-y-3">
            {/* Connection row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {state === "offline" ? <WifiOff size={14} className="text-red-500" /> : <Wifi size={14} className="text-green-600" />}
                <span className="text-[11px] font-semibold text-gray-700">
                  {state === "offline" ? "No connection" : "Connected to server"}
                </span>
              </div>
              <span
                className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full"
                style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}
              >
                {state}
              </span>
            </div>

            {/* Last synced */}
            {lastSynced && state !== "offline" && (
              <p className="text-[10px] text-gray-400">
                Last synced: {lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}

            {/* Guest message */}
            {!user && (
              <div className="rounded-xl p-3" style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <LogIn size={12} className="text-gray-500" />
                  <p className="text-[11px] font-bold text-gray-700">Sign in to sync</p>
                </div>
                <p className="text-[10px] text-gray-500 leading-snug">
                  Your data is saved locally. Sign in to back it up and sync across devices.
                </p>
                <a
                  href="/login"
                  className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg text-white"
                  style={{ backgroundColor: "#1a5c2a" }}
                >
                  Sign in
                </a>
              </div>
            )}

            {/* Pending items */}
            {user && pending.total > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Pending sync</p>
                <div className="space-y-1">
                  {pending.items.map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span className="text-[11px] text-gray-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {user && state === "synced" && (
              <p className="text-[11px] text-green-700 font-semibold">All data is up to date.</p>
            )}

            {/* Sync Now / Re-check */}
            {user && (
              <div className="flex gap-2 pt-1">
                {pending.total > 0 && state !== "offline" && (
                  <button
                    onClick={handleSyncNow}
                    disabled={syncing}
                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg text-white flex-1 justify-center"
                    style={{ backgroundColor: syncing ? "#6b7280" : "#1a5c2a" }}
                  >
                    <RefreshCw size={10} className={syncing ? "animate-spin" : ""} />
                    {syncing ? "Syncing..." : "Sync Now"}
                  </button>
                )}
                <button
                  onClick={() => check()}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg flex-1 justify-center"
                  style={{ backgroundColor: "#f3f4f6", color: "#374151" }}
                >
                  <RefreshCw size={10} />
                  Re-check
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

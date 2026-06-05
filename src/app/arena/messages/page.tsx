"use client";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { safeArray } from "@/lib/safe-array";
import type { ArenaMessage, ArenaUser } from "@/types/arena";

// ─── ArenaNav ─────────────────────────────────────────────────────────────────

function ArenaNav() {
  const user   = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const avatarInitials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/arena" className="text-lg font-bold" style={{ color: "#1a5c2a" }}>
          The Arena
        </Link>
        <div className="hidden md:flex items-center gap-4 text-sm">
          <Link href="/arena" className="text-gray-600 hover:text-gray-900">Feed</Link>
          <Link href="/arena/network" className="text-gray-600 hover:text-gray-900">Network</Link>
          <Link href="/arena/discover" className="text-gray-600 hover:text-gray-900">Discover</Link>
          <Link href="/arena/recruitment" className="text-gray-600 hover:text-gray-900">Talent Board</Link>
          <Link href="/arena/messages" className="font-semibold" style={{ color: "#1a5c2a" }}>Messages</Link>
        </div>
      </div>
      <div className="relative group">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white cursor-pointer"
          style={{ backgroundColor: "#1a5c2a" }}
        >
          {avatarInitials}
        </div>
        <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-lg py-2 min-w-40 hidden group-hover:block z-50">
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

function initials(name: string | null | undefined): string {
  return (name ?? "?").split(" ").map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 2) || "?";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Thread {
  otherId: string;
  otherName: string;
  otherRole: string;
  lastMessage: string;
  lastAt: string;
  unread: boolean;
}

function InboxSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [threads, setThreads]           = useState<Thread[]>([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [activeId, setActiveId]         = useState<string | null>(null);
  const [activeName, setActiveName]     = useState("");
  const [messages, setMessages]         = useState<ArenaMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [body, setBody]                 = useState("");
  const [sending, setSending]           = useState(false);
  const [sendError, setSendError]       = useState("");
  const bottomRef                       = useRef<HTMLDivElement>(null);
  const pollRef                         = useRef<ReturnType<typeof setInterval> | null>(null);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  // Build threads from inbox response
  const loadInbox = useCallback(async () => {
    setInboxLoading(true);
    try {
      const res = await fetch(`${API}/arena/inbox`, { headers });
      const data = await res.json();
      const msgs: ArenaMessage[] = safeArray(data);
      const currentId = user?.id ?? "";

      const built: Thread[] = msgs.map((m) => {
        const isMe = m.sender_id === currentId;
        const other: ArenaUser | undefined = isMe ? m.recipient : m.sender;
        return {
          otherId:     isMe ? m.recipient_id : m.sender_id,
          otherName:   other?.name ?? "Unknown",
          otherRole:   other?.role ?? "",
          lastMessage: m.body,
          lastAt:      m.created_at,
          unread:      !isMe && m.read_at === null,
        };
      });
      setThreads(built);
    } catch {
      // silently fail — empty state shown
    } finally {
      setInboxLoading(false);
    }
  }, [token, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load message thread for a given user
  const loadThread = useCallback(async (otherId: string, name: string) => {
    setActiveId(otherId);
    setActiveName(name);
    setThreadLoading(true);
    setMessages([]);
    try {
      const res = await fetch(`${API}/arena/messages/${otherId}`, { headers });
      const data = await res.json();
      setMessages(safeArray(data));
    } catch {
      // silently fail
    } finally {
      setThreadLoading(false);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll active thread every 10s
  const pollThread = useCallback(async (otherId: string) => {
    try {
      const res = await fetch(`${API}/arena/messages/${otherId}`, { headers });
      const data = await res.json();
      setMessages(safeArray(data));
    } catch {
      // ignore
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadInbox(); }, [loadInbox]);

  // Auto-open thread from ?with= query param
  useEffect(() => {
    const withId = searchParams?.get("with");
    if (withId && threads.length > 0) {
      const thread = threads.find((t) => String(t.otherId) === withId);
      if (thread) {
        loadThread(thread.otherId, thread.otherName);
      } else {
        // User not in inbox yet — open blank thread
        setActiveId(withId);
        setActiveName("");
        setMessages([]);
      }
    }
  }, [searchParams, threads, loadThread]);

  // Start/stop polling when activeId changes
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (activeId == null) return;
    pollRef.current = setInterval(() => pollThread(activeId), 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeId, pollThread]);

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!body.trim() || activeId == null) return;
    setSending(true);
    setSendError("");
    try {
      const res = await fetch(`${API}/arena/messages/${activeId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ body: body.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSendError(err.error ?? "Could not send. Are you connected with this person?");
        return;
      }
      setBody("");
      await loadThread(activeId, activeName);
      await loadInbox();
    } catch {
      setSendError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const currentId = user?.id ?? "";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f4f2ee" }}>
      <ArenaNav />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-500 mt-1">Direct messages with your Arena connections</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex" style={{ minHeight: 520 }}>
          {/* ── Inbox panel ─────────────────────────────────────── */}
          <div className={`flex-shrink-0 border-r border-gray-100 flex flex-col
            ${activeId != null ? "hidden md:flex w-72" : "w-full md:w-72"}`}>
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Conversations</p>
            </div>

            {inboxLoading ? (
              <InboxSkeleton />
            ) : threads.length === 0 ? (
              <div className="flex-1 flex items-center justify-center px-6">
                <p className="text-sm text-gray-400 text-center">
                  No messages yet. Connect with players and coaches, then start a conversation from your Network page.
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1">
                {threads.map((t) => (
                  <button
                    key={t.otherId}
                    onClick={() => loadThread(t.otherId, t.otherName)}
                    className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 text-left transition-colors
                      ${activeId === t.otherId ? "bg-green-50" : "hover:bg-gray-50"}`}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: "#1a5c2a" }}
                    >
                      {initials(t.otherName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-sm truncate ${t.unread ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                          {t.otherName}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0">{timeAgo(t.lastAt)}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {t.unread && <span className="w-2 h-2 rounded-full bg-green-600 shrink-0" />}
                        <p className="text-xs text-gray-500 truncate">{t.lastMessage}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Thread panel ─────────────────────────────────────── */}
          {activeId == null ? (
            <div className="hidden md:flex flex-1 items-center justify-center">
              <p className="text-sm text-gray-400">Select a conversation to read messages</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-w-0">
              {/* Thread header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <button
                  className="md:hidden text-gray-500 hover:text-gray-700 mr-1"
                  onClick={() => setActiveId(null)}
                  aria-label="Back to inbox"
                >
                  &#8592;
                </button>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: "#1a5c2a" }}
                >
                  {activeName ? initials(activeName) : "?"}
                </div>
                <span className="font-semibold text-gray-900 text-sm">
                  {activeName || `User #${activeId}`}
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {threadLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                        <div className="h-9 bg-gray-200 rounded-2xl animate-pulse w-40" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center pt-8">
                    No messages yet. Say hello!
                  </p>
                ) : (
                  messages.map((m) => {
                    const mine = m.sender_id === currentId;
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-[70%]">
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                              ${mine
                                ? "text-white rounded-br-sm"
                                : "bg-gray-100 text-gray-800 rounded-bl-sm"
                              }`}
                            style={mine ? { backgroundColor: "#1a5c2a" } : {}}
                          >
                            {m.body}
                          </div>
                          <p className={`text-xs text-gray-400 mt-1 ${mine ? "text-right" : "text-left"}`}>
                            {timeAgo(m.created_at)}
                            {mine && m.read_at && <span className="ml-1 text-green-500">· read</span>}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Compose */}
              <div className="px-4 py-3 border-t border-gray-100">
                {sendError && (
                  <p className="text-xs text-red-600 mb-2">{sendError}</p>
                )}
                <div className="flex gap-2 items-end">
                  <textarea
                    rows={2}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Type a message… (Enter to send)"
                    className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !body.trim()}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity"
                    style={{ backgroundColor: "#c8962a" }}
                  >
                    {sending ? "…" : "Send"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense>
      <MessagesContent />
    </Suspense>
  );
}

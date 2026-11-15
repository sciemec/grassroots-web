"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuthStore } from "@/lib/auth-store";
import {
  MessageSquare, Search, Image, Video, Mic, MousePointerClick,
  FileText, RefreshCw, Phone, User, Send, X, Clock, AlertTriangle,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface IncomingMessage {
  id: string;
  from_phone: string;
  profile_name: string | null;
  message_type: "text" | "image" | "video" | "audio" | "document" | "interactive" | "button";
  body: string | null;
  caption: string | null;
  button_payload: string | null;
  media_mime_type: string | null;
  received_at: string;
  user_id: string | null;
  user_name: string | null;
  user_role: string | null;
}

interface PageMeta {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

interface Summary {
  total_messages: number;
  unique_senders: number;
  by_type: Record<string, number>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, React.ReactNode> = {
  text:        <MessageSquare size={13} />,
  image:       <Image size={13} />,
  video:       <Video size={13} />,
  audio:       <Mic size={13} />,
  document:    <FileText size={13} />,
  interactive: <MousePointerClick size={13} />,
  button:      <MousePointerClick size={13} />,
};

const TYPE_COLORS: Record<string, string> = {
  text:        "bg-blue-100 text-blue-800",
  image:       "bg-purple-100 text-purple-800",
  video:       "bg-pink-100 text-pink-800",
  audio:       "bg-orange-100 text-orange-800",
  document:    "bg-gray-100 text-gray-700",
  interactive: "bg-green-100 text-green-800",
  button:      "bg-green-100 text-green-800",
};

const ROLE_COLORS: Record<string, string> = {
  player: "bg-emerald-100 text-emerald-800",
  coach:  "bg-blue-100 text-blue-800",
  scout:  "bg-purple-100 text-purple-800",
  fan:    "bg-amber-100 text-amber-800",
  admin:  "bg-red-100 text-red-800",
};

function displayContent(msg: IncomingMessage): string {
  if (msg.body)            return msg.body;
  if (msg.caption)         return `📎 ${msg.caption}`;
  if (msg.button_payload)  return `🔘 ${msg.button_payload}`;
  if (msg.media_mime_type) return `[${msg.media_mime_type}]`;
  return "—";
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-ZW", {
    timeZone: "Africa/Harare",
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function isWithin24h(iso: string): boolean {
  return (Date.now() - new Date(iso).getTime()) < 24 * 60 * 60 * 1000;
}

const ALL_TYPES = ["text", "image", "video", "audio", "document", "interactive", "button"];

// ── Reply modal ───────────────────────────────────────────────────────────────

function ReplyModal({
  msg,
  token,
  apiBase,
  onClose,
}: {
  msg: IncomingMessage;
  token: string | null;
  apiBase: string;
  onClose: () => void;
}) {
  const [text, setText]       = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const withinWindow = isWithin24h(msg.received_at);

  useEffect(() => { textRef.current?.focus(); }, []);

  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/admin/whatsapp-incoming/${msg.id}/reply`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? json.error ?? `Error ${res.status}`);
      } else {
        setSent(true);
      }
    } catch {
      setError("Network error — could not send.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <div className="font-semibold text-gray-900 flex items-center gap-2">
              <Phone size={14} className="text-gray-400" />
              {msg.from_phone}
              {msg.profile_name && (
                <span className="text-sm font-normal text-gray-500">· {msg.profile_name}</span>
              )}
            </div>
            {msg.user_name && (
              <div className="text-xs text-gray-400 mt-0.5">
                Platform: {msg.user_name}
                {msg.user_role && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[msg.user_role] ?? ""}`}>
                    {msg.user_role}
                  </span>
                )}
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Their message */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <div className="text-xs text-gray-400 mb-1">Their message · {formatTime(msg.received_at)}</div>
          <p className="text-sm text-gray-700 break-words">{displayContent(msg)}</p>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {sent ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Send size={20} className="text-green-700" />
              </div>
              <p className="font-semibold text-gray-900">Reply sent</p>
              <p className="text-sm text-gray-500">The message was delivered to {msg.from_phone}</p>
              <button onClick={onClose} className="mt-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50">
                Close
              </button>
            </div>
          ) : !withinWindow ? (
            <div className="flex gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">24-hour window closed</p>
                <p className="text-xs text-amber-700 mt-1">
                  Meta&apos;s policy only allows free-text replies within 24 hours of the
                  customer&apos;s last message. This message is older than 24 hours —
                  you can only send an approved template now.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 text-xs text-green-700 mb-3">
                <Clock size={12} />
                24-hour window open — free text reply allowed
              </div>

              <textarea
                ref={textRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send(); }}
                placeholder="Type your reply… (Ctrl+Enter to send)"
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              />

              {error && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle size={13} /> {error}
                </p>
              )}

              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={send}
                  disabled={!text.trim() || sending}
                  className="px-4 py-2 text-sm font-semibold text-white rounded-lg flex items-center gap-2 disabled:opacity-40"
                  style={{ backgroundColor: "#1a5c2a" }}
                >
                  <Send size={14} />
                  {sending ? "Sending…" : "Send reply"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function WhatsAppRepliesPage() {
  const token = useAuthStore((s) => s.token);

  const [messages, setMessages] = useState<IncomingMessage[]>([]);
  const [meta, setMeta]         = useState<PageMeta | null>(null);
  const [summary, setSummary]   = useState<Summary | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [replyTo, setReplyTo]   = useState<IncomingMessage | null>(null);

  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage]             = useState(1);

  const API = process.env.NEXT_PUBLIC_API_URL ?? "";

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ per_page: "50", page: String(p) });
      if (search)     params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);
      if (dateFilter) params.set("date", dateFilter);

      const res = await fetch(`${API}/admin/whatsapp-incoming?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setMessages(json.data ?? []);
      setMeta(json.meta ?? null);
      setSummary(json.summary ?? null);
      setPage(p);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, dateFilter, token, API]);

  useEffect(() => { load(1); }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(1);
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }} className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare size={24} className="text-green-700" />
          WhatsApp Incoming Messages
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Every message received · click Reply to respond within the 24-hour window
        </p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <SummaryCard label="Total messages"  value={summary.total_messages.toLocaleString()} />
          <SummaryCard label="Unique senders"  value={summary.unique_senders.toLocaleString()} />
          <SummaryCard label="Text replies"    value={String(summary.by_type["text"] ?? 0)} />
          <SummaryCard label="Button taps"
            value={String((summary.by_type["button"] ?? 0) + (summary.by_type["interactive"] ?? 0))}
          />
        </div>
      )}

      {/* Filter bar */}
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-end"
      >
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Phone, name, message text…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All types</option>
            {ALL_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Date (Harare)</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold rounded-lg text-white"
            style={{ backgroundColor: "#1a5c2a" }}
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => { setSearch(""); setTypeFilter(""); setDateFilter(""); setTimeout(() => load(1), 0); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => load(page)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading…</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">{error}</div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No messages found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Time (Harare)</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Sender</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Message</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Platform user</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {messages.map((msg) => {
                    const canReply = isWithin24h(msg.received_at);
                    return (
                      <tr key={msg.id} className="hover:bg-gray-50 transition-colors">
                        {/* Time */}
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                          {formatTime(msg.received_at)}
                        </td>

                        {/* Sender */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Phone size={12} className="text-gray-400 shrink-0" />
                            <span className="font-mono text-xs text-gray-800">{msg.from_phone}</span>
                          </div>
                          {msg.profile_name && (
                            <div className="text-xs text-gray-500 mt-0.5 pl-4">{msg.profile_name}</div>
                          )}
                        </td>

                        {/* Type badge */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[msg.message_type] ?? "bg-gray-100 text-gray-700"}`}>
                            {TYPE_ICONS[msg.message_type]}
                            {msg.message_type}
                          </span>
                        </td>

                        {/* Content */}
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-gray-900 text-sm break-words line-clamp-3">
                            {displayContent(msg)}
                          </p>
                        </td>

                        {/* Platform user */}
                        <td className="px-4 py-3">
                          {msg.user_id ? (
                            <div className="flex items-center gap-1.5">
                              <User size={12} className="text-gray-400 shrink-0" />
                              <span className="text-sm text-gray-800">{msg.user_name ?? "—"}</span>
                              {msg.user_role && (
                                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[msg.user_role] ?? ""}`}>
                                  {msg.user_role}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Not registered</span>
                          )}
                        </td>

                        {/* Reply button */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setReplyTo(msg)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                              canReply
                                ? "border-green-300 text-green-800 bg-green-50 hover:bg-green-100"
                                : "border-gray-200 text-gray-400 bg-gray-50 hover:bg-gray-100"
                            }`}
                          >
                            <Send size={11} />
                            Reply
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <span className="text-sm text-gray-500">
                  {meta.total.toLocaleString()} messages · page {meta.current_page} of {meta.last_page}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => load(meta.current_page - 1)}
                    disabled={meta.current_page <= 1}
                    className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => load(meta.current_page + 1)}
                    disabled={meta.current_page >= meta.last_page}
                    className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Reply modal */}
      {replyTo && (
        <ReplyModal
          msg={replyTo}
          token={token}
          apiBase={API}
          onClose={() => setReplyTo(null)}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

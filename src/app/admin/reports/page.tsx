"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Flag, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Loader2, AlertTriangle, MessageSquare,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReportEntry {
  reason: string;
  createdAt: string;
}

interface FlaggedComment {
  commentId:   string;
  body:        string;
  flagStatus:  "flagged" | "dismissed";
  flaggedAt:   string | null;
  postId:      string;
  postExcerpt: string;
  authorId:    string;
  authorName:  string;
  authorRole:  string;
  reportCount: number;
  reports:     ReportEntry[];
}

interface PageResponse {
  data:         FlaggedComment[];
  current_page: number;
  last_page:    number;
  total:        number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_TABS = ["flagged", "dismissed", "all"] as const;
type StatusTab = typeof STATUS_TABS[number];

const REASON_LABELS: Record<string, string> = {
  offensive:   "Offensive",
  spam:        "Spam",
  harassment:  "Harassment",
  other:       "Other",
};

const REASON_COLORS: Record<string, string> = {
  offensive:  "bg-red-100 text-red-700",
  spam:       "bg-amber-100 text-amber-700",
  harassment: "bg-orange-100 text-orange-700",
  other:      "bg-gray-100 text-gray-600",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days > 0)  return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${mins}m ago`;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-200" />
      ))}
    </div>
  );
}

// ── Comment card ──────────────────────────────────────────────────────────────

function CommentCard({
  item,
  onResolve,
  onDismiss,
  resolving,
  dismissing,
}: {
  item:       FlaggedComment;
  onResolve:  (id: string) => void;
  onDismiss:  (id: string) => void;
  resolving:  boolean;
  dismissing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: `1px solid ${item.flagStatus === "flagged" ? "#fca5a5" : "#e5e5e5"}`,
        borderRadius: 14,
        padding: "16px 18px",
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Author + badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#111" }}>
              {item.authorName}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 99,
              backgroundColor: "#f3f4f6", color: "#6b7280", textTransform: "capitalize",
            }}>
              {item.authorRole}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 99,
              backgroundColor: item.flagStatus === "flagged" ? "#fee2e2" : "#f3f4f6",
              color: item.flagStatus === "flagged" ? "#b91c1c" : "#6b7280",
              textTransform: "uppercase",
            }}>
              {item.flagStatus}
            </span>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>{timeAgo(item.flaggedAt)}</span>
          </div>

          {/* Comment body */}
          <p style={{
            marginTop: 6, fontSize: 13, color: "#374151",
            background: "#fef2f2", borderRadius: 8, padding: "8px 12px",
            borderLeft: "3px solid #fca5a5",
          }}>
            {item.body}
          </p>

          {/* Post excerpt */}
          {item.postExcerpt && (
            <p style={{ marginTop: 5, fontSize: 11, color: "#9ca3af" }}>
              On post: &ldquo;{item.postExcerpt}&rdquo;
            </p>
          )}

          {/* Report count + expand */}
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              marginTop: 8, display: "flex", alignItems: "center", gap: 4,
              fontSize: 11, color: "#6b7280", cursor: "pointer",
              background: "none", border: "none", padding: 0,
            }}
          >
            <Flag size={11} />
            {item.reportCount} report{item.reportCount !== 1 ? "s" : ""}
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          {/* Individual report reasons */}
          {expanded && (
            <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 5 }}>
              {item.reports.map((r, i) => (
                <span
                  key={i}
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${REASON_COLORS[r.reason] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {REASON_LABELS[r.reason] ?? r.reason}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons — only for flagged items */}
        {item.flagStatus === "flagged" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => onResolve(item.commentId)}
              disabled={resolving || dismissing}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                backgroundColor: "#fee2e2", color: "#b91c1c",
                border: "none", cursor: "pointer", opacity: resolving ? 0.6 : 1,
              }}
            >
              {resolving
                ? <Loader2 size={11} className="animate-spin" />
                : <XCircle size={11} />}
              Delete
            </button>
            <button
              onClick={() => onDismiss(item.commentId)}
              disabled={resolving || dismissing}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                backgroundColor: "#f3f4f6", color: "#374151",
                border: "none", cursor: "pointer", opacity: dismissing ? 0.6 : 1,
              }}
            >
              {dismissing
                ? <Loader2 size={11} className="animate-spin" />
                : <CheckCircle2 size={11} />}
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
  const user        = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [statusTab, setStatusTab] = useState<StatusTab>("flagged");
  const [actionId, setActionId]   = useState<string | null>(null);

  const { data, isLoading } = useQuery<PageResponse>({
    queryKey: ["admin-reports", statusTab],
    queryFn: async () => {
      const res = await api.get("/admin/reports", {
        params: { status: statusTab, per_page: 20 },
      });
      return res.data;
    },
    enabled: !!user,
  });

  const resolveMutation = useMutation({
    mutationFn: (commentId: string) =>
      api.patch(`/admin/reports/${commentId}/resolve`),
    onMutate:  (id) => setActionId(id),
    onSettled: () => {
      setActionId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (commentId: string) =>
      api.patch(`/admin/reports/${commentId}/dismiss`),
    onMutate:  (id) => setActionId(id),
    onSettled: () => {
      setActionId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
  });

  const comments = data?.data ?? [];
  const total    = data?.total ?? 0;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>

      {/* Header */}
      <header style={{
        backgroundColor: "#fff",
        borderBottom: "1px solid #e5e5e5",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, height: 56 }}>
            <Link href="/admin" style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 32, height: 32, borderRadius: 8,
              backgroundColor: "#f3f4f6", color: "#374151",
              textDecoration: "none",
            }}>
              <ArrowLeft size={15} />
            </Link>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>
                Comment Reports
              </div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>
                Flagged Arena comments awaiting moderation
              </div>
            </div>
            {total > 0 && (
              <span style={{
                marginLeft: "auto", fontSize: 11, fontWeight: 700,
                padding: "2px 10px", borderRadius: 99,
                backgroundColor: "#fee2e2", color: "#b91c1c",
              }}>
                {total} {statusTab === "all" ? "total" : statusTab}
              </span>
            )}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px 16px 56px" }}>

        {/* Status tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              style={{
                padding: "6px 16px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                border: "1px solid",
                borderColor: statusTab === tab ? "#1a5c2a" : "#e5e5e5",
                backgroundColor: statusTab === tab ? "#1a5c2a" : "#fff",
                color: statusTab === tab ? "#fff" : "#6b7280",
                cursor: "pointer", textTransform: "capitalize",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <Skeleton />
        ) : comments.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            backgroundColor: "#fff", borderRadius: 16,
            border: "1px dashed #d1d5db",
          }}>
            {statusTab === "flagged"
              ? <CheckCircle2 size={32} color="#16a34a" style={{ margin: "0 auto 12px" }} />
              : <MessageSquare size={32} color="#9ca3af" style={{ margin: "0 auto 12px" }} />
            }
            <p style={{ fontWeight: 700, fontSize: 14, color: "#111", marginBottom: 4 }}>
              {statusTab === "flagged" ? "No flagged comments" : `No ${statusTab} reports`}
            </p>
            <p style={{ fontSize: 12, color: "#9ca3af" }}>
              {statusTab === "flagged"
                ? "The Arena is clean — nothing needs review right now."
                : "Switch to another tab to see reports."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {comments.map((item) => (
              <CommentCard
                key={item.commentId}
                item={item}
                onResolve={(id) => resolveMutation.mutate(id)}
                onDismiss={(id) => dismissMutation.mutate(id)}
                resolving={resolveMutation.isPending && actionId === item.commentId}
                dismissing={dismissMutation.isPending && actionId === item.commentId}
              />
            ))}
          </div>
        )}

        {/* Warning banner */}
        {statusTab === "flagged" && comments.length > 0 && (
          <div style={{
            marginTop: 20, display: "flex", alignItems: "flex-start", gap: 10,
            backgroundColor: "#fffbeb", borderRadius: 12, padding: "12px 16px",
            border: "1px solid #fde68a",
          }}>
            <AlertTriangle size={14} color="#d97706" style={{ marginTop: 1, flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: "#92400e" }}>
              <strong>Delete</strong> removes the comment permanently and clears all reports.{" "}
              <strong>Dismiss</strong> clears the flag and keeps the comment visible — use this
              for false positives.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

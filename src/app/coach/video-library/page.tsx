"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { Play, Trash2, Film, RefreshCw, Library } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

const CONTEXT_FILTERS = [
  { value: "",               label: "All Videos" },
  { value: "match_eye",      label: "Match Eye" },
  { value: "training",       label: "Training" },
  { value: "drill_analysis", label: "Drill Analysis" },
  { value: "arena_post",     label: "Arena" },
  { value: "whatsapp",       label: "WhatsApp" },
];

const CONTEXT_META: Record<string, { label: string; color: string; bg: string }> = {
  match_eye:      { label: "Match Eye",     color: "#166534", bg: "#dcfce7" },
  training:       { label: "Training",      color: "#1e40af", bg: "#dbeafe" },
  drill_analysis: { label: "Drill",         color: "#92400e", bg: "#fef3c7" },
  arena_post:     { label: "Arena",         color: "#581c87", bg: "#f3e8ff" },
  showcase:       { label: "Showcase",      color: "#0e7490", bg: "#cffafe" },
  vault:          { label: "Vault",         color: "#374151", bg: "#f3f4f6" },
  whatsapp:       { label: "WhatsApp",      color: "#166534", bg: "#bbf7d0" },
  fan_hub:        { label: "Fan Hub",       color: "#be185d", bg: "#fce7f3" },
};

interface MediaItem {
  id: string;
  r2_url: string;
  thumbnail_url: string | null;
  title: string | null;
  context: string;
  media_type: string;
  duration_seconds: number | null;
  size_bytes: number | null;
  view_count: number;
  created_at: string;
  is_ai_analysed: boolean;
}

interface PaginatedMedia {
  data: MediaItem[];
  current_page: number;
  last_page: number;
  total: number;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatSize(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  if (bytes >= 1_000_000)     return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${(bytes / 1_000).toFixed(0)} KB`;
}

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0)   return "Today";
  if (days === 1)   return "Yesterday";
  if (days < 30)    return `${days}d ago`;
  if (days < 365)   return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function ctxMeta(ctx: string) {
  return CONTEXT_META[ctx] ?? { label: ctx, color: "#374151", bg: "#f3f4f6" };
}

export default function CoachVideoLibraryPage() {
  const token = useAuthStore((s) => s.token);

  const [activeContext, setActiveContext] = useState("");
  const [items, setItems]       = useState<MediaItem[]>([]);
  const [page, setPage]         = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]       = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (pageNum: number, ctx: string, append: boolean) => {
      if (!token) return;
      const url = new URL(`${API}/media`);
      url.searchParams.set("page", String(pageNum));
      if (ctx) url.searchParams.set("context", ctx);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: PaginatedMedia = await res.json();
      setItems((prev) => (append ? [...prev, ...json.data] : json.data));
      setLastPage(json.last_page);
      setTotal(json.total);
    },
    [token]
  );

  useEffect(() => {
    setLoading(true);
    setPage(1);
    setError("");
    fetchPage(1, activeContext, false)
      .catch(() => setError("Could not load videos. Check your connection."))
      .finally(() => setLoading(false));
  }, [activeContext, fetchPage]);

  const handleLoadMore = async () => {
    const next = page + 1;
    setLoadingMore(true);
    await fetchPage(next, activeContext, true).catch(() => {});
    setPage(next);
    setLoadingMore(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this video? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await fetch(`${API}/media/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      setItems((prev) => prev.filter((m) => m.id !== id));
      setTotal((t) => t - 1);
    } catch {
      // silent — keep item in list
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f4f2ee",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Page header */}
      <div
        style={{
          backgroundColor: "#fff",
          borderBottom: "1px solid #e5e7eb",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor: "#1a5c2a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Library size={18} color="#c8962a" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>
            Video Library
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            {loading ? "Loading…" : `${total} video${total !== 1 ? "s" : ""} stored`}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px 64px" }}>
        {/* Context filter chips */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          {CONTEXT_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveContext(f.value)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                border: "1.5px solid",
                borderColor: activeContext === f.value ? "#1a5c2a" : "#d1d5db",
                backgroundColor: activeContext === f.value ? "#1a5c2a" : "#fff",
                color: activeContext === f.value ? "#fff" : "#374151",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* States */}
        {loading ? (
          <SkeletonGrid />
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={() => {
              setLoading(true);
              setError("");
              fetchPage(1, activeContext, false)
                .catch(() => setError("Could not load videos. Check your connection."))
                .finally(() => setLoading(false));
            }}
          />
        ) : items.length === 0 ? (
          <EmptyState context={activeContext} />
        ) : (
          <>
            {/* Video grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {items.map((item) => {
                const meta = ctxMeta(item.context);
                return (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 12,
                      overflow: "hidden",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    {/* Thumbnail / play area */}
                    <div
                      style={{
                        position: "relative",
                        height: 160,
                        backgroundColor: "#1a3d26",
                        cursor: "pointer",
                      }}
                      onClick={() => window.open(item.r2_url, "_blank")}
                    >
                      {item.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.thumbnail_url}
                          alt={item.title ?? "Video thumbnail"}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Film size={40} color="rgba(255,255,255,0.2)" />
                        </div>
                      )}

                      {/* Play button overlay */}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            backgroundColor: "rgba(255,255,255,0.88)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Play size={18} color="#1a5c2a" fill="#1a5c2a" />
                        </div>
                      </div>

                      {/* Duration badge */}
                      {item.duration_seconds !== null && item.duration_seconds > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: 8,
                            right: 8,
                            backgroundColor: "rgba(0,0,0,0.72)",
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "2px 6px",
                            borderRadius: 4,
                          }}
                        >
                          {formatDuration(item.duration_seconds)}
                        </div>
                      )}

                      {/* AI analysed badge */}
                      {item.is_ai_analysed && (
                        <div
                          style={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            backgroundColor: "#c8962a",
                            color: "#fff",
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 4,
                            letterSpacing: "0.03em",
                          }}
                        >
                          AI
                        </div>
                      )}
                    </div>

                    {/* Card footer */}
                    <div style={{ padding: "12px 14px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 8,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 13,
                              color: "#0f172a",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              marginBottom: 5,
                            }}
                          >
                            {item.title ?? "Untitled"}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: meta.color,
                                backgroundColor: meta.bg,
                                padding: "2px 7px",
                                borderRadius: 10,
                              }}
                            >
                              {meta.label}
                            </span>
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>
                              {timeAgo(item.created_at)}
                            </span>
                            {item.size_bytes !== null && item.size_bytes > 0 && (
                              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                                {formatSize(item.size_bytes)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deleting === item.id}
                          title="Delete video"
                          style={{
                            flexShrink: 0,
                            padding: 6,
                            border: "none",
                            backgroundColor: "transparent",
                            cursor: deleting === item.id ? "not-allowed" : "pointer",
                            color: "#ef4444",
                            borderRadius: 6,
                            opacity: deleting === item.id ? 0.45 : 1,
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load more */}
            {page < lastPage && (
              <div style={{ textAlign: "center", marginTop: 32 }}>
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  style={{
                    padding: "10px 28px",
                    backgroundColor: loadingMore ? "#9ca3af" : "#1a5c2a",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: loadingMore ? "not-allowed" : "pointer",
                  }}
                >
                  {loadingMore ? "Loading…" : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 16,
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid #e5e7eb",
          }}
        >
          <div style={{ height: 160, backgroundColor: "#e5e7eb" }} />
          <div style={{ padding: "12px 14px" }}>
            <div
              style={{
                height: 13,
                width: "65%",
                backgroundColor: "#e5e7eb",
                borderRadius: 4,
                marginBottom: 8,
              }}
            />
            <div
              style={{
                height: 11,
                width: "40%",
                backgroundColor: "#f1f5f9",
                borderRadius: 4,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div style={{ textAlign: "center", padding: "56px 24px" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
      <div
        style={{
          fontWeight: 600,
          color: "#1e293b",
          fontSize: 15,
          marginBottom: 16,
        }}
      >
        {message}
      </div>
      <button
        onClick={onRetry}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "9px 20px",
          backgroundColor: "#1a5c2a",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        <RefreshCw size={14} />
        Retry
      </button>
    </div>
  );
}

function EmptyState({ context }: { context: string }) {
  const contextLabel =
    CONTEXT_FILTERS.find((f) => f.value === context)?.label ?? "this category";

  return (
    <div style={{ textAlign: "center", padding: "72px 24px" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🎬</div>
      <div
        style={{
          fontWeight: 700,
          fontSize: 18,
          color: "#1e293b",
          marginBottom: 8,
        }}
      >
        No videos in {context ? contextLabel : "your library"}
      </div>
      <div
        style={{
          fontSize: 14,
          color: "#64748b",
          maxWidth: 380,
          margin: "0 auto",
          lineHeight: 1.6,
        }}
      >
        {context
          ? `Videos you record or upload in ${contextLabel} will appear here.`
          : "Videos you capture in Match Eye, Drill Analysis, Training, or Arena will appear here automatically."}
      </div>
    </div>
  );
}

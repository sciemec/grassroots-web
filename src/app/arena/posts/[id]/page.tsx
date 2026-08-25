"use client";
// src/app/arena/posts/[id]/page.tsx
// Arena post detail — full post view with comments.

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import {
  ArrowLeft, Heart, MessageCircle, Send, Trash2,
  Trophy, Zap, Star, Video, Globe, Eye, Loader2, ChevronDown,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";
const GRS_GREEN = "#1a5c2a";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Post {
  id: string;
  user_id: string;
  body: string;
  post_type: string;
  milestone_label?: string;
  image_url?: string;
  video_url?: string;
  like_count: number;
  comment_count: number;
  view_count?: number;
  sport?: string;
  province?: string;
  created_at: string;
  liked?: number;
  my_reaction?: string | null;
  user?: {
    id: string;
    name: string;
    first_name?: string;
    surname?: string;
    role: string;
    sport?: string;
    province?: string;
  };
}

interface Comment {
  id: string;
  body: string;
  created_at: string;
  user?: {
    id: string;
    name: string;
    first_name?: string;
    surname?: string;
    role: string;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60)    return "just now";
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function displayName(u?: Post["user"]): string {
  if (!u) return "Unknown";
  return [u.first_name, u.surname].filter(Boolean).join(" ") || u.name || "Unknown";
}

function initials(u?: Post["user"]): string {
  const n = displayName(u);
  return n.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
}

const ROLE_COLORS: Record<string, string> = {
  coach:  "#2563eb",
  scout:  "#7c3aed",
  player: "#059669",
  admin:  "#dc2626",
  fan:    "#d97706",
};

const POST_TYPE_META: Record<string, { label: string; icon: React.ReactNode; bg: string; border: string }> = {
  milestone:        { label: "Milestone",   icon: <Star size={11} />,    bg: "#f0fdf4", border: "#bbf7d0" },
  achievement:      { label: "Achievement", icon: <Trophy size={11} />,  bg: "#f0fdf4", border: "#bbf7d0" },
  prediction_upgrade: { label: "Level Up",  icon: <Zap size={11} />,    bg: "#fffbeb", border: "#fde68a" },
  video:            { label: "Video",       icon: <Video size={11} />,   bg: "#eff6ff", border: "#bfdbfe" },
  gemini_drill:     { label: "Drill",       icon: <Zap size={11} />,    bg: "#fdf4ff", border: "#e9d5ff" },
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ArenaPostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [post, setPost]           = useState<Post | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  const [liked, setLiked]         = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const [comments, setComments]         = useState<Comment[]>([]);
  const [commentsLoading, setComLd]     = useState(false);
  const [commentTotal, setCommentTotal] = useState(0);
  const [commentPage, setCommentPage]   = useState(1);

  const [commentBody, setCommentBody]   = useState("");
  const [submitting, setSubmitting]     = useState(false);

  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }), [token]);

  // ── Load post ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id || !hasHydrated) return;
    if (!token) { setLoading(false); return; }

    fetch(`${API}/arena/posts/${id}`, { headers: authHeaders() })
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((d) => {
        const p: Post = d.data ?? d;
        setPost(p);
        setLiked(p.liked === 1);
        setLikeCount(p.like_count ?? 0);
        loadComments(1, p.id);
      })
      .catch((e) => setError(e === 404 ? "Post not found." : "Could not load this post."))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, hasHydrated, token]);

  // ── Load comments ──────────────────────────────────────────────────────────

  function loadComments(page: number, postId: string) {
    setComLd(true);
    fetch(`${API}/arena/posts/${postId}/comments?page=${page}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        const batch: Comment[] = Array.isArray(d.data) ? d.data : (d.comments ?? []);
        setComments((prev) => page === 1 ? batch : [...prev, ...batch]);
        setCommentTotal(d.meta?.total ?? d.total ?? batch.length);
        setCommentPage(page);
      })
      .catch(() => {})
      .finally(() => setComLd(false));
  }

  // ── Like toggle ────────────────────────────────────────────────────────────

  const toggleLike = async () => {
    if (!token || !post) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => wasLiked ? c - 1 : c + 1);
    try {
      await fetch(`${API}/arena/posts/${post.id}/like`, {
        method: "POST",
        headers: authHeaders(),
      });
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => wasLiked ? c + 1 : c - 1);
    }
  };

  // ── Submit comment ─────────────────────────────────────────────────────────

  const submitComment = async () => {
    if (!commentBody.trim() || !token || !post) return;
    setSubmitting(true);
    try {
      const r = await fetch(`${API}/arena/posts/${post.id}/comments`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ body: commentBody.trim() }),
      });
      const d = await r.json();
      const newComment: Comment = d.comment ?? d.data ?? {
        id: Date.now().toString(),
        body: commentBody.trim(),
        created_at: new Date().toISOString(),
        user: user
          ? { id: user.id, name: user.name ?? "", role: user.role ?? "player" }
          : undefined,
      };
      setComments((prev) => [...prev, newComment]);
      setCommentTotal((t) => t + 1);
      setCommentBody("");
    } catch {
      // silently fail — comment body stays so user can retry
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete comment ─────────────────────────────────────────────────────────

  const deleteComment = async (commentId: string) => {
    if (!post) return;
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setCommentTotal((t) => Math.max(0, t - 1));
    try {
      await fetch(`${API}/arena/posts/${post.id}/comments/${commentId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
    } catch {
      // Re-load comments if delete failed
      loadComments(1, post.id);
    }
  };

  // ── Render states ──────────────────────────────────────────────────────────

  if (!hasHydrated || loading) return <LoadingSkeleton />;

  if (!token) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: "#1a3d26", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Globe size={28} color="#f0b429" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111", margin: "0 0 8px" }}>Sign in to view</h2>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 24px", lineHeight: 1.6 }}>
            Join The Arena to view posts, like, and comment.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={`/login?next=/arena/posts/${id}`} style={{ padding: "11px 24px", backgroundColor: GRS_GREEN, color: "#fff", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
              Sign In
            </Link>
            <Link href="/register" style={{ padding: "11px 24px", backgroundColor: "#fff", color: "#374151", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 14, border: "1px solid #d1d5db" }}>
              Register Free
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#dc2626", fontWeight: 600, fontSize: 15, marginBottom: 12 }}>
            {error || "Post not found."}
          </p>
          <Link href="/arena" style={{ fontSize: 13, color: GRS_GREEN, textDecoration: "none" }}>← Back to Arena</Link>
        </div>
      </div>
    );
  }

  const typeMeta = POST_TYPE_META[post.post_type];
  const authorName = displayName(post.user);
  const authorInitials = initials(post.user);
  const roleColor = ROLE_COLORS[post.user?.role ?? "player"] ?? "#6b7280";
  const isOwner = user?.id === post.user_id;
  const canDeleteComment = (c: Comment) =>
    user && (c.user?.id === user.id || isOwner || user.role === "admin");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", fontFamily: "system-ui,-apple-system,sans-serif" }}>

      {/* ── Nav bar ───────────────────────────────────────────────────────── */}
      <header style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 16px", height: 52, display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/arena" style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: 5, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
            <ArrowLeft size={15} /> The Arena
          </Link>
          <span style={{ color: "#d1d5db", fontSize: 16 }}>›</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
            {post.body.slice(0, 60)}{post.body.length > 60 ? "…" : ""}
          </span>
        </div>
      </header>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px 16px 72px" }}>

        {/* ── Post card ─────────────────────────────────────────────────── */}
        <div style={{
          backgroundColor: "#fff",
          borderRadius: 16,
          border: typeMeta ? `1px solid ${typeMeta.border}` : "1px solid #e5e7eb",
          backgroundColor: typeMeta ? typeMeta.bg : "#fff",
          overflow: "hidden",
          marginBottom: 12,
        }}>
          {/* Author row */}
          <div style={{ padding: "16px 16px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", backgroundColor: GRS_GREEN, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{authorInitials}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>{authorName}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: roleColor, backgroundColor: `${roleColor}18`, padding: "1px 7px", borderRadius: 20, textTransform: "capitalize" }}>
                    {post.user?.role ?? "player"}
                  </span>
                  {typeMeta && (
                    <span style={{ fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 3, color: "#374151", backgroundColor: typeMeta.border, padding: "1px 7px", borderRadius: 20 }}>
                      {typeMeta.icon} {typeMeta.label}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>{timeAgo(post.created_at)}</span>
                  {post.sport && <span style={{ fontSize: 11, color: "#6b7280" }}>· {post.sport}</span>}
                  {post.province && <span style={{ fontSize: 11, color: "#6b7280" }}>· {post.province}</span>}
                </div>
              </div>
            </div>

            {/* Milestone label */}
            {post.milestone_label && (
              <div style={{ fontSize: 12, fontWeight: 700, color: GRS_GREEN, backgroundColor: "#dcfce7", padding: "4px 12px", borderRadius: 20, display: "inline-block", marginBottom: 10 }}>
                {post.milestone_label}
              </div>
            )}

            {/* Body */}
            <p style={{ fontSize: 15, color: "#111", lineHeight: 1.6, margin: "0 0 14px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {post.body}
            </p>
          </div>

          {/* Video */}
          {post.video_url && (
            <video
              src={post.video_url}
              controls
              playsInline
              preload="metadata"
              style={{ width: "100%", display: "block", backgroundColor: "#111", maxHeight: 400 }}
            />
          )}

          {/* Image (no video) */}
          {post.image_url && !post.video_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.image_url}
              alt="Post image"
              style={{ width: "100%", display: "block", maxHeight: 400, objectFit: "cover" }}
            />
          )}

          {/* Footer row */}
          <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 16, borderTop: "1px solid #f3f4f6" }}>
            <button
              onClick={toggleLike}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: liked ? "#ef4444" : "#6b7280", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <Heart size={16} fill={liked ? "currentColor" : "none"} />
              {likeCount}
            </button>
            <button
              onClick={() => commentInputRef.current?.focus()}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <MessageCircle size={16} />
              {commentTotal}
            </button>
            {post.view_count != null && (
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#9ca3af", marginLeft: "auto" }}>
                <Eye size={13} /> {post.view_count}
              </span>
            )}
          </div>
        </div>

        {/* ── Comments ──────────────────────────────────────────────────── */}
        <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden" }}>

          {/* Add comment */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #f3f4f6" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: GRS_GREEN, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>
                  {user ? (user.name ?? "?")[0].toUpperCase() : "?"}
                </span>
              </div>
              <div style={{ flex: 1, position: "relative" }}>
                <textarea
                  ref={commentInputRef}
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                  placeholder="Write a comment…"
                  rows={1}
                  style={{ width: "100%", resize: "none", border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 38px 8px 12px", fontSize: 13, outline: "none", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box" }}
                  onInput={(e) => {
                    const t = e.currentTarget;
                    t.style.height = "auto";
                    t.style.height = `${t.scrollHeight}px`;
                  }}
                />
                <button
                  onClick={submitComment}
                  disabled={!commentBody.trim() || submitting}
                  style={{ position: "absolute", right: 8, bottom: 8, background: "none", border: "none", cursor: commentBody.trim() ? "pointer" : "default", padding: 0, color: commentBody.trim() ? GRS_GREEN : "#d1d5db" }}
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
            <p style={{ fontSize: 11, color: "#9ca3af", margin: "6px 0 0 42px" }}>Enter to post · Shift+Enter for new line</p>
          </div>

          {/* Comment list */}
          {comments.length === 0 && !commentsLoading ? (
            <div style={{ padding: "28px 16px", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>No comments yet — be the first.</p>
            </div>
          ) : (
            <div>
              {comments.map((c) => {
                const cName = [c.user?.first_name, c.user?.surname].filter(Boolean).join(" ") || c.user?.name || "Unknown";
                const cInit = cName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
                const cRoleColor = ROLE_COLORS[c.user?.role ?? "player"] ?? "#6b7280";
                return (
                  <div key={c.id} style={{ padding: "12px 16px", borderBottom: "1px solid #f9fafb", display: "flex", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: GRS_GREEN, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: 0.85 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: "#fff" }}>{cInit}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: 12, color: "#111" }}>{cName}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: cRoleColor, backgroundColor: `${cRoleColor}18`, padding: "0 5px", borderRadius: 10, textTransform: "capitalize" }}>
                          {c.user?.role ?? "player"}
                        </span>
                        <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: "auto" }}>{timeAgo(c.created_at)}</span>
                        {canDeleteComment(c) && (
                          <button
                            onClick={() => deleteComment(c.id)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0, display: "flex", alignItems: "center" }}
                            title="Delete comment"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.5, wordBreak: "break-word" }}>{c.body}</p>
                    </div>
                  </div>
                );
              })}

              {/* Load more */}
              {comments.length < commentTotal && (
                <div style={{ padding: "12px 16px", textAlign: "center" }}>
                  <button
                    onClick={() => post && loadComments(commentPage + 1, post.id)}
                    disabled={commentsLoading}
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: GRS_GREEN, background: "none", border: `1px solid #bbf7d0`, borderRadius: 20, padding: "6px 16px", cursor: "pointer" }}
                  >
                    {commentsLoading ? <Loader2 size={13} className="animate-spin" /> : <ChevronDown size={13} />}
                    {commentsLoading ? "Loading…" : `Load more (${commentTotal - comments.length} remaining)`}
                  </button>
                </div>
              )}

              {commentsLoading && comments.length === 0 && (
                <div style={{ padding: "20px 16px", textAlign: "center" }}>
                  <Loader2 size={18} color="#9ca3af" className="animate-spin" style={{ display: "inline-block" }} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <div style={{ height: 52, backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb" }} />
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px 16px" }}>
        {/* Post skeleton */}
        <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", backgroundColor: "#e5e7eb", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 14, width: "40%", backgroundColor: "#e5e7eb", borderRadius: 5, marginBottom: 8 }} />
              <div style={{ height: 11, width: "25%", backgroundColor: "#f1f5f9", borderRadius: 5 }} />
            </div>
          </div>
          <div style={{ height: 15, backgroundColor: "#e5e7eb", borderRadius: 5, marginBottom: 8 }} />
          <div style={{ height: 15, width: "80%", backgroundColor: "#e5e7eb", borderRadius: 5, marginBottom: 8 }} />
          <div style={{ height: 15, width: "60%", backgroundColor: "#f1f5f9", borderRadius: 5 }} />
        </div>
        {/* Comments skeleton */}
        <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#e5e7eb", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 12, width: "30%", backgroundColor: "#e5e7eb", borderRadius: 5, marginBottom: 6 }} />
                <div style={{ height: 12, width: "70%", backgroundColor: "#f1f5f9", borderRadius: 5 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";
// src/app/arena/posts/[id]/page.tsx
// Arena post detail — full post view with comments.

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import {
  ArrowLeft, Heart, MessageCircle, Send, Trash2, Flag, Pencil,
  Trophy, Zap, Star, Video, Eye, Loader2, ChevronDown, Check, X,
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
  const params  = useParams<{ id: string }>();
  const id      = params?.id;
  const router      = useRouter();
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

  const [editing, setEditing]     = useState(false);
  const [editBody, setEditBody]   = useState("");
  const [saving, setSaving]       = useState(false);

  const [editingCommentId, setEditingCommentId]     = useState<string | null>(null);
  const [editingCommentBody, setEditingCommentBody] = useState("");
  const [savingComment, setSavingComment]           = useState(false);

  const [deletingCommentId, setDeletingCommentId]   = useState<string | null>(null);

  const [reportedComments, setReportedComments] = useState<Set<string>>(new Set());
  const [reportMenuId, setReportMenuId]         = useState<string | null>(null);

  const [postReported, setPostReported]   = useState(false);
  const [postReportMenu, setPostReportMenu] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting]           = useState(false);

  const commentInputRef  = useRef<HTMLTextAreaElement>(null);
  const reportMenuRef    = useRef<HTMLDivElement>(null);

  // Close report menus when tapping outside (mobile-safe)
  useEffect(() => {
    if (!reportMenuId && !postReportMenu) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (reportMenuRef.current && !reportMenuRef.current.contains(e.target as Node)) {
        setReportMenuId(null);
        setPostReportMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [reportMenuId, postReportMenu]);

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${useAuthStore.getState().token ?? ""}`,
    "Content-Type": "application/json",
  }), [token]);

  // ── Load post ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id || !hasHydrated) return;

    fetch(`${API}/arena/posts/${id}`, { headers: token ? authHeaders() : {} })
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
    fetch(`${API}/arena/posts/${postId}/comments?page=${page}`, { headers: token ? authHeaders() : {} })
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
    setDeletingCommentId(null);
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

  // ── Report post ────────────────────────────────────────────────────────────

  const reportPost = async (reason: string) => {
    if (!post) return;
    setPostReportMenu(false);
    setPostReported(true);
    try {
      await fetch(`${API}/arena/posts/${post.id}/report`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ reason }),
      });
    } catch {
      // keep optimistic state
    }
  };

  // ── Edit comment ───────────────────────────────────────────────────────────

  const startEditComment = (c: Comment) => {
    setEditingCommentId(c.id);
    setEditingCommentBody(c.body);
  };

  const saveEditComment = async (commentId: string) => {
    if (!post || !editingCommentBody.trim() || savingComment) return;
    setSavingComment(true);
    try {
      const r = await fetch(`${API}/arena/posts/${post.id}/comments/${commentId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ body: editingCommentBody.trim() }),
      });
      const d = await r.json();
      const updated: Comment = d.comment ?? d.data ?? d;
      setComments((prev) =>
        prev.map((c) => c.id === commentId ? { ...c, body: updated.body ?? editingCommentBody.trim() } : c)
      );
      setEditingCommentId(null);
    } catch {
      // keep editor open so user doesn't lose their edit
    } finally {
      setSavingComment(false);
    }
  };

  // ── Edit post ──────────────────────────────────────────────────────────────

  const startEdit = () => {
    if (!post) return;
    setEditBody(post.body);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!post || !editBody.trim() || saving) return;
    setSaving(true);
    try {
      const r = await fetch(`${API}/arena/posts/${post.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ body: editBody.trim() }),
      });
      const d = await r.json();
      const updated: Post = d.post ?? d.data ?? d;
      setPost((prev) => prev ? { ...prev, body: updated.body ?? editBody.trim() } : prev);
      setEditing(false);
    } catch {
      // keep editor open so user doesn't lose their changes
    } finally {
      setSaving(false);
    }
  };

  // ── Delete post ────────────────────────────────────────────────────────────

  const deletePost = async () => {
    if (!post || deleting) return;
    setDeleting(true);
    try {
      await fetch(`${API}/arena/posts/${post.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      router.push("/arena");
    } catch {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  // ── Report comment ─────────────────────────────────────────────────────────

  const reportComment = async (commentId: string, reason: string) => {
    if (!post) return;
    setReportMenuId(null);
    setReportedComments((prev) => new Set(prev).add(commentId));
    try {
      await fetch(`${API}/arena/posts/${post.id}/comments/${commentId}/report`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ reason }),
      });
    } catch {
      // keep optimistic "Reported" state — user already saw the confirmation
    }
  };

  // ── Render states ──────────────────────────────────────────────────────────

  if (!hasHydrated || loading) return <LoadingSkeleton />;

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

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px 16px 100px" }}>

        {/* ── Post card ─────────────────────────────────────────────────── */}
        <div style={{
          backgroundColor: typeMeta ? typeMeta.bg : "#fff",
          borderRadius: 16,
          border: typeMeta ? `1px solid ${typeMeta.border}` : "1px solid #e5e7eb",
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

              {/* Edit / Delete buttons — owner (edit+delete) or admin (delete only) */}
              {(isOwner || user?.role === "admin") && !editing && (
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  {isOwner && (
                    <button
                      onClick={startEdit}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4, display: "flex", alignItems: "center" }}
                      title="Edit post"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 4, display: "flex", alignItems: "center" }}
                    title="Delete post"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Delete confirmation banner */}
            {deleteConfirm && (
              <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#991b1b" }}>Delete this post? This cannot be undone.</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    disabled={deleting}
                    style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", background: "none", border: "1px solid #d1d5db", borderRadius: 8, padding: "5px 12px", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deletePost}
                    disabled={deleting}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "#fff", backgroundColor: deleting ? "#9ca3af" : "#dc2626", border: "none", borderRadius: 8, padding: "5px 12px", cursor: deleting ? "default" : "pointer" }}
                  >
                    {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    {deleting ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            )}

            {/* Milestone label */}
            {post.milestone_label && (
              <div style={{ fontSize: 12, fontWeight: 700, color: GRS_GREEN, backgroundColor: "#dcfce7", padding: "4px 12px", borderRadius: 20, display: "inline-block", marginBottom: 10 }}>
                {post.milestone_label}
              </div>
            )}

            {/* Body / Inline editor */}
            {editing ? (
              <div style={{ marginBottom: 14 }}>
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value.slice(0, 280))}
                  maxLength={280}
                  rows={4}
                  autoFocus
                  style={{ width: "100%", resize: "vertical", border: "1px solid #d1d5db", borderRadius: 10, padding: "10px 12px", fontSize: 15, fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box", outline: "none" }}
                />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: editBody.length > 250 ? "#ef4444" : "#9ca3af" }}>
                    {editBody.length}/280
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setEditing(false)}
                      disabled={saving}
                      style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "#6b7280", background: "none", border: "1px solid #d1d5db", borderRadius: 8, padding: "5px 12px", cursor: "pointer" }}
                    >
                      <X size={12} /> Cancel
                    </button>
                    <button
                      onClick={saveEdit}
                      disabled={!editBody.trim() || saving}
                      style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "#fff", backgroundColor: editBody.trim() && !saving ? GRS_GREEN : "#9ca3af", border: "none", borderRadius: 8, padding: "5px 12px", cursor: editBody.trim() && !saving ? "pointer" : "default" }}
                    >
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 15, color: "#111", lineHeight: 1.6, margin: "0 0 14px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {post.body}
              </p>
            )}
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

            {/* Right side: view count + report button */}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
              {post.view_count != null && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#9ca3af" }}>
                  <Eye size={13} /> {post.view_count}
                </span>
              )}

              {/* Report post — only visible to non-owners */}
              {!isOwner && (
                <div style={{ position: "relative" }}>
                  {postReported ? (
                    <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>Reported</span>
                  ) : (
                    <button
                      onClick={() => setPostReportMenu(!postReportMenu)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0, display: "flex", alignItems: "center" }}
                      title="Report post"
                    >
                      <Flag size={14} />
                    </button>
                  )}
                  {postReportMenu && (
                    <div style={{ position: "absolute", right: 0, bottom: 22, zIndex: 50, backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.12)", minWidth: 170, overflow: "hidden" }}>
                      {(["offensive", "spam", "harassment", "misinformation", "other"] as const).map((reason) => (
                        <button
                          key={reason}
                          onClick={() => reportPost(reason)}
                          style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", fontSize: 12, fontWeight: 600, color: "#374151", background: "none", border: "none", cursor: "pointer", textTransform: "capitalize", borderBottom: reason === "other" ? "none" : "1px solid #f3f4f6" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f9fafb"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Comments ──────────────────────────────────────────────────── */}
        <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e7eb" }}>

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
                      {/* Row 1 — name + role badge */}
                      <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0, marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: 12, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cName}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: cRoleColor, backgroundColor: `${cRoleColor}18`, padding: "0 5px", borderRadius: 10, textTransform: "capitalize", flexShrink: 0 }}>
                          {c.user?.role ?? "player"}
                        </span>
                      </div>
                      {/* Row 2 — timestamp + action buttons */}
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: "#9ca3af" }}>{timeAgo(c.created_at)}</span>
                        <div ref={reportMenuRef} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
                          {/* Report — only for other users' comments */}
                          {user && c.user?.id !== user.id && (
                            <div style={{ position: "relative" }}>
                              {reportedComments.has(c.id) ? (
                                <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>Reported</span>
                              ) : (
                                <button
                                  onClick={() => setReportMenuId(reportMenuId === c.id ? null : c.id)}
                                  style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 6, display: "flex", alignItems: "center" }}
                                  title="Report comment"
                                >
                                  <Flag size={14} />
                                </button>
                              )}
                              {reportMenuId === c.id && (
                                <div style={{ position: "absolute", right: 0, bottom: 28, zIndex: 50, backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.14)", minWidth: 150, overflow: "hidden" }}>
                                  {(["offensive", "spam", "harassment", "other"] as const).map((reason) => (
                                    <button
                                      key={reason}
                                      onClick={() => reportComment(c.id, reason)}
                                      style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 14px", fontSize: 13, fontWeight: 600, color: "#374151", background: "none", border: "none", cursor: "pointer", textTransform: "capitalize", borderBottom: reason === "other" ? "none" : "1px solid #f3f4f6" }}
                                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f9fafb"; }}
                                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                                    >
                                      {reason}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          {/* Edit — comment author only */}
                          {user && c.user?.id === user.id && editingCommentId !== c.id && deletingCommentId !== c.id && (
                            <button
                              onClick={() => startEditComment(c)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 6, display: "flex", alignItems: "center" }}
                              title="Edit comment"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {/* Delete — triggers confirmation, not immediate */}
                          {canDeleteComment(c) && editingCommentId !== c.id && deletingCommentId !== c.id && (
                            <button
                              onClick={() => setDeletingCommentId(c.id)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 6, display: "flex", alignItems: "center" }}
                              title="Delete comment"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Delete confirmation row */}
                      {deletingCommentId === c.id && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 10px", marginBottom: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#991b1b" }}>Delete this comment?</span>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={() => setDeletingCommentId(null)}
                              style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", background: "none", border: "1px solid #d1d5db", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => deleteComment(c.id)}
                              style={{ fontSize: 11, fontWeight: 700, color: "#fff", backgroundColor: "#dc2626", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                            >
                              <Trash2 size={11} /> Delete
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Inline editor or body */}
                      {editingCommentId === c.id ? (
                        <div style={{ marginTop: 6 }}>
                          <textarea
                            value={editingCommentBody}
                            onChange={(e) => setEditingCommentBody(e.target.value.slice(0, 280))}
                            maxLength={280}
                            rows={2}
                            autoFocus
                            style={{ width: "100%", resize: "vertical", border: "1px solid #d1d5db", borderRadius: 8, padding: "7px 10px", fontSize: 13, fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box", outline: "none" }}
                          />
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                            <span style={{ fontSize: 10, color: editingCommentBody.length > 250 ? "#ef4444" : "#9ca3af" }}>
                              {editingCommentBody.length}/280
                            </span>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                onClick={() => setEditingCommentId(null)}
                                disabled={savingComment}
                                style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", background: "none", border: "1px solid #d1d5db", borderRadius: 6, padding: "3px 10px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                              >
                                <X size={11} /> Cancel
                              </button>
                              <button
                                onClick={() => saveEditComment(c.id)}
                                disabled={!editingCommentBody.trim() || savingComment}
                                style={{ fontSize: 11, fontWeight: 700, color: "#fff", backgroundColor: editingCommentBody.trim() && !savingComment ? GRS_GREEN : "#9ca3af", border: "none", borderRadius: 6, padding: "3px 10px", cursor: editingCommentBody.trim() && !savingComment ? "pointer" : "default", display: "inline-flex", alignItems: "center", gap: 4 }}
                              >
                                {savingComment ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                                {savingComment ? "Saving…" : "Save"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.5, wordBreak: "break-word" }}>{c.body}</p>
                      )}
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

      {/* ── Fixed bottom comment bar ───────────────────────────────────────── */}
      <style>{`
        .arena-comment-bar {
          padding-bottom: max(10px, env(safe-area-inset-bottom, 0px)) !important;
        }
      `}</style>
      <div
        className="arena-comment-bar"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
          backgroundColor: "#fff", borderTop: "1px solid #e5e7eb",
          padding: "10px 16px 10px",
        }}
      >
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: GRS_GREEN, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
              style={{ width: "100%", resize: "none", border: "1px solid #e5e7eb", borderRadius: 22, padding: "9px 40px 9px 14px", fontSize: 14, outline: "none", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box", backgroundColor: "#f9fafb" }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
              }}
            />
            <button
              onClick={submitComment}
              disabled={!commentBody.trim() || submitting}
              style={{ position: "absolute", right: 10, bottom: 9, background: "none", border: "none", cursor: commentBody.trim() ? "pointer" : "default", padding: 0, color: commentBody.trim() ? GRS_GREEN : "#d1d5db" }}
            >
              {submitting ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
            </button>
          </div>
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

"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare, Send, ChevronDown, X,
  Trophy, Star, Zap, Globe, Users, Briefcase,
  Bell, Search, Video, Image, Activity, Target,
  TrendingUp, Eye, Calendar, BookOpen, Shield,
  Flame, CheckCircle,
} from "lucide-react";
import { useAuthStore, roleHomePath } from "@/lib/auth-store";
import { safeArray } from "@/lib/safe-array";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

// ── Types ────────────────────────────────────────────────────────────────────

interface PostUser {
  id: string;
  name: string;
  role: string;
  sport: string | null;
  province: string | null;
  thuto_score?: number | null;
}

interface ArenaPost {
  id: string;
  user_id: string;
  body: string;
  sport: string | null;
  province: string | null;
  post_type: "standard" | "milestone" | "achievement" | "scout_activity" | "session_milestone" | "prediction_upgrade";
  milestone_label: string | null;
  image_url: string | null;
  like_count: number;
  comment_count: number;
  liked: number;
  my_reaction?: string | null;
  created_at: string;
  is_auto?: boolean;
  metadata?: Record<string, string | number | null>;
  user: PostUser;
}

interface ArenaComment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  user: { id: string; name: string; role: string };
}

interface ScoutOnline {
  id: string;
  name: string;
  org: string;
  province: string;
}

interface TrendingTag {
  tag: string;
  count: number;
}

interface LeftPanelData {
  scout_views: number;
  following: number;
  followers: number;
  sessions: number;
  peak_level_label: string | null;
  thuto_score: number | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  player:  { label: "Player",  color: "#1a5c2a" },
  coach:   { label: "Coach",   color: "#1e40af" },
  scout:   { label: "Scout",   color: "#7c3aed" },
  fan:     { label: "Fan",     color: "#b45309" },
  admin:   { label: "Admin",   color: "#dc2626" },
  analyst: { label: "Analyst", color: "#0891b2" },
};

const POST_TYPE_META: Record<string, { label: string; color: string }> = {
  milestone:         { label: "Milestone",        color: "#c8962a" },
  achievement:       { label: "Achievement",       color: "#1a5c2a" },
  scout_activity:    { label: "Scout Activity",    color: "#7c3aed" },
  session_milestone: { label: "Session Milestone", color: "#0891b2" },
  prediction_upgrade:{ label: "Level Up",          color: "#c8962a" },
  standard:          { label: "",                  color: "" },
};

// ── Reactions ─────────────────────────────────────────────────────────────────

const REACTIONS = [
  { type: "heart",  emoji: "❤️", label: "Like" },
  { type: "fire",   emoji: "🔥", label: "Fire" },
  { type: "strong", emoji: "💪", label: "Strong" },
  { type: "trophy", emoji: "🏆", label: "Trophy" },
  { type: "clap",   emoji: "👏", label: "Clap" },
] as const;

const REACTION_EMOJI: Record<string, string> = {
  heart: "❤️", fire: "🔥", strong: "💪", trophy: "🏆", clap: "👏",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string | null | undefined): string {
  return (name ?? "?").split(" ").map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 2) || "?";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function authHeaders(token: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
               : { "Content-Type": "application/json" };
}

// ── ArenaNav (Concept B) ──────────────────────────────────────────────────────

function ArenaNav({
  user,
  token,
}: {
  user: { id: string; name: string; role: string } | null;
  token: string | null;
}) {
  const router = useRouter();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    useAuthStore.getState().logout();
    router.replace("/login");
  };

  const homePath = user ? roleHomePath(user.role as Parameters<typeof roleHomePath>[0]) : "/";

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      backgroundColor: "#ffffff",
      borderBottom: "1px solid #e5e5e5",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        padding: "0 16px",
        display: "flex", alignItems: "center", gap: 16, height: 60,
      }}>
        {/* Logo */}
        <Link href={homePath} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 6,
            backgroundColor: "#1a5c2a",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 800, fontSize: 18, fontFamily: "Georgia, serif",
          }}>G</div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>Grassroots Sports</div>
            <div style={{ fontSize: 11, color: "#888" }}>grassrootssports.live</div>
          </div>
        </Link>

        {/* Hub nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: 8 }} className="hidden md:flex">
          {[
            { href: "/player",  label: "⚽ Player Hub" },
            { href: "/coach",   label: "🎽 Coach Hub" },
            { href: "/scout",   label: "🔍 Scout Hub" },
            { href: "/fan",     label: "👥 Fan Hub" },
            { href: "/analyst", label: "📊 Analyst Hub" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "4px 10px",
                fontSize: 12,
                fontWeight: 500,
                color: "#555",
                textDecoration: "none",
                borderBottom: "2px solid transparent",
                transition: "color 0.15s, border-color 0.15s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#1a5c2a";
                (e.currentTarget as HTMLElement).style.borderBottomColor = "#1a5c2a";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#555";
                (e.currentTarget as HTMLElement).style.borderBottomColor = "transparent";
              }}
            >{item.label}</Link>
          ))}
        </div>

        {/* Search */}
        <div style={{ flex: 1, maxWidth: 280, position: "relative" }} className="hidden md:block">
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
          <input
            placeholder="Search athletes, clubs..."
            style={{
              width: "100%", paddingLeft: 32, paddingRight: 12,
              height: 32, border: "1px solid #e0e0e0", borderRadius: 16,
              fontSize: 13, color: "#333", backgroundColor: "#f5f5f5",
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Partner badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          borderLeft: "1px solid #e5e5e5", paddingLeft: 12,
          flexShrink: 0, fontSize: 11, color: "#555", fontWeight: 500,
        }} className="hidden lg:flex">
          <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#22c55e", flexShrink: 0 }} />
          Teach For Zimbabwe
        </div>

        {/* Right icons */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <Link href="/arena/notifications" style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", fontSize: 18 }}>
            🔔
            <div style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", backgroundColor: "#e53935", color: "#fff", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>3</div>
          </Link>
          <Link href="/arena/messages" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", fontSize: 18 }}>
            ✉️
          </Link>

          {user ? (
            <div ref={dropRef} style={{ position: "relative" }}>
              <button
                onClick={() => setDropOpen((o) => !o)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "4px 8px", borderRadius: 20,
                  border: "1px solid #e5e5e5", background: "#fff",
                  cursor: "pointer", fontSize: 13,
                }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  backgroundColor: "#1a5c2a", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700,
                }}>{initials(user.name)}</div>
                <ChevronDown size={13} color="#555" />
              </button>
              {dropOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", right: 0,
                  background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.10)", minWidth: 160, zIndex: 100,
                  overflow: "hidden",
                }}>
                  <div style={{ padding: "12px 14px", borderBottom: "1px solid #f0f0f0" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 2, textTransform: "capitalize" }}>{user.role}</div>
                  </div>
                  {[
                    { href: roleHomePath(user.role as Parameters<typeof roleHomePath>[0]), label: "My Dashboard" },
                    { href: "/arena/profile/" + user.id, label: "Arena Profile" },
                    { href: "/settings", label: "Settings" },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{ display: "block", padding: "10px 14px", fontSize: 13, color: "#333", textDecoration: "none" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#f5f5f5")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                      onClick={() => setDropOpen(false)}
                    >{item.label}</Link>
                  ))}
                  <button
                    onClick={handleLogout}
                    style={{ width: "100%", textAlign: "left", padding: "10px 14px", fontSize: 13, color: "#dc2626", background: "none", border: "none", cursor: "pointer", borderTop: "1px solid #f0f0f0" }}
                  >Sign out</button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" style={{
              padding: "6px 14px", borderRadius: 20,
              backgroundColor: "#1a5c2a", color: "#fff",
              fontSize: 12, fontWeight: 600, textDecoration: "none",
            }}>Sign in</Link>
          )}
        </div>
      </div>
    </nav>
  );
}

// ── PostComposer ──────────────────────────────────────────────────────────────

function PostComposer({
  user,
  token,
  onPosted,
}: {
  user: { id: string; name: string; role: string } | null;
  token: string | null;
  onPosted: (post: ArenaPost) => void;
}) {
  const [body, setBody]             = useState("");
  const [postType, setPostType]     = useState<"standard" | "milestone" | "achievement">("standard");
  const [milestoneLabel, setMilestoneLabel] = useState("");
  const [sport, setSport]           = useState("");
  const [province, setProvince]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded]     = useState(false);
  const [imageFile, setImageFile]   = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX = 280;

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return;
    if (file.size > 5 * 1024 * 1024) return; // 5MB max
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setExpanded(true);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    setImageUploading(true);
    try {
      const presignRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: imageFile.name,
          content_type: imageFile.type,
          folder: "arena",
        }),
      });
      if (!presignRes.ok) return null;
      const { upload_url, public_url } = await presignRes.json();
      if (!upload_url) return null;
      await fetch(upload_url, { method: "PUT", body: imageFile, headers: { "Content-Type": imageFile.type } });
      return public_url as string | null;
    } catch {
      return null;
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!body.trim() || !token) return;
    setSubmitting(true);
    try {
      const imageUrl = await uploadImage();
      const res = await fetch(`${API}/arena/posts`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
          body: body.slice(0, MAX),
          post_type: postType,
          milestone_label: postType !== "standard" ? milestoneLabel : undefined,
          sport: sport || undefined,
          province: province || undefined,
          image_url: imageUrl || undefined,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        onPosted(json.data ?? json);
        setBody(""); setPostType("standard"); setMilestoneLabel(""); setSport(""); setProvince("");
        setImageFile(null); setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setExpanded(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{
      backgroundColor: "#fff", borderRadius: 12,
      border: "1px solid #e5e5e5", padding: 16, marginBottom: 12,
    }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={handleImagePick}
      />

      <div style={{ display: "flex", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
          backgroundColor: "#1a5c2a", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700,
        }}>{initials(user.name)}</div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onFocus={() => setExpanded(true)}
          placeholder="Share a training moment, milestone, or update..."
          rows={expanded ? 3 : 1}
          style={{
            flex: 1, border: "1px solid #e5e5e5", borderRadius: 20,
            padding: "8px 14px", fontSize: 14, resize: "none",
            outline: "none", fontFamily: "inherit", color: "#1a1a1a",
            backgroundColor: "#f9f9f9", lineHeight: 1.5, transition: "height 0.15s",
          }}
        />
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div style={{ marginTop: 10, paddingLeft: 46, position: "relative", display: "inline-block" }}>
          <img
            src={imagePreview}
            alt="Post image preview"
            style={{ maxHeight: 200, maxWidth: "100%", borderRadius: 8, display: "block", border: "1px solid #e5e5e5" }}
          />
          <button
            onClick={removeImage}
            aria-label="Remove image"
            style={{
              position: "absolute", top: 6, right: 6,
              width: 22, height: 22, borderRadius: "50%",
              backgroundColor: "rgba(0,0,0,0.55)", color: "#fff",
              border: "none", cursor: "pointer", fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center",
              lineHeight: 1,
            }}
          >×</button>
        </div>
      )}

      {expanded && (
        <div style={{ marginTop: 12, paddingLeft: 46 }}>
          {/* Post type selector */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {(["standard", "milestone", "achievement"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setPostType(t)}
                style={{
                  padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                  border: `1px solid ${postType === t ? "#1a5c2a" : "#e0e0e0"}`,
                  backgroundColor: postType === t ? "#1a5c2a" : "#fff",
                  color: postType === t ? "#fff" : "#555", cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >{t}</button>
            ))}
          </div>

          {postType !== "standard" && (
            <input
              value={milestoneLabel}
              onChange={(e) => setMilestoneLabel(e.target.value)}
              placeholder={postType === "milestone" ? "e.g. First hat-trick" : "e.g. Selected for NASH team"}
              style={{
                width: "100%", padding: "8px 12px", border: "1px solid #e0e0e0",
                borderRadius: 8, fontSize: 13, outline: "none", marginBottom: 8,
                boxSizing: "border-box",
              }}
            />
          )}

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            <input
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              placeholder="Sport (optional)"
              style={{ padding: "6px 10px", border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 12, outline: "none", width: 130 }}
            />
            <input
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              placeholder="Province (optional)"
              style={{ padding: "6px 10px", border: "1px solid #e0e0e0", borderRadius: 8, fontSize: 12, outline: "none", width: 150 }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: body.length > MAX * 0.85 ? "#dc2626" : "#aaa" }}>
                {body.length}/{MAX}
              </span>
              {/* Photo picker */}
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Add photo"
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  background: "none", border: "none", cursor: "pointer",
                  color: imageFile ? "#1a5c2a" : "#999", fontSize: 12, padding: 0,
                }}
              >
                <Image size={16} />
                <span style={{ fontSize: 12 }}>{imageFile ? "1 photo" : "Photo"}</span>
              </button>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => { setExpanded(false); setBody(""); removeImage(); }}
                style={{ padding: "7px 14px", borderRadius: 20, border: "1px solid #e0e0e0", background: "#fff", fontSize: 13, cursor: "pointer", color: "#555" }}
              >Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={!body.trim() || submitting || imageUploading || body.length > MAX}
                style={{
                  padding: "7px 18px", borderRadius: 20,
                  backgroundColor: body.trim() && !submitting && !imageUploading ? "#1a5c2a" : "#ccc",
                  color: "#fff", fontSize: 13, fontWeight: 600,
                  border: "none", cursor: body.trim() && !submitting && !imageUploading ? "pointer" : "not-allowed",
                }}
              >{imageUploading ? "Uploading…" : submitting ? "Posting…" : "Post"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CommentSection ────────────────────────────────────────────────────────────

function CommentSection({
  postId,
  token,
}: {
  postId: string;
  token: string | null;
}) {
  const [comments, setComments] = useState<ArenaComment[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [newBody,  setNewBody]  = useState("");
  const [sending,  setSending]  = useState(false);

  useEffect(() => {
    fetch(`${API}/arena/posts/${postId}/comments`, { headers: authHeaders(token) })
      .then((r) => r.json())
      .then((d) => setComments(safeArray(d.data ?? d)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId, token]);

  const send = async () => {
    if (!newBody.trim() || !token) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/arena/posts/${postId}/comments`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ body: newBody.trim() }),
      });
      if (res.ok) {
        const json = await res.json();
        setComments((prev) => [...prev, json.data ?? json]);
        setNewBody("");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f0f0f0" }}>
      {loading ? (
        <div style={{ fontSize: 12, color: "#aaa", padding: "4px 0" }}>Loading…</div>
      ) : (
        comments.map((c) => (
          <div key={c.id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              backgroundColor: "#1a5c2a", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 700,
            }}>{initials(c.user?.name ?? "?")}</div>
            <div style={{ flex: 1, backgroundColor: "#f5f5f5", borderRadius: 10, padding: "6px 10px" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#333" }}>{c.user?.name ?? "User"} </span>
              <span style={{ fontSize: 12, color: "#555" }}>{c.body}</span>
              <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>{timeAgo(c.created_at)}</div>
            </div>
          </div>
        ))
      )}
      {token && (
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Write a comment…"
            style={{
              flex: 1, border: "1px solid #e0e0e0", borderRadius: 20,
              padding: "6px 12px", fontSize: 13, outline: "none",
              backgroundColor: "#f9f9f9",
            }}
          />
          <button
            onClick={send}
            disabled={!newBody.trim() || sending}
            style={{
              width: 32, height: 32, borderRadius: "50%", border: "none",
              backgroundColor: newBody.trim() ? "#1a5c2a" : "#ddd",
              cursor: newBody.trim() ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          ><Send size={14} color="#fff" /></button>
        </div>
      )}
    </div>
  );
}

// ── PostCard ──────────────────────────────────────────────────────────────────

function PostCard({
  post,
  token,
  currentUserId,
}: {
  post: ArenaPost;
  token: string | null;
  currentUserId: string;
}) {
  const [myReaction,   setMyReaction]   = useState<string | null>(post.my_reaction ?? (post.liked ? "heart" : null));
  const [likeCount,    setLikeCount]    = useState(post.like_count);
  const [showPicker,   setShowPicker]   = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleReact = async (type: string) => {
    setShowPicker(false);
    const prev        = myReaction;
    const isToggleOff = prev === type;

    // Optimistic update
    setMyReaction(isToggleOff ? null : type);
    setLikeCount((c) => c + (isToggleOff ? -1 : prev ? 0 : 1));

    try {
      const res = await fetch(`${API}/arena/posts/${post.id}/like`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ reaction: type }),
      });
      if (res.ok) {
        const json = await res.json();
        setMyReaction(json.reaction ?? null);
        if (typeof json.total === "number") setLikeCount(json.total);
      } else {
        setMyReaction(prev);
        setLikeCount((c) => c + (isToggleOff ? 1 : prev ? 0 : -1));
      }
    } catch {
      setMyReaction(prev);
      setLikeCount((c) => c + (isToggleOff ? 1 : prev ? 0 : -1));
    }
  };

  const typeMeta = POST_TYPE_META[post.post_type] ?? POST_TYPE_META.standard;
  const badge    = ROLE_BADGE[post.user?.role ?? ""] ?? ROLE_BADGE.player;

  const isCelebration = post.post_type === "milestone" || post.post_type === "achievement";
  const isLevelUp     = post.post_type === "prediction_upgrade";

  return (
    <div style={{
      backgroundColor: isCelebration ? "#f0fdf4" : "#fff",
      borderRadius: 12,
      border: isCelebration ? "1px solid #bbf7d0" : isLevelUp ? "1px solid #fde68a" : "1px solid #e5e5e5",
      padding: 16, marginBottom: 10,
    }}>
      {/* Auto-post banner */}
      {post.is_auto && typeMeta.label && (
        <div style={{
          marginBottom: 10, padding: "6px 10px", borderRadius: 8,
          backgroundColor: typeMeta.color + "18",
          borderLeft: `3px solid ${typeMeta.color}`,
          fontSize: 12, fontWeight: 600, color: typeMeta.color,
        }}>🎯 {typeMeta.label}</div>
      )}

      {/* Header */}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <Link href={`/arena/profile/${post.user?.id}`} style={{ textDecoration: "none" }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
            backgroundColor: "#1a5c2a", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700,
          }}>{initials(post.user?.name ?? "?")}</div>
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Link href={`/arena/profile/${post.user?.id}`} style={{ textDecoration: "none" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{post.user?.name ?? "User"}</span>
            </Link>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "1px 7px", borderRadius: 20,
              backgroundColor: badge.color + "18", color: badge.color,
            }}>{badge.label}</span>
            {post.user?.sport && (
              <span style={{ fontSize: 11, color: "#1a5c2a", backgroundColor: "#1a5c2a18", padding: "1px 7px", borderRadius: 20 }}>
                {post.user.sport}
              </span>
            )}
            {post.user?.province && (
              <span style={{ fontSize: 11, color: "#1a5c2a" }}>· {post.user.province}</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>{timeAgo(post.created_at)}</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ marginTop: 10, fontSize: 14, color: "#333", lineHeight: 1.6 }}>{post.body}</div>

      {/* Post image */}
      {post.image_url && (
        <div style={{ marginTop: 10 }}>
          <img
            src={post.image_url}
            alt="Post image"
            loading="lazy"
            style={{ width: "100%", maxHeight: 400, objectFit: "cover", borderRadius: 8, display: "block" }}
          />
        </div>
      )}

      {/* Milestone label */}
      {post.milestone_label && !post.is_auto && (
        <div style={{
          marginTop: 8, padding: "6px 12px", borderRadius: 8,
          backgroundColor: typeMeta.color ? typeMeta.color + "18" : "#f5f5f5",
          fontSize: 13, fontWeight: 600, color: typeMeta.color || "#555",
          display: "inline-block",
        }}>🏅 {post.milestone_label}</div>
      )}

      {/* Tags */}
      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        {post.sport && (
          <span style={{ fontSize: 11, color: "#1a5c2a", backgroundColor: "#1a5c2a18", padding: "2px 8px", borderRadius: 20 }}>
            #{post.sport}
          </span>
        )}
        {post.province && (
          <span style={{ fontSize: 11, color: "#666", backgroundColor: "#f0f0f0", padding: "2px 8px", borderRadius: 20 }}>
            #{post.province}
          </span>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 16, marginTop: 12, paddingTop: 10, borderTop: "1px solid #f5f5f5" }}>
        {/* Reaction button with hover picker */}
        <div
          style={{ position: "relative", display: "inline-flex" }}
          onMouseEnter={() => setShowPicker(true)}
          onMouseLeave={() => setShowPicker(false)}
        >
          {/* Floating emoji picker */}
          {showPicker && (
            <div style={{
              position: "absolute", bottom: "calc(100% + 8px)", left: 0,
              display: "flex", gap: 2, padding: "5px 8px",
              backgroundColor: "#fff", borderRadius: 24,
              boxShadow: "0 4px 20px rgba(0,0,0,0.13)", border: "1px solid #e5e5e5",
              zIndex: 20,
            }}>
              {REACTIONS.map((r) => (
                <button
                  key={r.type}
                  title={r.label}
                  onClick={() => handleReact(r.type)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 20, padding: "2px 5px", borderRadius: 8,
                    transform: myReaction === r.type ? "scale(1.35)" : "scale(1)",
                    transition: "transform 0.12s",
                    outline: myReaction === r.type ? "2px solid #1a5c2a30" : "none",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.35)"; }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      myReaction === r.type ? "scale(1.35)" : "scale(1)";
                  }}
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}

          {/* Main reaction button */}
          <button
            onClick={() => handleReact(myReaction ?? "heart")}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "none", border: "none", cursor: "pointer",
              color: myReaction ? "#dc2626" : "#888", fontSize: 13, fontWeight: 500,
              padding: 0,
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>
              {myReaction ? (REACTION_EMOJI[myReaction] ?? "❤️") : "🤍"}
            </span>
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
        </div>
        <button
          onClick={() => setShowComments((s) => !s)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "none", border: "none", cursor: "pointer",
            color: "#888", fontSize: 13, fontWeight: 500, padding: 0,
          }}
        >
          <MessageSquare size={16} />
          {post.comment_count > 0 && <span>{post.comment_count}</span>}
        </button>
      </div>

      {/* Comments */}
      {showComments && <CommentSection postId={post.id} token={token} />}
    </div>
  );
}

// ── FeedSkeleton ──────────────────────────────────────────────────────────────

function FeedSkeleton() {
  return (
    <div>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{
          backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5",
          padding: 16, marginBottom: 10,
        }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "#eee" }} className="animate-pulse" />
            <div style={{ flex: 1 }}>
              <div style={{ height: 14, width: "40%", backgroundColor: "#eee", borderRadius: 4, marginBottom: 6 }} className="animate-pulse" />
              <div style={{ height: 11, width: "25%", backgroundColor: "#eee", borderRadius: 4 }} className="animate-pulse" />
            </div>
          </div>
          <div style={{ height: 14, width: "90%", backgroundColor: "#eee", borderRadius: 4, marginBottom: 6 }} className="animate-pulse" />
          <div style={{ height: 14, width: "70%", backgroundColor: "#eee", borderRadius: 4 }} className="animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// ── ScoutsOnlineWidget ────────────────────────────────────────────────────────

function ScoutsOnlineWidget({ token }: { token: string | null }) {
  const [scouts, setScouts] = useState<ScoutOnline[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/arena/scouts-online`, { headers: authHeaders(token) })
      .then((r) => r.json())
      .then((d) => setScouts(safeArray<ScoutOnline>(d.data ?? d)))
      .catch(() => {});
  }, [token]);

  if (scouts.length === 0) return null;

  return (
    <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", padding: 14, marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#22c55e", display: "inline-block" }} />
        Scouts Online ({scouts.length})
      </div>
      {scouts.slice(0, 3).map((s) => (
        <div key={s.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#1e3a6e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
              {initials(s.name)}
            </div>
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 9, height: 9, borderRadius: "50%", backgroundColor: "#22c55e", border: "2px solid #fff" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#333" }}>{s.name}</div>
            <div style={{ fontSize: 11, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.org} · {s.province}</div>
          </div>
          <button style={{
            padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600,
            border: "1px solid #1a5c2a", backgroundColor: "#fff", color: "#1a5c2a",
            cursor: "pointer", flexShrink: 0,
          }}>View</button>
        </div>
      ))}
      <div style={{ marginTop: 4, fontSize: 11, color: "#888", textAlign: "center" }}>
        {scouts.length} scout{scouts.length !== 1 ? "s" : ""} browsing now
      </div>
    </div>
  );
}

// ── RightPanel ────────────────────────────────────────────────────────────────

function RightPanel({ token, user }: { token: string | null; user: { id: string; name: string; role: string } | null }) {
  const [leaderboard, setLeaderboard] = useState<Array<{ id: string; initials: string; sport: string; province: string; projected_score: number; peak_level_label: string }>>([]);
  const [suggested,   setSuggested]   = useState<Array<{ id: string; name: string; role: string; sport: string; province: string; is_following: boolean }>>([]);
  const [trending,    setTrending]    = useState<TrendingTag[]>([]);

  useEffect(() => {
    const h = authHeaders(token);
    Promise.allSettled([
      fetch(`${API}/arena/leaderboard`,  { headers: h }).then((r) => r.json()),
      fetch(`${API}/arena/suggested`,    { headers: h }).then((r) => r.json()),
      fetch(`${API}/arena/trending`,     { headers: h }).then((r) => r.json()),
    ]).then(([lb, sg, tr]) => {
      if (lb.status === "fulfilled") setLeaderboard(safeArray((lb.value as {data?: unknown}).data ?? lb.value));
      if (sg.status === "fulfilled") setSuggested(safeArray((sg.value as {data?: unknown}).data ?? sg.value));
      if (tr.status === "fulfilled") setTrending(safeArray((tr.value as {data?: unknown}).data ?? tr.value));
    });
  }, [token]);

  const follow = async (userId: string) => {
    if (!token) return;
    setSuggested((prev) => prev.map((u) => u.id === userId ? { ...u, is_following: !u.is_following } : u));
    await fetch(`${API}/arena/follow/${userId}`, { method: "POST", headers: authHeaders(token) }).catch(() => {});
  };

  return (
    <aside style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Scouts Online — first */}
      <ScoutsOnlineWidget token={token} />

      {/* Trending tags — second */}
      {trending.length > 0 && (
        <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <TrendingUp size={13} color="#1a5c2a" /> Trending in Zimbabwe
          </div>
          {trending.slice(0, 6).map((t) => (
            <div key={t.tag} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "#1a5c2a", fontWeight: 500 }}>#{t.tag}</span>
              <span style={{ fontSize: 11, color: "#aaa" }}>{t.count} posts</span>
            </div>
          ))}
        </div>
      )}

      {/* THUTO Top 50 — third */}
      {leaderboard.length > 0 && (
        <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <Trophy size={13} color="#c8962a" /> THUTO Top 50
          </div>
          {leaderboard.slice(0, 5).map((p, i) => (
            <div key={p.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <div style={{ width: 18, fontSize: 11, fontWeight: 700, color: i < 3 ? "#c8962a" : "#aaa", textAlign: "center" }}>
                {i + 1}
              </div>
              <Link href={`/arena/profile/${p.id}`} style={{ display: "flex", gap: 6, alignItems: "center", textDecoration: "none", flex: 1 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", backgroundColor: "#1a5c2a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
                  {p.initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#333" }}>{p.initials}</div>
                  <div style={{ fontSize: 10, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.peak_level_label}</div>
                </div>
              </Link>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1a5c2a" }}>{p.projected_score}</div>
              </div>
            </div>
          ))}
          <Link href="/talent-leaderboard" style={{ display: "block", textAlign: "center", marginTop: 6, fontSize: 12, color: "#1a5c2a", fontWeight: 600, textDecoration: "none" }}>
            View full leaderboard →
          </Link>
        </div>
      )}

      {/* Players like you — fourth */}
      {suggested.length > 0 && (
        <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a", marginBottom: 10 }}>Players like you</div>
          {suggested.slice(0, 3).map((u) => (
            <div key={u.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
              <Link href={`/arena/profile/${u.id}`} style={{ textDecoration: "none" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: "#1a5c2a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                  {initials(u.name)}
                </div>
              </Link>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                <div style={{ fontSize: 11, color: "#888", textTransform: "capitalize" }}>{u.role} · {u.province || "Zimbabwe"}</div>
              </div>
              <button
                onClick={() => follow(u.id)}
                style={{
                  padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600,
                  border: "0.5px solid #1a5c2a",
                  backgroundColor: u.is_following ? "#1a5c2a" : "#fff",
                  color: u.is_following ? "#fff" : "#1a5c2a",
                  cursor: "pointer", flexShrink: 0,
                }}
              >{u.is_following ? "Following" : "Follow"}</button>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

// ── LeftPanel ─────────────────────────────────────────────────────────────────

function LeftPanel({
  user,
  token,
}: {
  user: { id: string; name: string; role: string } | null;
  token: string | null;
}) {
  const [panelData, setPanelData] = useState<LeftPanelData>({
    scout_views: 0, following: 0, followers: 0, sessions: 0,
    peak_level_label: null, thuto_score: null,
  });

  useEffect(() => {
    if (!user || !token) return;
    Promise.allSettled([
      fetch(`${API}/arena/profile/${user.id}`, { headers: authHeaders(token) }).then((r) => r.json()),
      fetch(`${API}/players/${user.id}/view-count`, { headers: authHeaders(token) }).then((r) => r.json()),
    ]).then(([profile, viewCount]) => {
      const p = profile.status === "fulfilled" ? profile.value : null;
      const vc = viewCount.status === "fulfilled" ? viewCount.value : null;
      setPanelData({
        scout_views:      vc?.count ?? 0,
        following:        p?.user?.following_count ?? p?.following ?? 0,
        followers:        p?.user?.followers_count ?? p?.followers ?? 0,
        sessions:         p?.user?.sessions ?? 0,
        peak_level_label: p?.user?.peak_level_label ?? p?.prediction?.peak_level_label ?? null,
        thuto_score:      p?.user?.thuto_score ?? p?.prediction?.projected_score ?? null,
      });
    });
  }, [user, token]);

  if (!user) {
    return (
      <aside>
        <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 6 }}>Join The Arena</div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 14 }}>Connect with Zimbabwean athletes</div>
          <Link href="/register/who" style={{ display: "block", padding: "8px 16px", borderRadius: 20, backgroundColor: "#1a5c2a", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none", marginBottom: 8 }}>
            Create Account
          </Link>
          <Link href="/login" style={{ display: "block", padding: "8px 16px", borderRadius: 20, border: "1px solid #e0e0e0", color: "#555", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            Sign In
          </Link>
        </div>
      </aside>
    );
  }

  const badge = ROLE_BADGE[user.role] ?? ROLE_BADGE.player;

  return (
    <aside>
      {/* Profile card */}
      <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", overflow: "hidden", marginBottom: 10 }}>
        {/* Green header strip */}
        <div style={{ height: 48, backgroundColor: "#1a5c2a" }} />
        <div style={{ padding: "0 16px 16px", marginTop: -24 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            backgroundColor: "#1a5c2a", border: "3px solid #fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 8,
          }}>{initials(user.name)}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>{user.name}</div>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
            backgroundColor: badge.color + "18", color: badge.color,
          }}>{badge.label}</span>

          {/* THUTO score */}
          {panelData.thuto_score !== null && (
            <div style={{
              marginTop: 10, padding: "8px 10px", borderRadius: 8,
              backgroundColor: "#1a5c2a18", textAlign: "center",
            }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>THUTO Score</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#1a5c2a" }}>{panelData.thuto_score}</div>
              {panelData.peak_level_label && (
                <div style={{ fontSize: 11, color: "#555" }}>{panelData.peak_level_label}</div>
              )}
            </div>
          )}

          {/* Stats 2×2 grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", marginTop: 12, border: "1px solid #e5e5e5", borderRadius: 8, overflow: "hidden" }}>
            {[
              { label: "Scout Views", value: panelData.scout_views, icon: <Eye size={12} /> },
              { label: "Following",   value: panelData.following,   icon: <Users size={12} /> },
              { label: "Followers",   value: panelData.followers,   icon: <Users size={12} /> },
              { label: "Sessions",    value: panelData.sessions,     icon: <Activity size={12} /> },
            ].map((s, i) => (
              <div
                key={s.label}
                style={{
                  padding: "10px 8px", textAlign: "center",
                  borderRight: i % 2 === 0 ? "1px solid #e5e5e5" : "none",
                  borderTop: i >= 2 ? "1px solid #e5e5e5" : "none",
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "#888", marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                  <span style={{ color: "#1a5c2a" }}>{s.icon}</span>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          <Link
            href={`/arena/profile/${user.id}`}
            style={{
              display: "block", marginTop: 12, textAlign: "center",
              padding: "7px 0", borderRadius: 20,
              fontSize: 12, fontWeight: 600, color: "#fff", textDecoration: "none",
              backgroundColor: "#1a5c2a",
            }}
          >View my profile</Link>
        </div>
      </div>

      {/* Quick nav — Concept B 3-section menu */}
      <div style={{ backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", padding: 14 }}>
        {/* MY FEED */}
        <div style={{ fontSize: 9, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", marginBottom: 6, textTransform: "uppercase" }}>My Feed</div>
        {[
          { href: "/arena",               label: "🏠 Home Feed" },
          { href: "/arena/notifications", label: "🔔 Arena Alerts" },
          { href: "/arena/messages",      label: "✉️ Messages" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{ display: "block", padding: "5px 0 5px 8px", fontSize: 12, color: "#555", textDecoration: "none", borderLeft: "2px solid transparent" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#1a5c2a"; (e.currentTarget as HTMLElement).style.borderLeftColor = "#c8962a"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#555"; (e.currentTarget as HTMLElement).style.borderLeftColor = "transparent"; }}
          >{item.label}</Link>
        ))}

        {/* MY HUBS */}
        <div style={{ fontSize: 9, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "12px 0 6px", textTransform: "uppercase" }}>My Hubs</div>
        {[
          { href: "/player",  label: "⚽ Player Hub" },
          { href: "/coach",   label: "🎽 Coach Hub" },
          { href: "/scout",   label: "🔍 Scout Hub" },
          { href: "/fan",     label: "👥 Fan Hub" },
          { href: "/analyst", label: "📊 Analyst Hub" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{ display: "block", padding: "5px 0 5px 8px", fontSize: 12, color: "#555", textDecoration: "none", borderLeft: "2px solid transparent" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#1a5c2a"; (e.currentTarget as HTMLElement).style.borderLeftColor = "#c8962a"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#555"; (e.currentTarget as HTMLElement).style.borderLeftColor = "transparent"; }}
          >{item.label}</Link>
        ))}

        {/* COMMUNITY */}
        <div style={{ fontSize: 9, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em", margin: "12px 0 6px", textTransform: "uppercase" }}>Community</div>
        {[
          { href: "/arena/discover",    label: "🌍 Discover Athletes" },
          { href: "/arena/clubs",       label: "🏟️ Clubs" },
          { href: "/arena/recruitment", label: "📋 Talent Board" },
          { href: "/talent-leaderboard", label: "🏆 THUTO Top 50" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{ display: "block", padding: "5px 0 5px 8px", fontSize: 12, color: "#555", textDecoration: "none", borderLeft: "2px solid transparent" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#1a5c2a"; (e.currentTarget as HTMLElement).style.borderLeftColor = "#c8962a"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#555"; (e.currentTarget as HTMLElement).style.borderLeftColor = "transparent"; }}
          >{item.label}</Link>
        ))}
      </div>
    </aside>
  );
}

// ── ArenaFeedPage ─────────────────────────────────────────────────────────────

type FeedTab = "for-you" | "following" | "my-school" | "top-50";

const TAB_ENDPOINT: Record<FeedTab, string> = {
  "for-you":    "/arena/feed",
  "following":  "/arena/feed/following",
  "my-school":  "/arena/feed/school",
  "top-50":     "/arena/feed/top50",
};

const TAB_LABELS: Record<FeedTab, string> = {
  "for-you":    "All activity",
  "following":  "Following",
  "my-school":  "My school",
  "top-50":     "Top 50",
};

export default function ArenaFeedPage() {
  const user       = useAuthStore((s) => s.user);
  const token      = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [activeTab, setActiveTab] = useState<FeedTab>("for-you");
  const [posts,     setPosts]     = useState<ArenaPost[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [hasMore,   setHasMore]   = useState(true);

  // Wait for Zustand hydration
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (hasHydrated) { setHydrated(true); return; }
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, [hasHydrated]);

  const fetchFeed = async (tab: FeedTab, pg: number, replace = false) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}${TAB_ENDPOINT[tab]}?page=${pg}&per_page=20`, {
        headers: authHeaders(token),
      });
      if (!res.ok) { setLoading(false); return; }
      const json = await res.json();
      const items: ArenaPost[] = safeArray(json.data ?? json);
      if (replace) {
        setPosts(items);
      } else {
        setPosts((prev) => {
          const ids = new Set(prev.map((p) => p.id));
          return [...prev, ...items.filter((p) => !ids.has(p.id))];
        });
      }
      setHasMore(items.length === 20);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hydrated) return;
    setPage(1);
    fetchFeed(activeTab, 1, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, hydrated]);

  const handleTabChange = (tab: FeedTab) => {
    setActiveTab(tab);
    setPosts([]);
    setPage(1);
  };

  const handlePosted = (post: ArenaPost) => {
    setPosts((prev) => [post, ...prev]);
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchFeed(activeTab, next, false);
  };

  if (!hydrated) return null;

  return (
    <div style={{ backgroundColor: "#eaeaea", minHeight: "100vh" }}>
      <ArenaNav user={user} token={token} />

      {/* Main 3-column layout */}
      <div style={{
        maxWidth: 1200, margin: "0 auto", padding: "20px 16px",
        display: "grid",
        gridTemplateColumns: "240px 1fr 280px",
        gap: 16,
        alignItems: "start",
      }}
        className="arena-grid"
      >
        {/* Left panel */}
        <LeftPanel user={user} token={token} />

        {/* Centre: feed */}
        <main>
          {/* Feed tabs */}
          <div style={{
            backgroundColor: "#fff", borderRadius: 12,
            border: "1px solid #e5e5e5", marginBottom: 12,
            padding: "0 4px",
          }}>
            <div style={{ display: "flex", borderBottom: "1px solid #f0f0f0" }}>
              {(Object.keys(TAB_LABELS) as FeedTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  style={{
                    padding: "12px 16px",
                    fontSize: 13, fontWeight: activeTab === tab ? 700 : 500,
                    color: activeTab === tab ? "#1a5c2a" : "#888",
                    background: "none", border: "none", cursor: "pointer",
                    borderBottom: activeTab === tab ? "2px solid #1a5c2a" : "2px solid transparent",
                    marginBottom: -1, whiteSpace: "nowrap", transition: "all 0.15s",
                  }}
                >{TAB_LABELS[tab]}</button>
              ))}
            </div>
          </div>

          {/* Post composer */}
          <PostComposer user={user} token={token} onPosted={handlePosted} />

          {/* Scouts online widget */}
          <ScoutsOnlineWidget token={token} />

          {/* Posts */}
          {loading && posts.length === 0 ? (
            <FeedSkeleton />
          ) : posts.length === 0 ? (
            <div style={{
              backgroundColor: "#fff", borderRadius: 12, border: "1px solid #e5e5e5",
              padding: 40, textAlign: "center",
            }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🏟️</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 6 }}>The Arena is quiet</div>
              <div style={{ fontSize: 13, color: "#888" }}>
                {activeTab === "following"
                  ? "Follow athletes to see their updates here."
                  : activeTab === "my-school"
                  ? "No posts from your school yet."
                  : "Be the first to post something!"}
              </div>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  token={token}
                  currentUserId={user?.id ?? ""}
                />
              ))}
              {hasMore && (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    style={{
                      padding: "8px 24px", borderRadius: 20,
                      border: "1px solid #e0e0e0", backgroundColor: "#fff",
                      fontSize: 13, color: "#555", cursor: "pointer", fontWeight: 500,
                    }}
                  >{loading ? "Loading…" : "Load more"}</button>
                </div>
              )}
            </>
          )}
        </main>

        {/* Right panel */}
        <RightPanel token={token} user={user} />
      </div>

      {/* Responsive: collapse to single column on mobile */}
      <style>{`
        @media (max-width: 900px) {
          .arena-grid {
            grid-template-columns: 1fr !important;
          }
          .arena-grid > aside:first-child,
          .arena-grid > aside:last-child {
            display: none;
          }
        }
        @media (max-width: 1100px) and (min-width: 901px) {
          .arena-grid {
            grid-template-columns: 200px 1fr !important;
          }
          .arena-grid > aside:last-child {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

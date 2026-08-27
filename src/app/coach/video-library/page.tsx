"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import {
  Play, Trash2, Film, Library, Upload, Share2, Check,
  Loader2, Link as LinkIcon, Download, Video, ChevronUp,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterKey = "all" | "match" | "match_eye" | "training" | "drill_analysis" | "arena_post" | "whatsapp";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all",            label: "All Videos" },
  { key: "match",          label: "Match Videos" },
  { key: "match_eye",      label: "Match Eye" },
  { key: "training",       label: "Training" },
  { key: "drill_analysis", label: "Drill" },
  { key: "arena_post",     label: "Arena" },
  { key: "whatsapp",       label: "WhatsApp" },
];

interface MatchVideo {
  id: string;
  title: string;
  match_date: string;
  opponent: string | null;
  competition: string | null;
  video_url: string;
  thumbnail_url: string | null;
  arena_post_id: string | null;
  view_count: number;
  _source: "match";
}

type ThumbState = "idle" | "generating" | "ready" | "skipped";

async function generateThumbnailSafe(file: File): Promise<Blob | null> {
  try {
    const { generateThumbnail } = await import("@/lib/ffmpeg-processor");
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 10_000));
    return await Promise.race([generateThumbnail(file), timeout]);
  } catch {
    return null;
  }
}

interface MediaItem {
  id: string;
  r2_url: string;
  title: string | null;
  context: string;
  duration_seconds: number | null;
  size_bytes: number | null;
  view_count: number;
  created_at: string;
  is_ai_analysed: boolean;
  _source: "media";
}

type VideoItem = MatchVideo | MediaItem;

const CONTEXT_COLORS: Record<string, { color: string; bg: string }> = {
  match_eye:      { color: "#166534", bg: "#dcfce7" },
  training:       { color: "#1e40af", bg: "#dbeafe" },
  drill_analysis: { color: "#92400e", bg: "#fef3c7" },
  arena_post:     { color: "#581c87", bg: "#f3e8ff" },
  showcase:       { color: "#0e7490", bg: "#cffafe" },
  whatsapp:       { color: "#166534", bg: "#bbf7d0" },
  fan_hub:        { color: "#be185d", bg: "#fce7f3" },
};

function ctxStyle(ctx: string) {
  return CONTEXT_COLORS[ctx] ?? { color: "#374151", bg: "#f3f4f6" };
}

function ctxLabel(ctx: string) {
  const map: Record<string, string> = {
    match_eye: "Match Eye", training: "Training", drill_analysis: "Drill",
    arena_post: "Arena", showcase: "Showcase", whatsapp: "WhatsApp", fan_hub: "Fan Hub",
  };
  return map[ctx] ?? ctx;
}

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30)  return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function formatSize(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  if (bytes >= 1_000_000)     return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${(bytes / 1_000).toFixed(0)} KB`;
}

// ─── Match Video Card ─────────────────────────────────────────────────────────

function MatchVideoCard({
  video, token,
  onDelete, onPosted,
}: {
  video: MatchVideo;
  token: string | null;
  onDelete: (id: string) => void;
  onPosted: (id: string, arenaPostId: string) => void;
}) {
  const [playing,   setPlaying]   = useState(false);
  const [posting,   setPosting]   = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [copied,    setCopied]    = useState(false);

  async function handlePostToArena() {
    setPosting(true);
    try {
      const dateStr = new Date(video.match_date).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
      });
      const parts = [
        `Match Video: ${video.title}`,
        video.opponent   ? `vs ${video.opponent}`   : null,
        video.competition ?? null,
        dateStr,
        "Watch the full match — link in the comments.",
      ].filter(Boolean);

      const res = await fetch(`${API}/arena/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          body: parts.join(" · "),
          post_type: "standard",
          video_url: video.video_url,
          metadata: {
            match_video_id: video.id,
            watch_url: `${window.location.origin}/watch/${video.id}`,
            opponent: video.opponent,
            competition: video.competition,
          },
        }),
      });
      const d = await res.json();
      const arenaPostId: string | null = d?.data?.id ?? d?.id ?? null;
      if (arenaPostId) {
        await fetch(`${API}/coach/match-videos/${video.id}/arena`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ arena_post_id: arenaPostId }),
        }).catch(() => {});
        onPosted(video.id, arenaPostId);
      }
    } catch { /* silent */ } finally {
      setPosting(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this match video? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`${API}/coach/match-videos/${video.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token ?? ""}` },
    }).catch(() => {});
    onDelete(video.id);
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/watch/${video.id}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div style={{ backgroundColor: "white", borderRadius: 12, padding: "14px 18px", border: "1px solid #e5e7eb" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        {/* Thumbnail or film icon */}
        <div style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: video.thumbnail_url ? undefined : "#f0fdf4" }}>
          {video.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={video.thumbnail_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Film size={18} color="#1a5c2a" />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#111" }}>{video.title}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#1a5c2a", backgroundColor: "#f0fdf4", padding: "1px 8px", borderRadius: 10, border: "1px solid #bbf7d0" }}>
              Match Video
            </span>
            {video.arena_post_id && (
              <span style={{ fontSize: 11, fontWeight: 600, color: "#7c3aed", backgroundColor: "#f3e8ff", padding: "1px 8px", borderRadius: 10 }}>
                On Arena
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
            {new Date(video.match_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            {video.opponent    ? ` · vs ${video.opponent}`    : ""}
            {video.competition ? ` · ${video.competition}`    : ""}
            {` · ${video.view_count} view${video.view_count !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button onClick={handleDelete} disabled={deleting} title="Delete"
          style={{ background: "none", border: "none", cursor: "pointer", color: "#d1d5db", padding: 4, flexShrink: 0 }}>
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {/* Play / Close */}
        <button onClick={() => setPlaying((p) => !p)}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", backgroundColor: playing ? "#1a3d26" : "#1a5c2a", color: "white", borderRadius: 7, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>
          {playing ? <><ChevronUp size={11} /> Close</> : <><Play size={11} fill="white" /> Play</>}
        </button>

        {/* Post to Arena */}
        {video.arena_post_id ? (
          <Link href="/arena"
            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", backgroundColor: "#f0fdf4", color: "#1a5c2a", borderRadius: 7, fontSize: 12, fontWeight: 700, textDecoration: "none", border: "1px solid #bbf7d0" }}>
            <Check size={11} /> Posted to Arena
          </Link>
        ) : (
          <button onClick={handlePostToArena} disabled={posting}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", backgroundColor: "#f3f4f6", color: "#374151", borderRadius: 7, fontSize: 12, fontWeight: 700, border: "1px solid #e5e7eb", cursor: posting ? "not-allowed" : "pointer" }}>
            {posting ? <><Loader2 size={11} className="animate-spin" /> Posting…</> : <><Share2 size={11} /> Post to Arena</>}
          </button>
        )}

        {/* Download */}
        {video.video_url && (
          <a href={video.video_url} download target="_blank" rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", backgroundColor: "#f3f4f6", color: "#374151", borderRadius: 7, fontSize: 12, fontWeight: 700, textDecoration: "none", border: "1px solid #e5e7eb" }}>
            <Download size={11} /> Download
          </a>
        )}

        {/* Copy link */}
        <button onClick={handleCopyLink}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", backgroundColor: copied ? "#f0fdf4" : "#f3f4f6", color: copied ? "#1a5c2a" : "#374151", borderRadius: 7, fontSize: 12, fontWeight: 700, border: "1px solid #e5e7eb", cursor: "pointer" }}>
          {copied ? <><Check size={11} /> Copied!</> : <><LinkIcon size={11} /> Copy Link</>}
        </button>
      </div>

      {/* Inline player */}
      {playing && video.video_url && (
        <div style={{ marginTop: 14 }}>
          <video controls autoPlay src={video.video_url}
            style={{ width: "100%", display: "block", borderRadius: 10, backgroundColor: "#000", maxHeight: 420 }} />
        </div>
      )}
    </div>
  );
}

// ─── Media Item Card ──────────────────────────────────────────────────────────

function MediaCard({ item, onDelete }: { item: MediaItem; onDelete: (id: string) => void }) {
  const [playing,  setPlaying]  = useState(false);
  const [deleting, setDeleting] = useState(false);
  const token = useAuthStore((s) => s.token);
  const style = ctxStyle(item.context);

  async function handleDelete() {
    if (!confirm("Delete this video? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`${API}/media/${item.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    }).catch(() => {});
    onDelete(item.id);
  }

  return (
    <div style={{ backgroundColor: "white", borderRadius: 12, padding: "14px 18px", border: "1px solid #e5e7eb" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.title ?? "Untitled clip"}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: style.color, backgroundColor: style.bg, padding: "1px 8px", borderRadius: 10 }}>
              {ctxLabel(item.context)}
            </span>
            {item.is_ai_analysed && (
              <span style={{ fontSize: 11, fontWeight: 700, color: "#c8962a", backgroundColor: "#fffbeb", padding: "1px 8px", borderRadius: 10 }}>AI</span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
            {timeAgo(item.created_at)}
            {item.size_bytes ? ` · ${formatSize(item.size_bytes)}` : ""}
            {` · ${item.view_count} view${item.view_count !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button onClick={handleDelete} disabled={deleting} title="Delete"
          style={{ background: "none", border: "none", cursor: "pointer", color: "#d1d5db", padding: 4, flexShrink: 0 }}>
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={() => setPlaying((p) => !p)}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", backgroundColor: playing ? "#1a3d26" : "#1a5c2a", color: "white", borderRadius: 7, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>
          {playing ? <><ChevronUp size={11} /> Close</> : <><Play size={11} fill="white" /> Play</>}
        </button>
        <a href={item.r2_url} download target="_blank" rel="noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", backgroundColor: "#f3f4f6", color: "#374151", borderRadius: 7, fontSize: 12, fontWeight: 700, textDecoration: "none", border: "1px solid #e5e7eb" }}>
          <Download size={11} /> Download
        </a>
      </div>

      {playing && (
        <div style={{ marginTop: 14 }}>
          <video controls autoPlay src={item.r2_url}
            style={{ width: "100%", display: "block", borderRadius: 10, backgroundColor: "#000", maxHeight: 420 }} />
        </div>
      )}
    </div>
  );
}

// ─── Upload Form ──────────────────────────────────────────────────────────────

function UploadForm({ token, onUploaded }: { token: string | null; onUploaded: (v: MatchVideo) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle]             = useState("");
  const [matchDate, setMatchDate]     = useState("");
  const [opponent, setOpponent]       = useState("");
  const [competition, setCompetition] = useState("");
  const [file, setFile]               = useState<File | null>(null);
  const [uploading, setUploading]     = useState(false);
  const [progress, setProgress]       = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [thumbState, setThumbState]   = useState<ThumbState>("idle");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title || !matchDate) {
      setUploadError("Title, match date, and video file are required.");
      return;
    }
    setUploadError("");
    setUploading(true);
    setProgress(0);
    setThumbState("idle");
    try {
      // Start thumbnail generation in parallel — never blocks the video upload
      let thumbnailUrlPromise: Promise<string | null> = Promise.resolve(null);
      if (file) {
        setThumbState("generating");
        thumbnailUrlPromise = (async () => {
          const blob = await generateThumbnailSafe(file);
          if (!blob) { setThumbState("skipped"); return null; }
          setThumbState("ready");
          try {
            const pr = await fetch("/api/upload/presigned", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileName: "thumbnail.jpg", contentType: "image/jpeg", source: "match_thumbnails" }),
            });
            const { uploadUrl: tUrl, publicUrl: tPublic } = await pr.json();
            if (tUrl) {
              await fetch(tUrl, { method: "PUT", body: blob, headers: { "Content-Type": "image/jpeg" } });
              return tPublic as string;
            }
          } catch { /* silent — thumbnail is optional */ }
          return null;
        })();
      }

      const presignRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type || "video/mp4", source: "match_videos" }),
      });
      const { uploadUrl, publicUrl, key } = await presignRes.json();

      if (uploadUrl) {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.upload.addEventListener("progress", (ev) => {
            if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
          });
          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              const msg = `R2 upload failed (${xhr.status}): ${xhr.responseText}`;
              console.error("[VideoLibrary] R2 PUT error:", msg);
              reject(new Error(msg));
            }
          });
          xhr.addEventListener("error", () => {
            const msg = "Network error during upload — connection may have dropped";
            console.error("[VideoLibrary] XHR network error:", msg);
            reject(new Error(msg));
          });
          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
          xhr.send(file);
        });
      }

      // Give thumbnail pipeline up to 5 s after XHR finishes (on 2G it will have
      // long finished during the upload window; this covers edge cases only).
      const thumbnailUrl = await Promise.race([
        thumbnailUrlPromise,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5_000)),
      ]);

      // Read token fresh from Zustand at the moment of POST — avoids stale closure
      // capturing a null value from an earlier render before hydration completed.
      const freshToken = useAuthStore.getState().token;
      if (!freshToken) {
        throw new Error("Your session expired — please refresh the page and log in again.");
      }
      const saveRes = await fetch(`${API}/coach/match-videos`, {
        method: "POST",
        headers: { Authorization: `Bearer ${freshToken}`, "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          title, match_date: matchDate,
          opponent: opponent || null,
          competition: competition || null,
          video_url: publicUrl || "",
          r2_key: key || "",
          thumbnail_url: thumbnailUrl || null,
        }),
      });
      if (!saveRes.ok) {
        const text = await saveRes.text().catch(() => "(no body)");
        console.error("[VideoLibrary] save failed:", saveRes.status, text.slice(0, 300));
        const status = saveRes.status;
        let msg: string;
        if (status === 401) {
          msg = "Your session expired — please refresh the page, log in again, and retry.";
        } else if (status === 422) {
          msg = "Validation error — please check your entries and try again.";
        } else if (status === 500) {
          msg = "Could not save your video details — please try again in a moment.";
        } else if (status === 502 || status === 503 || status === 504) {
          msg = "Server is starting up — please wait 30 seconds and try submitting again.";
        } else {
          msg = "Upload failed — please try again.";
        }
        throw new Error(msg);
      }
      const saved = await saveRes.json();
      if (saved.data) {
        onUploaded({ ...saved.data, _source: "match" });
        setTitle(""); setMatchDate(""); setOpponent(""); setCompetition(""); setFile(null);
        if (fileRef.current) fileRef.current.value = "";
        setThumbState("idle");
        setOpen(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed. Please try again.";
      console.error("[VideoLibrary] Upload error:", err);
      setUploadError(msg);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 20px", backgroundColor: "#1a5c2a", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", marginBottom: 24 }}>
        <Upload size={14} /> Upload Match Video
      </button>
    );
  }

  return (
    <form onSubmit={handleUpload}
      style={{ backgroundColor: "white", borderRadius: 14, padding: 22, border: "1px solid #e5e7eb", marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#111" }}>Upload Match Video</p>
        <button type="button" onClick={() => setOpen(false)}
          style={{ background: "none", border: "none", fontSize: 18, color: "#9ca3af", cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Match Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. vs St George — Cup QF" required
            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Match Date *</label>
          <input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} required
            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Opponent</label>
          <input value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="e.g. Harare Lions FC"
            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Competition</label>
          <input value={competition} onChange={(e) => setCompetition(e.target.value)} placeholder="e.g. NASH Cup 2026"
            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }} />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Video File *</label>
        <input ref={fileRef} type="file" accept="video/mp4,video/quicktime,video/avi,video/webm"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={{ fontSize: 13, width: "100%" }} />
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#9ca3af" }}>MP4, MOV, AVI or WebM — max 2 GB</p>
      </div>

      {uploading && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ height: 6, backgroundColor: "#e5e7eb", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, backgroundColor: "#1a5c2a", transition: "width 0.3s" }} />
          </div>
          <p style={{ fontSize: 12, color: "#6b7280", margin: "6px 0 0" }}>Uploading… {progress}%</p>
          {thumbState !== "idle" && (
            <p style={{ fontSize: 11, margin: "4px 0 0", color: thumbState === "ready" ? "#1a5c2a" : "#9ca3af" }}>
              {thumbState === "generating" && "Generating thumbnail (optional)…"}
              {thumbState === "ready"      && "✓ Thumbnail ready"}
              {thumbState === "skipped"    && "Thumbnail skipped — will use default icon"}
            </p>
          )}
        </div>
      )}

      {uploadError && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{uploadError}</p>}

      <button type="submit" disabled={uploading || !file}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 20px", backgroundColor: uploading || !file ? "#d1d5db" : "#1a5c2a", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: uploading || !file ? "not-allowed" : "pointer" }}>
        {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <><Upload size={14} /> Upload</>}
      </button>
    </form>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CoachVideoLibraryPage() {
  const token = useAuthStore((s) => s.token);

  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  // Match videos
  const [matchVideos, setMatchVideos] = useState<MatchVideo[]>([]);
  const [matchLoading, setMatchLoading] = useState(true);

  // Auto-captured media
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    // Fetch match videos
    fetch(`${API}/coach/match-videos`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setMatchVideos((Array.isArray(d.data) ? d.data : []).map((v: MatchVideo) => ({ ...v, _source: "match" as const }))))
      .catch(() => {})
      .finally(() => setMatchLoading(false));

    // Fetch auto-captured media
    fetch(`${API}/media?page=1`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } })
      .then((r) => r.json())
      .then((d) => setMediaItems((Array.isArray(d.data) ? d.data : []).map((m: MediaItem) => ({ ...m, _source: "media" as const }))))
      .catch(() => {})
      .finally(() => setMediaLoading(false));
  }, [token]);

  // Filter logic
  const visibleMatchVideos = activeFilter === "all" || activeFilter === "match" ? matchVideos : [];
  const visibleMediaItems  = activeFilter === "all"
    ? mediaItems
    : activeFilter === "match"
    ? []
    : mediaItems.filter((m) => m.context === activeFilter);

  const totalCount = matchVideos.length + mediaItems.length;
  const loading    = matchLoading && mediaLoading;

  function handleMatchDeleted(id: string) {
    setMatchVideos((prev) => prev.filter((v) => v.id !== id));
  }

  function handleMatchPosted(id: string, arenaPostId: string) {
    setMatchVideos((prev) => prev.map((v) => v.id === id ? { ...v, arena_post_id: arenaPostId } : v));
  }

  function handleMediaDeleted(id: string) {
    setMediaItems((prev) => prev.filter((m) => m.id !== id));
  }

  function handleUploaded(v: MatchVideo) {
    setMatchVideos((prev) => [v, ...prev]);
    setActiveFilter("match");
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Header */}
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb", padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: "#1a5c2a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Library size={18} color="#c8962a" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>Video Library</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            {loading ? "Loading…" : `${totalCount} video${totalCount !== 1 ? "s" : ""} — upload, play back, share`}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 64px" }}>

        {/* Upload button */}
        <UploadForm token={token} onUploaded={handleUploaded} />

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setActiveFilter(f.key)}
              style={{ padding: "6px 14px", borderRadius: 20, border: "1.5px solid", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.15s",
                borderColor: activeFilter === f.key ? "#1a5c2a" : "#d1d5db",
                backgroundColor: activeFilter === f.key ? "#1a5c2a" : "#fff",
                color: activeFilter === f.key ? "#fff" : "#374151" }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 10px", display: "block" }} />
            Loading videos…
          </div>
        )}

        {/* Empty state */}
        {!loading && visibleMatchVideos.length === 0 && visibleMediaItems.length === 0 && (
          <div style={{ textAlign: "center", padding: "56px 24px", backgroundColor: "white", borderRadius: 14, border: "1px solid #e5e7eb" }}>
            <Video size={36} color="#d1d5db" style={{ margin: "0 auto 14px", display: "block" }} />
            <p style={{ fontWeight: 700, fontSize: 15, color: "#374151", margin: "0 0 6px" }}>
              {activeFilter === "match" ? "No match videos yet" : activeFilter === "all" ? "No videos yet" : `No ${FILTERS.find((f) => f.key === activeFilter)?.label ?? ""} videos`}
            </p>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
              {activeFilter === "match" || activeFilter === "all"
                ? "Click \"Upload Match Video\" above to get started."
                : "Videos captured in this section will appear here automatically."}
            </p>
          </div>
        )}

        {/* Match videos */}
        {!loading && visibleMatchVideos.length > 0 && (
          <div style={{ marginBottom: visibleMediaItems.length > 0 ? 28 : 0 }}>
            {activeFilter === "all" && (
              <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Match Videos ({matchVideos.length})
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {visibleMatchVideos.map((v) => (
                <MatchVideoCard key={v.id} video={v} token={token}
                  onDelete={handleMatchDeleted} onPosted={handleMatchPosted} />
              ))}
            </div>
          </div>
        )}

        {/* Auto-captured media */}
        {!loading && visibleMediaItems.length > 0 && (
          <div>
            {activeFilter === "all" && (
              <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Auto-Captured ({mediaItems.length})
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {visibleMediaItems.map((m) => (
                <MediaCard key={m.id} item={m} onDelete={handleMediaDeleted} />
              ))}
            </div>
          </div>
        )}

        {/* Tip */}
        <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 16px", marginTop: 28 }}>
          <p style={{ margin: "0 0 3px", fontWeight: 700, fontSize: 12, color: "#92400e" }}>How to share with parents and players</p>
          <p style={{ margin: 0, fontSize: 12, color: "#78350f", lineHeight: 1.6 }}>
            Upload → <b>Play</b> to review → click <b>Post to Arena</b> when ready to share.
            Parents need a free Fan account at <b>grassrootssports.live/register</b>.
            Share the Watch link via WhatsApp for direct access.
          </p>
        </div>

      </div>
    </div>
  );
}

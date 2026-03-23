"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Film, Upload, Trash2, Play, X, Plus, Copy, Check,
  HardDrive, Tag, Clock, AlertCircle, ChevronRight, Loader2,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PlayerVideo {
  id: string;
  title: string;
  description?: string;
  r2_key: string;
  tag: VideoTag;
  duration?: number;
  size_mb: number;
  thumbnail_url?: string;
  video_url: string;
  created_at: string;
}

interface StorageInfo {
  used_mb: number;
  limit_mb: number;
}

type VideoTag = "Goals" | "Skills" | "Assists" | "Defending" | "Full Match";

const TAG_COLORS: Record<VideoTag, string> = {
  Goals:       "bg-green-500/20 text-green-400 border-green-500/30",
  Skills:      "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Assists:     "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Defending:   "bg-red-500/20 text-red-400 border-red-500/30",
  "Full Match":"bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const TAG_OPTIONS: VideoTag[] = ["Goals", "Skills", "Assists", "Defending", "Full Match"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(seconds?: number): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatSize(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(1)} MB`;
}

function StorageBar({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min((used / limit) * 100, 100);
  const color =
    pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-green-500";
  return (
    <div className="rounded-xl border border-white/10 bg-card/60 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <HardDrive className="h-4 w-4" />
          <span>Storage</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatSize(used)} / {formatSize(limit)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {(100 - pct).toFixed(0)}% remaining
      </p>
    </div>
  );
}

// ─── Upload Form ──────────────────────────────────────────────────────────────

interface UploadState {
  file: File | null;
  title: string;
  tag: VideoTag;
  description: string;
  progress: number;
  uploading: boolean;
  error: string;
  dragging: boolean;
}

function UploadPanel({ onUploaded }: { onUploaded: (v: PlayerVideo) => void }) {
  const [state, setState] = useState<UploadState>({
    file: null, title: "", tag: "Skills", description: "",
    progress: 0, uploading: false, error: "", dragging: false,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const set = (patch: Partial<UploadState>) =>
    setState((s) => ({ ...s, ...patch }));

  function acceptFile(file: File) {
    const allowed = ["video/mp4", "video/quicktime", "video/webm", "video/avi", "video/x-msvideo"];
    if (!allowed.includes(file.type)) {
      set({ error: "Only MP4, MOV, WebM or AVI files are accepted." });
      return;
    }
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > 500) {
      set({ error: "File must be under 500 MB." });
      return;
    }
    set({ file, title: file.name.replace(/\.[^.]+$/, ""), error: "" });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    set({ dragging: false });
    const file = e.dataTransfer.files[0];
    if (file) acceptFile(file);
  }

  async function handleUpload() {
    if (!state.file || !state.title.trim()) {
      set({ error: "Please add a title." });
      return;
    }
    set({ uploading: true, error: "", progress: 0 });

    const form = new FormData();
    form.append("file", state.file);
    form.append("title", state.title);
    form.append("tag", state.tag);
    if (state.description) form.append("description", state.description);

    try {
      const res = await api.post("/player/vault/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress(evt) {
          if (evt.total) {
            set({ progress: Math.round((evt.loaded / evt.total) * 100) });
          }
        },
      });
      onUploaded(res.data.video);
      set({
        file: null, title: "", tag: "Skills", description: "",
        progress: 0, uploading: false, error: "",
      });
      if (inputRef.current) inputRef.current.value = "";
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Upload failed. Please try again.";
      set({ uploading: false, error: msg });
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-card/60 p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-accent/70">
        <Upload className="h-4 w-4" /> Upload Highlight
      </h2>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); set({ dragging: true }); }}
        onDragLeave={() => set({ dragging: false })}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`mb-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed py-8 transition-colors ${
          state.dragging
            ? "border-primary bg-primary/10"
            : "border-white/20 hover:border-primary/50 hover:bg-white/5"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,video/avi,video/x-msvideo"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) acceptFile(f); }}
        />
        {state.file ? (
          <>
            <Film className="mb-2 h-8 w-8 text-primary" />
            <p className="text-sm font-medium text-white">{state.file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatSize(state.file.size / (1024 * 1024))}
            </p>
          </>
        ) : (
          <>
            <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag &amp; drop or click to select
            </p>
            <p className="text-xs text-muted-foreground">MP4, MOV, WebM, AVI · max 500 MB</p>
          </>
        )}
      </div>

      {state.error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {state.error}
        </div>
      )}

      {/* Fields */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Video title *"
          value={state.title}
          onChange={(e) => set({ title: e.target.value })}
          className="w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />

        <select
          value={state.tag}
          onChange={(e) => set({ tag: e.target.value as VideoTag })}
          className="w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
        >
          {TAG_OPTIONS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <textarea
          placeholder="Description (optional)"
          value={state.description}
          onChange={(e) => set({ description: e.target.value })}
          rows={2}
          className="w-full resize-none rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>

      {/* Progress */}
      {state.uploading && (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Uploading…</span>
            <span>{state.progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-200"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={state.uploading || !state.file}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {state.uploading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
        ) : (
          <><Upload className="h-4 w-4" /> Upload Video</>
        )}
      </button>
    </div>
  );
}

// ─── Video Card ───────────────────────────────────────────────────────────────

function VideoCard({
  video,
  onPlay,
  onDelete,
  selected,
  selectable,
  onToggleSelect,
}: {
  video: PlayerVideo;
  onPlay: (v: PlayerVideo) => void;
  onDelete: (id: string) => void;
  selected?: boolean;
  selectable?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Delete "${video.title}"?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/player/vault/${video.id}`);
      onDelete(video.id);
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div
      onClick={() => {
        if (selectable) onToggleSelect?.(video.id);
        else onPlay(video);
      }}
      className={`group relative cursor-pointer overflow-hidden rounded-xl border transition-all ${
        selected
          ? "border-primary bg-primary/10 ring-1 ring-primary"
          : "border-white/10 bg-card/60 hover:border-white/20 hover:bg-card"
      }`}
    >
      {/* Thumbnail / poster */}
      <div className="relative aspect-video w-full overflow-hidden bg-black/40">
        {video.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl">⚽</span>
          </div>
        )}
        {/* Play overlay */}
        {!selectable && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
            <div className="rounded-full bg-black/60 p-3">
              <Play className="h-6 w-6 text-white" />
            </div>
          </div>
        )}
        {/* Select checkbox */}
        {selectable && (
          <div className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
            selected ? "border-primary bg-primary" : "border-white/60 bg-black/40"
          }`}>
            {selected && <Check className="h-3.5 w-3.5 text-white" />}
          </div>
        )}
        {/* Tag badge */}
        <div className="absolute left-2 top-2">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${TAG_COLORS[video.tag]}`}>
            {video.tag}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="truncate text-sm font-medium text-white">{video.title}</p>
        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(video.duration)}
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              {formatSize(video.size_mb)}
            </span>
          </div>
          {!selectable && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100 disabled:opacity-40"
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Video Modal ──────────────────────────────────────────────────────────────

function VideoModal({ video, onClose }: { video: PlayerVideo; onClose: () => void }) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h3 className="font-semibold text-white">{video.title}</h3>
            <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${TAG_COLORS[video.tag]}`}>
              {video.tag}
            </span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <video
            src={video.video_url}
            controls
            autoPlay
            className="w-full rounded-lg bg-black"
            style={{ maxHeight: "60vh" }}
          />
          {video.description && (
            <p className="mt-3 text-sm text-muted-foreground">{video.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Create Reel Modal ────────────────────────────────────────────────────────

function CreateReelModal({
  videos,
  onClose,
  onCreated,
}: {
  videos: PlayerVideo[];
  onClose: () => void;
  onCreated: (shareUrl: string, title: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreate() {
    if (!title.trim()) { setError("Please enter a reel title."); return; }
    if (selected.size === 0) { setError("Select at least one video."); return; }
    setCreating(true);
    setError("");
    try {
      const res = await api.post("/player/vault/reel", {
        title,
        video_ids: Array.from(selected),
      });
      onCreated(res.data.share_url, title);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to create reel.";
      setError(msg);
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h3 className="flex items-center gap-2 font-semibold text-white">
            <Film className="h-5 w-5 text-primary" /> Create Highlight Reel
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          <input
            type="text"
            placeholder="Reel title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-4 w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />

          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-accent/70">
            Select videos ({selected.size} selected)
          </p>

          <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto">
            {videos.map((v) => (
              <VideoCard
                key={v.id}
                video={v}
                onPlay={() => {}}
                onDelete={() => {}}
                selectable
                selected={selected.has(v.id)}
                onToggleSelect={toggle}
              />
            ))}
          </div>

          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={creating}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {creating ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
            ) : (
              <><Plus className="h-4 w-4" /> Create &amp; Get Share Link</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Share Link Panel ────────────────────────────────────────────────────────

function ShareLinkPanel({ url, title, onDismiss }: { url: string; title: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/10 p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Reel created: {title}</p>
        <button onClick={onDismiss} className="text-muted-foreground hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Share this link with scouts and coaches:
      </p>
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-background px-3 py-2">
        <span className="flex-1 truncate text-xs text-accent">{url}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          {copied ? <><Check className="h-3 w-3" /> Copied!</> : <><Copy className="h-3 w-3" /> Copy</>}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PlayerVaultPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [videos, setVideos] = useState<PlayerVideo[]>([]);
  const [storage, setStorage] = useState<StorageInfo>({ used_mb: 0, limit_mb: 500 });
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<PlayerVideo | null>(null);
  const [showReelModal, setShowReelModal] = useState(false);
  const [shareLink, setShareLink] = useState<{ url: string; title: string } | null>(null);

  const fetchVault = useCallback(async () => {
    try {
      const res = await api.get("/player/vault");
      setVideos(res.data.videos ?? []);
      setStorage(res.data.storage);
    } catch {
      // silently fail — empty state shown
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    if (user.role !== "player" && user.role !== "admin") { router.push("/dashboard"); return; }
    fetchVault();
  }, [user, router, fetchVault]);

  function handleUploaded(video: PlayerVideo) {
    setVideos((prev) => [video, ...prev]);
    setStorage((prev) => ({
      ...prev,
      used_mb: round1(prev.used_mb + video.size_mb),
    }));
  }

  function handleDeleted(id: string) {
    const deleted = videos.find((v) => v.id === id);
    setVideos((prev) => prev.filter((v) => v.id !== id));
    if (deleted) {
      setStorage((prev) => ({
        ...prev,
        used_mb: round1(Math.max(0, prev.used_mb - deleted.size_mb)),
      }));
    }
  }

  function handleReelCreated(url: string, title: string) {
    setShowReelModal(false);
    setShareLink({ url, title });
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-auto p-6 pt-16 lg:pt-6">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-widest text-accent">
            Player Hub
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-white">
            <Film className="h-6 w-6 text-primary" />
            Highlight Vault
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Upload, manage and share your best football moments with scouts
          </p>
        </div>

        {/* Share link panel */}
        {shareLink && (
          <div className="mb-6">
            <ShareLinkPanel
              url={shareLink.url}
              title={shareLink.title}
              onDismiss={() => setShareLink(null)}
            />
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          {/* Left column — storage + upload */}
          <div className="space-y-5">
            <StorageBar used={storage.used_mb} limit={storage.limit_mb} />
            <UploadPanel onUploaded={handleUploaded} />
          </div>

          {/* Right column — video grid */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent/70">
                Your Videos ({videos.length})
              </p>
              {videos.length > 1 && (
                <button
                  onClick={() => setShowReelModal(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-primary/20 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/30"
                >
                  <Plus className="h-3.5 w-3.5" /> Create Highlight Reel
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-video animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 py-16 text-center">
                <Film className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-medium text-white">No videos yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload your first highlight to get started
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onPlay={setPlayingVideo}
                    onDelete={handleDeleted}
                  />
                ))}
              </div>
            )}

            {/* Tag legend */}
            {videos.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                {TAG_OPTIONS.map((tag) => (
                  <span key={tag} className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${TAG_COLORS[tag]}`}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* CTA for single-video accounts */}
            {videos.length === 1 && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-card/60 px-4 py-3 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-accent" />
                Upload at least 2 videos to create a shareable highlight reel.
                <ChevronRight className="h-4 w-4 ml-auto" />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Video playback modal */}
      {playingVideo && (
        <VideoModal video={playingVideo} onClose={() => setPlayingVideo(null)} />
      )}

      {/* Create reel modal */}
      {showReelModal && (
        <CreateReelModal
          videos={videos}
          onClose={() => setShowReelModal(false)}
          onCreated={handleReelCreated}
        />
      )}
    </div>
  );
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

"use client";

/**
 * BeautifulMoment — The Beautiful Game, recorded forever.
 *
 * A private memory archive for players. Once a week, THUTO asks them
 * to capture one joyful moment from their football. They can respond
 * with text or a photo. THUTO acknowledges each entry warmly.
 *
 * Entries save to community_moments (is_beautiful_moment = true).
 * Private by default — player can optionally share to community feed.
 */

import { useEffect, useRef, useState } from "react";
import { Camera, Feather, Globe, Lock, Loader2, Sparkles, ChevronDown, ChevronUp, X } from "lucide-react";
import api from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Moment {
  id: string;
  type: "text" | "photo";
  caption_raw: string | null;
  ai_caption: string | null;
  media_url: string | null;
  is_public: boolean;
  created_at: string;
}

// ── ISO week key: "2026-W15" — changes every Monday ───────────────────────────
function isoWeekKey(): string {
  const d   = new Date();
  const day = d.getDay() || 7;           // make Sunday = 7
  d.setDate(d.getDate() + 4 - day);     // nearest Thursday
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${new Date().getFullYear()}-W${String(week).padStart(2, "0")}`;
}

const THUTO_PROMPT =
  "This week, I want you to capture one beautiful moment from your football — " +
  "a skill you pulled off, a laugh during training, a feeling after a session, " +
  "a moment with your Ubuntu partner. Share it here. These moments belong to you forever.";

// ── Presigned R2 upload helper ─────────────────────────────────────────────────
async function uploadPhotoToR2(file: File): Promise<string> {
  const presignRes = await fetch("/api/upload/presigned", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename:     file.name,
      content_type: file.type,
      folder:       "beautiful-moments",
    }),
  });
  if (!presignRes.ok) throw new Error("Could not get upload URL");
  const { upload_url, public_url } = (await presignRes.json()) as {
    upload_url: string;
    public_url: string | null;
  };
  if (!upload_url) throw new Error("Missing upload URL");
  await fetch(upload_url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
  if (!public_url) throw new Error("No public URL returned");
  return public_url;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function BeautifulMoment() {
  const [moments,       setMoments]       = useState<Moment[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [showPrompt,    setShowPrompt]    = useState(false);
  const [activeTab,     setActiveTab]     = useState<"add" | "archive">("add");

  // Add-entry form state
  const [caption,       setCaption]       = useState("");
  const [photo,         setPhoto]         = useState<File | null>(null);
  const [photoPreview,  setPhotoPreview]  = useState<string | null>(null);
  const [isPublic,      setIsPublic]      = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [uploadingPhoto,setUploadingPhoto]= useState(false);
  const [thutoReply,    setThutoReply]    = useState<string | null>(null);
  const [error,         setError]         = useState("");

  // Archive state
  const [expanded,      setExpanded]      = useState<string | null>(null);
  const [togglingId,    setTogglingId]    = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  // ── On mount: load moments + check weekly prompt ───────────────────────────
  useEffect(() => {
    const weekKey    = isoWeekKey();
    const lastSeen   = localStorage.getItem("thuto_beautiful_week");
    if (lastSeen !== weekKey) {
      setShowPrompt(true);
      localStorage.setItem("thuto_beautiful_week", weekKey);
    }

    api.get("/beautiful-moments")
      .then((r) => setMoments(r.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Photo file selected ────────────────────────────────────────────────────
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be under 5 MB.");
      return;
    }
    setError("");
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // ── Submit entry ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!photo && !caption.trim()) {
      setError("Write something or add a photo to share your moment.");
      return;
    }
    setError("");
    setSubmitting(true);
    setThutoReply(null);

    try {
      let mediaUrl: string | null = null;

      if (photo) {
        setUploadingPhoto(true);
        try {
          mediaUrl = await uploadPhotoToR2(photo);
        } catch {
          setError("Photo upload failed. Try again or share as text instead.");
          setSubmitting(false);
          setUploadingPhoto(false);
          return;
        }
        setUploadingPhoto(false);
      }

      const type    = photo ? "photo" : "text";
      const payload = {
        type,
        caption_raw: caption.trim() || null,
        media_url:   mediaUrl,
        is_public:   isPublic,
      };

      const res = await api.post("/beautiful-moments", payload);
      const newMoment: Moment = res.data.moment;

      setMoments((prev) => [newMoment, ...prev]);
      setThutoReply(newMoment.ai_caption);

      // Reset form
      setCaption("");
      setPhoto(null);
      setPhotoPreview(null);
      setIsPublic(false);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Visibility toggle ──────────────────────────────────────────────────────
  const toggleVisibility = async (moment: Moment) => {
    setTogglingId(moment.id);
    try {
      const res = await api.patch(`/beautiful-moments/${moment.id}/visibility`);
      setMoments((prev) =>
        prev.map((m) => m.id === moment.id ? { ...m, is_public: res.data.is_public } : m)
      );
    } catch {
      // silently fail — UI reverts on next load
    } finally {
      setTogglingId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0d1f13] to-[#0d1a0d]">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#f0b429]" />
            <p className="text-xs font-semibold uppercase tracking-widest text-[#f0b429]/80">
              The Beautiful Moment
            </p>
          </div>
          <p className="mt-0.5 text-xs text-white/40">Your memory archive — the beautiful game, recorded forever</p>
        </div>
        {moments.length > 0 && (
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/60">
            {moments.length}
          </span>
        )}
      </div>

      {/* Weekly THUTO prompt banner */}
      {showPrompt && (
        <div className="mx-4 mb-4 rounded-xl border border-[#f0b429]/20 bg-[#f0b429]/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {/* THUTO avatar */}
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-sm font-bold text-white shadow">
                T
              </div>
              <p className="text-sm leading-relaxed text-white/80 italic">
                &ldquo;{THUTO_PROMPT}&rdquo;
              </p>
            </div>
            <button
              onClick={() => setShowPrompt(false)}
              className="mt-0.5 flex-shrink-0 rounded p-0.5 text-white/30 transition-colors hover:text-white/60"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/10 px-4">
        {(["add", "archive"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`mr-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === tab
                ? "border-[#f0b429] text-[#f0b429]"
                : "border-transparent text-white/40 hover:text-white/70"
            }`}
          >
            {tab === "add" ? "Add Memory" : `Archive${moments.length > 0 ? ` (${moments.length})` : ""}`}
          </button>
        ))}
      </div>

      <div className="p-4">

        {/* ── ADD MEMORY TAB ──────────────────────────────────────────── */}
        {activeTab === "add" && (
          <div className="space-y-4">

            {/* THUTO reply — shown after successful submission */}
            {thutoReply && (
              <div className="flex items-start gap-3 rounded-xl border border-teal-400/20 bg-teal-900/20 p-4">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-xs font-bold text-white">
                  T
                </div>
                <p className="text-sm leading-relaxed text-white/80">{thutoReply}</p>
              </div>
            )}

            {/* Photo preview */}
            {photoPreview && (
              <div className="relative overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full max-h-56 object-cover"
                />
                <button
                  onClick={() => {
                    setPhoto(null);
                    setPhotoPreview(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Text area */}
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Write your beautiful moment here… a skill you pulled off, a laugh, a feeling — anything that made this game feel alive."
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#f0b429]/40 focus:ring-1 focus:ring-[#f0b429]/20 transition-colors"
            />
            {caption.length > 1800 && (
              <p className="text-right text-[10px] text-white/30">{caption.length}/2000</p>
            )}

            {/* Photo upload row */}
            <div className="flex items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={onFileChange}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Camera className="h-3.5 w-3.5" />
                {photo ? "Change photo" : "Add photo"}
              </button>
              {photo && (
                <span className="text-xs text-white/40 truncate max-w-[160px]">{photo.name}</span>
              )}
            </div>

            {/* Privacy toggle */}
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center gap-2.5">
                {isPublic ? (
                  <Globe className="h-4 w-4 text-[#f0b429]" />
                ) : (
                  <Lock className="h-4 w-4 text-white/40" />
                )}
                <div>
                  <p className="text-xs font-medium text-white">
                    {isPublic ? "Shared with community" : "Private — only you"}
                  </p>
                  <p className="text-[10px] text-white/40">
                    {isPublic
                      ? "Visible in the community feed"
                      : "Your memory archive — nobody else sees this"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPublic((v) => !v)}
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  isPublic ? "bg-[#f0b429]" : "bg-white/20"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    isPublic ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {/* Error */}
            {error && (
              <p className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-xs text-red-400">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting || (!caption.trim() && !photo)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f0b429] py-3 text-sm font-bold text-[#1a3a1a] transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {submitting ? (
                uploadingPhoto ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Uploading photo…</>
                ) : (
                  <><Loader2 className="h-4 w-4 animate-spin" /> THUTO is reading this…</>
                )
              ) : (
                <><Feather className="h-4 w-4" /> Save this moment</>
              )}
            </button>
          </div>
        )}

        {/* ── ARCHIVE TAB ─────────────────────────────────────────────── */}
        {activeTab === "archive" && (
          <div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-white/5" />
                ))}
              </div>
            ) : moments.length === 0 ? (
              <div className="py-10 text-center">
                <Sparkles className="mx-auto mb-3 h-8 w-8 text-white/20" />
                <p className="text-sm font-medium text-white/40">No memories yet</p>
                <p className="mt-1 text-xs text-white/25">
                  Your first beautiful moment is waiting to be captured
                </p>
                <button
                  onClick={() => setActiveTab("add")}
                  className="mt-4 rounded-xl bg-[#f0b429]/10 px-5 py-2 text-xs font-semibold text-[#f0b429] transition-colors hover:bg-[#f0b429]/20"
                >
                  Add your first memory
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {moments.map((m) => (
                  <div
                    key={m.id}
                    className="overflow-hidden rounded-xl border border-white/10 bg-white/5"
                  >
                    {/* Moment header row */}
                    <div className="flex items-start justify-between gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            m.type === "photo"
                              ? "bg-blue-500/15 text-blue-400"
                              : "bg-[#f0b429]/15 text-[#f0b429]"
                          }`}>
                            {m.type}
                          </span>
                          <span className="text-[10px] text-white/30">
                            {new Date(m.created_at).toLocaleDateString("en-ZW", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </span>
                          <span className={`ml-auto flex items-center gap-1 text-[10px] ${
                            m.is_public ? "text-[#f0b429]/70" : "text-white/30"
                          }`}>
                            {m.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                            {m.is_public ? "Public" : "Private"}
                          </span>
                        </div>
                        {/* Snippet */}
                        <p className="text-sm text-white/70 line-clamp-2">
                          {m.caption_raw ?? (m.type === "photo" ? "📷 Photo memory" : "")}
                        </p>
                      </div>
                      <button
                        onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                        className="flex-shrink-0 rounded p-1 text-white/30 hover:text-white/60"
                      >
                        {expanded === m.id
                          ? <ChevronUp className="h-3.5 w-3.5" />
                          : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    {/* Expanded detail */}
                    {expanded === m.id && (
                      <div className="border-t border-white/10 px-4 py-3 space-y-3">
                        {/* Photo */}
                        {m.media_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.media_url}
                            alt="Beautiful moment"
                            className="w-full rounded-lg object-cover max-h-64"
                          />
                        )}
                        {/* Full caption */}
                        {m.caption_raw && (
                          <p className="text-sm leading-relaxed text-white/80">{m.caption_raw}</p>
                        )}
                        {/* THUTO response */}
                        {m.ai_caption && (
                          <div className="flex items-start gap-2.5 rounded-lg bg-teal-900/20 border border-teal-400/15 p-3">
                            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-[10px] font-bold text-white">
                              T
                            </div>
                            <p className="text-xs leading-relaxed text-white/70 italic">{m.ai_caption}</p>
                          </div>
                        )}
                        {/* Visibility toggle */}
                        <button
                          onClick={() => toggleVisibility(m)}
                          disabled={togglingId === m.id}
                          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
                        >
                          {togglingId === m.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : m.is_public ? (
                            <Lock className="h-3 w-3" />
                          ) : (
                            <Globe className="h-3 w-3" />
                          )}
                          {m.is_public ? "Make private" : "Share to community"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

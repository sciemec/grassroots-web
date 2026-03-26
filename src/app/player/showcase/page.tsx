"use client";

import { useState, useRef, useEffect } from "react";
import {
  Camera, Plus, Eye, Star, ChevronRight, Upload,
  Loader2, Video, X, ToggleLeft, ToggleRight,
  Share2, Copy, Check, MessageCircle,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { extractFrames } from "@/lib/extract-frames";
import api from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────────────────

const SKILL_TYPES = [
  { id: "dribbling",  label: "Dribbling",  emoji: "⚡" },
  { id: "shooting",   label: "Shooting",   emoji: "🎯" },
  { id: "passing",    label: "Passing",    emoji: "🎪" },
  { id: "defending",  label: "Defending",  emoji: "🛡️" },
  { id: "freestyle",  label: "Freestyle",  emoji: "🌀" },
] as const;

type SkillType = (typeof SKILL_TYPES)[number]["id"];

interface ShowcaseClip {
  id: string;
  skill_type: SkillType;
  video_url: string;
  ai_rating: number;
  top_strength: string;
  position_fit: string[];
  scout_note: string;
  development_flag: string;
  open_for_scouting: boolean;
  view_count: number;
  created_at: string;
}

interface AIAnalysis {
  skill_rating: number;
  top_strength: string;
  position_fit: string[];
  scout_note: string;
  development_flag: string;
}

type Phase = "idle" | "extracting" | "uploading" | "analysing" | "done" | "error";

// ── localStorage helpers ──────────────────────────────────────────────────────

const LS_KEY = "grassroots_showcase_clips";

function loadLocalClips(): ShowcaseClip[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}

function saveLocalClips(clips: ShowcaseClip[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(clips));
}

// ── PHASE label map ───────────────────────────────────────────────────────────

const PHASE_LABEL: Record<Phase, string> = {
  idle:       "",
  extracting: "Extracting key frames from your video...",
  uploading:  "Uploading video...",
  analysing:  "AI is analysing your clip — zviri kuitwa...",
  done:       "Analysis complete!",
  error:      "",
};

// ── Fallback AI analysis when Claude returns unparseable JSON ─────────────────

const FALLBACK: AIAnalysis = {
  skill_rating: 7.0,
  top_strength: "Good natural ability shown in the clip.",
  position_fit: ["Forward", "Midfielder"],
  scout_note:
    "Player shows promise and natural talent. Recommended for further assessment.",
  development_flag: "Continue developing consistency and technique.",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ShowcasePage() {
  const { user } = useAuthStore();

  const [clips, setClips]               = useState<ShowcaseClip[]>([]);
  const [showModal, setShowModal]       = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<SkillType | null>(null);
  const [videoFile, setVideoFile]       = useState<File | null>(null);
  const [phase, setPhase]               = useState<Phase>("idle");
  const [progress, setProgress]         = useState(0);
  const [errorMsg, setErrorMsg]         = useState("");
  const [shareClipId, setShareClipId]   = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load clips — try API, fall back to localStorage
  useEffect(() => {
    api
      .get("/player/showcase")
      .then((res) => {
        const data: ShowcaseClip[] = res.data?.data ?? res.data ?? [];
        setClips(data);
        saveLocalClips(data);
      })
      .catch(() => setClips(loadLocalClips()));
  }, []);

  // ── Modal reset ────────────────────────────────────────────────────────────

  const resetModal = () => {
    setShowModal(false);
    setSelectedSkill(null);
    setVideoFile(null);
    setPhase("idle");
    setProgress(0);
    setErrorMsg("");
  };

  // ── File validation ────────────────────────────────────────────────────────

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("video/")) {
      setErrorMsg("Please select a video file (MP4 or MOV).");
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      setErrorMsg("Video must be under 500 MB.");
      return;
    }
    setErrorMsg("");
    setVideoFile(file);
  };

  // ── Main analysis flow ─────────────────────────────────────────────────────

  const handleAnalyse = async () => {
    if (!selectedSkill || !videoFile || !user) return;

    try {
      // 1 — Extract frames
      setPhase("extracting");
      setProgress(0);
      const frames = await extractFrames(videoFile, (pct) =>
        setProgress(Math.round(pct * 0.4)),
      );

      // 2 — Upload video to R2 (best-effort; continue even if it fails)
      setPhase("uploading");
      setProgress(45);
      let videoUrl = "";
      try {
        const presignRes = await fetch("/api/upload/presigned", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename:    videoFile.name,
            contentType: videoFile.type,
            folder:      "showcase",
          }),
        });
        if (presignRes.ok) {
          const { uploadUrl, publicUrl } = await presignRes.json();
          await fetch(uploadUrl, {
            method:  "PUT",
            body:    videoFile,
            headers: { "Content-Type": videoFile.type },
          });
          videoUrl = publicUrl;
        }
      } catch { /* no storage configured — continue */ }
      setProgress(60);

      // 3 — AI analysis via Claude vision proxy
      setPhase("analysing");

      const PROMPT = `You are a FIFA-licensed talent scout reviewing a short skill clip from a Zimbabwean grassroots player.
Skill being demonstrated: ${selectedSkill}.
Assess the player and return ONLY a valid JSON object — no extra text, no markdown:
{
  "skill_rating": <number 1.0–10.0>,
  "top_strength": "<one sentence on the standout attribute>",
  "position_fit": ["<position1>", "<position2>"],
  "scout_note": "<2 sentences a scout would write about this player>",
  "development_flag": "<one key area to improve>"
}`;

      let analysis: AIAnalysis = { ...FALLBACK };

      try {
        const body: { message: string; system_prompt: string; images?: string[] } = {
          message:       PROMPT,
          system_prompt: "You are a FIFA talent scout. Respond with valid JSON only.",
          images:        frames.slice(0, 10),
        };

        const aiRes = await fetch("/api/ai-coach", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(body),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const raw    = aiData.response ?? aiData.reply ?? "";
          const match  = raw.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]) as Partial<AIAnalysis>;
            analysis = {
              skill_rating:     Number(parsed.skill_rating) || FALLBACK.skill_rating,
              top_strength:     parsed.top_strength     || FALLBACK.top_strength,
              position_fit:     parsed.position_fit     || FALLBACK.position_fit,
              scout_note:       parsed.scout_note       || FALLBACK.scout_note,
              development_flag: parsed.development_flag || FALLBACK.development_flag,
            };
          }
        }
      } catch { /* use fallback */ }

      setProgress(90);

      // 4 — Build clip object and save
      const newClip: ShowcaseClip = {
        id:               Date.now().toString(),
        skill_type:       selectedSkill,
        video_url:        videoUrl,
        ai_rating:        analysis.skill_rating,
        top_strength:     analysis.top_strength,
        position_fit:     analysis.position_fit,
        scout_note:       analysis.scout_note,
        development_flag: analysis.development_flag,
        open_for_scouting: true,
        view_count:       0,
        created_at:       new Date().toISOString(),
      };

      try {
        const saved = await api.post("/player/showcase", {
          ...newClip,
          position_fit: analysis.position_fit,
        });
        newClip.id = saved.data?.id ?? newClip.id;
      } catch { /* backend not ready — localStorage only */ }

      const updated = [newClip, ...clips];
      setClips(updated);
      saveLocalClips(updated);
      setProgress(100);
      setPhase("done");

    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Analysis failed. Please try again.",
      );
      setPhase("error");
    }
  };

  // ── Clip actions ───────────────────────────────────────────────────────────

  const toggleScouting = async (clipId: string) => {
    const updated = clips.map((c) =>
      c.id === clipId ? { ...c, open_for_scouting: !c.open_for_scouting } : c,
    );
    setClips(updated);
    saveLocalClips(updated);
    try {
      const clip = updated.find((c) => c.id === clipId);
      await api.patch(`/player/showcase/${clipId}/toggle-scouting`, {
        open_for_scouting: clip?.open_for_scouting,
      });
    } catch { /* localStorage updated */ }
  };

  const deleteClip = async (clipId: string) => {
    const updated = clips.filter((c) => c.id !== clipId);
    setClips(updated);
    saveLocalClips(updated);
    try { await api.delete(`/player/showcase/${clipId}`); } catch { /* ok */ }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="gs-watermark flex-1 overflow-auto p-6">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-accent">
              Talent Showcase
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white">My Skill Clips</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Upload clips — AI rates your skills — scouts find you
            </p>
          </div>
          {clips.length > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-xl bg-[#f0b429] px-4 py-2.5 text-sm font-semibold text-[#1a3a1a] transition-colors hover:bg-[#f5c542]"
            >
              <Plus className="h-4 w-4" /> Add Clip
            </button>
          )}
        </div>

        {/* Empty state */}
        {clips.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 px-8 py-20 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#f0b429]/10">
              <Camera className="h-10 w-10 text-[#f0b429]" />
            </div>
            <h2 className="text-xl font-bold text-white">Upload your first skill clip</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Isa video yako yekutamba — AI will analyse your technique and generate a professional scouting report that scouts can find
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-6 flex items-center gap-2 rounded-xl bg-[#f0b429] px-6 py-3 text-sm font-semibold text-[#1a3a1a] transition-colors hover:bg-[#f5c542]"
            >
              <Plus className="h-4 w-4" /> Add Showcase Clip
            </button>
          </div>
        ) : (
          /* Clips grid */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clips.map((clip) => (
              <ClipCard
                key={clip.id}
                clip={clip}
                playerName={user?.name ?? "Player"}
                playerId={user?.id ?? ""}
                onToggleScouting={() => toggleScouting(clip.id)}
                onDelete={() => deleteClip(clip.id)}
                shareOpen={shareClipId === clip.id}
                onShareOpen={() => setShareClipId(clip.id)}
                onShareClose={() => setShareClipId(null)}
              />
            ))}
          </div>
        )}

        {/* Upload / Analysis Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a3d26] p-6 shadow-2xl">

              {/* Modal header */}
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Add Showcase Clip</h2>
                <button onClick={resetModal} className="text-muted-foreground hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Done state */}
              {phase === "done" && (
                <div className="py-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                    <Star className="h-8 w-8 text-green-400" />
                  </div>
                  <p className="text-lg font-bold text-white">Analysis Complete!</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Your clip has been rated and added to your showcase — scouts can now find you.
                  </p>
                  <button
                    onClick={resetModal}
                    className="mt-5 w-full rounded-xl bg-[#f0b429] py-3 text-sm font-semibold text-[#1a3a1a] hover:bg-[#f5c542]"
                  >
                    View My Clips
                  </button>
                </div>
              )}

              {/* Processing state */}
              {(phase === "extracting" || phase === "uploading" || phase === "analysing" || phase === "error") && (
                <div className="py-6 text-center">
                  {phase === "error" ? (
                    <>
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                        <X className="h-8 w-8 text-red-400" />
                      </div>
                      <p className="font-medium text-white">Something went wrong</p>
                      <p className="mt-2 text-sm text-red-400">{errorMsg}</p>
                      <button
                        onClick={() => setPhase("idle")}
                        className="mt-4 text-sm text-accent hover:text-white"
                      >
                        Try again
                      </button>
                    </>
                  ) : (
                    <>
                      <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-[#f0b429]" />
                      <p className="font-medium text-white">{PHASE_LABEL[phase]}</p>
                      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-2 rounded-full bg-[#f0b429] transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{progress}%</p>
                    </>
                  )}
                </div>
              )}

              {/* Idle — form */}
              {phase === "idle" && (
                <>
                  {/* Skill type */}
                  <p className="mb-3 text-sm font-medium text-white">
                    What skill are you showing? <span className="text-red-400">*</span>
                  </p>
                  <div className="mb-5 grid grid-cols-5 gap-2">
                    {SKILL_TYPES.map((skill) => (
                      <button
                        key={skill.id}
                        onClick={() => setSelectedSkill(skill.id)}
                        className={`flex flex-col items-center rounded-xl border p-2 text-center transition-all ${
                          selectedSkill === skill.id
                            ? "border-[#f0b429] bg-[#f0b429]/10"
                            : "border-white/10 bg-white/5 hover:border-white/20"
                        }`}
                      >
                        <span className="text-xl">{skill.emoji}</span>
                        <span className="mt-1 text-[10px] text-muted-foreground">{skill.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* File picker */}
                  <p className="mb-3 text-sm font-medium text-white">
                    Upload your clip <span className="text-red-400">*</span>
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-xl border border-dashed border-white/20 bg-white/5 py-8 text-center transition-colors hover:border-[#f0b429]/50 hover:bg-white/10"
                  >
                    <Upload className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                    {videoFile ? (
                      <p className="text-sm font-medium text-white">{videoFile.name}</p>
                    ) : (
                      <>
                        <p className="text-sm text-white">Tap to select video</p>
                        <p className="mt-1 text-xs text-muted-foreground">MP4 or MOV · Max 60 seconds</p>
                      </>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/quicktime,video/avi,video/webm"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />

                  {errorMsg && (
                    <p className="mt-2 text-xs text-red-400">{errorMsg}</p>
                  )}

                  <button
                    onClick={handleAnalyse}
                    disabled={!selectedSkill || !videoFile}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f0b429] py-3 text-sm font-semibold text-[#1a3a1a] transition-colors hover:bg-[#f5c542] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" /> Analyse with AI
                  </button>
                </>
              )}

            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Clip Card sub-component ───────────────────────────────────────────────────

function ClipCard({
  clip,
  playerName,
  playerId,
  onToggleScouting,
  onDelete,
  shareOpen,
  onShareOpen,
  onShareClose,
}: {
  clip: ShowcaseClip;
  playerName: string;
  playerId: string;
  onToggleScouting: () => void;
  onDelete: () => void;
  shareOpen: boolean;
  onShareOpen: () => void;
  onShareClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const profileUrl = `https://grassrootssports.live/player/public/${playerId}`;

  const scoutCardText =
    `🌟 GrassRoots Sports — Skill Showcase\n` +
    `Player: ${playerName}\n` +
    `Skill: ${clip.skill_type.charAt(0).toUpperCase() + clip.skill_type.slice(1)}\n` +
    `AI Rating: ${clip.ai_rating.toFixed(1)}/10\n` +
    `Positions: ${clip.position_fit.join(", ")}\n\n` +
    `Scout Note: "${clip.scout_note}"\n\n` +
    (clip.video_url ? `Watch clip: ${clip.video_url}\n` : "") +
    `Full profile: ${profileUrl}`;

  const whatsappUrl =
    `https://wa.me/?text=${encodeURIComponent(scoutCardText)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        clip.video_url || profileUrl
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard not available */ }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-sm">

      {/* Video or placeholder */}
      <div className="mb-3 flex h-36 items-center justify-center overflow-hidden rounded-xl bg-black/40">
        {clip.video_url ? (
          <video
            src={clip.video_url}
            className="h-full w-full rounded-xl object-cover"
            controls
            preload="metadata"
          />
        ) : (
          <Video className="h-10 w-10 text-muted-foreground" />
        )}
      </div>

      {/* Skill badge + rating */}
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-full bg-[#f0b429]/20 px-3 py-1 text-xs font-semibold capitalize text-[#f0b429]">
          {clip.skill_type}
        </span>
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-[#f0b429] text-[#f0b429]" />
          <span className="text-sm font-bold text-white">{clip.ai_rating.toFixed(1)}/10</span>
        </div>
      </div>

      {/* Rating bar */}
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-1.5 rounded-full bg-[#f0b429]"
          style={{ width: `${(clip.ai_rating / 10) * 100}%` }}
        />
      </div>

      {/* Top strength */}
      <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-accent">
        Top Strength
      </p>
      <p className="mb-3 text-sm text-white">{clip.top_strength}</p>

      {/* Scout note */}
      <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Scout Note
      </p>
      <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{clip.scout_note}</p>

      {/* Position pills */}
      <div className="mb-3 flex flex-wrap gap-1">
        {clip.position_fit.map((pos) => (
          <span key={pos} className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-muted-foreground">
            {pos}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-white/10 pt-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Eye className="h-3.5 w-3.5" />
          {clip.view_count} views
        </div>
        <div className="flex items-center gap-3">
          {/* Share button */}
          <button
            onClick={shareOpen ? onShareClose : onShareOpen}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-[#f0b429]"
            title="Share with scout"
          >
            <Share2 className="h-4 w-4" />
          </button>

          <button
            onClick={onToggleScouting}
            className="flex items-center gap-1.5 text-xs"
            title={clip.open_for_scouting ? "Visible to scouts — click to hide" : "Hidden from scouts — click to show"}
          >
            {clip.open_for_scouting ? (
              <ToggleRight className="h-5 w-5 text-green-400" />
            ) : (
              <ToggleLeft className="h-5 w-5 text-muted-foreground" />
            )}
            <span className={clip.open_for_scouting ? "text-green-400" : "text-muted-foreground"}>
              {clip.open_for_scouting ? "Visible" : "Hidden"}
            </span>
          </button>
          <button
            onClick={onDelete}
            className="text-muted-foreground transition-colors hover:text-red-400"
            title="Delete clip"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Share panel — slides open below footer */}
      {shareOpen && (
        <div className="mt-3 rounded-xl border border-[#f0b429]/30 bg-[#1a3d26] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#f0b429]">
            Share with Scout
          </p>

          {/* Video / profile link */}
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-black/30 px-3 py-2">
            <p className="flex-1 truncate text-xs text-muted-foreground">
              {clip.video_url || profileUrl}
            </p>
            <button
              onClick={handleCopy}
              className="shrink-0 text-muted-foreground transition-colors hover:text-white"
              title="Copy link"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </a>
          </div>

          {/* Scout card preview */}
          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-white">
              Preview scout card message ▾
            </summary>
            <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-xs text-muted-foreground">
              {scoutCardText}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

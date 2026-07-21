"use client";

// src/components/ui/VideoUpload.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Unified video/image uploader — Phase 1 of the unified media system.
//
// Usage:
//   <VideoUpload
//     context="showcase"
//     title="Dribbling clip"
//     metadata={{ skill_type: "dribbling", position: "winger" }}
//     visibility="scout_visible"
//     onComplete={(media) => console.log(media)}
//   />
//
// Flow:
//   1. User picks file → file validated client-side
//   2. POST /api/media/upload → presigned R2 URL returned
//   3. XHR PUT file directly to R2 (progress tracked)
//   4. POST {API_URL}/media to register the DB record (with auth token)
//   5. onComplete(mediaRecord) called
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState } from "react";
import { Upload, Film, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

const ACCEPTED_TYPES = [
  "video/mp4", "video/quicktime", "video/avi",
  "video/x-matroska", "video/webm", "image/jpeg", "image/png", "image/webp",
];
const MAX_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB

export type MediaContext =
  | "showcase" | "vault" | "fan_hub" | "drill_analysis"
  | "arena_post" | "match_eye" | "training" | "whatsapp";

export type MediaVisibility =
  | "public" | "scout_visible" | "connections" | "coach_only" | "private";

export interface MediaRecord {
  id:               string;
  user_id:          string;
  r2_key:           string;
  r2_url:           string;
  media_type:       "video" | "image";
  title:            string | null;
  context:          MediaContext;
  metadata:         Record<string, unknown>;
  visibility:       MediaVisibility;
  is_ai_analysed:   boolean;
  ai_feedback:      Record<string, unknown> | null;
  created_at:       string;
}

interface Props {
  context:     MediaContext;
  title?:      string;
  metadata?:   Record<string, unknown>;
  visibility?: MediaVisibility;
  accept?:     string;             // e.g. "video/*" or "video/*,image/*"
  label?:      string;             // button/zone label override
  compact?:    boolean;            // smaller drag zone
  onComplete?: (media: MediaRecord) => void;
  onError?:    (msg: string) => void;
}

type Phase = "idle" | "uploading" | "registering" | "done" | "error";

export default function VideoUpload({
  context,
  title,
  metadata = {},
  visibility = "private",
  accept = "video/*",
  label,
  compact = false,
  onComplete,
  onError,
}: Props) {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const inputRef    = useRef<HTMLInputElement>(null);
  const [phase,     setPhase]     = useState<Phase>("idle");
  const [progress,  setProgress]  = useState(0);
  const [errorMsg,  setErrorMsg]  = useState<string | null>(null);
  const [fileName,  setFileName]  = useState<string | null>(null);

  const fail = (msg: string) => {
    setPhase("error");
    setErrorMsg(msg);
    onError?.(msg);
  };

  const handleFile = async (file: File) => {
    // ── Validate ──────────────────────────────────────────────────
    if (!ACCEPTED_TYPES.includes(file.type)) {
      fail("File type not supported. Please upload a video or image.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      fail("File exceeds 500 MB limit.");
      return;
    }

    // ── Guest gate ────────────────────────────────────────────────
    if (!user || !token) {
      fail("Please sign in to upload.");
      return;
    }

    setFileName(file.name);
    setPhase("uploading");
    setProgress(0);
    setErrorMsg(null);

    // ── Step 1: Get presigned URL ─────────────────────────────────
    let uploadUrl = "", publicUrl = "", key = "";
    try {
      const res = await fetch("/api/media/upload", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName:    file.name,
          contentType: file.type,
          context,
          userId:      user.id,
        }),
      });
      const json = await res.json();
      uploadUrl = json.uploadUrl;
      publicUrl = json.publicUrl;
      key       = json.key;
    } catch {
      fail("Could not connect to upload service.");
      return;
    }

    // ── Step 2: XHR PUT to R2 with progress ──────────────────────
    if (uploadUrl) {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 90));
        };
        xhr.onload  = () => (xhr.status < 300 ? resolve() : reject(new Error(`R2 ${xhr.status}`)));
        xhr.onerror = () => reject(new Error("Upload network error"));
        xhr.send(file);
      }).catch(() => { fail("Upload to storage failed."); });
      if (phase === "error") return;
    }
    // If R2 is not configured (uploadUrl = ""), we still register the record with no r2_url

    setProgress(95);

    // ── Step 3: Register record in Laravel ───────────────────────
    setPhase("registering");
    try {
      const res = await fetch(`${API_URL}/media`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          r2_key:           key || `local/${Date.now()}`,
          r2_url:           publicUrl || "",
          media_type:       file.type.startsWith("image/") ? "image" : "video",
          title:            title ?? file.name,
          context,
          metadata:         { ...metadata, original_filename: file.name },
          visibility,
          size_bytes:       file.size,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        fail(err.message ?? `Server error ${res.status}`);
        return;
      }

      const json = await res.json() as { data: MediaRecord };
      setProgress(100);
      setPhase("done");
      onComplete?.(json.data);

    } catch {
      fail("Failed to save record. Your file may still be uploaded.");
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setPhase("idle");
    setProgress(0);
    setErrorMsg(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (phase === "done") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
        <CheckCircle2 size={18} className="text-green-600 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-green-800">Uploaded!</p>
          <p className="text-[11px] text-green-600 truncate">{fileName}</p>
        </div>
        <button onClick={reset} className="ml-auto text-green-400 hover:text-green-700">
          <X size={14} />
        </button>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
        <AlertCircle size={18} className="text-red-500 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-red-700">Upload failed</p>
          <p className="text-[11px] text-red-500">{errorMsg}</p>
        </div>
        <button onClick={reset} className="ml-auto text-red-400 hover:text-red-700">
          <X size={14} />
        </button>
      </div>
    );
  }

  if (phase === "uploading" || phase === "registering") {
    return (
      <div className="rounded-xl px-4 py-4 space-y-2"
        style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}>
        <div className="flex items-center gap-2">
          <Film size={14} className="text-gray-500 shrink-0" />
          <p className="text-[11px] font-semibold text-gray-600 truncate">{fileName}</p>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-gray-200">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, backgroundColor: "#1a5c2a" }}
          />
        </div>
        <p className="text-[10px] text-gray-400">
          {phase === "registering" ? "Saving record..." : `Uploading… ${progress}%`}
        </p>
      </div>
    );
  }

  // Idle state — drag zone
  return (
    <div
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
      className={`
        flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer
        border-2 border-dashed transition-colors
        hover:border-[#1a5c2a] hover:bg-green-50
        ${compact ? "p-4 min-h-[80px]" : "p-8 min-h-[140px]"}
      `}
      style={{ borderColor: "#d1d5db", backgroundColor: "#fafafa" }}
    >
      <Upload size={compact ? 18 : 24} className="text-gray-400" />
      <div className="text-center">
        <p className="text-xs font-semibold text-gray-600">
          {label ?? "Drop video here or click to browse"}
        </p>
        {!compact && (
          <p className="text-[10px] text-gray-400 mt-0.5">MP4, MOV, WebM up to 500 MB</p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  );
}

"use client";

import { useState, useRef, useCallback } from "react";
import { X, Upload, CheckCircle2, AlertCircle, Film } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

const CLIP_TYPES = [
  { value: "highlight", label: "Highlight" },
  { value: "full",      label: "Full Match" },
  { value: "goals",     label: "Goals" },
  { value: "training",  label: "Training" },
  { value: "live",      label: "Live Stream" },
];

const PROVINCES = [
  "Harare", "Bulawayo", "Manicaland", "Mashonaland Central",
  "Mashonaland East", "Mashonaland West", "Masvingo",
  "Matabeleland North", "Matabeleland South", "Midlands",
];

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB — keeps data costs low on Zimbabwe networks

// Estimate upload time at typical Zimbabwe mobile speeds
function uploadEstimate(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  // 2G: ~0.5 Mbps = 62.5 KB/s; 3G: ~2 Mbps = 250 KB/s
  const secs3G = Math.round((bytes / (250 * 1024)));
  if (secs3G < 60) return `~${secs3G}s on 3G`;
  return `~${Math.ceil(secs3G / 60)}min on 3G`;
}

// Rough data cost: Econet charges ~$0.10/MB on daily bundles
function dataCost(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  const cost = (mb * 0.10).toFixed(2);
  return `≈$${cost} data`;
}

interface UploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "select" | "uploading" | "metadata" | "submitting" | "done" | "error";

export default function UploadModal({ onClose, onSuccess }: UploadModalProps) {
  const [step, setStep]             = useState<Step>("select");
  const [dragOver, setDragOver]     = useState(false);
  const [file, setFile]             = useState<File | null>(null);
  const [progress, setProgress]     = useState(0);
  const [errorMsg, setErrorMsg]     = useState("");
  const [r2Key, setR2Key]           = useState("");
  const [r2Url, setR2Url]           = useState("");
  const [title, setTitle]           = useState("");
  const [clipType, setClipType]     = useState("highlight");
  const [province, setProvince]     = useState("");
  const [uploaderName, setUploaderName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (f: File): string | null => {
    if (!["video/mp4", "video/quicktime"].includes(f.type)) {
      return "Only MP4 and MOV files are accepted.";
    }
    if (f.size > MAX_BYTES) {
      const mb = (f.size / (1024 * 1024)).toFixed(0);
      return `File is ${mb} MB — too large for Zimbabwe networks. Record in 480p or trim to under 20 MB. Tip: on your phone go to Camera Settings → Video Quality → 480p.`;
    }
    return null;
  };

  const handleFile = useCallback((f: File) => {
    const err = validateFile(f);
    if (err) { setErrorMsg(err); setStep("error"); return; }
    setFile(f);
    setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
    uploadToR2(f);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const uploadToR2 = async (f: File) => {
    setStep("uploading");
    setProgress(0);
    setErrorMsg("");

    try {
      // 1. Get presigned URL from Laravel
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const presignRes = await fetch(`${API}/upload/presigned`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && token !== "dev-token" ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          filename:    `fan-hub/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${f.name.split(".").pop()}`,
          content_type: f.type,
        }),
      });

      if (!presignRes.ok) throw new Error("Could not get upload URL. Please try again.");
      const { upload_url, key, public_url } = await presignRes.json() as {
        upload_url: string;
        key: string;
        public_url: string;
      };

      // 2. PUT directly to R2 with progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", upload_url);
        xhr.setRequestHeader("Content-Type", f.type);

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        });

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload. Please check your connection."));
        xhr.send(f);
      });

      setR2Key(key);
      setR2Url(public_url);
      setStep("metadata");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
      setStep("error");
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !clipType) return;
    setStep("submitting");
    setErrorMsg("");

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const res = await fetch(`${API}/fan-hub/videos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && token !== "dev-token" ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title:         title.trim(),
          clip_type:     clipType,
          province:      province || null,
          uploader_name: uploaderName.trim() || null,
          r2_key:        r2Key,
          r2_url:        r2Url,
          file_size_bytes: file?.size ?? null,
        }),
      });

      if (!res.ok) throw new Error("Failed to save video details. Please try again.");
      setStep("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Submission failed");
      setStep("error");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-[#0f2a14] border border-[#f0b429]/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0b429]/10">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Upload className="w-5 h-5 text-amber-400" />
            Upload a Clip
          </h2>
          <button onClick={onClose} className="text-green-300/60 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">

          {/* Step: select */}
          {step === "select" && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                dragOver ? "border-amber-400 bg-amber-400/5" : "border-[#f0b429]/20 hover:border-[#f0b429]/40 hover:bg-white/5"
              }`}
            >
              <Film className="w-12 h-12 text-amber-400/60 mx-auto mb-3" />
              <p className="text-white font-semibold mb-1">Drop your video here</p>
              <p className="text-green-300/60 text-sm">or click to browse</p>
              <p className="text-green-300/40 text-xs mt-3">MP4 or MOV · max 20 MB · record in 480p</p>
              <p className="text-green-300/30 text-xs mt-1">Tip: Phone → Camera Settings → Video Quality → 480p</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>
          )}

          {/* Step: uploading */}
          {step === "uploading" && (
            <div className="text-center py-6">
              <p className="text-white font-semibold mb-1">Uploading{file ? ` ${file.name}` : ""}...</p>
              <p className="text-green-300/60 text-sm mb-1">
                {file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : ""}
              </p>
              {file && (
                <p className="text-amber-400/70 text-xs mb-4">
                  {dataCost(file.size)} · {uploadEstimate(file.size)}
                </p>
              )}
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-amber-400 font-bold mt-2">{progress}%</p>
            </div>
          )}

          {/* Step: metadata */}
          {step === "metadata" && (
            <div className="flex flex-col gap-4">
              <p className="text-green-300/70 text-sm">Upload complete. Add details about your clip.</p>

              <div>
                <label className="block text-xs text-green-300/70 mb-1 font-semibold uppercase tracking-wider">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  placeholder="e.g. Dynamos FC vs Caps United — Goals"
                  className="w-full rounded-lg bg-white/5 border border-[#f0b429]/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-amber-400/60"
                />
              </div>

              <div>
                <label className="block text-xs text-green-300/70 mb-1 font-semibold uppercase tracking-wider">
                  Clip Type *
                </label>
                <select
                  value={clipType}
                  onChange={(e) => setClipType(e.target.value)}
                  className="w-full rounded-lg bg-[#0a1f0e] border border-[#f0b429]/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-amber-400/60"
                >
                  {CLIP_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-green-300/70 mb-1 font-semibold uppercase tracking-wider">
                  Province (optional)
                </label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full rounded-lg bg-[#0a1f0e] border border-[#f0b429]/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-amber-400/60"
                >
                  <option value="">Select province...</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-green-300/70 mb-1 font-semibold uppercase tracking-wider">
                  Your Name (optional)
                </label>
                <input
                  type="text"
                  value={uploaderName}
                  onChange={(e) => setUploaderName(e.target.value)}
                  placeholder="Anonymous if left blank"
                  className="w-full rounded-lg bg-white/5 border border-[#f0b429]/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-amber-400/60"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!title.trim()}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-sm transition-colors"
              >
                Publish Clip
              </button>
            </div>
          )}

          {/* Step: submitting */}
          {step === "submitting" && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-white">Publishing your clip...</p>
            </div>
          )}

          {/* Step: done */}
          {step === "done" && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto mb-3" />
              <h3 className="text-white font-bold text-lg mb-1">Clip published!</h3>
              <p className="text-green-300/70 text-sm mb-6">Your clip is now live in the Fan Hub.</p>
              <button
                onClick={() => { onSuccess(); onClose(); }}
                className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors"
              >
                View Feed
              </button>
            </div>
          )}

          {/* Step: error */}
          {step === "error" && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-white font-semibold mb-1">Something went wrong</p>
              <p className="text-red-300/80 text-sm mb-6">{errorMsg}</p>
              <button
                onClick={() => { setStep("select"); setErrorMsg(""); setFile(null); setProgress(0); }}
                className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-colors"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

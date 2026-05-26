"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ShieldCheck, Upload, Clock, CheckCircle2,
  XCircle, Camera, FileText, RefreshCw, Video,
} from "lucide-react";
import { CameraPermissionHelp } from "@/components/ui/camera-permission-help";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { QRProfileCard } from "@/components/ui/qr-profile-card";
import api from "@/lib/api";

type VerifStatus = "not_submitted" | "pending" | "approved" | "rejected";

interface VerificationData {
  status: VerifStatus;
  document_type: string | null;
  ai_confidence_score: number | null;
  admin_notes: string | null;
  created_at: string | null;
  reviewed_at: string | null;
  selfie_url: string | null;
}

const STATUS_CONFIG: Record<VerifStatus, { icon: typeof ShieldCheck; label: string; color: string; bg: string; desc: string }> = {
  not_submitted: {
    icon: ShieldCheck,
    label: "Not submitted",
    color: "text-muted-foreground",
    bg: "bg-muted",
    desc: "Submit a selfie and valid ID document to become a verified player. Verification increases trust with scouts.",
  },
  pending: {
    icon: Clock,
    label: "Under review",
    color: "text-yellow-600",
    bg: "bg-yellow-500/10",
    desc: "Your document has been submitted and is being reviewed by our team. This usually takes 1–2 business days.",
  },
  approved: {
    icon: CheckCircle2,
    label: "Verified",
    color: "text-green-600",
    bg: "bg-green-500/10",
    desc: "Your identity is verified. Scouts can see your verified badge on your profile. Scan your QR code below.",
  },
  rejected: {
    icon: XCircle,
    label: "Rejected",
    color: "text-red-600",
    bg: "bg-red-500/10",
    desc: "Your submission was rejected. Please re-submit with a clearer selfie and document image.",
  },
};

const DOCUMENT_TYPES = [
  { value: "national_id", label: "Zimbabwe National ID" },
  { value: "passport", label: "Passport" },
  { value: "birth_certificate", label: "Birth Certificate" },
  { value: "school_id", label: "School ID Card" },
];

export default function PlayerVerificationPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [verif, setVerif] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [docType, setDocType] = useState("national_id");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Selfie camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.push("/login"); return; }
    api.get("/verification/status")
      .then((res) => setVerif(res.data))
      .catch(() => setVerif({
        status: "not_submitted",
        document_type: null,
        ai_confidence_score: null,
        admin_notes: null,
        created_at: null,
        reviewed_at: null,
        selfie_url: null,
      }))
      .finally(() => setLoading(false));
  }, [_hasHydrated, user, router]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, []);

  const startCamera = async () => {
    setCameraError("");
    try {
      // Try with ideal constraints first, fall back to basic video if it fails
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        });
      } catch (e) {
        const name = e instanceof DOMException ? e.name : "";
        // Re-throw permission errors — don't silently retry
        if (name === "NotAllowedError" || name === "PermissionDeniedError") throw e;
        // Constraint issue — retry with minimal constraints
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      const msg  = err instanceof Error ? err.message.toLowerCase() : "";
      const isDenied =
        name === "NotAllowedError" ||
        name === "PermissionDeniedError" ||
        msg.includes("permission") ||
        msg.includes("notallowed") ||
        msg.includes("denied");
      const isNotFound =
        name === "NotFoundError" ||
        name === "DevicesNotFoundError" ||
        msg.includes("notfound") ||
        msg.includes("devices");

      if (isDenied) {
        setCameraError("permission denied");
      } else if (isNotFound) {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError("Could not open camera. Try a different browser or check your camera settings.");
      }
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      setSelfieBlob(blob);
      setSelfiePreview(canvas.toDataURL("image/jpeg"));
      stopCamera();
    }, "image/jpeg", 0.9);
  };

  const retakeSelfie = () => {
    setSelfieBlob(null);
    setSelfiePreview(null);
    startCamera();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setSubmitError("File is too large. Maximum size is 5MB. Please use a smaller image.");
      return;
    }
    setSubmitError("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setSubmitError("");
  };

  const submit = async () => {
    if (!file || !selfieBlob) return;
    setSubmitting(true);
    setSubmitError("");
    const formData = new FormData();
    formData.append("document_type", docType);
    formData.append("document", file);          // backend expects "document"
    formData.append("selfie_image", selfieBlob, "selfie.jpg");
    try {
      await api.post("/verification/upload-document", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSubmitted(true);
      setVerif((v) => v ? { ...v, status: "pending", document_type: docType, created_at: new Date().toISOString() } : v);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSubmitError(msg ?? "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-xl space-y-4">
            <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
            <div className="h-32 animate-pulse rounded-xl bg-muted" />
            <div className="h-48 animate-pulse rounded-xl bg-muted" />
          </div>
        </main>
      </div>
    );
  }

  const status = verif?.status ?? "not_submitted";
  const cfg = STATUS_CONFIG[status];
  const StatusIcon = cfg.icon;
  const canSubmit = !!file && !!selfieBlob && !submitting;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-xl">

          {/* Header */}
          <div className="mb-8 flex items-center gap-3">
            <Link href="/player/profile" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Identity Verification</h1>
              <p className="text-sm text-muted-foreground">Get verified to increase scout trust</p>
            </div>
          </div>

          {/* Status card */}
          <div className={`mb-6 rounded-xl border p-5 ${cfg.bg}`}>
            <div className="flex items-center gap-3">
              <StatusIcon className={`h-6 w-6 flex-shrink-0 ${cfg.color}`} />
              <div>
                <p className={`font-semibold ${cfg.color}`}>{cfg.label}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{cfg.desc}</p>
              </div>
            </div>
            {verif?.admin_notes && (
              <div className="mt-3 rounded-lg bg-background/60 px-3 py-2 text-sm text-muted-foreground">
                <span className="font-medium">Admin note:</span> {verif.admin_notes}
              </div>
            )}
            {verif?.created_at && status === "pending" && (
              <p className="mt-2 text-xs text-muted-foreground">
                Submitted {new Date(verif.created_at).toLocaleDateString("en-ZW", { day: "numeric", month: "long", year: "numeric" })} · Expected review: 1–2 business days
              </p>
            )}
            {verif != null && verif.ai_confidence_score !== null && status === "approved" && (
              <p className="mt-2 text-xs text-green-700 font-medium">
                Identity match: {Math.round((verif!.ai_confidence_score ?? 0) * 100)}%
              </p>
            )}
            {verif?.reviewed_at && (
              <p className="mt-2 text-xs text-muted-foreground">
                Reviewed {new Date(verif.reviewed_at).toLocaleDateString("en-ZW", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>

          {/* QR Card — shown when approved */}
          {status === "approved" && user && (
            <div className="mb-6">
              <QRProfileCard
                playerId={String(user.id)}
                playerName={user.name}
                ageGroup={user.age_group}
                province={user.province}
                selfieUrl={verif?.selfie_url ?? undefined}
              />
            </div>
          )}

          {/* Why verify section */}
          <div className="mb-6 rounded-xl border bg-card p-5">
            <h2 className="mb-3 font-semibold">Why verify?</h2>
            <ul className="space-y-2">
              {[
                { icon: ShieldCheck,  text: "Verified badge appears on your player profile" },
                { icon: CheckCircle2, text: "Scouts prioritise verified players in searches" },
                { icon: FileText,     text: "Required for official trial and transfer requests" },
                { icon: Camera,       text: "AI document check with admin review — private and secure" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-sm">
                  <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* Submission form */}
          {(status === "not_submitted" || status === "rejected") && !submitted && (
            <div className="space-y-4">

              {/* Step 1 — Selfie */}
              <div className="rounded-xl border bg-card p-5">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                  <h2 className="font-semibold">Take a selfie <span className="text-destructive">*</span></h2>
                  <span className="ml-auto text-xs text-muted-foreground">Required</span>
                </div>

                {/* Camera / selfie preview */}
                {selfiePreview ? (
                  <div className="flex flex-col items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selfiePreview} alt="Your selfie" className="h-48 w-48 rounded-full object-cover border-4 border-primary/30" />
                    <button
                      type="button"
                      onClick={retakeSelfie}
                      className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Retake selfie
                    </button>
                  </div>
                ) : cameraActive ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative overflow-hidden rounded-full border-4 border-primary/40 h-48 w-48">
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="h-full w-full object-cover scale-x-[-1]"
                      />
                    </div>
                    <canvas ref={canvasRef} className="sr-only" />
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Camera className="h-4 w-4" /> Take Photo
                    </button>
                    <button type="button" onClick={stopCamera} className="text-xs text-muted-foreground hover:underline">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                      <Video className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                      We need a photo of your face to match against your ID document.
                    </p>
                    {cameraError && cameraError.includes("permission") ? (
                      <CameraPermissionHelp onRetry={startCamera} />
                    ) : cameraError ? (
                      <>
                        <p className="text-center text-sm text-destructive">{cameraError}</p>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
                        >
                          <Camera className="h-4 w-4" /> Try Again
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={startCamera}
                        className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
                      >
                        <Camera className="h-4 w-4" /> Open Camera
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2 — Document */}
              <div className="rounded-xl border bg-card p-5">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                  <h2 className="font-semibold">
                    {status === "rejected" ? "Re-submit document" : "Upload ID document"} <span className="text-destructive">*</span>
                  </h2>
                </div>

                <div className="mb-4">
                  <label className="mb-1.5 block text-sm font-medium">Document type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {DOCUMENT_TYPES.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setDocType(value)}
                        className={`rounded-xl border p-3 text-left text-sm font-medium transition-all ${
                          docType === value ? "border-primary bg-primary/5" : "border-muted hover:bg-muted"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="mb-1.5 block text-sm font-medium">Document photo</label>
                  <label className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors hover:bg-muted/40 ${preview ? "border-primary/40" : "border-muted"}`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFile}
                      className="sr-only"
                    />
                    {preview ? (
                      <div className="flex flex-col items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preview} alt="Document preview" className="max-h-48 rounded-lg object-contain" />
                        <span className="text-xs text-primary font-medium">Tap to change photo</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <div className="text-center">
                          <p className="text-sm font-medium">Tap to upload a photo</p>
                          <p className="text-xs text-muted-foreground">JPG, PNG · Max 5MB · Must be clearly readable</p>
                        </div>
                      </>
                    )}
                  </label>
                  {file && (
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate">{file.name}</p>
                      <button
                        type="button"
                        onClick={clearFile}
                        className="ml-2 flex-shrink-0 text-xs text-destructive hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="mb-4 rounded-xl bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                  Your selfie and document are processed by AI and reviewed by our admin team. They are never shared with scouts or third parties. We only confirm identity — no data is stored beyond what is needed for verification.
                </div>

                {submitError && (
                  <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {submitError}
                  </div>
                )}

                {/* Submit requirements checklist */}
                <div className="mb-4 space-y-1.5">
                  <div className={`flex items-center gap-2 text-xs ${selfieBlob ? "text-green-600" : "text-muted-foreground"}`}>
                    {selfieBlob ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    Selfie photo
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${file ? "text-green-600" : "text-muted-foreground"}`}>
                    {file ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    ID document photo
                  </div>
                </div>

                <button
                  type="button"
                  onClick={submit}
                  disabled={!canSubmit}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Submitting…" : "Submit for verification"}
                </button>
              </div>
            </div>
          )}

          {/* Submitted success */}
          {submitted && (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-5 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-500" />
              <p className="font-semibold text-green-700">Document submitted!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Our team will review it within 1–2 business days. You&apos;ll receive a notification once it&apos;s processed.
              </p>
              <Link
                href="/player/profile"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Back to profile
              </Link>
            </div>
          )}

          {status === "approved" && (
            <div className="text-center">
              <Link
                href="/player/profile"
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Back to profile
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

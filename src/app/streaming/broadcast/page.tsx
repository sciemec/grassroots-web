"use client";

/**
 * Broadcast Page — MediaRecorder local recording + Cloudflare WHIP live streaming.
 *
 * When Cloudflare env vars are configured, pressing "Go Live" sends WebRTC via
 * WHIP to Cloudflare Stream (HLS URL shown for viewers).
 * MediaRecorder runs simultaneously so the host always gets a local .webm download.
 * If Cloudflare returns 503 (not configured), recording continues locally.
 *
 * TensorFlow.js COCO-SSD player tracking runs on a canvas overlay at ~5 fps
 * and can be toggled independently of recording.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera, Check, Copy, Info, Loader2, Mic, MicOff, Radio, Square,
  Timer, Users, Video, VideoOff,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { SponsorshipOverlay, DEFAULT_SPONSORS } from "@/components/video/sponsorship-overlay";
import { StreamInfoPanel } from "./stream-info-panel";
import { usePlayerTracker } from "@/lib/use-player-tracker";
import { useWhipStream } from "@/lib/use-whip-stream";

type BroadcastState = "idle" | "requesting" | "ready" | "live" | "stopped" | "error";

/** Formats elapsed seconds as MM:SS. */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Generates a short random stream ID for the recording filename. */
function generateStreamId(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

export default function BroadcastPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [broadcastState, setBroadcastState] = useState<BroadcastState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [muted, setMuted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [duration, setDuration] = useState(0);
  const [streamId] = useState(generateStreamId);
  const [sport, setSport] = useState("Football");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [venue, setVenue] = useState("");
  const [resolution, setResolution] = useState("—");
  const [showOverlay, setShowOverlay] = useState(false);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [whipNote, setWhipNote] = useState("");
  const [hlsCopied, setHlsCopied] = useState(false);

  // TF.js player tracking hook
  const { playerCount, loading: trackerLoading, error: trackerError } = usePlayerTracker(
    videoRef,
    canvasRef,
    trackingEnabled
  );

  // Cloudflare WHIP streaming hook
  const { whipState, whipError, hlsUrl, startStream, stopStream } = useWhipStream();

  useEffect(() => { if (!user) router.push("/login"); }, [user, router]);

  useEffect(() => {
    return () => {
      stopAllTracks();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  /** Stops all camera/audio tracks and clears the stream ref. */
  const stopAllTracks = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  /** Requests camera and microphone access from the browser. */
  const requestCamera = async () => {
    setBroadcastState("requesting");
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        const settings = stream.getVideoTracks()[0].getSettings();
        setResolution(`${settings.width ?? "?"}×${settings.height ?? "?"}`);
      }
      setBroadcastState("ready");
    } catch {
      setErrorMsg("Camera permission denied or device unavailable. Allow camera access and retry.");
      setBroadcastState("error");
    }
  };

  /** Starts local MediaRecorder and attempts Cloudflare WHIP streaming. */
  const startRecording = useCallback(async () => {
    const stream = streamRef.current;
    if (!stream) return;

    // Start local MediaRecorder
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    setDuration(0);
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    setBroadcastState("live");

    // Attempt Cloudflare WHIP stream (non-blocking — recording continues if it fails)
    try {
      await startStream(stream);
    } catch {
      // startStream sets whipState to "error" internally — show a note but keep recording
    }
  }, [startStream]);

  /** Stops recording, triggers .webm download, and cleans up WHIP stream. */
  const stopRecording = useCallback(async () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `grassroots-broadcast-${streamId}-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      };
    }

    // Stop Cloudflare WHIP stream if it was active
    if (whipState === "live" || whipState === "connecting") {
      await stopStream();
    }

    stopAllTracks();
    setBroadcastState("stopped");
    setWhipNote("");
  }, [streamId, whipState, stopStream]);

  /** Copies the HLS viewer URL to clipboard. */
  const copyHlsUrl = async () => {
    if (!hlsUrl) return;
    try {
      await navigator.clipboard.writeText(hlsUrl);
      setHlsCopied(true);
      setTimeout(() => setHlsCopied(false), 2000);
    } catch {
      // Clipboard write failed — silently ignore
    }
  };

  const toggleMute = () => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setMuted(!track.enabled); }
  };

  const toggleVideo = () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setVideoEnabled(track.enabled); }
  };

  const commentaryText = homeTeam && awayTeam
    ? `Live from ${venue || "the ground"}: ${homeTeam} vs ${awayTeam}. A ${sport} match for the grassroots community of Zimbabwe.`
    : "Welcome to Grassroots Sport live broadcasting. Select match details and go live.";

  if (!user) return null;

  const isActive = broadcastState === "ready" || broadcastState === "live";

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b bg-card px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <Radio className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                Broadcast Studio
                {broadcastState === "live" && (
                  <span className="flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />LIVE
                  </span>
                )}
                {whipState === "live" && (
                  <span className="flex items-center gap-1.5 rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-bold text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />STREAMING LIVE
                  </span>
                )}
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                Record locally + stream live to Cloudflare.
                <span className="flex items-center gap-1 text-xs text-amber-600">
                  <Info className="h-3 w-3" />Cloudflare Stream required for live viewers
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
          {/* Camera preview (2/3 width) */}
          <div className="space-y-4 lg:col-span-2">
            <div className="relative overflow-hidden rounded-2xl border bg-black aspect-video">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`h-full w-full object-cover ${!videoEnabled ? "opacity-0" : ""}`}
              />

              {/* TF.js canvas overlay — drawn on top of video */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {/* Player count badge (top-left) */}
              {trackingEnabled && playerCount > 0 && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
                  <Users className="h-3.5 w-3.5 text-green-400" />
                  {playerCount} player{playerCount !== 1 ? "s" : ""} detected
                </div>
              )}

              {/* AI model loading badge */}
              {trackingEnabled && trackerLoading && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-green-400" />
                  Loading AI model…
                </div>
              )}

              {/* Tracking error badge */}
              {trackingEnabled && trackerError && (
                <div className="absolute top-3 left-3 rounded-full bg-red-500/80 px-3 py-1 text-xs text-white">
                  {trackerError}
                </div>
              )}

              {(broadcastState === "idle" || broadcastState === "error") && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80">
                  <Camera className="h-14 w-14 text-white/40" />
                  <p className="text-sm text-white/60">Camera preview will appear here</p>
                  {broadcastState === "error" && (
                    <p className="rounded-xl border border-red-500/30 bg-red-500/20 px-4 py-2 text-xs text-red-400 max-w-xs text-center">
                      {errorMsg}
                    </p>
                  )}
                </div>
              )}

              {broadcastState === "requesting" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}

              {broadcastState === "live" && (
                <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                  <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-mono text-white flex items-center gap-1.5">
                    <Timer className="h-3 w-3 text-red-400" />{formatDuration(duration)}
                  </span>
                  <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-mono text-white">
                    {resolution}
                  </span>
                </div>
              )}

              {!videoEnabled && broadcastState !== "idle" && broadcastState !== "error" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90">
                  <VideoOff className="h-10 w-10 text-white/40" />
                </div>
              )}
            </div>

            {/* WHIP connecting state */}
            {whipState === "connecting" && (
              <div className="flex items-center gap-2 rounded-xl border border-orange-400/30 bg-orange-400/5 px-4 py-3 text-sm text-orange-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting to Cloudflare Stream…
              </div>
            )}

            {/* HLS URL share panel — shown when WHIP is live */}
            {whipState === "live" && hlsUrl && (
              <div className="rounded-xl border border-orange-400/30 bg-orange-400/5 px-5 py-4 space-y-2">
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                  Live HLS stream — share this URL with viewers
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-lg bg-background border px-3 py-2 text-xs font-mono">
                    {hlsUrl}
                  </code>
                  <button
                    onClick={copyHlsUrl}
                    className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-muted transition-colors shrink-0"
                  >
                    {hlsCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {hlsCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Viewers can paste this URL into any HLS player. Stream may take 10–20s to become active.
                </p>
              </div>
            )}

            {/* WHIP error note (non-blocking — recording still works) */}
            {(whipState === "error" || whipNote) && (
              <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/5 px-4 py-3 text-xs text-yellow-700">
                <strong>Live streaming unavailable:</strong> {whipError || whipNote || "Cloudflare Stream not configured."} Local recording is still active.
              </div>
            )}

            {/* Sponsor overlay toggle */}
            {isActive && (
              <div>
                <button
                  onClick={() => setShowOverlay((v) => !v)}
                  className="mb-2 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                >
                  {showOverlay ? "Hide" : "Show"} sponsor overlay preview
                </button>
                {showOverlay && (
                  <SponsorshipOverlay
                    videoRef={videoRef as React.RefObject<HTMLVideoElement>}
                    sponsors={DEFAULT_SPONSORS}
                    matchInfo={
                      homeTeam && awayTeam
                        ? { home: homeTeam, away: awayTeam, score: "0 - 0", minute: Math.floor(duration / 60) }
                        : undefined
                    }
                  />
                )}
              </div>
            )}

            {broadcastState === "live" && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-5 py-3 text-center text-sm font-semibold text-red-600 animate-pulse">
                Recording in progress — {formatDuration(duration)} elapsed
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {(broadcastState === "idle" || broadcastState === "error") && (
                <button
                  onClick={requestCamera}
                  className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-5 w-5" /> Enable Camera
                </button>
              )}
              {broadcastState === "requesting" && (
                <button disabled className="flex items-center gap-2 rounded-xl bg-primary/50 px-6 py-3 font-semibold text-primary-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" /> Requesting…
                </button>
              )}
              {broadcastState === "ready" && (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2 rounded-xl bg-red-500 px-8 py-3 font-bold text-white hover:bg-red-600 transition-colors"
                >
                  <Radio className="h-5 w-5" /> Go Live
                </button>
              )}
              {broadcastState === "live" && (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 rounded-xl bg-destructive px-8 py-3 font-bold text-destructive-foreground hover:bg-destructive/90 transition-colors"
                >
                  <Square className="h-5 w-5" /> Stop &amp; Save
                </button>
              )}
              {isActive && (
                <>
                  <button
                    onClick={toggleMute}
                    className={`rounded-xl border p-3 transition-colors hover:bg-muted ${muted ? "text-destructive border-destructive/40" : ""}`}
                  >
                    {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={toggleVideo}
                    className={`rounded-xl border p-3 transition-colors hover:bg-muted ${!videoEnabled ? "text-destructive border-destructive/40" : ""}`}
                  >
                    {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                  </button>
                  {/* TF.js player tracking toggle */}
                  <button
                    onClick={() => setTrackingEnabled((v) => !v)}
                    title={trackingEnabled ? "Disable player tracking" : "Enable TF.js player tracking"}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors hover:bg-muted ${
                      trackingEnabled ? "border-green-500/60 bg-green-500/10 text-green-700" : ""
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    {trackingEnabled
                      ? trackerLoading
                        ? "Loading…"
                        : `Track Players${playerCount > 0 ? ` (${playerCount})` : ""}`
                      : "Track Players"}
                  </button>
                </>
              )}
            </div>

            {broadcastState === "stopped" && (
              <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-5 text-center space-y-2">
                <p className="font-semibold text-green-700">Recording saved!</p>
                <p className="text-sm text-muted-foreground">
                  Your .webm file has been downloaded. Start a new broadcast to record again.
                </p>
                <button
                  onClick={() => { setBroadcastState("idle"); setDuration(0); }}
                  className="mt-2 rounded-xl border px-5 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  New broadcast
                </button>
              </div>
            )}
          </div>

          {/* Right panel */}
          <StreamInfoPanel
            sport={sport} setSport={setSport}
            homeTeam={homeTeam} setHomeTeam={setHomeTeam}
            awayTeam={awayTeam} setAwayTeam={setAwayTeam}
            venue={venue} setVenue={setVenue}
            streamId={streamId}
            resolution={resolution}
            duration={duration}
            commentaryText={commentaryText}
          />
        </div>
      </main>
    </div>
  );
}

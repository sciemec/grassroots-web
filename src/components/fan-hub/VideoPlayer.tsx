"use client";

import { useEffect, useRef, useState } from "react";
import { X, MapPin, User, Cpu, ExternalLink } from "lucide-react";
import type { FanHubVideo } from "./VideoCard";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

const CLIP_TYPE_LABELS: Record<string, string> = {
  highlight: "Highlight",
  full:      "Full Match",
  goals:     "Goals",
  training:  "Training",
  analysis:  "AI Analysis",
  live:      "Live",
};

interface VideoPlayerProps {
  video: FanHubVideo;
  onClose: () => void;
}

export default function VideoPlayer({ video, onClose }: VideoPlayerProps) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const [detail, setDetail] = useState<FanHubVideo>(video);

  // Fetch full details + increment view count
  useEffect(() => {
    fetch(`${API}/fan-hub/videos/${video.id}`)
      .then((r) => r.json())
      .then((d: { data?: FanHubVideo }) => { if (d.data) setDetail(d.data); })
      .catch(() => {});
  }, [video.id]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Pause video on unmount
  useEffect(() => {
    return () => { videoRef.current?.pause(); };
  }, []);

  const typeLabel = CLIP_TYPE_LABELS[detail.clip_type] ?? detail.clip_type;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-4xl rounded-2xl overflow-hidden bg-[#0f2a14] border border-white/10 shadow-2xl flex flex-col">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Video */}
        <div className="w-full aspect-video bg-black">
          <video
            ref={videoRef}
            src={detail.r2_url}
            controls
            autoPlay
            className="w-full h-full"
            playsInline
          >
            Your browser does not support HTML5 video.
          </video>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col gap-3">
          {/* Title + badge */}
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h2 className="text-white font-bold text-lg leading-snug">{detail.title}</h2>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {detail.is_ai_generated && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white uppercase tracking-wider">
                  <Cpu className="w-3 h-3" /> AI
                </span>
              )}
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-black uppercase tracking-wider">
                {typeLabel}
              </span>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-green-300/70">
            {detail.uploader_name && (
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {detail.uploader_name}
              </span>
            )}
            {detail.province && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {detail.province}
              </span>
            )}
            <span className="text-green-400/50">
              {detail.view_count.toLocaleString()} views
            </span>
          </div>

          {/* Tagged player link */}
          {detail.tagged_player_id && (
            <a
              href={`/player/public/${detail.tagged_player_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View tagged player profile
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { Play, Eye, MapPin, Cpu } from "lucide-react";

export interface FanHubVideo {
  id: string;
  title: string;
  clip_type: string;
  province: string | null;
  r2_key: string;
  r2_url: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  uploader_name: string | null;
  uploader_id: string | number | null;
  tagged_player_id: string | number | null;
  view_count: number;
  is_featured: boolean;
  is_live: boolean;
  is_ai_generated: boolean;
  status: string;
  created_at: string;
}

const CLIP_TYPE_LABELS: Record<string, string> = {
  highlight:  "Highlight",
  full:       "Full Match",
  goals:      "Goals",
  training:   "Training",
  analysis:   "AI Analysis",
  live:       "Live",
};

const CLIP_TYPE_COLOURS: Record<string, string> = {
  highlight: "bg-amber-500 text-black",
  full:      "bg-blue-600 text-white",
  goals:     "bg-red-600 text-white",
  training:  "bg-green-700 text-white",
  analysis:  "bg-purple-600 text-white",
  live:      "bg-red-500 text-white animate-pulse",
};

function formatDuration(secs: number | null): string {
  if (!secs) return "";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface VideoCardProps {
  video: FanHubVideo;
  size?: "normal" | "large";
  onPlay: (video: FanHubVideo) => void;
}

export default function VideoCard({ video, size = "normal", onPlay }: VideoCardProps) {
  const typeLabel  = CLIP_TYPE_LABELS[video.clip_type] ?? video.clip_type;
  const typeColour = CLIP_TYPE_COLOURS[video.clip_type] ?? "bg-gray-600 text-white";

  return (
    <button
      onClick={() => onPlay(video)}
      className={`group flex flex-col text-left rounded-xl overflow-hidden border border-[#f0b429]/10 bg-white/5 hover:bg-white/10 hover:border-[#f0b429]/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 ${size === "large" ? "w-full" : ""}`}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-black/40 overflow-hidden">
        {video.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-900/60 to-black/60">
            <Play className="w-10 h-10 text-white/30" />
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 text-black fill-black" />
          </div>
        </div>

        {/* Live badge */}
        {video.is_live && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white animate-pulse uppercase tracking-wider">
            LIVE
          </span>
        )}

        {/* Clip type badge */}
        {!video.is_live && (
          <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${typeColour}`}>
            {typeLabel}
          </span>
        )}

        {/* AI badge */}
        {video.is_ai_generated && (
          <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white uppercase tracking-wider">
            <Cpu className="w-3 h-3" /> AI
          </span>
        )}

        {/* Duration */}
        {video.duration_seconds && !video.is_live && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[11px] font-mono bg-black/70 text-white">
            {formatDuration(video.duration_seconds)}
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="p-3 flex-1 flex flex-col gap-1">
        <p className={`font-semibold text-white leading-snug line-clamp-2 ${size === "large" ? "text-base" : "text-sm"}`}>
          {video.title}
        </p>
        <div className="flex items-center gap-3 text-xs text-green-300/70 mt-auto pt-1">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {video.view_count.toLocaleString()}
          </span>
          {video.province && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {video.province}
            </span>
          )}
          <span className="ml-auto">{timeAgo(video.created_at)}</span>
        </div>
        {video.uploader_name && (
          <p className="text-xs text-green-400/60 truncate">{video.uploader_name}</p>
        )}
      </div>
    </button>
  );
}

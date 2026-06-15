"use client";

import { useState } from "react";
import { Film, CheckCircle, Trash2, Eye, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";
import { safeArray } from "@/lib/safe-array";

interface FanHubVideo {
  id: string;
  title: string;
  clip_type: string;
  r2_url: string;
  thumbnail_url: string | null;
  province: string | null;
  uploader_name: string | null;
  is_ai_generated: boolean;
  is_live: boolean;
  report_count: number;
  view_count: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  tagged_player_id: string | null;
  match_id: string | null;
}

type StatusTab = "pending" | "approved";

const CLIP_TYPE_COLOURS: Record<string, string> = {
  highlight:  "bg-amber-500/20 text-amber-300",
  full:       "bg-blue-500/20 text-blue-300",
  goals:      "bg-green-500/20 text-green-300",
  training:   "bg-purple-500/20 text-purple-300",
  analysis:   "bg-cyan-500/20 text-cyan-300",
  live:       "bg-red-500/20 text-red-300",
};

function VideoSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-xl bg-white/5" />
      ))}
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminFanHubPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [statusTab, setStatusTab] = useState<StatusTab>("pending");
  const [previewId, setPreviewId] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery<{ data: FanHubVideo[]; total?: number }>({
    queryKey: ["admin-fan-hub", statusTab],
    queryFn: async () => {
      const res = await api.get("/admin/fan-hub/videos", { params: { status: statusTab, per_page: 20 } });
      return res.data;
    },
    enabled: !!user,
  });

  const videos = safeArray<FanHubVideo>(data);

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/fan-hub/videos/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-fan-hub"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/fan-hub/videos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-fan-hub"] });
      setPreviewId(null);
    },
  });

  const previewVideo = videos.find((v) => v.id === previewId);

  return (
    <main className="overflow-y-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Film className="h-6 w-6 text-[#f0b429]" />
            <div>
              <h1 className="text-xl font-bold text-white">Fan Hub Moderation</h1>
              <p className="text-xs text-white/50">Review and approve community video submissions</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Status tabs */}
        <div className="mb-5 flex gap-2">
          {(["pending", "approved"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                statusTab === tab
                  ? "bg-[#f0b429] text-[#1a3a1a]"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {tab}
              {tab === "pending" && videos.length > 0 && statusTab === "pending" && (
                <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {videos.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <VideoSkeleton />
        ) : videos.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-[#f0b429]/10 bg-white/5 text-center">
            <CheckCircle className="mb-3 h-8 w-8 text-green-400/60" />
            <p className="text-sm font-medium text-white/60">
              {statusTab === "pending" ? "No videos awaiting review" : "No approved videos yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {videos.map((video) => {
              const isApproving = approveMutation.isPending && approveMutation.variables === video.id;
              const isDeleting = deleteMutation.isPending && deleteMutation.variables === video.id;

              return (
                <div
                  key={video.id}
                  className="flex items-center gap-4 rounded-xl border border-[#f0b429]/10 bg-white/5 p-4 transition-colors hover:bg-white/[0.07]"
                >
                  {/* Thumbnail */}
                  <div
                    className="relative h-16 w-28 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg bg-black/40"
                    onClick={() => setPreviewId(previewId === video.id ? null : video.id)}
                  >
                    {video.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Film className="h-6 w-6 text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                      <Eye className="h-4 w-4 text-white" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${CLIP_TYPE_COLOURS[video.clip_type] ?? "bg-white/10 text-white/50"}`}>
                        {video.clip_type}
                      </span>
                      {video.is_ai_generated && (
                        <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-300">
                          THUTO AI
                        </span>
                      )}
                      {video.is_live && (
                        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-red-300">
                          LIVE
                        </span>
                      )}
                      {video.report_count >= 3 && (
                        <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300">
                          <AlertTriangle className="h-3 w-3" />
                          {video.report_count} reports
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm font-medium text-white">{video.title}</p>
                    <p className="mt-0.5 text-[11px] text-white/40">
                      {video.uploader_name ?? "Anonymous"}
                      {video.province ? ` · ${video.province}` : ""}
                      {" · "}
                      {timeAgo(video.created_at)}
                      {video.view_count > 0 ? ` · ${video.view_count} views` : ""}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-shrink-0 gap-2">
                    {statusTab === "pending" && (
                      <button
                        onClick={() => approveMutation.mutate(video.id)}
                        disabled={isApproving || isDeleting}
                        className="flex items-center gap-1.5 rounded-lg bg-green-600/20 px-3 py-1.5 text-xs font-semibold text-green-300 transition-colors hover:bg-green-600/30 disabled:opacity-50"
                      >
                        {isApproving ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5" />
                        )}
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${video.title}"? This cannot be undone.`)) {
                          deleteMutation.mutate(video.id);
                        }
                      }}
                      disabled={isApproving || isDeleting}
                      className="flex items-center gap-1.5 rounded-lg bg-red-600/20 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-600/30 disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Inline video preview */}
        {previewVideo && (
          <div className="mt-4 overflow-hidden rounded-xl border border-[#f0b429]/10 bg-black">
            <div className="flex items-center justify-between bg-white/5 px-4 py-2">
              <p className="text-xs font-medium text-white/70 truncate">{previewVideo.title}</p>
              <button
                onClick={() => setPreviewId(null)}
                className="text-[10px] text-white/40 hover:text-white/70"
              >
                Close preview
              </button>
            </div>
            <video
              src={previewVideo.r2_url}
              controls
              className="w-full"
              style={{ maxHeight: "360px" }}
            />
          </div>
        )}
    </main>
  );
}

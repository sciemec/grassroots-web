
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, Video, Trash2, Loader2 } from "lucide-react";
import { SimplifiedSidebar } from "@/components/layout/simplified-sidebar";
import { useAuthStore } from "@/lib/auth-store";

interface VideoItem {
  id: string;
  url: string;
  name: string;
  date: string;
  size: number;
}

export default function AthleteVaultPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = () => {
    const stored = localStorage.getItem("gs_athlete_videos");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) setVideos(parsed);
    }
  };

  const saveVideos = (newVideos: VideoItem[]) => {
    localStorage.setItem("gs_athlete_videos", JSON.stringify(newVideos));
    setVideos(newVideos);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      alert("Please upload a video file");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      alert("Video must be less than 100MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Get presigned URL from your backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/presigned`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });

      if (!response.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, key } = await response.json();

      // Upload directly to R2
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const r2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";
          const publicUrl = r2Base ? `${r2Base}/${key}` : "";
          const newVideo: VideoItem = {
            id: Date.now().toString(),
            url: publicUrl,
            name: file.name,
            date: new Date().toISOString(),
            size: file.size,
          };
          setVideos((prev) => {
            const updated = [newVideo, ...prev];
            localStorage.setItem("gs_athlete_videos", JSON.stringify(updated));
            return updated;
          });
        } else {
          alert("Upload failed. Please try again.");
        }
        setIsUploading(false);
      };

      xhr.onerror = () => {
        alert("Upload failed. Please check your connection.");
        setIsUploading(false);
      };

      xhr.send(file);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to get upload URL. Please try again.");
      setIsUploading(false);
    }
  };

  const deleteVideo = (id: string) => {
    if (confirm("Delete this video?")) {
      saveVideos(videos.filter(v => v.id !== id));
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex min-h-screen bg-[#f4f2ee]">
      <SimplifiedSidebar />
      
      <main className="flex-1 lg:ml-64 p-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/athlete" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-xl font-black text-gray-900">My Video Vault</h1>
                <p className="text-sm text-gray-500 mt-1">Upload training clips to share with scouts</p>
              </div>
              
              <label className="cursor-pointer bg-[#1a5c2a] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#2a6e3a] transition-colors flex items-center gap-2">
                <Upload size={16} />
                Upload Video
                <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {isUploading && (
              <div className="p-4 bg-blue-50 border-b border-blue-100">
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin text-blue-600" size={20} />
                  <div className="flex-1">
                    <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-xs text-blue-600 mt-1">Uploading... {uploadProgress}%</p>
                  </div>
                </div>
              </div>
            )}

            {videos.length === 0 && !isUploading ? (
              <div className="p-12 text-center">
                <Video size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No videos yet</p>
                <p className="text-xs text-gray-400 mt-1">Upload your first training clip</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {videos.map((video) => (
                  <div key={video.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <video src={video.url} className="w-20 h-14 rounded-lg object-cover bg-black" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{video.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(video.date).toLocaleDateString()} · {formatSize(video.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteVideo(video.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-gray-50 p-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                Your videos are stored securely. Free tier: 500MB · Pro tier: 5GB
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Video, UploadCloud, AlertCircle, FileVideo, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";

export default function MatchEyeSetupPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  // Upload Management States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(""); // Tracks live pipeline checkpoints

  // Drag and Drop Ingestion Event Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError("");

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  // Pipeline Content Validation Matrix
  const validateAndSetFile = (file: File) => {
    if (!file.type.startsWith("video/")) {
      setError("Unsupported media template type. Please upload a structured video component format (MP4, MOV, AVI).");
      return;
    }

    const MAX_SIZE = 500 * 1024 * 1024; // 500MB target boundary limit checks
    if (file.size > MAX_SIZE) {
      setError(`File size configuration exceeds allocation capacities. File size: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Limit: 500MB.`);
      return;
    }

    setSelectedFile(file);
  };

  // 🚀 NO MORE MOCKING: Real Direct-To-Storage Upload Processor
  const handleProcessVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setError("");
    setUploadStatus("Acquiring secure upload token ticket...");

    try {
      // Step 1: Request a secure single-use Presigned upload link from your Next.js API
      const response = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          filename: selectedFile.name, 
          contentType: selectedFile.type 
        }),
      });

      if (!response.ok) throw new Error("Could not initialize upload channel permissions.");
      
      const { uploadUrl, fileKey } = await response.json();
      if (!uploadUrl) throw new Error("Storage destination permission access denied.");

      setUploadStatus("Streaming raw footage directly to storage bucket...");

      // Step 2: Stream the video bytes directly to your bucket (bypassing Vercel's size thresholds completely)
      const uploadResult = await fetch(uploadUrl, {
        method: "PUT",
        body: selectedFile,
        headers: { "Content-Type": selectedFile.type },
      });

      if (!uploadResult.ok) throw new Error("Data sync connection dropped during chunk transfer.");

      setUploadStatus("Analyzing footprint telemetry metrics...");

      // Step 3: Register the true, permanent file storage key path to local history records
      localStorage.setItem(
        "gs_match_eye_last",
        JSON.stringify({
          filename: selectedFile.name,
          fileKey: fileKey, // Real bucket location path (e.g., 'uploads/1716...-game.mp4')
          status: "processing",
          timestamp: new Date().toISOString(),
        })
      );

      // Step 4: Proceed cleanly to the live analyst visual deck
      router.push("/analyst");

    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An unexpected network interruption occurred during upload streams.");
      setIsUploading(false);
      setUploadStatus("");
    }
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50/50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6 lg:p-10">
        {/* Navigation back trace */}
        <div className="mb-8 flex items-center gap-3">
          <Link href="/coach" className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 shadow-sm hover:bg-gray-50 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900">Match Eye Pipeline</h1>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-0.5">Automated Multi-Modal Video Analytics Ingestion</p>
          </div>
        </div>

        <div className="max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex gap-4 rounded-xl bg-green-50/50 border border-green-100 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1a5c2a] text-white">
              <Video size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">AI-Driven Match Intelligence</h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                Upload your high-definition full match or training scrimmage videos. The multimodal analytical engine automatically compiles player metrics, velocity changes, spatial overlays, and maps technical breakdowns.
              </p>
            </div>
          </div>

          <form onSubmit={handleProcessVideo} className="space-y-5">
            {/* Visual Dropzone Component Layout */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
                isDragging
                  ? "border-emerald-500 bg-emerald-50/30 scale-[0.99]"
                  : selectedFile
                  ? "border-[#1a5c2a]/40 bg-green-50/10"
                  : "border-gray-300 bg-gray-50 hover:border-gray-400"
              }`}
            >
              <input
                type="file"
                id="match-video-file"
                accept="video/*"
                onChange={handleFileChange}
                disabled={isUploading}
                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />

              <div className="flex flex-col SkinnerLayout elements center items-center gap-3">
                {!selectedFile ? (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-500 shadow-inner">
                      <UploadCloud size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Drag and drop footage resource</p>
                      <p className="mt-1 text-xs text-gray-500">Supports standard container sizes up to 500MB</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-[#1a5c2a] shadow-sm animate-pulse">
                      <FileVideo size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-gray-900 truncate max-w-sm">{selectedFile.name}</p>
                      <p className="mt-1 text-xs font-semibold text-gray-500">
                        File Weight Class: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <p className="mt-3 text-[10px] uppercase font-black tracking-wider text-[#1a5c2a] bg-emerald-100/60 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Click or drag to swap resource file
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Live Pipeline Status Feedback Row */}
            {isUploading && uploadStatus && (
              <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3.5 text-xs font-semibold text-amber-900 animate-pulse">
                <Loader2 className="h-4 w-4 shrink-0 text-amber-600 animate-spin" />
                <span>{uploadStatus}</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Pipeline Trigger Master Control Submit Ingestion Action */}
            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-sm transition-all ${
                !selectedFile || isUploading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-200 shadow-none"
                  : "bg-[#1a5c2a] hover:bg-green-800"
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Streaming Ingestion Data...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Initialize Match Eye Analysis
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
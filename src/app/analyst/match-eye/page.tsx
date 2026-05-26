"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Video, UploadCloud, AlertCircle, FileVideo, Sparkles } from "lucide-react";
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

  const validateAndSetFile = (file: File) => {
    // Basic structural validation check for video content files
    if (!file.type.startsWith("video/")) {
      setError("Unsupported format. Please supply a valid MP4, MOV, or AVI match recording.");
      return;
    }
    // Limit to 500MB on local pipeline for native Gemini upload configurations
    if (file.size > 500 * 1024 * 1024) {
      setError("File exceeds the maximum 500MB baseline allocation constraint.");
      return;
    }
    setSelectedFile(file);
  };

  const handleProcessVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please stage a match video file entry before initializing computer vision ingestion.");
      return;
    }
    
    setIsUploading(true);
    setError("");

    try {
      // Mock integration point: write logic parameters for local localStorage validation
      localStorage.setItem("gs_match_eye_last", JSON.stringify({
        fileName: selectedFile.name,
        timestamp: Date.now(),
        status: "processing"
      }));
      
      // Route onwards into visual dashboard feedback area
      router.push("/analyst");
    } catch (err) {
      setError("An operational ingestion pipeline error occurred. Please verify connectivity bounds.");
      setIsUploading(false);
    }
  };

  return (
    // CANVAS: Premium institutional light layout matrix base 
    <div className="flex h-screen bg-[#f4f2ee]">
      <Sidebar />
      
      <main className="flex-1 overflow-auto p-6">
        {/* Navigation Context Bar */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/analyst" className="rounded-lg p-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#c8962a]">Computer Vision Module</p>
            <h1 className="text-xl font-black text-gray-900">Match Eye Pipeline</h1>
          </div>
        </div>

        {/* Informational Explainer Row Card */}
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-[#c8962a] shrink-0">
              <Video size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Native Multimodal Tracking Core</p>
              <p className="mt-0.5 text-xs text-gray-600 leading-relaxed">
                Upload your raw game footprint video records directly. Gemini watches the file natively to extract positional parameters, while custom LLM subagents generate structured tactical breakdowns instantly.
              </p>
            </div>
          </div>
        </div>

        {/* Primary Functional Area Form Layout Component Grid */}
        <div className="max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleProcessVideo} className="space-y-6">
            
            {/* Native Media Drag/Drop Input Wrapper - High Visibility Contrast Rules */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-700">Footage Raw File Entry *</p>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative rounded-2xl border-2 border-dashed p-8 text-center flex flex-col items-center justify-center transition-all ${
                  isDragging
                    ? "border-[#1a5c2a] bg-green-50/50"
                    : selectedFile
                    ? "border-emerald-300 bg-emerald-50/20"
                    : "border-gray-300 bg-[#f4f2ee] hover:bg-gray-100/70"
                }`}
              >
                <input
                  id="matchEyeVideoInput"
                  name="match_eye_raw_video"
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                {!selectedFile ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 mb-3 shadow-sm">
                      <UploadCloud size={22} className="text-gray-500" />
                    </div>
                    {/* FIXED TEXT: Converted light fonts into crisp high-density charcoal metrics */}
                    <p className="text-sm font-bold text-gray-900">
                      Drag and drop your match file here, or <span className="text-[#1a5c2a] underline cursor-pointer">browse files</span>
                    </p>
                    <p className="mt-1.5 text-xs text-gray-500 font-medium">
                      Supports MP4, MOV, or AVI structural footprints up to 500MB allocation capacity limits.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-[#1a5c2a] flex items-center justify-center text-white mb-3 shadow-sm">
                      <FileVideo size={22} />
                    </div>
                    <p className="text-sm font-bold text-gray-900 truncate max-w-md">
                      {selectedFile.name}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 font-bold">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB — Staged Ready
                    </p>
                    <p className="mt-3 text-[10px] uppercase font-black tracking-wider text-[#1a5c2a] bg-emerald-100/60 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Click or drag to swap resource file
                    </p>
                  </>
                )}
              </div>
            </div>

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
              <Sparkles size={14} className={isUploading ? "animate-spin" : ""} />
              {isUploading ? "Uploading & Analyzing Footage..." : "Initialize Match Eye Analysis"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
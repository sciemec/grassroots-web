"use client";

import React, { useState, useRef } from "react";
import { CloudUpload, Loader2, Image as ImageIcon, Film, CheckCircle, AlertTriangle } from "lucide-react";

interface SocialUploaderProps {
  onUploadComplete: (fileKey: string, mediaType: "image" | "video") => void;
}

export default function SocialUploader({ onUploadComplete }: SocialUploaderProps) {
  const [compressing, setCompressing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. IMAGE COMPRESSION ENGINE: Scales down photos to Max 1080p width and lowers JPEG quality weights
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1080; // Standard premium mobile width optimization checkpoint
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas context generation failed"));
          
          ctx.drawImage(img, 0, 0, width, height);

          // Convert canvas frame layout back into a highly compact raw blob image
          ctx.canvas.toBlob(
            (blob) => {
              if (blob) {
                console.log(`Image Compressed: Original ${file.size / 1024}KB -> New ${blob.size / 1024}KB`);
                resolve(blob);
              } else {
                reject(new Error("Blob layout generation error"));
              }
            },
            "image/jpeg",
            0.75 // Set compression ratio to 75% for massive file-size reduction with zero visible pixel loss
          );
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // 2. FILE INTERCEPTION HANDLE
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let mediaType: "image" | "video" = file.type.startsWith("image/") ? "image" : "video";
    let uploadPayload: Blob | File = file;

    try {
      setCompressing(true);

      if (mediaType === "image") {
        setStatusText("Optimizing & compressing image metadata...");
        uploadPayload = await compressImage(file);
      } else if (mediaType === "video") {
        setStatusText("Checking video optimization parameters...");
        // Client-side video guard threshold constraint check: Warn if file is over 25MB to preserve local data lines
        if (file.size > 25 * 1024 * 1024) {
          setStatusText("Video exceeds recommended network size parameters. Shorten to under 30 seconds.");
          setCompressing(false);
          return;
        }
      }

      setCompressing(false);
      setUploading(true);
      setStatusText("Acquiring secure upload token tickets...");

      // Step 3: Fetch secure direct-to-bucket single-use Presigned upload link
      const response = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });

      const { uploadUrl, key } = await response.json();
      if (!uploadUrl) throw new Error("Storage pathway permission validation denied");

      setStatusText("Streaming compressed package direct to storage...");

      // Step 4: PUT payload directly to Cloudflare R2 / AWS S3 (Zero Vercel server payload overhead)
      const uploadResult = await fetch(uploadUrl, {
        method: "PUT",
        body: uploadPayload,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResult.ok) throw new Error("File stream sync connection dropped");

      setStatusText("Media successfully published! 🎉");
      onUploadComplete(key, mediaType);

      // Clear the file window path safely
      if (fileInputRef.current) fileInputRef.current.value = "";

    } catch (error) {
      console.error(error);
      setStatusText("Process interupted. Verify connection lines.");
    } finally {
      setCompressing(false);
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-5 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl text-white">
      <h3 className="text-sm font-bold tracking-wider uppercase text-zinc-400 mb-3 flex items-center gap-2">
        📥 Create Story / Reel Asset
      </h3>

      <div 
        onClick={() => !compressing && !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
          compressing || uploading 
            ? "border-amber-500/40 bg-amber-500/5 cursor-not-allowed" 
            : "border-zinc-700 bg-zinc-950 hover:border-primary/50"
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,video/*"
          className="hidden"
          disabled={compressing || uploading}
        />

        {compressing || uploading ? (
          <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
        ) : (
          <CloudUpload className="h-8 w-8 text-zinc-500" />
        )}

        <div className="text-center">
          <p className="text-xs font-semibold text-zinc-200">
            {compressing || uploading ? "Processing Media Track" : "Select Reel Video or Story Image"}
          </p>
          <p className="text-[10px] text-zinc-400 mt-1">
            Images are auto-compressed locally to save network bundles
          </p>
        </div>
      </div>

      {statusText && (
        <div className={`mt-4 p-3 rounded-xl flex items-start gap-2 text-xs font-medium ${
          statusText.includes("failed") || statusText.includes("exceeds")
            ? "bg-red-500/10 text-red-400 border border-red-500/20"
            : statusText.includes("successfully") || statusText.includes("published")
            ? "bg-green-500/10 text-green-400 border border-green-500/20"
            : "bg-zinc-950 text-zinc-300 border border-zinc-800"
        }`}>
          {statusText.includes("published") ? (
            <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
          ) : statusText.includes("exceeds") || statusText.includes("Verify") ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
          ) : (
            <div className="h-3 w-3 rounded-full bg-amber-500 animate-pulse mt-0.5 shrink-0" />
          )}
          <span className="leading-relaxed">{statusText}</span>
        </div>
      )}

      {/* QUICK FOOTER DATA BADGES */}
      <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
        <span className="flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Auto-JPEG 75%</span>
        <span className="flex items-center gap-1"><Film className="h-3 w-3" /> Max 25MB Target</span>
      </div>
    </div>
  );
}
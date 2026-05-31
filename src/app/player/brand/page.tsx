"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, Wand2, Download, Image as ImageIcon, Sparkles, Loader2 } from "lucide-react";
import { PlayerSidebar } from "@/components/layout/player-sidebar";

export default function BrandStudioPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setEnhancedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const enhanceImage = () => {
    if (!selectedImage) return;
    
    setIsProcessing(true);
    
    // Simulate AI enhancement (brightness, contrast, sharpness)
    setTimeout(() => {
      // In production, this would call an actual image enhancement API
      setEnhancedImage(selectedImage);
      setIsProcessing(false);
    }, 2000);
  };

  const downloadImage = () => {
    if (enhancedImage) {
      const link = document.createElement("a");
      link.download = "enhanced-profile.jpg";
      link.href = enhancedImage;
      link.click();
    }
  };

  const resetUpload = () => {
    setSelectedImage(null);
    setEnhancedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-950">
      <PlayerSidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <Link href="/player" className="flex items-center gap-2 text-gray-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Hub</span>
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-gray-500">AI Photo Enhancement</span>
            </div>
          </div>

          {/* Hero Banner */}
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-emerald-900/40 to-blue-900/40 p-5 border border-emerald-800/30 text-center">
            <h1 className="text-xl font-black text-white">Brand Studio</h1>
            <p className="text-sm text-gray-400 mt-1">
              Enhance your profile photos with AI. Scouts notice quality images.
            </p>
          </div>

          {/* Main Content */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/30 p-6">
            {/* Upload Area */}
            {!selectedImage ? (
              <div 
                className="flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-700 bg-gray-900/50 p-8 text-center transition-all hover:border-emerald-500 hover:bg-gray-900/70"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Upload className="mx-auto mb-3 h-10 w-10 text-gray-500" />
                <p className="text-sm font-medium text-white">Upload Profile Photo</p>
                <p className="mt-1 text-xs text-gray-500">JPG, PNG, or WebP • Max 5MB</p>
                <p className="mt-2 text-[10px] text-gray-600">AI will enhance quality and lighting</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Image Preview Row */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Original */}
                  <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                    <p className="mb-2 text-center text-xs font-medium text-gray-500">Original</p>
                    <img 
                      src={selectedImage} 
                      alt="Original" 
                      className="mx-auto max-h-64 rounded-lg object-contain"
                    />
                  </div>
                  
                  {/* Enhanced */}
                  <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                    <p className="mb-2 text-center text-xs font-medium text-gray-500">
                      {isProcessing ? "Processing..." : "Enhanced"}
                    </p>
                    {isProcessing ? (
                      <div className="flex min-h-[200px] flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                        <p className="mt-2 text-xs text-gray-500">AI Enhancing...</p>
                      </div>
                    ) : enhancedImage ? (
                      <img 
                        src={enhancedImage} 
                        alt="Enhanced" 
                        className="mx-auto max-h-64 rounded-lg object-contain"
                      />
                    ) : (
                      <div className="flex min-h-[200px] flex-col items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-600" />
                        <p className="mt-2 text-xs text-gray-500">Click Enhance to process</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center gap-3">
                  {!enhancedImage && !isProcessing && (
                    <button
                      onClick={enhanceImage}
                      className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
                    >
                      <Wand2 className="h-4 w-4" />
                      Enhance with AI
                    </button>
                  )}
                  
                  {enhancedImage && !isProcessing && (
                    <button
                      onClick={downloadImage}
                      className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Download Enhanced
                    </button>
                  )}
                  
                  <button
                    onClick={resetUpload}
                    className="rounded-xl border border-gray-700 px-6 py-2.5 text-sm font-medium text-gray-400 hover:bg-gray-800 transition-colors"
                  >
                    Upload Different Photo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tips Card */}
          <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900/30 p-4">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Pro Tips</h3>
            <div className="mt-3 grid gap-2 text-xs text-gray-400">
              <p>📸 • Use good lighting (natural daylight works best)</p>
              <p>🎯 • Face the camera directly, smile naturally</p>
              <p>🖼️ • Use a clean, simple background</p>
              <p>✨ • Enhanced photos get 3x more scout views</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
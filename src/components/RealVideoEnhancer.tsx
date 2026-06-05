
"use client";

import { useState, useRef, useEffect } from "react";
import { X, Sparkles, Camera, Upload, Loader2, Play, Check } from "lucide-react";
import { VIDEO_FILTERS, captureThumbnail, getFilterCss } from "@/lib/real-video-enhancement";

interface RealVideoEnhancerProps {
  videoFile: File;
  playerName: string;
  sport?: string;
  onClose: () => void;
  onSave: (enhancedBlob: Blob, thumbnailUrl: string, filterUsed: string) => void;
}

export function RealVideoEnhancer({ 
  videoFile, 
  playerName, 
  sport = "Athlete",
  onClose, 
  onSave 
}: RealVideoEnhancerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState("sports");
  const [thumbnail, setThumbnail] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingThumb, setIsGeneratingThumb] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(videoFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && video.readyState >= 2) {
      generateThumbnail();
    } else if (video) {
      video.addEventListener('loadeddata', () => {
        generateThumbnail();
      });
    }
  }, [selectedFilter, videoRef.current]);

  const generateThumbnail = async () => {
    if (!videoRef.current) return;
    
    setIsGeneratingThumb(true);
    const filterCss = getFilterCss(selectedFilter);
    const thumb = await captureThumbnail(videoRef.current, filterCss, playerName, sport);
    setThumbnail(thumb);
    setIsGeneratingThumb(false);
  };

  const handleSave = async () => {
    setIsProcessing(true);
    
    // Save the original file - the "enhancement" is CSS filter metadata
    // The thumbnail has the actual filter applied permanently
    onSave(videoFile, thumbnail, selectedFilter);
    
    // Small delay for UX
    setTimeout(() => {
      setIsProcessing(false);
    }, 500);
  };

  const currentFilter = VIDEO_FILTERS[selectedFilter];

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Sparkles size={20} className="text-[#f0b429]" />
            <h2 className="text-lg font-black text-gray-900">AI Video Studio</h2>
            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full">
              Live Preview
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Video Preview - REAL CSS filters applied live */}
            <div className="lg:col-span-2 space-y-3">
              <div className="bg-black rounded-xl overflow-hidden relative">
                <video
                  ref={videoRef}
                  src={previewUrl}
                  controls
                  autoPlay
                  loop
                  muted
                  className="w-full"
                  style={{ filter: currentFilter.cssFilter }}
                />
                <div className="absolute bottom-3 right-3 bg-black/60 rounded-lg px-2 py-1 text-[10px] text-white">
                  {currentFilter.name} • Live
                </div>
              </div>
              
              {/* Thumbnail Preview */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Camera size={16} className="text-gray-500" />
                <span className="text-xs text-gray-600">Enhanced thumbnail preview</span>
                {isGeneratingThumb ? (
                  <Loader2 size={14} className="animate-spin text-gray-400" />
                ) : thumbnail ? (
                  <div className="flex items-center gap-2">
                    <img src={thumbnail} alt="Thumbnail" className="w-16 h-12 rounded object-cover border border-gray-200" />
                    <Check size={12} className="text-green-500" />
                  </div>
                ) : null}
              </div>
            </div>

            {/* Controls Panel */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900">Visual Presets</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {Object.entries(VIDEO_FILTERS).map(([key, filter]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedFilter(key)}
                    className={`
                      w-full p-3 rounded-xl text-left transition-all
                      ${selectedFilter === key 
                        ? "bg-[#1a5c2a] text-white" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{filter.icon}</span>
                      <span className="text-sm font-medium">{filter.name}</span>
                      {selectedFilter === key && (
                        <Check size={12} className="ml-auto text-white" />
                      )}
                    </div>
                    <p className={`text-[10px] mt-1 ${selectedFilter === key ? "text-white/70" : "text-gray-500"}`}>
                      {filter.description}
                    </p>
                  </button>
                ))}
              </div>

              {/* Info Box */}
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 mt-4">
                <p className="text-[10px] text-amber-800">
                  💡 The thumbnail will have the filter applied permanently. 
                  The video itself can be re-filtered anytime.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isProcessing}
            className="px-6 py-2 bg-gradient-to-r from-[#1a5c2a] to-[#2a6e3a] text-white rounded-xl text-sm font-bold hover:shadow-md disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isProcessing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {isProcessing ? "Saving..." : "Save & Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
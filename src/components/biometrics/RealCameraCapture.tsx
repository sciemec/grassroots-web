
"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Video, Square, Loader2, CheckCircle, AlertCircle, Upload } from "lucide-react";
import { analyzeMovementVideo } from "@/lib/video-analyzer";

interface RealCameraCaptureProps {
  testType: "20m_sprint" | "vertical_leap" | "pro_agility";
  onCaptureComplete: (videoBlob: Blob, durationSeconds: number) => void;
  onError: (error: string) => void;
}

export function RealCameraCapture({ testType, onCaptureComplete, onError }: RealCameraCaptureProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ duration: number; confidence: number } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const testConfig = {
    "20m_sprint": { 
      maxDuration: 6, 
      instruction: "Record your 20m sprint from start to finish",
      tip: "Position camera to see the entire 20m distance"
    },
    "vertical_leap": { 
      maxDuration: 2, 
      instruction: "Record your jump - we'll measure hang time",
      tip: "Keep feet in frame during entire jump"
    },
    "pro_agility": { 
      maxDuration: 8, 
      instruction: "Record complete 5-10-5 shuttle run",
      tip: "Camera should see both start and turn points"
    },
  };

  const config = testConfig[testType];

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      onError("Camera access denied. Please check permissions or use file upload.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordingTime(0);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    
    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm'
    });
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    
    mediaRecorder.onstop = async () => {
      const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' });
      const videoUrl = URL.createObjectURL(videoBlob);
      setPreviewUrl(videoUrl);
      await processVideo(videoBlob);
    };
    
    mediaRecorder.start(1000);
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
    
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const processVideo = async (videoBlob: Blob) => {
    setIsProcessing(true);
    setAnalysisResult(null);
    
    try {
      const result = await analyzeMovementVideo(videoBlob, testType);
      
      if (result.method === "auto_detected" && result.durationSeconds > 0) {
        setAnalysisResult({ duration: result.durationSeconds, confidence: result.confidence });
        onCaptureComplete(videoBlob, result.durationSeconds);
      } else {
        // Auto-detection failed - prompt for manual entry
        const manualTime = window.prompt(
          `Auto-detection couldn't measure accurately.\nEnter your ${testType} time in seconds:`,
          testType === "vertical_leap" ? "0.48" : "3.2"
        );
        
        if (manualTime) {
          const duration = parseFloat(manualTime);
          if (!isNaN(duration) && duration > 0) {
            setAnalysisResult({ duration, confidence: 0 });
            onCaptureComplete(videoBlob, duration);
          } else {
            onError("Invalid time entered. Please try again.");
          }
        } else {
          onError("Measurement required to continue.");
        }
      }
    } catch (err) {
      console.error("Processing error:", err);
      onError("Failed to analyze video. Please try again or use manual entry.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('video/')) {
      onError("Please upload a video file (MP4, MOV, WebM)");
      return;
    }
    
    const videoUrl = URL.createObjectURL(file);
    setPreviewUrl(videoUrl);
    await processVideo(file);
  };

  const retake = () => {
    setPreviewUrl(null);
    setAnalysisResult(null);
    stopCamera();
    startCamera();
  };

  return (
    <div className="space-y-4">
      {!previewUrl ? (
        <>
          {!isStreaming ? (
            <div className="text-center space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
                <p className="text-xs font-bold text-amber-800 mb-2">📹 Recording Tips:</p>
                <p className="text-xs text-amber-700">{config.tip}</p>
              </div>
              
              <button
                onClick={startCamera}
                className="w-full bg-[#1a5c2a] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Camera size={18} /> Open Camera
              </button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>
              
              <label className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#1a5c2a] transition-colors">
                <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium">Upload Video File</p>
                <p className="text-xs text-gray-500 mt-1">MP4, MOV, or WebM</p>
                <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-xl bg-black aspect-video object-cover"
              />
              
              <p className="text-xs text-center text-gray-500">{config.instruction}</p>
              
              <div className="flex gap-2">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="flex-1 bg-red-500 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                    Start Recording
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="flex-1 bg-gray-600 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    <Square size={14} />
                    Stop ({recordingTime}s)
                  </button>
                )}
                
                <button
                  onClick={stopCamera}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <video src={previewUrl} controls className="w-full rounded-xl bg-black aspect-video" />
          
          {isProcessing ? (
            <div className="text-center py-4">
              <Loader2 className="animate-spin mx-auto mb-2 text-[#1a5c2a]" />
              <p className="text-sm">Analyzing video for measurements...</p>
            </div>
          ) : analysisResult ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <CheckCircle size={20} className="mx-auto mb-1 text-green-600" />
              <p className="text-sm font-bold text-green-700">
                Measured: {analysisResult.duration.toFixed(2)} seconds
              </p>
              {analysisResult.confidence > 0 && (
                <p className="text-xs text-green-600">Confidence: {Math.round(analysisResult.confidence * 100)}%</p>
              )}
            </div>
          ) : null}
          
          <div className="flex gap-2">
            <button onClick={retake} className="flex-1 border border-gray-300 py-2 rounded-xl text-sm">
              Record Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
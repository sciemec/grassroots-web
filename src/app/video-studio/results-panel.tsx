"use client";

import {
  CheckCircle2, AlertTriangle, Dumbbell, Download, Share2, Copy, Scissors, ChevronRight,
} from "lucide-react";
import { SPORTS, type SportKey } from "@/config/sports";
import { VoiceCommentary } from "@/components/video/voice-commentary";

export interface AnalysisResult {
  strengths: string[];
  improvements: string[];
  drills: string[];
  encouragement: string;
  raw?: string;
}

interface ResultsPanelProps {
  result: AnalysisResult;
  sport: SportKey | "";
  analysisType: string;
  onReset: () => void;
  onDownloadHighlight: () => void;
}

function ResultSection({
  icon, title, items, color,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  color: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className={`rounded-xl border p-5 ${color}`}>
      <div className="mb-3 flex items-center gap-2">{icon}<h3 className="font-semibold">{title}</h3></div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 opacity-60" />{item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Displays the 3-section AI analysis result with action buttons. */
export function ResultsPanel({
  result, sport, onReset, onDownloadHighlight,
}: ResultsPanelProps) {
  const selectedSport = SPORTS.find((s) => s.key === sport);

  const copyFeedback = async () => {
    if (!result.raw) return;
    await navigator.clipboard.writeText(result.raw);
  };

  const downloadReport = () => {
    const lines = ["GrassRoots Sports — AI Analysis", "", result.raw ?? ""].join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analysis-${sport}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">{selectedSport?.emoji} AI Analysis — {selectedSport?.label}</h2>
        <div className="flex gap-2">
          <button
            onClick={copyFeedback}
            className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Copy className="h-4 w-4" /> Copy
          </button>
          <button
            onClick={onDownloadHighlight}
            className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Scissors className="h-4 w-4" /> 30s clip
          </button>
          <button
            onClick={() => navigator.share?.({ title: "GrassRoots AI Analysis", text: result.raw ?? "", url: window.location.href })}
            className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Share2 className="h-4 w-4" /> Share
          </button>
          <button
            onClick={downloadReport}
            className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Download className="h-4 w-4" /> Download
          </button>
        </div>
      </div>

      <ResultSection
        icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
        title="Strengths"
        items={result.strengths}
        color="border-green-500/30 bg-green-500/5"
      />
      <ResultSection
        icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
        title="Areas to Improve"
        items={result.improvements}
        color="border-amber-500/30 bg-amber-500/5"
      />
      <ResultSection
        icon={<Dumbbell className="h-5 w-5 text-blue-600" />}
        title="Drill Recommendations"
        items={result.drills}
        color="border-blue-500/30 bg-blue-500/5"
      />

      {result.encouragement && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 text-center text-sm font-medium text-primary">
          {result.encouragement}
        </div>
      )}

      <VoiceCommentary
        commentary={result.encouragement + " " + result.strengths.join(". ")}
        style="enthusiastic"
      />

      <button
        onClick={onReset}
        className="flex w-full items-center justify-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold hover:bg-muted transition-colors"
      >
        Analyse another video
      </button>
    </div>
  );
}

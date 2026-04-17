"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")   // bold
    .replace(/\*(.*?)\*/g, "$1")        // italic
    .replace(/_(.*?)_/g, "$1")          // underline/italic
    .replace(/#{1,6}\s+/gm, "")         // headings
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links → label only
    .replace(/`{1,3}[^`]*`{1,3}/g, "")  // code
    .replace(/^[-*•]\s+/gm, "")         // bullet points
    .replace(/\n{2,}/g, ". ")           // paragraph breaks → sentence break
    .replace(/\n/g, " ")                // remaining newlines
    .trim();
}

function firstTwoSentences(text: string): string {
  const matches = text.match(/[^.!?]+[.!?]+/g) ?? [];
  if (matches.length >= 2) return matches.slice(0, 2).join(" ").trim();
  if (matches.length === 1) return matches[0].trim();
  // No sentence breaks — truncate to 200 chars
  return text.slice(0, 200);
}

// ── Voice selection ───────────────────────────────────────────────────────────

function getPreferredVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === "en-GB") ??
    voices.find((v) => v.lang.startsWith("en")) ??
    null
  );
}

// ── Main hook ─────────────────────────────────────────────────────────────────

export function useThutoVoice(onSpeakEnd?: () => void) {
  const [voiceMode,  setVoiceMode]  = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const onSpeakEndRef = useRef(onSpeakEnd);
  onSpeakEndRef.current = onSpeakEnd;

  // ── Restore voice mode from localStorage on mount ───────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("thuto_voice_mode") === "true") {
      setVoiceMode(true);
    }
  }, []);

  // ── Toggle voice mode ────────────────────────────────────────────────────
  const toggleVoiceMode = useCallback(() => {
    setVoiceMode((prev) => {
      const next = !prev;
      try { localStorage.setItem("thuto_voice_mode", String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // ── Cancel any ongoing speech ────────────────────────────────────────────
  const cancelSpeech = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // ── Speak THUTO response — strip markdown, first 2 sentences, en-GB ─────
  const speakThutoResponse = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    // Cancel any current speech before starting
    window.speechSynthesis.cancel();

    const clean = firstTwoSentences(stripMarkdown(text));
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate  = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend   = () => {
      setIsSpeaking(false);
      onSpeakEndRef.current?.();
    };
    utterance.onerror = () => setIsSpeaking(false);

    const applyVoice = () => {
      const voice = getPreferredVoice();
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      applyVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        applyVoice();
      };
      // Fallback if onvoiceschanged never fires
      setTimeout(() => {
        if (!utterance.voice) window.speechSynthesis.speak(utterance);
      }, 500);
    }
  }, []);

  return { voiceMode, toggleVoiceMode, isSpeaking, speakThutoResponse, cancelSpeech };
}

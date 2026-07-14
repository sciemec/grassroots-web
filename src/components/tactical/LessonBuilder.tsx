// src/components/tactical/LessonBuilder.tsx
"use client";

import { useState } from "react";
import * as Icons from "lucide-react";
import { TacticalLesson, TacticalMovement } from "@/types/tactical";

interface LessonBuilderProps {
  lesson?: Partial<TacticalLesson>;
  onSave: (lesson: TacticalLesson) => void;
  onCancel?: () => void;
}

type Phase = "attacking" | "defending" | "transition" | "set_piece";
type Difficulty = "beginner" | "intermediate" | "advanced";

const PHASES: { id: Phase; label: string; icon: React.ElementType }[] = [
  { id: "attacking", label: "Attacking", icon: Icons.Flame },
  { id: "defending", label: "Defending", icon: Icons.Shield },
  { id: "transition", label: "Transition", icon: Icons.RefreshCw },
  { id: "set_piece", label: "Set Piece", icon: Icons.Target },
];

const DIFFICULTIES: { id: Difficulty; label: string; color: string }[] = [
  { id: "beginner", label: "Beginner", color: "bg-green-100 text-green-700 border-green-200" },
  { id: "intermediate", label: "Intermediate", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { id: "advanced", label: "Advanced", color: "bg-red-100 text-red-700 border-red-200" },
];

const FORMATIONS = ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "5-3-2", "4-5-1", "3-4-3"];

export default function LessonBuilder({ lesson, onSave, onCancel }: LessonBuilderProps) {
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [description, setDescription] = useState(lesson?.description ?? "");
  const [phase, setPhase] = useState<Phase>(lesson?.phase ?? "attacking");
  const [difficulty, setDifficulty] = useState<Difficulty>(lesson?.difficulty ?? "beginner");
  const [formation, setFormation] = useState(lesson?.formation ?? "4-3-3");
  const [duration, setDuration] = useState(lesson?.duration ?? 30);
  const [notes, setNotes] = useState(lesson?.notes ?? "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(lesson?.tags ?? []);
  const [shared, setShared] = useState(lesson?.shared ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required";
    if (!description.trim()) e.description = "Description is required";
    if (duration < 5 || duration > 300) e.duration = "Duration must be 5–300 seconds";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const now = new Date().toISOString();
    const built: TacticalLesson = {
      id: lesson?.id ?? `lesson_${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      coachId: lesson?.coachId ?? "",
      coachName: lesson?.coachName ?? "",
      formation,
      phase,
      duration,
      movements: (lesson?.movements ?? []) as TacticalMovement[],
      notes: notes.trim(),
      tags,
      difficulty,
      createdAt: lesson?.createdAt ?? now,
      updatedAt: now,
      shared,
    };

    onSave(built);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#1a5c2a]/10 rounded-xl flex items-center justify-center">
            <Icons.BookOpen size={18} className="text-[#1a5c2a]" />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900">
              {lesson?.id ? "Edit Lesson" : "New Lesson"}
            </h2>
            <p className="text-xs text-gray-500">Build a tactical lesson for your players</p>
          </div>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Icons.X size={18} />
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            Lesson Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. High Press Trigger from 4-3-3"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30 ${
              errors.title ? "border-red-300 bg-red-50" : "border-gray-200"
            }`}
          />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What tactical concept does this lesson teach?"
            rows={3}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30 resize-none ${
              errors.description ? "border-red-300 bg-red-50" : "border-gray-200"
            }`}
          />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
        </div>

        {/* Phase */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Phase</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PHASES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPhase(p.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-bold transition-colors ${
                  phase === p.id
                    ? "bg-[#1a5c2a] text-white border-[#1a5c2a]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                <p.icon size={14} />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty + Formation row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty</label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-colors ${
                    difficulty === d.id ? d.color + " border-current" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Formation</label>
            <select
              value={formation}
              onChange={(e) => setFormation(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30 bg-white"
            >
              {FORMATIONS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            Duration (seconds)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              min={5}
              max={300}
              className={`w-32 px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30 ${
                errors.duration ? "border-red-300 bg-red-50" : "border-gray-200"
              }`}
            />
            <span className="text-sm text-gray-500">
              ≈ {Math.floor(duration / 60)}m {duration % 60}s simulation
            </span>
          </div>
          {errors.duration && <p className="mt-1 text-xs text-red-500">{errors.duration}</p>}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Tags</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              placeholder="Add a tag and press Enter"
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
            />
            <button
              onClick={addTag}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
            >
              Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1a5c2a]/10 text-[#1a5c2a] rounded-lg text-xs font-bold"
                >
                  #{tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                    <Icons.X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">Coaching Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes for players or reminders for yourself..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30 resize-none"
          />
        </div>

        {/* Share toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Icons.Globe size={16} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Share with coaches</p>
              <p className="text-xs text-gray-500">Make this lesson visible to other coaches on the platform</p>
            </div>
          </div>
          <button
            onClick={() => setShared(!shared)}
            className={`w-11 h-6 rounded-full transition-colors relative ${shared ? "bg-[#1a5c2a]" : "bg-gray-300"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                shared ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-[#1a5c2a] text-white rounded-xl text-sm font-bold hover:bg-[#1a5c2a]/90 transition-colors flex items-center gap-2"
        >
          <Icons.Save size={16} />
          Save Lesson
        </button>
      </div>
    </div>
  );
}

// src/components/tactical/AssignmentManager.tsx
"use client";

import { useState } from "react";
import * as Icons from "lucide-react";
import { TacticalLesson, LessonAssignment } from "@/types/tactical";

interface Player {
  id: string;
  name: string;
  position: string;
}

interface AssignmentManagerProps {
  lesson: TacticalLesson;
  players: Player[];
  assignments: LessonAssignment[];
  onAssign: (assignment: LessonAssignment) => void;
  onRemove: (assignmentId: string) => void;
  onFeedback: (assignmentId: string, feedback: string) => void;
}

const STATUS_CONFIG: Record<
  LessonAssignment["status"],
  { label: string; color: string; icon: React.ElementType }
> = {
  pending:      { label: "Pending",      color: "bg-gray-100 text-gray-600",    icon: Icons.Clock },
  viewed:       { label: "Viewed",       color: "bg-blue-100 text-blue-700",    icon: Icons.Eye },
  learning:     { label: "Learning",     color: "bg-amber-100 text-amber-700",  icon: Icons.BookOpen },
  completed:    { label: "Completed",    color: "bg-green-100 text-green-700",  icon: Icons.CheckCircle },
  needs_review: { label: "Needs Review", color: "bg-red-100 text-red-700",      icon: Icons.AlertCircle },
};

export default function AssignmentManager({
  lesson,
  players,
  assignments,
  onAssign,
  onRemove,
  onFeedback,
}: AssignmentManagerProps) {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [feedbackTarget, setFeedbackTarget] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<LessonAssignment["status"] | "all">("all");

  const assignedPlayerIds = new Set(assignments.map((a) => a.playerId));

  const availablePlayers = players.filter(
    (p) =>
      !assignedPlayerIds.has(p.id) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  const togglePlayer = (id: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAssign = () => {
    if (selectedPlayerIds.length === 0) return;
    const now = new Date().toISOString();
    selectedPlayerIds.forEach((playerId) => {
      const player = players.find((p) => p.id === playerId);
      if (!player) return;
      const assignment: LessonAssignment = {
        id: `assign_${Date.now()}_${playerId}`,
        lessonId: lesson.id,
        playerId,
        playerName: player.name,
        assignedAt: now,
        dueDate: dueDate || undefined,
        status: "pending",
        progress: 0,
        attempts: 0,
      };
      onAssign(assignment);
    });
    setSelectedPlayerIds([]);
    setDueDate("");
  };

  const handleFeedbackSave = (assignmentId: string) => {
    if (feedbackText.trim()) {
      onFeedback(assignmentId, feedbackText.trim());
    }
    setFeedbackTarget(null);
    setFeedbackText("");
  };

  const filteredAssignments =
    filterStatus === "all"
      ? assignments
      : assignments.filter((a) => a.status === filterStatus);

  const stats = {
    total: assignments.length,
    completed: assignments.filter((a) => a.status === "completed").length,
    inProgress: assignments.filter((a) => a.status === "learning").length,
    needsReview: assignments.filter((a) => a.status === "needs_review").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Assigned",    value: stats.total,       color: "text-gray-900" },
          { label: "Completed",   value: stats.completed,   color: "text-green-700" },
          { label: "In Progress", value: stats.inProgress,  color: "text-amber-700" },
          { label: "Need Review", value: stats.needsReview, color: "text-red-700" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Assign new players */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center gap-2">
          <Icons.UserPlus size={16} className="text-[#1a5c2a]" />
          <h3 className="text-sm font-black text-gray-900">Assign Players</h3>
        </div>

        <div className="p-5 space-y-4">
          {/* Search */}
          <div className="relative">
            <Icons.Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search players..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
            />
          </div>

          {/* Player list */}
          {availablePlayers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              {players.length === 0
                ? "No players in squad"
                : assignedPlayerIds.size === players.length
                ? "All players already assigned"
                : "No players match your search"}
            </p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {availablePlayers.map((player) => {
                const selected = selectedPlayerIds.includes(player.id);
                return (
                  <button
                    key={player.id}
                    onClick={() => togglePlayer(player.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                      selected
                        ? "border-[#1a5c2a] bg-[#1a5c2a]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        selected
                          ? "bg-[#1a5c2a] border-[#1a5c2a]"
                          : "border-gray-300"
                      }`}
                    >
                      {selected && <Icons.Check size={11} className="text-white" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{player.name}</p>
                      <p className="text-xs text-gray-500">{player.position}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Due date + assign button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-600 mb-1">Due date (optional)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAssign}
                disabled={selectedPlayerIds.length === 0}
                className="w-full sm:w-auto px-5 py-2 bg-[#1a5c2a] text-white rounded-xl text-sm font-bold hover:bg-[#1a5c2a]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Icons.Send size={14} />
                Assign {selectedPlayerIds.length > 0 ? `(${selectedPlayerIds.length})` : ""}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Existing assignments */}
      {assignments.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icons.Users size={16} className="text-[#1a5c2a]" />
              <h3 className="text-sm font-black text-gray-900">Assigned Players</h3>
            </div>

            {/* Status filter */}
            <div className="flex gap-1 flex-wrap justify-end">
              {(["all", "pending", "learning", "completed", "needs_review"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                    filterStatus === s
                      ? "bg-[#1a5c2a] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {s === "all" ? "All" : STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredAssignments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No assignments match this filter</p>
            ) : (
              filteredAssignments.map((assignment) => {
                const cfg = STATUS_CONFIG[assignment.status];
                const StatusIcon = cfg.icon;
                const isFeedbackOpen = feedbackTarget === assignment.id;

                return (
                  <div key={assignment.id} className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-[#1a5c2a]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-black text-[#1a5c2a]">
                          {assignment.playerName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-gray-900">{assignment.playerName}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${cfg.color}`}>
                            <StatusIcon size={10} />
                            {cfg.label}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div
                              className="bg-[#1a5c2a] h-1.5 rounded-full transition-all"
                              style={{ width: `${assignment.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 flex-shrink-0">{assignment.progress}%</span>
                        </div>

                        {/* Meta */}
                        <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Icons.Calendar size={10} />
                            Assigned {new Date(assignment.assignedAt).toLocaleDateString()}
                          </span>
                          {assignment.dueDate && (
                            <span className="flex items-center gap-1">
                              <Icons.AlarmClock size={10} />
                              Due {new Date(assignment.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Icons.RefreshCw size={10} />
                            {assignment.attempts} attempt{assignment.attempts !== 1 ? "s" : ""}
                          </span>
                          {assignment.comprehensionScore !== undefined && (
                            <span className="flex items-center gap-1">
                              <Icons.Star size={10} />
                              Score: {assignment.comprehensionScore}%
                            </span>
                          )}
                        </div>

                        {/* Feedback section */}
                        {isFeedbackOpen ? (
                          <div className="mt-3 space-y-2">
                            <textarea
                              value={feedbackText}
                              onChange={(e) => setFeedbackText(e.target.value)}
                              placeholder="Write coaching feedback for this player..."
                              rows={3}
                              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30 resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleFeedbackSave(assignment.id)}
                                className="px-3 py-1.5 bg-[#1a5c2a] text-white rounded-lg text-xs font-bold hover:bg-[#1a5c2a]/90 transition-colors"
                              >
                                Save Feedback
                              </button>
                              <button
                                onClick={() => { setFeedbackTarget(null); setFeedbackText(""); }}
                                className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-xs font-bold transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : assignment.feedback ? (
                          <div className="mt-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-xs text-blue-800 font-bold mb-0.5">Coach Feedback</p>
                            <p className="text-xs text-blue-700">{assignment.feedback}</p>
                          </div>
                        ) : null}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => {
                            setFeedbackTarget(isFeedbackOpen ? null : assignment.id);
                            setFeedbackText(assignment.feedback ?? "");
                          }}
                          title="Add feedback"
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Icons.MessageSquare size={14} />
                        </button>
                        <button
                          onClick={() => onRemove(assignment.id)}
                          title="Remove assignment"
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Icons.Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

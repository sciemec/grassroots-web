// src/components/tactical/PlayerLessonViewer.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import * as Icons from "lucide-react";
import { TacticalLesson, LessonAssignment, TacticalMovement } from "@/types/tactical";

interface PlayerLessonViewerProps {
  lesson: TacticalLesson;
  assignment: LessonAssignment;
  onProgress: (assignmentId: string, progress: number) => void;
  onComplete: (assignmentId: string, score: number) => void;
}

type ViewerPhase = "overview" | "watching" | "quiz" | "completed";

interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correct: number;
}

const PHASE_COLORS: Record<TacticalLesson["phase"], string> = {
  attacking:  "bg-orange-100 text-orange-700",
  defending:  "bg-blue-100 text-blue-700",
  transition: "bg-purple-100 text-purple-700",
  set_piece:  "bg-green-100 text-green-700",
};

const DIFFICULTY_COLORS: Record<TacticalLesson["difficulty"], string> = {
  beginner:     "bg-green-100 text-green-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced:     "bg-red-100 text-red-700",
};

function generateQuiz(lesson: TacticalLesson): QuizQuestion[] {
  return [
    {
      id: "q1",
      text: `What phase of play does "${lesson.title}" focus on?`,
      options: ["Attacking", "Defending", "Transition", "Set Piece"],
      correct: ["attacking", "defending", "transition", "set_piece"].indexOf(lesson.phase),
    },
    {
      id: "q2",
      text: "How many player movements are shown in this lesson?",
      options: [
        `${Math.max(0, lesson.movements.length - 1)}`,
        `${lesson.movements.length}`,
        `${lesson.movements.length + 1}`,
        `${lesson.movements.length + 2}`,
      ],
      correct: 1,
    },
    {
      id: "q3",
      text: "What formation is used in this tactical lesson?",
      options: ["4-3-3", "4-4-2", lesson.formation, "3-5-2"].filter(
        (v, i, arr) => arr.indexOf(v) === i
      ).slice(0, 4),
      correct: ["4-3-3", "4-4-2", lesson.formation, "3-5-2"]
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .slice(0, 4)
        .indexOf(lesson.formation),
    },
  ];
}

const MOVEMENT_TYPE_COLORS: Record<TacticalMovement["type"], string> = {
  run:    "#f0b429",
  pass:   "#22c55e",
  dribble:"#3b82f6",
  cross:  "#a855f7",
  shot:   "#ef4444",
  press:  "#f97316",
  cover:  "#14b8a6",
};

function PitchDiagram({ movements, phase }: { movements: TacticalMovement[]; phase: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement?.clientWidth || 400;
    const h = w * 0.65;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    // Pitch background
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#2d6a2d");
    grad.addColorStop(0.5, "#3a7a3a");
    grad.addColorStop(1, "#2d6a2d");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const pad = w * 0.05;
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1.5;

    // Border
    ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
    // Centre line
    ctx.beginPath();
    ctx.moveTo(w / 2, pad);
    ctx.lineTo(w / 2, h - pad);
    ctx.stroke();
    // Centre circle
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.07, 0, 2 * Math.PI);
    ctx.stroke();
    // Penalty areas
    const paw = w * 0.22;
    const pah = h * 0.42;
    ctx.strokeRect(pad, (h - pah) / 2, paw, pah);
    ctx.strokeRect(w - pad - paw, (h - pah) / 2, paw, pah);

    // Draw movements
    movements.forEach((m) => {
      if (!m.path || m.path.length < 2) return;
      const color = MOVEMENT_TYPE_COLORS[m.type] ?? "#ffffff";

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      m.path.forEach((pt, i) => {
        const x = (pt.x / 100) * w;
        const y = (pt.y / 100) * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrow at end
      if (m.arrow && m.path.length >= 2) {
        const last = m.path[m.path.length - 1];
        const prev = m.path[m.path.length - 2];
        const x2 = (last.x / 100) * w;
        const y2 = (last.y / 100) * h;
        const x1 = (prev.x / 100) * w;
        const y1 = (prev.y / 100) * h;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const len = 8;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - len * Math.cos(angle - 0.5), y2 - len * Math.sin(angle - 0.5));
        ctx.lineTo(x2 - len * Math.cos(angle + 0.5), y2 - len * Math.sin(angle + 0.5));
        ctx.closePath();
        ctx.fill();
      }

      // Start dot
      const sx = (m.startX / 100) * w;
      const sy = (m.startY / 100) * h;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }, [movements]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  return (
    <div className="w-full rounded-xl overflow-hidden shadow-md">
      <canvas ref={canvasRef} className="w-full block" />
    </div>
  );
}

export default function PlayerLessonViewer({
  lesson,
  assignment,
  onProgress,
  onComplete,
}: PlayerLessonViewerProps) {
  const [phase, setPhase] = useState<ViewerPhase>(
    assignment.status === "completed" ? "completed" : "overview"
  );
  const [currentMovement, setCurrentMovement] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [expandedMovement, setExpandedMovement] = useState<string | null>(null);

  const quiz = generateQuiz(lesson);

  const startWatching = () => {
    setPhase("watching");
    onProgress(assignment.id, 25);
  };

  const finishWatching = () => {
    setPhase("quiz");
    onProgress(assignment.id, 75);
  };

  const handleAnswer = (questionId: string, answerIdx: number) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [questionId]: answerIdx }));
  };

  const submitQuiz = () => {
    const correct = quiz.filter((q) => quizAnswers[q.id] === q.correct).length;
    const score = Math.round((correct / quiz.length) * 100);
    setQuizSubmitted(true);
    onProgress(assignment.id, 100);
    onComplete(assignment.id, score);
    setPhase("completed");
  };

  const quizComplete = Object.keys(quizAnswers).length === quiz.length;

  const correctCount = quizSubmitted
    ? quiz.filter((q) => quizAnswers[q.id] === q.correct).length
    : 0;
  const finalScore = quizSubmitted ? Math.round((correctCount / quiz.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-gray-600">Your Progress</p>
          <p className="text-xs font-bold text-[#1a5c2a]">{assignment.progress}%</p>
        </div>
        <div className="h-2 bg-gray-100 rounded-full">
          <div
            className="h-2 bg-[#1a5c2a] rounded-full transition-all duration-500"
            style={{ width: `${assignment.progress}%` }}
          />
        </div>
        <div className="mt-3 flex gap-2">
          {(["overview", "watching", "quiz", "completed"] as ViewerPhase[]).map((p, i) => (
            <div key={p} className="flex items-center gap-1">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black ${
                  phase === p
                    ? "bg-[#1a5c2a] text-white"
                    : assignment.progress >= [0, 25, 75, 100][i]
                    ? "bg-[#1a5c2a]/20 text-[#1a5c2a]"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-xs font-bold capitalize ${phase === p ? "text-[#1a5c2a]" : "text-gray-400"}`}>
                {p}
              </span>
              {i < 3 && <Icons.ChevronRight size={12} className="text-gray-300 ml-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* Phase: Overview */}
      {phase === "overview" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${PHASE_COLORS[lesson.phase]}`}>
                {lesson.phase.replace("_", " ")}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${DIFFICULTY_COLORS[lesson.difficulty]}`}>
                {lesson.difficulty}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                {lesson.formation}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 flex items-center gap-1">
                <Icons.Clock size={10} />
                {Math.floor(lesson.duration / 60)}m {lesson.duration % 60}s
              </span>
            </div>
            <h2 className="text-lg font-black text-gray-900">{lesson.title}</h2>
            <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
          </div>

          <div className="p-5 space-y-4">
            <PitchDiagram movements={lesson.movements} phase={lesson.phase} />

            {lesson.movements.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  {lesson.movements.length} Movements
                </p>
                <div className="space-y-1.5">
                  {lesson.movements.slice(0, 4).map((m) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: MOVEMENT_TYPE_COLORS[m.type] ?? "#ccc" }}
                      />
                      <span className="text-xs text-gray-600 capitalize">{m.type}</span>
                      {m.description && (
                        <span className="text-xs text-gray-400 truncate">— {m.description}</span>
                      )}
                    </div>
                  ))}
                  {lesson.movements.length > 4 && (
                    <p className="text-xs text-gray-400">+{lesson.movements.length - 4} more</p>
                  )}
                </div>
              </div>
            )}

            {lesson.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {lesson.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-[#1a5c2a]/10 text-[#1a5c2a] rounded-lg text-xs font-bold">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={startWatching}
              className="w-full py-3 bg-[#1a5c2a] text-white rounded-xl font-bold hover:bg-[#1a5c2a]/90 transition-colors flex items-center justify-center gap-2"
            >
              <Icons.Play size={16} />
              Start Studying
            </button>
          </div>
        </div>
      )}

      {/* Phase: Watching / studying movements */}
      {phase === "watching" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-gray-900">{lesson.title}</h3>
              <p className="text-xs text-gray-500">Study each movement carefully</p>
            </div>
            <span className="text-xs text-gray-400">
              {currentMovement + 1} / {Math.max(lesson.movements.length, 1)}
            </span>
          </div>

          <div className="p-5 space-y-4">
            <PitchDiagram movements={lesson.movements} phase={lesson.phase} />

            {lesson.movements.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No specific movements recorded for this lesson.</p>
            ) : (
              <div className="space-y-2">
                {lesson.movements.map((m, idx) => {
                  const isExpanded = expandedMovement === m.id;
                  const isCurrent = idx === currentMovement;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        setCurrentMovement(idx);
                        setExpandedMovement(isExpanded ? null : m.id);
                      }}
                      className={`w-full text-left rounded-xl border p-3 transition-colors ${
                        isCurrent
                          ? "border-[#1a5c2a] bg-[#1a5c2a]/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: MOVEMENT_TYPE_COLORS[m.type] ?? "#ccc" }}
                        />
                        <span className="text-sm font-bold text-gray-900 capitalize">{m.type}</span>
                        {m.label && (
                          <span className="text-xs text-gray-500">— {m.label}</span>
                        )}
                        <Icons.ChevronDown
                          size={14}
                          className={`ml-auto text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                      {isExpanded && m.description && (
                        <p className="mt-2 text-xs text-gray-600 leading-relaxed">{m.description}</p>
                      )}
                      {isExpanded && (
                        <div className="mt-2 flex gap-3 text-xs text-gray-400">
                          <span>Starts at {m.timing.startTime}s</span>
                          <span>Duration {m.timing.duration}s</span>
                          {m.timing.delay > 0 && <span>Delay {m.timing.delay}s</span>}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {lesson.notes && (
              <div className="px-4 py-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs font-bold text-amber-800 mb-1">Coaching Notes</p>
                <p className="text-xs text-amber-700 leading-relaxed">{lesson.notes}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setPhase("overview")}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={finishWatching}
                className="flex-1 py-2.5 bg-[#1a5c2a] text-white rounded-xl text-sm font-bold hover:bg-[#1a5c2a]/90 transition-colors flex items-center justify-center gap-2"
              >
                <Icons.CheckSquare size={15} />
                Ready for Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase: Quiz */}
      {phase === "quiz" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-sm font-black text-gray-900">Comprehension Check</h3>
            <p className="text-xs text-gray-500">Answer all questions to complete the lesson</p>
          </div>

          <div className="p-5 space-y-5">
            {quiz.map((q, qi) => (
              <div key={q.id}>
                <p className="text-sm font-bold text-gray-900 mb-2.5">
                  {qi + 1}. {q.text}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const selected = quizAnswers[q.id] === oi;
                    const isCorrect = oi === q.correct;
                    let cls = "border-gray-200 hover:border-gray-300 bg-white";
                    if (quizSubmitted) {
                      if (isCorrect) cls = "border-green-400 bg-green-50";
                      else if (selected && !isCorrect) cls = "border-red-400 bg-red-50";
                    } else if (selected) {
                      cls = "border-[#1a5c2a] bg-[#1a5c2a]/5";
                    }
                    return (
                      <button
                        key={oi}
                        onClick={() => handleAnswer(q.id, oi)}
                        disabled={quizSubmitted}
                        className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-colors disabled:cursor-default ${cls}`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                              quizSubmitted && isCorrect
                                ? "border-green-500 bg-green-500"
                                : selected && !quizSubmitted
                                ? "border-[#1a5c2a] bg-[#1a5c2a]"
                                : quizSubmitted && selected && !isCorrect
                                ? "border-red-500 bg-red-500"
                                : "border-gray-300"
                            }`}
                          >
                            {(quizSubmitted && isCorrect) || (selected && !quizSubmitted) ? (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            ) : null}
                          </div>
                          <span className={quizSubmitted && isCorrect ? "font-bold text-green-700" : "text-gray-700"}>
                            {opt}
                          </span>
                          {quizSubmitted && isCorrect && (
                            <Icons.CheckCircle size={14} className="ml-auto text-green-600" />
                          )}
                          {quizSubmitted && selected && !isCorrect && (
                            <Icons.XCircle size={14} className="ml-auto text-red-500" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {!quizSubmitted && (
              <button
                onClick={submitQuiz}
                disabled={!quizComplete}
                className="w-full py-3 bg-[#1a5c2a] text-white rounded-xl font-bold hover:bg-[#1a5c2a]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Submit Answers
              </button>
            )}
          </div>
        </div>
      )}

      {/* Phase: Completed */}
      {phase === "completed" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icons.Trophy size={28} className="text-green-600" />
            </div>
            <h3 className="text-xl font-black text-gray-900">Lesson Complete!</h3>
            <p className="text-gray-500 text-sm mt-1">{lesson.title}</p>

            {assignment.comprehensionScore !== undefined && (
              <div className="mt-6 inline-flex items-center gap-3 px-6 py-3 bg-[#1a5c2a]/10 rounded-2xl">
                <div className="text-center">
                  <p className="text-3xl font-black text-[#1a5c2a]">{assignment.comprehensionScore}%</p>
                  <p className="text-xs text-gray-500 mt-0.5">Comprehension Score</p>
                </div>
                <div className="w-px h-12 bg-[#1a5c2a]/20" />
                <div className="text-center">
                  <p className="text-3xl font-black text-[#1a5c2a]">{assignment.attempts}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Attempt{assignment.attempts !== 1 ? "s" : ""}</p>
                </div>
              </div>
            )}

            {assignment.comprehensionScore !== undefined && (
              <div className="mt-4">
                {assignment.comprehensionScore >= 80 ? (
                  <div className="px-4 py-3 bg-green-50 rounded-xl border border-green-100 text-sm text-green-700 font-bold">
                    Excellent! You have a strong understanding of this tactic.
                  </div>
                ) : assignment.comprehensionScore >= 60 ? (
                  <div className="px-4 py-3 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-700 font-bold">
                    Good effort! Review the movements again to reinforce your understanding.
                  </div>
                ) : (
                  <div className="px-4 py-3 bg-red-50 rounded-xl border border-red-100 text-sm text-red-700 font-bold">
                    Keep practising. Your coach may mark this for review.
                  </div>
                )}
              </div>
            )}

            {assignment.feedback && (
              <div className="mt-4 px-4 py-3 bg-blue-50 rounded-xl border border-blue-100 text-left">
                <p className="text-xs font-black text-blue-800 mb-1">Coach Feedback</p>
                <p className="text-sm text-blue-700">{assignment.feedback}</p>
              </div>
            )}

            <button
              onClick={() => setPhase("overview")}
              className="mt-6 px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Review Lesson Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// src/lib/tactical-engine.ts

import {
  TacticalMovement,
  TacticalLesson,
  TacticalSimulation,
  LessonAssignment,
  PlayerProgress,
} from "@/types/tactical";

type EventCallback = (data: unknown) => void;

export class TacticalEngine {
  private simulation: TacticalSimulation;
  private animationFrame: number | null = null;
  // Track play/pause state separately — TacticalSimulation.playback only carries progress + timestamp
  private isPlaying = false;
  private isPaused = false;
  private callbacks: Record<string, EventCallback> = {};

  constructor(lesson: TacticalLesson) {
    this.simulation = {
      id: `sim_${lesson.id}`,
      lessonId: lesson.id,
      state: "idle",
      currentTime: 0,
      speed: 1,
      movements: lesson.movements,
      completedMovements: [],
      activeMovements: [],
      playback: {
        progress: 0,
        timestamp: 0,
      },
    };
  }

  // ─── Playback Controls ─────────────────────────────────────────────

  play() {
    // Allow resume from pause; only block if already actively playing
    if (this.isPlaying && !this.isPaused) return;

    this.isPlaying = true;
    this.isPaused = false;
    this.simulation.state = "playing";

    this.triggerEvent("onPlay");
    this.startAnimation();
  }

  pause() {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    this.isPaused = true;
    this.simulation.state = "paused";

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.triggerEvent("onPause");
  }

  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.simulation.state = "idle";
    this.simulation.currentTime = 0;
    this.simulation.completedMovements = [];
    this.simulation.activeMovements = [];
    this.simulation.playback.progress = 0;

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.triggerEvent("onStop");
  }

  setSpeed(speed: TacticalSimulation["speed"]) {
    this.simulation.speed = speed;
    this.triggerEvent("onSpeedChange", { speed: this.simulation.speed });
  }

  seekTo(time: number) {
    const total = this.getTotalDuration();
    this.simulation.currentTime = Math.max(0, Math.min(total, time));
    this.updateMovementsAtTime(this.simulation.currentTime);
    this.simulation.playback.progress =
      total > 0 ? (this.simulation.currentTime / total) * 100 : 0;
    this.triggerEvent("onSeek", { time: this.simulation.currentTime });
  }

  // ─── Animation Loop ─────────────────────────────────────────────────

  private startAnimation() {
    let lastTime = 0;
    const step = (timestamp: number) => {
      if (!this.isPlaying || this.isPaused) return;

      const delta = lastTime ? (timestamp - lastTime) / 1000 : 0;
      lastTime = timestamp;

      this.simulation.currentTime += delta * this.simulation.speed;
      const total = this.getTotalDuration();
      this.simulation.playback.progress =
        total > 0 ? (this.simulation.currentTime / total) * 100 : 0;

      this.updateMovementsAtTime(this.simulation.currentTime);

      if (this.simulation.currentTime >= total) {
        this.simulation.currentTime = total;
        this.simulation.playback.progress = 100;
        this.simulation.state = "complete";
        this.isPlaying = false;
        this.triggerEvent("onComplete");
        return;
      }

      this.triggerEvent("onUpdate", {
        time: this.simulation.currentTime,
        progress: this.simulation.playback.progress,
        activeMovements: this.simulation.activeMovements,
        completedMovements: this.simulation.completedMovements,
      });

      this.animationFrame = requestAnimationFrame(step);
    };

    this.animationFrame = requestAnimationFrame(step);
  }

  private updateMovementsAtTime(time: number) {
    const completed: string[] = [];
    const active: string[] = [];

    this.simulation.movements.forEach(movement => {
      const startTime = movement.timing.startTime;
      const endTime = movement.timing.startTime + movement.timing.duration;

      if (time >= endTime) {
        completed.push(movement.id);
      } else if (time >= startTime) {
        active.push(movement.id);
      }
    });

    this.simulation.completedMovements = completed;
    this.simulation.activeMovements = active;
  }

  private getTotalDuration(): number {
    if (this.simulation.movements.length === 0) return 0;
    return Math.max(
      ...this.simulation.movements.map(m => m.timing.startTime + m.timing.duration)
    );
  }

  // ─── Event System ───────────────────────────────────────────────────

  on(event: string, callback: EventCallback) {
    this.callbacks[event] = callback;
  }

  off(event: string) {
    delete this.callbacks[event];
  }

  private triggerEvent(event: string, data?: unknown) {
    this.callbacks[event]?.(data);
  }

  getState(): TacticalSimulation {
    return this.simulation;
  }

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
}

// ─── Lesson Builder ────────────────────────────────────────────────────

export class LessonBuilder {
  private lesson: Partial<TacticalLesson> = {
    movements: [],
    tags: [],
    createdAt: new Date().toISOString(),
  };

  setTitle(title: string): LessonBuilder {
    this.lesson.title = title;
    return this;
  }

  setDescription(description: string): LessonBuilder {
    this.lesson.description = description;
    return this;
  }

  setFormation(formation: string): LessonBuilder {
    this.lesson.formation = formation;
    return this;
  }

  setPhase(phase: TacticalLesson["phase"]): LessonBuilder {
    this.lesson.phase = phase;
    return this;
  }

  setDifficulty(difficulty: TacticalLesson["difficulty"]): LessonBuilder {
    this.lesson.difficulty = difficulty;
    return this;
  }

  addMovement(movement: TacticalMovement): LessonBuilder {
    if (!this.lesson.movements) this.lesson.movements = [];
    this.lesson.movements.push(movement);
    return this;
  }

  setNotes(notes: string): LessonBuilder {
    this.lesson.notes = notes;
    return this;
  }

  setTags(tags: string[]): LessonBuilder {
    this.lesson.tags = tags;
    return this;
  }

  build(): TacticalLesson {
    if (!this.lesson.title) throw new Error("Lesson must have a title");
    if (!this.lesson.movements || this.lesson.movements.length === 0) {
      throw new Error("Lesson must have at least one movement");
    }

    const now = new Date().toISOString();
    const duration = this.lesson.movements.reduce((max, m) => {
      const end = m.timing.startTime + m.timing.duration;
      return Math.max(max, end);
    }, 0);

    return {
      id: `lesson_${Date.now()}`,
      coachId: "",
      coachName: "",
      duration,
      shared: false,
      updatedAt: now,
      ...this.lesson,
    } as TacticalLesson;
  }
}

// ─── Player Progress Tracker ──────────────────────────────────────────

export class ProgressTracker {
  private assignments: LessonAssignment[];

  constructor(assignments: LessonAssignment[]) {
    this.assignments = assignments;
  }

  getProgress(playerId: string): PlayerProgress {
    const playerAssignments = this.assignments.filter(a => a.playerId === playerId);

    return {
      playerId,
      totalLessons: playerAssignments.length,
      completedLessons: playerAssignments.filter(a => a.status === "completed").length,
      inProgress: playerAssignments.filter(a => a.status === "learning").length,
      averageScore: this.calculateAverageScore(playerAssignments),
      strengths: this.identifyStrengths(playerAssignments),
      weaknesses: this.identifyWeaknesses(playerAssignments),
      recentLessons: [...playerAssignments]
        .sort((a, b) => {
          const aTime = a.lastViewed ? new Date(a.lastViewed).getTime() : 0;
          const bTime = b.lastViewed ? new Date(b.lastViewed).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 5),
    };
  }

  private calculateAverageScore(assignments: LessonAssignment[]): number {
    const scored = assignments.filter(a => a.comprehensionScore !== undefined);
    if (scored.length === 0) return 0;
    return scored.reduce((sum, a) => sum + (a.comprehensionScore ?? 0), 0) / scored.length;
  }

  private identifyStrengths(assignments: LessonAssignment[]): string[] {
    const completed = assignments.filter(a => a.status === "completed");
    if (completed.length === 0) return [];
    return ["Attacking awareness", "Positioning", "Decision making"];
  }

  private identifyWeaknesses(assignments: LessonAssignment[]): string[] {
    const needsReview = assignments.filter(a => a.status === "needs_review");
    if (needsReview.length === 0) return [];
    return ["Defensive transitions", "Set piece positioning"];
  }
}
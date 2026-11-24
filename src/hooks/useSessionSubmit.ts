'use client';
// hooks/useSessionSubmit.ts
// ─────────────────────────────────────────────────────────────────────────────
// The central hook that connects everything after a test session completes.
//
// Call this ONCE after submitSession() returns a GRSResult.
// It calls all three APIs in the right order:
//   1. POST /api/sessions  → saves the test result to PostgreSQL
//   2. POST /api/gamification/session → updates rank, streak, XP
//   3. POST /api/drills/unlock → unlocks the next drill
//   4. (optional) POST /api/vault/upload → queues video upload
//
// Returns a summary of everything that changed so the results screen
// can show: rank up banner, new drill unlock, streak milestone, etc.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';
import type { GRSResult } from '@/lib/grs-engine';
import { useAuthStore } from '@/lib/auth-store';

export interface SubmitResult {
  saved:          boolean;
  // Gamification changes
  rank:           string;
  previousRank:   string;
  rankedUp:       boolean;
  streak:         number;
  xpEarned:       number;
  xpTotal:        number;
  newBadges:      string[];
  streakMessage:  string | null;
  // Drill unlock
  newDrill:       { id: string; name: string; duration: string; reason: string } | null;
  drillTier:      number;
  // Errors
  errors:         string[];
}

export interface SubmitOptions {
  playerId:      string;
  result:        GRSResult;
  previousAQ?:  number;
  sessionVideoUrl?: string;  // if a video was recorded during the session
}

export function useSessionSubmit() {
  const [loading,  setLoading]  = useState(false);
  const [complete, setComplete] = useState<SubmitResult | null>(null);

  const submit = useCallback(async (options: SubmitOptions): Promise<SubmitResult> => {
    const { playerId, result, previousAQ, sessionVideoUrl } = options;
    setLoading(true);

    const errors: string[] = [];
    let gamificationData: any = null;
    let drillData: any = null;

    // Read auth token once — passed to all three proxy routes so Laravel can authenticate
    const token = useAuthStore.getState().token;
    const authHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token && token !== 'dev-token' ? { Authorization: `Bearer ${useAuthStore.getState().token ?? ""}` } : {}),
    };

    try {
      // ── Step 1 (removed): session save now handled directly by callers
      //    via api.post('/sessions/grs-test', ...) before calling submit().

      // ── Step 2: Update gamification ──────────────────────────────────────
      const gamRes = await fetch('/api/gamification', {
        method:  'POST',
        headers: authHeaders,
        body: JSON.stringify({
          action:         'session',
          playerId,
          aqScore:        result.aq,
          dq:             result.dq,
          testsCompleted: result.testsCompleted,
          coachVerified:  result.coachVerified,
          sessionDate:    result.sessionDate,
          previousAQ,
        }),
      });

      if (gamRes.ok) {
        gamificationData = await gamRes.json();
      } else {
        errors.push('Failed to update gamification');
      }

      // ── Step 3: Unlock next drill ────────────────────────────────────────
      const drillRes = await fetch('/api/drills', {
        method:  'POST',
        headers: authHeaders,
        body: JSON.stringify({
          action:       'unlock',
          playerId,
          sessionCount: gamificationData?.totalSessions ?? 1,
          aqScore:      result.aq,
          dq:           result.dq,
          position:     result.position,
        }),
      });

      if (drillRes.ok) {
        drillData = await drillRes.json();
      } else {
        errors.push('Failed to process drill unlock');
      }

      // ── Step 4: Queue video upload (if a session video exists) ───────────
      // Videos upload in the background — we do not await this
      if (sessionVideoUrl) {
        fetch('/api/vault', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action:    'upload',
            playerId,
            fileName:  `session_${result.sessionDate}.mp4`,
            fileType:  'video/mp4',
            source:    'test_session',
            label:     `Test session ${result.sessionDate}`,
          }),
        }).catch(console.error); // background — do not block results screen
      }

    } catch (err) {
      errors.push('Network error — results saved locally');
      console.error('useSessionSubmit error:', err);
    }

    const submitResult: SubmitResult = {
      saved:         errors.length === 0,
      rank:          gamificationData?.rank          ?? result.rank,
      previousRank:  gamificationData?.previousRank  ?? result.rank,
      rankedUp:      gamificationData?.rankedUp       ?? false,
      streak:        gamificationData?.streak         ?? 0,
      xpEarned:      gamificationData?.xpEarned       ?? 0,
      xpTotal:       gamificationData?.xpTotal        ?? 0,
      newBadges:     gamificationData?.newBadges       ?? [],
      streakMessage: gamificationData?.streakMessage   ?? null,
      newDrill:      drillData?.newUnlock               ?? null,
      drillTier:     drillData?.tierUnlocked            ?? 1,
      errors,
    };

    setComplete(submitResult);
    setLoading(false);
    return submitResult;

  }, []);

  return { submit, loading, complete };
}
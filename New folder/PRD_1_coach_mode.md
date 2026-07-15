# PRD: Coach Mode — Multi-Player Drill Sessions

**Project:** Grassroots Sports
**Feature:** Coach Mode (Multi-Player Session Capture)
**Owner:** Nigel (Architect)
**Implementation:** Claude Code
**Status:** Draft v1.0
**Build order:** First of three priority builds (Coach Mode → WhatsApp Notifications → My Worth Reports)
**Target stack:** Next.js PWA, Laravel backend, PostgreSQL, existing drill library, existing player profiles

---

## Governance Note

This PRD follows the CLAUDE.md governance pattern. Claude Code must explain every file change before executing it. Nigel is the architect and approves all decisions. No file is created, modified, or deleted without explicit confirmation. No new dependencies are added without justification.

---

## 1. Purpose

Coach Mode is a session-running interface for coaches that captures **which players were present**, **which drills were run**, and **who participated in each drill**. This generates the multi-player co-occurrence data that unlocks the Chemistry Rating feature's most valuable signals, while giving coaches a fast, low-friction way to log training sessions.

The build is intentionally small. It does not require new ML, new sensor integrations, or new video analysis. It composes existing assets — the drill library, player profiles, session schemas — into a coach-facing tool that takes 5 minutes per session to use.

---

## 2. Strategic Context

This is the highest-leverage small build available right now because:

- **It unlocks Chemistry Rating's biggest data input** (shared training history) without requiring video analysis
- **It generates data on every session, not just video sessions**, meaning data accumulates rapidly
- **It deepens coach engagement** by making the platform useful during sessions, not just before and after
- **It lays groundwork for partnership tracking, attendance reporting, and load management** — all of which compound off this single data stream

Without this build, the Chemistry Rating's "shared training history" dimension stays empty for most player pairs because video uploads are sporadic. With this build, the dimension fills naturally with every logged session.

---

## 3. What This Build Is Not

To keep scope tight:

- **Not a session planner.** Coaches build their own session plans elsewhere (paper, WhatsApp, memory). This tool captures what happened, not what is planned.
- **Not a real-time tracking tool.** No live position tracking, no live heart rate, no live anything. This is post-action logging.
- **Not for players.** Players do not interact with Coach Mode directly. They see the results in their session history.
- **Not video-based.** Video remains a separate feature for individual drill capture. Coach Mode is structured logging, not video analysis.

---

## 4. Success Metrics

Phase 1 is successful if, within 60 days of launch:

- 50% or more of active coaches use Coach Mode at least once per week
- Average session logging time is under 6 minutes per session
- 80% or more of player pairs in actively-coached squads have at least one shared session logged
- Chemistry Rating's "shared training history" dimension has data for 70% or more of comparable player pairs
- Coach satisfaction (measured via in-app prompt after 3 sessions) is 4/5 or higher

---

## 5. User Stories

**As a coach, I want to log a training session in under 6 minutes so that I can capture useful data without it eating into my coaching time.**

**As a coach, I want to mark which players were present so that attendance is tracked automatically.**

**As a coach, I want to record which drills I ran and which players participated in each so that the platform can build a richer picture of player development.**

**As a player, I want to see my session attendance history so that I can track my own commitment.**

**As a parent, I want to see my child's training attendance so that I know they are showing up consistently.**

**As a scout, I want to see a player's training consistency so that I can factor reliability into my evaluation.**

---

## 6. Functional Requirements

### 6.1 Coach Session Flow

A coach logs a session through this flow:

1. **Start session** — coach taps "New Session" from Coach Mode home. Date and start time auto-fill, editable.
2. **Set context** — coach sets session type (Training / Friendly Match / Trial / Other), duration, and location (free text or saved location).
3. **Mark attendance** — coach sees their squad list with toggle buttons. Tap each present player. Bulk options: "All present," "Same as last session," "Clear all."
4. **Log drills** — coach taps "Add Drill," selects from the existing 215-drill library (with search), and confirms which present players participated. Default is "all present players," but coach can deselect specific players for that drill.
5. **Repeat drills** — coach adds as many drills as the session contained.
6. **Optional notes** — free-text notes field for coach observations (these feed into player profiles for context-aware reports later).
7. **End session** — coach taps "Finish Session." Data syncs, summary screen appears.

### 6.2 Drill Selection UX

The drill library has 215 drills. Coaches need fast selection.

- **Search bar** at top of drill picker, searches drill name and tags
- **Recent drills** section showing the last 10 drills this coach used (one-tap re-add)
- **Favourites** — coach can star drills, starred drills appear at top of picker
- **Filters** — by category (Technical / Tactical / Physical / Mental), age group, duration

### 6.3 Participant Selection per Drill

When adding a drill to a session:

- Default: all currently marked-present players are participants
- Coach can deselect any subset (e.g., "GK drill — only goalkeepers participated")
- Coach can add a duration override per drill (default is shared session duration ÷ number of drills)
- Coach can mark a drill as "key drill" — flagged for emphasis in player reports

### 6.4 Session Save and Edit

- Sessions are saved on "Finish Session" tap
- Coaches can edit a session for up to 48 hours after finishing (correct attendance errors, add forgotten drills, fix typos)
- After 48 hours, sessions are locked. Editing requires admin override (audit logged).
- Coaches can delete a session within 24 hours of creation. After 24 hours, deletion requires admin override.

### 6.5 Session History View

A coach can view their session history at `/coach/sessions`:

- List of sessions, most recent first
- Each session shows date, duration, attendance count, drill count
- Tap any session to see full detail
- Filters: by date range, by player (sessions involving this player), by drill (sessions including this drill)
- Export to PDF (using existing jsPDF setup)

### 6.6 Player-Facing Session History

Players see their own session history at `/player/sessions`:

- List of sessions they attended
- Each entry shows date, drills they participated in, coach who ran the session
- Players cannot see other players' attendance unless they are a verified coach

### 6.7 Coach Dashboard Additions

Two new metrics on the coach dashboard:

- **Session count this month** with trend indicator
- **Squad attendance rate this month** with per-player breakdown

---

## 7. Non-Functional Requirements

### 7.1 Performance

- Session logging flow must work fully on a slow 3G connection
- All data captured to IndexedDB locally during the flow, synced on finish
- Session save time (from "Finish Session" tap to confirmed sync) must be under 5 seconds on a stable connection
- Drill library search must return results in under 500ms

### 7.2 Offline-First

- Coach Mode must work fully offline
- Sessions captured offline queue for sync when connection returns
- Coach sees clear sync status indicator: "Synced" / "Pending sync" / "Sync failed — will retry"
- Drill library is cached locally on first load and refreshed in background

### 7.3 Privacy and Safeguarding

- Only verified coaches can run sessions
- A coach can only log sessions for players assigned to their squad or with explicit coach-player linkage
- Coaches cannot view session details for sessions they did not run, except where players are also in their squad
- Under-18 player attendance data is visible only to: the player, their parent/guardian, the session coach, club admins, and verified scouts with appropriate permissions
- All access to under-18 attendance data is logged in `session_data_access_log`

### 7.4 Bilingual Support

- All coach-facing UI in English and Shona (toggle in user settings)
- Drill names already exist in the drill library — verify Shona translations exist for all 215 drills, flag any missing for translation

---

## 8. Database Schema

### 8.1 New Tables

```
coach_sessions
- id (uuid, primary key)
- coach_id (uuid, foreign key to users)
- session_type (enum: 'training', 'friendly_match', 'trial', 'other')
- session_date (date)
- start_time (time)
- duration_minutes (integer)
- location_text (string, nullable)
- location_id (uuid, nullable, foreign key to saved_locations)
- coach_notes (text, nullable)
- status (enum: 'draft', 'finalised', 'locked')
- created_at, updated_at, finalised_at, locked_at
```

```
coach_session_attendance
- id (uuid, primary key)
- session_id (uuid, foreign key to coach_sessions)
- player_id (uuid, foreign key to players)
- present (boolean)
- arrived_late (boolean, default false) — optional flag, future use
- left_early (boolean, default false) — optional flag, future use
- created_at, updated_at
- UNIQUE (session_id, player_id)
```

```
coach_session_drills
- id (uuid, primary key)
- session_id (uuid, foreign key to coach_sessions)
- drill_id (uuid, foreign key to drills)
- sequence (integer) — order within session
- duration_minutes (integer)
- is_key_drill (boolean, default false)
- coach_notes (text, nullable)
- created_at, updated_at
```

```
coach_session_drill_participants
- id (uuid, primary key)
- session_drill_id (uuid, foreign key to coach_session_drills)
- player_id (uuid, foreign key to players)
- created_at
- UNIQUE (session_drill_id, player_id)
```

```
session_data_access_log
- id (uuid)
- session_id (uuid)
- accessed_by_user_id (uuid)
- access_role (enum: 'self', 'parent', 'coach', 'scout', 'admin')
- accessed_at (timestamp)
- access_context (string)
```

### 8.2 New Columns

On `coaches` table (or wherever coach metadata lives):
- `favourite_drill_ids` (jsonb array)
- `recent_drill_ids` (jsonb array, max 10, FIFO)

### 8.3 Saved Locations (Optional Mini-Feature)

```
saved_locations
- id (uuid)
- user_id (uuid)
- name (string) — e.g., "Highfield Stadium," "Mbare Pitch 2"
- latitude (numeric, nullable)
- longitude (numeric, nullable)
- created_at
```

A coach can save frequently-used locations and select from a dropdown rather than retyping.

---

## 9. Backend Endpoints

Laravel routes:

- `POST /api/coach/sessions` — create new session (status: draft)
- `PATCH /api/coach/sessions/{id}` — update session draft
- `POST /api/coach/sessions/{id}/finalise` — mark session as finalised, trigger downstream data updates
- `DELETE /api/coach/sessions/{id}` — delete session (24-hour window only without admin override)
- `GET /api/coach/sessions` — list coach's own sessions, paginated
- `GET /api/coach/sessions/{id}` — fetch single session with full detail
- `GET /api/coach/drills/recent` — fetch coach's recent drills
- `POST /api/coach/drills/{id}/favourite` — toggle favourite
- `GET /api/players/{id}/sessions` — player's session history (with role-based filtering)
- `GET /api/coach/dashboard/metrics` — session count, attendance rate

All endpoints require authentication and role-based access checks.

### 9.1 Downstream Triggers on Finalisation

When a session is finalised, fire these events asynchronously (Laravel queued jobs):

1. **Update player drill completion counts** — each participating player gets +1 on their drill completion count for that drill
2. **Update player session attendance counts** — for attendance trend metrics
3. **Trigger Chemistry Rating recalculation** — for any player pair that now has new shared training data (only if Chemistry Rating Phase 1 is shipped)
4. **Trigger Companion Mode prompts** — if any player has not done a recent Sprint Test or Distance Run, surface a suggestion (only if Companion Mode Phase 1 is shipped)

These dependencies are isolated — Coach Mode ships independently, and downstream triggers activate when those features come online.

---

## 10. Frontend Implementation

### 10.1 New Routes (Next.js PWA)

- `/coach/session/new` — start new session
- `/coach/session/[id]/edit` — edit session in progress or recently finalised
- `/coach/session/[id]` — view finalised session
- `/coach/sessions` — coach's session history
- `/player/sessions` — player's session history
- `/coach/locations` — manage saved locations

### 10.2 Critical UX Patterns

**Big tap targets.** Coaches will use this on a phone, often outdoors, often in a hurry. Buttons must be at least 48px tall, with generous spacing.

**Bulk actions everywhere.** "All present" is the most common starting state, not "all absent." Default to it.

**Persistent draft state.** If a coach starts a session, gets interrupted, and comes back hours later, the draft must still be there. Auto-save every change to IndexedDB.

**No required fields beyond essentials.** Date, attendance, and at least one drill are required. Everything else is optional. Coaches abandon flows with too many required fields.

**Visible save state.** A small status indicator at the top of the screen shows "Saving…" / "Saved" / "Sync pending." This builds trust.

### 10.3 Mobile-First Layout

The session capture flow is optimised for vertical phone use:
- Single-column layout
- Sticky bottom action bar (Add Drill, Finish Session)
- Drill picker opens as a full-screen modal, not a dropdown
- Player attendance grid uses 2-column layout on mobile, 4-column on tablet/desktop

---

## 11. Build Phases

**Week 1: Backend & Schema**
- All database migrations
- Core Laravel services: `CoachSessionService`, `SessionAttendanceService`, `SessionDrillService`
- All API endpoints
- Permission policies
- Async job classes for downstream triggers (with feature flags so they no-op until Chemistry Rating ships)

**Week 2: Frontend Capture Flow**
- Coach Mode home and "New Session" flow
- Attendance grid component
- Drill picker with search, recent, favourites, filters
- Per-drill participant selection
- IndexedDB draft persistence
- Sync queue and status indicators

**Week 2 (continued): Polish**
- Session history view (coach)
- Session detail view
- Session edit and delete (with 48hr/24hr windows)
- PDF export
- Player session history
- Coach dashboard metric additions

This is a 2-week build, not 5. The scope is intentionally tight.

---

## 12. Risks and Mitigations

**Risk: Coaches find the logging flow tedious and stop using it.**
Mitigation: 6-minute target session logging time. Bulk actions. Recent drills. Auto-defaults. Watch session abandonment rate closely post-launch.

**Risk: Coaches log inaccurate attendance to game leaderboards or reports.**
Mitigation: Coach verification tier visible. Players can flag inaccurate attendance through "I wasn't there" report button. Audit logged.

**Risk: Data loss on draft sessions.**
Mitigation: Auto-save to IndexedDB on every change. Resume drafts on reopen.

**Risk: Under-18 attendance data exposed inappropriately.**
Mitigation: Role-based access checks on every endpoint. Audit logging. Scout access gated on verification.

**Risk: Sessions logged retroactively for fraud or gaming purposes.**
Mitigation: Sessions can only be created with date within last 7 days. Older dates require admin approval. Audit logged.

**Risk: Drill library lacks Shona translations for some drills.**
Mitigation: Audit drill library translations as part of Week 1 work. Flag missing translations to Nigel for quick fill-in. Fall back to English if Shona missing rather than blocking the feature.

---

## 13. Open Questions for Architect Approval

1. **Maximum drills per session** — should there be a cap? (Suggested: 15)
2. **Session date backdating** — is 7 days the right window, or longer for coaches who log weekly?
3. **Player self-flagging of attendance errors** — ship in Phase 1 or defer to Phase 2?
4. **Saved locations feature** — include in Phase 1 or defer?
5. **Attendance bulk action "Same as last session"** — based on last session or last session of same type?
6. **Should session deletion notify affected players?** — privacy vs transparency tradeoff.

---

## 14. Files Expected to Be Created or Modified

This list will be confirmed before any implementation begins.

**Laravel backend:**
- 5 new migrations
- New `CoachSessionService.php`
- New `SessionAttendanceService.php`
- New `SessionDrillService.php`
- New API controllers and routes
- New policy classes for session access
- New queued job classes for downstream triggers

**Next.js frontend:**
- New pages under `/coach/session` and `/coach/sessions`
- New page at `/player/sessions`
- New components: `AttendanceGrid`, `DrillPicker`, `DrillParticipantSelector`, `SessionDraftIndicator`, `SessionHistoryList`
- New hooks for session draft management
- API client extensions

**Documentation:**
- Update CLAUDE.md with Coach Mode governance notes
- Coach onboarding update
- Help docs in English and Shona

---

## 15. Approval

This PRD requires Nigel's explicit approval before any code is written. Claude Code will not begin implementation until:

1. Open questions in section 13 are resolved
2. The expected file list in section 14 is reviewed and approved
3. The build phases in section 11 are confirmed

---

**End of PRD v1.0**

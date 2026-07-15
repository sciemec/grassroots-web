# PRD: Chemistry Rating — Phase 1 (Style Fingerprinting)

**Project:** Grassroots Sports
**Feature:** Chemistry Rating — Phase 1
**Owner:** Nigel (Architect)
**Implementation:** Claude Code
**Status:** Draft v1.0
**Target stack:** Next.js (web), Flutter (mobile), Laravel (backend), PostgreSQL, ML Kit (existing pose detection), DeepSeekService (existing AI layer), Cloudflare R2 (video storage)

---

## Governance Note

This PRD follows the CLAUDE.md governance pattern. Claude Code must explain every file change before executing it. Nigel is the architect and approves all decisions. No file is created, modified, or deleted without explicit confirmation. No new dependencies are added without justification.

---

## 1. Purpose

Phase 1 of the Chemistry Rating feature establishes the foundational layer: **style fingerprinting**. Every player who completes drills on the platform will have a numerical "style fingerprint" generated from their existing biomechanics data. This fingerprint enables similarity comparisons between any two players in the system.

This phase ships a usable Chemistry Rating v1 with notifications for similar players, without requiring multi-player video analysis or new data collection from users.

---

## 2. Why This Is Phase 1

Phase 1 is intentionally constrained to what is achievable using **data the platform already collects**. No new ML models, no new video processing pipelines, no new user-facing data collection forms. The goal is to ship a working chemistry rating in 4-6 weeks of focused build time, validate that users find it valuable, and use that engagement to justify Phase 2 investment.

**What Phase 1 explicitly does not include:**
- Multi-player video co-occurrence analysis (Phase 2)
- Match video analysis (Phase 3)
- Off-pitch relationship data collection (handled in a separate registration update)
- Notification preferences UI beyond a simple on/off toggle
- Scout-facing chemistry views (Phase 1 ships player and coach views only)

---

## 3. Success Metrics

Phase 1 is successful if, within 60 days of launch:

- 70% or more of active players have a generated style fingerprint
- 30% or more of players engage with at least one "similar player" notification
- 20% or more of coaches view a chemistry rating between two of their players at least once
- Zero safeguarding incidents related to under-18 player data exposure
- Average fingerprint generation time per video remains under 15 seconds
- DeepSeekService API costs for chemistry explanations remain under USD 50/month at current scale

---

## 4. User Stories

**As a player, I want to see other players with similar styles to mine so that I can find training partners and feel part of a community.**

**As a coach, I want to compare two of my players' styles so that I can decide who to pair in formations and joint drills.**

**As a coach, I want to see which of my players are most stylistically compatible so that I can build effective partnerships.**

**As a parent (of an under-18 player), I want to control whether my child's style data is used in similarity matching so that I am in control of how their information is used.**

---

## 5. Functional Requirements

### 5.1 Style Fingerprint Generation

A style fingerprint is a fixed-length numerical vector (proposed: 32 dimensions) representing a player's movement and execution characteristics.

The fingerprint is generated from existing ML Kit biomechanics outputs that the platform already captures during drill analysis. The 32 dimensions are grouped into six categories:

**Movement profile (8 dimensions):**
- Average acceleration magnitude
- Peak acceleration
- Acceleration consistency (standard deviation)
- Deceleration profile
- Lateral movement frequency
- Vertical movement frequency
- Average movement intensity
- Movement variability score

**Balance and body control (5 dimensions):**
- Centre of mass stability score
- Recovery speed after off-balance moments
- Posture consistency under load
- Single-leg stability ratio
- Body lean profile during sprints

**Technical signature (8 dimensions):**
- Preferred-foot dominance ratio
- Passing motion consistency
- Shooting motion consistency
- Dribbling rhythm regularity
- First-touch quality score
- Strike technique variance
- Body shape during ball-receipt
- Two-footed proficiency index

**Decision and reaction (5 dimensions):**
- Average reaction time in stimulus-response drills
- Reaction time consistency
- Decision speed under pressure
- Recovery time between actions
- Anticipation score (where measurable from drill setup)

**Spatial preference (4 dimensions):**
- Wide-channel preference ratio
- Central-zone preference ratio
- Vertical-progression tendency
- Lateral-circulation tendency

**Endurance and load (2 dimensions):**
- Performance decay across session
- Recovery profile between drills

A fingerprint is only generated once a player has completed a minimum of **8 drills** across at least **3 separate sessions**. Below this threshold, the fingerprint is considered too noisy to use.

### 5.2 Fingerprint Storage

Fingerprints are stored in a new PostgreSQL table:

```
style_fingerprints
- id (uuid, primary key)
- player_id (uuid, foreign key to players)
- fingerprint_vector (jsonb — array of 32 floats)
- confidence_score (float — based on data volume and quality)
- drills_used_count (integer)
- sessions_used_count (integer)
- generated_at (timestamp)
- expires_at (timestamp — fingerprints regenerate after 30 days or on new data)
- version (integer — for future model upgrades)
```

A separate `style_fingerprint_history` table retains previous versions for trend analysis (player development over time).

### 5.3 Similarity Calculation

Similarity between two players is calculated using **cosine similarity** between their fingerprint vectors. Output is normalised to a 0-100 score.

For Phase 1, similarity is precalculated nightly for all eligible player pairs and cached in:

```
style_similarities
- id (uuid, primary key)
- player_a_id (uuid)
- player_b_id (uuid)
- similarity_score (float, 0-100)
- top_matching_dimensions (jsonb — array of dimension names that contributed most)
- top_diverging_dimensions (jsonb — array of dimension names that differ most)
- calculated_at (timestamp)
```

To avoid combinatorial explosion at scale, similarity is only calculated within these scopes:
- Same position group (forwards, midfielders, defenders, goalkeepers)
- Age within +/- 4 years
- Same country (Zimbabwe at launch)

This keeps the comparison space manageable and the results meaningful.

### 5.4 Chemistry Rating v1 Score

For Phase 1, the Chemistry Rating between two players is calculated as a weighted combination:

- **Style similarity (60%)** — from cosine similarity of fingerprints
- **Demographic alignment (25%)** — age proximity, position compatibility, language match (from registration data)
- **Geographic proximity (15%)** — based on registered town and province

This is the "v1 formula." Phases 2 and beyond will introduce shared training history, off-pitch connections, and other dimensions. The formula version is stored alongside each calculated score so old scores can be identified and recalculated when the formula updates.

**Important framing:** The Chemistry Rating in Phase 1 is more accurately a "stylistic compatibility rating." Be careful in UI copy not to overstate what the score represents. Suggested copy: "Style Compatibility: 82" with a note "Full Chemistry Rating coming soon as we add training history and partnership data."

### 5.5 Similar Player Notifications

When a player's fingerprint is newly generated or updated, the system checks for new high-similarity matches (score 80+) and triggers notifications:

**Player-facing notification:**
> "A player with a similar style to you just registered nearby. [Player name], a [position] from [town], matches your style at 87%. View profile."

Notifications are rate-limited to a maximum of **2 per week per player** to prevent fatigue. Players can disable similar-player notifications in their settings.

**For under-18 players:** Notifications about under-18 players are only sent to other under-18 players from the same registered region, and only with parental consent flags enabled on both sides. Notifications about under-18 players to over-18 users are not sent at all in Phase 1. Notifications to scouts about under-18 players are deferred to Phase 2 with proper safeguarding gates.

### 5.6 Coach-Facing Chemistry View

Coaches with verified accounts and a registered squad can:

1. View a chemistry matrix showing all pairwise scores between their squad members
2. Click any pair to see the breakdown — top matching dimensions, top diverging dimensions, and a DeepSeekService-generated explanation in English or Shona
3. Filter the matrix by position pairing (e.g., "show me only midfielder-forward pairs")
4. Export the matrix as a PDF report (using existing jsPDF setup)

The breakdown explanation is generated by DeepSeekService using a structured prompt that takes in the two players' top matching and diverging dimensions and produces a 2-3 sentence natural language summary.

### 5.7 Player-Facing "Find Similar Players"

Players can access a "Players Like You" view showing their top 10 most similar players, with:
- Similarity score
- Position
- Region
- Age
- Brief style summary (generated by DeepSeekService)
- Option to send a connect request (deferred to Phase 1.5 if scope is tight)

For under-18 players, this view only shows other under-18 players from the same region with valid parental consent.

---

## 6. Non-Functional Requirements

### 6.1 Performance

- Fingerprint generation must complete within 15 seconds of drill completion
- Similarity calculation runs as a nightly batch job, must complete within 2 hours at projected scale (10,000 active players)
- Chemistry view in coach dashboard must load within 2 seconds for squads up to 30 players
- Mobile data usage for chemistry views must stay under 500KB per session view

### 6.2 Privacy and Safeguarding

- Under-18 players require explicit parental consent flag (`safeguarding_consent_chemistry`) on their profile before fingerprinting begins
- Fingerprints for under-18 players are flagged in the database and excluded from all queries that return data to over-18 users
- All access to under-18 chemistry data is logged in an audit table
- Players can request deletion of their fingerprint at any time; deletion cascades to all similarity records

### 6.3 Cost Control

- DeepSeekService calls for chemistry explanations are cached for 7 days per player pair
- Similarity calculations skip player pairs whose data has not changed since last calculation
- Fingerprints expire after 30 days of inactivity to avoid stale comparisons

### 6.4 Offline-First (Mobile)

- The Flutter app must cache the player's own fingerprint and their top 10 similar players locally
- Coach chemistry matrix is cached for offline viewing for 24 hours
- Notifications queue and deliver when connection is restored

### 6.5 Internationalisation

- All user-facing copy in English and Shona
- DeepSeekService chemistry explanations generated in user's preferred language
- Future-proofed for Ndebele addition in Phase 2

---

## 7. Database Migrations

Three new tables to be added via Laravel migrations:

1. `style_fingerprints` — current fingerprint per player
2. `style_fingerprint_history` — historical fingerprints for trend analysis
3. `style_similarities` — cached pairwise similarity scores

Two new columns on existing `players` table:

1. `safeguarding_consent_chemistry` (boolean, default false) — required for under-18s
2. `chemistry_notifications_enabled` (boolean, default true)

One new audit table:

1. `chemistry_data_access_log` — every read of under-18 chemistry data

---

## 8. New Backend Endpoints

Laravel routes to be created:

- `POST /api/chemistry/fingerprint/regenerate/{playerId}` — admin/system trigger
- `GET /api/chemistry/fingerprint/{playerId}` — fetch a player's fingerprint
- `GET /api/chemistry/similar/{playerId}` — fetch top similar players
- `GET /api/chemistry/pair/{playerAId}/{playerBId}` — fetch chemistry score and breakdown for a specific pair
- `GET /api/chemistry/squad/{coachId}` — fetch full chemistry matrix for a coach's squad
- `POST /api/chemistry/consent/{playerId}` — update safeguarding consent flag
- `DELETE /api/chemistry/fingerprint/{playerId}` — delete a player's fingerprint and related data

All endpoints require authentication and role-based access checks.

---

## 9. New Frontend Routes / Screens

**Web (Next.js — grassrootssports.live):**
- `/coach/chemistry` — coach chemistry matrix view
- `/coach/chemistry/pair/[playerA]/[playerB]` — pair detail view
- `/players/similar` — "Players Like You" view for logged-in players

**Mobile (Flutter):**
- `ChemistryMatrixScreen` — coach matrix
- `PairDetailScreen` — pair breakdown
- `SimilarPlayersScreen` — player-facing similar players

---

## 10. DeepSeekService Prompt Structure

The DeepSeekService prompt for chemistry explanations follows this structure:

```
System: You are a football style analyst for Grassroots Sports.
Generate a clear 2-3 sentence explanation of why these two players have
a [score]% style compatibility. Use plain English suitable for a Zimbabwean
coach. Do not use jargon. If language is set to Shona, respond in Shona.

Input:
- Player A: [name, age, position, key style markers]
- Player B: [name, age, position, key style markers]
- Top matching dimensions: [list]
- Top diverging dimensions: [list]
- Compatibility score: [score]

Output: 2-3 sentence explanation, no preamble, no markdown.
```

Output is cached for 7 days per pair to control API costs.

---

## 11. Build Phases

**Week 1-2: Foundations**
- Database migrations
- Fingerprint generation algorithm (pure backend, no UI)
- Unit tests for fingerprint stability and similarity calculation
- Background job for nightly similarity recalculation

**Week 3-4: Coach View**
- Coach chemistry matrix UI (web)
- Pair detail view with DeepSeekService integration
- PDF export

**Week 5: Player View**
- "Players Like You" screen (web and Flutter)
- Notification system for new high-similarity matches
- Settings toggles for notifications and consent

**Week 6: Polish and Safeguarding Audit**
- Full safeguarding review
- Performance testing at projected scale
- Bilingual copy review
- Bug fixes and launch prep

---

## 12. Risks and Mitigations

**Risk: Fingerprints are noisy for players with limited drill data.**
Mitigation: 8-drill, 3-session minimum threshold. Confidence score visible to coaches and scouts.

**Risk: Similarity calculations explode at scale.**
Mitigation: Scoped comparison (position, age, country). Nightly batch processing. Skip unchanged pairs.

**Risk: Under-18 data exposure.**
Mitigation: Explicit parental consent flag, audit logging, restricted notification recipients, no scout access in Phase 1.

**Risk: DeepSeekService costs balloon.**
Mitigation: 7-day caching of pair explanations. Maximum API call budget alerts at USD 25 and USD 50 monthly.

**Risk: Users expect richer chemistry than v1 delivers.**
Mitigation: UI copy frames this as "Style Compatibility v1" with clear messaging that fuller chemistry is coming. Manage expectations explicitly.

**Risk: Similarity notifications feel intrusive or surveillance-like.**
Mitigation: Conservative rate limiting (2/week max), opt-out in settings, framing focuses on community and opportunity, not analysis.

---

## 13. Open Questions for Architect Approval

1. Is 32 dimensions the right vector size, or do we want to start smaller (16) and expand later?
2. Should coaches see chemistry for players outside their own squad in Phase 1, or is that gated to Phase 2?
3. Do we want a "request connection" feature in Phase 1, or push that to Phase 1.5?
4. What is the exact threshold for triggering a similar-player notification — 80%? 85%?
5. Should the Chemistry Rating be visible to the player whose data created it, or only to coaches/scouts?
6. Are we committing to bilingual (English/Shona) at launch, or English-only with Shona as a fast follow?

---

## 14. Files Expected to Be Created or Modified

This list will be confirmed before any implementation begins. Expected scope:

**Laravel backend:**
- New migrations (3 tables + columns)
- New `StyleFingerprintService.php`
- New `ChemistryService.php`
- Updated `DeepSeekService.php` with chemistry prompt method
- New API controllers and routes
- Background job classes for nightly recalculation

**Next.js frontend:**
- New pages under `/coach/chemistry` and `/players/similar`
- New components for matrix view, pair detail, similar players list
- API client extensions

**Flutter mobile:**
- New screens for chemistry matrix, pair detail, similar players
- New service classes for chemistry API
- Local caching layer

**Documentation:**
- Update CLAUDE.md with chemistry feature governance notes
- Update API documentation
- Update onboarding documentation for new safeguarding consent flag

---

## 15. Approval

This PRD requires Nigel's explicit approval before any code is written. Claude Code will not begin implementation until:

1. Open questions in section 13 are resolved
2. The expected file list in section 14 is reviewed and approved
3. The build phases in section 11 are confirmed as the agreed sequence

Once approved, each build phase begins with Claude Code listing all files it intends to create or modify, with rationale, and waiting for Nigel's approval before proceeding.

---

**End of PRD v1.0**

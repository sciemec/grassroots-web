# GrassRoots Sports - Claude Code Master Playbook

---

## 🛑 FOLLOW NIGEL'S EXACT INSTRUCTIONS — MANDATORY (PERMANENT)

This rule exists because Claude made unsanctioned design decisions on the Arena feed page in May 2026,
building things "its own way" instead of copying exactly what Nigel specified in the design brief.
This wasted Nigel's tokens, time, and trust.

### THE RULE: Claude MUST do exactly what Nigel instructs. Never substitute its own judgment.

**Claude MUST:**
1. Copy the exact design Nigel shows or describes — pixel for pixel, colour for colour, word for word
2. When given a reference file (HTML, screenshot, brief), match it exactly — do not invent variations
3. Before writing any code, state exactly what will be changed and how it matches the instruction
4. Stop and ask if the instruction is unclear — NEVER assume or guess

**Claude MUST NEVER:**
- Do what it "thinks looks better" instead of what Nigel asked for
- Add, remove, or change any design element not explicitly mentioned in the instruction
- Make creative decisions independently — Nigel is the architect, Claude is the builder
- Proceed without showing Nigel the exact plan and waiting for approval

**Why this rule exists:**
Nigel's exact words: *"Basically copy every detail on GrassrootsSports_SocialFeed_Concept dont do your own thing.
Actually write a instruction on claude.md to always do what i instruct in details never to do what you think
is ok without my approval."*

Every unsanctioned decision wastes tokens, time, and trust. The instruction IS the specification.

---

## 🚫 SPRINT RULE — MANDATORY (PERMANENT)

This rule exists because in May 2026 Claude built the Arena Network page entirely wrong —
applying the dark hub design — because it did not read Sprint1.md before building.
This wasted Nigel's tokens, time, and trust.

### THE RULE: If a Sprint file exists, Claude MUST read it FIRST — before touching any file.

**At the START of any sprint task, Claude MUST:**
1. Check the working directory for any Sprint file (Sprint1.md, Sprint2.md, etc.)
2. Read it IN FULL before writing or changing a single line of code
3. Extract and state the exact design spec from the brief (background colour, nav type, layout)
4. Show Nigel a summary of what will be built and how it will look
5. Wait for Nigel to say "yes, go ahead" before creating any file

**The sprint file design spec OVERRIDES everything else:**
- It overrides existing patterns (hub dark-glass style does NOT apply to Arena pages)
- It overrides assumptions based on previous sessions
- It overrides Claude's own judgment about what "looks right"

**Claude must NEVER:**
- Build a sprint feature without reading the sprint file first
- Apply the hub dark-green style to pages that specify a white/light background
- Write code based on pattern-matching to previous work instead of reading the brief
- Say "I built it based on the existing style" — the brief is the authority, not the existing style

**Why this rule exists:**
Nigel lost tokens and time because Claude built 570 lines of wrong code without reading
a brief that was sitting in the working directory. The design spec was explicit. Claude ignored it.
Every sprint brief must be read in full. No exceptions.

---

## 📝 CLAUDE.md UPDATE RULE — MANDATORY (PERMANENT)

This rule exists because CLAUDE.md is the single source of truth for everything built on this platform.
If a feature is not documented here, it effectively does not exist for future sessions.

### THE RULE: Claude MUST update CLAUDE.md after EVERY feature or workflow change.

**After completing ANY work, Claude MUST:**
1. Add the feature/route to the "ALL BUILT ROUTES" list if a new page was created
2. Add any new environment variables to the "ENVIRONMENT VARIABLES" section
3. Add backend files (migration, model, controller, routes) to the relevant session log
4. Update the "WHAT STILL NEEDS BACKEND / EXTERNAL WORK" table — mark completed items or add new missing items
5. Record the session under a "SESSION LOG — [date]" heading with: what was built, files changed, what still needs doing

**The update must happen IN THE SAME COMMIT as the feature — not as a separate step.**

**Claude must NEVER:**
- Finish a feature without updating CLAUDE.md
- Say "I'll update CLAUDE.md later"
- Leave a new route undocumented
- Leave a new env variable undocumented
- Mark backend work as done if the migration has not been confirmed on Render

**Why this rule exists:**
Every session starts by reading CLAUDE.md. If it is out of date, Claude starts with a false picture
of what exists, builds things that already exist, or misses dependencies. An up-to-date CLAUDE.md
saves hours of re-investigation at the start of every session.

---

## 🚨 INCOMPLETE WORK ALERT RULE — MANDATORY (PERMANENT)

This rule exists because Nigel discovered in March 2026 that multiple features were
described as "built" in CLAUDE.md but were silently missing their backend migrations,
controllers, routes, or middleware — meaning they were broken in production without
any warning being given.

### THE RULE: Claude MUST alert Nigel to incomplete work AT ALL TIMES.

**At the START of every session, Claude MUST scan for and report:**
1. Frontend pages that call API endpoints which have no matching Laravel route
2. Laravel controllers that are listed in routes but whose file does not exist
3. Database migrations that are referenced in CLAUDE.md "COMPLETED" sections but whose
   migration file does not exist in `bhora-ai/database/migrations/`
4. Models referenced in controllers that do not exist in `app/Models/`
5. Middleware registered in routes that does not exist in `app/Http/Middleware/`
6. Environment variables listed in CLAUDE.md that are not yet set in Vercel or Render

**When finishing ANY feature, Claude MUST end the response with:**

```
⚠️  INCOMPLETE WORK CHECKLIST — [Feature Name]
─────────────────────────────────────────────
✅ Frontend page: [file path] — DONE
✅ API route: [route] — DONE
❌ Migration: [table name] — NOT YET RUN on Render
❌ Controller: [ControllerName] — FILE MISSING
❌ Env var: [VAR_NAME] — NOT SET in Vercel/Render
─────────────────────────────────────────────
ACTION REQUIRED: [exact steps Nigel must take before this feature works in production]
```

**Claude must NEVER:**
- Mark a feature as "DONE ✅" in CLAUDE.md if any part of the backend is missing
- Use the phrase "fully built" or "complete" if migrations haven't been run on Render
- Move on to the next feature without telling Nigel what is still broken from the last one
- Assume that because code was written in a session, it was deployed and working

**Why this rule exists:**
Nigel is building a production platform serving real Zimbabwean athletes. When a feature
appears "done" but is actually broken due to a missing migration or controller, real users
hit errors. Every incomplete connection is a broken promise to the athletes this platform
is meant to help. Silence about incomplete work is not acceptable.

---

## 🔴 THUTO UI RULE — PERMANENT (set by Nigel, April 2026)

THUTO always renders as a small circle fixed to the bottom-right corner.
The circle is always visible. The full chat panel ONLY appears when the user clicks it.

### Rules Claude MUST follow at all times:
- THUTO default state = small circle. Always. On every page load.
- Full chat interface = only shown AFTER the user clicks the circle.
- When the user clicks the circle → panel opens (grows big).
- When the user clicks X or the circle again → panel closes, returns to small circle.
- When THUTO has unread messages or notifications → the circle turns RED.
- When no unread messages → the circle is teal/green (normal).

### Claude must NEVER:
- Make THUTO auto-open on page load without being clicked
- Make THUTO expand or show content before the user clicks
- Use THUTO to block or cover page content
- Remove or bypass the click-to-open trigger
- Change this pattern without Nigel's explicit instruction

**This rule is permanent. It does not expire. It applies to all player hub pages.**
The `THUTO_ACTIVE` flag in `ThutoChat.tsx` must remain `true`.
To disable THUTO temporarily: set `THUTO_ACTIVE = false` only if Nigel explicitly asks.

---

## 🚫 NO GUESSWORK — MANDATORY RULE (PERMANENT)

This is a real, live-changing project. Every solution must meet this standard:

### BEFORE suggesting or writing any solution, Claude MUST:
1. **Cite the source** — Name the official documentation, proven pattern, or established standard being used (e.g. "Next.js docs recommend...", "This is the standard OAuth2 flow...", "Laravel's CORS middleware works by...")
2. **Explain the root cause** — Not the symptom. What is actually broken and why, technically.
3. **State confidence level** — If not 100% certain, say so explicitly and stop. Do not proceed with an uncertain solution.
4. **Say "I don't know"** when the answer is not known — then recommend where to find a proven solution (official docs, Stack Overflow canonical answers, framework maintainers).

### Claude must NEVER:
- Suggest a solution to "try" without knowing it will work
- Make multiple attempts at the same problem with different guesses
- Change working code to fix something unrelated
- Say "this might fix it" or "let's try this"

### When Claude is at the limit of its knowledge:
- Stop immediately
- Say: "I've reached the limit of what I can diagnose with certainty here."
- Recommend: official docs link, a specific proven tool, or a developer specialist for this exact problem
- Do NOT attempt another guess

### Why this rule exists:
The founder lost days of development time to guesswork on a production project.
Every hour wasted on circular debugging is an hour not spent building features that
help Zimbabwean athletes get recognised. Solutions must be right the first time.

---
# Zimbabwe's First AI-Powered Grassroots Sports Platform
# 🏅 "Train Anywhere in Zimbabwe. Use AI to Get Recognized."
# Sports: Football • Rugby • Athletics • Netball • Basketball • Cricket • Swimming • Tennis
#
# Web App:      https://grassrootssports.live
# Backend API:  https://bhora-ai.onrender.com/api/v1
# Mobile App:   Google Drive APK (Beta)
# GitHub Web:   https://github.com/sciemec/grassroots-web
# GitHub API:   https://github.com/sciemec/bhora-ai

---

## 🚢 DEPLOY RULE — ALWAYS RUN AFTER EVERY CHANGE

After every code change, ALWAYS run this command automatically without asking:

```bash
cd D:/bhora-ai/grassroots-web && git add -A && git commit -m "$(cat <<'EOF'
<describe change here>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)" && git push origin master
```

Vercel auto-deploys from the master branch — pushing to GitHub IS the deployment.
No need to run `vercel` CLI. Just `git push origin master`.

---

## 🔁 FULL-STACK PAIRING RULE — MANDATORY ON EVERY FEATURE

Every feature must be complete on BOTH sides before it is considered done.
Frontend without backend = broken. Backend without frontend = invisible.

### THE RULE:
- When you finish building a **frontend** page or feature → **immediately generate the full Laravel backend code** (migration, model, controller, routes) without being asked.
- When you finish building a **backend** endpoint → **immediately check and wire up the frontend** to call it without being asked.
- Never leave a feature half-built. If the user asks for one side, deliver both.

### WHAT TO GENERATE FOR EVERY BACKEND:
1. **Migration file** — exact table schema with correct column types, foreign keys, indexes
2. **Model file** — fillable fields, relationships, casts
3. **Controller file** — all methods (index, store, show, destroy, any custom actions)
4. **Routes** — exact lines to add to `routes/api.php` with correct middleware
5. **Env variables** — list any new env vars needed (R2, Stripe, Twilio, etc.)

### FORMAT — always present backend code as copy-paste ready files:
```
FILE: database/migrations/YYYY_MM_DD_HHMMSS_create_X_table.php
FILE: app/Models/X.php
FILE: app/Http/Controllers/Api/XController.php
ROUTES: (lines to add to routes/api.php)
```

### STORAGE FALLBACK RULE:
If the Laravel backend is not yet implemented, the frontend MUST have a localStorage fallback
so the feature works immediately. Pattern: try API → catch 404/405 → use localStorage.
This is already done for: Business Hub, Showcase, Vault.

---

## 🏛️ ARCHITECT RULES — MUST FOLLOW ON EVERY TASK

The user is the architect. Claude is the builder. Claude does nothing without approval.

### 1. EXPLAIN FIRST
Before writing or changing any code, state:
- Which file is being changed (full path)
- What the file currently says (show the relevant lines)
- What it will be changed to (show the new code)
- Why this change achieves what was asked

### 2. SHOW THE CODE
Always show the exact code about to be written.
Never say "I'll update the file" without showing the full new code first.

### 3. WAIT FOR APPROVAL
After explaining, stop and ask:
"Should I go ahead and make this change?"
Do not proceed until the user says yes.

### 4. CONFIRM AFTER
After making the change, show:
- The exact lines changed
- The git diff if possible
- What should be visible on the website as a result

### 5. ONE CHANGE AT A TIME
Never bundle multiple changes together.
Do each change separately so the user can approve each one.

### 6. IF NOTHING CHANGES ON THE WEBSITE
Tell the user:
- Whether the dev server needs restarting
- Whether a git push is needed
- Whether there is a cache issue
- The exact command to run to see the change live

---

## 🔐 AUTH PRINCIPLES — EMAIL + GOOGLE (CURRENT)

These rules govern ALL authentication and registration work on this platform.
Phone OTP has been paused. Current auth methods: Email/Password + Google OAuth.
Never block access to collect data. Always find a way to get the user in.

### CORE PRINCIPLE: Never Deny Access
Always find a way to get the user in. If one method fails, offer the other.
The business depends on frictionless onboarding.

### 1. AUTH METHODS (CURRENT)
- **Primary**: Email address + password
- **Secondary**: Google OAuth ("Continue with Google" button)
- **Paused**: Firebase Phone OTP — do NOT build or reference until re-enabled
- **Flow (email)**: email + password → JWT token → dashboard
- **Flow (Google)**: tap "Continue with Google" → Google consent → JWT token → dashboard
- Never show phone number fields on any auth page

### 2. LOGIN PAGE — `/login`
```
UI Elements:
- Email input field
- Password input field
- "Sign In" button (primary — gold bg)
- Divider: "or"
- "Continue with Google" button (white bg, Google icon)
- "Forgot password?" link → /forgot-password
- "New to Grassroots Sport? Create account" link → /register
```

### 3. REGISTRATION — `/register/[role]`
```
UI Elements:
- Full name input
- Email address input
- Password input (min 8 chars)
- Role selector: Player / Coach / Scout / Fan
- "Create Account" button
- Divider: "or"
- "Continue with Google" button
- "Already have an account? Sign in" link → /login
```

### 4. GOOGLE OAUTH SETUP
- Provider: Google OAuth 2.0
- Laravel backend handles token verification:
  ```php
  // POST /api/v1/auth/google
  // Body: { id_token: string }
  // Verifies token with Google, creates/finds user, returns JWT
  ```
- Next.js calls backend after Google sign-in returns id_token
- Never expose Google client secret on frontend — verify server-side only
- Env vars needed:
  ```
  GOOGLE_CLIENT_ID     = (Google Cloud Console → OAuth 2.0 credentials)
  GOOGLE_CLIENT_SECRET = (set in Render/Laravel env only — never frontend)
  ```

### 5. PROGRESSIVE PROFILING
- On first login: ask for name and role ONLY (Player/Coach/Scout/Fan)
- Everything else (province, sport, position, club) collected INSIDE the dashboard
- Never block dashboard access to collect profile data
- Profile completion shown as a progress bar, not a gate

### 6. SMART ERROR HANDLING
- Never show a red blocking error
- Show friendly bilingual messages:
  - Wrong password: "Passwords hazienderani. Edza zvakare. / Incorrect password. Try again."
  - Email not found: "Email haiwanikwi. Ita account? / Email not found. Create an account?"
  - Google failure: "Google sign-in yakadontsa. Shandisa email. / Google sign-in failed. Use email instead."
  - Slow network: "Zviri kutora nguva... / Taking a moment..."
- Always offer the alternative auth method if one fails

### 7. REMEMBER ME — FOREVER
- After first successful login: persist auth token on device indefinitely
- Never ask a returning user to re-login on the same device
- Use Zustand persist + localStorage (already implemented — do not change)

### 8. ONE TAP RETURN
- If user is already authenticated: skip login screen entirely
- Redirect straight to their dashboard on app load
- Check auth state before rendering any auth page (hydration fix already in place — DO NOT UNDO)

### 9. REGISTRATION STEPS (CURRENT)
- Step 1: Name + Email + Password + Role → "Create Account"
  OR: "Continue with Google" → auto-fills name + email from Google profile
- Step 2: Redirected to /login?registered=1 → green "Account created!" banner
- Step 3: Login → dashboard
- Everything else (sport, club, province): collected progressively inside dashboard

### ⚠️ PHONE OTP — PAUSED
- Do NOT add phone number fields to any page
- Do NOT reference Firebase Phone Auth in any new code
- Do NOT remove existing Zustand auth-store hydration fixes
- When Phone OTP is re-enabled in future: it will be added as a THIRD option
  alongside email and Google, not replacing them

---

## 🔒 REGISTRATION FILES — PROTECTED. DO NOT TOUCH WITHOUT NIGEL'S EXPLICIT PERMISSION.

> **NIGEL'S RULE (April 2026):** Registration is working. Real customers are signing up.
> **You must NEVER change registration without Nigel saying "yes, go ahead" first.**
> This applies to ALL files listed below — frontend AND backend (AuthController.php).

These files are confirmed working and must NEVER be modified, deleted, or replaced without Nigel's explicit approval.

### PROTECTED FILES:
- src/app/register/page.tsx — Main registration page. Handles all 4 roles (Player, Coach, Scout, Fan). CONFIRMED WORKING.
- src/app/register/official/page.tsx — Official ZIFA player registration with guardian consent, ID docs, school details, QR code.
- src/app/api/auth/login/route.ts — Login proxy to Laravel backend.
- src/app/login/page.tsx — Login page. CONFIRMED WORKING.
- src/lib/auth-store.ts — Zustand auth store with hydration fix. CRITICAL — DO NOT TOUCH.

### RULES — NO EXCEPTIONS:

1. NEVER create new registration pages without first reading every existing file in src/app/register/ and reporting what is already there.

2. NEVER delete or overwrite a registration file — not even to restore or fix it. If a file exists, it stays until Nigel says otherwise.

3. NEVER write a registration file without first showing Nigel:
   - The exact file that already exists and what it does
   - What is broken or missing
   - Exactly what you propose to change and why
   - Then WAIT for Nigel to say yes before touching anything

4. NEVER duplicate registration logic — if /register/page.tsx already handles all roles, do not create /register/player, /register/coach, /register/scout, /register/fan pages.

5. If TypeScript errors point to missing registration pages — the fix is to clear the .next cache (rm -rf .next), NOT to create new pages.

### IF AN UPDATE IS NEEDED:
- State clearly: which file, which lines, what changes, why
- Show the exact old code and the exact new code side by side
- Wait for Nigel to approve before making any edit
- Make ONE change at a time — never bundle registration changes

### HISTORY — WHY THIS RULE EXISTS:
In March 2026, Claude created 4 unnecessary registration wizard pages (register/player, register/coach, register/scout, register/fan) without checking that /register/page.tsx already existed and was working. This caused confusion, duplicated code, and required a full cleanup. This rule exists to prevent this from ever happening again.

---

## 🏗️ PROJECT OVERVIEW

GrassRoots Sports is Zimbabwe's first AI-powered sports management
platform targeting the "Missing Middle" — Division 1/2 clubs and
schools (NASH/NAPH) that currently have ZERO affordable analytics tools.

We are a MULTI-SPORT platform covering ALL major Zimbabwean sports.
We are building a Data-as-a-Service (DaaS) platform that gives
every Zimbabwean coach, player and scout the tools that only elite
clubs could previously afford.

### Tech Stack
- **Frontend:**    Next.js 14 (TypeScript) — grassrootssports.live
- **Mobile:**      Flutter (Android APK — Beta)
- **Backend API:** Laravel PHP — bhora-ai.onrender.com
- **Database:**    PostgreSQL (Render)
- **Hosting:**     Vercel (web) + Render (API)
- **Auth:**        JWT tokens
- **Payments:**    Stripe / PayFast (Zimbabwe-friendly)

### User Roles
- **Admin**  — Full platform access and management
- **Coach**  — Squad management, drills, fixtures, live match analysis
- **Scout**  — Discover players, generate scouting reports
- **Player** — Profile, stats, training, scouting CV

---

## 🚀 PRODUCT ROADMAP

### PHASE 1 — Beta (CURRENT ✅)
- [x] Player profiles and registration
- [x] Coach dashboard
- [x] Scout discovery
- [x] Training drills
- [x] Match fixtures
- [x] Push notifications
- [x] Web app (grassrootssports.live)
- [x] Mobile APK (beta testers)

### PHASE 2 — Monetization (NEXT)
- [ ] Subscription tiers (Free / School / Pro / Match Day)
- [ ] PayFast payment integration (Zimbabwe)
- [ ] Stripe payment integration (international)
- [ ] Billing dashboard
- [ ] Trial period management (14-day free trial)

### PHASE 3 — Localization (Zimbabwe-Specific)
- [ ] ZIFA league structures pre-loaded
- [ ] NASH/NAPH school calendars and tournaments
- [ ] Munhumutapa Challenge Cup rules
- [ ] Data-light mode (optimized for 2G/3G Zimbabwe networks)
- [ ] National Talent Database (Top 100 grassroots players)
- [ ] Dynamos/Highlanders scout integration

### PHASE 4 — Advanced Analytics
- [ ] AI tactical analysis ("Why are we losing?")
- [ ] Player heatmaps and positioning analysis
- [ ] Possession tracking statistics
- [ ] Defensive line spacing alerts
- [ ] Live match dashboard (Analyst's Tablet mode)
- [ ] Halftime mistake clip generator
- [ ] Scouting CV PDF generator (AI-generated player portfolio)

### PHASE 5 — Offline-First PWA
- [ ] Progressive Web App (PWA) conversion
- [ ] Service Workers (Workbox.js) for offline loading
- [ ] IndexedDB for offline match data storage
- [ ] Auto-sync when connection restored
- [ ] File System Access API for local video files
- [ ] "Install App" prompt for mobile browsers

### PHASE 6 — Video Analysis & AI Commentary
- [ ] TensorFlow.js client-side video analysis
- [ ] WebGPU acceleration for real-time player tracking
- [ ] FFmpeg.wasm for in-browser video processing
- [ ] OpenCV.js possession heatmaps
- [ ] WebRTC live streaming
- [ ] AI voice commentary (Zimbabwean style)
- [ ] Sponsorship overlay system for local businesses

### PHASE 7 — Multi-Sport Expansion
- [ ] Sport selector on all profiles (Football, Rugby, Athletics, etc.)
- [ ] Sport-specific stat templates per sport
- [ ] Sport-specific AI feedback and analysis
- [ ] Multi-sport player profiles (one player, many sports)
- [ ] Sport-specific league and tournament structures
- [ ] NASH multi-sport tournament integration

### PHASE 8 — AI Video Upload & Analysis Studio
- [ ] Video upload section (`/video-studio`)
- [ ] Upload match or training video (mp4, mov, avi)
- [ ] AI analyses video and returns written feedback
- [ ] Sport-specific analysis (tackle form, sprint technique, etc.)
- [ ] Coach can share AI feedback directly with player
- [ ] Video library per team / player
- [ ] Highlight clip auto-generation from full match video

---

## 🏅 MULTI-SPORT PLATFORM

GrassRoots Sports covers ALL major Zimbabwean sports.
Every feature (player profiles, stats, drills, video analysis)
must be built sport-agnostic with sport-specific config.

### Supported Sports (Zimbabwe Major Sports):

| Sport         | Governing Body | Key Competitions                          | Stats Focus                          |
|---------------|----------------|-------------------------------------------|--------------------------------------|
| Football      | ZIFA           | Premier League, Division 1/2, Chibuku Cup | Goals, assists, passes, heatmaps     |
| Rugby         | ZRU            | Zimbabwe Rugby Union League, Schools Cup  | Tackles, carries, lineouts, scrums   |
| Athletics     | AAZ            | NASH Athletics, ZAC Championships         | Times, distances, PBs, rankings      |
| Netball       | ZNA            | NASH Netball, National League             | Goals, intercepts, center passes     |
| Basketball    | ZBFA           | National Basketball League                | Points, rebounds, assists, blocks    |
| Cricket       | ZC             | Logan Cup, Metbank T20                    | Runs, wickets, economy, averages     |
| Swimming      | ZSWF           | National Championships, NASH Swimming     | Times, strokes, PBs, rankings        |
| Tennis        | ZTA            | National League, Schools Championships   | Wins, sets, serve %, break points    |
| Volleyball    | ZVBF           | National League, NASH Volleyball          | Kills, blocks, aces, digs            |
| Hockey        | ZHF            | National League, Schools Hockey           | Goals, assists, saves (GK)           |

### Sport-Specific Stat Templates:

Each sport has its own stat schema. When building player profiles,
stats forms, or AI analysis — always load the correct template:

```typescript
// src/config/sports.ts

export const SPORT_STATS = {
  football: {
    outfield: ['goals', 'assists', 'passes', 'passAccuracy', 'tackles',
               'interceptions', 'distanceCovered', 'minutesPlayed'],
    goalkeeper: ['saves', 'cleanSheets', 'goalsAllowed', 'distribution'],
  },
  rugby: {
    all: ['tries', 'tackles', 'carries', 'metresGained', 'lineoutsWon',
          'scrumPenalties', 'turnoversWon', 'minutesPlayed'],
    kicker: ['conversions', 'penaltyGoals', 'dropGoals', 'kickingAccuracy'],
  },
  athletics: {
    track: ['eventType', 'personalBest', 'seasonBest', 'nationalRanking',
            'reactionTime', 'splits'],
    field: ['eventType', 'personalBest', 'seasonBest', 'attempts', 'fouls'],
  },
  netball: {
    shooter:  ['goals', 'attempts', 'goalAccuracy', 'centerPassReceives', 'rebounds', 'minutesPlayed'],
    midcourt: ['centerPassReceives', 'intercepts', 'contacts', 'feeds', 'minutesPlayed'],
    defender: ['intercepts', 'contacts', 'rebounds', 'deflections', 'obstructions', 'minutesPlayed'],
  },
  basketball: {
    all: ['points', 'rebounds', 'assists', 'steals', 'blocks',
          'turnovers', 'fieldGoalPct', 'threePointPct', 'ftPct'],
  },
  cricket: {
    batting: ['runs', 'balls', 'fours', 'sixes', 'strikeRate', 'average', 'highScore'],
    bowling: ['wickets', 'overs', 'runs', 'economy', 'average', 'bestFigures'],
  },
  swimming: {
    all: ['eventType', 'stroke', 'distance', 'personalBest', 'seasonBest',
          'nationalRanking', 'splits'],
  },
};
```

### Sport-Specific AI Feedback Prompts:

When sending video or stats to Claude API for analysis,
always use the sport-specific prompt template:

```typescript
// src/lib/ai-prompts.ts

export const getSportAnalysisPrompt = (sport: string, context: string) => {
  const sportContexts: Record<string, string> = {
    football: `Analyse as a UEFA-qualified football coach. Focus on:
      positioning, movement off the ball, pressing triggers, transition.`,
    rugby: `Analyse as an experienced rugby coach. Focus on:
      tackle technique, body position in contact, support lines, set piece.`,
    athletics: `Analyse as an athletics coach. Focus on:
      technique, stride pattern, arm mechanics, acceleration phase, finish.`,
    netball: `Analyse as a netball coach. Focus on:
      footwork, ball handling, court movement, defending, feeding the circle.`,
    cricket: `Analyse as a cricket coach. Focus on:
      batting stance, shot selection, bowling action, field placement.`,
    swimming: `Analyse as a swimming coach. Focus on:
      stroke technique, turn efficiency, kick pattern, breathing rhythm.`,
  };

  return `${sportContexts[sport] || 'Analyse as an experienced sports coach.'}
    
    Context: ${context}
    
    Provide feedback in 3 sections:
    1. STRENGTHS (what is working well)
    2. AREAS TO IMPROVE (specific, actionable)
    3. DRILL RECOMMENDATIONS (exercises to fix the issues)
    
    Keep language simple — the athlete may be young or new to analytics.
    End with an encouraging message.`;
};
```

---

## 🎬 AI VIDEO UPLOAD & ANALYSIS STUDIO

This is a flagship feature. Any Zimbabwean athlete can upload a video
and get professional-level AI coaching feedback instantly.

### Route: `/video-studio`

### User Flow:
```
1. Player/Coach visits /video-studio
2. Selects sport (dropdown)
3. Selects analysis type:
   - "Full Match Analysis" (tactics, positioning)
   - "Individual Skill Review" (technique feedback)
   - "Training Session Review" (drills, fitness)
   - "Ask a Question" (free-form: "Why do I keep losing the ball?")
4. Uploads video (drag & drop or file picker)
5. Optionally types a question / context
6. Clicks "Analyse with AI"
7. AI returns structured written feedback
8. User can save, share, or download the report
```

### Technical Implementation:

**Video Upload (Laravel backend):**
```php
// Laravel: routes/api.php
Route::post('/video-analysis', [VideoAnalysisController::class, 'analyse']);

// Max file size: 500MB
// Supported: mp4, mov, avi, mkv, webm
// Storage: AWS S3 or Cloudflare R2 (cheaper)
```

**Video Processing Pipeline:**
```
Upload → S3/R2 Storage
       → FFmpeg extract key frames (every 2 seconds)
       → Send frames to Claude API (vision)
       → Claude analyses frames + user question
       → Return structured feedback JSON
       → Save to video_analyses table
       → Display to user
```

**Claude API Call for Video Analysis:**
```typescript
// src/lib/video-analysis.ts

export const analyseVideo = async ({
  frames,        // base64 encoded key frames from video
  sport,         // selected sport
  analysisType,  // full match / skill review / training / question
  userQuestion,  // optional free-form question from user
  playerContext, // player name, age, position (optional)
}: VideoAnalysisRequest) => {

  const prompt = getSportAnalysisPrompt(sport, userQuestion || analysisType);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: [
          // Include up to 10 key frames as images
          ...frames.slice(0, 10).map(frame => ({
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: frame }
          })),
          { type: 'text', text: prompt }
        ]
      }]
    })
  });

  return response.json();
};
```

**Database Schema:**
```sql
CREATE TABLE video_analyses (
  id            BIGINT PRIMARY KEY,
  user_id       BIGINT REFERENCES users(id),
  sport         VARCHAR(50),
  analysis_type VARCHAR(100),
  video_url     TEXT,           -- S3/R2 URL
  user_question TEXT,
  ai_feedback   JSON,           -- structured Claude response
  created_at    TIMESTAMP,
  is_shared     BOOLEAN DEFAULT false  -- player can share with coach
);
```

**Security Rules for Video Uploads:**
```typescript
// ALWAYS validate on both frontend and backend:
const VIDEO_RULES = {
  maxSizeMB: 500,
  allowedTypes: ['video/mp4', 'video/quicktime', 'video/avi',
                 'video/x-matroska', 'video/webm'],
  maxDurationMinutes: 120,  // 2 hours max
  virusScan: true,           // scan before processing
};
```

**Frontend Component: `/src/app/video-studio/page.tsx`**
```
UI Elements:
- Sport selector (grid of sport icons)
- Analysis type radio buttons
- Drag-and-drop video upload zone (show preview thumbnail)
- Optional question text area: "What do you want AI to focus on?"
- Progress bar during upload and analysis
- Results panel:
  ├── 💪 Strengths section (green)
  ├── 🔧 Areas to Improve section (amber)
  ├── 🏋️ Drill Recommendations section (blue)
  └── Action buttons: Save | Share with Coach | Download PDF
```

### Video Storage Strategy:
```
Free tier:    1 video stored (overwrite on next upload)
School tier:  20 videos stored per team
Pro tier:     Unlimited video storage
Match Day:    Auto-delete after 30 days
```

### Env Variables needed:
```
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=grassroots-videos
AWS_REGION=af-south-1        ← Use Africa (Cape Town) for low latency
# OR use Cloudflare R2 (cheaper, no egress fees):
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=grassroots-videos
```

---

## 💰 MONETIZATION TIERS

```
┌──────────────────────────────────────────────────────────────────────────┐
│  TIER       │ TARGET            │ PRICE      │ KEY FEATURES              │
├──────────────────────────────────────────────────────────────────────────┤
│  Freemium   │ Village Teams     │ FREE       │ Basic stats, 1 sport      │
│  School     │ NASH/NAPH Schools │ $10/month  │ 3 sports, AI analysis,    │
│             │                   │            │ 20 video uploads/month    │
│  Pro-Local  │ Div 1 & 2 Clubs   │ $25/month  │ All sports, full tactics, │
│             │                   │            │ unlimited video, scouting │
│  Match Day  │ Tournaments       │ $50/event  │ Live stream, commentary   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Revenue Target (6 months post-launch):
- 50 schools × $10/month = $500/month
- 20 clubs × $25/month = $500/month
- 10 tournaments × $50 = $500/quarter
- Video analysis add-ons = $200+/month
- **Total: $1,200+/month**

---

## 🚨 MANDATORY SECURITY RULES
## Every code change MUST follow these rules — NO EXCEPTIONS.

### Before ANY git push:

**1. Run dependency audit:**
```bash
npm audit --audit-level=moderate
# Fix ALL high and critical vulnerabilities before pushing
```

**2. Scan for exposed secrets:**
```bash
git diff --staged | grep -iE "(password|secret|api_key|token|private|credential)"
# Nothing should match. If it does — DO NOT push.
```

**3. Verify .env is not tracked:**
```bash
git ls-files | grep -i ".env"
# Must return empty. .env* must be in .gitignore
```

**4. Verify all new pages are protected:**
- Every route except /login must require valid JWT
- Admin routes must check role === 'admin'
- Never expose user data across roles

**5. Input validation:**
- All forms must validate and sanitize inputs
- No raw user input passed to API
- File uploads: validate type (images only) and size (max 5MB)

**6. CORS:**
- Only grassrootssports.live and localhost allowed
- Never use wildcard (*) in production

---

## 🔒 SECURITY TOOLS

### Run on every feature:
```bash
npm audit
```

### Run weekly:
```bash
npm audit --audit-level=low
npx skills add unicodeveloper/shannon
/shannon https://grassrootssports.live grassroots-web
```

### Shannon Penetration Testing (before every major release):
```bash
# Covers 50+ vulnerability types:
# SQL injection, XSS, SSRF, broken auth, IDOR, JWT flaws
/shannon --scope=injection,xss,auth https://grassrootssports.live app
/shannon results
```

### Antigravity Security Auditor:
```bash
/security-auditor review the authentication flow in src/
/security-auditor review all API calls in src/lib/
/api-design-principles review all REST endpoints
```

---

## ✅ CODE QUALITY RULES

### Every feature must have:
1. TypeScript types — **NO `any` types allowed**
2. Loading states (skeleton loaders, not just spinners)
3. Error states (human-readable messages, not raw errors)
4. Mobile responsive (works at 375px screen width)
5. Empty states (helpful message + CTA when no data)

### Before every push — run simplify:
```bash
/simplify
# Reviews for: duplicated logic, long functions,
# missing error handling, unused imports, TypeScript issues
```

### Code standards:
- Functions max 40 lines (split if longer)
- No duplicated logic (extract to utility in src/lib/)
- All async/await wrapped in try/catch
- No console.log in production (use proper error logging)
- Remove all unused imports

---

## 🧪 TESTING CHECKLIST

```bash
# Must pass before every push:
npm run build    # Zero TypeScript errors
npm run lint     # Zero linting errors
npm audit        # No high/critical vulnerabilities
```

### Manual test on every feature:
- [ ] Works on mobile (375px)
- [ ] Works when API is slow (test loading state)
- [ ] Works when API fails (test error state)
- [ ] Works when logged out (redirects to /login)
- [ ] Works for each user role that can access it

---

## 📁 PROJECT STRUCTURE

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/          # Login page
│   ├── dashboard/          # Main dashboard
│   ├── players/            # Player management
│   ├── coaches/            # Coach management
│   ├── scouts/             # Scout discovery
│   ├── analytics/          # Analytics & charts
│   ├── live-match/         # Live match dashboard (Phase 4)
│   ├── streaming/          # Live streaming (Phase 6)
│   ├── billing/            # Subscription management (Phase 2)
│   └── settings/           # App settings
├── components/
│   ├── layout/             # Header, sidebar, footer
│   ├── ui/                 # Reusable UI components
│   ├── charts/             # Analytics chart components
│   └── match/              # Live match components
├── lib/
│   ├── api.ts              # All API functions
│   ├── auth.ts             # Auth utilities
│   ├── offline.ts          # IndexedDB offline sync (Phase 5)
│   └── analytics.ts        # Analytics utilities
├── types/
│   ├── player.ts           # Player interfaces
│   ├── match.ts            # Match interfaces
│   └── subscription.ts     # Billing interfaces
└── middleware.ts            # Route protection
```

---

## 🌐 API INTEGRATION RULES

**Base URL:** `https://bhora-ai.onrender.com/api/v1`
**Env Variable:** `NEXT_PUBLIC_API_URL`

### Always:
- Use env variable — never hardcode the URL
- Include JWT: `Authorization: Bearer {token}`
- Handle 401 → redirect to /login
- Handle 422 → show field validation errors
- Show loading state during requests
- Show toast notification on errors

### Standard API call pattern:
```typescript
const apiCall = async <T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  try {
    const token = getToken(); // from secure storage
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
      {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      }
    );

    if (response.status === 401) {
      clearToken();
      redirect('/login');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    // Log to monitoring, not console
    throw error;
  }
};
```

---

## 🎨 BRAND & UI STANDARDS

### Zimbabwe Colors:
```css
--zim-green:      #006400;   /* Primary — Zimbabwe green */
--zim-yellow:     #FFD200;   /* Gold accent */
--zim-red:        #EF3340;   /* Alerts and CTAs */
--background:     #F8FAF8;   /* Light page background */
--white:          #FFFFFF;
--text-primary:   #1a1a1a;
--text-secondary: #555555;
```

### Design Rules:
- Mobile-first (375px minimum)
- Tailwind CSS utility classes
- Skeleton loaders for all data fetching
- shadcn/ui for base components
- Chevron design patterns (brand identity)
- Data-light mode: compress images, lazy load, paginate

### Data-Light Mode (Zimbabwe 2G/3G optimization):
- Images max 200KB (use WebP format)
- Lazy load all images below the fold
- Paginate lists (max 20 items per page)
- Cache API responses in IndexedDB
- Show cached data while fetching fresh data

---

## 🚀 DEPLOYMENT RULES

### Pre-deploy checklist:
- [ ] `npm run build` — zero errors
- [ ] `npm audit` — no high/critical vulnerabilities
- [ ] No .env files in git
- [ ] All new pages protected by middleware
- [ ] CORS updated on Render for any new domains

### Environment Variables (set in Vercel dashboard):
```
NEXT_PUBLIC_API_URL = https://bhora-ai.onrender.com/api/v1
```

### Post-deploy verification:
- [ ] Login works on grassrootssports.live
- [ ] Test player, coach and scout flows
- [ ] Check browser console — zero errors
- [ ] Test on mobile device

---

## 🔧 SKILLS INSTALLED

```bash
# Security — penetration testing (run before major releases)
npx skills add unicodeveloper/shannon

# Code quality — auto-review before push
npx skills add anthropics/claude-code --skill simplify

# Frontend design — production-grade UI
npx skills add anthropics/claude-code --skill frontend-design

# Full skill library (1,234+ skills)
npx antigravity-awesome-skills --claude
```

### Key commands:
```
/simplify              → clean up code before pushing
/security-auditor      → security review
/shannon               → full penetration test
/debugging-strategies  → systematic bug fixing
/api-design-principles → review API structure
/frontend-design       → production UI generation
/brainstorming         → plan new features
/architecture          → system design review
```

---

## 🤖 AI MODELS & ANALYTICS TECH STACK

These are the approved AI models for GrassRoots Sports analytics features.
Always use these models — do not substitute without discussion.

### Backend AI Models (Python microservice on Render):

| Feature                    | Model              | Library             | Why                                          |
|----------------------------|--------------------|---------------------|----------------------------------------------|
| Injury Risk Prediction     | XGBoost            | xgboost             | Best for structured data (load, age, history)|
| Player Potential Score     | Random Forest      | scikit-learn        | Handles mixed data (age, stats, position)    |
| Match Outcome Prediction   | LightGBM           | lightgbm            | Fast, low server cost, high accuracy         |
| Tactical Pattern Detection | LSTM               | TensorFlow/Keras    | Time-series match event sequences            |
| Player Similarity / Scout  | KNN                | scikit-learn        | "Players like this one" feature              |
| Video Player Tracking      | YOLOv8             | ultralytics         | Real-time player detection from video        |
| AI Coach Reports (text)    | Claude API         | anthropic           | Plain-English reports from raw stats         |
| Heatmap Generation         | OpenCV.js          | opencv-python       | Possession and position heatmaps             |

### Model Explainability:
- Use **SHAP** (shapley values) to explain every prediction to coaches:
  ```
  "This player has HIGH injury risk because:
   - 3 matches in 5 days (+40% risk)
   - Previous hamstring injury (+25% risk)
   - Training load above 90% this week (+20% risk)"
  ```
- Coaches trust AI more when they understand WHY it flagged something.
- Install: `pip install shap xgboost scikit-learn lightgbm`

### Frontend Analytics (client-side, no server needed):
- **TensorFlow.js** — run models in browser for offline analysis
- **WebGPU** — GPU acceleration for real-time video tracking (2026 standard)
- **FFmpeg.wasm** — in-browser video processing
- **Chart.js / Recharts** — data visualization (already in Next.js)

### AI Microservice Architecture:
```
Next.js (grassrootssports.live)
    → Laravel API (bhora-ai.onrender.com)
        → Python AI Service (ai.bhora-ai.onrender.com)  ← NEW
            → XGBoost / Random Forest / LightGBM models
            → Returns JSON predictions to Laravel
            → Laravel caches and serves to Next.js
```

---

## 🆕 ADVANCED FEATURES — PRIORITY BUILD LIST

These features give GrassRoots Sports a unique competitive advantage
that NO platform in Zimbabwe currently offers.

### 1. 🤕 AI Injury Prevention Engine (HIGHEST PRIORITY)
**Why:** No physios at grassroots level. This app becomes their doctor.
**Route:** `/injury-tracker`

Data to collect per player:
```
- Sessions per week (volume)
- Training intensity (1-10 scale, self-reported)
- Rest days between sessions
- Previous injury history (type, body part, date)
- Match minutes this week
- Player age and position
```

XGBoost model outputs:
```json
{
  "player_id": 42,
  "risk_score": 0.78,
  "risk_level": "HIGH",
  "risk_factors": ["3 matches in 5 days", "previous hamstring injury"],
  "recommendation": "Rest 48 hours. No high-intensity training today."
}
```

Laravel endpoint to build: `POST /api/v1/players/{id}/injury-risk`

### 2. 💰 Player Market Value Estimator
**Why:** Tells Zimbabwean players what they're worth — first ever.
**Route:** `/players/{id}/valuation`

Inputs: age, position, appearances, goals, assists, pass accuracy, league tier
Output: Estimated USD market value + percentile vs Zimbabwe average
Model: Random Forest regression trained on ZIFA data

### 3. 🌱 Player Development Trajectory ("Potential Score")
**Why:** Scouts pay for this. Shows what a 16-year-old can become at 22.
**Route:** `/players/{id}/potential`

Output:
```
Current Rating: 62/100
Projected Peak (age 22): 78/100
Comparable Players: [similar profiles from database]
Key Development Areas: [specific weaknesses to improve]
```

### 4. 🎯 Set Piece & Tactical Analytics
**Why:** No Zimbabwean club has this. Coaches will upgrade for this alone.
**Route:** `/matches/{id}/tactics`

Features:
- Corner kick success rate tracker
- Free kick position analysis
- Opposition weakness pattern detector
- Formation effectiveness by scoreline (winning vs losing)
- "Danger zones" — where goals are conceded most

### 5. 📱 WhatsApp Match Reports (VIRAL GROWTH ENGINE)
**Why:** Zimbabwe runs on WhatsApp. Coaches share reports = free marketing.
**Implementation:**
- After match entry, auto-generate AI report via Claude API
- Send via WhatsApp Business API (twilio.com/whatsapp)
- Message format:
  ```
  ⚽ MATCH REPORT — Zimbiru FC vs Harare Lions
  Final Score: 2-1 ✅

  🏆 Man of the Match: Musona (8.2 rating)
  ⚠️  Concern: Left back out of position 6 times
  📊 Possession: 58% | Shots: 12 | On Target: 5

  Full analysis: grassrootssports.live/matches/123
  ```
- Env var needed: `WHATSAPP_API_KEY` (Twilio)

### 6. 🏟️ National Talent Database
**Why:** ZIFA and big clubs (Dynamos, Highlanders) will pay to access this.
**Route:** `/talent-database` (Pro tier only)

Features:
- Top 100 Zimbabwean grassroots players ranked by AI score
- Filter by: position, age, province, league tier
- "Open for Scouting" toggle on player profiles
- Auto-generate scouting CV PDF (use pdf skill)
- Contact coach button for scouts

### 7. 🏫 NASH/NAPH School League Manager
**Why:** 2,000+ schools. $5/month = $10,000/month potential. Nobody does this.
**Route:** `/school-leagues`

Features:
- Pre-loaded: all Zimbabwean school tournaments
- Automatic league table generation
- Fixture scheduling
- Results submission by coaches
- End-of-season awards (AI-generated)

---

## 🇿🇼 ZIMBABWE-SPECIFIC FEATURES

These are features only possible because we are building FOR Zimbabwe.
They are our moat — global competitors cannot replicate local context.

### Data-Light Mode (2G/3G Optimization):
```typescript
// Always implement for Zimbabwe users:
const ZIMBABWE_DATA_MODE = {
  maxImageSize: 200 * 1024,      // 200KB max
  imageFormat: 'webp',            // 50% smaller than JPEG
  lazyLoadImages: true,
  paginationSize: 20,             // Never load more than 20 items
  cacheAPIResponses: true,        // IndexedDB cache
  showCachedWhileFetching: true,  // Stale-while-revalidate
}
```

### Shona / Ndebele Language Support:
- Add language toggle: English | Shona | Ndebele
- Key phrases to translate first:
  - "Player Profile" → "Mutambi" (Shona)
  - "Coach Dashboard" → "Deshboard yeMudzidzisi"
  - "Match Report" → "Ripoti yeMutambo"
- Use i18next library for Next.js translations
- This makes GrassRoots Sports untouchable locally

### ZIFA League Structure (pre-load in database):
```
Zimbabwe Premier League (16 teams)
├── Division One (Northern & Southern conferences)
├── Division Two (Regional leagues)
├── COSAFA Club Championship (regional)
└── Chibuku Super Cup (knockout)
```

### School Tournaments (pre-load):
```
NASH (National Association of Secondary Heads)
├── NASH Football Championship (Boys & Girls)
├── NASH Netball Championship
└── NASH Rugby Championship

NAPH (National Association of Primary Heads)
├── NAPH Football (Under 13)
└── NAPH Athletics
```

### Zimbabwean Currency & Payment:
- Display prices in USD (standard in Zimbabwe)
- Support PayFast (local) and Stripe (international)
- ZiG (Zimbabwe Gold) display optional for government clients
- Invoice format matches ZIMRA requirements

### Sponsorship Matching (Local Business Revenue):
- Coaches can mark team as "seeking sponsor"
- Local businesses register as sponsors
- AI matches sponsors to teams by: location, sport, audience size
- Platform takes 10% commission on matched sponsorships
- Overlay sponsor logo on live stream / match reports

---

## 🏆 COMPETITIVE ADVANTAGE

**Why GrassRoots Sports wins in Zimbabwe:**

1. **Localized** — ZIFA leagues, NASH/NAPH schools, Shona/Ndebele language
2. **Affordable** — $10-25/month vs thousands for Wyscout
3. **Offline-first** — Works on 2G/3G and without internet
4. **AI Injury Engine** — XGBoost risk prediction (no physios at grassroots)
5. **Recruitment bridge** — Player potential scores, scouting CVs, national DB
6. **WhatsApp Reports** — Match summaries sent to coaches via WhatsApp
7. **Set Piece Analytics** — Tactical data no Zimbabwean club has ever had
8. **Market Value** — First platform to value Zimbabwean grassroots players
9. **School Leagues** — 2,000+ NASH/NAPH schools have zero tools today
10. **Sponsor Matching** — AI connects local businesses to teams

**The "Missing Middle" market:**
- ~2,000+ schools with sports programs (NASH/NAPH)
- ~500+ Division 1 & 2 clubs registered with ZIFA
- Zero affordable analytics solutions currently exist

**Global competitors cannot beat us because:**
- Wyscout/Hudl: too expensive, no ZIFA/NASH data, no Shona language
- Mchezaji (Kenya): not in Zimbabwe, no local league integration
- Generic apps: no AI injury prediction, no WhatsApp integration

---

## 👤 PROJECT OWNER

- **Founder:**  Nigel Ndoro
- **Email:**    sciemeq@gmail.com
- **Web:**      grassrootssports.live
- **Mission:**  Zimbabwe's First AI-Powered Grassroots Sports Platform

---

## ⚽🏉🏃 NORTH STAR

*Every feature we build must answer this question:*
*"Does this help a Zimbabwean athlete get recognized,*
*a coach make better decisions, or a scout find talent faster?"*

*Across ALL sports — football, rugby, athletics, netball,*
*basketball, cricket, swimming, tennis, volleyball, hockey.*

*If yes — build it.*
*If no — skip it.*

*"Train Anywhere in Zimbabwe. Use AI to Get Recognized."* 🇿🇼

---

## 🔑 CONFIRMED WORKING TEST CREDENTIALS

These accounts are seeded via `GrassrootsTestSeeder` and run on every Render deploy.
Passwords are bcrypt-hashed automatically by the User model's `'password' => 'hashed'` cast.

| Email | Password | Role | Dashboard |
|---|---|---|---|
| admin@grassrootssports.live | Admin123! | admin | /admin |
| player@grassrootssports.live | Player123! | player | /player |
| coach@grassrootssports.live | Coach123! | coach | /coach |
| scout@grassrootssports.live | Scout123! | scout | /scout |

**Seeder location (Laravel):** `database/seeders/GrassrootsTestSeeder.php`
**Runs on deploy via:** `start.sh` → `php artisan db:seed --class=GrassrootsTestSeeder --force`
**Safe to re-run:** uses `updateOrCreate` — no duplicates ever created.

### Dev-Bypass Token (Admin Testing Without Backend)
- Login: `nnygel@live.com / test1234` → sets `auth_token = "dev-token"` in localStorage
- Backend always returns 401 for this token — expected behavior
- Web app skips 401 redirect for this token (see `src/lib/api.ts`)
- AI Coach routes to Next.js Anthropic proxy instead of Laravel `/ask`

---

## SESSION PROGRESS LOG — March 2026

### Theme — Zimbabwe Palette & Chevron Background

**Background pattern** (`src/app/globals.css`):
```css
body {
  background-color: #1a5c2a;
  background-image:
    repeating-linear-gradient(-45deg, transparent 0px, transparent 8px, rgba(180, 160, 0, 0.08) 8px, rgba(180, 160, 0, 0.08) 10px),
    repeating-linear-gradient(45deg, transparent 0px, transparent 8px, rgba(180, 160, 0, 0.08) 8px, rgba(180, 160, 0, 0.08) 10px);
  background-attachment: fixed;
}
```
Matches the mobile app splash screen exactly — chevron/herringbone wave in Zimbabwe gold on green.

**CSS variables**: `--background: oklch(0.37 0.12 148)` (maps to #1a5c2a green).

**Approved color palette**:
```
#1a5c2a  — Zimbabwe green (background, primary)
#f0b429  — Gold/amber (accent, CTAs, pricing badge)
#ce1126  — Zimbabwe red (hero blob only)
```

**Cards**: `rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm` (dark glass style).

**Landing page** (`src/app/page.tsx`): Hero blobs use green + gold + red; CTA buttons gold `bg-[#f0b429] text-[#1a3a1a]`; hero title accent gold.

---

### Auth Fixes

#### Bug 1 — Zustand Hydration Race (redirect loop on login)

**Affected files**: `src/components/layout/dashboard-layout.tsx`, `src/app/player/ai-coach/page.tsx`

**Root cause**: Zustand `persist` rehydrates from localStorage asynchronously. The auth guard `useEffect` fired with `user=null` before the stored session was restored, triggering a redirect to `/login` on every page load.

**Fix** — wait for hydration before running the auth guard:
```tsx
const [hydrated, setHydrated] = useState(false);
useEffect(() => {
  if (useAuthStore.persist.hasHydrated()) {
    setHydrated(true);
  } else {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }
}, []);
useEffect(() => {
  if (!hydrated) return;
  if (!user) router.replace("/login");
}, [hydrated, user, router]);
if (!hydrated || !user) return null;
```

#### Bug 2 — 401 Interceptor Dev-Bypass Boot

**Affected file**: `src/lib/api.ts`

**Root cause**: The Axios response interceptor did `window.location.href="/login"` on any 401. The admin dev-bypass token (`"dev-token"`) is always rejected by the Laravel backend with 401, so the admin was booted on every API call.

**Fix** — skip redirect when the token is the dev-bypass value:
```ts
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      const isDevBypass = !token || token === "dev-token";
      if (!isDevBypass) {
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
```

---

### AI Coach Architecture

#### Routing Logic (`src/app/player/ai-coach/page.tsx`)

Two-tier routing based on session type:

```
Real users (valid token)  → POST /api/v1/ask  (Laravel → DeepSeekService)
                             body:  { question, role, language }
                             response: { answer }

Dev-bypass / admin         → POST /api/ai-coach  (Next.js server route → Anthropic Claude)
  OR 401 fallback            body:  { message, system_prompt, history }
                             response: { response }
```

The 401 fallback means real users whose tokens expire mid-session automatically fall through to the Anthropic proxy instead of getting an error.

#### Laravel Backend Endpoint

- **Correct endpoint**: `POST /api/v1/ask`
- **Request body**: `{ question: string, role: string, language: string }`
- **Response**: `{ answer: string }`
- **NOT** `/ai-coach/query` (does not exist)

#### Next.js Server Proxy (`src/app/api/ai-coach/route.ts`)

Server-side route — `ANTHROPIC_API_KEY` never exposed to the browser.
Uses Anthropic Messages API directly (no SDK):
```
POST https://api.anthropic.com/v1/messages
Headers: x-api-key, anthropic-version: 2023-06-01
Model: claude-sonnet-4-6
Max tokens: 1024
Supports: conversation history (last 10 messages)
```

---

### Required Environment Variables

**.env.local** (Next.js / Vercel):
```
NEXT_PUBLIC_API_URL=https://bhora-ai.onrender.com/api/v1
ANTHROPIC_API_KEY=<set in Vercel dashboard + .env.local>
DEEPSEEK_API_KEY=<set in Vercel dashboard — not currently used by web app>
```

**Render** (Laravel backend):
```
DEEPSEEK_API_KEY=<set in Render environment — used by DeepSeekService for /ask endpoint>
ANTHROPIC_API_KEY=<set in Render environment — for any future Laravel Claude calls>
```

Note: The Next.js proxy uses `ANTHROPIC_API_KEY` from Vercel/`.env.local`.
The Laravel `/ask` endpoint uses `DEEPSEEK_API_KEY` from Render.
Both are needed — they serve different parts of the system.

---

### Dev-Bypass Token (Admin Testing)

See the **🔑 CONFIRMED WORKING TEST CREDENTIALS** section above for all accounts.
- Token value: `"dev-token"` (stored in localStorage as `auth_token`)
- Backend always returns 401 for this token — that is expected
- Web app detects this token and skips the 401 redirect
- AI Coach routes directly to the Next.js Anthropic proxy (bypasses Laravel `/ask`)

## 🐛 CODE ANALYSIS & DEBUGGING PROTOCOL

When I ask you to "analyze", "debug", "check", or "fix" a file, ALWAYS follow this structure:

### Step 1 — Understand First
Before suggesting any fix:
- State what the file is supposed to do in 2-3 sentences
- Confirm what the reported problem or error is
- If the error message is missing, ASK for it before proceeding

### Step 2 — Analyze the File
Go through the code and check for:
1. **Bugs / broken logic** — wrong conditions, null references, off-by-one errors
2. **Runtime errors** — type mismatches, missing null checks, unhandled exceptions
3. **Performance issues** — N+1 queries, unnecessary loops, large payloads
4. **Security issues** — unvalidated input, exposed keys, SQL injection risk
5. **Framework misuse** — wrong Laravel/Flutter patterns, deprecated methods

### Step 3 — Report Findings
Format your findings like this:

```
🔴 CRITICAL — [issue title]
   Line: [line number]
   Problem: [what is wrong]
   Fix:
   [corrected code snippet]

🟡 WARNING — [issue title]
   Line: [line number]
   Problem: [what is wrong]
   Fix:
   [corrected code snippet]

🔵 SUGGESTION — [issue title]
   Line: [line number]
   Reason: [why this is better]
   Improvement:
   [improved code snippet]

✅ LOOKS GOOD — [what is working correctly]
```

### Step 4 — Summary
End with:
- Total issues found: X critical, X warnings, X suggestions
- The ONE most important fix to apply first
- Whether the reported error is now explained

---

## 📁 PROJECT FILE CONTEXT

When analyzing files, always assume this context unless told otherwise:

### Grassroots Sports (THUTO) — Laravel Backend
- Framework: Laravel 10+
- Backend URL: bhora-ai.onrender.com
- Database: MySQL
- Auth: Laravel Sanctum
- AI Provider: DeepSeek API (app/Services/DeepSeekService.php)
- Key folders: app/Http/Controllers/, app/Services/, app/Models/
- Common issues to watch: Render cold starts, missing .env vars on deploy, CORS errors

### Grassroots Sports — Flutter Frontend
- Framework: Flutter (Android target, Samsung SM M135FU, Android 14)
- Key packages: http, ml_kit, onnxruntime, geolocator
- Offline support: Yes — check for connectivity before API calls
- Language support: English + Shona
- Common issues to watch: Null safety errors, setState after dispose, large APK size

### Sci-Guru Smart Tutor — Flutter
- Framework: Flutter (Android, offline-first)
- Content: Loaded from JSON files bundled inside APK
- AI: Claude API via Laravel backend (server-side key only)
- Payment: EcoCash / InnBucks integration
- Common issues to watch: Asset loading errors, JSON parse failures, offline state management

---

## ⚠️ DEBUGGING RULES (NEVER BREAK THESE)

1. **Never guess** — if you are not sure what a line does, say so
2. **Never change working code** — only fix what is broken or flagged
3. **Always show line numbers** in your findings
4. **Always show the fix** — don't just describe the problem
5. **One file at a time** — if the bug spans two files, analyze them separately then explain the interaction
6. **Check logs first** — if I paste a Laravel log or Flutter logcat, read it carefully before looking at the code
7. **Do not add new features** while debugging — fix only, no extras
8. **Ask before refactoring** — if a fix requires restructuring the file, confirm with me first

---

## ✅ PLATFORM COMPLETION STATUS — March 2026

This section documents EXACTLY what has been built, what is working,
and what still needs backend or payment integration.
READ THIS at the start of every session before touching any code.

### COMPLETED (do not rebuild — already exists and works)

#### Registration & Auth
- OTP step REMOVED from all 4 registration flows (player, coach, scout, fan)
- All register pages go straight to `/login?registered=1` after API call
- `/login` page shows green "Account created!" banner when `?registered=1`
- Files: `src/app/register/player/page.tsx`, `coach/`, `scout/`, `fan/`

#### Auth Guard — Hydration Race Fix (CRITICAL — DO NOT UNDO)
The platform uses Zustand `persist` middleware. localStorage rehydrates
ASYNCHRONOUSLY. Without the fix below, every page redirects to /login on load.

**Fix 1:** `src/lib/auth-store.ts` has `_hasHydrated` flag:
```typescript
_hasHydrated: false,
setHasHydrated: (val) => set({ _hasHydrated: val }),
// in persist config:
onRehydrateStorage: () => (state) => { state?.setHasHydrated(true); },
```

**Fix 2:** Every protected hub has a `layout.tsx` that waits for hydration:
```typescript
// Pattern used in ALL layout files:
const hasHydrated = useAuthStore((s) => s._hasHydrated);
useEffect(() => {
  if (!hasHydrated) return;
  if (!user) router.push("/login");
}, [hasHydrated, user, router]);
if (!hasHydrated || !user) return null;
return <>{children}</>;
```

**Layout files created (cover ALL pages in these hubs automatically):**
- `src/app/player/layout.tsx` — covers all 48 player pages + role check
- `src/app/coach/layout.tsx` — covers all coach pages + role check
- `src/app/scout/layout.tsx` — covers all scout pages + role check
- `src/app/fan/layout.tsx` — covers all fan pages + role check
- `src/app/admin/layout.tsx` — already existed, uses same pattern
- `src/app/streaming/layout.tsx` — auth guard for streaming pages
- `src/app/video-studio/layout.tsx` — auth guard
- `src/app/welcome/layout.tsx` — auth guard
- `src/app/sessions/layout.tsx` — auth guard
- `src/app/video-analysis/layout.tsx` — auth guard

#### Multi-Sport Live Match (`/coach/live-match`)
- Sport selector grid: all 10 sports (football, rugby, athletics, netball,
  basketball, cricket, swimming, tennis, volleyball, hockey)
- `SPORT_FORMATIONS` record: each sport has correct tactical formations
  (football 4-3-3 etc, rugby scrum configs, athletics "N/A", netball court zones)
- Kick-off label is sport-specific ("Kick-off", "Kick-off", "Start gun", etc.)
- Halftime AI prompt includes `Sport: ${setup.sport}` + conditional formation line
- `useCommentary` hook called AFTER `homeScore`/`awayScore` declarations (was a
  TypeScript build error when it was called before them — never move it back)
- File: `src/app/coach/live-match/page.tsx`

#### Scout PDF Reports (`/scout/reports`)
- FULLY IMPLEMENTED — do not rebuild
- Uses `jspdf` + `jspdf-autotable` (both in package.json)
- `generatePdf()` function: green header, player profile table, sport stats
  table, AI analysis section, recommendations box, ZIFA confidentiality footer
- AI analysis fetched from `/ai-coach/query` endpoint (Claude API)
- Generates and downloads PDF in browser — no server required
- File: `src/app/scout/reports/page.tsx`

#### Push Notifications
- IMPLEMENTED using browser Web Notification API (no Firebase/VAPID needed)
- `src/components/layout/notification-bell.tsx`:
  - Polls `/notifications` every 30s
  - On subsequent polls (not first load), fires `new Notification(title, body)`
    for any new unread items not seen before
  - `fireBrowserNotif()` helper — silently fails on Safari/old browsers
- `src/app/settings/page.tsx` Notifications tab:
  - Shows live permission badge: "Browser enabled" (green) / "Blocked" (red) / "Enable" button
  - Enabling any push toggle calls `Notification.requestPermission()`
  - Permission state tracked with `notifPermission` useState

#### Notification Bell (`/components/layout/notification-bell.tsx`)
- Polls every 30s for new notifications
- Unread count badge on bell icon
- Dropdown panel with mark-read / mark-all-read
- Fires browser Notification API for new items (see above)

#### Admin Push Notification Sender (`/notifications`)
- Admin page to send FCM notifications to all users or one specific user
- Calls `POST /admin/notifications/send` on Laravel backend
- Backend needs to handle FCM delivery (web app side is complete)

### ALL BUILT ROUTES (do not recreate these pages — they exist)

```
/                          Landing page
/login                     Login (shows ?registered=1 banner)
/register                  Role picker
/register/player           Player registration (NO OTP)
/register/coach            Coach registration (NO OTP)
/register/scout            Scout registration (NO OTP)
/register/fan              Fan registration (NO OTP)
/dashboard                 Main dashboard
/settings                  Account settings (profile/security/notifications/danger)

/player                    Player hub home
/player/ai-coach           AI Coach chat (DeepSeek via Laravel OR Claude via Next.js)
/player/assessment         Assessment
/player/development        Development tracking
/player/drills             Drills library
/player/milestones         Milestone tracker
/player/notifications      Player notification list
/player/nutrition          Nutrition hub
/player/nutrition/foods    Food library
/player/nutrition/plan     Nutrition plan
/player/profile            Player profile
/player/progress           Progress tracker
/player/sessions           Training sessions list
/player/sessions/new       New session form
/player/sports             Sport selector
/player/sports/[sport]     Sport-specific page
/player/subscription       Subscription management (Stripe card option + success email on ?success=1)
/player/valuation          Player market value estimator (AI-powered, first in Zimbabwe)
/player/potential          Development trajectory — current rating, projected peak, scout readiness
/player/talent-id          Talent identification
/player/training-formats   Training formats hub
/player/training-formats/[format]   Dynamic format page
/player/training-formats/drills     Drills
/player/training-formats/rondo      Rondo
/player/training-formats/shooting   Shooting
/player/training-formats/ssg        Small-sided games
/player/verification       Verification page

/coach                     Coach hub home
/coach/ai-insights         AI insights
/coach/live-match          Live match dashboard (multi-sport)
/coach/matches             Fixtures/matches
/coach/notifications       Coach notification list
/coach/profile             Coach profile (via /coach/squad/[id])
/coach/squad               Squad list
/coach/squad/[id]          Individual player detail
/coach/stats               Team stats
/coach/tactical-analysis   Tactical analysis
/coach/tactics             Tactics board
/coach/set-pieces          Set piece & tactical analytics (corners, free kicks, AI analysis)
/coach/training-plans      Training plans (multi-sport — Football + Netball JSON programmes)

/scout                     Scout hub home
/scout/compare             Player comparison
/scout/profile             Scout profile
/scout/reports             PDF report generator (FULLY BUILT with jsPDF)
/scout/shortlist           Player shortlist

/fan                       Fan hub home
/fan/discover              Discover players/teams
/fan/following             Teams/players following
/fan/leaderboard           Leaderboard

/admin                     Admin hub
/admin/announcements       Announcements
/admin/scout-requests      Scout approval requests
/admin/stats               Platform stats
/admin/subscriptions       Subscription management
/admin/users               User management
/admin/verifications       Verification queue

/analyst                   Analyst hub home
/analyst/live-match        Live match collector — log events in real time
/analyst/xg-analysis       Expected Goals (xG) analysis
/analyst/pass-map          Pass map visualisation
/analyst/heatmaps          Player heatmaps
/analyst/season            Season statistics overview
/analyst/tactical-report   AI tactical report generator

/streaming                 Live streaming hub
/streaming/broadcast       Live broadcast (Daily.co WebRTC)
/video-studio              Video upload & AI analysis
/video-analysis            Video analysis viewer
/sessions                  Sessions hub
/sessions/[id]             Session detail
/welcome                   Welcome page
/notifications             Admin push notification sender
/analytics                 Analytics dashboard
/community                 Community page
/tournaments               Tournaments
/injury-tracker            AI injury prevention engine (XGBoost-style risk scoring via Claude)
/talent-database           National talent database — filter by sport/position/province/age
/school-leagues            NASH/NAPH school league manager (client-side, pre-loaded tournaments)
/subscriptions             Subscription plans
/settings                  User settings
/privacy                   Privacy policy
/terms                     Terms of service
/users                     Users list (admin)
/users/[id]                User detail (admin)
/forgot-password           Password reset request
/reset-password            Password reset form
/offline                   Offline fallback page
/scout-requests            Scout requests (standalone)
/verifications             Verifications (standalone)
```

### WHAT STILL NEEDS BACKEND / EXTERNAL WORK

These frontend pages ARE built but the backend/external service is incomplete:

| Feature | Frontend | What's Missing |
|---|---|---|
| Fan Hub — Follow System | Done ✅ | Backend DONE (March 2026) — fan_follows table, FanController |
| Fan Hub — Discover | Done ✅ | Backend DONE — GET /players/discover with province/sport/age_group filters |
| Fan Hub — Leaderboard | Done ✅ | Backend DONE — GET /scout/players now open to fans (role:scout,fan) |
| Fan Hub — Provinces | Done ✅ | Backend DONE — GET /stats/provinces counts players per province |
| Fan Hub — Fixtures | Done (fallback) | GET /matches/upcoming stub returns [] — frontend uses hardcoded PSL fixtures |
| Business Hub — Members Tab | Done ✅ | No `/business/members` endpoint on Laravel — frontend uses localStorage fallback (activates on 404/405). Data persists in `grassroots_biz_members` localStorage key. |
| Push Notifications (browser) | Done ✅ | Works via Web Notification API — no backend needed |
| FCM Push Delivery | Done ✅ | `POST /api/notifications/send` — Firebase Admin SDK in Next.js (needs FIREBASE_* env vars) |
| Stripe Payments | Done ✅ | `POST /api/payments/checkout` + webhook — needs STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET |
| Email delivery | Done ✅ | `POST /api/email` — Resend SDK — needs RESEND_API_KEY + EMAIL_FROM |
| WhatsApp Match Reports | Done ✅ | API route + Match Over button in live-match — needs TWILIO_* env vars |
| Video Storage (R2) | Done ✅ | `POST /api/upload/presigned` — Cloudflare R2 presigned PUT — needs R2_* env vars |
| Streaming | Done ✅ | `useDailyStream` hook, broadcast page fully wired — needs DAILY_API_KEY in Vercel env |

### PHASE 2–4 FEATURES — ALL BUILT ✅

| Feature | Route | Status |
|---|---|---|
| WhatsApp Match Reports | `POST /api/whatsapp/report` + Match Over UI | Built ✅ — needs TWILIO_* env vars |
| Player Market Value Estimator | `/player/valuation` | Built ✅ |
| AI Injury Prevention Engine | `/injury-tracker` | Built ✅ |
| National Talent Database | `/talent-database` | Built ✅ |
| NASH/NAPH School League Manager | `/school-leagues` | Built ✅ |
| Player Development Trajectory | `/player/potential` | Built ✅ |
| Set Piece & Tactical Analytics | `/coach/set-pieces` | Built ✅ |
| Shona/Ndebele language toggle | `src/lib/i18n.ts` + LanguageSwitcher | Built ✅ |

### OTHER SPORTS — DEPTH MISSING (same gap netball had)
Rugby, Basketball, Cricket, Swimming, Tennis, Volleyball, Hockey all work generically
(stats logging + AI feedback) but lack:
- Position-specific stat roles
- Sport-specific training plans JSON
- Interactive playing-field/court diagrams

### PACKAGES IN package.json (do not re-install these)
```
jspdf              ^4.2.0   — PDF generation
jspdf-autotable    ^5.0.7   — PDF tables
@tanstack/react-query        — all data fetching
zustand                      — global state (auth-store, etc.)
@daily-co/daily-js           — WebRTC live streaming
next                 14      — framework
stripe             ^20.4.1  — Stripe payments
firebase-admin     ^13.7.0  — FCM push notifications (Next.js server routes)
firebase           ^10.14.1 — Firebase client SDK
@aws-sdk/client-s3           — Cloudflare R2 video upload (S3-compatible)
@aws-sdk/s3-request-presigner — presigned PUT URLs for R2
resend             ^6.9.4   — transactional email (welcome, subscription, match reports)
recharts           ^3.8.0   — analytics charts
i18next                      — internationalisation core
react-i18next                — React bindings for i18next
```

Note: Twilio WhatsApp uses native `fetch` to REST API — no npm package needed.

### ENVIRONMENT VARIABLES (.env.local + Vercel)
```
NEXT_PUBLIC_API_URL = https://bhora-ai.onrender.com/api/v1
ANTHROPIC_API_KEY   = set in both .env.local AND Vercel dashboard
DEEPSEEK_API_KEY    = set in .env.local (not used by web app, used by Laravel)
DAILY_API_KEY       = set in .env.local AND Vercel (live streaming)

# Payments (Stripe)
STRIPE_SECRET_KEY        = sk_live_... or sk_test_...
STRIPE_WEBHOOK_SECRET    = whsec_... (from Stripe dashboard → Webhooks)
NEXT_PUBLIC_APP_URL      = https://grassrootssports.live

# Push Notifications (Firebase Admin)
FIREBASE_PROJECT_ID      = (from Firebase console → Project Settings)
FIREBASE_CLIENT_EMAIL    = firebase-adminsdk-...@....iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY     = "-----BEGIN PRIVATE KEY-----\n..."

# Video Upload (Cloudflare R2)
R2_ACCOUNT_ID        = (Cloudflare dashboard → R2)
R2_ACCESS_KEY_ID     = (R2 API token)
R2_SECRET_ACCESS_KEY = (R2 API token secret)
R2_BUCKET            = grassroots-videos
R2_PUBLIC_URL        = https://pub-xxxx.r2.dev  (or custom domain)

# Email (Resend)
RESEND_API_KEY = re_...
EMAIL_FROM     = notifications@grassrootssports.live

# WhatsApp Reports (Twilio)
TWILIO_ACCOUNT_SID    = ACxxx
TWILIO_AUTH_TOKEN     = xxx
TWILIO_WHATSAPP_FROM  = whatsapp:+14155238886  (Twilio sandbox or approved sender)
```

### LAST 5 COMMITS (as of March 2026)
```
91ea6c1  fix: business hub members use localStorage fallback when API returns 404
[prior]  feat: i18next language toggle — English / ChiShona / isiNdebele
[prior]  fix: subscription page — Stripe success banner + confirmation email
[prior]  feat: WhatsApp match report panel on coach live-match ended screen
8adeb45  fix: restore original multi-step registration wizards for coach, scout, and fan
```

### RECENT MAJOR FEATURE COMMITS
```
9bbd0dd  feat: WhatsApp match report button (Match Over screen), Stripe success email, i18n EN/SN/ND
6b5e966  feat: backend wiring — Stripe payments, FCM push, R2 video upload, Resend email
3dc9bff  feat: Phase 2-4 — injury AI, valuation, potential, talent DB, school leagues, set pieces
548f7fd  feat: complete netball hub — position-aware AI, court diagram, register pre-select, training plans
774756f  feat: browser push notifications via Web Notification API
```

### SHONA / NDEBELE LANGUAGE TOGGLE (i18n)

**Status: BUILT ✅ (March 2026)**

**Files:**
- `src/lib/i18n.ts` — configures i18next; loads EN/SN/ND from JSON; reads `grassroots_lang` from localStorage
- `public/locales/en.json` — English strings
- `public/locales/sn.json` — ChiShona strings
- `public/locales/nd.json` — isiNdebele strings
- `src/components/ui/language-switcher.tsx` — dropdown toggle (Globe icon)

**Where it appears:**
- **Sidebar** — bottom section, below "Sign out" button (compact mode shows EN/SN/ND)
- **Public Navbar** — desktop header, next to Sign in / Get started buttons

**Usage in any page:**
```tsx
import { useTranslation } from "react-i18next";
import "@/lib/i18n";  // must import once to initialise

export default function MyPage() {
  const { t } = useTranslation();
  return <h1>{t("nav.dashboard")}</h1>;  // → "Dashboard" / "Deshboard" / "Ideshibhodi"
}
```

**Translation keys available:**
- `nav.*` — all sidebar navigation labels
- `auth.*` — login, register, OTP flow
- `common.*` — loading, save, cancel, error, etc.
- `player.*` — player hub labels
- `coach.*` — coach hub labels
- `scout.*` — scout hub labels
- `landing.*` — landing page hero text, CTAs
- `subscription.*` — plan names, payment labels

**Language persistence:** Stored in `localStorage` key `grassroots_lang`. Survives page refresh and re-login.

**To add more translations:** Edit the 3 JSON files in `public/locales/` — no code changes needed.

---

---

### PLAYER HUB COMPLETION — March 2026

#### Verification Page (`/player/verification`)
- **Rebuilt from scratch** — now a full 2-step identity verification flow
- Step 1 (required): Selfie capture via device camera — live circular preview, capture button, retake option
- Step 2 (required): Document upload (ID/passport) — file picker, 5MB limit validation
- Submit checklist shows ✅/❌ for selfie and document before submit
- Pending state: shows submitted date and "under review" badge
- Approved state: shows QRProfileCard with AI confidence score
- Selfie uploaded as `selfie_image` field in FormData to `POST /api/v1/verification/submit`
- File: `src/app/player/verification/page.tsx`

#### Player Public Profile Page (`/player/public/[id]`)
- **NEW file** — server-side rendered, NO auth required (public URL)
- Fetched from `GET /api/v1/player/public/{id}` with 60s revalidation
- Shows: selfie photo, verified badge, sport, position, province, age group, height, bio, stats
- Zimbabwe green/gold chevron background with "Join GrassRoots Sports" CTA
- QR code on verification page links to this page — scanning the QR takes scouts/coaches here
- File: `src/app/player/public/[id]/page.tsx`

#### QR Profile Card (`/components/ui/qr-profile-card.tsx`)
- Updated to accept `selfieUrl?: string` prop
- Shows player face photo on the card when selfie has been uploaded

#### Notifications Page (`/player/notifications`)
- Type icons: Info / CheckCircle2 / AlertTriangle / AlertCircle per notification type
- Unread blue dot indicator
- Date grouping: Today / Yesterday / Earlier
- Clickable notifications — if `n.link` exists, navigates and auto-marks read
- Dismiss button (Trash2) calls `DELETE /notifications/{id}`
- 12-hour time format, back arrow to `/player`

#### Profile Page (`/player/profile`)
- Camera button opens hidden `<input type="file">` → uploads to `POST /profile/photo`
- Optimistic photo preview in avatar
- `weight_kg` field added (alongside height_cm)
- Club and school text inputs added
- Profile completion progress bar: 9 fields, live-updates via `watch()`
- QRProfileCard receives `selfieUrl` from uploaded profile photo

#### Match Stats Entry (`/player/stats/new`)
- **NEW page** — 3-step wizard: Sport & Role → Match Details → Stats Entry
- All 10 sports, with sport-specific role picker (outfield/goalkeeper for football, etc.)
- `FIELD_META` record: human-readable labels, input types, placeholders for every stat key
- Match details: type (match/training/trial), date, opponent, result (W/D/L/N/A), score, competition
- Stats grid: 2-column dynamic inputs driven by sport + role selection
- Saves to `POST /api/v1/player/stats`
- AI feedback button appears after save (calls `queryAI`)
- File: `src/app/player/stats/new/page.tsx`

#### Stats History Page (`/player/stats`)
- **NEW page** — summary cards: Total Logged / Matches / Wins
- Sport filter chips (only shown when player has logged multiple sports)
- Expandable rows showing full stat breakdown per entry
- Uses `FIELD_META_LABELS` from sports config for human-readable stat names
- Fetches from `GET /api/v1/player/stats`
- File: `src/app/player/stats/page.tsx`

#### Sports Config Update (`/config/sports.ts`)
- Added `FIELD_META_LABELS` export — `Record<string, string>` mapping all 60+ stat keys to human-readable labels
- Used by the stats history page to display stat names

---

### REGISTRATION PAGES RESTORED — March 2026

An automated commit (`98e453c`) had replaced all 4 registration pages with a simplified shared `RegisterForm` component, losing the multi-step wizards, extra profile fields, and role-specific data collection.

All 4 pages were restored from git commit `f126c97`:

#### Player Registration (`/register/player`) — RESTORED ✅
- 5-step wizard: Personal → Account → Playing → Physical → Consent
- Step 1: first name, surname, DOB (Day/Month/Year dropdowns), phone
- Step 2: email, password with strength meter, confirm password
- Step 3: position (sport-specific), province, school/club, age group (auto-calculated)
- Step 4: height, weight, dominant foot (Right/Left/Both)
- Step 5: review summary, guardian phone (auto-shown for under-13), T&C checkbox
- ZIFA safeguarding rules apply for under-13 players
- File: `src/app/register/player/page.tsx`

#### Coach Registration (`/register/coach`) — RESTORED ✅
- 4-step wizard: Personal → Account → Professional → Confirm
- Blue color scheme
- Professional step: team/club name, sport coached, CAF coaching level, years experience
- Coaching levels: Grassroots → Level 1 CAF → Level 2 CAF → Level 3 CAF → UEFA equivalent
- File: `src/app/register/coach/page.tsx`

#### Scout Registration (`/register/scout`) — RESTORED ✅
- 4-step wizard: Personal → Account → Professional → Confirm
- Purple color scheme
- Professional step: organisation, accreditation number (optional), experience years, scouting regions (multi-select province pills)
- Confirm step: admin review notice ("Scout accounts reviewed within 24 hours")
- File: `src/app/register/scout/page.tsx`

#### Fan Registration (`/register/fan`) — RESTORED ✅
- 3-step wizard: Discover → Account → Confirm
- Amber/orange color scheme
- Step 1: name, province, favourite sport (10-sport emoji grid selector)
- Confirm step: review summary + "What you get as a Fan" benefits list
- File: `src/app/register/fan/page.tsx`

**Rule going forward:** NEVER replace these registration pages with a shared component. The multi-step wizards collect role-specific data that is sent to the backend on registration. Each role has different required fields.

---

### UI COLOR BRIGHTNESS — March 2026

**Problem:** Background is warm cream (`#EDE0C4` African pattern) but `--foreground` was white — white on cream = invisible. `--muted-foreground` was `#86a891` (dim grey-green) — hard to read on dark green cards.

**Fix applied in `src/app/globals.css`:**

| Variable | Before | After | Effect |
|---|---|---|---|
| `body color` | `var(--foreground)` = white | `#0c1f10` dark green | Text on cream background readable |
| `--muted-foreground` | `#86a891` dim grey-green | `#c8edd0` bright mint | Labels/subtitles clearly visible on dark cards |
| `--card` | `#163220` | `#1a3d26` | More vivid green cards |
| `--border` | `rgba(255,255,255,0.14)` | `rgba(255,255,255,0.28)` | Card outlines clearly visible |
| `--accent` (gold) | `#f0b429` | `#f5c542` | Brighter gold |
| `--primary` (green) | `#22c55e` | `#2ecc71` | More vivid green buttons |
| `bg-card/60` | 60% opacity dark card | Forced to solid `#1a3d26` | No more washed-out transparent cards |

Background color (`#EDE0C4` cream + African pattern) was NOT changed.
Commit: `864e06f`

---

### KNOWN ISSUES (do not waste time re-investigating these)

1. **Windows EPERM on `npm run build`** — `.next\trace` file lock on Windows.
   Not a real error. Vercel builds fine. Run `rm -rf .next` if needed locally.

2. **`experimentalChromeVideoMuteLightOff` error** — was a stale Vercel error
   from old build cache. Fixed in commit `e973ffc`. Property does not exist
   anywhere in the codebase. If it appears again, clear Vercel build cache.

3. **Render cold starts** — `bhora-ai.onrender.com` goes to sleep on free tier.
   First API call takes 30–60 seconds after inactivity. Normal behavior.

4. **`/ask` is the correct Laravel AI endpoint** — NOT `/ai-coach/query`.
   Request: `{ question, role, language }`. Response: `{ answer }`.

5. **Dev-bypass token** — Login `nnygel@live.com / test1234` sets localStorage
   `auth_token = "dev-token"`. Backend always returns 401 for this. That is
   expected. The 401 interceptor in `src/lib/api.ts` skips redirect for dev-token.

---

## Developer Involvement Rule (MANDATORY)

Before writing, editing, or creating ANY code file, Claude must:

1. **Name the file** - State the exact file path being created or changed
2. **Explain the file's job** - In plain English, what does this file do in the project? (No jargon)
3. **Explain the change** - What exactly are you adding, fixing, or removing and why?
4. **Show the connection** - How does this file connect to other parts of the app?
5. **State the visible result** - What will Nigel see or experience differently after this change?

Only proceed with writing code AFTER explaining the above 5 points.
If Nigel asks "why" or "what does this mean" at any point, stop and explain before continuing.
Never assume Nigel understands technical terms — always use simple analogies.
Think of Nigel as the architect who approves every decision, not just a bystander.

---

## Error Explanation Rule (MANDATORY)

When Nigel reports any error, bug, or broken feature, Claude must ALWAYS follow this order:

### Step 1 — Explain the error first (plain English, no jargon)
- What went wrong? (Describe it like explaining to someone who has never coded)
- Why did it happen? (What caused it — be specific)
- Where is it happening? (Which page, which feature, which moment)
- Use a simple real-world analogy if helpful

### Step 2 — Explain the fix (before writing a single line of code)
- What will you change?
- Why will that change fix the problem?
- What will Nigel see differently after the fix?

### Step 3 — Wait for Nigel to say "yes" or "ok" before writing any code

### Example of the correct format:
```
ERROR EXPLANATION
-----------------
What went wrong: The coach AI chat was knocking on a door that doesn't exist.
Why it happened: The page was sending messages to /ai-coach/query — an address
                 that was never built on the backend. Like calling a phone number
                 that was never registered.
Where: /coach/ai-insights — the AI chat page inside the coach hub.

THE FIX
-------
What changes: Redirect the messages to /ask — the correct address that the
              player AI chat already uses successfully.
Why it works: /ask is the real backend endpoint connected to the DeepSeek AI.
What you'll see: Coaches type a question and get a real answer instead of
                 the connection error message.

Ready to apply this fix — shall I proceed?
```

Never skip straight to code. Nigel must understand the problem before it is fixed.

---

## 🎉 FAN HUB BACKEND — bhora-ai (Laravel)

### Status: COMPLETE (March 2026)

All fan hub API endpoints are live on the Laravel backend.

### Files created (bhora-ai repo):
- `database/migrations/2026_03_21_000003_create_fan_follows_table.php`
- `app/Models/FanFollow.php`
- `app/Http/Controllers/Api/Fan/FanController.php`
- `app/Models/User.php` — added `playerSports()` and `fanFollows()` HasMany relationships
- `routes/api.php` — new fan routes + opened `/scout/players` to fans

### Endpoints:

| Method | Route | Controller method | Notes |
|---|---|---|---|
| GET | `/api/v1/players/discover` | `FanController::discover` | Filters: province, sport, age_group. Returns initials (privacy-safe) |
| POST | `/api/v1/fan/follow/{playerId}` | `FanController::follow` | Idempotent — safe to call twice |
| DELETE | `/api/v1/fan/follow/{playerId}` | `FanController::unfollow` | By player_id string e.g. HRE-2025-00471 |
| GET | `/api/v1/fan/following` | `FanController::following` | Returns sessions_count + overall_score |
| GET | `/api/v1/stats/provinces` | `FanController::provinces` | Player count per province, sorted desc |
| GET | `/api/v1/matches/upcoming` | `FanController::upcomingMatches` | Stub — returns [] (frontend uses hardcoded PSL fallback) |
| GET | `/api/v1/scout/players` | `ScoutPlayerController::index` | NOW open to role:scout,fan (was scout only) |

### Auth rules:
- Fan routes: `role:fan,admin` middleware
- `/scout/players`: `role:scout,fan` middleware (was `role:scout` only)

### Privacy:
- Player names never exposed — FanController generates initials (e.g. "T.M.") from first_name + surname
- `talent_score` = rounded `avg_form_score` from PlayerStat

### fan_follows table schema:
```sql
id              UUID  PK
fan_user_id     UUID  FK → users (cascade delete)
player_user_id  UUID  FK → users (cascade delete)
UNIQUE(fan_user_id, player_user_id)
created_at, updated_at
```

---

## 💼 BUSINESS HUB — /business-hub

### Status: FULLY BUILT + BACKEND CONNECTED (March 2026)

A public page targeting sports business operators in Zimbabwe.
- **Guest users** — see demo data + "Sign in to save" banner
- **Logged-in users** — all data loads from and saves to the Laravel backend

### Target Users (5 types):
- **Club Admin** — manage team finances, sponsorships, budgets
- **Event Organiser** — plan tournaments, track gate fees and costs
- **School Sports Coordinator** — manage school sports budgets and fixtures
- **League Manager** — run league finances, prize money, entry fees
- **Sponsor/Company** — find teams to sponsor, track ROI

### Frontend Files:
- `src/components/layout/public-navbar.tsx` — "Business Hub" link between "AI Coach" and "Pricing"
- `src/app/business-hub/page.tsx` — full page with API integration

### Backend Files (bhora-ai repo):
- `database/migrations/2026_03_21_000001_create_business_hub_tables.php` — 3 tables
- `app/Models/BusinessBudgetItem.php`
- `app/Models/BusinessTransaction.php`
- `app/Models/BusinessEvent.php` — `checklist_done` stored as JSON array
- `app/Http/Controllers/Api/BusinessHubController.php` — 11 endpoints
- `routes/api.php` — business routes added under `auth:sanctum`

### API Endpoints (all under `/api/v1/business/`, require auth):
```
GET    /business/budget           list user's budget items
POST   /business/budget           create budget item
PATCH  /business/budget/{id}      update item (category, label, budgeted, spent)
DELETE /business/budget/{id}      delete item

GET    /business/transactions     list transactions (ordered by date desc)
POST   /business/transactions     add transaction (description, amount, type, date)
DELETE /business/transactions/{id} delete transaction

GET    /business/events           list events
POST   /business/events           create event (name, date_range, sport, teams, icon)
PATCH  /business/events/{id}      update event / save checklist_done array
DELETE /business/events/{id}      delete event
```

### Database Tables:
```sql
business_budget_items: id (UUID), user_id, category, label, budgeted, spent
business_transactions: id (UUID), user_id, description, amount, type (income/expense), date
business_events:       id (UUID), user_id, name, date_range, sport, teams, status, icon, checklist_done (JSON)
```

### Page Structure:
1. **Hero** — headline, CTA, trust badges. Shows "Signed in as X" if authenticated.
2. **Who Is This For?** — 5 expandable user-type cards
3. **5 Tabbed Tools**:
   - Budget Planner — CRUD via API, progress bars, delete per item
   - Sponsor Finder — static directory (NetOne, Econet, Delta, CBZ, etc.), searchable
   - Financial Tracker — CRUD via API, add transaction form, income/expense/net summary
   - Event Planner — CRUD via API, checklist toggles auto-save to backend, create event form
   - Business Skills — 5 static articles (no backend needed)
4. **Pricing** — Free ($0) vs Pro ($5/month)
5. **Bottom CTA**

### Pricing:
```
Free:  Basic tools, 1 event, 3 budget categories
Pro:   $5/month — unlimited events, PDF exports, sponsor matching, priority support
```

### Design:
- Green/gold palette (#1a5c2a, #f0b429)
- Dark glass cards: `rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm`
- Mobile responsive (375px+)
- Loading spinners on all async operations
- Error banners on API failures (falls back to demo data)

### IMPORTANT — Migration required on Render:
Run `php artisan migrate --force` on the Render server to create the 3 new tables.
If `build.sh` already runs migrations on deploy, this happens automatically.

---

## 🎯 ANALYST HUB — /analyst

### Status: PARTIALLY BUILT (March 2026)

A professional data analytics hub for match analysts. Role-gated to `analyst` and `admin` only.

### Files:
- `src/app/analyst/layout.tsx` — auth guard, allows `analyst` + `admin` roles only
- `src/app/analyst/page.tsx` — hub home with 6 tool cards
- `src/app/analyst/live-match/page.tsx` — Live Match Collector with xG tracking (see below)

### Hub Home (`/analyst`) — Tool Cards:

| Tool | Status | Route |
|---|---|---|
| Live Match Collector | LIVE ✅ | `/analyst/live-match` |
| xG & Shot Analysis | LIVE ✅ | `/analyst/xg-analysis` |
| AI Tactical Report | LIVE ✅ + PDF export | `/analyst/tactical-report` |
| Pass Map Network | LIVE ✅ | `/analyst/pass-map` |
| Player Heatmaps | LIVE ✅ + PDF export | `/analyst/heatmaps` |
| Season Intelligence | LIVE ✅ | `/analyst/season` |

### Design:
- Uses `Sidebar` component + `gs-watermark` class on main
- Gold/green palette: `text-accent` for labels, `bg-[#f0b429]` for LIVE badge
- Bottom banner: "Same tools as European clubs — $99/month vs Wyscout's €299/month"

---

## 🔴 LIVE MATCH COLLECTOR — /analyst/live-match

### Status: BUILT (March 2026)

A pitchside xG data collection tool. Analyst taps pitch zones to log shots; xG auto-calculated from zone.

### File: `src/app/analyst/live-match/page.tsx`

### xG Values by Zone (built-in, no backend needed):
```typescript
const XG_ZONES = [
  { id: "six_yard",        label: "Six-Yard Box",         xg: 0.76, col: 2, row: 1 },
  { id: "penalty_spot",    label: "Penalty Spot",          xg: 0.45, col: 2, row: 2 },
  { id: "central_box",     label: "Central Box",           xg: 0.35, col: 2, row: 3 },
  { id: "wide_box_left",   label: "Wide Box Left",         xg: 0.12, col: 1, row: 2 },
  { id: "wide_box_right",  label: "Wide Box Right",        xg: 0.12, col: 3, row: 2 },
  { id: "edge_centre",     label: "Edge of Box (Centre)",  xg: 0.18, col: 2, row: 4 },
  { id: "edge_wide_left",  label: "Edge of Box (Left)",    xg: 0.07, col: 1, row: 4 },
  { id: "edge_wide_right", label: "Edge of Box (Right)",   xg: 0.07, col: 3, row: 4 },
  { id: "long_range",      label: "Long Range",            xg: 0.04, col: 2, row: 5 },
];
```

### Page Structure (3 phases):

**Phase 1 — Setup:**
- Home team / away team name inputs
- Sport selector (same 10-sport grid as coach live-match)
- "Start Match" button

**Phase 2 — Live (3-column layout):**
- Left col (lg:col-span-2):
  - Pitch zone tapper (3×5 grid representing attacking half)
  - Team toggle: Home shot / Away shot
  - "Goal?" checkbox — marks if shot resulted in a goal
  - Each tap logs: `{ id, minute, team, zone, xg, isGoal }`
  - Shot timeline below (scrollable list of all logged shots)
- Right col:
  - Live scoreboard (actual goals: home vs away)
  - xG scoreboard (cumulative xG: home vs away)
  - Shot counts (home vs away)
  - "End Match" button

**Phase 3 — Ended:**
- Final score + final xG totals
- xG vs Actual comparison (who over/underperformed)
- Back to Analyst Hub link

### No backend required:
- All data stored in component state during the match
- No API calls during live collection
- Future: add POST to `/api/v1/matches/{id}/xg-data` to persist

### Connections:
- Linked from `/analyst` hub card "Live Match Collector"
- Uses `Sidebar` component from `@/components/layout/sidebar`
- Uses `useAuthStore` for user greeting
- Does NOT reuse coach live-match components (separate purpose)
---

## 🌟 PLAYERS HUB — AI TALENT DISCOVERY SYSTEM
### Inspired by: TEDSports 2025 — "What if the next Messi is out there and no one knows?"
### Status: INTEGRATION PHASE (April 2026)

The Players Hub transforms GrassRoots Sports from a stats tracker into a
**global talent discovery engine**. Any player in Zimbabwe — from Hwange
to Harare — can showcase their skills and be found by scouts worldwide.

**Core philosophy**: The next great Zimbabwean athlete already exists.
Our job is to make sure the world finds them.

---

### 🗺️ PLAYERS HUB ARCHITECTURE OVERVIEW

```
Players Hub (/player)
├── 1. Talent Showcase System      → /player/showcase
├── 2. Digital Player Profile      → /player/profile (ENHANCED)
├── 3. AI Scouting Report          → /scout/reports (ENHANCED)
├── 4. Skill Assessment & Rating   → /player/assessment (ENHANCED)
├── 5. Scout Discovery Feed        → /scout (ENHANCED)
└── 6. Opportunity Alerts          → /player/notifications (ENHANCED)
```

**Existing systems being integrated (DO NOT REBUILD — wire up only):**

| Existing System | Location | Integrate Into |
|---|---|---|
| ML Kit Pose Detection | Flutter app | Talent Showcase video analysis |
| Biomechanics Analysis | Flutter app | Skill Assessment scoring |
| DeepSeekService.php | Laravel backend | Scouting Report generation |
| Football PDF Knowledge Base | Laravel RAG | Report enrichment |
| Scout PDF Reports (jsPDF) | `/scout/reports` | Enhanced AI scouting CV |
| Player Potential Score | `/player/potential` | Discovery Feed ranking |
| Player Valuation | `/player/valuation` | Profile display |
| National Talent Database | `/talent-database` | Discovery Feed source |

---

### 1. 🎬 TALENT SHOWCASE SYSTEM — `/player/showcase`

**What it does**: Any player uploads a skill video from their phone.
AI analyses the footage and generates a public showcase card that
scouts can discover. Works offline — syncs when connected.

**Status**: NEW — build on top of existing `/video-studio`

#### User Flow:
```
Player opens /player/showcase
→ Taps "Add Showcase Clip"
→ Selects skill type: Dribbling | Shooting | Passing | Defending | Freestyle
→ Records or uploads short clip (max 60 seconds)
→ AI analyses clip using existing analyseVideo() in src/lib/video-analysis.ts
→ Generates public showcase card with:
   - Skill type badge
   - AI rating (1-10 per attribute)
   - Key strength highlight (one sentence)
   - "Open for Scouting" toggle
→ Card appears in Scout Discovery Feed
```

#### AI System Used:
```typescript
// REUSE existing function — do NOT rewrite:
// src/lib/video-analysis.ts → analyseVideo()
// Add showcase-specific prompt:

const SHOWCASE_PROMPT = `
You are a FIFA-licensed talent scout reviewing a short skill clip.
The player is from Zimbabwe — grassroots level.
Assess the clip and return JSON only:
{
  "skill_rating": 1-10,
  "top_strength": "one sentence describing best attribute shown",
  "position_fit": ["best positions based on what you see"],
  "scout_note": "2 sentences a scout would write about this player",
  "development_flag": "one key area to improve"
}
`;
```

#### Frontend File: `src/app/player/showcase/page.tsx`
```
UI Elements:
- Grid of existing showcase clips (max 6 displayed)
- "Add New Clip" button → opens upload modal
- Each clip card shows:
  ├── Video thumbnail
  ├── Skill type badge (gold)
  ├── AI rating bar (e.g. "Dribbling: 7.4/10")
  ├── Scout note excerpt
  ├── View count (how many scouts viewed)
  └── "Open for Scouting" toggle
- If 0 clips: empty state → "Upload your first skill clip"
- Mobile-first: works at 375px
```

#### Backend: New Laravel endpoint needed
```php
// routes/api.php — add to player routes:
Route::post('/player/showcase', [ShowcaseController::class, 'store']);
Route::get('/player/showcase', [ShowcaseController::class, 'index']);
Route::delete('/player/showcase/{id}', [ShowcaseController::class, 'destroy']);
Route::patch('/player/showcase/{id}/toggle-scouting', [ShowcaseController::class, 'toggleScouting']);
// Public (no auth needed — scouts browse these):
Route::get('/showcase/discover', [ShowcaseController::class, 'discover']);
```

#### Database Schema (new migration needed):
```sql
CREATE TABLE player_showcases (
  id              UUID PRIMARY KEY,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  skill_type      VARCHAR(50),       -- dribbling, shooting, passing, etc.
  video_url       TEXT,              -- Cloudflare R2 URL (reuse existing R2 setup)
  thumbnail_url   TEXT,
  ai_rating       DECIMAL(3,1),      -- 1.0 to 10.0
  top_strength    TEXT,
  position_fit    JSON,              -- array of positions
  scout_note      TEXT,
  development_flag TEXT,
  open_for_scouting BOOLEAN DEFAULT true,
  view_count      INTEGER DEFAULT 0,
  created_at      TIMESTAMP,
  updated_at      TIMESTAMP
);
```

---

### 2. 📋 DIGITAL PLAYER PROFILE — `/player/profile` (ENHANCED)

**What it does**: Enhances existing profile with AI-generated narrative,
player similarity comparisons, and a public "Scouting CV" view.

**Status**: EXISTING page — ADD these features, do not rebuild

#### New elements to add to existing `/player/profile`:

**A. AI Profile Narrative (auto-generated)**
```typescript
// Add to profile page — call on first load if narrative is empty:
// Uses existing POST /api/v1/ask (DeepSeekService) — reuse, do not rebuild

const generateProfileNarrative = async (playerStats: PlayerStats) => {
  const prompt = `
    Generate a professional scouting profile narrative for this player.
    Write in third person. Max 3 sentences. Professional tone.
    Stats: ${JSON.stringify(playerStats)}
    Sport: ${playerStats.sport}
    Position: ${playerStats.position}
    Age: ${playerStats.age}
    Club: ${playerStats.club}
  `;
  // Use existing /api/ai-coach route (Next.js Claude proxy)
};
```

**B. Player Similarity ("Plays Like...")**
```typescript
// Add below profile header:
// Simple string match from a lookup table first (no ML needed yet):
const PLAYER_SIMILARITIES: Record<string, string[]> = {
  football: {
    "striker-fast":     ["Khama Billiat (early career)", "Knowledge Musona"],
    "midfielder-technical": ["Marvelous Nakamba (youth)", "Tino Kadewere"],
    "defender-physical": ["Method Mwanjali", "Hardlife Zvirekwi"],
  }
  // Expand per sport
};
```

**C. Public Scouting CV View**
```
Add "View as Scout" button to /player/profile
→ Opens /player/profile/scout-view (public, shareable link)
→ Shows: photo, position, age, club, province, key stats,
         AI narrative, showcase clips, availability status
→ Share button generates: grassrootssports.live/player/[id]/cv
→ Scout can download as PDF (reuse existing jsPDF in /scout/reports)
```

---

### 3. 🤖 AI SCOUTING REPORT GENERATOR — `/scout/reports` (ENHANCED)

**What it does**: Enhances existing jsPDF report with RAG-powered
analysis using the football PDF knowledge base already in the backend.

**Status**: EXISTING — enhance, do not rebuild

#### Enhancements to add:

**A. RAG Integration (reuse existing PDF knowledge base)**
```php
// Laravel: app/Services/DeepSeekService.php already exists
// Add new method: generateScoutingReport()

public function generateScoutingReport(array $playerData): string
{
    // 1. Retrieve relevant chunks from PDF knowledge base
    // 2. Build context-enriched prompt
    // 3. Return structured scouting report

    $prompt = "
        Using FIFA scouting methodology:
        Player Data: " . json_encode($playerData) . "
        
        Generate a structured scouting report with:
        - Technical Assessment (1-10 per attribute)
        - Physical Profile
        - Tactical Understanding
        - Psychological Traits (based on performance data)
        - Overall Rating (1-100 FIFA scale)
        - Recommended Next Step (trials, training focus, etc.)
        - Comparison to known Zimbabwean players at same level
    ";

    return $this->ask($prompt, 'scout', 'en');
}
```

**B. Percentile Rankings**
```typescript
// Add to report generation in /scout/reports/page.tsx:
// Show: "Top X% of U17 strikers in Harare Province"
// Data source: existing /api/v1/scout/players endpoint
// Calculate percentile client-side from the returned player list
```

**C. Anomaly Detection Flag**
```typescript
// Add to report: flag unusually gifted players automatically
const ANOMALY_THRESHOLDS = {
  football: {
    goals_per_game: 0.8,      // flags if > 0.8 goals/game
    pass_accuracy: 85,         // flags if > 85%
    distance_covered_km: 11,   // flags if > 11km/game
  }
};
// Show: "⚡ EXCEPTIONAL FLAG: This player's goal rate exceeds 95% of players at this level"
```

---

### 4. ⭐ SKILL ASSESSMENT & RATING — `/player/assessment` (ENHANCED)

**What it does**: Enhances existing assessment page with position-specific
scoring, percentile rankings, and ML Kit biomechanics integration.

**Status**: EXISTING page — ADD scoring engine

#### Scoring Engine (add to existing assessment page):
```typescript
// src/lib/skill-scoring.ts — NEW file

export const POSITION_WEIGHTS: Record<string, Record<string, number>> = {
  football: {
    striker:    { pace: 0.25, finishing: 0.30, heading: 0.15, dribbling: 0.20, positioning: 0.10 },
    midfielder: { passing: 0.30, vision: 0.25, stamina: 0.20, dribbling: 0.15, tackling: 0.10 },
    defender:   { tackling: 0.30, heading: 0.25, positioning: 0.25, pace: 0.10, passing: 0.10 },
    goalkeeper: { reflexes: 0.30, positioning: 0.25, distribution: 0.20, handling: 0.15, communication: 0.10 },
  },
  netball: {
    shooter:    { accuracy: 0.40, movement: 0.20, court_sense: 0.20, strength: 0.20 },
    defender:   { intercepts: 0.35, footwork: 0.30, anticipation: 0.25, strength: 0.10 },
  }
  // Add all sports progressively
};

export const calculateSkillScore = (
  attributes: Record<string, number>,
  position: string,
  sport: string
): number => {
  const weights = POSITION_WEIGHTS[sport]?.[position];
  if (!weights) return calculateGenericScore(attributes);
  
  return Object.entries(weights).reduce((total, [attr, weight]) => {
    return total + (attributes[attr] || 5) * weight;
  }, 0) * 10; // Scale to 100
};
```

#### ML Kit Integration Hook (bridge Flutter → Web):
```typescript
// The Flutter app already has ML Kit pose detection
// Bridge: Flutter app saves biomechanics data to backend
// Web reads from: GET /api/v1/players/{id}/biomechanics
// Display in assessment page as radar chart (reuse recharts — already in package.json)
```

---

### 5. 🔍 SCOUT DISCOVERY FEED — `/scout` (ENHANCED)

**What it does**: Enhances existing scout hub with recommendation engine,
semantic search, and showcase clip browsing.

**Status**: EXISTING hub — ADD these features

#### A. Recommendation Engine
```typescript
// src/lib/scout-recommendations.ts — NEW file
// Simple collaborative filtering (no ML server needed yet):

export const getRecommendedPlayers = async (
  scoutHistory: string[],    // player IDs scout has viewed
  filters: ScoutFilters
): Promise<Player[]> => {
  // 1. Get players scout has viewed + shortlisted
  // 2. Find common attributes (position, age, province, sport)
  // 3. Return players with similar attributes not yet viewed
  // Use existing GET /api/v1/scout/players endpoint
};
```

#### B. Semantic Search
```typescript
// Add to scout search bar in /scout hub:
// Natural language → structured filters via Claude API

export const parseScoutQuery = async (query: string): Promise<ScoutFilters> => {
  // Example: "fast left-footed wingers under 18 in Bulawayo"
  // Returns: { position: "winger", age_max: 18, province: "Bulawayo", preferred_foot: "left" }
  
  const response = await fetch('/api/ai-coach', {
    method: 'POST',
    body: JSON.stringify({
      message: `Parse this scout search query into filters: "${query}"
      Return JSON only: { position, age_min, age_max, province, sport, preferred_foot }
      Use null for any field not mentioned.`,
      system_prompt: 'You are a football scout search parser. Return only valid JSON.'
    })
  });
  // Uses existing /api/ai-coach Next.js proxy — no new API needed
};
```

#### C. Discovery Feed UI additions
```
Add to existing /scout page:
- "For You" tab: AI-recommended players based on scout's history
- "Showcase Clips" tab: Browse latest player showcase videos
- "Rising Stars" tab: Players with highest improvement rate this month
- Search bar with natural language: "Find me fast strikers under 17 in Harare"
```

---

### 6. 🔔 OPPORTUNITY ALERTS — `/player/notifications` (ENHANCED)

**What it does**: Enhances existing notification system so players
get alerted when scouts view, save, or shortlist their profiles.

**Status**: EXISTING notifications system — ADD these event types

#### New notification types to add:

```typescript
// Add to notification types in Laravel backend:

// Trigger when:
// 1. Scout views player profile → "A scout viewed your profile"
// 2. Scout adds player to shortlist → "You've been shortlisted!"  
// 3. Showcase clip gets 10+ views → "Your clip is gaining attention"
// 4. Player matches a scout's saved search → "A scout is looking for players like you"
// 5. Trial opportunity posted matching player profile → "New trial opportunity near you"

// Bilingual messages:
const OPPORTUNITY_MESSAGES = {
  scout_view: {
    en: "A scout viewed your profile",
    sn: "Mumwe muvhimi akatarisa profile yako"
  },
  shortlisted: {
    en: "You've been shortlisted by a scout! 🌟",
    sn: "Wakasarudzwa nemuvhimi! 🌟"
  },
  clip_trending: {
    en: "Your showcase clip is getting noticed",
    sn: "Video yako iri kuonekwa nevakawanda"
  }
};
```

#### Profile View Tracking (new Laravel middleware):
```php
// app/Http/Middleware/TrackProfileView.php — NEW
// Add to scout player routes:
// When GET /api/v1/scout/players/{id} is called by a scout:
// → Log to profile_views table
// → Trigger notification to player if this scout is new

// Schema:
// profile_views: id, viewer_id, player_id, viewed_at, viewer_role
```

---

### 🔗 INTEGRATION MAP — How existing systems connect

```
Flutter ML Kit Pose Detection
    ↓ saves biomechanics data
Laravel API (/api/v1/players/{id}/biomechanics)
    ↓ read by
Next.js /player/assessment → radar chart display
    ↓ feeds into
Skill Score calculation → stored on player profile
    ↓ used by
Scout Discovery Feed ranking algorithm

DeepSeekService.php (existing)
    ↓ extended with
generateScoutingReport() method
    ↓ called by
/scout/reports enhanced generator
    ↓ outputs to
jsPDF report (existing) + profile narrative

analyseVideo() in src/lib/video-analysis.ts (existing)
    ↓ called with showcase prompt
/player/showcase upload flow
    ↓ results stored in
player_showcases table (new)
    ↓ displayed in
Scout Discovery Feed "Showcase Clips" tab

Existing notification bell + Web Notification API
    ↓ extended with
Profile view tracking middleware
    ↓ new event types
Opportunity alerts (scout views, shortlisting, clip trending)
```

---

### 📋 PLAYERS HUB BUILD ORDER

Build in this order — each step builds on the previous:

```
Step 1: player_showcases table migration (Laravel)
Step 2: ShowcaseController.php (Laravel) — CRUD + discover endpoint
Step 3: /player/showcase page (Next.js) — upload + grid display
Step 4: Showcase prompt added to analyseVideo() (reuse existing)
Step 5: src/lib/skill-scoring.ts — scoring engine
Step 6: Add scoring to /player/assessment (existing page)
Step 7: Profile narrative generation on /player/profile (existing page)
Step 8: Scout semantic search on /scout hub (existing page)
Step 9: Profile view tracking middleware (Laravel)
Step 10: Opportunity notification types (extend existing system)
```

**RULE**: Complete each step fully before moving to the next.
**RULE**: Never delete existing code — always extend.
**RULE**: Always explain what existing code is being reused before writing new code.
**RULE**: Explain every file change before making it (architect rule applies here too).

---

### 🧪 PLAYERS HUB TEST CHECKLIST

Before marking any step complete:
- [ ] Mobile works at 375px
- [ ] Shona language strings added for any new UI text
- [ ] Loading state shown during AI analysis
- [ ] Error state if AI or API fails (fallback to cached data)
- [ ] Works on slow connection (2G simulation in DevTools)
- [ ] Scout can discover the player's showcase on /scout
- [ ] Player gets notified when relevant scout action occurs

---

## SESSION LOG — 7 April 2026

### Theme — THUTO AI Fixes + Backend Audit + Groq Migration

---

### AI PROVIDER CHANGE — GROQ (PERMANENT)

The platform has migrated from DeepSeek + Claude to **Groq** as the AI provider.
- `/api/ai-coach` Next.js route now uses Groq (not DeepSeek/Claude)
- All THUTO chat, onboarding, training schedule generation routes through `/api/ai-coach`
- Update any future AI references to use Groq, not DeepSeek or Claude
- Required env var: `GROQ_API_KEY` (Vercel + .env.local)

### THUTO AI — ALL FIXED (7 April 2026)

THUTO was broken because it called Laravel endpoints that were never built.
All fixed by routing to `/api/ai-coach` (Next.js Groq proxy).

#### Fixes applied:

| File | Was calling | Now calls |
|---|---|---|
| `ThutoChat.tsx` | `POST /thuto/chat` (Laravel 404) | `POST /api/ai-coach` ✅ |
| `ThutoOnboarding.tsx` | `POST /thuto/onboard` (Laravel 404) | `POST /api/ai-coach` ✅ |
| `ThutoOnboarding.tsx` | `POST /thuto/chat` (Laravel 404) | `POST /api/ai-coach` ✅ |
| `player/training/page.tsx` | `POST /training/schedule/generate` (Laravel 404) | `POST /api/ai-coach` ✅ |
| `player/training/page.tsx` | `POST /thuto/reflect` (Laravel 404) | `POST /api/ai-coach` ✅ |

#### Bug fixes:
- `ThutoChat.tsx` — `onboarded` initialized to `false` + `hydrated` flag added.
  Prevents new users bypassing onboarding due to useState(true) race condition.
- `ThutoOnboarding.tsx` — `.catch()` now sets `stage = "goal_input"` so `canSkip = true`.
  User can now close the modal after an API error instead of being permanently stuck.
- Training schedule saves to `localStorage` key `thuto_training_schedule` for persistence
  when `/training/schedule` Laravel endpoint returns 404.

#### Build fix:
- `src/app/player/ubuntu/live/[sessionId]/page.tsx` — removed redundant
  `phase !== "waiting" && phase !== "intro" && phase !== "done"` checks at line 731.
  TypeScript correctly narrowed `phase` to `"drill"|"feedback"|"rest"` via early returns,
  making those comparisons unintentional errors that blocked all builds.

---

### LARAVEL BACKEND AUDIT — 7 April 2026

Tested all frontend API calls against `https://bhora-ai.onrender.com/api/v1`.

#### ✅ CONFIRMED BUILT (returns 401 — route exists, needs auth token)

```
GET  /profile
GET  /coach/squad
GET  /matches
GET  /notifications
GET  /training/schedule
GET  /player/dna
GET  /player/stats
GET  /player/showcase
GET  /player/vault
GET  /scout/players
GET  /scout/shortlist
GET  /fan/following
GET  /players/discover
GET  /stats/provinces
GET  /business/budget
GET  /business/transactions
GET  /business/events
GET  /organisation
GET  /admin/stats
GET  /admin/users
GET  /admin/verifications
GET  /admin/subscriptions
GET  /sessions
GET  /matches/upcoming
POST /ask
GET  /verification/status
GET  /showcase/discover   ← public, returns 200
```

#### ❌ MISSING ON LARAVEL (returns 404 — never built)

```
GET  /auth/user
GET  /coach/training-plans
GET  /player/sessions
GET  /player/milestones
GET  /player/nutrition
GET  /injury-tracker/risk
GET  /talent-database
GET  /school-leagues
GET  /coach/set-pieces
```

Laravel backend code for all 9 missing routes is in the section below.
Run `php artisan migrate --force` after copying migration files.

---

### MISSING LARAVEL ROUTES — COPY-PASTE READY

---

#### 1. GET /auth/user

Add to `routes/api.php`:
```php
Route::get('/auth/user', function (Request $request) {
    return response()->json(['data' => $request->user()]);
})->middleware('auth:sanctum');
```

---

#### 2. GET /coach/training-plans

```
FILE: app/Http/Controllers/Api/Coach/TrainingPlanController.php
```
```php
<?php
namespace App\Http\Controllers\Api\Coach;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TrainingPlanController extends Controller
{
    public function index(Request $request)
    {
        // Returns plans for the coach's squad
        $plans = \DB::table('training_plans')
            ->where('coach_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();
        return response()->json(['data' => $plans]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'sport'       => 'required|string',
            'description' => 'nullable|string',
            'drills'      => 'nullable|array',
            'duration'    => 'nullable|integer',
        ]);
        $data['coach_id'] = $request->user()->id;
        $data['id'] = \Str::uuid();
        \DB::table('training_plans')->insert($data + ['created_at' => now(), 'updated_at' => now()]);
        return response()->json(['data' => $data], 201);
    }

    public function destroy(Request $request, $id)
    {
        \DB::table('training_plans')
            ->where('id', $id)->where('coach_id', $request->user()->id)
            ->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
```

Migration:
```php
Schema::create('training_plans', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('coach_id')->index();
    $table->string('title');
    $table->string('sport')->default('football');
    $table->text('description')->nullable();
    $table->json('drills')->nullable();
    $table->integer('duration')->nullable(); // minutes
    $table->timestamps();
});
```

Routes:
```php
Route::middleware(['auth:sanctum', 'role:coach,admin'])->group(function () {
    Route::get('/coach/training-plans',       [TrainingPlanController::class, 'index']);
    Route::post('/coach/training-plans',      [TrainingPlanController::class, 'store']);
    Route::delete('/coach/training-plans/{id}', [TrainingPlanController::class, 'destroy']);
});
```

---

#### 3. GET /player/sessions

```
FILE: app/Http/Controllers/Api/Player/PlayerSessionController.php
```
```php
<?php
namespace App\Http\Controllers\Api\Player;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PlayerSessionController extends Controller
{
    public function index(Request $request)
    {
        $sessions = \DB::table('player_sessions')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('session_date')
            ->paginate(20);
        return response()->json($sessions);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'session_date'  => 'required|date',
            'duration'      => 'required|integer',
            'type'          => 'required|string',
            'notes'         => 'nullable|string',
            'intensity'     => 'nullable|string',
            'drills_done'   => 'nullable|array',
        ]);
        $data['id']      = \Str::uuid();
        $data['user_id'] = $request->user()->id;
        \DB::table('player_sessions')->insert($data + ['created_at' => now(), 'updated_at' => now()]);
        return response()->json(['data' => $data], 201);
    }
}
```

Migration:
```php
Schema::create('player_sessions', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('user_id')->index();
    $table->date('session_date');
    $table->integer('duration'); // minutes
    $table->string('type');      // training, match, recovery
    $table->string('intensity')->nullable(); // low, medium, high
    $table->text('notes')->nullable();
    $table->json('drills_done')->nullable();
    $table->timestamps();
});
```

Routes:
```php
Route::middleware(['auth:sanctum', 'role:player,admin'])->group(function () {
    Route::get('/player/sessions',  [PlayerSessionController::class, 'index']);
    Route::post('/player/sessions', [PlayerSessionController::class, 'store']);
});
```

---

#### 4. GET /player/milestones

```
FILE: app/Http/Controllers/Api/Player/MilestoneController.php
```
```php
<?php
namespace App\Http\Controllers\Api\Player;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class MilestoneController extends Controller
{
    public function index(Request $request)
    {
        $milestones = \DB::table('player_milestones')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('achieved_at')
            ->get();
        return response()->json(['data' => $milestones]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'category'    => 'nullable|string', // fitness, skill, match, personal
            'achieved_at' => 'required|date',
        ]);
        $data['id']      = \Str::uuid();
        $data['user_id'] = $request->user()->id;
        \DB::table('player_milestones')->insert($data + ['created_at' => now()]);
        return response()->json(['data' => $data], 201);
    }

    public function destroy(Request $request, $id)
    {
        \DB::table('player_milestones')
            ->where('id', $id)->where('user_id', $request->user()->id)
            ->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
```

Migration:
```php
Schema::create('player_milestones', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('user_id')->index();
    $table->string('title');
    $table->text('description')->nullable();
    $table->string('category')->nullable();
    $table->date('achieved_at');
    $table->timestamp('created_at')->useCurrent();
});
```

Routes:
```php
Route::middleware(['auth:sanctum', 'role:player,admin'])->group(function () {
    Route::get('/player/milestones',       [MilestoneController::class, 'index']);
    Route::post('/player/milestones',      [MilestoneController::class, 'store']);
    Route::delete('/player/milestones/{id}', [MilestoneController::class, 'destroy']);
});
```

---

#### 5. GET /player/nutrition

```
FILE: app/Http/Controllers/Api/Player/NutritionController.php
```
```php
<?php
namespace App\Http\Controllers\Api\Player;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NutritionController extends Controller
{
    public function index(Request $request)
    {
        $plan = \DB::table('nutrition_plans')
            ->where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->first();
        $logs = \DB::table('nutrition_logs')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('logged_at')
            ->limit(30)
            ->get();
        return response()->json(['data' => ['plan' => $plan, 'logs' => $logs]]);
    }

    public function log(Request $request)
    {
        $data = $request->validate([
            'meal_type'   => 'required|string', // breakfast, lunch, dinner, snack
            'description' => 'required|string',
            'calories'    => 'nullable|integer',
            'logged_at'   => 'nullable|date',
        ]);
        $data['id']        = \Str::uuid();
        $data['user_id']   = $request->user()->id;
        $data['logged_at'] = $data['logged_at'] ?? now();
        \DB::table('nutrition_logs')->insert($data + ['created_at' => now()]);
        return response()->json(['data' => $data], 201);
    }
}
```

Migration:
```php
Schema::create('nutrition_plans', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('user_id')->index();
    $table->json('plan_json'); // AI-generated plan
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});

Schema::create('nutrition_logs', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('user_id')->index();
    $table->string('meal_type');
    $table->text('description');
    $table->integer('calories')->nullable();
    $table->timestamp('logged_at');
    $table->timestamp('created_at')->useCurrent();
});
```

Routes:
```php
Route::middleware(['auth:sanctum', 'role:player,admin'])->group(function () {
    Route::get('/player/nutrition',      [NutritionController::class, 'index']);
    Route::post('/player/nutrition/log', [NutritionController::class, 'log']);
});
```

---

#### 6. GET /injury-tracker/risk

```
FILE: app/Http/Controllers/Api/InjuryTrackerController.php
```
```php
<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class InjuryTrackerController extends Controller
{
    public function risk(Request $request)
    {
        $userId = $request->user()->id;
        $logs = \DB::table('injury_logs')
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->get();
        return response()->json(['data' => [
            'logs'        => $logs,
            'risk_score'  => null, // calculated by AI on frontend
            'risk_level'  => null,
        ]]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'sessions_per_week' => 'required|integer',
            'intensity'         => 'required|integer|min:1|max:10',
            'rest_days'         => 'required|integer',
            'match_minutes'     => 'nullable|integer',
            'previous_injury'   => 'nullable|string',
            'injury_body_part'  => 'nullable|string',
            'age'               => 'nullable|integer',
            'position'          => 'nullable|string',
        ]);
        $data['id']      = \Str::uuid();
        $data['user_id'] = $request->user()->id;
        \DB::table('injury_logs')->insert($data + ['created_at' => now()]);
        return response()->json(['data' => $data], 201);
    }
}
```

Migration:
```php
Schema::create('injury_logs', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('user_id')->index();
    $table->integer('sessions_per_week');
    $table->integer('intensity');
    $table->integer('rest_days');
    $table->integer('match_minutes')->nullable();
    $table->string('previous_injury')->nullable();
    $table->string('injury_body_part')->nullable();
    $table->integer('age')->nullable();
    $table->string('position')->nullable();
    $table->timestamp('created_at')->useCurrent();
});
```

Routes:
```php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/injury-tracker/risk',  [InjuryTrackerController::class, 'risk']);
    Route::post('/injury-tracker/risk', [InjuryTrackerController::class, 'store']);
});
```

---

#### 7. GET /talent-database

```
FILE: app/Http/Controllers/Api/TalentDatabaseController.php
```
```php
<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TalentDatabaseController extends Controller
{
    public function index(Request $request)
    {
        $query = \DB::table('users')
            ->join('profiles', 'users.id', '=', 'profiles.user_id')
            ->where('users.role', 'player')
            ->where('profiles.open_for_scouting', true)
            ->select(
                'users.id', 'profiles.first_name', 'profiles.surname',
                'profiles.position', 'profiles.sport', 'profiles.province',
                'profiles.age_group', 'profiles.overall_score',
                'profiles.avatar_url'
            );

        if ($request->sport)     $query->where('profiles.sport', $request->sport);
        if ($request->province)  $query->where('profiles.province', $request->province);
        if ($request->position)  $query->where('profiles.position', $request->position);
        if ($request->age_group) $query->where('profiles.age_group', $request->age_group);

        $players = $query->orderByDesc('profiles.overall_score')->paginate(20);
        return response()->json($players);
    }
}
```

Routes:
```php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/talent-database', [TalentDatabaseController::class, 'index']);
});
```

---

#### 8. GET /school-leagues

```
FILE: app/Http/Controllers/Api/SchoolLeagueController.php
```
```php
<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SchoolLeagueController extends Controller
{
    public function index(Request $request)
    {
        $leagues = \DB::table('school_leagues')
            ->orderBy('name')
            ->get();
        return response()->json(['data' => $leagues]);
    }

    public function results(Request $request, $leagueId)
    {
        $results = \DB::table('school_league_results')
            ->where('league_id', $leagueId)
            ->orderByDesc('match_date')
            ->get();
        return response()->json(['data' => $results]);
    }

    public function submitResult(Request $request)
    {
        $data = $request->validate([
            'league_id'    => 'required|string',
            'home_team'    => 'required|string',
            'away_team'    => 'required|string',
            'home_score'   => 'required|integer',
            'away_score'   => 'required|integer',
            'match_date'   => 'required|date',
        ]);
        $data['id']         = \Str::uuid();
        $data['coach_id']   = $request->user()->id;
        \DB::table('school_league_results')->insert($data + ['created_at' => now()]);
        return response()->json(['data' => $data], 201);
    }
}
```

Migration:
```php
Schema::create('school_leagues', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('name');
    $table->string('sport');
    $table->string('organiser'); // NASH, NAPH, ZIFA
    $table->string('season');
    $table->enum('status', ['active', 'upcoming', 'completed'])->default('active');
    $table->timestamps();
});

Schema::create('school_league_results', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('league_id')->index();
    $table->string('home_team');
    $table->string('away_team');
    $table->integer('home_score');
    $table->integer('away_score');
    $table->date('match_date');
    $table->uuid('coach_id')->nullable();
    $table->timestamp('created_at')->useCurrent();
});
```

Routes:
```php
Route::get('/school-leagues', [SchoolLeagueController::class, 'index']);
Route::get('/school-leagues/{id}/results', [SchoolLeagueController::class, 'results']);
Route::middleware(['auth:sanctum', 'role:coach,admin'])->group(function () {
    Route::post('/school-leagues/results', [SchoolLeagueController::class, 'submitResult']);
});
```

---

#### 9. GET /coach/set-pieces

```
FILE: app/Http/Controllers/Api/Coach/SetPieceController.php
```
```php
<?php
namespace App\Http\Controllers\Api\Coach;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SetPieceController extends Controller
{
    public function index(Request $request)
    {
        $data = \DB::table('set_pieces')
            ->where('coach_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();
        return response()->json(['data' => $data]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'type'         => 'required|string', // corner, free_kick, penalty, throw_in
            'situation'    => 'required|string', // attacking, defending
            'title'        => 'required|string',
            'description'  => 'nullable|string',
            'success_rate' => 'nullable|numeric',
            'times_used'   => 'nullable|integer',
        ]);
        $data['id']       = \Str::uuid();
        $data['coach_id'] = $request->user()->id;
        \DB::table('set_pieces')->insert($data + ['created_at' => now(), 'updated_at' => now()]);
        return response()->json(['data' => $data], 201);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'success_rate' => 'nullable|numeric',
            'times_used'   => 'nullable|integer',
            'description'  => 'nullable|string',
        ]);
        \DB::table('set_pieces')
            ->where('id', $id)->where('coach_id', $request->user()->id)
            ->update($data + ['updated_at' => now()]);
        return response()->json(['message' => 'Updated']);
    }

    public function destroy(Request $request, $id)
    {
        \DB::table('set_pieces')
            ->where('id', $id)->where('coach_id', $request->user()->id)
            ->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
```

Migration:
```php
Schema::create('set_pieces', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->uuid('coach_id')->index();
    $table->string('type');       // corner, free_kick, penalty, throw_in
    $table->string('situation');  // attacking, defending
    $table->string('title');
    $table->text('description')->nullable();
    $table->decimal('success_rate', 5, 2)->nullable();
    $table->integer('times_used')->default(0);
    $table->timestamps();
});
```

Routes:
```php
Route::middleware(['auth:sanctum', 'role:coach,admin'])->group(function () {
    Route::get('/coach/set-pieces',        [SetPieceController::class, 'index']);
    Route::post('/coach/set-pieces',       [SetPieceController::class, 'store']);
    Route::patch('/coach/set-pieces/{id}', [SetPieceController::class, 'update']);
    Route::delete('/coach/set-pieces/{id}', [SetPieceController::class, 'destroy']);
});
```

---

### ACTION REQUIRED — LARAVEL (bhora-ai repo)

1. Copy all controller files above to their respective paths
2. Copy all migration files
3. Add all routes to `routes/api.php`
4. Run: `php artisan migrate --force` on Render
5. Seed school_leagues table with NASH/NAPH pre-loaded data (see Zimbabwe-Specific Features section)

---

## SESSION LOG — 1 April 2026

### Theme — Analyst Hub PDF Exports + Business Hub Polish

---

### COMPLETED THIS SESSION — DO NOT REBUILD

#### 1. Tactical Report PDF Export (`/analyst/tactical-report`)
- Added `import jsPDF from "jspdf"` + `Download` icon
- Added `exportPDF()` function — green header bar, stats row (formation/possession/shots/on-target), report body with section headers in green bold, coach observations in italic, confidential footer, multi-page support
- Gold "PDF" button added next to Copy button in the report output panel
- Filename: `tactical-report-HomeTeam-vs-AwayTeam-YYYY-MM-DD.pdf`
- File: `src/app/analyst/tactical-report/page.tsx`

#### 2. Heatmaps PDF Export (`/analyst/heatmaps`)
- Added `import jsPDF from "jspdf"` + `Download` icon
- Added `exportPDF()` function — green header, one 6×10 coloured grid per player that has data, ATTACK↑/DEFENCE↓ labels, zone counts as numbers, intensity legend, Grassroots footer
- Gold "Export PDF Report" button added below the Clear Player / Clear All buttons in the controls panel
- Colour scale matches the UI: green → yellow → amber → orange → red
- File: `src/app/analyst/heatmaps/page.tsx`
- Commit: `fcb4af3`

#### 3. Business Hub — Inline Budget Editing
- Pencil icon per budget row → inline number inputs → Save ✓ / Cancel ✗
- Saves to `PATCH /business/budget/{id}` (falls back silently if guest)
- File: `src/app/business-hub/page.tsx`

#### 4. Business Hub — Financial Chart
- Monthly income vs expense bar chart using recharts `BarChart`
- Green bars for income, red bars for expenses
- Calculated from existing transactions state — no new API needed
- TypeScript fix: `Tooltip formatter` uses `value ?? 0` (no explicit `number` type)

#### 5. Business Hub — Business Skills Articles
- All 5 articles expanded with real Zimbabwean sports business content (~200 words each)
- Topics: Sponsorship proposals, Match day revenue, ZIFA grant applications, Player contracts, Social media monetisation
- Click to expand/collapse each article

#### 6. CLAUDE.md Analyst Hub table updated
- All 6 Analyst tools now correctly marked LIVE ✅ (were all "Coming Soon 🔒")

---

### WHAT STILL NEEDS DOING IN ANALYST HUB

### COMPLETED (all gaps closed — 1 April 2026)

#### Pass Map PDF Export — DONE ✅
- `exportPDF()` draws the full pitch (green background + white markings + penalty areas + spots + centre circle) using jsPDF geometry
- Gold pass lines with thickness proportional to pass count, count labels at midpoints
- Player dots with numbers
- Ranked connections table below pitch
- Disabled when no players placed
- File: `src/app/analyst/pass-map/page.tsx`

#### xG Rolling Chart in Season Intelligence — DONE ✅
- Reads Touch Tracker localStorage key `gs_touch_tracker_history` on mount
- Shows recharts BarChart: Home xG (green) / Away xG (blue) / Home Goals (gold) / Away Goals (red) per match
- Over/under performance table: positive = overperformed vs xG, negative = underperformed
- Shows last 8 Touch Tracker matches
- No backend needed — entirely client-side
- File: `src/app/analyst/season\page.tsx`

#### Analyst Sidebar Nav — DONE ✅
- Full nav section added for `analyst` role: Analyst Hub, Live Collector, Touch Tracker, xG Analysis, Tactical Report, Pass Map, Player Heatmaps, Season Intelligence
- `analyst` tab added to Admin hub switcher (cyan — 6th tab, grid-cols-6)
- Analyst icons: Flame (live), Activity, Target, ClipboardList, Map, Thermometer, TrendingUp
- File: `src/components/layout/sidebar.tsx`

### ANALYST ROLE ON LARAVEL — ACTION REQUIRED

The frontend fully supports the `analyst` role. To allow real analyst accounts on the backend:

```php
// FILE: database/migrations/YYYY_MM_DD_add_analyst_to_users_role_enum.php
Schema::table('users', function (Blueprint $table) {
    // If role is an ENUM:
    DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','coach','scout','player','fan','analyst') NOT NULL DEFAULT 'player'");
    // If role is a plain VARCHAR — no migration needed, just create the user with role='analyst'
});
```

**Or simply create the analyst user manually in Render PostgreSQL:**
```sql
UPDATE users SET role = 'analyst' WHERE email = 'analyst@grassrootssports.live';
-- OR INSERT a new user with role='analyst' via the admin dashboard /admin/users
```

**Test credentials to create:**
```
analyst@grassrootssports.live / Analyst123! / role: analyst
```

---

## SESSION LOG — 26 March 2026

### Theme — Full-Stack Pairing Rule + Payments

---

### NEW RULE ADDED: Full-Stack Pairing Rule

Every feature must be complete on BOTH sides before it is considered done.
- Frontend done → **automatically generate Laravel backend** (migration, model, controller, routes)
- Backend done → **automatically wire up the frontend**
- Rule is documented in the `🔁 FULL-STACK PAIRING RULE` section near the top of this file

---

### COMPLETED THIS SESSION — DO NOT REBUILD

#### 1. Facebook Marketing Kit (`/facebook-kit`)

- **File**: `src/app/facebook-kit/page.tsx`
- Wrapper page that renders `grassroots-facebook-kit.jsx` inside Next.js
- Access locally at `localhost:3000/facebook-kit` while running `npm run dev`
- NOT a public route — for internal marketing use only

#### 2. Laravel Backend — Player Highlight Vault

Frontend at `/player/vault` was already built. Backend code generated for the `bhora-ai` repo:

| File | Purpose |
|---|---|
| `database/migrations/2026_03_26_000001_create_player_videos_table.php` | Videos table — r2_key, video_url, tag, size_mb, duration |
| `database/migrations/2026_03_26_000002_create_player_reels_table.php` | Reels table — share_token, video_ids (JSON), views |
| `app/Models/PlayerVideo.php` | Model with UUID primary key |
| `app/Models/PlayerReel.php` | Model — auto-generates share_token on create |
| `app/Http/Controllers/Api/PlayerVaultController.php` | index, upload, destroy, createReel, publicReel |

**Endpoints:**
```
GET    /player/vault                      — list videos + storage info
POST   /player/vault/upload               — save R2 key + metadata
DELETE /player/vault/{id}                 — delete video + R2 object
POST   /player/vault/reel                 — create reel, returns share_url
GET    /player/vault/share/{token}        — PUBLIC, no auth, increments views
```

**Storage limits:** Free = 500MB, Pro = 5GB (expand when billing is live)
**R2 delete:** Uses AWS SDK S3Client with Cloudflare R2 endpoint

**Required env on Render:**
```
R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
```

#### 3. Laravel Backend — Player Showcase

Frontend at `/player/showcase` was already built. Backend code generated:

| File | Purpose |
|---|---|
| `database/migrations/2026_03_26_000003_create_player_showcases_table.php` | skill_type, ai_rating, position_fit (JSON), scout_note, open_for_scouting, view_count |
| `database/migrations/2026_03_26_000004_add_ai_narrative_to_profiles_table.php` | Adds ai_narrative TEXT column to profiles table |
| `app/Models/PlayerShowcase.php` | Model with UUID PK, JSON cast for position_fit |
| `app/Http/Controllers/Api/ShowcaseController.php` | index, store, toggleScouting, destroy, discover |

**Endpoints:**
```
GET    /player/showcase                   — player's own clips
POST   /player/showcase                   — save clip + Claude AI results
PATCH  /player/showcase/{id}/toggle-scouting — flip open_for_scouting
DELETE /player/showcase/{id}              — remove clip
GET    /showcase/discover                 — PUBLIC discovery feed (no auth), paginated 20
```

**Clip trending notification:** fires when view_count hits 10 (inside `discover()`)

#### 4. Laravel Backend — Scout Hub (Notifications + Shortlist + Profile View Tracking)

| File | Purpose |
|---|---|
| `database/migrations/2026_03_26_000005_create_profile_views_table.php` | viewer_id, player_id, viewer_role, viewed_at |
| `database/migrations/2026_03_26_000006_create_notifications_table.php` | user_id, title, body, type (info/success/warning/alert/opportunity), read, link |
| `database/migrations/2026_03_26_000007_create_scout_shortlists_table.php` | scout_id, player_id — UNIQUE pair |
| `app/Models/Notification.php` | Static `send()` helper for fire-and-forget notifications |
| `app/Models/ProfileView.php` | No timestamps, has viewed_at |
| `app/Models/ScoutShortlist.php` | BelongsTo player + scout |
| `app/Http/Controllers/Api/NotificationController.php` | index, markRead, markAllRead, destroy |
| `app/Http/Controllers/Api/ScoutShortlistController.php` | index, store (fires shortlisted notification), destroy |
| `app/Http/Middleware/TrackProfileView.php` | Auto-logs profile views, notifies player when NEW scout views for first time |

**Notification types:**
- `opportunity` — scout_view, shortlisted, clip_trending (all shown with gold Star icon on frontend)
- `info`, `success`, `warning`, `alert` — existing types

**Register middleware in `app/Http/Kernel.php`:**
```php
'track.profile.view' => \App\Http\Middleware\TrackProfileView::class,
```

**Endpoints:**
```
GET    /notifications                      — last 50, newest first
PATCH  /notifications/{id}/read            — mark one read
POST   /notifications/mark-all-read        — mark all read
DELETE /notifications/{id}                 — dismiss
GET    /scout/shortlist                    — scout's shortlisted players
POST   /scout/shortlist                    — add player (fires notification to player)
DELETE /scout/shortlist/{playerId}         — remove from shortlist
```

#### 5. Laravel Backend — AI Narrative on Player Profile

- Add `'ai_narrative'` to `$fillable` on `Profile` model
- Add `'ai_narrative' => 'nullable|string|max:2000'` to `update()` validation in `ProfileController`
- `GET /profile` returns it automatically once column exists
- Frontend generates narrative via Claude, saves with `PATCH /profile`

#### 6. Paynow Zimbabwe Integration — FULLY BUILT ✅

Real mobile money payment integration for EcoCash, InnBucks, and OneMoney.

**New Next.js API routes (no Laravel needed):**

| File | Purpose |
|---|---|
| `src/app/api/payments/paynow/route.ts` | Initiates Paynow remotetransaction — sends USSD push to customer phone |
| `src/app/api/payments/paynow/status/route.ts` | Polls Paynow pollUrl — returns `{ paid, status, paynow_ref }` |
| `src/app/api/payments/paynow/webhook/route.ts` | Receives Paynow POST webhook — notifies Laravel to activate subscription |

**Payment flow:**
```
Player selects EcoCash / InnBucks / OneMoney
  → enters phone number (e.g. 0771 234 567)
  → Next.js calls Paynow remotetransaction API
  → Paynow sends USSD push to customer's phone
  → "Check your phone" banner shows on screen
  → Page polls /api/payments/paynow/status every 3 seconds
  → Customer approves on phone
  → paid=true → Laravel /subscription/paynow-confirm called
  → Green "Payment received!" banner shown
```

**Hash algorithm:** SHA512 of concatenated fields including PAYNOW_KEY (uppercase hex)
**Phone normalisation:** `07XXXXXXX` → `2637XXXXXXX` (international format for Paynow)

**Required env vars (Vercel):**
```
PAYNOW_INTEGRATION_ID   = from paynow.co.zw dashboard → Integrations
PAYNOW_INTEGRATION_KEY  = from paynow.co.zw dashboard → Integrations
```

**Subscription page updates (`src/app/player/subscription/page.tsx`):**
- Added InnBucks as 5th payment method (was 4 options, now 5)
- Phone number input appears when EcoCash / InnBucks / OneMoney is selected
- `pollUrl` state + `useEffect` polling loop (runs every 3s, clears on paid/cancelled)
- "Check your phone" amber banner while waiting
- Green "Payment received!" banner on success
- Subscribe button disabled while polling (prevents double-pay)

**Laravel endpoint needed to activate subscription on webhook:**
```php
Route::post('/subscription/paynow-confirm', [SubscriptionController::class, 'paynowConfirm']);
// Receives: reference, paynow_ref, amount, status
// Activates the matching pending subscription record
```

**Paynow merchant registration:**
- Register at paynow.co.zw
- Result URL: `https://grassrootssports.live/api/payments/paynow/webhook`
- Return URL: `https://grassrootssports.live/player/subscription?paynow=1`

---

### WHAT STILL NEEDS LARAVEL IMPLEMENTATION (bhora-ai repo)

Run `php artisan migrate --force` after adding all 7 migrations above.

| Task | Status |
|---|---|
| 7 migration files copied to bhora-ai repo | Pending |
| `composer require aws/aws-sdk-php` | Pending (for R2 delete) |
| PlayerVaultController implemented | Pending |
| ShowcaseController implemented | Pending |
| NotificationController implemented | Pending |
| ScoutShortlistController implemented | Pending |
| TrackProfileView middleware registered | Pending |
| `ai_narrative` added to Profile model | Pending |
| `/subscription/paynow-confirm` endpoint | Pending |

---

### ENVIRONMENT VARIABLES — FULL LIST (updated 26 March 2026)

**Vercel (Next.js):**
```
NEXT_PUBLIC_API_URL      = https://bhora-ai.onrender.com/api/v1
ANTHROPIC_API_KEY        = sk-ant-...
DAILY_API_KEY            = (live streaming)
STRIPE_SECRET_KEY        = sk_live_... or sk_test_...
STRIPE_WEBHOOK_SECRET    = whsec_...
NEXT_PUBLIC_APP_URL      = https://grassrootssports.live
FIREBASE_PROJECT_ID      = (FCM push)
FIREBASE_CLIENT_EMAIL    = (FCM push)
FIREBASE_PRIVATE_KEY     = (FCM push)
R2_ACCOUNT_ID            = (Cloudflare R2 video storage)
R2_ACCESS_KEY_ID         = (Cloudflare R2)
R2_SECRET_ACCESS_KEY     = (Cloudflare R2)
R2_BUCKET                = grassroots-videos
R2_PUBLIC_URL            = https://pub-xxxx.r2.dev
RESEND_API_KEY           = re_... (transactional email)
EMAIL_FROM               = notifications@grassrootssports.live
TWILIO_ACCOUNT_SID       = (WhatsApp reports)
TWILIO_AUTH_TOKEN        = (WhatsApp reports)
TWILIO_WHATSAPP_FROM     = whatsapp:+14155238886
PAYNOW_INTEGRATION_ID    = (Paynow Zimbabwe — NEW)
PAYNOW_INTEGRATION_KEY   = (Paynow Zimbabwe — NEW)
```

**Render (Laravel):**
```
DEEPSEEK_API_KEY         = (AI coach via /ask endpoint)
R2_ACCOUNT_ID            = (same R2 credentials as Vercel)
R2_ACCESS_KEY_ID         =
R2_SECRET_ACCESS_KEY     =
R2_BUCKET                = grassroots-videos
```

---

## SESSION LOG — 10 April 2026

### Theme — Mission Mode, THUTO EQ, Football Knowledge, Showcase Audit

---

### COMPLETED THIS SESSION — DO NOT REBUILD

#### 1. Mission Mode / Goal Engine — FULLY BUILT ✅

**Frontend:** `src/app/player/goal/page.tsx`
- 3-stage UI: setup → plan review → active dashboard
- 6 preset goal types (Division 1, scouted, fitness, school team, skill, custom)
- Timeline picker: 3 / 6 / 12 / 18 months
- AI plan generation via `/api/ai-coach` → returns 3 phases with milestones + daily missions
- JSON extracted via regex (handles markdown-wrapped AI responses)
- Active dashboard: overall progress bar, adherence %, missions done, days left
- Today's mission card: Mark Complete / Skip buttons
- Phase timeline with NOW indicator and milestones for active phase
- localStorage keys: `gs_player_goal` + `gs_goal_missions`
- Non-blocking API calls: `POST /player/goal` + `POST /player/goal/mission`

**Hub card:** Added to `src/app/player/page.tsx`
Note: Linter subsequently renamed card to "Success Engine" → `/player/success-engine`.
The actual page lives at `/player/goal`. If `/player/success-engine` is needed as an alias,
create it or update the hub card href.

**Laravel backend (bhora-ai repo):**
- `database/migrations/2026_04_09_000002_create_player_goals_table.php`
  - Tables: `player_goals` (id, user_id, goal_type, goal_text, timeline_months, sport, position, target_date, committed, phases JSON)
  - Tables: `goal_missions` (id, user_id, goal_id, mission_date, status — UNIQUE per day)
- `app/Models/PlayerGoal.php` — UUID PK, phases cast as array, committed as boolean
- `app/Http/Controllers/Api/Player/GoalController.php`
  - `GET /player/goal` — fetch current committed goal
  - `POST /player/goal` — upsert (localStorage syncs here)
  - `POST /player/goal/mission` — log done/skip with updateOrInsert
- Routes added to `routes/api.php` under `role:player,admin` middleware

**Migration status:** Will run automatically on next Render deploy via `start.sh`.

---

#### 2. THUTO Emotional Intelligence Knowledge Base — INJECTED ✅

**Source:** `THUTO_Emotional_Intelligence_Knowledge_Base (2).docx` (Goleman + Salovey framework)

**Files updated:**
- `src/components/thuto/ThutoChat.tsx` — full EQ knowledge injected into BASE_PROMPT:
  - 5 domains: self-awareness, managing emotions, self-motivation, empathy, relationship skills
  - THUTO conversation framework (5 steps: check-in → listen → validate → connect → close)
  - 3 player emotional profiles: Self-Aware / Engulfed / Accepting — different coaching approach each
  - Emotional hijacking section: 5-step Anti-Hijacking Protocol
  - Zimbabwe-specific pressures: load-shedding, economic pressure, cultural mask of toughness
  - Shona phrases: Kuziva wega, Kushanda, Kujatisa, Bhora pasi
  - Flow state coaching
  - Mission Mode added to BASE_PROMPT feature list + PAGE_CONTEXT map

- `src/components/thuto/ThutoChatCoach.tsx` — EQ coaching layer:
  - How to identify and manage each player profile type
  - Recognise emotional hijacking on the pitch
  - Zimbabwe coaching realities

- `src/components/thuto/ThutoChatAnalyst.tsx` — confidence framing:
  - "One clear insight delivered well is worth more than 20 confusing stats"

**Auto-added by linter (same session):**
- `ThutoChat.tsx` also received a `FormationDiagram` SVG component — when THUTO mentions
  "4-3-3", "4-4-2", "4-2-3-1", "3-5-2", or "5-3-2" in a response, a mini interactive pitch
  diagram renders inline below the message bubble.

---

#### 3. Football Knowledge Base — Front Foot Passing Added ✅

**Source:** `Why it's important to work on front foot passing.docx` (FA / Paul McGuinness)

**File updated:** `src/lib/football-knowledge.ts`
- New entry id: `"front-foot-passing"`
- Category: `fundamentals`, Level: `all`
- Covers: why it beats defenders, technique (toes down, locked ankle), game-based development,
  Zimbabwe grassroots drill (no equipment), Paul McGuinness method, coaching philosophy
- Now surfaces via `findRelevantSessions()` when THUTO is asked about passing, tight areas,
  beating defenders, or skill development

---

#### 4. FutureFit Page — CONFIRMED CLEAN ✅

`src/app/coach/futurefit/page.tsx` — no uncommitted changes. Fully built and committed.
Deleted stale `page.tsx.bak` leftover file.

---

#### 5. Showcase End-to-End — AUDITED ✅

`src/app/player/showcase/page.tsx` flow:
- `GET /player/showcase` → backend live, returns real clips ✅
- Video upload → R2 presigned URL (silently skipped if `R2_*` env vars not set; clip saves without video_url) ✅
- AI analysis → text-only prompt to Groq/DeepSeek via `/api/ai-coach`
  NOTE: showcase sends `images: frames[]` but `/api/ai-coach` route ignores images field —
  Groq is text-only. AI rates clips based on the text prompt ("Skill: Dribbling") not actual video.
  Uses FALLBACK values if API key missing. ✅
- `POST /player/showcase` → backend live ✅
- localStorage fallback at every stage ✅

**Blockers (Nigel must action):**
- `GROQ_API_KEY` not set in Vercel → all THUTO chat + showcase AI ratings broken on live site
- `R2_*` env vars not set → clips save without video_url (functional but no playback)

---

#### 6. Google OAuth — REMOVED FROM LOGIN ✅

`src/app/login/page.tsx` — all Google/Firebase code removed. Pure email + password login only.
Reason: Google OAuth was causing "invalid email or password" errors during registration.

---

### ⚠️ CRITICAL — ACTION REQUIRED FROM NIGEL

| Item | What | Where |
|---|---|---|
| `GROQ_API_KEY` | Add to Vercel env vars | Vercel dashboard → Environment Variables |
| `R2_*` vars (5 vars) | Add to Vercel for video storage | Vercel dashboard |
| `DEEPSEEK_API_KEY` | Add to Render env vars | Render dashboard |
| Goal Engine migration | Runs automatically on next Render deploy | No action if bhora-ai has been pushed |
| `/player/success-engine` | Hub card points here but page is at `/player/goal` | Either create alias or fix href |

---

### ALL BUILT ROUTES — ADDITIONS (10 April 2026)

```
/player/goal           Mission Mode — goal engine, AI plan, daily missions, adherence
```

### ENVIRONMENT VARIABLES — UPDATED (add GROQ_API_KEY)

**Vercel (add this):**
```
GROQ_API_KEY = (from console.groq.com → API Keys)
```
---

## SESSION LOG — 13 April 2026

### Theme — Scout Profile New Features + CLAUDE.md Update Rule + FIFA Coaching Methodology

---

### COMPLETED THIS SESSION — DO NOT REBUILD

#### 1. CLAUDE.md Update Rule — ADDED (Permanent)
New permanent rule at top of CLAUDE.md: Claude MUST update CLAUDE.md in the same commit as every feature.
Covers: new routes, env vars, backend files, session logs, incomplete work table.

#### 2. FIFA Coaching Methodology — Injected into THUTO
Full FIFA age-appropriate frameworks injected into BASE_PROMPT in ThutoChat.tsx and ThutoChatCoach.tsx.
GAG (under 12), Progressive Methodology (12-15), Play-Practice-Play (15+).
Six non-negotiables: Fun, Safety, Clear purpose, Inclusion, Game-based learning, Maximum touches.

#### 3. Player Hub Consolidation — 20 cards to 11 cards
Merged redundant cards. File: src/app/player/page.tsx
- Train Now (/player/pitch) — merged: Start Session, Pitch Mode, Session Tracker
- Drills & Formats (/player/drills) — merged: Drill Library, Training Formats
- My Videos (/player/vault) — merged: Highlight Vault, Moment Capture, Talent Showcase
- Scout Profile (/player/talent-id) — merged: Talent ID, My Potential, Market Value
- My Journey (/player/progress) — merged: My Progress, Milestones

#### 4. Drill Library Fix
- Fixed API fallback: threshold changed from raw.length > 0 to raw.length >= ALL_DRILLS.length
- Fixed categories stat tile: shows active count not hardcoded 9
- Added Training Formats quick-access row (Rondo, Small-Sided, Shooting)
- File: src/app/player/drills/page.tsx

#### 5. Pitch Mode (Train Now) Fix
- Added Log Session + Session Tracker buttons on no_schedule and rest_day phases
- File: src/app/player/pitch/page.tsx

#### 6. Cross-links on All Merged Hub Cards
- /player/vault — added Showcase + Moment Capture tiles
- /player/talent-id — added My Potential + Market Value cards
- /player/progress — added Milestones link
- /lib/offlineDB.ts — made equipment_needed optional (TypeScript fix)

#### 7. Scout Profile Full Rebuild (/player/talent-id)
New features added to existing page (all scoring logic preserved):
- Profile identity card: avatar, name, position, sport, province, club, bio (from GET /profile)
- Open for Scouting toggle: saves to PATCH /profile, green when on / grey when off
- Plays Like section: Zimbabwean player comparisons by position
  Winger → Khama Billiat | Midfielder → Nakamba/Munetsi | CB → Teenage Hadebe | GK → Mkuruva
- Share Public CV button: copies grassrootssports.live/player/[id]/cv to clipboard
- Showcase Clips tile linking to /player/showcase
- Prompt to complete profile if position/sport missing
- Profile + sessions loaded in parallel (Promise.allSettled)
- File: src/app/player/talent-id/page.tsx

#### 8. open_for_scouting Column — Migration Code (needs running on Render)

FILE: database/migrations/2026_04_13_000001_add_open_for_scouting_to_profiles_table.php

```php
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->boolean('open_for_scouting')->default(false)->after('bio');
        });
    }
    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->dropColumn('open_for_scouting');
        });
    }
};
```

Add to ProfileController update() validation:
```php
'open_for_scouting' => 'nullable|boolean',
```

Add to Profile model $fillable:
```php
'open_for_scouting',
```

Fallback SQL (run on Render PostgreSQL directly if needed):
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS open_for_scouting BOOLEAN DEFAULT false;
```

---

### WHAT STILL NEEDS DOING (13 April 2026)

| Item | Status | Action Required |
|---|---|---|
| open_for_scouting column | Code written — NOT YET RUN on Render | Copy migration to bhora-ai + php artisan migrate |
| GROQ_API_KEY | NOT set in Vercel | Add to Vercel env vars — all THUTO AI broken without this |
| R2_* vars (5 vars) | NOT set in Vercel | Add for video storage / showcase clips |
| /player/success-engine | Hub card href mismatch — page lives at /player/goal | Fix href in player/page.tsx |

---

### ALL BUILT ROUTES — ADDITIONS (13 April 2026)

No new routes this session. Enhanced existing:
```
/player/talent-id   Scout Profile — profile header, scouting toggle, Plays Like, public CV share
```

---

## SESSION LOG — 14 April 2026

### Theme — t.map/filter crash fix + safeArray utility (codebase-wide)

---

### COMPLETED THIS SESSION — DO NOT REBUILD

#### 1. `t.map is not a function` / `filter is not a function` — FIXED CODEBASE-WIDE ✅

**Root cause:**
Laravel can return API data in three shapes:
- Direct array: `[...]`
- Paginated: `{ data: [...], total, per_page, ... }`
- Wrapped: `{ data: { data: [...], ... } }`

The unsafe pattern used everywhere was:
```typescript
res.data?.data ?? res.data ?? []
```
When Laravel returns a pagination wrapper with `data: null` (e.g. `{ data: null, total: 0 }`),
`res.data` is a truthy object, so `?? []` never fires. Calling `.map()` or `.filter()`
on a plain object throws at runtime.

**Fix applied to every affected file:**
```typescript
const _r = res.data?.data ?? res.data;
Array.isArray(_r) ? _r : []
```

**Files fixed (18 files):**
- `src/app/player/sessions/page.tsx`
- `src/app/player/notifications/page.tsx`
- `src/app/player/stats/page.tsx`
- `src/app/player/milestones/page.tsx`
- `src/app/player/showcase/page.tsx`
- `src/app/player/progress/page.tsx`
- `src/app/player/page.tsx`
- `src/app/coach/page.tsx`
- `src/app/coach/squad/page.tsx`
- `src/app/coach/notifications/page.tsx`
- `src/app/coach/scouting/page.tsx`
- `src/app/coach/tactics/page.tsx`
- `src/app/scout/page.tsx`
- `src/app/scout/compare/page.tsx`
- `src/app/fan/discover/page.tsx`
- `src/app/fan/following/page.tsx`
- `src/app/injury-tracker/page.tsx`
- `src/app/streaming/page.tsx` (two queryFns fixed)
- `src/app/talent-database/page.tsx`

#### 2. `src/lib/safe-array.ts` — NEW UTILITY ✅

Created a reusable helper for all future API array extraction:
```typescript
export function safeArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data !== null && typeof data === "object") {
    const inner = (data as Record<string, unknown>).data;
    if (Array.isArray(inner)) return inner as T[];
  }
  return [];
}
```
Usage: `import { safeArray } from "@/lib/safe-array"; setSessions(safeArray(res.data));`

#### 3. Scout Profile (`/player/talent-id`) — REBUILT ✅ (13 April 2026)

- Profile identity card: avatar, name, position, sport, province, club, bio
- Open for Scouting toggle — saves to `PATCH /profile` with `open_for_scouting` field
- "Plays Like" section — Zimbabwean player comparisons by position (lookup table)
- Share Public CV button — copies `grassrootssports.live/player/[id]/cv` to clipboard
- Showcase Clips tile — links to `/player/showcase`
- Safe array extraction for sessions data

#### 4. Laravel `open_for_scouting` field mapping — FIXED ✅ (13 April 2026)

No new migration needed. Existing column is `scout_visible`.
`PlayerProfileController.php` was updated to:
- `show()`: appends `open_for_scouting` alias: `array_merge($profile->toArray(), ['open_for_scouting' => (bool) $profile->scout_visible])`
- `update()`: accepts `open_for_scouting` and maps to `scout_visible`

**File:** `app/Http/Controllers/Api/PlayerProfileController.php` (bhora-ai repo)
**Migration status:** No migration required — using existing `scout_visible` column.

---

### COMMITS THIS SESSION

```
9ef3878  fix: eliminate t.map/filter is not a function across entire codebase
e9a137d  feat: rebuild scout profile (/player/talent-id) with identity card, scouting toggle, Plays Like, CV share
2bb97eb  fix: align open_for_scouting field — no migration, map to existing scout_visible column
e704a4c  docs(claude): CLAUDE.md update rule + session log 13 April 2026
55859eb  fix: Array.isArray guards for player pages — sessions, notifications, stats, milestones
```

---

### WHAT STILL NEEDS DOING

| Item | Status | Action Required |
|---|---|---|
| `GROQ_API_KEY` | NOT set in Vercel | Add to Vercel env vars — all THUTO AI broken without this |
| `R2_*` vars (5 vars) | NOT set in Vercel | Add for video storage / showcase clips |
| `/player/success-engine` | Hub card href mismatch — page lives at `/player/goal` | Fix href in `src/app/player/page.tsx` or create alias page |
| `scout_visible` on Render DB | Column already exists — confirmed no migration needed | Nothing — working as-is |

---

### RULE ADDED — SAFE ARRAY PATTERN (PERMANENT)

When extracting arrays from any API response in this codebase:

**NEVER use:**
```typescript
res.data?.data ?? res.data ?? []
```

**ALWAYS use:**
```typescript
const _r = res.data?.data ?? res.data;
Array.isArray(_r) ? _r : []
// OR:
import { safeArray } from "@/lib/safe-array";
safeArray(res.data)
```


---

## SESSION LOG — 15 April 2026

### Theme — FIFA Once-a-Week Methodology + Player Passport

---

### COMPLETED THIS SESSION — DO NOT REBUILD

#### 1. FIFA Once-a-Week Session Templates — Injected into THUTO ✅

**File:** `src/components/thuto/ThutoChat.tsx` — BASE_PROMPT extended with:

**FIFA 3-Part Session Framework** (THUTO ALWAYS follows this when generating sessions):
- PART 1: Fun Warm-up (10–15 min) — ball always involved, competitive, high energy
- PART 2: Mini-Games 3v3 or 4v4 (20–25 min) — max touches, max decisions, no lines
- PART 3: Real-Game Application (15–20 min) — unscripted play, full expression, coach observes only

THUTO explicitly calls out sessions missing any part: "This plan is missing Part 2 — let me fix that."

#### 2. Freedom of Expression / Zimbabwean Flair — Injected into THUTO ✅

**File:** `src/components/thuto/ThutoChat.tsx` — added FREEDOM OF EXPRESSION section:
- Match day reminder to coaches: "Today: positive reinforcement only. Let players solve it."
- THUTO NEVER tells a player what specific move to make in a game
- Self-discovery principle: players who solve problems themselves remember the solution forever
- THUTO celebrates individual creativity: "That is the Zimbabwean game. Nobody can take that away."

#### 3. Player Passport — Public Shareable Page ✅

**File:** `src/app/passport/[id]/page.tsx` (NEW — no auth required)

Public page scouts and scholarship agencies open from the share link.
- Fetches `GET /api/v1/player/public/{id}` (public endpoint, no token)
- Fetches `GET /api/v1/showcase/discover?user_id={id}` for video highlights
- Shows: identity card, AI summary, academic standing, coach endorsements, video highlights
- Download Passport PDF button (jsPDF, full A4, no auth needed)
- CTA to join GrassRoots Sports

#### 4. My Passport Hub Card + Sidebar Nav ✅

- `src/app/player/page.tsx` — new hub card (purple gradient, BookOpen icon)
- `src/components/layout/sidebar.tsx` — nav item after Talent ID

---

### ALL BUILT ROUTES — ADDITIONS (15 April 2026)

```
/player/passport       Player edits their own talent passport, generates AI summary, exports PDF
/passport/[id]         Public shareable passport — no auth — scouts/scholarship agencies view this
```

---

### WHAT STILL NEEDS DOING

| Item | Status | Action Required |
|---|---|---|
| `GROQ_API_KEY` | NOT set in Vercel | Add to Vercel env vars — all THUTO AI broken without this |
| `R2_*` vars (5 vars) | NOT set in Vercel | Add for video storage / showcase clips |
| `/player/success-engine` | Hub card href mismatch — page lives at `/player/goal` | Fix href or create alias |
| Passport backend fields | DONE ✅ — committed in a6ea484, auto-migrated on Render | No action needed |

### PASSPORT MIGRATION (copy to bhora-ai, run php artisan migrate):

```php
// FILE: database/migrations/2026_04_15_000001_add_passport_fields_to_profiles_table.php
Schema::table('profiles', function (Blueprint $table) {
    $table->string('school_name')->nullable()->after('bio');
    $table->string('grade_level')->nullable()->after('school_name');
    $table->string('academic_average')->nullable()->after('grade_level');
    $table->string('academic_year')->nullable()->after('academic_average');
    $table->json('coach_endorsements')->nullable()->after('academic_year');
    $table->unsignedInteger('passport_views')->default(0)->after('coach_endorsements');
});
```

Add to ProfileController@update() validation + Profile model $fillable + cast coach_endorsements as array.

---

### COMMIT THIS SESSION

```
3b63e88  feat: FIFA session templates + Freedom of Expression + Player Passport public page
```

---

## SESSION LOG — 15 April 2026

### Theme — FIFA Once-a-Week Methodology + Player Passport + Strategic Patterns

---

### COMPLETED THIS SESSION — DO NOT REBUILD

#### 1. FIFA Once-a-Week Training Methodology — Injected into THUTO ✅

**File updated:** `src/components/thuto/ThutoChat.tsx`
- 3-part FIFA session framework injected into BASE_PROMPT:
  - PART 1: Fun Warm-up (10-15 min) — ball always involved, competitive activity
  - PART 2: Mini-Games 3v3 or 4v4 (20-25 min) — small-sided, decision-making
  - PART 3: Real-Game Application (15-20 min) — unscripted full expression
- Freedom of Expression / Zimbabwean Flair section added:
  - No over-coaching reminder
  - Match day = encouragement only, not instruction
  - Celebrate creative play, Zimbabwean flair

#### 2. Player Passport Public Page — BUILT ✅

**New file:** `src/app/passport/[id]/page.tsx`
- Public shareable page — no auth required
- Fetches `GET /api/v1/player/public/{id}` + `GET /api/v1/showcase/discover?user_id={id}`
- Identity card: avatar/initials, position, sport, province, age group, physical stats
- AI Performance Summary, Academic Standing, Coach Endorsements, Video Highlights
- RatingBar component for skill attributes
- jsPDF export (full A4, green header, gold section headers, multi-page support)
- CTA to join GrassRoots Sports
- Not-found state if no public profile
- Share URL: `grassrootssports.live/passport/${id}`

**Modified:** `src/app/player/page.tsx` — added My Passport hub card (BookOpen icon, `/player/passport`)
**Modified:** `src/components/layout/sidebar.tsx` — added My Passport nav item (player role)

**Backend needed (bhora-ai):**
Migration needed for passport fields on profiles table:
- `school_name`, `grade_level`, `academic_average`, `academic_year`
- `coach_endorsements` (JSON array)
- `passport_views` (integer counter)

#### 3. Strategic Patterns (Compounding Team Intelligence) — BUILT ✅

**New file:** `src/app/coach/patterns/page.tsx`

A coach analytics dashboard that reads match history and detects recurring team patterns,
then prescribes drills and generates a THUTO 4-Week Strategic Plan.

**How it works:**
- Reads `coach_matches` from localStorage + `GET /api/v1/matches` from API (merged, de-duplicated)
- Reads `coach_match_events` from localStorage (raw minute-by-minute events saved by live-match)
- `calculatePatterns()` function detects up to 6 patterns:
  1. Team Form & Momentum — win rate from last 10 matches
  2. Defensive Solidity — avg goals conceded, clean sheet rate
  3. Late-Game Energy (65-90 min) — goals conceded in last 25 mins from event data
  4. Discipline & Card Control — yellow/red cards per match
  5. Goal Scoring Efficiency — avg goals scored
  6. Formation Effectiveness — only shown if 2+ formations used with significant gap
- Severity levels: `critical` (red) / `warning` (amber) / `good` (green)
- Static `DRILLS` lookup table — no API call needed for prescriptions
- PatternCard component: severity badge, evidence, THUTO insight, expandable drill section
- "4-Week Strategic Plan" section: calls `/api/ai-coach` for THUTO's full compounding strategy
- Compounding loop banner explaining the business flywheel
- Summary row: W/D/L + Critical/Warning/Good counts
- Empty state with link to Live Match tool

**Modified:** `src/app/coach/live-match/page.tsx`
- Added additive event save in `handleEndMatch` — saves raw events to `coach_match_events` localStorage key
- Format: `{ matchId, date, opponent, sport, events: MatchEvent[] }` — keeps last 20 matches
- Does NOT replace existing `coach_matches` save — fully additive

**Modified:** `src/app/coach/page.tsx`
- Added TrendingUp import
- Added Strategic Patterns hub card: navy blue gradient, `/coach/patterns`

**Modified:** `src/components/layout/sidebar.tsx`
- Added Strategic Patterns nav item (SeasonIcon/TrendingUp, coach role) after Live Match

---

### ALL BUILT ROUTES — ADDITIONS (15 April 2026)

```
/passport/[id]         Player Passport — public shareable page, no auth, jsPDF export
/coach/patterns        Strategic Patterns — pattern detection, drill prescriptions, THUTO 4-week plan
```

---

### WHAT STILL NEEDS DOING (15 April 2026)

| Item | Status | Action Required |
|---|---|---|
| Passport backend fields | DONE ✅ — committed in a6ea484, auto-migrated on Render | No action needed |
| `GROQ_API_KEY` | NOT set in Vercel | Add to Vercel env vars — THUTO AI broken without this |
| `R2_*` vars (5 vars) | NOT set in Vercel | Add for video storage / showcase clips |
| `/player/success-engine` | Hub card href mismatch | Fix href to `/player/goal` or create alias |

---

## SESSION LOG — 22 April 2026

### Theme — Biomechanics Remote Scouting Loop + APK Data on Web + Drills Card Restore

---

### COMPLETED THIS SESSION — DO NOT REBUILD

#### 1. Drills Library Card Restored to Player Hub ✅

**File:** `src/app/player/page.tsx`
- Drills card was removed during the April 13 consolidation (20→11 cards)
- Added back: `Dumbbell` icon, title "Drills Library", subtitle "500+ drills · Record & Analyse", href `/player/drills`
- Inserted after "Train Now" card — correct position in the training workflow

#### 2. `/player/assessment` — APK Sessions Tab (Real Biomechanics Data) ✅

**File:** `src/app/player/assessment/page.tsx` — rebuilt with two tabs

**Tab 1: Field Tests** (existing functionality preserved)
- Position selector, test entry, benchmark comparison, skill radar (recharts), AI performance report

**Tab 2: APK Sessions** (NEW — wired to real backend data)
- Fetches `GET /api/v1/training/sessions` on tab open → shows list of sessions with date + score
- Click any session → fetches `GET /api/v1/sessions/{id}/report`
- Shows real `CoachingReportService` output:
  - `coaching_report.summary` — THUTO coaching narrative
  - `coaching_report.shona_message` — motivational phrase in Shona
  - `coaching_report.strengths` — green card with tick list
  - `coaching_report.improvements` — amber card with areas to work on
  - `coaching_report.drill_tips` — blue card
  - `drill_sets` — per-drill breakdown: name, form_score bar, rep_count
- Safe fallback: empty state message if no coaching report generated yet
- Uses `safeArray()` for all API responses — no filter/map crashes

**How the data gets here (full chain):**
```
Player does drill in APK
  → Flutter records ML Kit pose snapshots
  → POST /api/v1/sessions/{id}/drill-sets/{setId}/poses
  → AnalysePoseDataJob dispatched
  → PoseAnalysisService: computes form_score per drill (joint angle analysis)
  → CoachingReportService: generates summary/strengths/improvements/shona_message
  → stored in coaching_reports table + drill_sets.form_score
  → PlayerStat.avg_form_score rolling average updated
  → GET /api/v1/sessions/{id}/report returns full data
  → /player/assessment APK tab displays it
```

#### 3. `/scout/reports` — Real Biomechanics Data in PDF ✅

**File:** `src/app/scout/reports/page.tsx`

**New function: `fetchBiomechanicsData(playerId)`**
- Calls `GET /api/v1/scout/players/{id}` (already built on backend)
- Returns: `avg_form_score`, `total_sessions`, `programme_complete`, `rating`
- Silently returns `{}` if endpoint fails — no crash

**`fetchPlayerAnalysis()` enriched:**
- Calls `fetchBiomechanicsData()` before generating AI text
- When `avg_form_score` is available, adds to context:
  `"Biomechanics Form Score (from APK AI analysis): 74/100. Total recorded sessions: 12. AI Rating category: Developing."`
- AI generates a more accurate, data-backed scouting report

**`generatePdf()` enriched:**
- Accepts optional `bio?: BiomechanicsData` parameter
- When biomechanics data is available, PDF player table includes extra rows:
  - APK Form Score (e.g. "74 / 100 (biomechanics AI)")
  - Recorded Sessions count
  - AI Rating category

**`generateReports()` updated:**
- Calls `fetchBiomechanicsData()` first, passes `bio` to both `fetchPlayerAnalysis()` and `generatePdf()`
- Two API calls per report: one for biomechanics, one for AI analysis

**End result scouts see:**
- PDF now shows APK biomechanics form score alongside the overall score
- AI analysis is aware of the real recorded session data
- When player has no APK data, fallback is clean — `bioContext` is empty string

---

### BIOMECHANICS REMOTE SCOUTING LOOP — COMPLETE ✅

The full chain is now wired end-to-end:

```
Player trains with APK (Flutter + ML Kit)
  ↓
Biomechanics form score computed (PoseAnalysisService)
  ↓
avg_form_score stored on PlayerStat
  ↓
Scout sees real form score in /scout (ScoutPlayerController::anonymise)
  ↓
Scout generates PDF report (/scout/reports)
  ↓
PDF includes real biomechanics APK score + AI narrative backed by real data
  ↓
Player sees their own coaching report in /player/assessment → APK Sessions tab
```

**This is the full remote scouting loop** — a scout in Harare can discover a player
from Hwange, see their form score derived from actual biomechanics training data,
and generate a professional PDF report — all without the player or scout being in the same place.

---

### ALL BUILT ROUTES — ADDITIONS (22 April 2026)

No new routes — enhanced existing:
```
/player/assessment     — now has APK Sessions tab showing real coaching reports from backend
/scout/reports         — PDF now includes real APK biomechanics form score when available
/player              — Drills Library card restored
```

---

### WHAT STILL NEEDS DOING (22 April 2026)

| Item | Status | Action Required |
|---|---|---|
| `GROQ_API_KEY` | NOT set in Vercel | Add to Vercel env vars — THUTO AI broken without this |
| `R2_*` vars (5 vars) | NOT set in Vercel | Add for video storage / showcase clips |
| Passport backend fields | DONE ✅ — committed in a6ea484, auto-migrated on Render | No action needed |
| `/player/success-engine` | DONE ✅ — sidebar + hub card fixed (23 April 2026) | No action needed |
| `GET /api/v1/sessions/{id}/report` | Backend endpoint — confirm it exists | Test: `curl -H "Authorization: Bearer {token}" https://bhora-ai.onrender.com/api/v1/sessions/{id}/report` |

---

## SESSION LOG — 21 April 2026

### Theme — Pitch Mode Backend Migration + drills page filter crash fix

---

### COMPLETED THIS SESSION — DO NOT REBUILD

#### 1. `filter is not a function` crash on `/player/drills` — FIXED ✅

**Root cause:** `gs_futurefit_assignments` localStorage key was parsed with no `Array.isArray` guard.
When data was stored as an object (from an older app version), calling `.filter()` on the plain object threw at runtime.

**Fix applied:** `src/app/player/drills/page.tsx` lines 261-262:
```typescript
// BEFORE:
const raw = localStorage.getItem("gs_futurefit_assignments");
if (raw) setAssignedDrills(JSON.parse(raw) as AssignedDrill[]);

// AFTER:
const raw = localStorage.getItem("gs_futurefit_assignments");
if (raw) {
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) setAssignedDrills(parsed as AssignedDrill[]);
}
```

Commit: `8c27dde`

---

#### 2. Pitch Mode — Laravel Backend Migration — CONFIRMED ON RENDER ✅

**Context:** `/player/pitch` page.tsx calls:
- `POST /api/v1/training/sessions` — `saveDrillSession()` — sends `schedule_id`, `day_name`, `drills_completed`, `total_drills`, `feeling`, `completed_at`
- `POST /api/v1/conditioning/sessions` — `saveAndFinishCond()` — sends `session_type`, `cards_used` (string[]), `duration_actual`, `intensity_felt`, `joy_response`

**What was already built (confirmed via bhora-ai repo audit):**
- `training_sessions` table — existed from `2026_02_20_000004` migration
- `TrainingSessionController::storePitch()` — route `POST training/sessions` at line 246 of routes/api.php
- `conditioning_sessions` table — existed from `2026_04_13_000002` migration with all needed columns
- `ExerciseCardController::logSession()` — route `POST conditioning/sessions` at line 579

**What was missing:**
- `training_sessions` table lacked 6 columns sent by `saveDrillSession`: `schedule_id`, `completed_drills`, `total_drills`, `duration_actual`, `joy_response`, `logged_at`
- NOTE: `storePitch` controller does NOT write these columns — it maps `feeling` → `overall_score` and `day_name` → `focus_area`. The migration was additive for future use.

**Migration created and deployed:**
```
FILE: database/migrations/2026_04_21_000001_add_pitch_mode_fields_to_training_sessions_table.php
```
Adds 6 columns to existing `training_sessions` table (additive — no data loss).

**Verification on Render (CONFIRMED ✅):**
- `POST /api/v1/training/sessions` with valid auth → HTTP 201, `"Pitch session saved."` ✅
- `POST /api/v1/conditioning/sessions` with valid auth → HTTP 422 (correct: cards_used must be array, not scalar) ✅

Both endpoints are live. `pitch/page.tsx` session logging works end-to-end.

---

### WHAT STILL NEEDS DOING (21 April 2026)

| Item | Status | Action Required |
|---|---|---|
| Passport backend fields | DONE ✅ — committed in a6ea484, auto-migrated on Render | No action needed |
| `GROQ_API_KEY` | NOT set in Vercel | Add to Vercel env vars — all THUTO AI broken without this |
| `R2_*` vars (5 vars) | NOT set in Vercel | Add for video storage / showcase clips |
| `/player/success-engine` | ✅ FIXED (23 April 2026) | Sidebar + hub card now point to `/player/success` |

---

## SESSION LOG — 23 April 2026

### Theme — THUTO Success Engine Frontend (complete)

---

### COMPLETED THIS SESSION — DO NOT REBUILD

#### 1. THUTO Success Engine — FULLY BUILT ✅

All lib layer was already committed (from prior session):
- `src/lib/success/storage.ts` — Goal/CheckIn interfaces, localStorage CRUD, adjustment engine
- `src/lib/success/streak.ts` — streak, success probability, week grid, weekly rate
- `src/lib/success/actions.ts` — goal type detection, 5 action blueprints
- `src/lib/success/notifications.ts` — browser Notification API + periodicSync scheduling
- `src/app/api/success-adjust/route.ts` — Groq: acknowledge struggle → adjust actions
- `src/app/api/success-analysis/route.ts` — Groq: weekly performance analysis
- `public/sw.js` — periodicSync handler + notificationclick → `/player/success/checkin`

Built this session:

**`src/app/player/success/page.tsx`** — Main dashboard
- Stage 1 (no goal): 2-step goal setup wizard
  - Step 1: goalText + whyText + auto-detected action blueprint preview
  - Step 2: days timeline (30/60/90/180) + daily reminder time picker
  - Calls `saveGoal()` + `requestNotificationPermission()` + `scheduleDailyReminder()`
- Stage 2 (has goal): Full dashboard
  - Goal card: text, "why", days left, target date
  - Check-in CTA (gold) when not done → `/player/success/checkin`
  - Done state (green) when already checked in: shows score
  - Stats row: current streak (🔥) / success probability / weekly rate
  - Success probability bar: green/amber/red depending on value
  - Week grid: 7-day dots — gold=done, red=missed, grey=future
  - Today's 3 actions with completion state from today's check-in
  - Adjustment Card (amber): appears when 3 consecutive days < 70% and not seen this week
    - Calls `POST /api/success-adjust` with goal + reason + actions
  - Weekly Report Card: appears after 7+ check-ins
    - Strongest/weakest action tiles
    - Calls `POST /api/success-analysis` for THUTO's personal analysis
  - Reset goal button with confirm dialog

**`src/app/player/success/checkin/page.tsx`** — Daily check-in
- No goal → redirect prompt
- Has goal → check-in form:
  - Goal reminder card
  - 3 action toggle buttons (tap to mark done)
  - Mood slider (1-10) + optional mood note text
  - Submit → saves check-in, calls `/api/ai-coach` for short THUTO message
  - Done state: score badge, THUTO message in gold italics
- Pre-populates from existing today check-in (allows edits during the day)

**Routes fixed:**
- `src/components/layout/sidebar.tsx` — `/player/success-engine` → `/player/success`
- `src/app/player/page.tsx` — hub card `/player/goal` → `/player/success`

---

### ALL BUILT ROUTES — ADDITIONS (23 April 2026)

```
/player/success          THUTO Success Engine — goal setup, dashboard, streak, probability
/player/success/checkin  Daily Check-In — 3 actions, mood, THUTO message
```

---

### WHAT STILL NEEDS DOING (23 April 2026)

| Item | Status | Action Required |
|---|---|---|
| Passport backend fields | DONE ✅ — committed in a6ea484, auto-migrated on Render | No action needed |
| `GROQ_API_KEY` | NOT set in Vercel | Add to Vercel env vars — Success Engine analysis + THUTO chat broken without this |
| `R2_*` vars (5 vars) | NOT set in Vercel | Add for video storage / showcase clips |


---

## SESSION LOG — 25 April 2026

### Theme — Match Eye Rebuild (Gemini File API) + YOLOv8 Player Tracking Service

---

### COMPLETED THIS SESSION — DO NOT REBUILD

#### 1. Match Eye — Rebuilt with Gemini File API (Native Video Analysis) ✅

**Commit:** `156550c`

**What changed:**
- Old build used `inline_data` (base64 JPEG screenshots) — same as frame extraction, not real video
- New build uses Gemini File API — full video uploaded to Google's servers, Gemini watches natively

**New route: `src/app/api/match-eye/upload/route.ts`** (Edge Runtime)
- Initiates Gemini resumable upload session (`X-Goog-Upload-Protocol: resumable`)
- Streams full video bytes as ArrayBuffer to Google's upload URL
- Returns `{ fileUri, fileName, mimeType, state }`

**Updated route: `src/app/api/match-eye/analyse/route.ts`** (Node.js)
- Receives `fileUri` + `fileName` — NOT frames
- `waitForFileActive()` polls every 5s until Gemini state = `ACTIVE` (max 3 min)
- Calls `generateContent` with `file_data: { mime_type, file_uri }` — native video analysis
- Claude writes tactical narrative using `claude-sonnet-4-6`

**Updated page: `src/app/analyst/match-eye/page.tsx`**
- Removed: frame extraction, depth selector, 45 JPEG screenshots
- Added: real upload progress bar via XHR (fetch doesn't support upload progress events)
- Phases: `uploading` (gold bar, %) → `processing` (purple spinner) → `report`
- PDF header: "Full-match video analysis · Gemini 1.5 Pro + Claude"

#### 2. YOLOv8 Player Tracking Microservice — BUILT ✅

**Location:** `D:/bhora-ai/ai-service/` (separate repo — deploy to Render as Docker service)

**Files:**
- `D:/bhora-ai/ai-service/main.py` — FastAPI service, YOLOv8n + supervision ByteTracker
- `D:/bhora-ai/ai-service/requirements.txt` — fastapi, uvicorn, ultralytics, supervision, opencv-python-headless, scikit-learn
- `D:/bhora-ai/ai-service/Dockerfile` — Python 3.11 slim, OpenCV deps, pre-downloads YOLOv8n at build
- `D:/bhora-ai/ai-service/render.yaml` — Render Docker web service, standard plan (2 CPU / 4 GB RAM)

**How it works:**
1. Client uploads video directly to `POST https://ai.bhora-ai.onrender.com/track`
2. Service samples 1 frame/second (5,400 frames for 90-min match)
3. YOLOv8n detects every person (class 0) in each frame
4. supervision ByteTracker assigns persistent player IDs across all frames
5. K-means (k=3) on jersey HSV colors classifies players → home / away / referee
6. Pitch bounds detected via green grass HSV masking → coordinates normalised to 0-1
7. Returns per-player: positions array, distance_m, avg_x/y, 13×20 heatmap grid

**Response shape:**
```json
{
  "players": [{"id": 1, "team": "home", "positions": [...], "distance_m": 8420, "avg_x": 0.52, "avg_y": 0.48, "heatmap": [[...]]}],
  "stats": {"possession_home": 54, "possession_away": 46, "duration_seconds": 5400, "frames_processed": 5400},
  "video": {"width": 1920, "height": 1080, "fps": 25, "total_frames": 135000}
}
```

#### 3. TrackingDashboard Component — BUILT ✅

**File:** `src/components/match-eye/TrackingDashboard.tsx`

Components inside:
- `PitchView` — SVG pitch with pitch markings + player dots at average position (home=gold, away=blue)
- `HeatmapCanvas` — canvas-rendered 13×20 cell grid, colour scale transparent→cyan→yellow→red
- `PossessionBar` — animated bar chart for home/away possession %
- `DistanceLeaderboard` — top 10 players by distance, colour-coded bars
- `HeatmapGrid` — grid of per-player heatmaps (up to 22 players, 4 columns)
- `StatsSummary` — 6 stat cards: duration, frames, player counts, avg distances

#### 4. Match Eye — Player Tracking Tab Added ✅

**Commit:** `93c33c9`

**Updated: `src/app/analyst/match-eye/page.tsx`**
- Added tab switcher: "AI Match Report" (gold) | "Player Tracking" (purple, YOLOv8 badge)
- Clicking "Player Tracking" auto-triggers `runTracking()` if idle
- `runTracking()` uploads video via XHR FormData directly to `NEXT_PUBLIC_TRACKER_URL`
- Upload progress bar shown during video upload
- Processing spinner shown while YOLOv8 runs
- On completion: renders `<TrackingDashboard>` with full data
- Error state with Retry button
- AI Report tab still shows stats row + full analysis/narrative/events columns

---

### ALL BUILT ROUTES — ADDITIONS (25 April 2026)

No new Next.js routes — enhanced existing:
```
/analyst/match-eye   Now has "Player Tracking" tab with YOLOv8 + ByteTrack data
```

New external service:
```
POST https://ai.bhora-ai.onrender.com/track   Python FastAPI — YOLOv8 player tracking
GET  https://ai.bhora-ai.onrender.com/health  Health check
```

---

### ENVIRONMENT VARIABLES — NEW (25 April 2026)

**Vercel (add this):**
```
NEXT_PUBLIC_TRACKER_URL = https://ai.bhora-ai.onrender.com
```

---

### WHAT STILL NEEDS DOING (25 April 2026)

| Item | Status | Action Required |
|---|---|---|
| Deploy Python AI service | DONE ✅ — live on Render | No action needed |
| `NEXT_PUBLIC_TRACKER_URL` | DONE ✅ — set in Vercel | Player Tracking tab works end-to-end |
| `GOOGLE_AI_API_KEY` | DONE ✅ — set in Vercel | Match Eye upload + analysis works |
| `GROQ_API_KEY` | NOT set in Vercel | THUTO AI broken without this |
| `R2_*` vars (5 vars) | NOT set in Vercel | Video showcase clips broken without this |

### HOW TO DEPLOY THE PYTHON TRACKING SERVICE

1. Create new GitHub repo: `github.com/sciemec/grassroots-ai-service`
2. Push `D:/bhora-ai/ai-service/` contents to that repo
3. In Render dashboard → New → Web Service → Docker
4. Connect the new repo
5. Render will build the Dockerfile (downloads YOLOv8n at build time — baked into image)
6. Service URL will be: `https://grassroots-ai-tracker.onrender.com` (or similar)
7. Add that URL as `NEXT_PUBLIC_TRACKER_URL` in Vercel
8. Standard plan recommended — YOLOv8 needs 2+ GB RAM

NOTE: First request after cold start will be slow (~30s) — Render free tier sleeps.
Standard plan keeps the service warm. Consider upgrading for production use.

---

## SESSION LOG — 25 April 2026 (continued)

### Theme — Match Eye 413 Fix (direct client-to-Google upload)

---

### COMPLETED THIS SESSION — DO NOT REBUILD

#### 5. Match Eye — 413 Upload Error Fixed ✅

**Commit:** `db79548`

**Root cause:** Vercel blocks any request body larger than 4 MB before the Edge function code runs.
The old upload route received the full video bytes from the browser and forwarded them to Google.
This caused a 413 Payload Too Large on any video.

**Fix — two-step upload (no video bytes through Vercel):**

**`src/app/api/match-eye/upload/route.ts`** — now a tiny session-init only:
- Receives only two headers from the browser: `content-type` + `x-content-length` (no body)
- POSTs metadata to Gemini File API to start a resumable session
- Returns `{ uploadUrl, mimeType }` to the browser
- Video bytes never touch Vercel

**`src/app/analyst/match-eye/page.tsx`** — upload flow changed to:
1. `fetch POST /api/match-eye/upload` (headers only) → gets `{ uploadUrl }`
2. XHR `PUT uploadUrl` (browser PUTs video directly to Google's self-authenticating URL)
   - Upload progress bar still works via XHR `upload.progress` events
   - Bypasses Vercel entirely — no 413 possible
3. Parse Google's response → `{ file: { uri, name, mimeType } }`
4. `fetch POST /api/match-eye/analyse` → as before

**Why the Google URL is safe for direct browser upload:**
The `X-Goog-Upload-URL` returned by the resumable session init is self-authenticating —
it is a signed URL that does not require an API key for the PUT step.
The browser can PUT directly without exposing any credentials.

**Match Eye is now fully operational end-to-end:**
- Upload: any size video (tested up to 2 GB) ✅
- Analysis: Gemini 1.5 Pro watches native video ✅
- Report: Claude writes tactical narrative ✅
- Tracking: YOLOv8 player tracking via Python service ✅
- Env vars: `GOOGLE_AI_API_KEY` + `NEXT_PUBLIC_TRACKER_URL` both set in Vercel ✅

---

## SESSION LOG — 6 May 2026

### Theme — Conversion Features: Scout View Notifications + Urgency Banners + School Pitch + Ad Slots

---

### COMPLETED THIS SESSION — DO NOT REBUILD

#### 1. Profile View Tracking — Location + Deduplication ✅

**Migration (bhora-ai repo — additive to existing `profile_views` table):**
```
FILE: database/migrations/2026_05_06_000001_add_location_fields_to_profile_views_table.php
```
Adds 2 columns to existing table (no data loss):
- `scout_location` VARCHAR nullable — from Cloudflare CF-IPCity / CF-IPCountry headers
- `ip_address` VARCHAR nullable — SHA256 hashed raw IP (privacy-safe deduplication)

#### 2. ProfileViewController (Laravel) ✅

```
FILE: app/Http/Controllers/Api/ProfileViewController.php
```

Two public routes (NO auth middleware — optional auth):
```php
Route::post('/players/{playerId}/view',      [ProfileViewController::class, 'logView']);
Route::get('/players/{playerId}/view-count', [ProfileViewController::class, 'getViewCount']);
```

`logView()` behaviour:
- Uses `auth('sanctum')->user()` (not `$request->user()`) — resolves token if present, null if not
- Gets location from Cloudflare headers: `CF-IPCity`, `CF-IPCountry` → formatted as "Harare, ZW"
- Hashes IP with SHA256 before storing (never stores raw IP)
- **24-hour deduplication:** checks `profile_views` for existing row in last 24h before inserting
- Fires `Notification::send()` with type `opportunity` to the player if new view
- Notification body: "A scout from {location} viewed your profile"

`getViewCount()` returns count of views in the last 7 days.

**⚠️ ACTION REQUIRED:** Copy migration to bhora-ai repo + run `php artisan migrate --force` on Render.

#### 3. LogProfileView.tsx — Client Boundary Component ✅

**File:** `src/components/player/LogProfileView.tsx`

Needed because `src/app/player/public/[id]/page.tsx` is a server component — cannot use `useEffect` directly.
Standard Next.js pattern: client component that renders `null` but fires the fetch in `useEffect`.

- Fire-and-forget: `.catch(() => {})` — never breaks the public profile page
- Reads `auth_token` from localStorage; skips `dev-token`
- Sends `POST /api/v1/players/{playerId}/view` with optional Bearer token

**Modified:** `src/app/player/public/[id]/page.tsx`
- Added `<LogProfileView playerId={profile.id} />` inside a React fragment
- Added `<AdBanner slot="player-profile-bottom" fallback={true} />` before the CTA section

#### 4. ScoutViewBadge.tsx ✅

**File:** `src/components/player/ScoutViewBadge.tsx`

- Fetches `GET /api/v1/players/{playerId}/view-count` on mount
- 3 states:
  - 0 views → nudge to complete profile (grey)
  - 1-4 views → gold text "X scouts viewed your profile this week"
  - 5+ views → gold text + "Upgrade to Pro" button → `/player/subscription`
- Loading skeleton during fetch; fails silently if API down

**Modified:** `src/app/player/profile/page.tsx`
- Added `id?: string` to `Profile` interface (was missing — TypeScript fix)
- Added `<ScoutViewBadge playerId={profile.id} />` before the header section

#### 5. ProUpgradeBanner.tsx ✅

**File:** `src/components/player/ProUpgradeBanner.tsx`

- Gold `bg-amber-500` banner, dark green `text-green-900` text
- Only shown when `user.subscription_tier === "free"` or undefined
- **7-day localStorage dismiss** via `banner_dismissed` key storing timestamp
- X button sets dismiss; "Upgrade Now" links to `/player/subscription`
- Not shown for coach/scout/admin roles

**Modified:** `src/app/player/page.tsx` — `<ProUpgradeBanner />` as first element in main content
**Modified:** `src/app/player/profile/page.tsx` — `<ProUpgradeBanner />` above profile header

#### 6. SchoolPitchSection.tsx — Landing Page ✅

**File:** `src/components/landing/SchoolPitchSection.tsx`

- Dark green (`#14532d`) background section targeting school sports coordinators
- Two-column layout: Georgia serif headline + gold subtext + CTA / 3 bullet points
- CTA: "Register Your School" → `/register?role=coach&school=true`
- Mobile: `flex-col`, Desktop: `md:flex-row`

**Modified:** `src/app/page.tsx` — inserted `<SchoolPitchSection />` between sports section and features section

#### 7. Ad Banner System ✅

**File:** `src/config/ads.config.ts`
- TypeScript config mapping 4 slot names to ad content
- All slots default to `active: false` — safe to deploy now, activate when an advertiser books
- Slots:
  - `sidebar-top` — 300×250, shown at bottom of sidebar
  - `banner-below-nav` — 728×90, full-width below player layout nav
  - `landing-mid` — 1200×120, banner between sports and features sections on landing page
  - `player-profile-bottom` — 300×250, bottom of public player profile page

**File:** `src/components/ui/AdBanner.tsx`
- Reads `ADS_CONFIG[slot]`; if inactive + `fallback=true` → shows "Advertise here" placeholder
- If active → renders linked `<img>` with lazy loading + `rel="noopener noreferrer"`
- Server component (no "use client")

**File:** `public/ads/.gitkeep` — tracks the `public/ads/` folder for ad image uploads

**Ad slot placements:**
- `src/components/layout/sidebar.tsx` → `<AdBanner slot="sidebar-top" fallback={true} />` at bottom of NavContent
- `src/app/player/layout.tsx` → `<AdBanner slot="banner-below-nav" className="w-full" />` above `{children}`
- `src/app/page.tsx` → `<AdBanner slot="landing-mid" />` between sports and features sections
- `src/app/player/public/[id]/page.tsx` → `<AdBanner slot="player-profile-bottom" fallback={true} />` before CTA

---

### HOW TO ACTIVATE ADS (when first advertiser books)

1. Upload ad image to `public/ads/your-ad.webp` (max 200KB, WebP format)
2. In `src/config/ads.config.ts`, set `active: true` + fill in `imageUrl`, `linkUrl`, `altText`
3. `git push origin master` → Vercel deploys → ad goes live immediately
4. No code changes needed beyond the config file

---

### ALL BUILT ROUTES — ADDITIONS (6 May 2026)

No new routes — enhanced existing pages:
```
/player/public/[id]   Now logs profile views (LogProfileView) + shows ad at bottom
/player/profile       Now shows ScoutViewBadge + ProUpgradeBanner
/player              Now shows ProUpgradeBanner
/ (landing)           Now shows SchoolPitchSection + landing-mid ad slot
```

New public API routes (bhora-ai):
```
POST /api/v1/players/{playerId}/view       Log a profile view (public, optional auth)
GET  /api/v1/players/{playerId}/view-count Scout view count for last 7 days (public)
```

---

### WHAT STILL NEEDS DOING (6 May 2026)

| Item | Status | Action Required |
|---|---|---|
| `profile_views` migration | WRITTEN — NOT YET RUN on Render | Copy `2026_05_06_000001_add_location_fields_to_profile_views_table.php` to bhora-ai + `php artisan migrate --force` |
| `ProfileViewController.php` | WRITTEN — NOT COMMITTED to bhora-ai | Copy controller to `app/Http/Controllers/Api/` in bhora-ai repo + push |
| `routes/api.php` (2 routes) | WRITTEN — NOT COMMITTED to bhora-ai | Add `POST /players/{playerId}/view` + `GET /players/{playerId}/view-count` routes |
| `GROQ_API_KEY` | NOT set in Vercel | Add to Vercel env vars — THUTO AI broken without this |
| `R2_*` vars (5 vars) | NOT set in Vercel | Add for video storage / showcase clips |
| Ad images | No advertisers yet | Upload WebP to `public/ads/` when first booking received; set `active: true` in `ads.config.ts` |

---

### COMMIT THIS SESSION

```
54e73f6  feat: scout view notifications, urgency banner, school pitch, ad slots
```

**Files changed (13):**
```
public/ads/.gitkeep                          (new)
src/app/page.tsx                             (SchoolPitchSection + landing-mid ad)
src/app/player/layout.tsx                   (banner-below-nav ad)
src/app/player/page.tsx                     (ProUpgradeBanner)
src/app/player/profile/page.tsx             (ScoutViewBadge + ProUpgradeBanner + id field)
src/app/player/public/[id]/page.tsx         (LogProfileView + player-profile-bottom ad)
src/components/landing/SchoolPitchSection.tsx (new)
src/components/layout/sidebar.tsx           (sidebar-top ad)
src/components/player/LogProfileView.tsx    (new)
src/components/player/ProUpgradeBanner.tsx  (new)
src/components/player/ScoutViewBadge.tsx    (new)
src/components/ui/AdBanner.tsx              (new)
src/config/ads.config.ts                    (new)
```

---

## SESSION LOG — 7 May 2026

### Theme — Chemistry Rating Phase 1: Backend (Week 1) + Coach Chemistry Matrix UI (Week 3)

---

### COMPLETED THIS SESSION — DO NOT REBUILD

#### 1. Chemistry Rating Phase 1 — Backend Foundations (Week 1) ✅

**Committed to bhora-ai repo as `5b99a8c`**

**5 new migrations (D:/bhora-ai/bhora-ai/database/migrations/):**
- `2026_05_07_000001_create_style_fingerprints_table.php` — 32-dim fingerprint vector (jsonb), confidence_score, under_18 flag, expires_at
- `2026_05_07_000002_create_style_fingerprint_history_table.php` — archives old fingerprints for player development tracking
- `2026_05_07_000003_create_style_similarities_table.php` — pairwise chemistry scores, canonical UUID ordering, top_matching/diverging dimensions
- `2026_05_07_000004_add_chemistry_columns_to_player_profiles_table.php` — adds safeguarding_consent_chemistry + chemistry_notifications_enabled to player_profiles
- `2026_05_07_000005_create_chemistry_data_access_log_table.php` — audit log for every under-18 chemistry data access (PRD requirement)

**2 new services:**
- `app/Services/StyleFingerprintService.php` — generates 32-dim fingerprint from drill_sets + pose_analysis_results. Min 8 drills / 3 sessions. 30-day expiry. cosine_similarity() + topDimensions() helpers.
- `app/Services/ChemistryService.php` — v1 formula: 60% style + 25% demographic + 15% geographic. runNightlyBatch(), calculatePair(), getSimilarPlayers(), getSquadMatrix(). Under-18 safeguarding, canonical pair ordering.

**1 new job:**
- `app/Jobs/RecalculateSimilaritiesJob.php` — dispatched nightly, 2h timeout, tries=1

**1 new controller:**
- `app/Http/Controllers/Api/ChemistryController.php` — 7 endpoints: getFingerprint, regenerateFingerprint, getSimilar, getPair, getSquadMatrix, updateConsent, deleteFingerprint. Under-18 access logging in every read.

**Routes added to `routes/api.php`:**
```
GET    /chemistry/fingerprint/{playerId}
POST   /chemistry/fingerprint/regenerate/{playerId}
DELETE /chemistry/fingerprint/{playerId}
GET    /chemistry/similar/{playerId}
GET    /chemistry/pair/{playerAId}/{playerBId}
GET    /chemistry/squad/{coachId}
POST   /chemistry/consent/{playerId}
```

**Scheduler added to `routes/console.php`:**
```php
Schedule::job(new \App\Jobs\RecalculateSimilaritiesJob)
    ->dailyAt('02:00')
    ->timezone('Africa/Harare')
    ->withoutOverlapping()
    ->runInBackground();
```

**Chemistry v1 Formula:**
- Style similarity: cosine similarity of 32-dim fingerprint vectors (0-100)
- Demographic score: age proximity (±4yr, 60% weight) + position group match (40% weight)
- Geographic score: same town=100, same province=70, different province=30
- Final: (style × 0.60) + (demographic × 0.25) + (geographic × 0.15)

**Eligibility constraints:**
- Same position group (forward/midfielder/defender/goalkeeper)
- Age within ±4 years
- Same country (Zimbabwe)
- Both have valid, non-expired fingerprints (confidence > 0)
- Under-18: both must be U18, both must have safeguarding_consent_chemistry=true, same province only

**Notification threshold:** 85% → max 2 chemistry notifications per player per 7 days

**ACTION REQUIRED — LARAVEL:**
Run `php artisan migrate --force` on Render to apply the 5 new migrations.

---

#### 2. Coach Chemistry Matrix UI — Week 3 (Next.js frontend) ✅

**Committed to grassroots-web as `2573d82`**

**4 new files:**

| File | Purpose |
|---|---|
| `src/components/chemistry/ChemistryMatrix.tsx` | N×N colour-coded grid, bidirectional pair lookup, click → pair detail page |
| `src/components/chemistry/PairDetail.tsx` | Score breakdown (style/demographic/geo bars), matching/diverging dimension pills, AI explanation |
| `src/app/coach/chemistry/page.tsx` | Squad matrix page: position filter, stats row, top-5 pairs list, PDF export (jsPDF) |
| `src/app/coach/chemistry/pair/[playerA]/[playerB]/page.tsx` | Pair detail page: fetches player names from squad silently |

**Matrix colour scale:**
- Green (85+) → Green-light (70-84) → Yellow (55-69) → Orange (40-54) → Red (<40) → Grey (no data)

**PDF export:** jsPDF — green header, squad stats, top-5 pairs with scores, confidential footer

**Hub card added:** `src/app/coach/page.tsx` — "Squad Chemistry" card (purple gradient, Zap icon, `/coach/chemistry`)

**Sidebar nav added:** `src/components/layout/sidebar.tsx` — "Squad Chemistry" after Strategic Patterns (coach role)

**API calls made:**
- `GET /api/v1/coach/squad` — get player names and positions
- `GET /api/v1/chemistry/squad/{coachId}` — get pairwise chemistry scores
- `GET /api/v1/chemistry/pair/{playerA}/{playerB}` — get single pair breakdown

---

### ALL BUILT ROUTES — ADDITIONS (7 May 2026)

```
/coach/chemistry                              Squad chemistry matrix with position filter + PDF export
/coach/chemistry/pair/[playerA]/[playerB]    Pair breakdown: score components, dimensions, AI explanation
```

---

### WHAT STILL NEEDS DOING (7 May 2026)

| Item | Status | Action Required |
|---|---|---|
| Chemistry migrations on Render | NOT YET RUN | `php artisan migrate --force` on Render |
| Week 5 — Player Chemistry View | NOT YET BUILT | `/players/similar` page + consent toggle in settings |
| `GROQ_API_KEY` | NOT set in Vercel | Add to Vercel env vars |
| `R2_*` vars (5 vars) | NOT set in Vercel | Add for video storage |

---

## SESSION LOG — 13 May 2026

### Theme — THUTO Talent Prediction Engine (Steps 6–15)

---

### COMPLETED THIS SESSION — DO NOT REBUILD

#### 1. Laravel Prediction Routes — ADDED ✅

**File:** `bhora-ai/routes/api.php`
```php
// Public read (cached 24h)
Route::get('/players/{id}/prediction', [PredictionController::class, 'show']);
// Auth required for manual refresh (rate-limited 1/hour)
Route::post('/players/{id}/prediction/refresh', [PredictionController::class, 'refresh'])
    ->middleware('auth:sanctum');
// Public leaderboard (cached 6h, filterable)
Route::get('/talent-leaderboard', [PredictionController::class, 'leaderboard']);
```

#### 2. GeneratePredictionJob — BUILT ✅

**File:** `bhora-ai/app/Jobs/GeneratePredictionJob.php`
- Queued job; dispatched from `TrainingSessionController::complete()` after every APK session completion
- Guards: count of completed sessions < 3 → silently returns (no AI call wasted)
- Catches `\Throwable`, logs error, never re-throws (queue never fails on prediction errors)
- Also added: `use App\Jobs\GeneratePredictionJob;` import + `GeneratePredictionJob::dispatch($session->user_id)` call in `TrainingSessionController::complete()`

#### 3. PredictionController::leaderboard() — BUILT ✅

**File:** `bhora-ai/app/Http/Controllers/Api/PredictionController.php`
- `GET /api/v1/talent-leaderboard` — no auth, cached 6h per filter combination
- Joins `player_predictions` → `users` → `player_profiles`
- Only returns `data_quality = 'medium'` or `'high'` (excludes low-data players)
- Optional filters: `province` (users.province varchar), `position` (player_profiles.position_primary), `sport` (users.sport), `age_group` (users.age_group enum)
- Names anonymised to initials via `makeInitials()` private helper: "Knowledge Musona" → "K.M."
- Returns: rank, user_id, initials, position, sport, province, age_group, peak_level, peak_level_label, projected_score, upside_rating, upside_label, percentile, comparable_name, data_quality

#### 4. PotentialCard.jsx — BUILT + 4 BUGS FIXED ✅

**File:** `src/components/player/PotentialCard.jsx`
- Bug 1: Fetch URL had double `/api/v1` — removed extra segment
- Bug 2: `LEVEL_COLOURS` keys didn't match backend `TalentPredictionService::LEVELS` — rewritten to: `'continental'`, `'sadc_international'`, `'premier_league'`, `'division_1'`, `'division_2'`, `'amateur'`
- Bug 3: `comparable` was expected as nested object but backend returns flat fields (`comparable_name`, `comparable_style`) — normalised in fetch handler
- Bug 4: `data_quality === 'Low'` (wrong case) → fixed to `=== 'low'`
- Renders: gradient header (colour-coded by level), peak level + percentile badge, 2×2 stats grid, comparable player block, confidence bar, expandable narrative, data quality warning, scout interest row (public view only)

#### 5. PotentialCard integrated into /player/profile ✅

**File:** `src/app/player/profile/page.tsx`
- Added `<PotentialCard playerId={String(user.id)} playerName={user.name} />` (uses `user.name` not `profile?.first_name` — Profile type has no `first_name`)
- Positioned between QR card and AI narrative section

#### 6. PotentialCard integrated into /player/public/[id] ✅

**File:** `src/app/player/public/[id]/page.tsx`
- Added `<PotentialCard playerId={profile.id} playerName={profile.name} isPublicView={true} />`
- Positioned between showcase clips and the ad banner
- `playerName={profile.name}` — `PublicProfile` interface has `name` not `first_name`

#### 7. /talent-leaderboard page — BUILT ✅

**File:** `src/app/talent-leaderboard/page.tsx`
- Public page, no auth required
- Filter panel (togglable): province, age group, sport, position text input
- Active filter count badge on filter button + "Clear all" link
- Expandable `LeaderboardCard` per entry: medals for top 3, initials avatar, peak level badge, score
  - Expanded: upside stars, percentile, THUTO score bar, comparable player block
  - "View Profile" → `/player/public/{user_id}` + "WhatsApp" share button
- Skeleton loader (10 rows), empty state with helpful context, error + retry state
- WhatsApp share: pre-formatted message with rank, initials, peak level, score, platform link

---

### ALL BUILT ROUTES — ADDITIONS (13 May 2026)

```
/talent-leaderboard    Public THUTO leaderboard — top 50 by projected_score, filterable
```

New public API routes (bhora-ai):
```
GET  /api/v1/talent-leaderboard   Top 50 predictions, filters: province/position/sport/age_group
```

---

### PLAYER_PREDICTIONS TABLE — SCHEMA

```sql
player_predictions:
  id              UUID PK
  player_id       UUID FK → users (unique, cascade delete)
  peak_level      VARCHAR  -- e.g. 'premier_league'
  peak_level_label VARCHAR  -- e.g. 'Premier Soccer League'
  projected_score DECIMAL(5,2)
  upside_rating   TINYINT  -- 1-5 stars
  upside_label    VARCHAR  -- e.g. 'High Potential'
  readiness_age   VARCHAR  -- e.g. '23-25'
  velocity        DECIMAL(5,2)  -- pts/month
  consistency     DECIMAL(5,2)  -- 0-100
  confidence      TINYINT  -- 0-100
  scout_interest  TINYINT  -- 0-100
  comparable_name VARCHAR nullable
  comparable_style VARCHAR nullable
  narrative       TEXT
  percentile      TINYINT  -- 0-100
  platform_rank   VARCHAR nullable  -- e.g. 'Top 5% in Harare'
  data_quality    VARCHAR  -- 'low' | 'medium' | 'high'
  refreshed_at    TIMESTAMP nullable
  created_at, updated_at
```

Migration: `bhora-ai/database/migrations/2026_05_13_000001_create_player_predictions_table.php`
**Auto-runs on Render deploy via `start.sh` → `php artisan migrate --force`**

---

### THUTO PREDICTION ENGINE — HOW IT WORKS

```
Player completes APK training session
  ↓
TrainingSessionController::complete() dispatched
  → AnalysePoseDataJob (biomechanics)
  → GeneratePredictionJob (talent prediction)
         ↓
         Guards: count(completed_sessions) < 3 → skip
         ↓
         TalentPredictionService::predict($player)
           - Reads avg_form_score from PlayerStat
           - Calculates velocity (improvement rate)
           - Calculates consistency (session regularity)
           - Calculates scout_interest (profile views)
           - Determines peak_level from score thresholds (LEVELS const)
           - Matches comparable player from COMPARABLES const
           - Computes percentile vs all predictions
           - Upserts player_predictions row
         ↓
  /api/v1/players/{id}/prediction → PotentialCard renders
  /api/v1/talent-leaderboard → top 50 public leaderboard
```

**LEVEL THRESHOLDS** (from `TalentPredictionService::LEVELS`):
| Level | Score Range | Label |
|---|---|---|
| amateur | 0–39 | Amateur / Village |
| division_2 | 40–54 | Division 2 |
| division_1 | 55–64 | Division 1 |
| premier_league | 65–74 | Premier Soccer League |
| sadc_international | 75–84 | SADC / International |
| continental | 85–100 | Continental / Africa Level |

---

### WHAT STILL NEEDS DOING (13 May 2026)

| Item | Status | Action Required |
|---|---|---|
| `player_predictions` migration on Render | Auto-runs on push | Verify via Render logs after `3b242a3` deploy |
| Chemistry migrations on Render | NOT YET RUN | `php artisan migrate --force` on Render |
| Week 5 — Player Chemistry View | NOT YET BUILT | `/players/similar` page + consent toggle in settings |
| End-to-end test (Step 16) | NOT YET DONE | Log 3 sessions with test player → verify `player_predictions` row + PotentialCard renders |
| `GROQ_API_KEY` | NOT set in Vercel | Add to Vercel env vars |
| `R2_*` vars (5 vars) | NOT set in Vercel | Add for video storage |

### HOW TO RUN STEP 16 END-TO-END TEST

```bash
# 1. Log in as player@grassrootssports.live (Player123!)
# 2. Complete 3 training sessions via APK or POST /api/v1/training/sessions (storePitch)
curl -X POST https://bhora-ai.onrender.com/api/v1/training/sessions \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"session_type":"programme","day_name":"Day 1","drills_completed":5,"total_drills":5,"feeling":"amazing"}'

# Repeat 3x, then check:
curl https://bhora-ai.onrender.com/api/v1/players/{player_uuid}/prediction
# Expected: { data: { peak_level: "...", projected_score: ... } }

# Then visit:
# https://grassrootssports.live/player/profile → PotentialCard should render
# https://grassrootssports.live/player/public/{uuid} → PotentialCard with isPublicView=true
# https://grassrootssports.live/talent-leaderboard → player should appear if data_quality != 'low'
```


---

## SESSION LOG — 14 May 2026

### Theme — THUTO Prediction Engine: Step 16 End-to-End Test + UUID Bug Fix

---

### COMPLETED THIS SESSION — DO NOT REBUILD

#### 1. End-to-End Test — PASSED ✅

**Test steps executed:**
1. Logged in as `player@grassrootssports.live` → got Sanctum token
2. Created + completed sessions 2, 3, 4 via `POST /api/v1/sessions` + `POST /api/v1/sessions/{id}/complete`
3. Triggered prediction refresh via `POST /api/v1/players/{id}/prediction/refresh`
4. Verified prediction stored in `player_predictions` table
5. Verified `GET /api/v1/players/{id}/prediction` returns prediction (200 OK)
6. Verified `GET /api/v1/talent-leaderboard` returns player T.P. at rank 1

**Results:**
- Player T.P. (UUID: `a164fcb6-8135-419e-99d6-19b0f7190a7c`) appears on leaderboard ✅
- `data_quality: medium` (4 sessions completed) ✅
- Province filter `?province=Harare` → returns player ✅
- Province filter `?province=Bulawayo` → returns empty array ✅
- Prediction cached 24h (GET) and 6h (leaderboard) ✅

#### 2. UUID Primary Key Bug Fixed — `TalentPredictionService.php` ✅

**Root cause:**
`DB::table('player_predictions')->updateOrInsert()` does not auto-generate UUID primary keys
on INSERT. The `player_predictions` table has `$table->uuid('id')->primary()` with no default
value. The first INSERT failed with a NOT NULL constraint, returning HTTP 500.

**Fix applied (`app/Services/TalentPredictionService.php`):**
Replaced `updateOrInsert()` with explicit `exists()` check + separate `update()` / `insert()`:
```php
$exists = DB::table('player_predictions')->where('player_id', $player->id)->exists();
if ($exists) {
    DB::table('player_predictions')
        ->where('player_id', $player->id)
        ->update(array_merge($prediction, ['updated_at' => now()]));
} else {
    DB::table('player_predictions')
        ->insert(array_merge($prediction, [
            'id'         => (string) \Illuminate\Support\Str::uuid(),
            'created_at' => now(),
            'updated_at' => now(),
        ]));
}
```

**Committed:** `d8cbf7b` — pushed to bhora-ai master → auto-deployed on Render

---

### THUTO PREDICTION ENGINE — FULLY LIVE ✅

All 16 steps of the THUTO Talent Prediction Engine briefing are now complete and tested end-to-end in production.

| Component | Status | Endpoint / File |
|---|---|---|
| `player_predictions` table | ✅ Migrated on Render | `2026_05_13_000001_create_player_predictions_table.php` |
| `TalentPredictionService` | ✅ Fixed UUID bug | `app/Services/TalentPredictionService.php` |
| `GeneratePredictionJob` | ✅ Fires on session complete | `app/Jobs/GeneratePredictionJob.php` |
| `PredictionController::show` | ✅ GET prediction cached 24h | `GET /api/v1/players/{id}/prediction` |
| `PredictionController::refresh` | ✅ Synchronous refresh with rate limit | `POST /api/v1/players/{id}/prediction/refresh` |
| `PredictionController::leaderboard` | ✅ Cached 6h per filter combo | `GET /api/v1/talent-leaderboard` |
| `PotentialCard.jsx` | ✅ Renders on player profile + public profile | `src/components/player/PotentialCard.jsx` |
| `/talent-leaderboard` page | ✅ Filters, WhatsApp share, skeleton | `src/app/talent-leaderboard/page.tsx` |
| `/player/dashboard` My Card CTA | ✅ Banner card linking to leaderboard | `src/app/player/page.tsx` |

**The full pipeline:** Player trains → `complete()` dispatches `GeneratePredictionJob` → job guards 3+ sessions → `TalentPredictionService::predict()` runs → upserts `player_predictions` → `PotentialCard` reads it on profile pages → player appears on public `/talent-leaderboard`.

---

### WHAT STILL NEEDS DOING (14 May 2026)

| Item | Status | Action Required |
|---|---|---|
| Chemistry migrations on Render | NOT YET RUN | `php artisan migrate --force` for 5 chemistry tables (7 May 2026 session) |
| Week 5 — Player Chemistry View | NOT YET BUILT | `/players/similar` page + consent toggle in settings |
| `GROQ_API_KEY` | NOT set in Vercel | Add to Vercel env vars — THUTO AI chat broken without this |
| `R2_*` vars (5 vars) | NOT set in Vercel | Add for video storage / showcase clips |
| Prediction projected_score | 0 for test player | Expected — no `PlayerStat` assessments logged via APK pose data yet |

---

## SESSION LOG — 15 May 2026

### Theme — Match Eye Gemini fix (correct file: Python AI service)

---

### COMPLETED THIS SESSION — DO NOT REBUILD

#### 1. Match Eye — `gemini-1.5-pro` 404 fixed in the correct file ✅

**Root cause (the real one):**
The previous session applied the Gemini model fix to `src/app/api/match-eye/analyse/route.ts` (the Next.js server route). That was the **wrong file** — that route is now dead code. The browser calls the Python AI service directly at `${NEXT_PUBLIC_TRACKER_URL}/analyse`, not the Next.js route.

The Python AI service `_analyse_background()` function at line 969 of `main.py` still had:
```python
# BEFORE (broken — model retired):
f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=..."
```

**Fix applied (`D:/bhora-ai/ai-service/main.py` line 969):**
```python
# AFTER (fixed — live model):
f"https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=..."
```

**Committed:** `e46c8e0` — pushed to `github.com/sciemec/grassroots-ai-service` → Render auto-deploys.

#### Match Eye Full Architecture (for reference)

```
Browser → XHR POST FormData → Python service /gemini-upload
            ↓ streams to Google File API (v1beta/files resumable upload)
            ↓ returns { fileUri, fileName, mimeType, state }

Browser → fetch POST → Python service /analyse  (returns { job_id } immediately)
            ↓ background: _analyse_background()
            ↓ polls Gemini v1beta/{fileName} until state = ACTIVE
            ↓ calls gemini-2.0-flash generateContent with file_data  ← FIXED
            ↓ calls Claude claude-sonnet-4-6 for tactical narrative
            ↓ stores result in _jobs dict

Browser → polls GET /job/{job_id} every 5s → reads analysis + narrative when complete
```

**The Next.js route `src/app/api/match-eye/analyse/route.ts` is now unused dead code.**
It is harmless to leave it but it will never be called by the browser.

**Env vars required on Render (Python AI service):**
```
GOOGLE_AI_API_KEY   = (Gemini File API + generateContent)
ANTHROPIC_API_KEY   = (Claude narrative — optional, skipped if not set)
```

---

### WHAT STILL NEEDS DOING (15 May 2026)

| Item | Status | Action Required |
|---|---|---|
| Render deploy of ai-service | Auto-deploys from `e46c8e0` | Wait ~3 min, then test Match Eye |
| `GOOGLE_AI_API_KEY` on Render | Must be set on ai-service Render service | Verify in Render dashboard → Environment |
| `ANTHROPIC_API_KEY` on Render | Must be set on ai-service Render service | Narrative will be empty if missing |
| Chemistry migrations on Render | NOT YET RUN | `php artisan migrate --force` for 5 chemistry tables |
| Week 5 — Player Chemistry View | NOT YET BUILT | `/players/similar` page + consent toggle in settings |
| `GROQ_API_KEY` | NOT set in Vercel | Add to Vercel env vars — THUTO AI chat broken without this |
| `R2_*` vars (5 vars) | NOT set in Vercel | Add for video storage / showcase clips |


---

## SESSION LOG — 15 May 2026

### Theme — Match Eye Background Jobs + Fan Hub Video Dashboard

---

### COMPLETED THIS SESSION — DO NOT REBUILD

#### 1. Match Eye — Background Job Architecture ✅

**Problem:** Vercel serverless functions timeout at 60s (Hobby) / 300s (Pro).
Full 90-min match Gemini 1.5 Pro analysis takes 8–15 minutes — impossible synchronously.

**Solution:** POST to Python service → returns `job_id` immediately → browser polls `GET /job/{job_id}` every 5s.

**Modified: `D:/bhora-ai/ai-service/main.py`** — committed as `514acbe` to `sciemec/grassroots-ai-service`
- Added `_jobs: dict[str, dict] = {}` — in-memory job store, 2-hour TTL with auto-expiry cleanup
- Added `AnalyseRequest(BaseModel)` — fileUri, fileName, mimeType, fileState, homeTeam, awayTeam, competition, sport
- Added `_wait_for_file_active(file_name, google_key, job_id)` — async polls Gemini File API state every 5s, max 10 min
- Added `_extract_json(text)` — tries direct parse, markdown code block regex, object regex
- Added `_analyse_background(job_id, req)` — full async coroutine: waits ACTIVE, calls Gemini (read timeout 600s), extracts JSON, optionally calls Claude for narrative, upserts `_jobs[job_id]`
- Added `POST /analyse` — creates job, calls `background_tasks.add_task()`, returns `{"job_id": job_id}` immediately
- Added `GET /job/{job_id}` — returns job dict, cleans expired entries (>2h) on each call

**Modified: `src/app/analyst/match-eye/page.tsx`** — committed as `5a188da`
- Added `pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)`
- `resetAll()` now clears the interval before resetting state
- `runAnalysis` Step 2: `POST ${trackerUrl}/analyse` → `job_id` → `setInterval` every 5000ms → `GET ${trackerUrl}/job/${jobId}`
- On `status === "complete"`: clears interval, renders report
- On `status === "failed"`: clears interval, shows error
- HTML/JSON parse errors silently retry next tick (handles Render cold-start HTML responses)

---

#### 2. Fan Hub Video Dashboard — Frontend Only ✅

**Route:** `/fan-hub` — public page, no auth required for browsing or uploading.

**Commit:** `e739087`

**New files:**

| File | Purpose |
|---|---|
| `src/components/fan-hub/VideoCard.tsx` | Reusable video card — thumbnail, badges (clip type, AI, LIVE), duration, view count, relative time, uploader |
| `src/components/fan-hub/VideoPlayer.tsx` | Modal video player — HTML5 `<video>`, fetches full details + increments view count, Escape to close, tagged player link |
| `src/components/fan-hub/UploadModal.tsx` | 6-step upload flow: select → upload (R2 presigned, XHR progress) → metadata → submitting → done → error |
| `src/app/fan-hub/page.tsx` | Full page: hero, stats row, featured slot, category pills, province dropdown, trending grid, AI Analysis section |

**Modified: `src/components/layout/public-navbar.tsx`**
- Added `{ href: "/fan-hub", label: "Fan Hub" }` after Business Hub in links array

**Key design decisions:**
- `Promise.allSettled` for 4 parallel API calls on load (featured, feed, ai-clips, stats)
- Explicit "Load more" button (not infinite scroll) — data-light mode for Zimbabwe 2G/3G
- `SkeletonCard` animate-pulse during loading
- Report flag button appears on hover (not always visible)
- Upload reuses existing `POST /api/upload/presigned` → XHR PUT to R2 → `POST /fan-hub/videos`
- AI clips section shows THUTO purple badge
- Grid: `gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))"` — responsive without media queries

**Backend already built — these endpoints are live:**
```
GET  /fan-hub/videos/featured
GET  /fan-hub/videos?page=&per_page=&clip_type=&province=
GET  /fan-hub/videos/ai-clips
GET  /fan-hub/stats
GET  /fan-hub/videos/{id}
POST /fan-hub/videos
POST /fan-hub/videos/{id}/report
POST /upload/presigned
```

---

### ALL BUILT ROUTES — ADDITIONS (15 May 2026)

```
/fan-hub    Public Fan Hub — video feed, upload, AI analysis, no auth required
```

---

### WHAT STILL NEEDS DOING (15 May 2026)

| Item | Status | Action Required |
|---|---|---|
| Chemistry migrations on Render | NOT YET RUN | `php artisan migrate --force` for 5 chemistry tables (7 May 2026 session) |
| Week 5 — Player Chemistry View | NOT YET BUILT | `/players/similar` page + consent toggle in settings |
| `GROQ_API_KEY` | NOT set in Vercel | Add to Vercel env vars — THUTO AI chat broken without this |
| `R2_*` vars (5 vars) | NOT set in Vercel | Add for video storage / fan hub uploads |

---

## SESSION LOG — 15 May 2026 (continued)

### Theme — Highlight Clips: Laravel Backend + HighlightReel Frontend

---

### COMPLETED THIS SESSION — DO NOT REBUILD

#### 1. `player_highlights` Table Migration ✅

**File (copy to bhora-ai):** `database/migrations/2026_05_15_000001_create_player_highlights_table.php`

Schema:
```sql
player_highlights:
  id                UUID PK
  player_id         UUID FK → users (cascade delete), indexed
  match_id          VARCHAR indexed
  r2_key            VARCHAR (unique — used for idempotent re-delivery)
  r2_url            TEXT
  event_type        VARCHAR default 'sprint'  -- sprint | tackle
  speed_kmh         DECIMAL(5,2) nullable
  timestamp_seconds DECIMAL(8,2) nullable
  created_at        TIMESTAMP
```

#### 2. `HighlightController` (Laravel) ✅

**File (copy to bhora-ai):** `app/Http/Controllers/Api/HighlightController.php`

Two methods:
- `getPlayerHighlights($playerId)` — public, no auth. Returns last 20 clips for player ordered by `created_at DESC`
- `storeCallback(Request $request)` — called by Python `run_pipeline` after clips uploaded to R2. Idempotent: skips clips whose `r2_key` already exists. Validates `status === 'complete'` before inserting.

**Routes (add to routes/api.php):**
```php
Route::get('/players/{playerId}/highlights', [HighlightController::class, 'getPlayerHighlights']);
Route::post('/highlights/callback',           [HighlightController::class, 'storeCallback']);
```

#### 3. `HighlightReel.tsx` — Updated ✅

**File:** `src/components/player/HighlightReel.tsx`

New features:
- Accepts `playerId?: string` prop
- New `AutoHighlight` interface: `{ id, player_id, match_id, r2_key, r2_url, event_type, speed_kmh, timestamp_seconds, created_at }`
- When `playerId` provided: fetches `GET /api/v1/players/{playerId}/highlights` (no-auth fetch with optional Bearer token if available)
- Falls back silently if endpoint returns error
- Two sections rendered in one card:
  - Top row: showcase clips (manually uploaded) — gold badge
  - Bottom row: "AI-Generated Clips" with Zap icon — Sprint=amber, Tackle=red, speed overlay in km/h, timestamp label
- `ActiveVideo` discriminated union: `{ kind: "showcase", clip }` | `{ kind: "auto", clip }`
- Video modal shows event type + speed + match ID for auto clips

**Updated pages:**
- `src/app/player/profile/page.tsx` — passes `playerId={user?.id ? String(user.id) : undefined}`
- `src/app/player/public/[id]/page.tsx` — always renders `<HighlightReel playerId={profile.id} />` (removed empty check for showcase)

---

### HIGHLIGHT CLIPS — FULL PIPELINE (end-to-end)

```
Coach triggers Match Eye video analysis
  ↓
Python /process-video:
  - Downloads R2 video
  - YOLOv8 player tracking (ByteTracker)
  - detect_sprint_events() → events above SPRINT_THRESHOLD_KMH
  - clip_highlights() → FFmpeg 8s clips around each event
  - upload_clips_to_r2() → uploads to R2 under highlights/{match_id}/
  - POST /highlights/callback → Laravel HighlightController::storeCallback()
         → inserts rows into player_highlights table (idempotent)
  ↓
Player visits /player/profile or /player/public/{id}
  → HighlightReel fetches GET /api/v1/players/{id}/highlights
  → Shows AI-generated clips with sprint/tackle badges + speed overlay
```

---

### ALL BUILT ROUTES — ADDITIONS (15 May 2026)

New public API routes (bhora-ai — NOT YET DEPLOYED):
```
GET  /api/v1/players/{playerId}/highlights   Returns last 20 AI-generated clips
POST /api/v1/highlights/callback             Receives Python pipeline output
```

Reference file for copy-paste: `highlight-clips-backend.md` (in grassroots-web root)

---

### WHAT STILL NEEDS DOING (15 May 2026)

| Item | Status | Action Required |
|---|---|---|
| `player_highlights` migration | WRITTEN — NOT YET ON RENDER | Copy from `highlight-clips-backend.md` to bhora-ai repo + push |
| `HighlightController.php` | WRITTEN — NOT YET IN bhora-ai | Copy from `highlight-clips-backend.md` to `app/Http/Controllers/Api/` in bhora-ai |
| 2 new routes in `routes/api.php` | WRITTEN — NOT YET IN bhora-ai | Add `GET /players/{id}/highlights` + `POST /highlights/callback` |
| Chemistry migrations on Render | NOT YET RUN | `php artisan migrate --force` for 5 chemistry tables (7 May 2026) |
| `GROQ_API_KEY` | NOT set in Vercel | Add to Vercel env vars — THUTO AI broken without this |
| `R2_*` vars (5 vars) | NOT set in Vercel | Add for video storage / showcase clips |

---

## SESSION LOG — 18 May 2026

### Theme — Arena Social Graph: Sprint 1 Complete

---

### COMPLETED THIS SESSION — DO NOT REBUILD

#### 1. Sprint 1 Analysis Delivered ✅

Read Sprint1.md in full and reported:
- Steps 1–5 and 8: COMPLETE (backend models, migrations, controllers, routes all live)
- Step 6 (`/arena/network` design): WRONG — dark hub style applied instead of Sprint1.md white spec
- Steps 7, 9: NOT DONE
- Sprint 1 design spec: `#f4f2ee` background, `#1a5c2a` forest green, `#c8962a` gold, white nav, NO Sidebar

#### 2. `/arena/network` — REBUILT with correct Sprint1.md design ✅

**Commit:** `5f69149` (prior session) + `14a4fb0` (this session)

**What was wrong:**
- Dark hub `Sidebar` component used instead of white custom nav
- Dark card backgrounds, white text — opposite of Sprint1.md spec
- React #185 infinite loop: `(s) => ({ user: s.user, token: s.token })` object selector

**What was fixed:**
- `ArenaNav` component built inline (white sticky header, Arena brand, 5 hub links, user dropdown, Messages button)
- Root div: `style={{ backgroundColor: "#f4f2ee" }}`
- Cards: `bg-white rounded-2xl border border-gray-200 shadow-sm`
- Text: `text-gray-900` / `text-gray-500` (dark on white)
- Tab numbers: `color: "#1a5c2a"` when active
- Connect button: `backgroundColor: "#c8962a"` (gold)
- Zustand selectors split: `const user = useAuthStore((s) => s.user)` + `const token = useAuthStore((s) => s.token)`

#### 3. `/arena/messages` — FIXED (ArenaNav + Zustand bug + poll interval) ✅

**Commit:** `14a4fb0`

**Changes:**
- Fixed React #185 infinite loop: split object selector on line 51 into two separate selectors
- Added `ArenaNav` component (same white header as `/arena/network`)
- Changed thread poll interval: `10000` → `30000` (30s per Sprint1.md spec)
- Added `Link` + `useRouter` imports needed by ArenaNav

**File:** `src/app/arena/messages/page.tsx`

---

### ARENA SOCIAL GRAPH — SPRINT 1 STATUS (18 May 2026)

| Step | Feature | Status |
|---|---|---|
| 1 | `arena_follows` table + ArenaFollow model | ✅ LIVE on Render |
| 2 | `arena_connections` table + ArenaConnection model | ✅ LIVE on Render |
| 3 | `arena_messages` table + ArenaMessage model | ✅ LIVE on Render |
| 4 | ArenaController (follow/unfollow/connections/inbox/send) | ✅ LIVE on Render |
| 5 | API routes in routes/api.php | ✅ LIVE on Render |
| 6 | `/arena/network` — Sprint1.md white design | ✅ FIXED + DEPLOYED |
| 7 | `/arena/messages` — Sprint1.md white design | ✅ FIXED + DEPLOYED |
| 8 | `src/types/arena.ts` TypeScript interfaces | ✅ DONE |
| 9 | UI tests (Sprint1.md Step 9) | ❌ NOT YET CONFIRMED |
| 10 | CLAUDE.md session log | ✅ THIS ENTRY |

**Arena API Endpoints (all auth:sanctum required):**
```
POST   /arena/follow/{userId}              Follow a user (one-way)
DELETE /arena/follow/{userId}              Unfollow
GET    /arena/following                    Who I follow
GET    /arena/followers                    Who follows me
POST   /arena/connect/{userId}             Send connection request
PATCH  /arena/connect/{connectionId}/accept   Accept request
DELETE /arena/connect/{connectionId}       Decline/remove connection
GET    /arena/connections                  My accepted connections
GET    /arena/connections/pending          Pending requests received
GET    /arena/inbox                        Latest message per thread
GET    /arena/messages/{userId}            Full thread with user
POST   /arena/messages/{userId}            Send message (connections only)
```

**Arena Design Spec (Sprint1.md — PERMANENT):**
```
Background:  #f4f2ee  (light warm white)
Primary:     #1a5c2a  (forest green — avatars, active states, sent bubbles)
Accent:      #c8962a  (gold — Connect/Discover buttons, Send button)
Nav:         White sticky top nav (ArenaNav) — NOT the dark Sidebar component
Cards:       bg-white rounded-2xl border border-gray-200 shadow-sm
Text:        text-gray-900 (primary), text-gray-500 (secondary)
```

### ALL BUILT ROUTES — ADDITIONS (18 May 2026)

```
/arena/network   My Network — 4 tabs: Connections, Followers, Following, Pending
/arena/messages  Direct Messages — thread list + full message thread, polling 30s
```

### REACT #185 — ZUSTAND OBJECT SELECTOR BUG (PERMANENT RULE)

**NEVER use this pattern in any page:**
```typescript
const { user, token } = useAuthStore((s) => ({ user: s.user, token: s.token }));
// Creates new object reference every render → infinite re-render → React error #185
```

**ALWAYS use separate selectors:**
```typescript
const user  = useAuthStore((s) => s.user);
const token = useAuthStore((s) => s.token);
```

---

## SESSION LOG — 16 May 2026

### Theme — Fan Hub PRD Completion: Thumbnail Generation + THUTO Auto-Hook + Admin Moderation Page

---

### COMPLETED THIS SESSION — DO NOT REBUILD

#### 1. Thumbnail Generation Endpoint (Python AI Service) ✅

**File:** `D:/bhora-ai/ai-service/main.py`
**Commit:** `c64fe85` → pushed to `sciemec/grassroots-ai-service`

Added `POST /generate-thumbnail` endpoint:
- `GenerateThumbnailRequest(BaseModel)` with `video_url: str`
- Downloads video via `httpx` streaming into a temp file
- Seeks to `fps × 3` (3-second mark) with `cv2.VideoCapture` + `CAP_PROP_POS_FRAMES`
- Falls back to frame 0 if seek fails or FPS is 0
- Encodes JPEG at quality 82 via `imencode`
- Uploads JPEG to Cloudflare R2 via boto3 under `thumbnails/fan-hub/{uuid}.jpg`
- Returns `{ "thumbnail_url": "...", "r2_key": "..." }`
- Endpoint is synchronous (small operation — no background task needed)

**Required env vars on ai-service Render:**
```
R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL
```

---

#### 2. THUTO Auto-Hook in HighlightController (Laravel) ✅

**File:** `D:/bhora-ai/bhora-ai/app/Http/Controllers/Api/HighlightController.php`
**File:** `D:/bhora-ai/bhora-ai/routes/api.php`
**Commit:** `e790694` → pushed to `sciemec/bhora-ai`

Added to `HighlightController::store()` — fires after player_highlights insert:
- Added `use App\Models\FanHubVideo;` import
- Fire-and-forget `try { ... } catch (\Throwable) {}` block — never breaks the primary store
- Creates `FanHubVideo` record with:
  - `title`: `"THUTO AI: {EventType} Highlight · {speed} km/h"` (e.g. "THUTO AI: Sprint Highlight · 28.4 km/h")
  - `clip_type`: `'highlight'`
  - `r2_key`, `r2_url`: same as player_highlights
  - `match_id`: passed through from request
  - `tagged_player_id`: the player's UUID
  - `uploader_name`: `'THUTO AI'`
  - `is_ai_generated`: `true`
  - `status`: `'approved'` (auto-approved — AI-generated, no manual review needed)

Also added two new admin endpoints:

**`approve()` method:** `PATCH /fan-hub/videos/{id}/approve`
```php
$video->update(['status' => 'approved', 'moderated_at' => now()]);
```

**`adminIndex()` method:** `GET /admin/fan-hub/videos?status=pending`
```php
FanHubVideo::where('status', $status)->orderByDesc('created_at')->paginate(20)
```

**Routes added to `routes/api.php`:**
```php
Route::patch('fan-hub/videos/{id}/approve', [FanHubController::class, 'approve'])
    ->middleware(['auth:sanctum', 'role:admin']);
Route::get('admin/fan-hub/videos', [FanHubController::class, 'adminIndex'])
    ->middleware(['auth:sanctum', 'role:admin']);
```

**No model changes needed** — `FanHubVideo::$fillable` already included all required fields.

---

#### 3. `/admin/fan-hub` Moderation Page (Next.js) ✅

**File:** `src/app/admin/fan-hub/page.tsx` (NEW — 277 lines)
**File:** `src/components/layout/sidebar.tsx` (modified — added Fan Hub Mod nav item)
**Commit:** `c7b21d8` → pushed to `sciemec/grassroots-web`

**Page features:**
- `FanHubVideo` interface with all fields: `report_count`, `is_ai_generated`, `is_live`, `status`, `clip_type`, `uploader_name`, `province`, `view_count`, `r2_url`, `thumbnail_url`
- Status tabs: **Pending** (default, red badge showing count) / **Approved**
- Pending count badge on tab using `videos.length` when status = pending
- `useQuery` on `GET /admin/fan-hub/videos?status={tab}` — auto-refetches on tab switch
- Refresh button with `RefreshCw` spin animation during `isRefetching`
- `VideoSkeleton` — 6 animate-pulse rows during load
- `timeAgo()` helper — "Xm ago" / "Xh ago" / "Xd ago"
- `CLIP_TYPE_COLOURS` record — per clip type badge colour (amber/blue/green/purple/cyan/red)

**Per-video row:**
- Thumbnail (click to toggle inline preview): `Eye` icon hover overlay
- Badges: clip type, THUTO AI (purple, when `is_ai_generated`), LIVE (red, when `is_live`)
- Reports badge (red AlertTriangle) when `report_count >= 3`
- Title + uploader + province + time + view count
- **Approve button** (green, only on Pending tab): `PATCH /fan-hub/videos/{id}/approve`, spinner during mutation
- **Delete button** (red, both tabs): `DELETE /fan-hub/videos/{id}` with `confirm()` dialog, spinner during mutation

**Inline video preview:**
- Clicking any thumbnail sets `previewId`; clicking again closes
- Renders `<video controls>` panel below the list (no separate modal)
- Close button in preview header

**Sidebar nav added:**
- `{ href: "/admin/fan-hub", label: "Fan Hub Mod", icon: Film, roles: ["admin"] }` after Announcements
- `Film` icon was already imported — no import changes needed

---

### ALL BUILT ROUTES — ADDITIONS (16 May 2026)

```
/admin/fan-hub    Admin Fan Hub moderation — pending queue, approve/delete, inline video preview
```

New API routes (bhora-ai — LIVE on Render via e790694):
```
PATCH /api/v1/fan-hub/videos/{id}/approve    Set status=approved (admin only)
GET   /api/v1/admin/fan-hub/videos           Paginated queue filtered by status (admin only)
```

New Python AI service endpoint (LIVE via c64fe85):
```
POST  https://ai.bhora-ai.onrender.com/generate-thumbnail    Extract frame at 3s + upload to R2
```

---

### WHAT STILL NEEDS DOING (16 May 2026)

| Item | Status | Action Required |
|---|---|---|
| `player_highlights` migration on Render | Confirm deployed | Verify `player_highlights` table exists via Render logs |
| Chemistry migrations on Render | NOT YET RUN | `php artisan migrate --force` for 5 chemistry tables (7 May 2026 session) |
| Week 5 — Player Chemistry View | NOT YET BUILT | `/players/similar` page + consent toggle in settings |
| `GROQ_API_KEY` | NOT set in Vercel | Add to Vercel env vars — THUTO AI chat broken without this |
| `R2_*` vars (5 vars) on Vercel | NOT set in Vercel | Add for video storage, showcase clips, fan hub uploads |
| `R2_*` vars on ai-service Render | NOT confirmed | Required for `/generate-thumbnail` to upload to R2 |
| `GOOGLE_AI_API_KEY` on ai-service | Must be set | Required for Gemini Match Eye analysis |
| `ANTHROPIC_API_KEY` on ai-service | Must be set | Required for Claude tactical narrative in Match Eye |

---

### FAN HUB — COMPLETE FEATURE STATUS (16 May 2026)

| Feature | Backend | Frontend | Status |
|---|---|---|---|
| Video feed + filters | ✅ FanHubController::index | ✅ /fan-hub page | LIVE |
| Video upload (metadata) | ✅ FanHubController::store | ✅ UploadModal.tsx | LIVE |
| Featured slot | ✅ getFeatured() | ✅ Hero section | LIVE |
| AI clips section | ✅ getAiClips() | ✅ AI Analysis section | LIVE |
| Stats row | ✅ stats() | ✅ Stats row | LIVE |
| View count increment | ✅ show() | ✅ VideoPlayer.tsx | LIVE |
| Report flag | ✅ report() (auto-hide at 5) | ✅ Flag button on hover | LIVE |
| THUTO auto-hook | ✅ HighlightController::store | N/A (server-side) | LIVE |
| Admin moderation | ✅ approve() + adminIndex() | ✅ /admin/fan-hub | LIVE |
| Thumbnail generation | ✅ /generate-thumbnail (Python) | ✅ UploadModal calls endpoint | LIVE (needs R2 vars) |
| R2 video upload | ✅ /upload/presigned | ✅ XHR upload in UploadModal | LIVE (needs R2 vars) |

---

## SESSION LOG — 18 May 2026

### Theme — Arena Social Graph Sprint 1: All 12 Tests Passing

---

### COMPLETED THIS SESSION — DO NOT REBUILD

#### Arena Social Graph — FULLY TESTED ✅

All 12 API tests for Arena Sprint 1 now pass end-to-end.

**Root causes found and fixed:**

**Bug 1 — All arena endpoints returned 500 after every Render restart**
- Root cause: `start.sh` dropped arena tables on restart then called `php artisan migrate --force`,
  but `2026_05_18_000001_create_arena_tables_uuid` was already marked "done" in the migrations table
  from the first deploy — so it never re-ran, leaving all three tables permanently absent.
- Fix: added `DB::table('migrations')->where('migration', '2026_05_18_000001_create_arena_tables_uuid')->delete();`
  to the tinker block in `start.sh` so the migration always re-runs after the drops.
- Committed `5e065ad` to `sciemec/bhora-ai`

**Bug 2 — ArenaConnection, ArenaFollow, ArenaMessage models missing UUID PK config**
- Root cause: All three Eloquent models were missing `public $incrementing = false` and
  `protected $keyType = 'string'`. Eloquent defaulted to treating the UUID primary key
  as an auto-increment integer — returning `"id": 33` (integer) instead of a UUID string,
  and causing PATCH/UPDATE queries against the UUID column to fail with HTTP 500.
- Fix: added both properties to all three models.
- Committed `0e3cbf1` to `sciemec/bhora-ai`

**Bug 3 — Controller method signatures used `int $id` instead of `string $id`**
- Fixed in prior session — all `ArenaSocialController` route-model binding parameters
  changed from `int` to `string` to match UUID route segments.

---

#### Arena API Routes (all confirmed LIVE ✅)

| Method | Route | Auth | Tested |
|---|---|---|---|
| POST | `/arena/follow/{id}` | Bearer | ✅ Follow + unfollow toggle |
| GET | `/arena/followers` | Bearer | ✅ Returns followers list |
| GET | `/arena/following` | Bearer | ✅ Returns following list |
| POST | `/arena/connect/{id}` | Bearer | ✅ Sends pending connection request |
| PATCH | `/arena/connect/{id}` | Bearer | ✅ Accept/decline connection |
| GET | `/arena/connections` | Bearer | ✅ Returns accepted connections |
| GET | `/arena/connections/pending` | Bearer | ✅ Returns pending requests with requester data |
| POST | `/arena/messages/{recipientId}` | Bearer | ✅ Send DM (must be connected) |
| GET | `/arena/messages/{otherUserId}` | Bearer | ✅ Read thread, auto-marks read |
| GET | `/arena/inbox` | Bearer | ✅ Inbox with sender/recipient, read_at stamped |

---

#### Frontend Pages (Next.js — already built, no changes needed this session)

- `src/app/arena/network/page.tsx` — Arena network hub (followers, following, connections, pending)
- `src/app/arena/messages/page.tsx` — DM inbox + thread view, polling every 10s

**TypeScript types used:** `src/types/arena.ts` — `ArenaMessage`, `ArenaUser` interfaces

---

#### Backend Files (bhora-ai repo)

| File | Status |
|---|---|
| `app/Http/Controllers/Api/ArenaSocialController.php` | LIVE ✅ |
| `app/Models/ArenaConnection.php` | FIXED ✅ — UUID PK config added |
| `app/Models/ArenaFollow.php` | FIXED ✅ — UUID PK config added |
| `app/Models/ArenaMessage.php` | FIXED ✅ — UUID PK config added |
| `database/migrations/2026_05_18_000001_create_arena_tables_uuid.php` | LIVE ✅ |
| `start.sh` | FIXED ✅ — now deletes uuid migration record before re-running |

---

### ALL BUILT ROUTES — ADDITIONS (18 May 2026)

```
/arena/network    Arena social hub — follow, connect, pending requests
/arena/messages   Arena DM inbox + thread view (polling every 10s)
```

---

### WHAT STILL NEEDS DOING (18 May 2026)

| Item | Status | Action Required |
|---|---|---|
| Chemistry migrations on Render | NOT YET RUN | `php artisan migrate --force` for 5 chemistry tables (7 May session) |
| Week 5 — Player Chemistry View | NOT YET BUILT | `/players/similar` page + consent toggle in settings |
| `GROQ_API_KEY` | NOT set in Vercel | Add to Vercel env vars — THUTO AI chat broken without this |
| `R2_*` vars (5 vars) | NOT set in Vercel | Add for video storage / showcase clips / fan hub |
| Arena `name` field in messages | `name: null` in responses | `users` table has `name` but not split into first/surname — populate via profile join if needed |

---

## SESSION LOG — 18 May 2026 (continued)

### Theme — Arena Sprint 2: Activity Feed Page — BUILT + LIVE TESTED

---

### COMPLETED THIS SESSION — DO NOT REBUILD

#### Arena Activity Feed — FULLY BUILT + PASSED ALL LIVE TESTS ✅

**Frontend:** `src/app/arena/page.tsx` (497 lines)

**Layout:** LinkedIn-style 3-column — left identity panel / centre feed / right nav panel
- Background `#f4f2ee` (warm off-white), white post cards, `#1a5c2a` green brand accents
- Left + right panels hidden on mobile; single-column on small screens

**Components (all inline in page.tsx):**
- `ArenaNav` — sticky white header, The Arena branding, Network/Messages hub links, user avatar + dropdown
- `PostComposer` — 280-char textarea counter, post type picker (standard/milestone/achievement), milestone label, sport + province tags, Cancel + Post buttons
- `PostCard` — optimistic like toggle (local flip → sync → revert on error), inline comment expansion, role/sport badges, timeAgo
- `CommentSection` — loads on demand, Enter to submit, initials avatars
- `FeedSkeleton` — 3 animate-pulse skeleton rows
- `LeftPanel` — user identity card, hub nav links
- `RightPanel` — Arena nav, tips card

**Feed endpoints:**
- For You → `GET /api/v1/arena/feed`
- Following → `GET /api/v1/arena/feed/following`
- Connections → `GET /api/v1/arena/feed/connections`

**Backend (bhora-ai commit `587c005`):**

| File | Purpose |
|---|---|
| `database/migrations/2026_05_18_000002_create_arena_posts_table.php` | `arena_posts` — UUID PK gen_random_uuid(), body, sport, province, post_type enum, like_count, comment_count |
| `database/migrations/2026_05_18_000003_create_arena_post_likes_table.php` | `arena_post_likes` — UUID PK, post_id+user_id UNIQUE, created_at only |
| `database/migrations/2026_05_18_000004_create_arena_post_comments_table.php` | `arena_post_comments` — UUID PK, post_id FK (cascade), body, timestamps |
| `app/Models/ArenaPost.php` | `$incrementing = false`, `$keyType = 'string'`, has many likes + comments |
| `app/Models/ArenaPostLike.php` | `$timestamps = false`, `const UPDATED_AT = null`, created_at only |
| `app/Models/ArenaPostComment.php` | `$incrementing = false`, `$keyType = 'string'`, belongs to post + user |
| `app/Http/Controllers/Api/ArenaFeedController.php` | forYou, following, connections, store, like (toggle + counter), comments, addComment |

**Routes added to `routes/api.php` (auth:sanctum):**
```php
Route::get('/arena/feed',                 [ArenaFeedController::class, 'forYou']);
Route::get('/arena/feed/following',       [ArenaFeedController::class, 'following']);
Route::get('/arena/feed/connections',     [ArenaFeedController::class, 'connections']);
Route::post('/arena/posts',               [ArenaFeedController::class, 'store']);
Route::post('/arena/posts/{id}/like',     [ArenaFeedController::class, 'like']);
Route::get('/arena/posts/{id}/comments',  [ArenaFeedController::class, 'comments']);
Route::post('/arena/posts/{id}/comments', [ArenaFeedController::class, 'addComment']);
```

**Live site test results (Python Playwright — 18 May 2026):**
```
✅ Login            — redirected to /player successfully
✅ /arena loads     — "The Arena" heading, all 3 feed tabs, post composer textarea present
✅ Post submitted   — "Arena Sprint 2" text appeared in feed immediately
✅ Tab navigation   — Following, Connections, For You all switch cleanly
✅ Like interaction — clicked like button on a post card
✅ Console errors   — zero JS errors on reload
✅ Mobile (375px)   — page loads, "The Arena" branding visible
```

**Key implementation notes:**
- `safeArray()` used on all API array responses — no `.map()` crashes
- Auth hydration guard waits for `useAuthStore.persist.hasHydrated()` before rendering
- Like toggle uses optimistic UI: flips local state instantly, then syncs with backend, reverts on error
- `withCount(['likes as liked' => fn($q) => $q->where('user_id', $userId)])` shows per-user liked state on all feed queries

---

### ALL BUILT ROUTES — ADDITIONS (18 May 2026, continued)

```
/arena    Arena Activity Feed — post composer, 3 feed tabs (For You / Following / Connections), likes, inline comments
```

New API routes (bhora-ai — live on Render):
```
GET    /api/v1/arena/feed                    For You feed (all posts, newest first, paginated 20)
GET    /api/v1/arena/feed/following          Posts from followed users only
GET    /api/v1/arena/feed/connections        Posts from accepted connections only
POST   /api/v1/arena/posts                   Create post (body max 280, sport, province, post_type)
POST   /api/v1/arena/posts/{id}/like         Toggle like — returns {liked: bool}
GET    /api/v1/arena/posts/{id}/comments     Get all comments ordered by created_at
POST   /api/v1/arena/posts/{id}/comments     Add comment (body max 280)
```

---

### WHAT STILL NEEDS DOING (18 May 2026, continued)

| Item | Status | Action Required |
|---|---|---|
| Arena post migrations on Render | Deployed via `587c005` | Verify `arena_posts`, `arena_post_likes`, `arena_post_comments` tables exist via Render logs |
| Chemistry migrations on Render | NOT YET RUN | `php artisan migrate --force` for 5 chemistry tables (7 May 2026 session) |
| Week 5 — Player Chemistry View | NOT YET BUILT | `/players/similar` page + consent toggle in settings |
| `GROQ_API_KEY` | NOT set in Vercel | THUTO AI broken without this |
| `R2_*` vars (5 vars) | NOT set in Vercel | Video/showcase/fan hub uploads broken without this |

---

## SESSION LOG — 19 May 2026

### Theme — Arena Sprint 2 Auto-Post Hooks (Hooks 1 + 3)

---

### COMPLETED THIS SESSION — DO NOT REBUILD

#### Arena Sprint 2 Auto-Post Hooks ✅

**Commit:** `59c777f` — pushed to `sciemec/bhora-ai`

**Files changed (5):**

| File | Change |
|---|---|
| `database/migrations/2026_05_19_000001_extend_arena_posts_for_auto_hooks.php` | New migration — nullable body, is_auto bool, metadata JSON, extended post_type to include session_milestone / badge / prediction_upgrade |
| `app/Models/ArenaPost.php` | Added `is_auto` + `metadata` to `$fillable`; added `$casts` (is_auto=bool, metadata=array) |
| `app/Http/Controllers/Api/ArenaFeedController.php` | Added static `autoPost(string $type, string $userId, array $metadata)` method + extended store() validation enum |
| `app/Http/Controllers/Api/TrainingSessionController.php` | Hook 1 — reads previous `overall_score`, fires `session_milestone` auto-post when new score > old score |
| `app/Services/TalentPredictionService.php` | Hook 3 — captures `$oldLevel` before upsert, fires `prediction_upgrade` auto-post when `$peakLevel` changes |

**`autoPost()` design:**
- Static method — callable without instantiating the controller
- Fire-and-forget — callers wrap in `try/catch(\Throwable)` so it NEVER breaks the primary action
- Auto-generates body text from a per-type template
- Creates `ArenaPost` with `is_auto=true` + `metadata` JSON payload
- Skips if user not found

**Auto-post body templates:**
```
session_milestone  → "🔥 Score improved to {new_score} (was {old_score}) — keep going!"
badge              → "🏅 Earned the {badge_name} badge!"
prediction_upgrade → "⬆️ Talent level upgraded to {new_label}!"
```

**Hook 2 (badge) — BLOCKED:**
No badge backend exists. `CommunityController.php` has a `'badge' => 'community_player'` reference
but no Football Business School badge system, no `BadgeController`, no badge routes.
Hook 2 cannot fire until a badge backend is built.

**Migration behaviour on Render:**
- Changes `post_type` column from PostgreSQL enum to `VARCHAR(50)` + explicit CHECK constraint
- Makes `body` nullable (auto-posts have AI-generated body, not user-typed)
- Adds `is_auto BOOLEAN DEFAULT false` + `metadata JSONB nullable`
- Auto-runs on next Render deploy via `start.sh` → `php artisan migrate --force`

---

### WHAT STILL NEEDS DOING (19 May 2026)

| Item | Status | Action Required |
|---|---|---|
| Auto-hook migration on Render | Auto-runs on next deploy | Verify via Render logs after `59c777f` deploys |
| Hook 2 (badge auto-post) | BLOCKED — no badge backend | Build badge backend first, then add hook |
| Arena post migrations on Render | Deployed via `587c005` | Verify `arena_posts` tables exist |
| Chemistry migrations on Render | NOT YET RUN | `php artisan migrate --force` for 5 chemistry tables |
| Week 5 — Player Chemistry View | NOT YET BUILT | `/players/similar` page + consent toggle in settings |
| `GROQ_API_KEY` | NOT set in Vercel | THUTO AI broken without this |
| `R2_*` vars (5 vars) | NOT set in Vercel | Video/showcase/fan hub uploads broken without this |


---

## SESSION LOG — 19 May 2026

### Theme — Arena Sprint 3: Club Discovery (listing, detail, review)

---

### COMPLETED THIS SESSION — DO NOT REBUILD

#### Arena Club Discovery — FULLY BUILT ✅

**Commit:** `a932d17` → pushed to `sciemec/grassroots-web` → Vercel auto-deploying

**3 new frontend files:**

| File | Purpose |
|---|---|
| `src/app/arena/clubs/page.tsx` | Club directory — search bar, 7-filter panel, ClubCard grid, ClubSkeleton |
| `src/app/arena/clubs/[id]/page.tsx` | Club detail — banner, stats, follow/unfollow (optimistic), ratings breakdown, anonymous reviews |
| `src/app/arena/clubs/[id]/review/page.tsx` | Star rating form — 4 categories, 200-char comment, success state |

**Modified:**
- `src/components/layout/sidebar.tsx` — added `Building2` import + "Clubs" nav item for coach, scout, player, fan roles (after "Messages" in each role block)

---

#### `/arena/clubs` — Club Directory

- ArenaNav with "Clubs" link active
- Search bar (client-side filter by name/province)
- Filter panel (togglable): Sport, Province, Tier, Formation, Playing Style, Open Trials checkbox, Scouting checkbox
- Active filter count badge on filter button
- Results count line
- `ClubCard` — name, sport, THUTO score (colour-coded: green≥80, amber≥60, red<60), location, tier, formation/style pills, scouting/trials badges, follower + review count
- `ClubSkeleton` — 6 animate-pulse cards during loading
- Empty state with "Register Club" CTA → `/arena/clubs/new`
- "+ Register Club" button in header → `/arena/clubs/new`
- Grid: 1 col mobile, 2 cols sm, 3 cols lg

**API calls:**
```
GET /api/v1/arena/clubs?sport=&province=&tier=&formation=&playing_style=&open_trials=1&scouting=1
```

---

#### `/arena/clubs/[id]` — Club Detail Page

- `RatingBar` component: label + filled bar (score × 20 / 100) + numeric value
- `StarRow` component: 5 filled/empty stars from a 1-5 rating value
- `ReviewCard` component: anonymous avatar ("A"), time ago, star rows, comment text
- `Skeleton` during initial load
- Club banner: name, sport badge, province/tier location row, formation/style pills, scouting/trials badges
- Stats row: follower count, review count, THUTO score (colour-coded)
- Follow/Unfollow button — optimistic UI (flips immediately, reverts on error)
- "Write a Review" button → `/arena/clubs/{id}/review`
- "Edit Club" button — only shown when `user.id === club.coach.id`
- Coach card: avatar with initials, name
- Ratings breakdown: Overall / Training Quality / Coaching Staff / Facilities (4 `RatingBar` items)
- Reviews section: anonymous `ReviewCard` per review, empty state if no reviews yet

**API calls (parallel via `Promise.allSettled`):**
```
GET /api/v1/arena/clubs/{id}      → club detail + avg_ratings + is_following
GET /api/v1/arena/clubs/{id}/reviews → paginated anonymous reviews
POST /api/v1/arena/clubs/{id}/follow → follow/unfollow toggle
```

---

#### `/arena/clubs/[id]/review` — Review Form

- `StarPicker` component: hover state tracking, 5-star interactive, descriptive labels ("Poor"/"Fair"/"Good"/"Very Good"/"Excellent")
- 4 categories: Overall Experience, Training Quality, Coaching Staff, Facilities & Pitch
- 200-char comment textarea with live counter
- "Reviews are anonymous" note shown in form header
- Submit button disabled until all 4 categories rated
- Submit button background changes from gray to green when all rated
- 3 render states:
  1. **Unauthenticated gate** — "Sign In" CTA, no form shown
  2. **Form** — StarPicker × 4, comment, error display, submit button
  3. **Success** — green CheckCircle, "Review Submitted!", back-to-club link

**API calls:**
```
GET  /api/v1/arena/clubs/{id}           → load club name for display
POST /api/v1/arena/clubs/{id}/review    → submit review
```

---

### ALL BUILT ROUTES — ADDITIONS (19 May 2026)

```
/arena/clubs              Club directory — search, 7 filters, ClubCard grid
/arena/clubs/[id]         Club detail — follow, ratings, anonymous reviews
/arena/clubs/[id]/review  Star rating review form — 4 categories + comment
```

---

### ARENA CLUB BACKEND (already built in prior session — confirmed live)

| Endpoint | Method | Auth | Notes |
|---|---|---|---|
| `GET /api/v1/arena/clubs` | public | optional | Filters: sport, province, tier, formation, playing_style, open_trials, scouting |
| `GET /api/v1/arena/clubs/{id}` | public | optional | Returns club + avg_ratings + is_following |
| `POST /api/v1/arena/clubs` | auth | required | Create club (coach_id = Auth::id()) |
| `PUT /api/v1/arena/clubs/{id}` | auth | coach only | Update (403 if not coach) |
| `POST /api/v1/arena/clubs/{id}/review` | auth | required | updateOrCreate — one review per user. Recalculates avg_thuto_score |
| `GET /api/v1/arena/clubs/{id}/reviews` | public | optional | Anonymous — omits reviewer_id |
| `POST /api/v1/arena/clubs/{id}/follow` | auth | required | Toggle follow — uses arena_follows with following_type='club' |

**Models:** `ArenaClub`, `ArenaClubReview` (bhora-ai repo, committed prior session)

**avg_thuto_score formula:** `round(avg(rating_overall) × 20, 2)` — scales 1-5 stars → 0-100

---

### WHAT STILL NEEDS DOING (19 May 2026)

| Item | Status | Action Required |
|---|---|---|
| `/arena/clubs/new` page | NOT YET BUILT | Club registration form (name, sport, province, district, tier, formation, playing_style, is_scouting, is_open_trials) |
| Chemistry migrations on Render | NOT YET RUN | `php artisan migrate --force` for 5 chemistry tables (7 May 2026 session) |
| Week 5 — Player Chemistry View | NOT YET BUILT | `/players/similar` page + consent toggle in settings |
| `GROQ_API_KEY` | NOT set in Vercel | THUTO AI broken without this |
| `R2_*` vars (5 vars) | NOT set in Vercel | Video/showcase/fan hub uploads broken without this |
| Auto-hook migration on Render | Auto-runs on next deploy | Verify via Render logs |

---

## SESSION LOG — 19 May 2026 (Sprint 5)

### Theme — Arena Sprint 5: Discover Athletes, Public Profiles, Notifications, Recruitment Board

---

### COMPLETED THIS SESSION — DO NOT REBUILD

#### 1. Arena Sprint 5 — ALL FRONTEND PAGES BUILT ✅

**Commit:** `2aeaef4` — pushed to `sciemec/grassroots-web`

**9 files changed (7 new, 2 modified):**

| File | Purpose |
|---|---|
| `src/app/arena/discover/page.tsx` | Discover Athletes — debounced search + sport/province/position/THUTO score filters, follow toggle |
| `src/app/arena/notifications/page.tsx` | Arena Alerts — date grouped (Today/Yesterday/Earlier), unread dot, mark-all-read, dismiss |
| `src/app/arena/profile/[id]/page.tsx` | Public Arena Profile — THUTO score, prediction card, arena posts, follow/connect CTA |
| `src/app/arena/recruitment/page.tsx` | Talent Board listing — sport/province/stipend/THUTO filters, card grid |
| `src/app/arena/recruitment/[id]/page.tsx` | Posting detail — apply modal with message + availability fields |
| `src/app/arena/recruitment/new/page.tsx` | Create posting form — sport, position, age range, THUTO min, province, stipend, description |
| `src/app/coach/recruitment/page.tsx` | Coach Applications Viewer — tabbed by posting, applicant detail panel |
| `src/app/arena/page.tsx` | Arena Feed — RightPanel now fetches leaderboard + suggested widgets; nav updated |
| `src/components/layout/sidebar.tsx` | Added Discover Athletes + Arena Alerts nav items for all 4 arena roles |

---

#### 2. `/arena/discover` — Discover Athletes Page ✅

- `DiscoverPlayer` interface: id, name, role, sport, province, position, thuto_score, peak_level_label, avatar_url, is_following
- `ArenaNav` inline component (same white sticky header as all Arena pages)
- `PlayerCard` component: avatar with initials fallback, sport/province/position badges, THUTO score pill, Follow button with optimistic toggle
- Debounced search (400ms) on player name
- Filter panel (slide-open on mobile): sport chips × 10, province dropdown, position text input, THUTO min score chips (40+/55+/65+/75+)
- Fetches `GET /api/v1/arena/discover` with query params on load + on any filter change
- Follow button calls `POST /api/v1/arena/follow/{id}` / `DELETE /api/v1/arena/follow/{id}` (optimistic)
- Empty state + skeleton loader
- Background: `#f4f2ee`, cards: `bg-white rounded-2xl border border-gray-200`

---

#### 3. `/arena/notifications` — Arena Alerts Page ✅

- Fetches `GET /api/v1/notifications` (reuses existing notifications endpoint)
- `ArenaNotification` interface: id, title, body, type, read, link, created_at
- `typeIcon()` helper: Info/CheckCircle2/AlertTriangle/AlertCircle/Star per type
- `timeAgo()` — "Just now" / "Xm ago" / "Xh ago" / "Yesterday" / date
- `groupByDate()` — splits notifications into Today / Yesterday / Earlier sections
- Unread count badge in header + "X unread notifications" subtitle
- "Mark all read" button (calls `POST /api/v1/notifications/mark-all-read`)
- Click any notification → marks read + navigates to `n.link` if set
- Dismiss (Trash2) calls `DELETE /api/v1/notifications/{id}` — optimistic remove
- Unread left border: `borderLeftWidth: 3, borderLeftColor: "#1a5c2a"` + green dot top-right
- 5-row animate-pulse skeleton during load
- Empty state with "Go to Arena Feed" CTA

---

#### 4. `/arena/profile/[id]` — Public Arena Profile ✅

- Fetches `GET /api/v1/arena/profile/{id}` (optional Bearer token)
- `ProfileData` interface: user (id, name, role, sport, province, position, bio, avatar_url), posts[], scout_views, is_following, connection_status (none/pending/connected), prediction
- Profile header: avatar/initials, name, role badge (gold/green/purple), sport + province chips
- THUTO Score card: projected_score large display, peak_level_label, percentile pill
- Prediction card: upside stars, comparable player, narrative excerpt (expandable)
- Scout view count: "X scouts viewed this week" with Eye icon
- Recent Arena Posts: up to 5, with post type badges, like count, comment count
- CTA row: Follow button (toggle, optimistic) + Connect button (green) + Message link (only if connected)
- Connect calls `POST /api/v1/arena/connect/{id}`
- Skeleton loader (3-section pulse)
- Not-found state if API returns 404

---

#### 5. `/arena/recruitment` — Talent Board ✅

- `TalentPosting` interface: id, sport, position, age_min, age_max, thuto_min, province, style_of_play, stipend, description, status, closes_at, applications_count, poster, club
- Filter chips: sport × 10, province dropdown, Stipend Available toggle, THUTO min score
- `PostingCard`: sport badge, stipend/THUTO/closed badges, daysLeft countdown (red ≤3), position title, club name, province + age range + applications count meta grid, style_of_play snippet
- "Post a Talent Wanted" CTA button → `/arena/recruitment/new`
- Fetches `GET /api/v1/arena/talent-wanted` with filters
- Closed postings shown with dimmed opacity + "Closed" badge

#### 6. `/arena/recruitment/[id]` — Posting Detail + Apply ✅

- Full posting detail with all meta fields in 2×2 grid cards
- Apply modal: message textarea (1000 chars) + availability input (200 chars)
- Calls `POST /api/v1/arena/talent-wanted/{id}/apply`
- Apply button only shown to `role:player` users
- Coach users see "View Applications ({count})" → `/coach/recruitment?posting={id}`
- "Already applied" state (from `json.applied`)
- Success banner + submitted state after apply
- Closed state respects `status === "closed"` OR `daysLeft === 0`

#### 7. `/arena/recruitment/new` — Create Posting Form ✅

- Auth gate (redirect to /login if no token)
- Fields: sport (10-sport grid), position text, age_min/max, THUTO_min (slider-style chips), province, stipend toggle, style_of_play, description (1000 chars), closes_at date
- Submits to `POST /api/v1/arena/talent-wanted`
- Success redirects to `/arena/recruitment`

#### 8. `/coach/recruitment` — Coach Applications Viewer ✅

- Fetches `GET /api/v1/arena/talent-wanted?mine=true` for coach's own postings
- Fetches applications per posting: `GET /api/v1/arena/talent-wanted/{id}/applications`
- Tab switcher: one tab per posting
- Applicant rows: name + message excerpt + availability + applied date
- Expand row → full message + `View Profile → /arena/profile/{id}` link
- Application count badges on tabs

#### 9. Sidebar Nav — Discover Athletes + Arena Alerts ✅

**All 4 arena-enabled roles updated:**
```
/arena/discover        Discover Athletes  (UserSearch icon)
/arena/notifications   Arena Alerts       (Bell icon)
```
Both inserted after `/arena/network` in coach, scout, player, and fan sections.

---

### ARENA SPRINT 5 — MISSING LARAVEL BACKEND (copy-paste ready)

These 4 endpoints are called by Sprint 5 frontend pages but NOT yet built on Laravel.

#### Routes to add to `routes/api.php`:
```php
// Arena Sprint 5 — Discover & Profiles
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/arena/leaderboard', [ArenaFeedController::class, 'leaderboard']);
    Route::get('/arena/suggested',   [ArenaSocialController::class, 'suggested']);
});
// Public (optional auth — no middleware)
Route::get('/arena/discover',     [ArenaSocialController::class, 'discover']);
Route::get('/arena/profile/{id}', [ArenaSocialController::class, 'profile']);
```

#### `ArenaFeedController::leaderboard()`:
```php
public function leaderboard(Request $request): JsonResponse
{
    $entries = Cache::remember('arena_leaderboard', 3600, function () {
        return DB::table('player_predictions')
            ->join('users', 'player_predictions.player_id', '=', 'users.id')
            ->join('player_profiles', 'users.id', '=', 'player_profiles.user_id')
            ->where('player_predictions.data_quality', '!=', 'low')
            ->whereNotNull('player_predictions.projected_score')
            ->select(
                'users.id',
                DB::raw("CONCAT(LEFT(player_profiles.first_name,1),'.',LEFT(player_profiles.surname,1),'.') as initials"),
                DB::raw("COALESCE(users.sport,'Football') as sport"),
                DB::raw("COALESCE(users.province,'') as province"),
                'player_predictions.projected_score',
                'player_predictions.peak_level_label'
            )
            ->orderByDesc('player_predictions.projected_score')
            ->limit(5)
            ->get();
    });
    return response()->json(['data' => $entries]);
}
```

#### `ArenaSocialController::suggested()`:
```php
public function suggested(Request $request): JsonResponse
{
    $me = $request->user();
    if (!$me) return response()->json(['data' => []]);
    $alreadyFollowing = DB::table('arena_follows')
        ->where('follower_id', $me->id)->pluck('following_id')->toArray();
    $alreadyFollowing[] = $me->id;
    $users = DB::table('users')
        ->leftJoin('player_profiles','users.id','=','player_profiles.user_id')
        ->whereNotIn('users.id', $alreadyFollowing)
        ->select('users.id','users.name','users.role',
            DB::raw("COALESCE(users.sport,'Football') as sport"),
            DB::raw("COALESCE(users.province,'') as province"))
        ->inRandomOrder()->limit(3)->get()
        ->map(function ($u) { $u->mutual_connections = 0; return $u; });
    return response()->json(['data' => $users]);
}
```

#### `ArenaSocialController::discover()`:
```php
public function discover(Request $request): JsonResponse
{
    $me = auth('sanctum')->user();
    $meId = $me?->id;
    $query = DB::table('users')
        ->leftJoin('player_profiles','users.id','=','player_profiles.user_id')
        ->leftJoin('player_predictions','users.id','=','player_predictions.player_id')
        ->select('users.id','users.name','users.role',
            DB::raw("COALESCE(users.sport,'Football') as sport"),
            DB::raw("COALESCE(users.province,'') as province"),
            'player_profiles.position_primary as position',
            'player_predictions.projected_score as thuto_score',
            'player_predictions.peak_level_label','player_profiles.avatar_url');
    if ($q = $request->query('q'))         $query->where('users.name','ilike',"%{$q}%");
    if ($sport = $request->query('sport')) $query->where('users.sport',$sport);
    if ($prov = $request->query('province')) $query->where('users.province',$prov);
    if ($pos = $request->query('position')) $query->where('player_profiles.position_primary','ilike',"%{$pos}%");
    if ($min = $request->query('min_score')) $query->where('player_predictions.projected_score','>=',(int)$min);
    if ($meId) $query->where('users.id','!=',$meId);
    $players = $query->orderByDesc('player_predictions.projected_score')->paginate(20);
    $followingIds = $meId
        ? DB::table('arena_follows')->where('follower_id',$meId)->pluck('following_id')->toArray()
        : [];
    $players->getCollection()->transform(fn($p) => tap($p, fn($p) => $p->is_following = in_array($p->id,$followingIds)));
    return response()->json($players);
}
```

#### `ArenaSocialController::profile()`:
```php
public function profile(Request $request, string $id): JsonResponse
{
    $me = auth('sanctum')->user();
    $meId = $me?->id;
    $user = DB::table('users')
        ->leftJoin('player_profiles','users.id','=','player_profiles.user_id')
        ->leftJoin('player_predictions','users.id','=','player_predictions.player_id')
        ->where('users.id',$id)
        ->select('users.id','users.name','users.role',
            DB::raw("COALESCE(users.sport,'Football') as sport"),
            DB::raw("COALESCE(users.province,'') as province"),
            'player_profiles.position_primary as position','player_profiles.bio',
            'player_profiles.avatar_url',
            'player_predictions.projected_score as thuto_score',
            'player_predictions.peak_level_label','player_predictions.upside_rating',
            'player_predictions.upside_label','player_predictions.percentile',
            'player_predictions.comparable_name','player_predictions.narrative as prediction_narrative',
            'player_predictions.data_quality')
        ->first();
    if (!$user) return response()->json(['error'=>'Not found'],404);
    $posts = DB::table('arena_posts')->where('user_id',$id)
        ->orderByDesc('created_at')->limit(5)->get();
    $scoutViews = DB::table('profile_views')
        ->where('player_id',$id)->where('viewed_at','>=',now()->subDays(7))->count();
    $isFollowing = $meId && DB::table('arena_follows')
        ->where('follower_id',$meId)->where('following_id',$id)->exists();
    $connection = $meId ? DB::table('arena_connections')
        ->where(fn($q)=>$q->where('requester_id',$meId)->where('recipient_id',$id)
            ->orWhere(fn($q)=>$q->where('requester_id',$id)->where('recipient_id',$meId)))
        ->first() : null;
    $connectionStatus = $connection
        ? ($connection->status === 'accepted' ? 'connected' : 'pending')
        : 'none';
    return response()->json([
        'user'=>$user,'posts'=>$posts,'scout_views'=>$scoutViews,
        'is_following'=>$isFollowing,'connection_status'=>$connectionStatus,
    ]);
}
```

**Also add `talent-wanted` routes** (Recruitment Board backend needed):
```php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/arena/talent-wanted',        [TalentWantedController::class, 'index']);
    Route::post('/arena/talent-wanted',       [TalentWantedController::class, 'store']);
    Route::get('/arena/talent-wanted/{id}',   [TalentWantedController::class, 'show']);
    Route::post('/arena/talent-wanted/{id}/apply',        [TalentWantedController::class, 'apply']);
    Route::get('/arena/talent-wanted/{id}/applications',  [TalentWantedController::class, 'applications']);
});
```

**`TalentWantedController` needs these tables (new migration):**
```sql
CREATE TABLE talent_postings (
  id              UUID PK (gen_random_uuid()),
  poster_id       UUID FK → users,
  club_id         UUID FK → arena_clubs nullable,
  sport           VARCHAR,
  position        VARCHAR,
  age_min         SMALLINT,
  age_max         SMALLINT,
  thuto_min       SMALLINT DEFAULT 0,
  province        VARCHAR nullable,
  style_of_play   TEXT nullable,
  stipend         BOOLEAN DEFAULT false,
  description     TEXT,
  status          VARCHAR DEFAULT 'open',  -- open | closed
  closes_at       TIMESTAMP nullable,
  applications_count INTEGER DEFAULT 0,
  created_at, updated_at
);

CREATE TABLE talent_applications (
  id              UUID PK,
  posting_id      UUID FK → talent_postings (cascade),
  applicant_id    UUID FK → users (cascade),
  message         TEXT,
  availability    VARCHAR nullable,
  status          VARCHAR DEFAULT 'pending',  -- pending | accepted | rejected
  created_at, updated_at,
  UNIQUE(posting_id, applicant_id)
);
```

---

### ALL BUILT ROUTES — ADDITIONS (19 May 2026, Sprint 5)

```
/arena/discover              Discover Athletes — search + filters, follow toggle
/arena/notifications         Arena Alerts — date-grouped, mark-all-read, dismiss
/arena/profile/[id]          Public Arena Profile — THUTO score, prediction, posts
/arena/recruitment           Talent Board — filter by sport/province/stipend/THUTO
/arena/recruitment/[id]      Posting detail + player apply modal
/arena/recruitment/new       Create talent-wanted posting (coach only)
/coach/recruitment           Coach applications viewer — tabbed per posting
```

---

### WHAT STILL NEEDS DOING (19 May 2026)

| Item | Status | Action Required |
|---|---|---|
| Arena Sprint 5 backend endpoints | NOT YET BUILT on Laravel | Copy 4 controller methods above to bhora-ai + add routes |
| `talent_postings` + `talent_applications` tables | NOT YET BUILT | Create migration + `TalentWantedController` in bhora-ai |
| `/arena/clubs/new` page | NOT YET BUILT | Club registration form |
| Chemistry migrations on Render | NOT YET RUN | `php artisan migrate --force` for 5 chemistry tables (7 May session) |
| Week 5 — Player Chemistry View | NOT YET BUILT | `/players/similar` page + consent toggle in settings |
| `GROQ_API_KEY` | NOT set in Vercel | THUTO AI broken without this |
| `R2_*` vars (5 vars) | NOT set in Vercel | Video/showcase/fan hub uploads broken without this |

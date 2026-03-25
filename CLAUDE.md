# GrassRoots Sports - Claude Code Master Playbook
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

- Token value: `"dev-token"` (stored in localStorage as `auth_token`)
- Backend always returns 401 for this token — that is expected
- Web app detects this token and skips the 401 redirect
- AI Coach routes directly to the Next.js Anthropic proxy (bypasses Laravel `/ask`)
- Login: nnygel@live.com / test1234 (sets dev-bypass session)

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

### Grassroots Sports (Bhora AI) — Laravel Backend
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
| xG & Shot Analysis | Coming Soon 🔒 | `#` |
| AI Tactical Report | Coming Soon 🔒 | `#` |
| Pass Map Network | Coming Soon 🔒 | `#` |
| Player Heatmaps | Coming Soon 🔒 | `#` |
| Season Intelligence | Coming Soon 🔒 | `#` |

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
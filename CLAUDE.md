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
    all: ['goals', 'attempts', 'goalAccuracy', 'intercepts', 'contacts',
          'centerPassReceives', 'rebounds'],
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
/player/subscription       Subscription management
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
/injury-tracker            Injury tracking page
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
| Push Notifications | Done | Backend needs to store notifications in DB and trigger on events |
| Payment / Subscriptions | UI exists | PayFast/Stripe integration not wired |
| Email delivery | UI exists | Laravel mail config (SMTP/Mailgun) not set up |
| WhatsApp Match Reports | Not built yet | Twilio WhatsApp API key + Laravel route needed |
| Video Storage | UI exists | AWS S3 or Cloudflare R2 bucket not configured |
| FCM Push Delivery | Admin UI done | Firebase project + FCM server key needed on Laravel |
| Streaming | Daily.co UI done | Need DAILY_API_KEY in Vercel env |

### PACKAGES IN package.json (do not re-install these)
```
jspdf              ^4.2.0   — PDF generation
jspdf-autotable    ^5.0.7   — PDF tables
@tanstack/react-query        — all data fetching
zustand                      — global state (auth-store, etc.)
@daily-co/daily-js           — WebRTC live streaming
next                 14      — framework
```

### ENVIRONMENT VARIABLES (.env.local + Vercel)
```
NEXT_PUBLIC_API_URL = https://bhora-ai.onrender.com/api/v1
ANTHROPIC_API_KEY   = set in both .env.local AND Vercel dashboard
DEEPSEEK_API_KEY    = set in .env.local (not used by web app, used by Laravel)
DAILY_API_KEY       = set in .env.local AND Vercel (live streaming)
```

### LAST 5 COMMITS (as of March 2026)
```
774756f  feat: browser push notifications via Web Notification API
4b53f48  feat: auth hydration guard — add layout.tsx for streaming/video-studio/welcome/sessions/video-analysis
[prior]  feat: player/coach/scout/fan layout.tsx auth guards + _hasHydrated in auth-store
[prior]  feat: multi-sport live match — sport selector, SPORT_FORMATIONS, halftime prompt
[prior]  fix: remove OTP step from all 4 registration flows
```

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
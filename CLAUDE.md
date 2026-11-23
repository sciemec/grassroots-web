# GrassRoots Sports — Next.js Frontend (grassroots-web)

**Full history:** `docs/archive/CLAUDE-full-2026-11-22-grassroots-web.md`
**Universal rules** (hosting, git safety, architect rules, THUTO, auth, secrets): see `D:/bhora-ai/CLAUDE.md`

## Stack & Commands

- Next.js 14 (TypeScript), Render `grassroots-web` service, branch `main`
- Backend API: `https://bhora-ai.onrender.com/api/v1` (env: `NEXT_PUBLIC_API_URL`)

```bash
npm run dev          # local dev
npm run build        # must exit 0 before every push
npm run lint         # must exit 0 before every push
npx tsc --noEmit     # TypeScript check
```

**Deploy = `git push origin main`** → Render auto-deploys. Never run `vercel` commands.

## Environment Variables (Render dashboard — grassroots-web service)

```
NEXT_PUBLIC_API_URL       = https://bhora-ai.onrender.com/api/v1
ANTHROPIC_API_KEY         = (Claude proxy at /api/ai-coach)
GEMINI_API_KEY            = (drill video analysis — /api/analyse-from-uri)
GROQ_API_KEY              = (THUTO chat — /api/ai-coach)
GOOGLE_AI_API_KEY         = (Match Eye Gemini File API)
NEXT_PUBLIC_TRACKER_URL   = https://ai.bhora-ai.onrender.com
STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET
WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN / WHATSAPP_VERIFY_TOKEN
R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET / R2_PUBLIC_URL
FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
RESEND_API_KEY / EMAIL_FROM
DAILY_API_KEY
PAYNOW_INTEGRATION_ID / PAYNOW_INTEGRATION_KEY
NEXT_PUBLIC_APP_URL       = https://grassrootssports.live
```

## Permanent Rules

### Video Upload — NEVER POST bytes to Vercel (4.5 MB limit)

```
Gemini:  Edge route returns uploadUrl only → browser XHR PUT directly to Google
R2:      POST /api/upload/presigned → browser XHR PUT to R2 presigned URL
Python:  Browser sends FormData XHR directly to NEXT_PUBLIC_TRACKER_URL
```

### Zustand Selector Rule (React #185 — infinite re-render)

```typescript
// WRONG — new object every render
const { user, token } = useAuthStore((s) => ({ user: s.user, token: s.token }));
// RIGHT — always separate selectors
const user  = useAuthStore((s) => s.user);
const token = useAuthStore((s) => s.token);
```

### Safe Array Pattern

```typescript
// NEVER: res.data?.data ?? res.data ?? []
// ALWAYS:
const _r = res.data?.data ?? res.data;
Array.isArray(_r) ? _r : []
// OR: import { safeArray } from "@/lib/safe-array"; safeArray(res.data)
```

### Auth Hydration Race Fix (DO NOT UNDO)

`auth-store.ts` has `_hasHydrated` flag. Every protected hub has a `layout.tsx`:
```typescript
const hasHydrated = useAuthStore((s) => s._hasHydrated);
useEffect(() => {
  if (!hasHydrated) return;
  if (!user) router.push("/login");
}, [hasHydrated, user, router]);
if (!hasHydrated || !user) return null;
```

### No Inline `<style>` in JSX (Next.js hydration error #418)

Always put `@keyframes` in `globals.css`. Never use `<style>` tags in component bodies without `precedence`.

### Multipart Upload (never set Content-Type manually)

```typescript
// WRONG — breaks multipart boundary:
api.post("/profile/photo", formData, { headers: { "Content-Type": "multipart/form-data" } });
// RIGHT — let Axios detect FormData:
api.post("/profile/photo", formData);
```

## Protected Files — NO TOUCH without Nigel's explicit "yes, go ahead"

- `src/app/register/page.tsx` — main wizard, all 4 roles, CONFIRMED WORKING
- `src/app/register/official/page.tsx` — ZIFA official registration
- `src/app/api/auth/login/route.ts`
- `src/app/login/page.tsx` — CONFIRMED WORKING
- `src/lib/auth-store.ts` — Zustand auth store with hydration fix — CRITICAL

## Protected Routes

### /players — PERMANENT (Oct 2026)

NEVER redirect `/players`, rename `src/app/players/page.tsx`, or change "Discover Talent"
nav/CTA links away from `/players`. Shows 341+ athletes, confirmed working.

### Arena — ADDITIVE ONLY (PERMANENT)

Never remove tabs, filters, buttons, or sections from any Arena page without explicit approval.
Arena pages: `/arena`, `/arena/network`, `/arena/messages`, `/arena/discover`,
`/arena/clubs/`, `/arena/recruitment/`

## THUTO UI Rule (PERMANENT)

Default state: **small circle**, bottom-right corner. Always visible. Never auto-opens.
Full panel opens only when user **clicks**. Circle turns RED on unread messages.
`THUTO_ACTIVE = true` in `ThutoChat.tsx` — only set false if Nigel explicitly asks.

## No Silent Removal Rule (PERMANENT)

Before refactoring any layout: list every confirmed-working feature currently rendered.
Never remove `NotificationBell`, `ThutoChat`, `LogProfileView`, `AdBanner`, or any
polling `useEffect` without explicit approval.

## Sprint File Rule (PERMANENT)

If a Sprint file exists (Sprint1.md, Sprint2.md, etc.) in the working directory, read it
IN FULL before writing a single line of code. The sprint design spec overrides everything.

## Arena Design Spec (Sprint1.md — PERMANENT)

```
Background:  #f4f2ee  (warm off-white)
Primary:     #1a5c2a  (forest green)
Accent:      #c8962a  (gold)
Nav:         White sticky ArenaNav — NOT the dark Sidebar component
Cards:       bg-white rounded-2xl border border-gray-200 shadow-sm
```

## Guardian Consent — Frontend Rules

Minor players (under_13, 13_17): check consent before surfacing data. See `D:/bhora-ai/CLAUDE.md`
for `hasConsentFor()` logic. Missing row = consented. Player-facing blocks: silent (empty data + 201).

## Key Lib Files

| File | Purpose |
|---|---|
| `src/lib/safe-array.ts` | `safeArray<T>(data)` — safe API array extraction |
| `src/lib/arena-poster.ts` | `postToArena(body, options?)` — fire-and-forget Arena post |
| `src/lib/r2.ts` | `r2Client` + `R2_BUCKET` — Cloudflare R2 S3Client |
| `src/lib/auth-store.ts` | Zustand auth store — `_hasHydrated` flag — CRITICAL |

## Route Inventory

50+ routes built. Full list in archive. Key hubs:

```
/player/*          Player hub (profile, showcase, vault, assess, drills, analyse, success, passport)
/coach/*           Coach hub (squad, live-match, chemistry, skill-drills, video-library, gemini-drills)
/scout/*           Scout hub (reports, shortlist, compare)
/fan/*             Fan hub
/arena/*           Arena social hub (feed, network, messages, clubs, recruitment, discover)
/analyst/*         Analyst hub (match-eye, heatmaps, pass-map, tactical-report, season)
/admin/*           Admin hub
/passport/[id]     Public shareable player passport (no auth)
/talent-leaderboard  Public THUTO leaderboard
/fan-hub           Public video feed
/watch/[videoId]   Shareable match video watch page
/team-videos/[id]  Public coach match archive
/worldcup          Tactical IQ Lab
```

## Hard Rules (PERMANENT)

**Git safety:** NEVER `git add .` or `git add -A`. Stage by file name only.
NEVER `git stash` or `git pull` in a shared working tree. Use `git pull --rebase` only
after confirming no other window is editing and the tree is clean.

**Secrets:** NEVER print passwords, API keys, tokens, or connection strings.
Report file and line number only.

**Service worker:** Bump `CACHE_VERSION` whenever caching logic changes.
NEVER cache authenticated API responses (any response that required an `Authorization` header).

**Sponsorship:** Public pages (`/sponsorships`) must show live cases only (`status = 'live'`).
Owner's own cases load client-side with the auth token from `GET /sponsorships/mine` —
server components have no token and cannot load them server-side.
Players (`role === 'player'`) cannot use "Ask to Connect" — hide the button for that role.
GRS never holds money. `SPONSORSHIP_MONEY_ENABLED=false`. Flat fees only — never escrow.

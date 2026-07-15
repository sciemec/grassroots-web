# REGISTRATION_TASK.md
## GrassRoots Sports — Web Registration Flow
**Last updated: March 2026 | Status: IN PROGRESS ⚠️ — 4 gaps identified**

---

## OVERVIEW

This task covers the **multi-role registration flow** for the GrassRoots Sports web app.
Users first pick a sport, then a role, then complete a role-specific multi-step form.

Entry point: `/register` → pick sport → pick role → `/register/{role}?sport={sport}` → `/verify-otp` → `/welcome`

**Roles supported:**
- **Player** — 5-step form → OTP → `/welcome`
- **Coach** — 4-step form → OTP → `/welcome`
- **Scout** — 4-step form → OTP (pending admin review) → `/welcome`
- **Fan** — 3-step form → OTP → `/welcome`

---

## WHAT HAS BEEN BUILT ✅

### Entry — Sport + Role Selector (`/register`)
- `src/app/register/page.tsx`
- Step 1: 10-sport grid (Football, Rugby, Athletics, Netball, Basketball, Cricket, Swimming, Tennis, Volleyball, Hockey)
- Step 2: 4-role cards (Player / Coach / Scout / Fan), each with badge, description, CTA
- Routes to `/register/{role}?sport={sport}` on selection

### Player Registration (`/register/player`)
- `src/app/register/player/page.tsx`
- **5-step form** with animated step indicator + progress bar:
  - Step 1 — Personal: first name, surname, DOB (day/month/year selectors), phone
  - Step 2 — Account: email, password (strength meter), confirm password
  - Step 3 — Playing: position (sport-specific list), province, school/club (optional)
  - Step 4 — Physical: height (cm), weight (kg), dominant foot toggle (right/left/both)
  - Step 5 — Consent: review summary, guardian phone if under-13 (ZIFA safeguarding), terms checkbox
- Sport-aware: positions loaded from `SPORT_MAP[sport].positions`
- Age group computed live from DOB: `under_13 | 13_17 | 18_25 | 26_plus`
- Guardian phone field conditionally shown for under-13 players
- Submits to `POST /auth/register` with `role: "player"`
- On success → `/verify-otp?identifier={email_or_phone}`

### Coach Registration (`/register/coach`)
- `src/app/register/coach/page.tsx`
- **4-step form** (Personal → Account → Professional → Confirm):
  - Step 1 — Personal: name, phone, province
  - Step 2 — Account: work email, password, confirm
  - Step 3 — Professional: team/club name, sport coached, CAF coaching level, years of experience
  - Step 4 — Confirm: review summary, terms checkbox
- Submits to `POST /auth/register` with `role: "coach"`
- On success → `/verify-otp?identifier={identifier}`

### Scout Registration (`/register/scout`)
- `src/app/register/scout/page.tsx`
- **4-step form** (Personal → Account → Professional → Confirm):
  - Step 1 — Personal: name, phone, province (base of operations)
  - Step 2 — Account: email, password, confirm
  - Step 3 — Professional: organisation/club, ZIFA accreditation number (optional), years of experience, scouting regions (multi-select pill buttons)
  - Step 4 — Confirm: review summary, info notice about 24hr admin review, ZIFA data sharing terms
- Submits to `POST /auth/register` with `role: "scout"`
- On success → `/verify-otp?identifier={identifier}`
- **Scout accounts require admin approval** (notice shown on confirm step)

### Fan Registration (`/register/fan`)
- `src/app/register/fan/page.tsx`
- **3-step form** (Discover → Account → Confirm):
  - Step 1 — Discover: name, province, favourite sport (10-sport visual grid)
  - Step 2 — Account: email, password, confirm
  - Step 3 — Confirm: review summary, "What you get as a Fan" benefits list, terms
- Submits to `POST /auth/register` with `role: "fan"`
- On success → `/verify-otp?identifier={identifier}`

### OTP Verification (`/verify-otp`)
- `src/app/verify-otp/page.tsx`
- 6-digit OTP input with auto-focus, paste support, keyboard nav
- Resend OTP option
- On success → `login()` stores JWT + user, redirects to `/welcome`

### Auth Store
- `src/lib/auth-store.ts` — Zustand store; `login()` saves token + user

---

## GAPS REMAINING — BUILD THESE NEXT ⚠️

---

### GAP 1 — Post-registration AI welcome message is missing (PRIORITY — matches mobile GAP 2)

**Where:** `/welcome` page (post-OTP verification success redirect)

**Problem:**
After OTP verification, the user lands on `/welcome` with no personalised onboarding.
The mobile app has a position-aware AI coach introduction. The web should do the same.

**What to build:**
Update `src/app/welcome/page.tsx` to show a role-specific and position-specific AI welcome card:

```
[Role icon / avatar]
"Welcome to Grassroots Sports, {firstName}!"
"[Role-specific welcome line]"
[CTA → Go to Dashboard]
```

**Welcome messages by role + position (Player):**
```typescript
const PLAYER_WELCOME: Record<string, string> = {
  "Goalkeeper":           "Your reflexes protect the team. Let's build them.",
  "Defender":             "A strong defence wins trophies. Let's get to work.",
  "Midfielder":           "The engine of the team. Let's build your stamina and vision.",
  "Forward":              "Goals win games. Let's sharpen your finishing.",
  "Striker":              "Goals win games. Let's sharpen your finishing.",
  "Centre Forward":       "Goals win games. Let's sharpen your finishing.",
  "default":              "Every great player started here. Let's find your position.",
};

const ROLE_WELCOME: Record<string, string> = {
  coach:  "Your squad is waiting. Let's build your first session.",
  scout:  "Zimbabwe's next star is out there. Let's find them.",
  fan:    "The game is live. Let's see what Zimbabwe sport has to offer.",
};
```

**Implementation rules:**
- Read user from `useAuthStore` — name, role, position already stored after login
- NO API call — use stored user data only
- Animate in with CSS transition (fade + slide up)
- Show sport emoji from their registered sport
- CTA button routes to the correct dashboard:
  - Player → `/player`
  - Coach → `/coach`
  - Scout → `/scout`
  - Fan → `/fan`

**Files to touch:**
- `src/app/welcome/page.tsx`

---

### GAP 2 — Player sport icon hardcoded to ⚽ in registration header

**File:** `src/app/register/player/page.tsx:163`

**Problem:**
```tsx
<span className="text-2xl">⚽</span>
```
The sport icon in the page header is hardcoded to the football emoji regardless of the sport selected on `/register`. Same issue in `coach/page.tsx:113` and `scout/page.tsx`.

**Fix:**
Replace hardcoded emoji with the dynamic sport emoji from `sportCfg`:
```tsx
<span className="text-2xl">{sportCfg.emoji}</span>
```

**Files to touch:**
- `src/app/register/player/page.tsx` — line ~163
- `src/app/register/coach/page.tsx` — line ~113
- `src/app/register/scout/page.tsx` — line ~113

**Acceptance criteria:**
- Register as a Rugby player → header shows 🏉
- Register as a Swimming coach → header shows 🏊
- Register as a Cricket scout → header shows 🏏

---

### GAP 3 — Silent error catch in all 4 registration forms (CODE QUALITY)

**Files:**
- `src/app/register/player/page.tsx:143`
- `src/app/register/coach/page.tsx:95`
- `src/app/register/scout/page.tsx:95`
- `src/app/register/fan/page.tsx:91`

**Problem:**
All 4 forms catch API errors but do NOT reset `loading` on success path edge cases,
and swallow the actual caught error object without logging it. If the API returns an
unexpected shape, the user sees a generic message with no developer trace.

**Current pattern (all 4 files):**
```typescript
} catch (e: unknown) {
  const data = (e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
  setError(data?.errors ? Object.values(data.errors).flat().join(". ") : (data?.message ?? "Registration failed."));
  setLoading(false);
}
```

**Fix — extract a shared error handler and log to console.error:**
```typescript
} catch (e: unknown) {
  const data = (e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
  const msg = data?.errors
    ? Object.values(data.errors).flat().join(". ")
    : (data?.message ?? "Registration failed. Please try again.");
  console.error("[Registration error]", e);
  setError(msg);
  setLoading(false);
}
```

**Better fix — shared utility in `src/lib/api-error.ts`:**
```typescript
export function extractApiError(e: unknown, fallback = "Something went wrong."): string {
  const data = (e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
  console.error("[API error]", e);
  return data?.errors
    ? Object.values(data.errors).flat().join(". ")
    : (data?.message ?? fallback);
}
```
Then in each form:
```typescript
import { extractApiError } from "@/lib/api-error";
// ...
} catch (e) {
  setError(extractApiError(e, "Registration failed. Please try again."));
  setLoading(false);
}
```

**Files to touch:**
- `src/lib/api-error.ts` — new shared utility (1 file, used by all 4 forms)
- `src/app/register/player/page.tsx`
- `src/app/register/coach/page.tsx`
- `src/app/register/scout/page.tsx`
- `src/app/register/fan/page.tsx`

---

### GAP 4 — No "Go Back" from `/verify-otp` if user registered with wrong email

**File:** `src/app/verify-otp/page.tsx`

**Problem:**
If a user makes a typo in their email during registration, they land on `/verify-otp`
with no way to go back and fix it. The only option is to close the tab and start over.
The identifier (email/phone) is visible in the URL but the form does not show it clearly
or offer a correction path.

**What to build:**
1. Display the identifier (email or phone) prominently at the top:
   ```
   We sent a 6-digit code to:
   tinashe@example.com  [Wrong? Go back]
   ```
2. "Go back" links to `/register` (the role selector) so they restart cleanly.
3. Show the identifier truncated if it's long (max 30 chars, then `…`)

**Files to touch:**
- `src/app/verify-otp/page.tsx`

---

## BUILD ORDER

```
GAP 2 first  — sport emoji fix (5 min, 3 one-line changes, zero risk)
GAP 3 second — shared error utility (15 min, cleaner code, reduce duplication)
GAP 4 third  — verify-otp UX improvement (15 min, improves conversion)
GAP 1 last   — AI welcome screen (30 min, new feature, needs auth store values)
```

---

## FILES TO TOUCH

| File | Gap | Change |
|------|-----|--------|
| `src/app/register/player/page.tsx` | GAP 2, GAP 3 | Sport emoji fix + error handler |
| `src/app/register/coach/page.tsx` | GAP 2, GAP 3 | Sport emoji fix + error handler |
| `src/app/register/scout/page.tsx` | GAP 2, GAP 3 | Sport emoji fix + error handler |
| `src/app/register/fan/page.tsx` | GAP 3 | Error handler |
| `src/lib/api-error.ts` | GAP 3 | New shared utility |
| `src/app/verify-otp/page.tsx` | GAP 4 | Identifier display + back link |
| `src/app/welcome/page.tsx` | GAP 1 | Role-aware AI welcome message |

No new routes or pages needed (except possible `api-error.ts` utility).

---

## FULL REGISTRATION FLOW (as-built)

```
/register
  ├── Step 1: Pick Sport (10 options)
  └── Step 2: Pick Role → routes to:

/register/player?sport={sport}    (5 steps)
  ├── Step 1: Personal (name, DOB, phone)
  ├── Step 2: Account (email, password)
  ├── Step 3: Playing (position, province, school)
  ├── Step 4: Physical (height, weight, foot)
  └── Step 5: Consent (review, guardian if <13, terms)
       └── POST /auth/register → /verify-otp

/register/coach?sport={sport}     (4 steps)
  ├── Step 1: Personal (name, phone, province)
  ├── Step 2: Account (email, password)
  ├── Step 3: Professional (team, sport, CAF level, experience)
  └── Step 4: Confirm (review, terms)
       └── POST /auth/register → /verify-otp

/register/scout?sport={sport}     (4 steps)
  ├── Step 1: Personal (name, phone, province)
  ├── Step 2: Account (email, password)
  ├── Step 3: Professional (org, accreditation, experience, regions)
  └── Step 4: Confirm (review, admin-review notice, ZIFA terms)
       └── POST /auth/register → /verify-otp

/register/fan?sport={sport}       (3 steps)
  ├── Step 1: Discover (name, province, favourite sport)
  ├── Step 2: Account (email, password)
  └── Step 3: Confirm (review, fan benefits, terms)
       └── POST /auth/register → /verify-otp

/verify-otp?identifier={email|phone}
  └── POST /auth/verify-otp → login() → /welcome

/welcome
  └── [GAP 1] Role-aware AI welcome → /player | /coach | /scout | /fan
```

---

## WHAT WAS INTENTIONALLY ADAPTED FROM MOBILE (not built on web)

| Mobile Feature | Web Decision | Reason |
|----------------|-------------|--------|
| Document scan (OCR camera) | **NOT built** | Browser camera access is complex; web uses typed form instead |
| Photo selfie step | **NOT built** | Players upload profile photo from dashboard after onboarding |
| QR code + PDF player card | **NOT built** | Available in player profile page; not needed at registration |
| Local Drift DB save | **NOT built** | Web is online-first; data lives in Laravel API |
| Sync queue (offline) | **NOT built** | Web requires internet; offline-first is Phase 5 (PWA) |
| `registration_step_indicator` animated dots | **Adapted** | Replaced with pill-shaped step tabs + progress bar |
| ZIFA number generation | **NOT built** | ZIFA number is assigned server-side by Laravel on registration |
| Geolocator GPS auto-detect | **NOT built** | Province selected via dropdown (GPS permission UX is worse on web) |

---

## AFTER BUILDING — VERIFY

```bash
npm run build    # zero TypeScript errors
npm run lint     # zero linting errors
```

Manual test checklist:
- [ ] `/register` → pick Rugby → pick Player → header shows 🏉 (GAP 2)
- [ ] Complete player registration → OTP screen shows email with back link (GAP 4)
- [ ] Verify OTP → `/welcome` shows personalised AI message for role + position (GAP 1)
- [ ] Registration API failure → human-readable error shown, loading stops (GAP 3)
- [ ] Under-13 DOB entered → guardian phone field appears on Step 5
- [ ] Scout submit → admin review notice visible on confirm step
- [ ] Fan flow works end-to-end (3 steps → OTP → welcome)
- [ ] Works at 375px mobile width (all 4 forms)
- [ ] All 4 forms work when API is slow (loading spinner shown)

---

## WHAT NOT TO TOUCH

- Do NOT change the 10-sport grid on `/register` — it is correct and complete
- Do NOT change the API endpoint `/auth/register` — Laravel defines the contract
- Do NOT add server-side rendering to these pages — they are correctly `"use client"` forms
- Do NOT add ZIFA number generation on the frontend — this is server-side only
- Do NOT add document scanning or OCR — this is mobile-only

---

*Verified. Online. Professional. Zimbabwe First. 🇿🇼*

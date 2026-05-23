# GRASSROOTS SPORTS — CLAUDE CODE BRIEFING
## Sprint 1: The Arena Social Graph
### Follows · Connections · Direct Messages · Network Page

---

> **READ THIS BEFORE TOUCHING ANY FILE**
> 1. Read `CLAUDE.md` fully first. The full route list is there. Do not rebuild what already exists.
> 2. Show Nigel every file before creating or editing it. Wait for approval. One change at a time.
> 3. Every new route, table, and controller must be added to `CLAUDE.md` in the same commit.
> 4. Never break an existing page. After every change test `/player`, `/coach`, `/scout`, `/fan-hub`, `/login`.

---

## Project Context

| Item | Value |
|---|---|
| Project | Grassroots Sports — grassrootssports.live |
| Sprint | Sprint 1 of 5 — The Arena Social Graph |
| Frontend repo | github.com/sciemec/grassroots-web (Next.js 14, Vercel) |
| Backend repo | github.com/sciemec/bhora-ai (Laravel, Render) |
| API base URL | https://bhora-ai.onrender.com/api/v1 |
| Design | White background `#f4f2ee` · Forest green `#1a5c2a` · Gold `#c8962a` · No dark backgrounds. No patterns. |

---

## What This Sprint Builds

After Sprint 1 is complete a user will be able to:

- Follow any other user, school, or club — one-way, like Instagram
- Send a connection request to another user with an optional message — two-way, like LinkedIn
- Accept or decline incoming connection requests
- View their followers, following, and connections at `/arena/network`
- Send a direct message to any connected user
- View their inbox and message threads at `/arena/messages`

> **STOP:** These pages do NOT exist yet and must be created fresh: `/arena/network` and `/arena/messages`
> These pages DO exist and must NOT be touched: `/player`, `/coach`, `/scout`, `/fan-hub`, `/fan`, `/admin`, `/login`, `/register`

---

## Step 1 — Database Migrations

> **WARN:** Show Nigel the full migration file before running `php artisan migrate`. Never run without approval.

### Migration 1 of 3 — `arena_follows`

**Show Nigel this file before creating it.**

```php
<?php
// FILE: database/migrations/2026_05_17_000001_create_arena_follows_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('arena_follows', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('follower_id');
            $table->unsignedBigInteger('following_id');
            $table->string('following_type', 30)->default('user'); // 'user' | 'club' | 'school'
            $table->timestamps();
            $table->foreign('follower_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('following_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['follower_id', 'following_id']); // one follow per pair
        });
    }
    public function down(): void { Schema::dropIfExists('arena_follows'); }
};
```

### Migration 2 of 3 — `arena_connections`

**Show Nigel this file before creating it.**

```php
<?php
// FILE: database/migrations/2026_05_17_000002_create_arena_connections_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('arena_connections', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('requester_id');
            $table->unsignedBigInteger('recipient_id');
            $table->enum('status', ['pending', 'accepted', 'declined'])->default('pending');
            $table->text('message')->nullable(); // optional note with connection request
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();
            $table->foreign('requester_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('recipient_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['requester_id', 'recipient_id']); // one request per pair
        });
    }
    public function down(): void { Schema::dropIfExists('arena_connections'); }
};
```

### Migration 3 of 3 — `arena_messages`

**Show Nigel this file before creating it.**

```php
<?php
// FILE: database/migrations/2026_05_17_000003_create_arena_messages_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('arena_messages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sender_id');
            $table->unsignedBigInteger('recipient_id');
            $table->text('body'); // max 1000 chars — enforce in FormRequest
            $table->timestamp('read_at')->nullable(); // null = unread
            $table->timestamps();
            $table->foreign('sender_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('recipient_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['sender_id', 'recipient_id']); // fast conversation lookups
        });
    }
    public function down(): void { Schema::dropIfExists('arena_messages'); }
};
```

> **BUILD:** After Nigel approves all three migrations — run `php artisan migrate` on Render. Confirm all three tables exist. Show Nigel the output before continuing.

---

## Step 2 — Laravel Models

### `app/Models/ArenaFollow.php` — NEW

```php
<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ArenaFollow extends Model {
    protected $fillable = ['follower_id', 'following_id', 'following_type'];

    public function follower() {
        return $this->belongsTo(User::class, 'follower_id');
    }
    public function following() {
        return $this->belongsTo(User::class, 'following_id');
    }
}
```

### `app/Models/ArenaConnection.php` — NEW

```php
<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ArenaConnection extends Model {
    protected $fillable = ['requester_id', 'recipient_id', 'status', 'message', 'accepted_at'];
    protected $casts = ['accepted_at' => 'datetime'];

    public function requester() {
        return $this->belongsTo(User::class, 'requester_id');
    }
    public function recipient() {
        return $this->belongsTo(User::class, 'recipient_id');
    }
    public function isAccepted(): bool {
        return $this->status === 'accepted';
    }
}
```

### `app/Models/ArenaMessage.php` — NEW

```php
<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ArenaMessage extends Model {
    protected $fillable = ['sender_id', 'recipient_id', 'body', 'read_at'];
    protected $casts = ['read_at' => 'datetime'];

    public function sender() {
        return $this->belongsTo(User::class, 'sender_id');
    }
    public function recipient() {
        return $this->belongsTo(User::class, 'recipient_id');
    }
    public function isUnread(): bool {
        return $this->read_at === null;
    }
}
```

---

## Step 3 — ArenaSocialController

> **WARN:** Show Nigel the full controller before creating the file. This is a NEW file. Do not modify any existing controller.

### `app/Http/Controllers/Api/ArenaSocialController.php` — NEW

```php
<?php namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ArenaFollow;
use App\Models\ArenaConnection;
use App\Models\ArenaMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class ArenaSocialController extends Controller {

    // ── FOLLOWS ──────────────────────────────────────────────────────────

    public function follow(int $id): JsonResponse {
        $user = Auth::user();
        if ($user->id === $id) {
            return response()->json(['error' => 'Cannot follow yourself'], 422);
        }
        $existing = ArenaFollow::where('follower_id', $user->id)
            ->where('following_id', $id)->first();
        if ($existing) {
            $existing->delete();
            return response()->json(['followed' => false, 'message' => 'Unfollowed']);
        }
        ArenaFollow::create(['follower_id' => $user->id, 'following_id' => $id]);
        return response()->json(['followed' => true, 'message' => 'Following']);
    }

    public function followers(): JsonResponse {
        $followers = ArenaFollow::where('following_id', Auth::id())
            ->with('follower:id,name,role,sport,province')
            ->latest()->paginate(20);
        return response()->json($followers);
    }

    public function following(): JsonResponse {
        $following = ArenaFollow::where('follower_id', Auth::id())
            ->with('following:id,name,role,sport,province')
            ->latest()->paginate(20);
        return response()->json($following);
    }

    // ── CONNECTIONS ───────────────────────────────────────────────────────

    public function sendConnection(int $id, Request $request): JsonResponse {
        $user = Auth::user();
        if ($user->id === $id) {
            return response()->json(['error' => 'Cannot connect with yourself'], 422);
        }
        $existing = ArenaConnection::where(function ($q) use ($user, $id) {
            $q->where('requester_id', $user->id)->where('recipient_id', $id);
        })->orWhere(function ($q) use ($user, $id) {
            $q->where('requester_id', $id)->where('recipient_id', $user->id);
        })->first();
        if ($existing) {
            return response()->json(['error' => 'Connection already exists'], 422);
        }
        $conn = ArenaConnection::create([
            'requester_id' => $user->id,
            'recipient_id' => $id,
            'message'      => $request->input('message'),
            'status'       => 'pending',
        ]);
        return response()->json(['connection' => $conn], 201);
    }

    public function respondConnection(int $id, Request $request): JsonResponse {
        $request->validate(['status' => 'required|in:accepted,declined']);
        $conn = ArenaConnection::where('id', $id)
            ->where('recipient_id', Auth::id())
            ->where('status', 'pending')
            ->firstOrFail();
        $conn->update([
            'status'      => $request->status,
            'accepted_at' => $request->status === 'accepted' ? now() : null,
        ]);
        return response()->json(['connection' => $conn]);
    }

    public function connections(): JsonResponse {
        $userId = Auth::id();
        $connections = ArenaConnection::where('status', 'accepted')
            ->where(fn ($q) => $q->where('requester_id', $userId)->orWhere('recipient_id', $userId))
            ->with(['requester:id,name,role,sport,province', 'recipient:id,name,role,sport,province'])
            ->latest('accepted_at')->paginate(20);
        return response()->json($connections);
    }

    public function pendingConnections(): JsonResponse {
        $pending = ArenaConnection::where('recipient_id', Auth::id())
            ->where('status', 'pending')
            ->with('requester:id,name,role,sport,province,thuto_score')
            ->latest()->get();
        return response()->json($pending);
    }

    // ── MESSAGES ──────────────────────────────────────────────────────────

    public function sendMessage(int $recipientId, Request $request): JsonResponse {
        $request->validate(['body' => 'required|string|max:1000']);
        $userId = Auth::id();

        // Verify connection exists — strangers cannot DM
        $connected = ArenaConnection::where('status', 'accepted')
            ->where(fn ($q) => $q
                ->where('requester_id', $userId)->where('recipient_id', $recipientId)
                ->orWhere(fn ($q2) => $q2->where('requester_id', $recipientId)->where('recipient_id', $userId))
            )->exists();
        if (!$connected) {
            return response()->json(['error' => 'Must be connected to send messages'], 403);
        }
        $msg = ArenaMessage::create([
            'sender_id'    => $userId,
            'recipient_id' => $recipientId,
            'body'         => $request->body,
        ]);
        return response()->json(['message' => $msg], 201);
    }

    public function thread(int $otherUserId): JsonResponse {
        $userId = Auth::id();
        $messages = ArenaMessage::where(
            fn ($q) => $q->where('sender_id', $userId)->where('recipient_id', $otherUserId)
        )->orWhere(
            fn ($q) => $q->where('sender_id', $otherUserId)->where('recipient_id', $userId)
        )->orderBy('created_at')->get();

        // Mark messages from otherUser as read
        ArenaMessage::where('sender_id', $otherUserId)
            ->where('recipient_id', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json($messages);
    }

    public function inbox(): JsonResponse {
        $userId = Auth::id();
        $messages = ArenaMessage::where(
            fn ($q) => $q->where('sender_id', $userId)->orWhere('recipient_id', $userId)
        )->with(['sender:id,name,role', 'recipient:id,name,role'])
         ->orderByDesc('created_at')->get()
         ->groupBy(fn ($m) => $m->sender_id === $userId ? $m->recipient_id : $m->sender_id)
         ->map(fn ($msgs) => $msgs->first());
        return response()->json($messages->values());
    }
}
```

---

## Step 4 — API Routes

> **WARN:** Show Nigel these exact lines before adding them to `routes/api.php`. Add them INSIDE the existing `auth:sanctum` middleware group. Do not create a new group.

Find this in `routes/api.php`:
```php
Route::middleware('auth:sanctum')->group(function () {
    // ... existing routes ...
});
```

Add these lines INSIDE that group — show Nigel the exact insertion point first:

```php
// ── THE ARENA: SOCIAL GRAPH ──────────────────────────────────────────────────
// Follows
Route::post('/arena/follow/{id}',       [ArenaSocialController::class, 'follow']);
Route::get('/arena/followers',           [ArenaSocialController::class, 'followers']);
Route::get('/arena/following',           [ArenaSocialController::class, 'following']);
// Connections
Route::post('/arena/connect/{id}',       [ArenaSocialController::class, 'sendConnection']);
Route::patch('/arena/connect/{id}',      [ArenaSocialController::class, 'respondConnection']);
Route::get('/arena/connections',         [ArenaSocialController::class, 'connections']);
Route::get('/arena/connections/pending', [ArenaSocialController::class, 'pendingConnections']);
// Messages
Route::post('/arena/messages/{id}',      [ArenaSocialController::class, 'sendMessage']);
Route::get('/arena/messages/{id}',       [ArenaSocialController::class, 'thread']);
Route::get('/arena/inbox',               [ArenaSocialController::class, 'inbox']);
// ── END ARENA SPRINT 1 ───────────────────────────────────────────────────────
```

Add this import at the top of `routes/api.php` with the other `use` statements:
```php
use App\Http\Controllers\Api\ArenaSocialController;
```

> **BUILD:** After Nigel approves — add routes, push to GitHub, wait for Render deploy. Test: `GET /api/v1/arena/connections` should return empty array, not 404.

---

## Step 5 — TypeScript Types

### `src/types/arena.ts` — NEW

```typescript
export interface ArenaFollow {
  id: number;
  follower_id: number;
  following_id: number;
  following_type: 'user' | 'club' | 'school';
  created_at: string;
  follower?: ArenaUser;
  following?: ArenaUser;
}

export interface ArenaConnection {
  id: number;
  requester_id: number;
  recipient_id: number;
  status: 'pending' | 'accepted' | 'declined';
  message: string | null;
  accepted_at: string | null;
  created_at: string;
  requester?: ArenaUser;
  recipient?: ArenaUser;
}

export interface ArenaMessage {
  id: number;
  sender_id: number;
  recipient_id: number;
  body: string;
  read_at: string | null;
  created_at: string;
  sender?: ArenaUser;
  recipient?: ArenaUser;
}

export interface ArenaUser {
  id: number;
  name: string;
  role: string;
  sport?: string;
  province?: string;
  thuto_score?: number;
}
```

---

## Step 6 — `/arena/network` Page

> **WARN:** Do not create this page until the backend is confirmed working. Show Nigel the design before building.

### `src/app/arena/network/page.tsx` — NEW

**Design requirements:**

- Background: `#f4f2ee`
- Standard top nav with all hubs visible: Player Hub, Coach Hub, Fan Hub, Analysis Hub, Scout Hub
- Page title: `My Network` — left aligned, forest green `#1a5c2a`
- Four tabs: `Connections` | `Followers` | `Following` | `Pending`
- Pending tab shows a red badge with the count of incoming requests
- Each user card: avatar circle with initials, name, role, sport, province, THUTO score if available
- Connections tab: Message button for each connected user
- Pending tab: Accept and Decline buttons for each incoming request
- Following tab: Unfollow button
- Empty state: `You have no connections yet. Discover athletes to connect with.` with link to `/arena/discover`
- Loading state: 5 skeleton loader rows while fetching
- Mobile responsive at 375px

**API calls:**

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/arena/connections` | Accepted connections |
| GET | `/api/v1/arena/followers` | Who follows me |
| GET | `/api/v1/arena/following` | Who I follow |
| GET | `/api/v1/arena/connections/pending` | Incoming requests |
| PATCH | `/api/v1/arena/connect/{id}` | Accept or decline |

---

## Step 7 — `/arena/messages` Page

> **WARN:** Show Nigel the design before building.

### `src/app/arena/messages/page.tsx` — NEW

**Design requirements:**

- White card on `#f4f2ee` page background
- Two columns inside a rounded white card: left = conversation list (260px fixed), right = message thread (flex-1)
- Left header: `Messages` bold 14px
- Each conversation row: avatar, name, last message preview truncated to 1 line, timestamp, red unread dot
- Active conversation: `#f4f2ee` background highlight
- Right column empty state: `Select a conversation to start messaging`
- Right column thread: header with avatar + name + role, message bubbles, input row at bottom
- Received bubbles: `#f4f2ee` background, left-aligned
- Sent bubbles: `#1a5c2a` forest green background, white text, right-aligned
- Input: text input + Send button in forest green
- Note below list: `Only connected users can message each other`
- Empty inbox state: `You have no messages yet. Connect with athletes and coaches to start a conversation.`
- Mobile at 375px: show only conversation list, tapping opens thread full screen
- Poll `GET /api/v1/arena/inbox` every 30 seconds — same pattern as existing notification bell

**API calls:**

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/arena/inbox` | All conversations with latest message |
| GET | `/api/v1/arena/messages/{id}` | Full thread — also marks as read |
| POST | `/api/v1/arena/messages/{id}` | Send a message |

---

## Step 8 — Sidebar Navigation Update

> **WARN:** The sidebar already exists. Show Nigel the exact lines being added before touching the file. Add lines — do not replace anything.

### `src/components/layout/sidebar.tsx` — EXISTING — add lines only

Find the player navigation section. Add these two items:

```typescript
// Add under player navigation section:
{ href: '/arena/network', label: 'My Network',  icon: Users2,        roles: ['player', 'coach', 'scout'] },
{ href: '/arena/messages', label: 'Messages',    icon: MessageSquare, roles: ['player', 'coach', 'scout', 'fan'] },
```

Check these icons are imported. If not, add them:

```typescript
import { Users2, MessageSquare } from 'lucide-react';
```

---

## Step 9 — Testing Checklist

> **STOP:** Do not mark Sprint 1 complete until every test below passes. Show Nigel the result of each test.

### API Tests

- [ ] `POST /api/v1/arena/follow/{id}` with a valid user ID — returns `{"followed": true}`
- [ ] `POST /api/v1/arena/follow/{id}` again — returns `{"followed": false}` (toggle)
- [ ] `POST /api/v1/arena/follow/{own_id}` — returns 422 `Cannot follow yourself`
- [ ] `GET /api/v1/arena/followers` — returns paginated list
- [ ] `GET /api/v1/arena/following` — returns paginated list
- [ ] `POST /api/v1/arena/connect/{id}` with message — returns 201
- [ ] `POST /api/v1/arena/connect/{same_id}` again — returns 422 `Connection already exists`
- [ ] `PATCH /api/v1/arena/connect/{id}` with `status=accepted` — returns updated connection
- [ ] `GET /api/v1/arena/connections` — returns the accepted connection
- [ ] `GET /api/v1/arena/connections/pending` — shows incoming pending requests
- [ ] `POST /api/v1/arena/messages/{id}` to a non-connected user — returns 403
- [ ] `POST /api/v1/arena/messages/{id}` to a connected user — returns 201
- [ ] `GET /api/v1/arena/messages/{id}` — returns thread and marks messages as read
- [ ] `GET /api/v1/arena/inbox` — returns latest message per conversation

### UI Tests

- [ ] `/arena/network` loads — four tabs visible
- [ ] Pending tab shows count badge with number of requests
- [ ] Accept button calls PATCH and removes request from list
- [ ] Decline button calls PATCH and removes request from list
- [ ] Empty state shows on Connections tab when no connections
- [ ] `/arena/messages` loads — conversation list on left
- [ ] Clicking a conversation loads the thread on the right
- [ ] Send button posts message and appends it immediately
- [ ] Received messages show left-aligned grey bubble
- [ ] Sent messages show right-aligned green bubble

### Regression Tests — Existing Pages Must Not Break

- [ ] `/player` still loads after Sprint 1 changes
- [ ] `/coach` still loads
- [ ] `/scout` still loads
- [ ] `/fan-hub` still loads
- [ ] `/login` still loads

---

## Step 10 — Update CLAUDE.md (same commit as the feature)

> **STOP:** This is mandatory. Update CLAUDE.md in the same commit. Not after. Not separately.

Add to **ALL BUILT ROUTES** section:

```
/arena/network    My Network — connections, followers, following, pending requests
/arena/messages   Direct Messages — inbox and thread view (connected users only)
```

Add to **SESSION LOG** with today's date:

```markdown
### SESSION LOG — [DATE] — Sprint 1: The Arena Social Graph

#### New database tables
- arena_follows — one-way follows (follower_id, following_id, following_type)
- arena_connections — two-way requests (requester_id, recipient_id, status, message, accepted_at)
- arena_messages — direct messages (sender_id, recipient_id, body, read_at)

#### New Laravel files
- app/Models/ArenaFollow.php
- app/Models/ArenaConnection.php
- app/Models/ArenaMessage.php
- app/Http/Controllers/Api/ArenaSocialController.php

#### New API routes (all under auth:sanctum middleware)
- POST   /api/v1/arena/follow/{id}
- GET    /api/v1/arena/followers
- GET    /api/v1/arena/following
- POST   /api/v1/arena/connect/{id}
- PATCH  /api/v1/arena/connect/{id}
- GET    /api/v1/arena/connections
- GET    /api/v1/arena/connections/pending
- POST   /api/v1/arena/messages/{id}
- GET    /api/v1/arena/messages/{id}
- GET    /api/v1/arena/inbox

#### New frontend files
- src/types/arena.ts
- src/app/arena/network/page.tsx
- src/app/arena/messages/page.tsx

#### Modified frontend files
- src/components/layout/sidebar.tsx — added My Network and Messages nav items
```

---

## What Comes Next — Sprint 2 Preview

Do not build Sprint 2 until all 27 tests above pass.

Sprint 2 builds the activity feed — the main `/arena` page:

- New tables: `arena_posts`, `arena_post_likes`, `arena_post_comments`
- New controller: `ArenaFeedController.php`
- New page: `/arena` — main social feed, three-column LinkedIn layout, white background
- Post composer — sport tag, province tag, 280 char limit
- Feed tabs: For you / Following / Connections / My school
- Auto-post hook in `SessionController` — THUTO score improvement fires a milestone post automatically
- Auto-post hook in Football Business School badge handler

---

*Every feature we build must answer: "Does this help a Zimbabwean athlete get recognised?"*
*Train Anywhere in Zimbabwe. Use AI to Get Recognized.*

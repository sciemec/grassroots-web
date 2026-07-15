# GRASSROOTS SPORTS — THE ARENA
## Complete Build Briefing — All 5 Sprints
### Claude Code Master Document

---

> ## READ THIS FIRST — MANDATORY RULES
>
> 1. **Read `CLAUDE.md` fully before touching any file.** The full route list is in CLAUDE.md. Do not rebuild what already exists.
> 2. **Show Nigel every file before creating or editing it.** Wait for approval. One change at a time.
> 3. **Update `CLAUDE.md` in the same commit as the feature.** Not after. Not separately. Same commit.
> 4. **After every change, test these pages still work:** `/player` `/coach` `/scout` `/fan-hub` `/login` `/register`
> 5. **Follow sprint order exactly.** Do not start Sprint 2 until Sprint 1 tests all pass. Same for every sprint.
> 6. **Design:** White background `#f4f2ee` · Forest green `#1a5c2a` · Gold `#c8962a` · No dark backgrounds · No chevron patterns.

---

## Project Context

| Item | Value |
|---|---|
| Project | Grassroots Sports — grassrootssports.live |
| Frontend repo | github.com/sciemec/grassroots-web (Next.js 14, Vercel) |
| Backend repo | github.com/sciemec/bhora-ai (Laravel, Render) |
| API base | `https://bhora-ai.onrender.com/api/v1` |
| Auth | Laravel Sanctum — all Arena routes need `auth:sanctum` middleware |

---

## What The Arena Is

The Arena is a performance-based sports social platform layered on top of everything already built. It does not replace any existing hub. It connects them. When a player logs a session and their THUTO score improves, that appears in a social feed automatically. Scouts online right now are visible. Players can find clubs that match their style. Coaches can post open positions and receive applications. Players can network, message connections, and discover opportunities.

**The Arena adds 5 things. Nothing existing is removed or changed.**

1. Social graph — follow and connect with other users
2. Activity feed — performance-based posts and milestones
3. Club discovery — searchable directory with reviews
4. Talent Wanted board — recruitment and applications
5. Public athlete profiles — visible to scouts and connections

---

## Existing Routes — DO NOT REBUILD THESE

```
/                /login              /register           /dashboard
/player          /player/ai-coach    /player/sessions    /player/sessions/new
/player/drills   /player/nutrition   /player/profile     /player/progress
/player/potential /player/valuation  /player/talent-id   /player/milestones
/player/development /player/assessment /player/sports    /player/subscription
/player/training-formats  /player/verification /player/notifications
/coach           /coach/squad        /coach/squad/[id]   /coach/live-match
/coach/training-plans /coach/tactics /coach/tactical-analysis /coach/set-pieces
/coach/stats     /coach/matches      /coach/notifications /coach/ai-insights
/scout           /scout/shortlist    /scout/compare      /scout/reports
/scout/profile   /fan                /fan/discover       /fan/leaderboard
/fan/following   /admin              /admin/users        /admin/stats
/video-studio    /video-analysis     /injury-tracker     /talent-database
/school-leagues  /analyst            /streaming          /sessions
/tournaments     /notifications      /analytics          /community
```

---

## New Database Tables — All 5 Sprints

Show Nigel every migration before running it.

```
Sprint 1:  arena_follows        arena_connections       arena_messages
Sprint 2:  arena_posts          arena_post_likes        arena_post_comments
Sprint 3:  arena_clubs          arena_club_reviews
Sprint 4:  arena_talent_wanted  arena_applications
Sprint 5:  (no new tables — uses existing + Sprint 1-4 tables)
```

---

## New Routes — All 5 Sprints

```
Sprint 1:  /arena/network        /arena/messages
Sprint 2:  /arena
Sprint 3:  /arena/clubs          /arena/clubs/[id]       /arena/clubs/[id]/review
Sprint 4:  /arena/recruitment    /arena/recruitment/[id] /arena/recruitment/new
           /coach/recruitment
Sprint 5:  /arena/profile/[id]   /arena/notifications    /arena/discover
```

---

---

# SPRINT 1 — SOCIAL GRAPH
## Follows · Connections · Direct Messages
### Estimated time: 1 week

**What this sprint delivers:** Users can follow each other (one-way), send connection requests (two-way), and message connected users directly.

---

## Sprint 1 — Step 1: Database Migrations

### Migration 1 — `arena_follows`

```php
<?php
// FILE: database/migrations/2026_05_18_000001_create_arena_follows_table.php
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
            $table->unique(['follower_id', 'following_id']);
        });
    }
    public function down(): void { Schema::dropIfExists('arena_follows'); }
};
```

### Migration 2 — `arena_connections`

```php
<?php
// FILE: database/migrations/2026_05_18_000002_create_arena_connections_table.php
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
            $table->text('message')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();
            $table->foreign('requester_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('recipient_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['requester_id', 'recipient_id']);
        });
    }
    public function down(): void { Schema::dropIfExists('arena_connections'); }
};
```

### Migration 3 — `arena_messages`

```php
<?php
// FILE: database/migrations/2026_05_18_000003_create_arena_messages_table.php
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
            $table->index(['sender_id', 'recipient_id']);
        });
    }
    public function down(): void { Schema::dropIfExists('arena_messages'); }
};
```

> After Nigel approves all three: `php artisan migrate` on Render. Show Nigel the output.

---

## Sprint 1 — Step 2: Models

### `app/Models/ArenaFollow.php`

```php
<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ArenaFollow extends Model {
    protected $fillable = ['follower_id', 'following_id', 'following_type'];
    public function follower() { return $this->belongsTo(User::class, 'follower_id'); }
    public function following() { return $this->belongsTo(User::class, 'following_id'); }
}
```

### `app/Models/ArenaConnection.php`

```php
<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ArenaConnection extends Model {
    protected $fillable = ['requester_id', 'recipient_id', 'status', 'message', 'accepted_at'];
    protected $casts = ['accepted_at' => 'datetime'];
    public function requester() { return $this->belongsTo(User::class, 'requester_id'); }
    public function recipient() { return $this->belongsTo(User::class, 'recipient_id'); }
    public function isAccepted(): bool { return $this->status === 'accepted'; }
}
```

### `app/Models/ArenaMessage.php`

```php
<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ArenaMessage extends Model {
    protected $fillable = ['sender_id', 'recipient_id', 'body', 'read_at'];
    protected $casts = ['read_at' => 'datetime'];
    public function sender() { return $this->belongsTo(User::class, 'sender_id'); }
    public function recipient() { return $this->belongsTo(User::class, 'recipient_id'); }
    public function isUnread(): bool { return $this->read_at === null; }
}
```

---

## Sprint 1 — Step 3: ArenaSocialController

### `app/Http/Controllers/Api/ArenaSocialController.php` — NEW FILE

```php
<?php namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{ArenaFollow, ArenaConnection, ArenaMessage, User};
use Illuminate\Http\{Request, JsonResponse};
use Illuminate\Support\Facades\Auth;

class ArenaSocialController extends Controller {

    // ── FOLLOWS ──────────────────────────────────────────────────────────────

    public function follow(int $id): JsonResponse {
        $user = Auth::user();
        if ($user->id === $id) return response()->json(['error' => 'Cannot follow yourself'], 422);
        $existing = ArenaFollow::where('follower_id', $user->id)->where('following_id', $id)->first();
        if ($existing) { $existing->delete(); return response()->json(['followed' => false]); }
        ArenaFollow::create(['follower_id' => $user->id, 'following_id' => $id]);
        return response()->json(['followed' => true]);
    }

    public function followers(): JsonResponse {
        return response()->json(
            ArenaFollow::where('following_id', Auth::id())
                ->with('follower:id,name,role,sport,province')->latest()->paginate(20)
        );
    }

    public function following(): JsonResponse {
        return response()->json(
            ArenaFollow::where('follower_id', Auth::id())
                ->with('following:id,name,role,sport,province')->latest()->paginate(20)
        );
    }

    // ── CONNECTIONS ───────────────────────────────────────────────────────────

    public function sendConnection(int $id, Request $request): JsonResponse {
        $user = Auth::user();
        if ($user->id === $id) return response()->json(['error' => 'Cannot connect with yourself'], 422);
        $exists = ArenaConnection::where(fn($q) => $q->where('requester_id', $user->id)->where('recipient_id', $id))
            ->orWhere(fn($q) => $q->where('requester_id', $id)->where('recipient_id', $user->id))->exists();
        if ($exists) return response()->json(['error' => 'Connection already exists'], 422);
        $conn = ArenaConnection::create([
            'requester_id' => $user->id, 'recipient_id' => $id,
            'message' => $request->input('message'), 'status' => 'pending',
        ]);
        return response()->json(['connection' => $conn], 201);
    }

    public function respondConnection(int $id, Request $request): JsonResponse {
        $request->validate(['status' => 'required|in:accepted,declined']);
        $conn = ArenaConnection::where('id', $id)->where('recipient_id', Auth::id())
            ->where('status', 'pending')->firstOrFail();
        $conn->update([
            'status' => $request->status,
            'accepted_at' => $request->status === 'accepted' ? now() : null,
        ]);
        return response()->json(['connection' => $conn]);
    }

    public function connections(): JsonResponse {
        $uid = Auth::id();
        return response()->json(
            ArenaConnection::where('status', 'accepted')
                ->where(fn($q) => $q->where('requester_id', $uid)->orWhere('recipient_id', $uid))
                ->with(['requester:id,name,role,sport,province', 'recipient:id,name,role,sport,province'])
                ->latest('accepted_at')->paginate(20)
        );
    }

    public function pendingConnections(): JsonResponse {
        return response()->json(
            ArenaConnection::where('recipient_id', Auth::id())->where('status', 'pending')
                ->with('requester:id,name,role,sport,province,thuto_score')->latest()->get()
        );
    }

    // ── MESSAGES ──────────────────────────────────────────────────────────────

    public function sendMessage(int $recipientId, Request $request): JsonResponse {
        $request->validate(['body' => 'required|string|max:1000']);
        $uid = Auth::id();
        $connected = ArenaConnection::where('status', 'accepted')->where(
            fn($q) => $q->where(fn($q2) => $q2->where('requester_id', $uid)->where('recipient_id', $recipientId))
                ->orWhere(fn($q2) => $q2->where('requester_id', $recipientId)->where('recipient_id', $uid))
        )->exists();
        if (!$connected) return response()->json(['error' => 'Must be connected to send messages'], 403);
        $msg = ArenaMessage::create(['sender_id' => $uid, 'recipient_id' => $recipientId, 'body' => $request->body]);
        return response()->json(['message' => $msg], 201);
    }

    public function thread(int $otherUserId): JsonResponse {
        $uid = Auth::id();
        $messages = ArenaMessage::where(
            fn($q) => $q->where('sender_id', $uid)->where('recipient_id', $otherUserId)
        )->orWhere(
            fn($q) => $q->where('sender_id', $otherUserId)->where('recipient_id', $uid)
        )->orderBy('created_at')->get();
        ArenaMessage::where('sender_id', $otherUserId)->where('recipient_id', $uid)
            ->whereNull('read_at')->update(['read_at' => now()]);
        return response()->json($messages);
    }

    public function inbox(): JsonResponse {
        $uid = Auth::id();
        $messages = ArenaMessage::where(fn($q) => $q->where('sender_id', $uid)->orWhere('recipient_id', $uid))
            ->with(['sender:id,name,role', 'recipient:id,name,role'])
            ->orderByDesc('created_at')->get()
            ->groupBy(fn($m) => $m->sender_id === $uid ? $m->recipient_id : $m->sender_id)
            ->map(fn($msgs) => $msgs->first());
        return response()->json($messages->values());
    }
}
```

---

## Sprint 1 — Step 4: API Routes

Add these inside the existing `auth:sanctum` middleware group in `routes/api.php`. Show Nigel first.

```php
// ── THE ARENA: SPRINT 1 — SOCIAL GRAPH ──────────────────────────────────────
Route::post('/arena/follow/{id}',        [ArenaSocialController::class, 'follow']);
Route::get('/arena/followers',           [ArenaSocialController::class, 'followers']);
Route::get('/arena/following',           [ArenaSocialController::class, 'following']);
Route::post('/arena/connect/{id}',       [ArenaSocialController::class, 'sendConnection']);
Route::patch('/arena/connect/{id}',      [ArenaSocialController::class, 'respondConnection']);
Route::get('/arena/connections',         [ArenaSocialController::class, 'connections']);
Route::get('/arena/connections/pending', [ArenaSocialController::class, 'pendingConnections']);
Route::post('/arena/messages/{id}',      [ArenaSocialController::class, 'sendMessage']);
Route::get('/arena/messages/{id}',       [ArenaSocialController::class, 'thread']);
Route::get('/arena/inbox',              [ArenaSocialController::class, 'inbox']);
// ── END SPRINT 1 ────────────────────────────────────────────────────────────
```

Add import at top of `routes/api.php`:
```php
use App\Http\Controllers\Api\ArenaSocialController;
```

---

## Sprint 1 — Step 5: TypeScript Types

### `src/types/arena.ts` — NEW FILE

```typescript
export interface ArenaUser {
  id: number; name: string; role: string;
  sport?: string; province?: string; thuto_score?: number;
}
export interface ArenaFollow {
  id: number; follower_id: number; following_id: number;
  following_type: 'user' | 'club' | 'school'; created_at: string;
  follower?: ArenaUser; following?: ArenaUser;
}
export interface ArenaConnection {
  id: number; requester_id: number; recipient_id: number;
  status: 'pending' | 'accepted' | 'declined';
  message: string | null; accepted_at: string | null; created_at: string;
  requester?: ArenaUser; recipient?: ArenaUser;
}
export interface ArenaMessage {
  id: number; sender_id: number; recipient_id: number;
  body: string; read_at: string | null; created_at: string;
  sender?: ArenaUser; recipient?: ArenaUser;
}
export interface ArenaPost {
  id: number; user_id: number; post_type: string; body: string | null;
  sport: string | null; province: string | null; metadata: object | null;
  fan_hub_video_id: number | null; is_auto: boolean;
  like_count: number; comment_count: number; created_at: string;
  user?: ArenaUser;
}
export interface ArenaClub {
  id: number; name: string; sport: string; province: string;
  district?: string; tier?: string; formation?: string; playing_style?: string;
  coach_id?: number; is_scouting: boolean; is_open_trials: boolean;
  avg_thuto_score?: number; follower_count: number; created_at: string;
}
export interface ArenaTalentWanted {
  id: number; club_id: number; posted_by: number; sport: string;
  position: string; age_min: number; age_max: number; thuto_min: number;
  province?: string; style_of_play?: string; stipend: boolean;
  description: string; status: 'open' | 'closed'; closes_at?: string;
  created_at: string; club?: ArenaClub;
}
```

---

## Sprint 1 — Step 6: `/arena/network` Page

### `src/app/arena/network/page.tsx` — NEW FILE

Design spec:
- Background `#f4f2ee`, cards white
- Standard nav with all hubs visible
- Four tabs: `Connections` | `Followers` | `Following` | `Pending` (red badge with count)
- Each user card: avatar initials circle, name, role, sport, province, THUTO score
- Connections: Message button linking to `/arena/messages`
- Pending: Accept + Decline buttons calling `PATCH /api/v1/arena/connect/{id}`
- Following: Unfollow button calling `POST /api/v1/arena/follow/{id}`
- Empty state: "You have no connections yet." + link to `/arena/discover`
- 5 skeleton loader rows while fetching
- Mobile responsive at 375px

API calls:
```
GET  /api/v1/arena/connections         — accepted connections
GET  /api/v1/arena/followers           — who follows me
GET  /api/v1/arena/following           — who I follow
GET  /api/v1/arena/connections/pending — incoming requests
PATCH /api/v1/arena/connect/{id}       — accept or decline { status: 'accepted'|'declined' }
```

---

## Sprint 1 — Step 7: `/arena/messages` Page

### `src/app/arena/messages/page.tsx` — NEW FILE

Design spec:
- White card on `#f4f2ee` background
- Two columns: conversation list left (260px), thread right (flex-1)
- Conversation row: avatar, name, last message preview (1 line truncated), timestamp, red unread dot
- Active conversation: `#f4f2ee` highlight
- Thread: header (avatar + name + role), bubbles, input row
- Received bubbles: `#f4f2ee` bg, left-aligned
- Sent bubbles: `#1a5c2a` green bg, white text, right-aligned
- Input: text + Send button (green)
- Poll inbox every 30 seconds for new messages
- Note: "Only connected users can message each other"
- Mobile: show list only, tap to open thread full screen

API calls:
```
GET  /api/v1/arena/inbox         — all conversations with latest message
GET  /api/v1/arena/messages/{id} — full thread (also marks as read)
POST /api/v1/arena/messages/{id} — send { body: string }
```

---

## Sprint 1 — Step 8: Sidebar Update

File: `src/components/layout/sidebar.tsx` — ADD ONLY, do not replace

```typescript
// Add under player navigation section:
{ href: '/arena/network',  label: 'My Network', icon: Users2,        roles: ['player','coach','scout'] },
{ href: '/arena/messages', label: 'Messages',   icon: MessageSquare, roles: ['player','coach','scout','fan'] },
```

Add imports if missing:
```typescript
import { Users2, MessageSquare } from 'lucide-react';
```

---

## Sprint 1 — Tests (all must pass before Sprint 2)

- [ ] `POST /api/v1/arena/follow/{id}` → returns `{followed: true}`
- [ ] `POST /api/v1/arena/follow/{id}` again → returns `{followed: false}` (toggle)
- [ ] `POST /api/v1/arena/follow/{own_id}` → 422 error
- [ ] `GET /api/v1/arena/followers` → paginated list
- [ ] `GET /api/v1/arena/following` → paginated list
- [ ] `POST /api/v1/arena/connect/{id}` with message → 201
- [ ] `POST /api/v1/arena/connect/{id}` again → 422
- [ ] `PATCH /api/v1/arena/connect/{id}` status=accepted → updated connection
- [ ] `GET /api/v1/arena/connections` → accepted connections
- [ ] `GET /api/v1/arena/connections/pending` → pending requests
- [ ] `POST /api/v1/arena/messages/{id}` to non-connected user → 403
- [ ] `POST /api/v1/arena/messages/{id}` to connected user → 201
- [ ] `GET /api/v1/arena/messages/{id}` → thread returned, messages marked read
- [ ] `GET /api/v1/arena/inbox` → latest message per conversation
- [ ] `/arena/network` loads, four tabs visible
- [ ] Pending tab shows red badge with count
- [ ] Accept/Decline buttons work
- [ ] `/arena/messages` loads, conversation list shows
- [ ] Clicking conversation shows thread
- [ ] Sending message appends to thread immediately
- [ ] Green/grey bubble colours correct
- [ ] `/player` still loads ✓
- [ ] `/coach` still loads ✓
- [ ] `/scout` still loads ✓
- [ ] `/fan-hub` still loads ✓
- [ ] `/login` still loads ✓

---

## Sprint 1 — CLAUDE.md Update (same commit)

Add to ALL BUILT ROUTES:
```
/arena/network    My Network — connections, followers, following, pending
/arena/messages   Direct Messages — inbox and thread (connected users only)
```

Add to SESSION LOG:
```
### Sprint 1 — The Arena Social Graph — [DATE]
New tables: arena_follows, arena_connections, arena_messages
New models: ArenaFollow, ArenaConnection, ArenaMessage
New controller: ArenaSocialController.php
New routes: POST/GET arena/follow, connect, connections, messages, inbox
New pages: /arena/network, /arena/messages
New file: src/types/arena.ts
Modified: src/components/layout/sidebar.tsx
```

---

---

# SPRINT 2 — THE ACTIVITY FEED
## The main /arena page — what players see every day
### Estimated time: 1 week

**Dependency:** Sprint 1 must be fully tested and merged before starting Sprint 2.

---

## Sprint 2 — Step 1: Database Migrations

### Migration 4 — `arena_posts`

```php
<?php
// FILE: database/migrations/2026_05_25_000001_create_arena_posts_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('arena_posts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->enum('post_type', [
                'session_milestone', 'badge', 'prediction_upgrade',
                'scout_view', 'manual', 'video', 'talent_wanted'
            ]);
            $table->text('body')->nullable();
            $table->string('sport', 50)->nullable();
            $table->string('province', 50)->nullable();
            $table->json('metadata')->nullable(); // score_before, score_after, badge_name, etc.
            $table->unsignedBigInteger('fan_hub_video_id')->nullable();
            $table->boolean('is_auto')->default(false);
            $table->unsignedInteger('like_count')->default(0);
            $table->unsignedInteger('comment_count')->default(0);
            $table->timestamps();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['user_id', 'created_at']);
        });
    }
    public function down(): void { Schema::dropIfExists('arena_posts'); }
};
```

### Migration 5 — `arena_post_likes`

```php
<?php
// FILE: database/migrations/2026_05_25_000002_create_arena_post_likes_table.php
return new class extends Migration {
    public function up(): void {
        Schema::create('arena_post_likes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('post_id');
            $table->unsignedBigInteger('user_id');
            $table->timestamps();
            $table->foreign('post_id')->references('id')->on('arena_posts')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['post_id', 'user_id']);
        });
    }
    public function down(): void { Schema::dropIfExists('arena_post_likes'); }
};
```

### Migration 6 — `arena_post_comments`

```php
<?php
// FILE: database/migrations/2026_05_25_000003_create_arena_post_comments_table.php
return new class extends Migration {
    public function up(): void {
        Schema::create('arena_post_comments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('post_id');
            $table->unsignedBigInteger('user_id');
            $table->text('body'); // max 280 chars — enforce in validator
            $table->timestamps();
            $table->foreign('post_id')->references('id')->on('arena_posts')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }
    public function down(): void { Schema::dropIfExists('arena_post_comments'); }
};
```

---

## Sprint 2 — Step 2: ArenaPost Model

### `app/Models/ArenaPost.php`

```php
<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ArenaPost extends Model {
    protected $fillable = [
        'user_id', 'post_type', 'body', 'sport', 'province',
        'metadata', 'fan_hub_video_id', 'is_auto', 'like_count', 'comment_count'
    ];
    protected $casts = ['metadata' => 'array', 'is_auto' => 'boolean'];
    public function user() { return $this->belongsTo(User::class); }
    public function likes() { return $this->hasMany(ArenaPostLike::class, 'post_id'); }
    public function comments() { return $this->hasMany(ArenaPostComment::class, 'post_id'); }
}
```

### `app/Models/ArenaPostLike.php`

```php
<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class ArenaPostLike extends Model {
    protected $fillable = ['post_id', 'user_id'];
    public function post() { return $this->belongsTo(ArenaPost::class, 'post_id'); }
    public function user() { return $this->belongsTo(User::class); }
}
```

### `app/Models/ArenaPostComment.php`

```php
<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class ArenaPostComment extends Model {
    protected $fillable = ['post_id', 'user_id', 'body'];
    public function post() { return $this->belongsTo(ArenaPost::class, 'post_id'); }
    public function user() { return $this->belongsTo(User::class); }
}
```

---

## Sprint 2 — Step 3: ArenaFeedController

### `app/Http/Controllers/Api/ArenaFeedController.php` — NEW FILE

```php
<?php namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{ArenaPost, ArenaPostLike, ArenaPostComment, ArenaFollow, ArenaConnection};
use Illuminate\Http\{Request, JsonResponse};
use Illuminate\Support\Facades\Auth;

class ArenaFeedController extends Controller {

    public function index(Request $request): JsonResponse {
        $uid = Auth::id();
        // Get IDs of users this person follows
        $followingIds = ArenaFollow::where('follower_id', $uid)->pluck('following_id');
        // Get IDs of connections
        $connectionIds = ArenaConnection::where('status', 'accepted')
            ->where(fn($q) => $q->where('requester_id', $uid)->orWhere('recipient_id', $uid))
            ->get()->map(fn($c) => $c->requester_id === $uid ? $c->recipient_id : $c->requester_id);

        $tab = $request->input('tab', 'for_you'); // for_you | following | connections | school
        $query = ArenaPost::with('user');

        if ($tab === 'following') {
            $query->whereIn('user_id', $followingIds);
        } elseif ($tab === 'connections') {
            $query->whereIn('user_id', $connectionIds);
        } elseif ($tab === 'school') {
            // Posts from users at same school — based on province match for now
            $user = Auth::user();
            $query->whereHas('user', fn($q) => $q->where('province', $user->province));
        } else {
            // For you — own posts + following + connections, ordered by priority
            $allIds = $followingIds->merge($connectionIds)->push($uid)->unique();
            $query->whereIn('user_id', $allIds);
        }

        $posts = $query->orderByDesc('created_at')->paginate(20);
        return response()->json($posts);
    }

    public function store(Request $request): JsonResponse {
        $request->validate([
            'post_type' => 'required|in:manual,video,talent_wanted',
            'body'      => 'nullable|string|max:280',
            'sport'     => 'nullable|string|max:50',
            'province'  => 'nullable|string|max:50',
        ]);
        $post = ArenaPost::create(array_merge($request->only('post_type','body','sport','province'), [
            'user_id' => Auth::id(), 'is_auto' => false,
        ]));
        return response()->json(['post' => $post->load('user')], 201);
    }

    public function like(int $id): JsonResponse {
        $uid = Auth::id();
        $post = ArenaPost::findOrFail($id);
        $existing = ArenaPostLike::where('post_id', $id)->where('user_id', $uid)->first();
        if ($existing) {
            $existing->delete();
            $post->decrement('like_count');
            return response()->json(['liked' => false, 'like_count' => $post->fresh()->like_count]);
        }
        ArenaPostLike::create(['post_id' => $id, 'user_id' => $uid]);
        $post->increment('like_count');
        return response()->json(['liked' => true, 'like_count' => $post->fresh()->like_count]);
    }

    public function comment(int $id, Request $request): JsonResponse {
        $request->validate(['body' => 'required|string|max:280']);
        $post = ArenaPost::findOrFail($id);
        $comment = ArenaPostComment::create(['post_id' => $id, 'user_id' => Auth::id(), 'body' => $request->body]);
        $post->increment('comment_count');
        return response()->json(['comment' => $comment->load('user')], 201);
    }

    public function destroy(int $id): JsonResponse {
        $post = ArenaPost::where('id', $id)->where('user_id', Auth::id())->firstOrFail();
        $post->delete();
        return response()->json(['deleted' => true]);
    }

    /**
     * Auto-post — called internally by other controllers.
     * Wrap in try/catch so it never breaks the primary action.
     *
     * Usage:
     *   try { ArenaFeedController::autoPost('session_milestone', $userId, ['score_before'=>78,'score_after'=>84]); }
     *   catch (\Throwable) {}
     */
    public static function autoPost(string $type, int $userId, array $metadata = []): void {
        ArenaPost::create([
            'user_id'   => $userId,
            'post_type' => $type,
            'is_auto'   => true,
            'metadata'  => $metadata,
        ]);
    }
}
```

---

## Sprint 2 — Step 4: API Routes

Add inside `auth:sanctum` group in `routes/api.php`:

```php
// ── THE ARENA: SPRINT 2 — FEED ───────────────────────────────────────────────
Route::get('/arena/feed',                [ArenaFeedController::class, 'index']);
Route::post('/arena/posts',              [ArenaFeedController::class, 'store']);
Route::post('/arena/posts/{id}/like',    [ArenaFeedController::class, 'like']);
Route::post('/arena/posts/{id}/comment', [ArenaFeedController::class, 'comment']);
Route::delete('/arena/posts/{id}',       [ArenaFeedController::class, 'destroy']);
// ── END SPRINT 2 ─────────────────────────────────────────────────────────────
```

Add import:
```php
use App\Http\Controllers\Api\ArenaFeedController;
```

---

## Sprint 2 — Step 5: Auto-Post Hooks

> **WARN:** Before modifying any existing controller, show Nigel the exact lines being added. Wrap every auto-post call in try/catch so it NEVER breaks the primary action.

### Hook 1 — Session logged and THUTO score improves

Find `SessionController.php` in the bhora-ai repo. After the session is saved and THUTO score is updated, add:

```php
// After session saved and new_thuto_score > old_thuto_score:
try {
    \App\Http\Controllers\Api\ArenaFeedController::autoPost('session_milestone', $player->id, [
        'score_before' => $oldScore,
        'score_after'  => $newScore,
        'session_type' => $session->type,
    ]);
} catch (\Throwable $e) {
    // Auto-post failure must never break session saving
    \Log::warning('Arena auto-post failed: ' . $e->getMessage());
}
```

### Hook 2 — Football Business School badge earned

Find the badge completion handler. After badge is awarded:

```php
try {
    \App\Http\Controllers\Api\ArenaFeedController::autoPost('badge', $player->id, [
        'badge_name' => $badgeName,
        'track_name' => $trackName,
    ]);
} catch (\Throwable $e) {
    \Log::warning('Arena badge post failed: ' . $e->getMessage());
}
```

### Hook 3 — THUTO Prediction level upgrades

Find `TalentPredictionService.php`. After prediction is saved and level has changed:

```php
try {
    \App\Http\Controllers\Api\ArenaFeedController::autoPost('prediction_upgrade', $player->id, [
        'old_level' => $oldLevel,
        'new_level' => $newLevel,
        'comparable_player' => $comparable,
    ]);
} catch (\Throwable $e) {
    \Log::warning('Arena prediction post failed: ' . $e->getMessage());
}
```

---

## Sprint 2 — Step 6: `/arena` Main Feed Page

### `src/app/arena/page.tsx` — NEW FILE

Design spec (LinkedIn layout, white and forest green):
- Background `#f4f2ee`
- Three columns: left sidebar 210px · center feed flex-1 · right sidebar 250px
- **Left column:** Profile card (avatar, name, role, sport, THUTO score, followers, connections, scout views, prediction, Upgrade button) + navigation menu (My Feed, Notifications, Messages, My Network, Train Now, Success Engine, My Prediction, Find a Club, Talent Wanted, Discover Athletes, Fan Hub, Leaderboard)
- **Center column:** Post composer (avatar + text input + Clip/Photo/Session/Goal buttons) · Feed tabs (For you / Following / Connections / My school) · Post list from `GET /api/v1/arena/feed`
- **Right column:** Scouts online now · Top 50 leaderboard · Trending hashtags · People you may know
- **Post types rendered differently:**
  - `session_milestone` → green `#1a5c2a` card, score before→after arrow, emoji
  - `badge` → card with badge icon and track name
  - `prediction_upgrade` → gold `#c8962a` card with old→new level
  - `talent_wanted` → bordered card with Apply button (links to `/arena/recruitment/{id}`)
  - `manual` / `video` → standard white card
- Like and comment counts update optimistically (update UI immediately, confirm from server)
- Infinite scroll — load next page when user reaches bottom
- Mobile responsive — single column at 375px, sidebar hidden

API calls:
```
GET  /api/v1/arena/feed?tab=for_you&page=1  — paginated feed
POST /api/v1/arena/posts                     — create manual post
POST /api/v1/arena/posts/{id}/like           — toggle like
POST /api/v1/arena/posts/{id}/comment        — add comment
```

---

## Sprint 2 — Tests (all must pass before Sprint 3)

- [ ] `GET /api/v1/arena/feed` returns paginated posts
- [ ] `POST /api/v1/arena/posts` creates a manual post
- [ ] `POST /api/v1/arena/posts/{id}/like` toggles like count
- [ ] `POST /api/v1/arena/posts/{id}/comment` adds comment
- [ ] `/arena` page loads with three-column layout
- [ ] Feed tabs switch between For you / Following / Connections / My school
- [ ] Post composer sends a post and it appears in feed
- [ ] Logging a session that improves THUTO score → milestone post appears in feed automatically
- [ ] Completing a Football Business School track → badge post appears automatically
- [ ] All Sprint 1 tests still pass ✓
- [ ] All existing pages still load ✓

---

## Sprint 2 — CLAUDE.md Update (same commit)

```
/arena    Main social feed — LinkedIn layout, three columns, performance-based
```

---

---

# SPRINT 3 — CLUB DISCOVERY
## Searchable club directory with player reviews
### Estimated time: 1 week

**Dependency:** Sprint 2 must be fully tested and merged.

---

## Sprint 3 — Step 1: Database Migrations

### Migration 7 — `arena_clubs`

```php
<?php
// FILE: database/migrations/2026_06_01_000001_create_arena_clubs_table.php
return new class extends Migration {
    public function up(): void {
        Schema::create('arena_clubs', function (Blueprint $table) {
            $table->id();
            $table->string('name', 200);
            $table->string('sport', 50);
            $table->string('province', 50);
            $table->string('district', 100)->nullable();
            $table->string('tier', 50)->nullable(); // PSL | Division One | School | Amateur
            $table->string('formation', 20)->nullable();
            $table->string('playing_style', 100)->nullable();
            $table->unsignedBigInteger('coach_id')->nullable();
            $table->boolean('is_scouting')->default(false);
            $table->boolean('is_open_trials')->default(false);
            $table->decimal('avg_thuto_score', 5, 2)->nullable();
            $table->unsignedInteger('follower_count')->default(0);
            $table->timestamps();
            $table->foreign('coach_id')->references('id')->on('users')->onDelete('set null');
        });
    }
    public function down(): void { Schema::dropIfExists('arena_clubs'); }
};
```

### Migration 8 — `arena_club_reviews`

```php
<?php
// FILE: database/migrations/2026_06_01_000002_create_arena_club_reviews_table.php
return new class extends Migration {
    public function up(): void {
        Schema::create('arena_club_reviews', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('club_id');
            $table->unsignedBigInteger('reviewer_id');
            $table->tinyInteger('rating_overall');      // 1-5
            $table->tinyInteger('rating_training');     // 1-5
            $table->tinyInteger('rating_coach');        // 1-5
            $table->tinyInteger('rating_facilities');   // 1-5
            $table->text('comment')->nullable();        // max 200 chars
            $table->timestamps();
            $table->foreign('club_id')->references('id')->on('arena_clubs')->onDelete('cascade');
            $table->foreign('reviewer_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['club_id', 'reviewer_id']); // one review per player per club
        });
    }
    public function down(): void { Schema::dropIfExists('arena_club_reviews'); }
};
```

---

## Sprint 3 — Step 2: Models

### `app/Models/ArenaClub.php`

```php
<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ArenaClub extends Model {
    protected $fillable = [
        'name','sport','province','district','tier','formation',
        'playing_style','coach_id','is_scouting','is_open_trials',
        'avg_thuto_score','follower_count'
    ];
    protected $casts = ['is_scouting' => 'boolean', 'is_open_trials' => 'boolean'];
    public function coach() { return $this->belongsTo(User::class, 'coach_id'); }
    public function reviews() { return $this->hasMany(ArenaClubReview::class, 'club_id'); }
    public function talentWanted() { return $this->hasMany(ArenaTalentWanted::class, 'club_id'); }
}
```

### `app/Models/ArenaClubReview.php`

```php
<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ArenaClubReview extends Model {
    protected $fillable = [
        'club_id','reviewer_id','rating_overall','rating_training',
        'rating_coach','rating_facilities','comment'
    ];
    public function club() { return $this->belongsTo(ArenaClub::class, 'club_id'); }
    public function reviewer() { return $this->belongsTo(User::class, 'reviewer_id'); }
}
```

---

## Sprint 3 — Step 3: ArenaClubController

### `app/Http/Controllers/Api/ArenaClubController.php` — NEW FILE

```php
<?php namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{ArenaClub, ArenaClubReview, ArenaFollow};
use Illuminate\Http\{Request, JsonResponse};
use Illuminate\Support\Facades\Auth;

class ArenaClubController extends Controller {

    public function index(Request $request): JsonResponse {
        $query = ArenaClub::with('coach:id,name');
        if ($request->sport)         $query->where('sport', $request->sport);
        if ($request->province)      $query->where('province', $request->province);
        if ($request->formation)     $query->where('formation', $request->formation);
        if ($request->playing_style) $query->where('playing_style', $request->playing_style);
        if ($request->tier)          $query->where('tier', $request->tier);
        if ($request->open_trials)   $query->where('is_open_trials', true);
        if ($request->scouting)      $query->where('is_scouting', true);
        return response()->json($query->orderByDesc('avg_thuto_score')->paginate(20));
    }

    public function show(int $id): JsonResponse {
        $club = ArenaClub::with(['coach:id,name,role', 'reviews.reviewer:id,name'])
            ->withCount(['reviews'])
            ->withAvg('reviews', 'rating_overall')
            ->findOrFail($id);
        return response()->json($club);
    }

    public function store(Request $request): JsonResponse {
        $request->validate([
            'name' => 'required|string|max:200', 'sport' => 'required|string',
            'province' => 'required|string',
        ]);
        $club = ArenaClub::create(array_merge($request->all(), ['coach_id' => Auth::id()]));
        return response()->json(['club' => $club], 201);
    }

    public function update(int $id, Request $request): JsonResponse {
        $club = ArenaClub::where('id', $id)->where('coach_id', Auth::id())->firstOrFail();
        $club->update($request->all());
        return response()->json(['club' => $club]);
    }

    public function review(int $id, Request $request): JsonResponse {
        $request->validate([
            'rating_overall'    => 'required|integer|min:1|max:5',
            'rating_training'   => 'required|integer|min:1|max:5',
            'rating_coach'      => 'required|integer|min:1|max:5',
            'rating_facilities' => 'required|integer|min:1|max:5',
            'comment'           => 'nullable|string|max:200',
        ]);
        $review = ArenaClubReview::updateOrCreate(
            ['club_id' => $id, 'reviewer_id' => Auth::id()],
            $request->only('rating_overall','rating_training','rating_coach','rating_facilities','comment')
        );
        // Recalculate avg_thuto_score for the club
        $avg = ArenaClubReview::where('club_id', $id)->avg('rating_overall');
        ArenaClub::where('id', $id)->update(['avg_thuto_score' => $avg]);
        return response()->json(['review' => $review], 201);
    }

    public function reviews(int $id): JsonResponse {
        $reviews = ArenaClubReview::where('club_id', $id)
            ->select(['id','club_id','rating_overall','rating_training','rating_coach','rating_facilities','comment','created_at'])
            // Deliberately exclude reviewer_id — anonymous
            ->latest()->get();
        $avg = $reviews->avg('rating_overall');
        return response()->json(['reviews' => $reviews, 'average' => round($avg, 1), 'count' => $reviews->count()]);
    }

    public function follow(int $id, Request $request): JsonResponse {
        $uid = Auth::id();
        $existing = ArenaFollow::where('follower_id', $uid)->where('following_id', $id)
            ->where('following_type', 'club')->first();
        if ($existing) {
            $existing->delete();
            ArenaClub::where('id', $id)->decrement('follower_count');
            return response()->json(['followed' => false]);
        }
        ArenaFollow::create(['follower_id' => $uid, 'following_id' => $id, 'following_type' => 'club']);
        ArenaClub::where('id', $id)->increment('follower_count');
        return response()->json(['followed' => true]);
    }
}
```

---

## Sprint 3 — Step 4: API Routes

```php
// ── THE ARENA: SPRINT 3 — CLUB DISCOVERY ────────────────────────────────────
Route::get('/arena/clubs',              [ArenaClubController::class, 'index']);
Route::post('/arena/clubs',             [ArenaClubController::class, 'store']);
Route::get('/arena/clubs/{id}',         [ArenaClubController::class, 'show']);
Route::patch('/arena/clubs/{id}',       [ArenaClubController::class, 'update']);
Route::post('/arena/clubs/{id}/review', [ArenaClubController::class, 'review']);
Route::get('/arena/clubs/{id}/reviews', [ArenaClubController::class, 'reviews']);
Route::post('/arena/clubs/{id}/follow', [ArenaClubController::class, 'follow']);
// ── END SPRINT 3 ─────────────────────────────────────────────────────────────
```

Import: `use App\Http\Controllers\Api\ArenaClubController;`

---

## Sprint 3 — Step 5: Frontend Pages

### `/arena/clubs` — Club directory page

Design spec:
- Filter bar: Sport · Province · Formation · Playing style · Tier · Open trials toggle · Scouting toggle
- Club cards in a grid: club name, sport, province, tier, formation, playing style, avg rating stars, follower count, follow button
- Clicking a card goes to `/arena/clubs/[id]`
- Empty state if no clubs match filters

### `/arena/clubs/[id]` — Individual club page

Design spec:
- Green banner with club logo placeholder, Follow button, Contact Coach button
- Club name, sport, province, tier, formation, playing style tags
- Four stat boxes: Squad players, Avg THUTO score, Review rating, Followers
- Left column: Top players list (linked to `/arena/profile/[id]`) + Open positions (linked to Talent Wanted)
- Right column: Anonymous player reviews with star ratings + Write a review button
- Recent club activity (pulled from arena_posts where user_id is in club's player list)

### `/arena/clubs/[id]/review` — Review form

Design spec:
- Four rating fields (1-5 stars each): Overall · Training quality · Coach availability · Facilities
- Optional comment field (200 char limit)
- Submit calls `POST /api/v1/arena/clubs/{id}/review`
- After submit: redirect back to club page with success message

---

## Sprint 3 — Tests

- [ ] `GET /api/v1/arena/clubs` returns clubs
- [ ] `GET /api/v1/arena/clubs?sport=football&province=Harare` filters correctly
- [ ] `POST /api/v1/arena/clubs` creates a club (coach auth required)
- [ ] `GET /api/v1/arena/clubs/{id}` returns club with reviews and coach
- [ ] `POST /api/v1/arena/clubs/{id}/review` creates a review
- [ ] `GET /api/v1/arena/clubs/{id}/reviews` returns reviews (no reviewer_id exposed — anonymous)
- [ ] `POST /api/v1/arena/clubs/{id}/follow` toggles follow
- [ ] `/arena/clubs` loads with filters
- [ ] Filtering by sport and province works in the UI
- [ ] `/arena/clubs/[id]` loads with squad, reviews, open positions
- [ ] Review form submits and review appears on club page
- [ ] All previous sprint tests still pass ✓

---

---

# SPRINT 4 — TALENT WANTED BOARD
## Recruitment · Applications · THUTO Auto-Match
### Estimated time: 1 week

**Dependency:** Sprint 3 must be fully tested and merged.

---

## Sprint 4 — Step 1: Database Migrations

### Migration 9 — `arena_talent_wanted`

```php
<?php
// FILE: database/migrations/2026_06_08_000001_create_arena_talent_wanted_table.php
return new class extends Migration {
    public function up(): void {
        Schema::create('arena_talent_wanted', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('club_id');
            $table->unsignedBigInteger('posted_by');
            $table->string('sport', 50);
            $table->string('position', 50);
            $table->tinyInteger('age_min');
            $table->tinyInteger('age_max');
            $table->tinyInteger('thuto_min')->default(0);
            $table->string('province', 50)->nullable(); // null = nationwide
            $table->string('style_of_play', 200)->nullable();
            $table->boolean('stipend')->default(false);
            $table->text('description');
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->date('closes_at')->nullable();
            $table->timestamps();
            $table->foreign('club_id')->references('id')->on('arena_clubs')->onDelete('cascade');
            $table->foreign('posted_by')->references('id')->on('users')->onDelete('cascade');
        });
    }
    public function down(): void { Schema::dropIfExists('arena_talent_wanted'); }
};
```

### Migration 10 — `arena_applications`

```php
<?php
// FILE: database/migrations/2026_06_08_000002_create_arena_applications_table.php
return new class extends Migration {
    public function up(): void {
        Schema::create('arena_applications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('talent_wanted_id');
            $table->unsignedBigInteger('applicant_id');
            $table->text('message');
            $table->string('availability', 200)->nullable();
            $table->enum('status', ['pending','shortlisted','declined','trial_invited'])->default('pending');
            $table->timestamps();
            $table->foreign('talent_wanted_id')->references('id')->on('arena_talent_wanted')->onDelete('cascade');
            $table->foreign('applicant_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['talent_wanted_id', 'applicant_id']);
        });
    }
    public function down(): void { Schema::dropIfExists('arena_applications'); }
};
```

---

## Sprint 4 — Step 2: Models

### `app/Models/ArenaTalentWanted.php`

```php
<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ArenaTalentWanted extends Model {
    protected $table = 'arena_talent_wanted';
    protected $fillable = [
        'club_id','posted_by','sport','position','age_min','age_max',
        'thuto_min','province','style_of_play','stipend','description','status','closes_at'
    ];
    protected $casts = ['stipend' => 'boolean', 'closes_at' => 'date'];
    public function club() { return $this->belongsTo(ArenaClub::class, 'club_id'); }
    public function poster() { return $this->belongsTo(User::class, 'posted_by'); }
    public function applications() { return $this->hasMany(ArenaApplication::class, 'talent_wanted_id'); }
}
```

### `app/Models/ArenaApplication.php`

```php
<?php namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ArenaApplication extends Model {
    protected $fillable = ['talent_wanted_id','applicant_id','message','availability','status'];
    public function posting() { return $this->belongsTo(ArenaTalentWanted::class, 'talent_wanted_id'); }
    public function applicant() { return $this->belongsTo(User::class, 'applicant_id'); }
}
```

---

## Sprint 4 — Step 3: ArenaTalentController

### `app/Http/Controllers/Api/ArenaTalentController.php` — NEW FILE

```php
<?php namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{ArenaTalentWanted, ArenaApplication, User};
use Illuminate\Http\{Request, JsonResponse};
use Illuminate\Support\Facades\Auth;

class ArenaTalentController extends Controller {

    public function index(Request $request): JsonResponse {
        $query = ArenaTalentWanted::with('club')->where('status', 'open');
        if ($request->sport)    $query->where('sport', $request->sport);
        if ($request->position) $query->where('position', $request->position);
        if ($request->province) $query->where(fn($q) => $q->where('province', $request->province)->orWhereNull('province'));
        if ($request->age)      $query->where('age_min', '<=', $request->age)->where('age_max', '>=', $request->age);
        return response()->json($query->latest()->paginate(20));
    }

    public function show(int $id): JsonResponse {
        $posting = ArenaTalentWanted::with(['club', 'poster:id,name'])->withCount('applications')->findOrFail($id);
        return response()->json($posting);
    }

    public function store(Request $request): JsonResponse {
        $request->validate([
            'club_id'     => 'required|exists:arena_clubs,id',
            'sport'       => 'required|string',
            'position'    => 'required|string',
            'age_min'     => 'required|integer|min:10|max:40',
            'age_max'     => 'required|integer|min:10|max:40',
            'description' => 'required|string',
        ]);
        $posting = ArenaTalentWanted::create(array_merge($request->all(), ['posted_by' => Auth::id()]));

        // Notify matching players — fire and forget
        try { $this->notifyMatchingPlayers($posting); } catch (\Throwable $e) {}

        return response()->json(['posting' => $posting->load('club')], 201);
    }

    public function apply(int $id, Request $request): JsonResponse {
        $request->validate([
            'message'      => 'required|string|max:500',
            'availability' => 'nullable|string|max:200',
        ]);
        $posting = ArenaTalentWanted::where('id', $id)->where('status', 'open')->firstOrFail();
        $application = ArenaApplication::create([
            'talent_wanted_id' => $id,
            'applicant_id'     => Auth::id(),
            'message'          => $request->message,
            'availability'     => $request->availability,
            'status'           => 'pending',
        ]);
        return response()->json(['application' => $application], 201);
    }

    public function applications(int $id): JsonResponse {
        // Only the posting coach can see applications
        $posting = ArenaTalentWanted::where('id', $id)->where('posted_by', Auth::id())->firstOrFail();
        $apps = ArenaApplication::where('talent_wanted_id', $id)
            ->with('applicant:id,name,role,sport,province,thuto_score')
            ->latest()->get();
        return response()->json($apps);
    }

    public function updateApplication(int $id, Request $request): JsonResponse {
        $request->validate(['status' => 'required|in:pending,shortlisted,declined,trial_invited']);
        // Find application for a posting this user coaches
        $app = ArenaApplication::whereHas('posting', fn($q) => $q->where('posted_by', Auth::id()))
            ->where('id', $id)->firstOrFail();
        $app->update(['status' => $request->status]);
        return response()->json(['application' => $app]);
    }

    private function notifyMatchingPlayers(ArenaTalentWanted $posting): void {
        // Find players who match sport, position, age, province, and thuto_min
        User::where('role', 'player')
            ->where('sport', $posting->sport)
            ->when($posting->province, fn($q) => $q->where('province', $posting->province))
            ->when($posting->thuto_min > 0, fn($q) => $q->where('thuto_score', '>=', $posting->thuto_min))
            ->chunk(50, function ($players) use ($posting) {
                foreach ($players as $player) {
                    // Create an auto arena_post of type talent_wanted for each matching player's feed
                    \App\Http\Controllers\Api\ArenaFeedController::autoPost('talent_wanted', $player->id, [
                        'talent_wanted_id' => $posting->id,
                        'club_name'        => $posting->club->name ?? '',
                        'position'         => $posting->position,
                    ]);
                }
            });
    }
}
```

---

## Sprint 4 — Step 4: API Routes

```php
// ── THE ARENA: SPRINT 4 — TALENT WANTED ─────────────────────────────────────
Route::get('/arena/talent',                    [ArenaTalentController::class, 'index']);
Route::post('/arena/talent',                   [ArenaTalentController::class, 'store']);
Route::get('/arena/talent/{id}',               [ArenaTalentController::class, 'show']);
Route::post('/arena/talent/{id}/apply',        [ArenaTalentController::class, 'apply']);
Route::get('/arena/talent/{id}/applications',  [ArenaTalentController::class, 'applications']);
Route::patch('/arena/applications/{id}',       [ArenaTalentController::class, 'updateApplication']);
// ── END SPRINT 4 ─────────────────────────────────────────────────────────────
```

Import: `use App\Http\Controllers\Api\ArenaTalentController;`

---

## Sprint 4 — Step 5: Frontend Pages

### `/arena/recruitment` — Talent Wanted Board

Design spec:
- Header: "Talent Wanted Board" + "Post a position" button (coach/club only)
- Filter bar: Sport · Position · Province · Age · Show matches for my THUTO (toggle)
- Posting cards: club logo + name + location · position (large) · attrs grid (age range, min THUTO, province, stipend) · description · application count · Apply button
- If viewer's THUTO score qualifies: green badge "Your THUTO score qualifies you"
- Clicking Apply opens a modal with message and availability fields

### `/arena/recruitment/[id]` — Individual posting

Design spec:
- Full posting details
- Apply with Player Passport button
- Application count
- If already applied: shows application status (pending / shortlisted / trial invited)

### `/arena/recruitment/new` — Create posting (coach only)

Design spec:
- Form: club, sport, position, age min/max, THUTO min, province, style of play, stipend toggle, description, closing date
- Coaches only — redirect non-coaches

### `/coach/recruitment` — Coach applications dashboard

Design spec:
- List of all Talent Wanted posts by this coach
- Click a post to see all applications
- Each application: player passport link, message, availability, status dropdown (pending / shortlisted / declined / trial invited)
- Update status calls `PATCH /api/v1/arena/applications/{id}`

---

## Sprint 4 — Tests

- [ ] `GET /api/v1/arena/talent` returns open postings
- [ ] `GET /api/v1/arena/talent?sport=football&province=Harare` filters correctly
- [ ] `POST /api/v1/arena/talent` creates posting (coach only)
- [ ] Matching players receive auto talent_wanted post in their feed after posting is created
- [ ] `GET /api/v1/arena/talent/{id}` returns posting with applications count
- [ ] `POST /api/v1/arena/talent/{id}/apply` creates application
- [ ] `POST /api/v1/arena/talent/{id}/apply` twice → 422 (unique constraint)
- [ ] `GET /api/v1/arena/talent/{id}/applications` works for posting coach, rejected for others
- [ ] `PATCH /api/v1/arena/applications/{id}` updates status
- [ ] `/arena/recruitment` loads with filters
- [ ] THUTO qualify badge shows for eligible players
- [ ] Apply modal submits and shows application status
- [ ] `/arena/recruitment/new` accessible to coaches only
- [ ] `/coach/recruitment` shows applications, status updates work
- [ ] All previous sprint tests still pass ✓

---

---

# SPRINT 5 — PUBLIC PROFILES, DISCOVER, NOTIFICATIONS
## The Arena visible to the world
### Estimated time: 1 week

**Dependency:** Sprint 4 must be fully tested and merged.

---

## Sprint 5 — Step 1: No New Migrations

Sprint 5 uses existing tables from Sprints 1–4 and existing platform tables (users, sessions, etc.).

---

## Sprint 5 — Step 2: New Frontend Pages

### `/arena/profile/[id]` — Public athlete profile

Design spec:
- Green banner, player avatar, name with verified tick
- Follow button, Connect button, Message button (Message only if connected)
- Sport tag (e.g. Football · Free tier / Pro)
- Five stat boxes: THUTO score · Scout views · Monthly growth · Session streak · Prediction level
- Earned badges row (TFZ School, Top 50, Football Business School Graduate, etc.)
- Two-column lower section:
  - Left: THUTO score breakdown bars (Technical, Physical, Tactical, Mental)
  - Right: THUTO Prediction card with comparable player, confidence bar, dark green background
- Recent Arena posts from this player
- Call `GET /api/v1/arena/profile/{id}` — new endpoint (see below)

New backend endpoint needed — add to ArenaSocialController:

```php
public function profile(int $id): JsonResponse {
    $user = User::select(['id','name','role','sport','province','thuto_score','created_at'])
        ->withCount([
            'receivedFollows as follower_count',
            'sentConnections as connection_count',
        ])->findOrFail($id);
    $posts = ArenaPost::where('user_id', $id)->latest()->take(5)->get();
    $scoutViews = 0; // Pull from existing scout view tracking table if available
    return response()->json(['user' => $user, 'posts' => $posts, 'scout_views' => $scoutViews]);
}
```

Add route:
```php
Route::get('/arena/profile/{id}', [ArenaSocialController::class, 'profile']);
```

---

### `/arena/discover` — Discover athletes

Design spec:
- Search bar + filters: Sport · Province · Position · Age · Min THUTO score
- Player cards in a grid: avatar, name, sport, province, THUTO score, prediction level, Follow button, Connect button
- Sorted by THUTO score descending by default
- Linked to `/arena/profile/[id]`

New backend endpoint — add to ArenaSocialController:

```php
public function discover(Request $request): JsonResponse {
    $query = User::where('role', 'player')->select(['id','name','sport','province','thuto_score']);
    if ($request->sport)    $query->where('sport', $request->sport);
    if ($request->province) $query->where('province', $request->province);
    if ($request->min_thuto) $query->where('thuto_score', '>=', $request->min_thuto);
    return response()->json($query->orderByDesc('thuto_score')->paginate(20));
}
```

Add route:
```php
Route::get('/arena/discover', [ArenaSocialController::class, 'discover']);
```

---

### `/arena/notifications` — Arena notifications page

Design spec:
- List of notifications: new connection request, connection accepted, scout viewed profile, THUTO score milestone, talent wanted match, new message
- Each notification: icon, text, timestamp, unread dot, click marks as read
- Uses existing notifications system from `/player/notifications` — extend it with Arena notification types

---

## Sprint 5 — Step 3: Right Sidebar Widgets for `/arena`

Wire up the right sidebar of the main feed with real data:

### Scouts online widget
```
GET /api/v1/scout/online
Returns: list of scouts who have been active in the last 15 minutes
Display: avatar, name, organisation, green online dot, View button
```

### Top 50 leaderboard widget
```
GET /api/v1/arena/leaderboard?sport=all&limit=5
Returns: top 5 players by thuto_score
Display: rank (gold for 1-3), avatar, name, sport, province, score, monthly delta
```

New endpoint — add to ArenaFeedController:
```php
public function leaderboard(Request $request): JsonResponse {
    $query = User::where('role', 'player')->select(['id','name','sport','province','thuto_score']);
    if ($request->sport && $request->sport !== 'all') $query->where('sport', $request->sport);
    return response()->json($query->orderByDesc('thuto_score')->take($request->limit ?? 5)->get());
}
```

### People you may know widget
```
GET /api/v1/arena/suggested
Returns: players with same sport + same province as viewer who are not yet connected
```

New endpoint:
```php
public function suggested(): JsonResponse {
    $uid = Auth::id(); $user = Auth::user();
    $connectedIds = ArenaConnection::where('status', 'accepted')
        ->where(fn($q) => $q->where('requester_id', $uid)->orWhere('recipient_id', $uid))
        ->get()->map(fn($c) => $c->requester_id === $uid ? $c->recipient_id : $c->requester_id);
    $suggested = User::where('role', 'player')->where('id', '!=', $uid)
        ->where('sport', $user->sport)->where('province', $user->province)
        ->whereNotIn('id', $connectedIds)
        ->select(['id','name','sport','province','thuto_score'])
        ->take(5)->get();
    return response()->json($suggested);
}
```

Add routes:
```php
Route::get('/arena/leaderboard', [ArenaFeedController::class, 'leaderboard']);
Route::get('/arena/suggested',   [ArenaSocialController::class, 'suggested']);
```

---

## Sprint 5 — Step 4: Remaining Auto-Post Hooks

### Hook 4 — Scout views a player's profile

Find the scout profile view tracking logic (check existing SessionController or ProfileController). After recording the view:

```php
try {
    \App\Http\Controllers\Api\ArenaFeedController::autoPost('scout_view', $player->id, [
        'scout_location' => $scout->province ?? 'Unknown',
    ]);
} catch (\Throwable $e) {}
```

### Hook 5 — Fan Hub clip uploaded

Find `FanHubController.php`. After clip is confirmed uploaded to R2:

```php
try {
    \App\Http\Controllers\Api\ArenaFeedController::autoPost('video', $uploader->id, [
        'fan_hub_video_id' => $video->id,
        'title'            => $video->title,
    ]);
} catch (\Throwable $e) {}
```

---

## Sprint 5 — Step 5: Update Sidebar Navigation

Add `/arena/discover` and `/arena/notifications` to sidebar:

```typescript
{ href: '/arena',              label: 'The Arena',       icon: Globe,       roles: ['player','coach','scout','fan'] },
{ href: '/arena/discover',     label: 'Discover Athletes', icon: Search,     roles: ['player','coach','scout'] },
{ href: '/arena/notifications', label: 'Arena Alerts',    icon: BellRing,   roles: ['player','coach','scout','fan'] },
```

---

## Sprint 5 — Tests (full platform test)

- [ ] `/arena/profile/[id]` loads for any user ID
- [ ] Follow button on profile toggles follow
- [ ] Connect button on profile sends connection request
- [ ] Message button only shows for connected users
- [ ] `/arena/discover` loads with filters
- [ ] Filtering by sport and province returns correct players
- [ ] `/arena/notifications` loads Arena notifications
- [ ] Right sidebar scouts online shows real data
- [ ] Right sidebar Top 50 leaderboard shows real scores
- [ ] Right sidebar People you may know shows players from same sport/province
- [ ] Scout viewing a player profile fires arena auto-post
- [ ] Fan Hub clip upload fires arena auto-post
- [ ] Full flow: Register → Follow a school → Connect with a player → Accept connection → Send DM → Log session → Confirm THUTO milestone post appears in feed → Search for a club → Apply for Talent Wanted → Coach sees application → Coach invites to trial
- [ ] All previous sprint tests still pass ✓
- [ ] All existing pages still load ✓

---

## Sprint 5 — CLAUDE.md Update (same commit)

```
/arena/profile/[id]   Public athlete profile — THUTO score, posts, follow/connect/message
/arena/discover       Discover athletes — searchable by sport, province, THUTO, position
/arena/notifications  Arena notifications — connections, scout views, talent matches
```

---

---

# COMPLETE CLAUDE.md UPDATE — All 5 Sprints Combined

Add this to CLAUDE.md after all 5 sprints are done:

```
### THE ARENA — COMPLETE (Sprints 1-5)

#### All new routes
/arena                   Main social feed — 3-column LinkedIn layout
/arena/network           My Network — connections, followers, following, pending
/arena/messages          Direct Messages — inbox + thread (connected users only)
/arena/clubs             Club directory — searchable by sport, province, formation, style
/arena/clubs/[id]        Club page — squad, reviews, open positions, follow
/arena/clubs/[id]/review Submit anonymous club review
/arena/recruitment       Talent Wanted Board — open positions across all sports
/arena/recruitment/[id]  Individual posting — apply with Player Passport
/arena/recruitment/new   Post a position (coaches only)
/arena/profile/[id]      Public athlete profile — visible to scouts and connections
/arena/discover          Discover athletes — filtered directory
/arena/notifications     Arena-specific notifications
/coach/recruitment       Coach applications dashboard

#### All new database tables
arena_follows            One-way follows
arena_connections        Two-way connection requests
arena_messages           Direct messages (connected users only)
arena_posts              All post types including auto-generated milestones
arena_post_likes         Post reactions
arena_post_comments      Post comments
arena_clubs              Club and school directory pages
arena_club_reviews       Anonymous player reviews of clubs
arena_talent_wanted      Open position postings from coaches
arena_applications       Player applications for Talent Wanted postings

#### All new controllers (bhora-ai)
ArenaSocialController    — follow, connect, message, profile, discover, suggested
ArenaFeedController      — feed, posts, likes, comments, leaderboard, autoPost()
ArenaClubController      — club CRUD, reviews, follow
ArenaTalentController    — postings, apply, applications, notify matching players

#### Modified files
SessionController         — auto-post hook (session_milestone)
TalentPredictionService   — auto-post hook (prediction_upgrade)
FanHubController          — auto-post hook (video)
src/components/layout/sidebar.tsx — added Arena nav items
src/types/arena.ts        — new file — TypeScript types for all Arena models
```

---

*Every feature we build must answer: "Does this help a Zimbabwean athlete get recognised?"*
*Train Anywhere in Zimbabwe. Use AI to Get Recognized.*

# Passport Token Backend — Copy-Paste to bhora-ai

Gap 3 fix: adds `passport_token` + `gender` to the Laravel backend so the
Talent Passport public URL works end-to-end.

---

## What already works (frontend)

- `/register/player/page.tsx` has the gender radio (THUTO/Amara) and saves
  `passport_token` to localStorage if the register response returns it.
- `/passport/[id]/page.tsx` fetches `GET /player/public/{id}?by=passport_token`
- `/passport/[id]/page.tsx` fetches `GET /player/vault/{id}?by=passport_token&visibility=public`
- `/passport/page.tsx` reads `passport_token` + `gender` from `GET /auth/me`

Nothing to change on the Next.js side.

---

## FILE 1 — Migration

```
FILE: database/migrations/2026_06_13_000001_add_passport_token_to_users_table.php
```

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // passport_token — permanent public slug for /passport/{token}
            if (!Schema::hasColumn('users', 'passport_token')) {
                $table->string('passport_token', 48)->nullable()->unique()->after('role');
            }
            // gender — 'male' | 'female', used to route THUTO vs Amara
            if (!Schema::hasColumn('users', 'gender')) {
                $table->string('gender', 10)->nullable()->after('passport_token');
            }
        });

        // Back-fill a token for all existing players that don't have one
        DB::table('users')
            ->where('role', 'player')
            ->whereNull('passport_token')
            ->chunkById(200, function ($users) {
                foreach ($users as $user) {
                    DB::table('users')
                        ->where('id', $user->id)
                        ->update(['passport_token' => Str::random(40)]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['passport_token', 'gender']);
        });
    }
};
```

---

## FILE 2 — AuthController changes

Add these two things to your existing `app/Http/Controllers/Api/AuthController.php`.

### 2a. In `register()` — generate passport_token for players

Find the block where you create the user and return the token. Add the
passport_token generation immediately after the user is created:

```php
// After: $user = User::create([...]);
// Add:
if ($user->role === 'player') {
    $user->passport_token = \Illuminate\Support\Str::random(40);
    $user->save();
}
```

### 2b. In `register()` — return passport_token + gender in the response

Find where you return the response (typically returns `token` + `user`).
Add `passport_token` and `gender` to the user array:

```php
return response()->json([
    'token' => $token,
    'user'  => [
        'id'             => $user->id,
        'name'           => $user->name,
        'email'          => $user->email ?? null,
        'phone'          => $user->phone ?? null,
        'role'           => $user->role,
        'gender'         => $user->gender,
        'passport_token' => $user->passport_token,
    ],
], 201);
```

### 2c. In `me()` (GET /auth/me or GET /auth/user) — return the same fields

Add `passport_token` and `gender` to whatever you return from the me endpoint.
Exact form depends on your controller but the pattern is:

```php
return response()->json([
    'user' => array_merge($request->user()->toArray(), [
        'passport_token' => $request->user()->passport_token,
        'gender'         => $request->user()->gender,
    ]),
]);
```

Also add to `User::$fillable` if not already present:

```php
'passport_token',
'gender',
```

---

## FILE 3 — PlayerPublicController — handle `?by=passport_token`

The passport page fetches:
- `GET /api/v1/player/public/{id}?by=passport_token`
- `GET /api/v1/player/vault/{id}?by=passport_token&visibility=public`

The `{id}` param is the passport_token string (40 chars), not a UUID.
The backend must switch the lookup column based on `?by`.

In your existing `PlayerPublicController` (or wherever `GET /player/public/{id}`
is handled), change the user lookup to:

```php
public function show(Request $request, string $id): JsonResponse
{
    // Support lookup by passport_token (used by /passport/[token] page)
    if ($request->query('by') === 'passport_token') {
        $user = \DB::table('users')->where('passport_token', $id)->first();
    } else {
        $user = \DB::table('users')->where('id', $id)->first();
    }

    if (!$user) {
        return response()->json(['error' => 'Not found'], 404);
    }

    // ... rest of your existing profile fetch logic using $user->id ...
}
```

---

## FILE 4 — Player Vault — handle `?by=passport_token&visibility=public`

In the controller that handles `GET /player/vault/{id}`:

```php
public function publicVault(Request $request, string $id): JsonResponse
{
    // Resolve player UUID from passport_token if ?by=passport_token
    if ($request->query('by') === 'passport_token') {
        $user = \DB::table('users')->where('passport_token', $id)->first();
        if (!$user) return response()->json([], 200);
        $playerId = $user->id;
    } else {
        $playerId = $id;
    }

    $visibility = $request->query('visibility', 'public');

    $videos = \DB::table('player_videos')
        ->where('user_id', $playerId)
        ->where('visibility', $visibility)
        ->orderByDesc('created_at')
        ->get(['id', 'r2_url', 'thumbnail_url', 'title', 'tag', 'created_at']);

    return response()->json($videos);
}
```

Route (add to `routes/api.php` — public, no auth):

```php
// Already exists for UUID lookup — extend it OR add a second route:
Route::get('/player/vault/{id}', [PlayerVaultController::class, 'publicVault']);
```

---

## Fallback SQL (run directly on Render PostgreSQL if migration fails)

```sql
-- Add columns (safe — IF NOT EXISTS)
ALTER TABLE users ADD COLUMN IF NOT EXISTS passport_token VARCHAR(48) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(10);

-- Back-fill existing players
UPDATE users
SET passport_token = substr(md5(random()::text || id::text), 1, 40)
WHERE role = 'player' AND passport_token IS NULL;
```

---

## Test after deploying

```bash
# 1. Register a new player — check response contains passport_token
curl -X POST https://bhora-ai.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Test","surname":"Player","name":"Test Player","gender":"female","age":18,"country":"Zimbabwe","email":"testpassport@test.com","password":"Test1234!","password_confirmation":"Test1234!","role":"player"}'
# Expected: response.user.passport_token is a 40-char string

# 2. Fetch the public passport
PASSPORT_TOKEN="<token from step 1>"
curl "https://bhora-ai.onrender.com/api/v1/player/public/${PASSPORT_TOKEN}?by=passport_token"
# Expected: 200 with player profile

# 3. Fetch vault (empty is fine — just must return 200)
curl "https://bhora-ai.onrender.com/api/v1/player/vault/${PASSPORT_TOKEN}?by=passport_token&visibility=public"
# Expected: 200, [] or array of videos
```

---

## Action checklist for Nigel

- [ ] Copy migration to `bhora-ai/database/migrations/` and push
- [ ] Add `passport_token` + `gender` to `User::$fillable` in `app/Models/User.php`
- [ ] Add passport_token generation in `AuthController::register()` (after user create)
- [ ] Add `passport_token` + `gender` to `register()` response
- [ ] Add `passport_token` + `gender` to `me()` response
- [ ] Add `?by=passport_token` lookup in `PlayerPublicController::show()`
- [ ] Add `?by=passport_token` + `visibility` filter in vault controller
- [ ] Run: `php artisan migrate --force` on Render (or let start.sh handle it)
- [ ] Run the 3 test curl commands above to verify end-to-end

# GrassRoots Backend Debt — Copy-paste into bhora-ai

Run `php artisan migrate --force` after adding all migration files.

---

## 1. arena_posts WhatsApp + Activity fields (14 Jun + 22 Jun)

```
FILE: database/migrations/2026_06_14_000001_extend_arena_posts_whatsapp_activity.php
```

```php
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('arena_posts', function (Blueprint $table) {
            $table->text('image_url')->nullable()->after('province');
            $table->text('video_url')->nullable()->after('image_url');
            $table->boolean('from_whatsapp')->default(false)->after('video_url');
            $table->string('activity_type')->nullable()->after('from_whatsapp');
            $table->jsonb('activity_data')->nullable()->after('activity_type');
            $table->boolean('is_auto_generated')->default(false)->after('activity_data');
            $table->string('visibility')->default('public')->after('is_auto_generated');
        });
    }

    public function down(): void
    {
        Schema::table('arena_posts', function (Blueprint $table) {
            $table->dropColumn(['image_url','video_url','from_whatsapp','activity_type','activity_data','is_auto_generated','visibility']);
        });
    }
};
```

**Model update — `app/Models/ArenaPost.php`:**

Add to `$fillable`:
```php
'image_url', 'video_url', 'from_whatsapp',
'activity_type', 'activity_data', 'is_auto_generated', 'visibility',
```

Add to `$casts`:
```php
'from_whatsapp'     => 'boolean',
'activity_data'     => 'array',
'is_auto_generated' => 'boolean',
```

**Controller update — `app/Http/Controllers/Api/ArenaFeedController.php`:**

In `forYou()`, `following()`, `connections()` — add after `$query = DB::table(...)`:
```php
if ($type = $request->query('type')) {
    $query->where('activity_type', $type);
}
```

In `store()` validation add:
```php
'activity_type' => 'nullable|string|max:80',
'activity_data' => 'nullable|array',
```

In `ArenaPost::create()` add:
```php
'activity_type'     => $data['activity_type'] ?? null,
'activity_data'     => $data['activity_data'] ?? null,
'is_auto_generated' => false,
```

Add new method `fromWhatsapp()`:
```php
public function fromWhatsapp(Request $request): JsonResponse
{
    $data = $request->validate([
        'phone'     => 'required|string',
        'body'      => 'required|string|max:280',
        'image_url' => 'nullable|url',
        'video_url' => 'nullable|url',
    ]);

    // Resolve user by phone digits
    $digits = preg_replace('/\D/', '', $data['phone']);
    $profile = \DB::table('player_profiles')
        ->whereRaw("regexp_replace(phone, '[^0-9]', '', 'g') LIKE ?", ["%{$digits}"])
        ->first();
    if (!$profile) return response()->json(['error' => 'User not found'], 404);

    // Rate limit: max 5 WhatsApp posts per hour
    $recent = ArenaPost::where('user_id', $profile->user_id)
        ->where('from_whatsapp', true)
        ->where('created_at', '>=', now()->subHour())
        ->count();
    if ($recent >= 5) return response()->json(['error' => 'Rate limited'], 429);

    $post = ArenaPost::create([
        'id'           => (string) \Str::uuid(),
        'user_id'      => $profile->user_id,
        'body'         => $data['body'],
        'image_url'    => $data['image_url'] ?? null,
        'video_url'    => $data['video_url'] ?? null,
        'from_whatsapp'=> true,
        'post_type'    => 'standard',
        'like_count'   => 0,
        'comment_count'=> 0,
    ]);

    return response()->json(['post_id' => $post->id, 'user_name' => $profile->first_name ?? '']);
}
```

Add route (no auth middleware — webhook):
```php
Route::post('/arena/posts/from-whatsapp', [ArenaFeedController::class, 'fromWhatsapp']);
```

---

## 2. Admin User Role Change (25 Jun)

Add to `AdminUserController` (or create inline closure in routes/api.php):

```php
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::patch('/admin/users/{id}', function (Request $request, string $id) {
        $request->validate(['role' => 'required|in:player,coach,scout,fan,admin']);
        \DB::table('users')->where('id', $id)->update([
            'role'       => $request->role,
            'updated_at' => now(),
        ]);
        return response()->json(['message' => 'Role updated']);
    });
});
```

---

## 3. Chemistry Migrations (7 May — 5 tables)

These 5 files need to be copied to `database/migrations/` in the bhora-ai repo.
They were documented in the 7 May 2026 session log. Create them in order:

```
2026_05_07_000001_create_style_fingerprints_table.php
2026_05_07_000002_create_style_fingerprint_history_table.php
2026_05_07_000003_create_style_similarities_table.php
2026_05_07_000004_add_chemistry_columns_to_player_profiles_table.php
2026_05_07_000005_create_chemistry_data_access_log_table.php
```

**Quickest fix — one combined migration:**

```php
<?php
// FILE: database/migrations/2026_05_07_000001_create_chemistry_tables_combined.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('style_fingerprints', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(\DB::raw('gen_random_uuid()'));
            $table->uuid('player_id')->unique();
            $table->jsonb('fingerprint_vector'); // 32-dim array
            $table->decimal('confidence_score', 5, 2)->default(0);
            $table->boolean('under_18')->default(false);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::create('style_similarities', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(\DB::raw('gen_random_uuid()'));
            $table->uuid('player_a_id');
            $table->uuid('player_b_id');
            $table->decimal('chemistry_score', 5, 2)->default(0);
            $table->decimal('style_score', 5, 2)->default(0);
            $table->decimal('demographic_score', 5, 2)->default(0);
            $table->decimal('geographic_score', 5, 2)->default(0);
            $table->jsonb('top_matching_dimensions')->nullable();
            $table->jsonb('diverging_dimensions')->nullable();
            $table->timestamps();
            $table->unique(['player_a_id', 'player_b_id']);
        });

        Schema::create('chemistry_data_access_log', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(\DB::raw('gen_random_uuid()'));
            $table->uuid('accessor_id');
            $table->uuid('player_id');
            $table->string('access_type');
            $table->timestamp('accessed_at')->useCurrent();
        });

        // Add chemistry columns to player_profiles if they don't exist
        if (Schema::hasTable('player_profiles') && !Schema::hasColumn('player_profiles', 'safeguarding_consent_chemistry')) {
            Schema::table('player_profiles', function (Blueprint $table) {
                $table->boolean('safeguarding_consent_chemistry')->default(false)->nullable();
                $table->boolean('chemistry_notifications_enabled')->default(true)->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('chemistry_data_access_log');
        Schema::dropIfExists('style_similarities');
        Schema::dropIfExists('style_fingerprints');
        Schema::table('player_profiles', function (Blueprint $table) {
            $table->dropColumnIfExists('safeguarding_consent_chemistry');
            $table->dropColumnIfExists('chemistry_notifications_enabled');
        });
    }
};
```

---

## 4. WhatsApp: Twilio → Meta Cloud API

### `config/services.php` — replace twilio block:

```php
// REMOVE:
'twilio' => [
    'account_sid'    => env('TWILIO_ACCOUNT_SID'),
    'auth_token'     => env('TWILIO_AUTH_TOKEN'),
    'whatsapp_from'  => env('TWILIO_WHATSAPP_FROM'),
],

// ADD:
'whatsapp' => [
    'phone_number_id' => env('WHATSAPP_PHONE_NUMBER_ID'),
    'access_token'    => env('WHATSAPP_ACCESS_TOKEN'),
],
```

### `app/Jobs/AnalyseWhatsappVideoJob.php` — replace Twilio reply:

Find and replace the existing Twilio send block with:

```php
private function sendWhatsAppReply(string $phone, string $message): void
{
    Http::withHeaders([
        'Authorization' => 'Bearer ' . config('services.whatsapp.access_token'),
        'Content-Type'  => 'application/json',
    ])->post(
        'https://graph.facebook.com/v19.0/' . config('services.whatsapp.phone_number_id') . '/messages',
        [
            'messaging_product' => 'whatsapp',
            'to'   => ltrim($phone, '+'),
            'type' => 'text',
            'text' => ['body' => $message],
        ]
    );
}
```

### Render env vars to add:
```
WHATSAPP_PHONE_NUMBER_ID = (from Meta Developer Console)
WHATSAPP_ACCESS_TOKEN    = (System User token)
```

### Render env vars to remove:
```
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_FROM
```

---

## DEPLOY CHECKLIST

After copying all files into bhora-ai:

```bash
git add -A
git commit -m "feat: arena activity fields, chemistry tables, admin role patch, meta whatsapp"
git push origin master
```

Render auto-runs `php artisan migrate --force` on deploy.

Verify migrations ran:
```bash
# In Render shell or psql:
\dt arena_posts         # should have activity_type, from_whatsapp columns
\dt style_fingerprints  # should exist
\dt style_similarities  # should exist
```

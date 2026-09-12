# Hallyu — System Architecture (Detailed)

> **Status:** Phase 2 deliverable — for review before implementation.
> **Companion docs:** `IMPLEMENTATION_PLAN.md` (build phases), `SCREEN_NAVIGATION_MAP.md`, `DECISIONS.md`, `../blueprints/` (visual reference).
> **Governing requirements:** Spec §25–§33 (database, permissions, privacy, stack, infrastructure, performance), §39 (safety rules), §45 (definition of done).

---

## 1. System overview

```
┌─────────────────────────────  GITHUB REPOSITORY (single source of truth)  ─────────────────────────────┐
│                                                                                                        │
│  shared-domain ─┐                                                                                      │
│                 ├─► shared-data ─┐   KMP (Android + iOS)   ┌──────────────────────────────────┐         │
│  shared-domain ─┘                ├─► shared-ui ───────────►│ androidApp (Kotlin/Compose)     │         │
│                                  │                          │ iosApp     (Swift + KMP frame) │         │
│                                  │                          └───────┬──────────────────────────┘         │
│                                  │                                  │ HTTPS (REST/JSON) + WSS            │
│                                  │                                  ▼                                     │
│                       cli (Kotlin/JVM) ── shares code ──► backend (Ktor modular monolith)               │
│                                                       │             │                                   │
│                                                       │             ├──► PostgreSQL 16 (single DB)     │
│                                                       │             ├──► MediaStore (local/S3 adapter)  │
│                                                       │             ├──► Push adapters (FCM/APNs)      │
│                                                       │             ├──► Mailer adapter (SMTP/console) │
│                                                       │             └──► TMDB sync client (config-gated)│
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Architectural invariant:** the mobile apps never touch the database or storage directly. Every byte of product data flows through the versioned API. Authorization is decided server-side only (Spec §39 rules 3–4).

## 2. Backend architecture

### 2.1 Process model
One Ktor server process (CIO/Netty) hosting all feature modules — a modular monolith (Spec §30). Long-running in-process jobs: trending recompute (every 15 min), notification digest/delivery sweep (every 30 s), session/token janitor (hourly), media processing queue (DB-backed work table, worker loop — no external queue). Scale-out path (documented, not built): multiple API instances + Postgres; sessions/tokens already stateless-safe via hashed refresh tokens; media already behind adapter.

### 2.2 Request pipeline
```
Request → CORS → rate limiter (per identity+route class) → request logging w/ trace-id
       → auth principal extraction (JWT or refresh) → route handler
       → serializer (kotlinx-serialization) → domain mapping → service call
       → DAO (Exposed) → Postgres → DTO mapping → response (envelope: data/meta/error)
```
Uniform error envelope: `{ "error": { "code": "...", "message": "...", "details": [...] } }` with stable machine codes (`AUTH_INVALID_CREDENTIALS`, `SPOILER_BLOCKED`, `RATE_LIMITED`, `COMMUNITY_PRIVATE`, `NOT_MEMBER`, …) — the client maps these to localized, humane messages (Spec §38 tone).

### 2.3 Feature modules & dependencies
Modules depend only on `db`, `security`, `services`, `media` — never on each other except through interfaces. Cross-cutting events (e.g., "post created") go through an internal `DomainEventBus` consumed by notifications and trending modules — in-process only.

```
auth ─┐
users │ follows ─┐ posts ─┐ comments ─┐ reactions ─┐ bookmarks ─┐ hashtags ─┐ dramas ─┐ episodes ─┐ actors
      │           │        │            │             │             │           │         │
watching ─ spoilers │ communities ─ moderation ─ verification │ notifications │ search │ trending │ feeds │ recommendations │ media │ admin │ analytics │ sync
```
All wired in `Application.kt` via explicit install order: db → security → content modules → search/feeds/trending → notifications/realtime → admin/analytics → sync.

### 2.4 Data access
Exposed (JDBC + HikariCP) with DAOs per aggregate; migrations are **plain SQL files** (`V<N>__description.sql`) so the same artifacts work for Flyway-at-startup, CLI `migrate`, and CI. Transactions per aggregate boundary; explicit pessimistic locks only for counters that need exactness (none in MVP except community member counts — cached counts used elsewhere per Spec §31 efficiency).

### 2.5 Config & secrets
Typed `HallyuConfig` from env (never files committed with secrets): `HALYU_DB_URL/USER/PASSWORD`, `JWT_SECRET` (+ optional `JWT_KMS_REF` for rotation), `MEDIA_STORE=local|s3` (+S3 bucket/keys), `FCM_ENABLED` + service account JSON, `APNS_ENABLED` + `.p8` path, `SMTP_URL` or `MAILER=console`, `TMDB_API_KEY`, `SEED_DEMO_CONTENT=true|false`, `RATE_LIMITS_*`, `CORS_ORIGINS`, `DEEP_LINK_BASE`. `hallyu setup` generates a `hallyu.env` template and a doctor that tells the developer exactly what is/isn't configured — honest configuration states (Spec §54: isolate external dependency behind adapter + document exact remaining config, never fake).

### 2.6 Realtime
`/v1/realtime` WebSocket: per-user channel; server pushes `notification`, `post_engagement` (reply/mention), and `presence_ping` frames; client acks. Auth via short-lived WS ticket (JWT-derived). Push (FCM v1/APNs) fires only for category=critical (episode release, direct reply, mention) per Spec §18, and only to devices with registered tokens; quiet hours enforced server-side before push dispatch.

### 2.7 Spoiler engine (server-enforced)
Read-time guard (see IMPLEMENTATION_PLAN §5.6) + write-time assist. Guard policy matrix (viewer progress P, content episode E, level L):
- `L=none` → always visible
- `L=episode_tagged`, `E ≤ P` → visible
- `L=episode_tagged`, `E > P` → guarded (stripped payload + `spoilerGuarded: true`, reveals via `?reveal=1` second fetch)
- `L=explicit_spoiler` → guarded unless viewer preference=relaxed AND `E ≤ P+1`… strictly conservative default
Mute-drama suppresses content from all feeds; mute-user suppresses user content; block removes visibility both directions (server-enforced in every content query via a `VisibilityFilter` applied at SQL level, not per-render).

### 2.8 Trending & feeds ranking (concrete formulas)
- **TrendScore(post, window=24h)** = `(reactions_w*1 + comments_w*2 + reposts_w*3 + unique_participants_w*5) * freshness_decay(age) * community_spread_bonus` where `freshness_decay = exp(-age_hours/12)` and one-post-per-drama cap + per-entity windows prevent single-post domination (Spec §6).
- **ForYou rank** = `Σ graph_affinity (followed drama/actor/community/user) + watching_affinity(progress match) + engagement_overlap(liked/commented/saved similarity) + interest_match(tag overlap) + freshness_decay + trend_momentum*0.3` → candidate set from recent posts (7d) + followed-graph posts + trending pool; capped, curated top-N per request with `reason` strings attached in dev builds (Spec §17 explainability).

## 3. KMP architecture (detail)

### 3.1 Module dependency graph (strict)
```
shared-domain  (pure Kotlin, no framework deps)
      ▲                 ▲
shared-data ────────────┤
      ▲                 │
shared-ui ──────────────┘
   ▲           ▲
androidApp    iosApp (embeds shared-ui framework via Kotlin framework export)
```
Gradle enforces: shared-data may not import UI; shared-domain may not import Ktor/SQLDelight/Compose. A custom ` ForbiddenDependenciesCheck` task lints this rule in CI.

###-layer diagrams (per module)

**shared-domain** packages: `model/` (User, Profile, Drama, Episode, Actor, Post, PostMedia, Comment, Reaction, Community, Notification, Report, Hashtag, WatchEntry, EpisodeDiscussion, Page<T>, Cursor), `enum/`, `repo/` (interfaces), `usecase/` (SignIn, SignUp, RefreshSession, FetchForYou, FetchFollowing, FetchHomeModules, ToggleDramaFollow, SetWatchingStatus, SetWatchedThrough, FetchDrama, FetchEpisodes, FetchEpisodeDiscussion, FetchActor, PublishPost, UploadMedia, FetchPost, FetchComments, AddComment, ToggleReaction, ToggleBookmark, CreateRepost, Search, FetchExplore, JoinCommunity, LeaveCommunity, CreateCommunity, FetchCommunity, FetchNotifications, UpdateNotificationPrefs, UpdateSpoilerPrefs, FetchProfile, FetchWatching, FetchFollowers/Following, FollowUser, BlockUser, MuteUser, ReportContent, RevealSpoiler, MuteDrama, RequestAccountExport, DeleteAccount, ModerationQueue, ResolveReport, VerifyAccount…), `spoiler/` (client-side guard rendering logic + preferences), `time/` (relative timestamps), `validation/` (post length 5,000, category, hashtag/mention syntax).

**shared-data** packages: `api/` (`HallyuApi`: typed endpoints, auth header interceptor, refresh interceptor, error envelope → domain errors), `dto/` (+mappers to domain), `repo/` (implementations, one per repo interface), `session/` (SessionStore — Keychain/EncryptedSharedPreferences via multiplatform-settings; TokenRefresher), `cache/` (SQLDelight `.sq` files: dramas, episodes, feeds, drafts, watching; TTL columns; feed stale-flag semantics), `media/` (ImageEndpoint variant picker), `di/` (Koin modules).

**shared-ui** packages: `designsystem/` (tokens.md-aligned: colors incl. gradient `#4A1C6E→#2D6CDF`, accent `#FF6B6B`, surface `#0F0F0F`; typography Inter + Korean display accents; radii 12dp; spacing 16dp grid; motion tokens), `navigation/` (Voyager screens, DeepLinkRouter with `hallyu://drama/{slug}`, `hallyu://episode/{id}`, `hallyu://post/{id}`, `hallyu://community/{slug}`, `hallyu://user/{handle}`, `hallyu://hashtag/{tag}`, `hallyu://notifications`, universal-link equivalents), `presenters/`, `screens/` (per SCREEN_NAVIGATION_MAP.md), `widgets/`, `analytics/`, `resources/`.

### 3.2 Presentation pattern (MVI-lite)
`Presenter` = lifecycle-aware class exposing `StateFlow<UiState>` + `fun dispatch(intent: Intent)`; `UiState` immutable data classes with explicit `loading/loaded/error/empty` typed sub-states (Spec §38 states are first-class citizens, never booleans sprinkled around); navigation side-effects as one-shot `SharedFlow<Effect>`. Compose screens collect state and render design-system components; zero business logic in composables.

### 3.3 Image & media on client
Coil 3 with custom `ImageEndpoint` — requests the size variant matched to display context (thumb/full/poster) per Spec §31 optimized images; poster caching; progressive fade-in; `WaveProgress` for indeterminate loads (brand wave motif, Spec §35A).

### 3.4 Android specifics
`MainActivity` → `AppRoot` composable from shared-ui. `HallyuApplication` initializes Koin (`sharedDataModule + platformModule`), Coil, notification channels (critical/important/optional per Spec §18 categories), and `DeepLinkRouter` wiring. `HallyuFirebaseMessagingService` receives FCM → if app foreground, route via realtime channel; background → post system notification with deep-link PendingIntent; token refresh → `POST /v1/me/devices`. Photo Picker for create flow (no storage permission). minSdk 26, targetSdk 35.

### 3.5 iOS specifics
`iosApp` SwiftUI shell: `App` → `WindowGroup { ComposeViewFactory.root() }` wrapping `ComposeViewController` from the Kotlin framework; APNs registration in `AppDelegate`; `UNUserNotificationCenter` delegate routes taps → `DeepLinkRouter` exposed from the framework; Keychain-backed settings storage. Min iOS 15.

## 4. CLI architecture (detail)

```
cli/src/main/kotlin/com/hallyu/cli/
├── Main.kt                  # arg parsing, dispatch, exit codes (0 ok / 2 usage / 3 failure)
├── commands/
│   ├── Setup.kt             # writes hallyu.env template, Postgres bootstrap check, config doctor report
│   ├── Migrate.kt           # applies database/migrations/*.sql in order, records in schema_migrations
│   ├── Seed.kt              # idempotent: schema → curated dramas/episodes/cast → optional --demo community content
│   ├── Serve.kt             # starts the same Ktor server (dev profile defaults)
│   ├── SmokeTest.kt         # §48 journey as scripted API calls with pass/fail report + exit code
│   ├── ValidateSchema.kt    # migration drift check, index audit vs access patterns, FK integrity
│   ├── SyncTmdb.kt          # --query "title" / --import tmdb:ID  (requires TMDB_API_KEY; honest when absent)
│   ├── CreateAdmin.kt       # creates/updates an admin user (interactive or flags)
│   ├── Token.kt             # mints a dev access token for a user (local dev only)
│   ├── Stats.kt             # entity counts, session counts, trending table health, config doctor summary
│   └── CheckDesign.kt       # compares docs/blueprints design tokens vs shared-ui design token code
└── lib/                     # shared output helpers (tables, colors, logging)
```
Every command is used in CI (`backend.yml`: `setup → migrate → seed → validate-schema → test → smoke-test`) or by the developer loop (`serve`, `token`, `sync-tmdb`, `stats`). The CLI is the project's operational front door; nothing it does is fake.

##  5. Database schema (summary — full SQL in migrations at build time)

The complete entity list from Spec §25 with §25A hardening: `users` (id uuid pk, email unique, password_hash, status, created_at, deleted_at) · `profiles` (id, user_id fk, handle unique, display_name, avatar_media_id, bio, is_private, is_official, verified, interests jsonb, spoiler_preference) · `user_preferences` (user_id, notification categories, quiet hours, per-drama overrides) · `follows` (follower_id, target_type user|drama|actor, target_id, created_at, unique) · `blocks` · `mutes` (target user|drama|community) · `dramas` (slug, tmdb_ref, titles incl. Korean, synopsis, status, genres, release_schedule, poster_media_id, backdrop_media_id, year, country, rating cert) · `episodes` (drama_id, number, air_at timestamptz, title, synopsis, runtime, discussion_id) · `actors` (slug, names, photo_media_id, bio) · `drama_cast` (drama_id, actor_id, character_name, `order`) · `watching_status` (user_id, drama_id, status enum, updated_at, unique) · `watched_episodes` (user_id, episode_id, watched_at, unique) · `posts` (id, author_id, kind text|image|link|repost, category, body ≤5000, spoiler_level, drama_id, episode_number, repost_of_id, community_id, created_at, edited_at, deleted_at, hidden_at, moderation_state, counters) · `post_media` (post_id, media_id, position, alt_text) · `media_objects` (id, owner_id, kind image|video(later), variants jsonb, bytes, sha256, state clean|flagged|removed, attribution) · `post_drama_tags` / `post_episode_tags` / `hashtags` / `post_hashtags` / `mentions` · `comments` (post_id, author_id, parent_comment_id, depth ≤3, body, spoiler_level, flags) · `comment_reactions` / `post_reactions` (unique per user+kind+target) · `reposts` (unique per user+post) · `bookmarks` (unique per user+post) · `communities` (slug, name, description, avatar/banner media, is_private, member_count, created_by) · `community_members` (community_id, user_id, role owner|moderator|member, state active|banned|pending) · `community_rules` · `episode_discussions` (episode_id pk-ish, post stream config) · `official_accounts` (profile_id, org_name, kind broadcaster|studio|press|platform|creator, verified_by) · `verification_requests` · `notifications` (recipient_id, category, type, payload jsonb deep-link, read_at, created_at) · `notification_preferences` · `reports` (reporter_id, target_type, target_id, reason, details, status, severity, ai_class, decided_by, decided_at) · `moderation_actions` · `moderation_logs` · `audit_logs` (actor_id, action, target, meta, at) · `trend_scores` (target_type, target_id, score, window_start, computed_at) · `analytics_events` (event, user_id, props, at) · `schema_migrations`.

Indexes: every FK listed in Spec §25 plus composite feed indexes (`posts(created_at, id)` desc for cursor pagination, `posts(drama_id, created_at)`, `posts(community_id, created_at)`, `notifications(recipient_id, created_at desc)`, `follows(target_type, target_id)`, `follows(follower_id, target_type)`, trigram on names/handles for search, GIN FTS on posts.body/dramas.synopsis, unique constraint set per §25A.

## 6. Security architecture (summary)

Password: Argon2id (memory 64MiB, iterations 3, parallelism 2 — OWASP-aligned). Tokens: access JWT HS256 (15 min, `sub`, `sid`, `roles`, `ver`), refresh opaque 256-bit secrets hashed with SHA-256 at rest, 30-day rotation, reuse detection → revoke session tree. Account recovery: single-use token 30-min TTL, adapter-driven email. Authorization: route guards (`requireUser`, `requireRole(communityModerator/of:slug)`, `requirePlatformModerator`, `requireAdmin`) + per-row `VisibilityFilter` (blocks/mutes/private) + spoiler guard — all integration-tested per §44 Security. Rate limits: auth 5/min/IP, content write 30/min/user, search 60/min/user, media 10/min/user. Audit: privileged actions → `audit_logs`. Client: tokens in Keychain/EncryptedSharedPreferences; no secrets in bundle; all requests HTTPS-only in release; certificate pinning configurable.

## 7. Performance plan (Spec §31)

Cursor pagination everywhere; feed queries ≤ 3 round trips; counters cached on rows (increment on write, reconcile job); image variants (thumb 600 / full 1200 / poster 2:3) with client-side variant selection; SQLDelight metadata cache + feed page cache with stale-indicator; optimistic reactions; precomputed trending table instead of runtime aggregation; WebSocket only for logged-in users; 60fps list scrolling via stable keys + fixed-size media placeholders (no layout shift); measure on low-end Android profile in the runbook.

## 8. Analytics & observability

Event ingestion endpoint (§33 events) → `analytics_events` table; aggregate endpoints for admin (`stats`, DAU/WAU/MAU, retention cohorts, participation metrics). Server: structured logs w/ trace-id; error codes stable; health endpoint `/healthz` (db ping, migrations current, media store writable). Crash reporting: Sentry DSN config-gated (client + server adapters) — documented as remaining config if not provided, never faked (Spec §54).

## 9. Deployment & environments

Dev: `hallyu setup && hallyu migrate && hallyu seed && hallyu serve --dev` on localhost:8080 (runbook). CI: GitHub Actions services (Postgres 15/16). Production: single JAR + Postgres + media adapter (S3 or volume) + reverse proxy TLS — modular monolith, no Kubernetes (Spec §30). App distribution: CI artifacts (APK; iOS archive on macOS runner); store submission runbook (no store accounts in scope).

## 10. What this architecture deliberately does NOT include (and why)

No Redis (unmeasured need — Spec §30), no microservices, no message broker (DB-backed work tables suffice at MVP scale), no embedding-based recommendations (interface only), no video transcoding pipeline (data model only — Spec §22), no web app (Spec §21), no third-party public API (Spec §21), no fake HLS or fake push (Spec §21/§22) — everything the user sees is a real flow or an honest, documented unconfigured state.

# Hallyu — Implementation Plan (Engineering Translation)

> **Status:** Phase 2 deliverable — for review before implementation begins.
> **Source of truth:** `Hallyu_Final_Integrated_Master_Build_Specification (2).md` (referred to below as "the Spec").
> **Scope:** Full MVP as defined by the Spec §20 (MVP boundary), §21 (exclusions), §40 (phases), §44 (testing), §45 (definition of done).
> **Mandated platform:** Kotlin Multiplatform targeting **Android + iOS** (per project owner instruction; see `DECISIONS.md` D-01 for the stack reconciliation with Spec §29).

---

## 1. What this plan is

The Spec is the product contract. This document is the engineering translation: how each requirement becomes repositories, modules, APIs, screens, tests and CI. Every phase below maps to Spec §40's implementation phases, but is expressed in buildable units with concrete exit criteria. Nothing here widens the MVP boundary; several items exist only to satisfy Spec §39 product-safety rules (real backend, no mock data, no fake buttons).

## 2. Overall architecture (summary)

Hallyu is one repository containing five product areas, sharing a single Gradle build:

| Area | Technology | Delivers |
|---|---|---|
| `shared/` (3 Gradle modules) | Kotlin Multiplatform + Compose Multiplatform | Domain models, API client, cache, repositories, presenters, all UI screens, design system, navigation |
| `androidApp/` | Kotlin + Jetpack Compose (consumes shared-ui) | Android application: entry activity, push (FCM), deep links, permissions, app icons/theming |
| `iosApp/` | Swift/SwiftUI shell embedding the Kotlin framework (consumes shared-ui) | iOS application: `ComposeViewController`, push (APNs), deep links, entitlements |
| `backend/` | Kotlin + Ktor (modular monolith) + PostgreSQL | The real API: auth, social graph, content, drama graph, communities, moderation, notifications, search, trending, media, admin |
| `cli/` | Kotlin/JVM (shares backend service code) | `hallyu` developer CLI: setup, migrate, seed, serve, smoke-test, validate, sync, tokens, stats |

Backend-to-frontend connection is a versioned REST/JSON API (`/v1/...`) over HTTPS plus a realtime channel (WebSocket) for notifications. The mobile client never talks to the database directly; all authorization is enforced server-side (Spec §39 rules 3–5). All product data lives in PostgreSQL. Media is stored behind a `MediaStore` adapter (local disk for self-hosted dev; S3-compatible for production) and served through the backend's media routes or CDN.

## 3. Repository / file structure

```
Hallyu/                                        # repository root
├── Hallyu_Final_Integrated_Master_Build_Specification (2).md   # UNTOUCHED product contract
├── README.md
├── settings.gradle.kts                        # includes all modules
├── build.gradle.kts
├── gradle.properties
├── gradle/libs.versions.toml                   # version catalog (single source of dependency truth)
├── .github/workflows/
│   ├── backend.yml                             # JDK+Postgres: migrate, test, smoke
│   ├── android.yml                             # assemble APK + unit tests
│   ├── ios.yml                                 # macOS runner: iOS framework + xcodebuild
│   └── shared.yml                              # multiplatform compile checks (JVM/Android/iOS targets)
├── docs/
│   ├── plans/                                  # this document set
│   ├── blueprints/                             # generated app blueprint images (Phase 3)
│   ├── api/API.md                              # endpoint reference (generated summary)
│   └── runbooks/                               # setup, deploy, keys, TMDB, push config
├── database/
│   ├── migrations/                             # V<N>__*.sql — plain SQL, Flyway-compatible
│   ├── policies/                               # RLS-style policy documentation + enforcement map
│   └── seed/                                   # seed dataset (dramas, episodes, cast, demo users/posts/communities)
├── shared/
│   ├── shared-domain/                          # KMP: pure Kotlin models + repository interfaces + use cases + spoiler engine client logic
│   ├── shared-data/                            # KMP: Ktor API client, SQLDelight cache, repository implementations, session/token storage, image URL builder
│   └── shared-ui/                              # KMP + Compose Multiplatform: design system, navigation, presenters, every screen
├── androidApp/                                 # Android application module
│   └── src/main/...                            # MainActivity, HallyuApplication, FCM service, deep-link filters, notifications channels
├── iosApp/                                     # Xcode project
│   ├── iosApp.xcodeproj
│   └── iosApp/                                 # AppDelegate, ComposeViewController wrapper, APNs registration, UNUserNotificationCenter
├── backend/
│   └── src/main/kotlin/com/hallyu/backend/
│       ├── Application.kt                      # Ktor entrypoint (also embedded by CLI `serve`)
│       ├── config/                             # typed config from env (HallyuConfig)
│       ├── db/                                 # Exposed table definitions, DAOs, Flyway bootstrap
│       ├── modules/                            # auth, users, follows, posts, comments, reactions,
│       │                                       # bookmarks, hashtags, dramas, episodes, actors,
│       │                                       # communities, moderation, notifications, search,
│       │                                       # trending, feeds, watching, media, admin, sync
│       ├── security/                           # password hashing, JWT, sessions, rate limiter, guards
│       ├── services/                           # recommendation rules, spoiler policy, moderation pipeline,
│       │                                       # notification builder, trending calculator, TMDB client
│       └── media/                              # MediaStore adapters (local + S3), thumbnailer, moderation gate
├── cli/
│   └── src/main/kotlin/com/hallyu/cli/         # hallyu CLI commands (shares backend module code)
└── scripts/                                    # helper shell scripts (dev loop, postgres bootstrap)
```

## 4. Gradle & dependency plan (version catalog)

Single `libs.versions.toml`. Core versions (pinned, verified to resolve together):

| Concern | Choice | Notes |
|---|---|---|
| Kotlin | 2.1.x | K2 compiler; enables Compose Multiplatform and K2 Kotlin/Native |
| Compose Multiplatform | 1.7.x | iOS stable; used for all shared UI |
| Build tools | AGP 8.7.x, Gradle 8.10+ | Android app module only |
| Coroutines / Serialization | kotlinx 1.9/1.7 | everywhere |
| HTTP client | Ktor client 2.3.x (jvm: OkHttp engine; native: Darwin) | shared-data + backend |
| HTTP server | Ktor server 2.3.x (Netty/CIO) | backend + CLI serve |
| DB access | Exposed (JDBC) + HikariCP + Flyway-style SQL migrations | backend |
| AuthN | Argon2 password hashing (DKPro/lambdaworks), JWT (HS256) with rotation, opaque refresh tokens (hashed at rest) | backend |
| Validation | kotlinx-serialization DTOs + explicit server-side validators | backend |
| DI (client) | Koin | shared + android + iOS |
| Navigation | Voyager | CMP-compatible, screen stack model, per-tab stacks |
| Images | Coil 3 (multiplatform) | shared-ui |
| Client cache | SQLDelight 2.x | drama metadata cache, feed cache, drafts |
| Preferences/tokens | multiplatform-settings (Keychain/EncryptedSharedPreferences adapter) | shared-data |
| Testing | kotlin.test, Ktor test host, Testcontainers-style approach via CI Postgres service, Turbine for Flow tests | all |
| CLI framework | Pure Kotlin main + kotlinx-args or manual parser (no heavy framework) | cli |
| Logging | kermit (client) + logback (server) | both |
| Push | FCM HTTP v1 (google-auth lib) + APNs .p8 token adapter — both config-gated | backend services |

Dependency rules: `shared-domain` depends on nothing but stdlib/coroutines/serialization. `shared-data` depends on domain. `shared-ui` depends on both. `backend` mirrors domain semantics with its own Exposed models (no Gradle dependency on shared modules — the REST API is the contract; shared models are generated to match and covered by contract tests). `cli` depends on `backend` internals.

## 5. Backend architecture (Kotlin/Ktor modular monolith)

### 5.1 Principles (from Spec §28–§30)
Modular monolith, one PostgreSQL database, no Redis/queues/microservices (Spec §30). Secrets from environment, never in the mobile bundle (Spec §39 rule 2). Rate limiting in-process (token bucket per identity+route class). Audit logging for privileged actions. Soft deletion / moderation states where policy requires history (Spec §25A).

### 5.2 Module map
Each Ktor `Module` = one feature area with routes, DTOs, service, DAO:

`auth` (signup, login, refresh, logout, password reset, session revocation, email-verification scaffolding) · `users` (profiles, preferences, blocks, mutes, follow lists, account deletion/export) · `follows` (user/drama/actor follows; join/leave community as membership) · `posts` (create/edit/delete, categories, media, drama/episode tags, hashtags, mentions, spoiler metadata, pagination) · `comments` (3-level nesting, spoiler flags, mention parse, reactions) · `reactions` (reaction set: ❤ 🔥 😭 😂 😱 🤍 + counts) · `reposts` & `bookmarks` · `hashtags` · `dramas` (hubs, follow, metadata, genres, status) · `episodes` (episode pages, first-class discussion aggregates, air schedule) · `actors` · `watching` (status: watching/planned/completed/dropped/on-hold, episode progress "watched through Ep N", history) · `spoilers` (server-enforced exposure policy — see §8) · `communities` (create/join/leave, public/private, roles: owner/moderator/member, rules, pin/lock/hide/remove/ban/approve) · `moderation` (reports → classification → severity → automated action per policy thresholds → queue → decision → notify → appeal → audit log) · `verification` (official account requests; badge state; separate from privileges — Spec §15/§26) · `notifications` (in-app feed + WebSocket fan-out + push adapters + per-category/per-drama preferences, quiet hours, deep-link payloads) · `search` (PG full-text + trigram, entity-typed results, ranking by popularity/freshness) · `trending` (velocity scoring job, decays old posts, per-entity windows) · `feeds` (For You ranking rules, Following near-chronological, Home top modules: airing-now, followed-drama updates, episode activity, recommended communities) · `recommendations` (explainable rule-based MVP: interest/follow/watch/engagement overlap scoring; provider interface for later embeddings) · `media` (upload tickets → presigned PUT, image processing/thumbnails, moderation gate, copyright takedown records) · `admin` (permission-gated platform config, moderation screens, audit) · `analytics` (event ingestion from clients, core events per Spec §33, aggregate metrics endpoints) · `sync` (TMDB import + editorial seed import).

### 5.3 API surface (v1, REST/JSON)
Resource-oriented: `/v1/auth/*`, `/v1/me`, `/v1/users/{handle}`, `/v1/posts`, `/v1/posts/{id}`, `/v1/posts/{id}/comments`, `/v1/comments/{id}`, `/v1/reactions`, `/v1/bookmarks`, `/v1/reposts`, `/v1/hashtags/{tag}`, `/v1/dramas`, `/v1/dramas/{slug}`, `/v1/dramas/{slug}/episodes`, `/v1/episodes/{id}`, `/v1/episodes/{id}/discussion`, `/v1/actors/{id}`, `/v1/communities`, `/v1/communities/{slug}`, `/v1/notifications`, `/v1/search`, `/v1/explore`, `/v1/feeds/{for-you|following}`, `/v1/trending`, `/v1/watching`, `/v1/media/*`, `/v1/reports`, `/v1/moderation/*`, `/v1/admin/*`, `/v1/analytics/events`, `/v1/realtime` (WebSocket). Cursor pagination (`?cursor=`) everywhere. Full detail + generated reference in `docs/api/API.md` at M-phase completion.

### 5.4 Database (PostgreSQL)
Plain SQL migrations under `database/migrations/V<N>__*.sql` (executed by Flyway at startup and by CLI `hallyu migrate`). Schema implements the complete Spec §25 entity catalog with §25A rules: explicit join tables (follows, blocks, mutes, drama_genres, drama_cast, post_drama_tags, post_episode_tags, post_hashtags, mentions, community_members, community_roles, watched_episodes), first-class `episode_discussions`, explicit `watching_status`/`watched_episodes` for spoiler safety, media metadata in `post_media` separate from posts, `timestamptz` everywhere, unique constraints (follows, bookmarks, reactions, watched_episodes, community membership), deliberate indexes (user_id, drama_id, episode_id, community_id, post_id, created_at, follower edges, notification recipient, report status, plus FTS/trigram for search and a `trend_score` window table for trending), soft-delete/moderation-state columns (`deleted_at`, `hidden_at`, `moderation_state`) where audit history is required, and `audit_logs` + `moderation_logs`.

Authorization (Spec §25A "design RLS before exposing tables"): because the mobile client never connects directly to Postgres, row-level policy is enforced in the API layer as a documented, testable policy matrix (`database/policies/POLICIES.md`): public profile vs private, blocked-user invisibility, private community membership gating, spoiler exposure rules, moderation visibility, admin/role gates. Each policy has an integration test proving enforcement — satisfying the intent (no unauthorized row access) with the architecture we have (API-mediated access). Where the deployment wants belt-and-braces, the same policies can be applied as true Postgres RLS for a read-replica/admin path; documented in the runbook.

### 5.5 Identity & security
Email+password with Argon2id hashing; JWT access tokens (15 min) + opaque rotating refresh tokens (hashed, device-labeled, revocable per session); account recovery via time-limited single-use tokens (email delivery behind a `Mailer` adapter — console/SMS-gate/SMTP — config-gated, never faked); OAuth scaffolding for Google/Apple behind the same `IdentityProvider` interface, enabled only when credentials exist (documented). Rate limits per identity+route class (auth stricter). Every privileged action audited. No secrets in the client bundle; the client only ever holds the user's access/refresh tokens in the platform keystore.

### 5.6 Spoiler engine (server-enforced — Spec §9)
Every post/comment carries optional `drama_id`, `episode_number` context and `spoiler_level` (none / episode-tagged / explicit-spoiler). At read time the server compares the viewer's `watched_episodes` progress for that drama against the content's episode context and the viewer's spoiler preference (strict / balanced / relaxed). Content beyond progress is returned with `spoilerGuarded=true` and its text/media stripped from the payload; the client renders a reveal card ("Spoilers ahead — Ep 8. You've watched through Ep 6. Show anyway / Never mind"). Reveal is an explicit second fetch with `?reveal=1` (auditable). Mute-drama suppresses all its posts in feeds. AI-assisted detection is a pluggable `SpoilerDetector` (lexicon-based default; optional external model adapter config-gated) that suggests labels at post time — user-editable, never infallible (Spec §9/§19).

### 5.7 Feeds & trending (Spec §5–§6, §17)
For You = explainable score: follow-edge boosts (drama/actor/user/community), watching-progress affinity, engagement overlap (likes/comments/saves/shares), freshness decay, trending momentum — computed in SQL + Kotlin rules, with `reason` strings surfaced in dev mode (Spec §17 explainability). Following = strict graph query, near-chronological (reverse-chron with pinned community announcements). Trending = time-windowed velocity: reactions+comments+repost velocity, unique participants, community spread, freshness decay; recompute every N minutes by an in-process scheduler; one-post-per-drama cap rules to prevent single-viral domination (Spec §6).

### 5.8 Media pipeline (Spec §22, §24)
MVP images only: upload ticket → presigned PUT (local dev disk / S3 prod) → server-side processing (JPEG/WebP variants: full, 1200w, 600w, thumb) → moderation gate (rules + optional AI adapter) → attachable to post. Data model already supports `video` media kind + durations + transcoding-state columns for v1.1 without building the pipeline (Spec §22). Copyright/takedown: `copyright_reports` table + admin flow before any large-scale media expansion (Spec §24). No streaming, no full-episode uploads — enforced by media kind allowlist and file size/type validation.

### 5.9 Notifications & realtime
`notifications` table (category: critical/important/optional; payload with deep-link target) → in-app feed endpoint + WebSocket channel per user for live delivery + push adapters (FCM HTTP v1, APNs .p8) activated only when configured (runbook documents exact remaining configuration, per Spec §54). Per-category, per-drama, per-community settings; quiet hours; mute drama/community (Spec §18). All payloads deep-link (Spec §18 "all notifications should deep-link directly to the relevant content").

### 5.10 Metadata sourcing (Spec §23)
`sync` module: TMDB API client (config-gated `TMDB_API_KEY`) importing titles, synopses, posters, cast, genres, episodes, release info; poster images referenced by TMDB URL at sync time and cached by media pipeline with attribution metadata. Editorial seed dataset (authored, factual, ~15 real dramas with episodes/cast + demo community content, clearly labeled seed) ships in `database/seed/` so the product is fully usable without external keys. No scraping of MyDramaList/AsianWiki or protected sources — ever.

## 6. KMP architecture (shared modules)

### 6.1 Layering
`shared-domain` (pure Kotlin): entities (User, Profile, Drama, Episode, Actor, Post, Comment, Community, Notification, Report…), enums (PostCategory, ReactionKind, WatchStatus, SpoilerLevel, NotificationCategory, ModerationState), repository interfaces, use cases (SignIn, FetchForYou, ToggleFollow, PublishPost, SetWatchedThrough, RevealSpoiler…), spoiler guard logic, domain errors, pagination types. No Android/iOS/framework imports. Compiles to androidTarget, jvmTarget (for fast tests), iosArm64, iosX64.

`shared-data`: `HallyuApi` (Ktor client, kotlinx-serialization, auth interceptor, refresh-on-401 interceptor, error mapping), DTO ↔ domain mappers, repository implementations calling the API, `SessionStore` (tokens in Keychain/EncryptedPrefs), `LocalCache` (SQLDelight: drama metadata, episode lists, feed pages, drafts; TTL'd), `ImageEndpoint` builder (media variant selection), offline-first read paths where the Spec demands resilience (feeds with cached fallback + explicit stale indicator — never silent fake data).

`shared-ui` (Compose Multiplatform): `designsystem/` (tokens, Typography, Theme, primitives: HallyuButton, HallyuCard, Avatar, ChipRow, ReactionBar, SpoilerOverlay, WaveProgress, ErrorState, EmptyState, ShimmerList, TopBar, BottomBar, ImageCarousel, ContextTagRow, SectionHeader…), `navigation/` (Voyager root: auth flow → onboarding → tabbed main root with per-tab stacks; typed deep-link router), `presenters/` (state holders: coroutine-scoped, Flow-driven, single-activity-safe; hand-rolled MVI: immutable `State` data classes + `Intent` sealed classes + `SideEffect`), `screens/` (every screen in Spec §37), `analytics/` (event sink to backend), `resources/` (strings via Kotlin resources, vector art).

### 6.2 State management pattern
One presenter per screen, exposed as `StateFlow<UiState>`; repositories expose `Flow` where live (notifications count, watching progress); optimistic updates for reactions/bookmarks/reposts with rollback on API error (Spec §31 "optimistic reactions where safe"). No second state library — coroutines+Flow only (Spec §29 state rule).

### 6.3 Android app (`androidApp`)
Single-`Activity` app embedding shared-ui root; `HallyuApplication` (Koin init, notification channels, Coil setup); FCM service (token registration → `/v1/me/devices`; receives push → routes to deep-link router); deep-link intent filters for `hallyu://` + universal links; Material theming wrapper; app icons/splash (brand); permissions (notifications, image picker via Photo Picker — no broad storage permission).

### 6.4 iOS app (`iosApp`)
SwiftUI `App` + `ComposeViewController` embedding the shared framework's root `AppRoot`; APNs registration → device token to `/v1/me/devices`; `UNUserNotificationCenter` delegate → deep-link router; Keychain-backed token storage via multiplatform-settings; app icons/splash; Info.plist deep-link/universal-link config.

## 7. CLI architecture (`hallyu`)

Kotlin/JVM, shares backend code, packaged as a runnable distribution (and a `scripts/hallyu` wrapper for `java -jar`). Commands: `setup` (env template, Postgres bootstrap, config doctor) · `migrate` (apply SQL migrations) · `seed [--demo]` (schema + curated drama dataset + optional demo community content) · `serve [--dev]` (run backend; dev profile: pretty logs, seeded DB, permissive CORS) · `smoke-test` (contract-level end-to-end: start server, exercise the Spec §48 journey as API calls — signup → interests → feed → drama → follow → episode → discussion → post → reply → follow fan → join community → notification → spoiler guard → block/report) · `validate-schema` (migrations vs Exposed model consistency + index audit) · `sync-tmdb --query --import` · `create-admin` · `token --user` (mint dev JWT) · `stats` (DB counts, health) · `check-design` (blueprint token lint vs code tokens). Every command is real functionality used by CI and developers — no placeholders.

## 8. Testing strategy (Spec §44)

Backend: unit tests for services (spoiler policy, ranking rules, moderation thresholds, token rotation) + integration tests on real PostgreSQL (GitHub Actions service container + local Postgres) covering every route's authz matrix, spoiler guard, blocks/mutes, community privacy, rate limits, and the full §44 checklist areas. Shared: domain unit tests (multiplatform `kotlin.test`), Flow/Turbine tests for presenters, mappers, spoiler client logic. API contract tests: generated fixture pairs consumed by shared-data tests to guarantee client/server agreement. Smoke: CLI `smoke-test` runs the §48 journey in CI on every push to main. Mobile: presenter tests on JVM; Android instrumented smoke on emulator (CI); iOS framework compile on macOS runner (public repo → free minutes). Manual runbook for real-device checks (Spec §31 low-end Android note).

## 9. CI/CD & release (GitHub Actions)

`backend.yml` (Ubuntu, JDK 17, Postgres 15 service): migrate → validate-schema → test → smoke-test → package fat JAR artifact. `shared.yml`: compile shared-domain/data/ui for Android + iOS targets (Linux runner: android + iosX64 compile checks; macOS runner: iosArm64). `android.yml`: assembleDebug + assembleRelease APK, unit tests, lint. `ios.yml` (macOS): embed framework, `xcodebuild` simulator build. Releases: tagged → APK artifact + iOS archive note. No store upload (no accounts) — documented runbook.

## 10. Development phases (executable, with exit criteria)

Each milestone ends green (CI passing on all four workflows) and is committed/pushed:

- **M0 — Scaffold.** Gradle catalog, all modules compile, CI skeletons, repo docs. *Exit:* empty apps boot shared "Hello Hallyu" on Android emulator + iOS simulator (CI proves compile; local where possible).
- **M1 — Data + identity.** Full §25 schema as migrations, policy matrix doc, auth backend (signup/login/refresh/logout/recovery), session store, `hallyu setup/migrate/seed/serve/token`. *Exit:* backend tests green; smoke covers auth section.
- **M2 — Social core.** Profiles, follows, blocks/mutes, posts (+media, categories, hashtags, mentions, spoiler metadata), comments (3-level), reactions, reposts, bookmarks. *Exit:* §44 Social tests green end-to-end.
- **M3 — Drama graph.** Dramas/actors/episodes + hubs, episode discussions, watching progress + spoiler engine, TMDB sync + seed dataset. *Exit:* §44 Drama tests green; spoiler matrix tests green.
- **M4 — Discovery + feeds.** Explore, search (FTS+trigram), trending velocity, For You + Following, recommendation rules with explanations. *Exit:* §44 discovery paths in smoke test.
- **M5 — Communities + trust.** Communities CRUD/join/moderation roles, reports → moderation pipeline, verification layer, audit logs, notification center + preferences + realtime + push adapters + deep links. *Exit:* §44 Communities/Notifications/Security tests green.
- **M6 — Shared client foundation.** shared-domain/data complete against live API (contract fixtures), session store, cache, presenters, design system in code (tokens per Spec §35A). *Exit:* contract tests green; design tokens lint matches blueprints.
- **M7 — Client: auth + onboarding + main shell.** Splash/welcome/signup/login/recovery; interests→dramas→actors→communities onboarding; 5-tab root. *Exit:* §48 steps 1–4 via app UI on emulator/simulator where CI allows; presenter tests green.
- **M8 — Client: home, explore, search, drama/episode/actor.** Feeds, spoiler overlay UX, drama hub, episode discussion, actor page, search results, hashtag page. *Exit:* §48 steps 5–9 in-app.
- **M9 — Client: create, post detail, comments, reactions.** Composer with tagging/AI-assist hooks/spoiler controls/preview; post detail + 3-level comments + reactions. *Exit:* §48 steps 6–9 fully; media upload real.
- **M10 — Client: communities, notifications, profile, settings, watching.** Community pages + membership; notification center + settings; profile (posts/saved/followers/following/currently watching/communities); settings (account/privacy/notifications/spoilers/blocked/muted/data). *Exit:* §48 steps 10–16 in-app.
- **M11 — Client: moderation & admin surfaces.** Permission-gated moderator queue, report flows, audit view (Spec §37 Moderation). *Exit:* role-gating tests.
- **M12 — Hardening.** Analytics events wired (§33), accessibility pass (§32: labels, dynamic type, contrast, touch targets, reduced motion), performance (lazy lists, image variants, pagination, cache), offline/error/empty states everywhere (§38), security review, real-device runbook. *Exit:* §45 definition-of-done audit per feature; final product test §48 fully green via smoke + manual runbook.
- **M13 — Delivery.** Docs, API reference, runbooks, final validation, tag release candidate.

## 11. Backend↔frontend connection map (selected)

| Screen | Presenter | Repository | API | Table(s) |
|---|---|---|---|---|
| Splash | SessionPresenter | SessionRepo | `POST /v1/auth/refresh` | sessions |
| Onboarding | OnboardingPresenter | InterestsRepo | `PUT /v1/me/interests`, `GET /v1/onboarding/suggestions` | profiles, follows |
| Home | HomePresenter | FeedRepo | `GET /v1/feeds/for-you?cursor`, `GET /v1/feeds/following?cursor`, `GET /v1/home/modules` | posts, follows, watching_status, trend_scores |
| Explore | ExplorePresenter | ExploreRepo | `GET /v1/explore` | dramas, actors, communities, trend_scores |
| Search | SearchPresenter | SearchRepo | `GET /v1/search?q&type` | FTS indexes across entities |
| Drama hub | DramaPresenter | DramaRepo | `GET /v1/dramas/{slug}`, `GET /v1/dramas/{slug}/episodes`, `GET /v1/dramas/{slug}/posts` | dramas, episodes, drama_cast, posts |
| Episode + discussion | EpisodePresenter | EpisodeRepo | `GET /v1/episodes/{id}`, `GET /v1/episodes/{id}/discussion` | episodes, episode_discussions, posts |
| Actor | ActorPresenter | ActorRepo | `GET /v1/actors/{id}` | actors, drama_cast |
| Create | CreatePostPresenter | PostRepo, MediaRepo | `POST /v1/media/tickets`, `POST /v1/posts` | post_media, posts, tags |
| Post detail | PostPresenter, CommentsPresenter | PostRepo | `GET /v1/posts/{id}`, `GET /v1/posts/{id}/comments` | posts, comments |
| Community | CommunityPresenter | CommunityRepo | `GET /v1/communities/{slug}`, `POST /v1/communities/{slug}/membership` | communities, community_members/roles/rules |
| Notifications | NotificationsPresenter | NotificationRepo | `GET /v1/notifications`, `WS /v1/realtime` | notifications, notification_preferences |
| Profile | ProfilePresenter | ProfileRepo, WatchingRepo | `GET /v1/users/{handle}`, `GET /v1/watching` | profiles, watching_status, watched_episodes |
| Settings | SettingsPresenter | SettingsRepo | `PATCH /v1/me`, `PUT /v1/me/notification-preferences`, `/v1/me/spoiler-preferences`, `/v1/me/blocked`, `/v1/me/muted` | user_preferences, blocks, mutes |
| Moderation | ModerationPresenter | ModerationRepo | `GET /v1/moderation/queue`, `POST /v1/reports` | reports, moderation_actions/logs, audit_logs |

## 12. Deliverables of this planning phase

`docs/plans/IMPLEMENTATION_PLAN.md` (this file) · `docs/plans/ARCHITECTURE.md` (detailed system/KMP/backend/CLI architecture) · `docs/plans/SCREEN_NAVIGATION_MAP.md` (every screen, state, and navigation edge) · `docs/plans/DECISIONS.md` (decisions, assumptions, spec conflicts awaiting owner sign-off) · `docs/blueprints/*.png` (complete visual blueprint of the product experience).

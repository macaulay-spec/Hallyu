# Hallyu — System Architecture (Detailed)

> **Status:** Revision 2 — React Native + Expo + Convex, built with the Freebuff AI app builder (owner-confirmed 2026-09-12).
> **Companion docs:** `IMPLEMENTATION_PLAN.md` (build phases), `SCREEN_NAVIGATION_MAP.md`, `DECISIONS.md` (full rationale for every substitution below), `../blueprints/` (visual reference), `hallyu-design-system` skill (UI/UX rules for whichever AI or engineer is building screens).
> **Governing requirements:** Spec §25–§33 (database, permissions, privacy, stack, infrastructure, performance), §39 (safety rules), §45 (definition of done).
> **Supersedes** the KMP/Ktor/Postgres revision of this document in full.

---

## 1. System overview

```
┌──────────────────────────────  SINGLE REPOSITORY (source of truth)  ──────────────────────────────┐
│                                                                                                     │
│   app/ (Expo Router screens)                                                                        │
│   components/ (design-system primitives, NativeWind-styled)                                         │
│   features/ (feed, drama, community, moderation... per-domain hooks + screens)                      │
│         │                                                                                             │
│         │  Convex generated client (typed, from convex/_generated/api)                               │
│         ▼                                                                                             │
│   convex/ (server functions: queries, mutations, actions, crons, schema.ts)                          │
│         │                                                                                             │
│         ├──► Convex reactive document database (schema.ts defines every table + index)               │
│         ├──► Convex file storage (post images, avatars, posters)                                     │
│         ├──► Convex scheduled functions (trending recompute, notification sweep, TMDB sync)          │
│         └──► External adapters (config-gated): Expo Push (FCM/APNs), Resend/SMTP (email), TMDB API   │
│                                                                                                        │
│   Build tool: Freebuff (steered to Expo + Convex output), milestone by milestone, owner-reviewed      │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Architectural invariant (unchanged from the prior revision):** the client never touches a database directly. Every byte of product data flows through a Convex server function, and authorization is decided inside that function — never on the client (Spec §39 rules 3–4). Convex enforces this by construction: there is no client-side query language that reaches the database directly, only calls to named, server-defined functions.

## 2. Backend architecture (Convex)

### 2.1 Process model
Convex is a hosted platform, not a process you run yourself — there's no separate "server" to deploy, scale, or patch (this replaces the prior "modular monolith on Ktor" section entirely). Scheduled work (trending recompute every 15 min, notification digest sweep, TMDB sync, session/token housekeeping) is declared in `convex/crons.ts` and runs on Convex's infrastructure. This satisfies Spec §30's "keep the first production architecture simple, no unnecessary infrastructure" even more literally than the self-hosted plan did — there is no server fleet to operate at all at MVP scale.

### 2.2 Request pipeline
```
Client hook (useQuery / useMutation / useAction)
   → typed call into convex/_generated/api
   → Convex server function (query | mutation | action)
        → auth check (ctx.auth.getUserIdentity()) — first line of every function body
        → business logic + database read/write (ctx.db) or external call (action only)
   → typed result streamed back; useQuery subscribers re-render automatically on any future change
```
There is no separate serialization/DTO-mapping layer to maintain — TypeScript types are shared end-to-end between `convex/schema.ts` and the client automatically. Errors are thrown as typed `ConvexError` values with a stable `code` field (`AUTH_INVALID`, `SPOILER_BLOCKED`, `RATE_LIMITED`, `COMMUNITY_PRIVATE`, `NOT_MEMBER`, …), caught client-side and mapped to the humane copy Spec §38 requires.

### 2.3 Feature modules & dependencies
Organized as one Convex function file per domain under `convex/`: `auth.ts`, `users.ts`, `follows.ts`, `posts.ts`, `comments.ts`, `reactions.ts`, `bookmarks.ts`, `hashtags.ts`, `dramas.ts`, `episodes.ts`, `actors.ts`, `watching.ts`, `spoilers.ts`, `communities.ts`, `moderation.ts`, `verification.ts`, `notifications.ts`, `search.ts`, `trending.ts`, `feeds.ts`, `recommendations.ts`, `media.ts`, `admin.ts`, `analytics.ts`, `sync.ts` (TMDB). Shared helpers (auth guards, the spoiler-stripping filter, rate-limit buckets) live in `convex/lib/` and are imported, never duplicated. Cross-cutting effects (e.g., "post created → check for mentions → queue notification") are handled by calling a shared internal mutation from within the originating mutation — Convex functions can call other Convex functions directly and transactionally, which replaces the prior revision's in-process `DomainEventBus`.

### 2.4 Data access
`convex/schema.ts` is the single source of truth for every table and index — this is the direct equivalent of the prior revision's SQL migrations, except schema changes are applied via `npx convex deploy` rather than a migration runner. Every table from Spec §25 is preserved (see §5 below for the full mapping); relationships that were foreign keys become `v.id("tableName")` fields, and SQL indexes become `.index("by_something", [...])` declarations in the same file. Transactions are automatic within a single mutation — Convex guarantees serializable isolation for every mutation without explicit lock statements.

### 2.5 Config & secrets
Convex environment variables (set via `npx convex env set` or the dashboard, never committed): `TMDB_API_KEY`, `RESEND_API_KEY` (or `SMTP_URL`), `EXPO_ACCESS_TOKEN` (for server-triggered push sends), `SEED_DEMO_CONTENT`. A `npm run doctor` script (Node, run locally or in CI) reports which of these are set and which features will run in "unconfigured — documented" mode as a result — same honesty principle as the prior revision's `hallyu setup` doctor (Spec §54: isolate external dependencies behind adapters, document what's missing, never fake success).

### 2.6 Realtime
Free by construction: any `useQuery` call is a live subscription. A feed screen, a notification badge, and an episode-discussion thread all update in every open client the instant the underlying Convex mutation commits — no separate WebSocket channel, message broker, or client-side cache-invalidation code to write or maintain. This is the single biggest simplification versus both the original Supabase plan and the KMP/Ktor plan.

## 3. Client architecture (Expo / React Native)

### 3.1 Structure
```
app/                        # Expo Router — file-based routes = the screen tree in SCREEN_NAVIGATION_MAP.md
├── (auth)/                 # Welcome, SignUp, Login, AccountRecovery
├── (onboarding)/           # Interests, OnboardingDramas, OnboardingActors, OnboardingCommunities
├── (tabs)/                 # 5-tab root: home, explore, create (modal), notifications, profile
│   ├── home/
│   ├── explore/
│   ├── notifications/
│   └── profile/
├── drama/[slug].tsx        # Drama hub (pushed from anywhere, deep-link target)
├── episode/[id].tsx        # Episode + discussion
├── post/[id].tsx           # Post detail + comments
├── community/[slug].tsx
├── user/[handle].tsx
└── _layout.tsx             # Convex/Auth providers, theme, deep-link config

components/                 # Design-system primitives (Button, Card, Avatar, ChipRow, ReactionBar,
                             # SpoilerOverlay, WaveProgress, ErrorState, EmptyState, ShimmerList, TopBar,
                             # BottomTabBar, ImageCarousel, ContextTagRow, SectionHeader) — see the
                             # hallyu-design-system skill for the exact tokens each of these must use.

features/                   # One folder per domain (feed, drama, community, moderation, settings…),
                             # each holding its screens' hooks (thin wrappers around Convex useQuery/
                             # useMutation calls) — zero business logic in components themselves.

convex/                     # Server functions + schema (see §2 above) — same repo, same deploy.
```

### 3.2 State management pattern
No separate state library. Convex's `useQuery`/`useMutation` hooks *are* the state layer — server state is always live and never needs manual refetching. Local-only UI state (form drafts, composer state, toggle switches) uses plain React `useState`/`useReducer`. Optimistic updates (Spec §31 "optimistic reactions where safe") use Convex's built-in optimistic update API for mutations, with automatic rollback on server error. This satisfies Spec §29's "avoid multiple overlapping state libraries" rule more simply than the prior MVI-presenter pattern did.

### 3.3 Styling & design tokens
NativeWind (Tailwind syntax for RN) driven by one `tailwind.config.ts` holding every token from Spec §35A: gradient `#4A1C6E→#2D6CDF`, coral accent `#FF6B6B`, dark surface `#0F0F0F`, Inter typography with Korean display accents, 12dp corner radius, 16dp spacing grid. The `hallyu-design-system` skill (packaged alongside this doc) contains the full token reference and component-usage rules so that whichever tool or person builds a given screen produces the same visual result as the blueprints.

### 3.4 Image & media
`expo-image` for caching, progressive fade-in, and size-appropriate loading; Convex file storage URLs are requested at the display-appropriate variant (thumb/full/poster) per Spec §31. A `WaveProgress` component (brand wave motif, Spec §35A) is the shared indeterminate-loading indicator across the app.

### 3.5 Push, deep links, platform specifics
`expo-notifications` for registration and receipt; device push tokens are saved via a Convex mutation (`registerDevice`) keyed to the signed-in user. Expo Router's built-in deep-link support handles `hallyu://` and universal-link routes (`drama/{slug}`, `episode/{id}`, `post/{id}`, `community/{slug}`, `user/{handle}`, `hashtag/{tag}`, `notifications`, `watching`) from both a running app and cold start. `expo-image-picker` (or the OS photo picker) handles image selection for the composer with no broad storage permission requested. One codebase targets iOS and Android from `app.json`/`eas.json`; a `--platform web` export is available later at low marginal cost via React Native Web, though the public website remains explicitly out of MVP scope per Spec §0/§21.

## 4. Build tooling (Freebuff)

Freebuff Web is used per-milestone against `IMPLEMENTATION_PLAN.md`'s phase list, explicitly steered to generate **Expo + Convex** code (not its web-only React + Convex default) and, where useful, pointed at this repository directly via its GitHub-repo mode rather than started fresh each time. Because Freebuff runs open-source models rather than frontier ones, every milestone's output is reviewed against Spec §45's definition-of-done and the relevant `SCREEN_NAVIGATION_MAP.md`/`hallyu-design-system` rules before being accepted — this is a speed tool, not a replacement for the review step the plan already required.

## 5. Database schema (summary — full detail in `convex/schema.ts` at build time)

Every entity from Spec §25 is preserved as a Convex table (foreign keys become `v.id(...)` fields; SQL indexes become declared `.index(...)` calls):

`users` (handled partly by the auth provider; app-specific fields live in `profiles`) · `profiles` (userId, handle, displayName, avatarStorageId, bio, isPrivate, isOfficial, verified, interests, spoilerPreference) · `follows` (followerId, targetType: user|drama|actor, targetId) · `blocks` · `mutes` (targetType user|drama|community) · `dramas` (slug, tmdbRef, titles incl. Korean, synopsis, status, genres, releaseSchedule, posterStorageId, backdropStorageId, year, country, ratingCert) · `episodes` (dramaId, number, airAt, title, synopsis, runtime, discussionId) · `actors` (slug, names, photoStorageId, bio) · `dramaCast` (dramaId, actorId, characterName, order) · `watchingStatus` (userId, dramaId, status, updatedAt) · `watchedEpisodes` (userId, episodeId, watchedAt) · `posts` (authorId, kind, category, body, spoilerLevel, dramaId, episodeNumber, repostOfId, communityId, moderationState, counters) · `postMedia` (postId, storageId, position, altText) · `mediaObjects` (ownerId, kind, variants, bytes, sha256, state, attribution) · `postDramaTags` / `postEpisodeTags` / `hashtags` / `postHashtags` / `mentions` · `comments` (postId, authorId, parentCommentId, depth ≤3, body, spoilerLevel, flags) · `commentReactions` / `postReactions` (unique per user+kind+target, enforced via a compound index + a checked-before-insert lookup) · `reposts` · `bookmarks` · `communities` (slug, name, description, avatarStorageId, bannerStorageId, isPrivate, memberCount, createdBy) · `communityMembers` (communityId, userId, role, state) · `communityRules` · `episodeDiscussions` (episodeId, postStreamConfig) · `officialAccounts` (profileId, orgName, kind, verifiedBy) · `verificationRequests` · `notifications` (recipientId, category, type, payload, readAt) · `notificationPreferences` · `reports` (reporterId, targetType, targetId, reason, details, status, severity, aiClass, decidedBy, decidedAt) · `moderationActions` · `moderationLogs` · `auditLogs` · `trendScores` (targetType, targetId, score, windowStart, computedAt) · `analyticsEvents`.

Indexes: `.index("by_created_at")` on `posts` for cursor pagination, `.index("by_drama")`, `.index("by_community")`, `.index("by_recipient_created_at")` on `notifications`, `.index("by_target")` on `follows`, plus Convex's built-in full-text search indexes (`.searchIndex(...)`) on `posts.body` and `dramas.synopsis` in place of the prior Postgres trigram/GIN setup.

## 6. Security architecture (summary)

Auth: Convex Auth (email/password, session management, recovery) or Clerk as a documented drop-in. Every query/mutation begins with `ctx.auth.getUserIdentity()` and an explicit authorization check — there is structurally no path for a client to read or write data without going through that function, which is a stronger default than needing to remember to enable Postgres RLS per table. Role checks (`requireCommunityModerator(slug)`, `requirePlatformModerator`, `requireAdmin`) are shared helper functions imported into every relevant module. Spoiler guard: applied inside the query function itself, before data leaves the server (D-09 in `DECISIONS.md`). Rate limits: token-bucket helper backed by a Convex table, keyed per identity + action class (auth attempts, content writes, search, media uploads). Audit: privileged actions write to `auditLogs`. Client: Convex Auth session tokens stored in `expo-secure-store` (Keychain/EncryptedSharedPreferences under the hood); all traffic over HTTPS/WSS by default (Convex-managed TLS).

## 7. Performance plan (Spec §31)

Cursor-based pagination on every list query; Convex queries are automatically cached and incrementally recomputed, so repeated feed reads are cheap by default; image variants (thumb/full/poster) requested by display context via `expo-image`; optimistic reactions via Convex's optimistic-update API; trending precomputed on a cron rather than at request time; FlashList (or `FlatList` with stable keys + fixed-size media placeholders) for 60fps scrolling with no layout shift; measured on a representative low-end Android device and constrained network per Spec §31, not only on developer hardware.

## 8. Analytics & observability

`analyticsEvents` table populated by a lightweight client event sink calling a Convex mutation; admin-only query functions compute DAU/WAU/MAU, D1/D7/D30 retention, and participation metrics on demand. Convex's built-in dashboard provides function logs, error rates, and performance insights in place of a separate Sentry/log-aggregation setup for MVP; Sentry remains a documented optional addition for crash reporting on the client if wanted later.

## 9. CI/CD, builds & environments (GitHub Actions + EAS — D-22)

**CI gate — `.github/workflows/ci.yml` (every push/PR):** install → `tsc` typecheck → ESLint → Convex function check (`npx convex dev --once` against a dev deployment, or `convex codegen`) → `expo export --platform web` compile smoke. This proves the whole app tree (routes, components, Convex client calls) compiles and every backend function is valid on every commit.

**Native builds — `.github/workflows/eas-build.yml` (dispatch / push to main):** triggers `eas build --platform all --profile preview` (Android APK + iOS simulator archive) via `EXPO_TOKEN`; reports pass/fail. Store-grade production profiles and `eas submit` stay owner-triggered runbook steps. iOS builds require macOS hardware — that is what EAS's managed macOS builders provide; bare GitHub runners cannot build iOS.

**Required credentials (documented, config-gated — Spec §54 honesty rule):** `EXPO_TOKEN` (GitHub secret) for the EAS workflow; `CONVEX_DEPLOY_KEY` only when CI-managed Convex deploys are wanted (deploys currently run from the Freebuff workspace via `npx convex dev` / `npx convex deploy`); Apple Developer Program + Google Play accounts only at store-delivery time. Until configured, each workflow step degrades honestly: CI gates still run, the EAS step reports "not configured."

**Runtime environments:** Dev: `npx convex dev` (live-reloading dev deployment) + `npx expo start` (Expo Go on a real phone; `expo export --platform web` as an additional compile/preview surface). Staging/production: `npx convex deploy` to a production Convex deployment; `eas build --profile production` when the owner is ready. No servers to patch, scale, or provision — Convex and Expo/EAS own that layer (Spec §30).

## 10. What this architecture deliberately does NOT include (and why)

No self-hosted database or backend process (Convex is managed — Spec §30's simplicity principle applies more literally here than in either prior plan), no microservices, no message broker (Convex's function-calls-function model covers MVP-scale cross-cutting effects), no separate REST API layer (the generated Convex client is the contract), no embedding-based recommendations (interface only, per Spec §17/§30), no video transcoding pipeline (schema fields only — Spec §22), no web app (Spec §21 — though the RN codebase makes this cheap to add later if that changes), no third-party public API (Spec §21), no fake push/email/TMDB behavior — every unconfigured external dependency reports its own missing configuration honestly (Spec §54).

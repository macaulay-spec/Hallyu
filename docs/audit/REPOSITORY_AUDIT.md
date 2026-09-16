# Hallyu — Full Repository Audit

> **Date:** 2026-09-16 · **Branch:** `arena/01a0a9cc-hallyu` (from `main` @ `36af7cf`)
> **Method:** every source file read (135 tracked files, ~14.7k LOC), config/CI inspected,
> `npm ci` + `tsc --noEmit` + `vitest run` + `scripts/doctor.mjs` executed, dependency tree and
> Convex wiring traced call-by-call. Source code is treated as the authority wherever it
> disagrees with docs.
> **Purpose:** establish ground truth *before* any production code is touched, per the
> rebuild brief. Nothing in this document changes production code.

---

## 0. Executive summary

Hallyu is **far more complete on paper and on the server than it is in the running app.**

- The **Convex backend is real and substantial**: ~4,500 lines across 27 function modules,
  a complete §25 schema (39 tables), a genuinely well-engineered server-side spoiler engine,
  trending recompute, moderation pipeline, notification centre, rate limiting and seeds.
  It is *not* a mock.
- The **client is wired to that backend** — but only through an environment variable
  (`EXPO_PUBLIC_CONVEX_URL`) that **is not present anywhere in the repo** (no `.env`,
  no `.env.example`, no CI value). With it absent, **51 call sites** degrade to `"skip"`
  and, worse, **two code paths crash** (see B-1, B-2). The app a reviewer installs today
  boots to the Welcome screen and can go no further.
- The **visual layer is the weakest part**: unicode glyphs as icons (`⌂ ⌕ ◔ ◯ `), emoji as
  reactions, a "plum-noir" palette with purple gradients on nearly every surface, and a
  scalloped `WaveEdge` header that fights content rather than framing it. The 19
  `docs/blueprints/*.png` sheets are **AI-generated concept art**, not renders of this code —
  the implemented UI does not look like them.
- Documentation is excellent and unusually honest (`DECISIONS.md`, `OWNER_REQUIREMENTS_
  CHECKLIST.md`, the blueprint consistency audit). The docs *overstate* the client: README
  claims M0–M5 "work now"; in reality M1–M5 work **only against a live Convex deployment
  whose URL is not in the repo**.
- CI is compile-only for the mobile product (`tsc`, `vitest`, `expo export --platform web`).
  The EAS workflow is `workflow_dispatch`-only and `--no-wait`, so **no pipeline ever builds
  or verifies an actual Android artifact**.
- The owner's new direction (this brief) supersedes the Convex decision (D-02): backend
  becomes **Supabase/PostgreSQL**, auth becomes **Supabase Auth + Google**, metadata becomes
  **TMDB → backend → DB → app**. Everything below is evaluated against that target.

**Bottom line:** the product thinking (spec), the data model, the spoiler engine and the
moderation/notification logic are worth carrying forward as *requirements and logic*, not as
Convex code. The client UI is to be redesigned from scratch (the `/design` prototype in this
commit) and the backend is to be rebuilt on Supabase after design approval. Convex is to be
removed once migrated and verified (brief §8).

---

## 1. Inventory

| Area | Files | LOC | Verdict |
|---|---|---|---|
| Product contract | `Hallyu_Final_Integrated_Master_Build_Specification (2).md` | 2,019 | **Working / authoritative.** Spec §1–§54. Still the right product brief; §29's "Supabase" row is now the confirmed backend again. |
| Plans | `docs/plans/*.md` (6) | 721 | **Working.** `ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`, `SCREEN_NAVIGATION_MAP.md`, `DECISIONS.md`, `OWNER_REQUIREMENTS_CHECKLIST.md`, `Hallyu_Blueprint_Consistency_Audit.md`. D-02 (Convex) is now superseded by the owner brief. |
| Visual reference | `docs/blueprints/*.png` (19) + README | — | **Obsolete as design source.** AI-generated concept art (see §4). Kept only as historical product-intent reference; the new coded design supersedes it. |
| Design skill | `docs/plans/hallyu-design-system.skill` | binary | **Obsolete.** A ZIP blob (wrong extension, not diffable, not readable by tooling) containing a markdown skill. Superseded by `/design`. |
| Expo app shell | `app.json`, `index.ts`, `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `global.css`, `tsconfig.json` | — | **Working**, with caveats (§3 C-1…C-4). |
| Client screens | `app/**` (34 routes) | ~4,400 | **Partially implemented.** Fully coded, typechecks, but unusable without a Convex URL; crashes in two paths (B-1/B-2); visual quality below product bar (§4). |
| Client components | `components/ui.tsx`, `PostCard.tsx`, `ReportSheet.tsx` | 1,533 | **Working but to be replaced.** Real, coherent component kit implementing the plum-noir system. Replaced by the `/design` system post-approval. |
| Client libs | `lib/*` (7) | 223 | **Working.** `theme.ts`, `brand.ts`, `copy.ts`, `local-store.ts`, `secure-storage.ts`, `useEnsureProfile.ts`, `art.ts`. `theme.ts`/`tailwind.config.js` duplicate every token by hand (C-3). |
| Convex backend | `convex/**` (27 modules + `_generated`) | ~4,700 | **Working server logic, orphaned in practice.** No deployment URL in repo; cannot be exercised by CI; to be migrated to Supabase then removed. |
| Tests | `tests/spoiler.test.ts`, `tests/policy.test.ts` | 32 tests | **Working.** Pure-logic tests pass. Note: they test `convex/lib/spoiler.ts`/`policy.ts`, which are the pieces worth porting verbatim. |
| CI | `.github/workflows/ci.yml` | — | **Partially working.** Green compile gates; no mobile artifact validation (§5). |
| CI | `.github/workflows/eas-build.yml` | — | **Weak.** Manual dispatch, `--no-wait`, no artifact, no verification (§5). |
| Build config | `eas.json` | — | **Partially working.** `preview` (APK) + `production` (AAB) profiles exist; no `development` client profile, no signing config, no submit config (§5). |
| Tooling | `scripts/doctor.mjs`, `scripts/make-brand-assets.mjs` | — | **Working.** doctor is a good honesty pattern to keep (re-point at Supabase/TMDB/Expo). |
| Assets | `assets/*.png` (4) | — | **Working placeholders.** Procedurally generated wave arcs; fine until final brand art. |

---

## 2. What actually works (verified)

1. **Install / typecheck / tests / doctor** — `npm ci` clean (1,343 pkgs), `tsc --noEmit` exit 0,
   `vitest run` 32/32 pass, doctor reports 6 unconfigured externals honestly.
2. **Convex schema completeness** — 39 tables covering every §25 entity: profiles, follows,
   blocks, mutes, dramas, episodes, actors, dramaCast, watchingStatus, watchedEpisodes, posts,
   postMedia, mediaObjects, hashtags, mentions, comments, postReactions, commentReactions,
   reposts, bookmarks, communities, communityMembers, communityRules, episodeDiscussions,
   officialAccounts, verificationRequests, notifications, notificationPreferences, reports,
   moderationActions, moderationLogs, auditLogs, trendScores, analyticsEvents, configStatus…
   Indexes declared per access pattern. This is a genuine relational design expressed in
   Convex's document model.
3. **Spoiler engine** (`convex/lib/spoiler.ts` + `policy.ts` + `guards.ts`) — pure, unit-tested
   matrix (preference × progress × level), applied server-side before data leaves the query,
   with an audited reveal path. The single best-engineered piece in the repo. Port to
   Postgres/TS as-is (logic, not transport).
4. **Trending** (`convex/trending.ts` + `crons.ts`) — 15-min recompute with velocity, unique
   participants, freshness decay and per-drama/per-author anti-domination caps. Real §6
   implementation. Port the algorithm.
5. **Moderation pipeline** (`convex/moderation.ts`, 504 lines) — report → rule classification →
   severity → one documented auto-action → human queue → decision → notify → appeal → audit.
   Role-gated helpers. Port.
6. **Notifications** (`convex/notifications.ts`) — categories, per-category prefs, quiet hours,
   unread count, episode-release cron sweep, deep links. Port.
7. **Honesty discipline** — no fake buttons, config-gated adapters, curated §38 copy in
   `lib/copy.ts`. A cultural strength to keep.

## 3. What is broken, missing, duplicated or dead

### Blockers (break the product as shipped)

- **B-1 — App crashes on boot without `EXPO_PUBLIC_CONVEX_URL`.** `app/_layout.tsx` only mounts
  `ConvexAuthProvider` when the env var is set; `SessionGate` (same file) unconditionally calls
  `useConvexAuth()`, which is `useContext(ConvexAuthInternalContext)` → `undefined` →
  destructure throws `TypeError`. `app/index.tsx` immediately `<Redirect href="/(tabs)/home">`,
  and `(tabs)/_layout.tsx` renders `<SessionGate>`. Therefore a fresh clone (no `.env`)
  **white-screens**, it does not "boot with honest states" as README/`_layout.tsx` comment claim.
- **B-2 — Auth + onboarding screens crash without a provider.** `login.tsx` / `sign-up.tsx`
  call `useAuthActions()` (same missing context → `signIn` of undefined on submit; the hook
  itself returns undefined and destructures), and `app/(onboarding)/*` call `useQuery(...)`
  with **no `"skip"` guard** — `useQuery` requires a Convex client context. Welcome renders,
  everything past it does not.
- **B-3 — No backend URL is committed or documented as required.** No `.env.example`,
  doctor lists the key but nothing tells a developer to create the file; CI exports it as `""`
  explicitly. Combined with B-1/B-2 this means **no one can run the app end-to-end from the
  repository alone**.

### Partially implemented

- **P-1 — Media upload.** Composer marks image attach "pending the Convex storage pipeline";
  `mediaObjects`/`postMedia` tables exist, `posts.create` accepts no storage ids from the UI.
  Image posts are effectively text-only in the client.
- **P-2 — Push.** Schema + cron exist; no `expo-notifications` dependency at all in
  `package.json` (client registration impossible). Documented honestly, but "in-app inbox
  works" is the only true statement.
- **P-3 — Account recovery** screen exists but email delivery needs `RESEND_API_KEY`
  (unconfigured); dev-mode logs token to dashboard only.
- **P-4 — TMDB.** Adapter + cron + `artUrl()` exist and are config-gated; `TMDB_API_KEY`
  absent, so all art is procedural gradients. Also note: `image.tmdb.org` is currently
  referenced **directly from the client** (`lib/art.ts`), which violates the target
  architecture "TMDB → backend → DB → app" (brief §10).
- **P-5 — Search recents** are device-local only (`lib/local-store.ts`) — acceptable, keep.
- **P-6 — `expo export --platform web`** compiles (CI) but the web build is not a supported
  product surface; it is only a compile smoke.

### Mocked / not real

- **M-1 — `docs/blueprints/*.png`** are AI concept art, not renders (see §4). They shaped the
  current UI but were never produced from code.
- **M-2 — Seed data** (`seed.ts`, `seedSocial.ts`) is fictional by policy (D-05) — correct and
  intended, not a defect; but it lives only in Convex and never runs in CI.

### Duplicated

- **D-1 — Design tokens exist in three places:** `tailwind.config.js`, `lib/theme.ts`
  (manual mirror, "change both together, nowhere else"), and hard-coded hex literals inside
  `(tabs)/_layout.tsx` (`#8B5CF6`, `#726690`, `rgba(23,17,42,0.96)`…), `welcome.tsx`
  (`#2A0A45,#5B21C9,#0C0817`) and `PostCard.tsx`. The D-20 "one place" rule is not met.
- **D-2 — Two visual systems coexist:** the "Spec §35A" tokens (`#0F0F0F`, `#4A1C6E→#2D6CDF`,
  coral `#FF6B6B`) in docs/blueprints/tailwind-comments versus the "plum-noir" retune
  (`#08050F`, `#2A0A45→#2E7CDF`, coral `#FF6B81`) actually shipped in config. Docs disagree
  with code; code wins.
- **D-3 — `features/` folder** is referenced by `tailwind.config.js` content globs and
  `ARCHITECTURE.md` §3.1 but **does not exist**. Screens contain their own query logic
  inline, contradicting the documented "zero business logic in components" rule.

### Dead / obsolete

- **X-1 — `docs/plans/Hallyu_Stack_Decision_Brief.md`** (KMP/Ktor) — self-marked superseded.
  Keep as history or archive; it actively confuses readers today.
- **X-2 — `docs/plans/hallyu-design-system.skill`** — binary ZIP mis-saved as `.skill`.
- **X-3 — `convex/health.ts` `reportStatus`** — no caller in client or CI.
- **X-4 — `lib/copy.ts` `statesMeta`** — unused export.
- **X-5 — `convex/http.ts`** — only needed for Convex Auth endpoints; dies with the migration.
- **X-6 — Old plum-noir UI kit** (`components/ui.tsx` `WaveEdge`, `GlassCard`, `BrandBanner`,
  `BrandHero`) — decorative language being retired by the redesign.

### Incorrectly wired

- **W-1 — Icons are text glyphs.** Tab bar: `⌂  ◔ ◯` and a `+` FAB; hero actions: `⌕`, `🔔`;
  reactions: `❤️🔥😭😂😱🤍`. Renders inconsistently across Android OEM fonts and web; not a
  shipping iconography. `@expo/vector-icons` ships with Expo and is unused.
- **W-2 — `expo-image` absent.** `ARCHITECTURE.md` §3.4 mandates it; client uses RN `Image`
  (no caching/progressive decode) — a §31 performance miss.
- **W-3 — Lists are `ScrollView`, not virtualized.** Home/Explore/Notifications/Profile render
  full feeds in `ScrollView` (no `FlatList`/FlashList) — unbounded memory on long feeds,
  against §31 and the plan's own toolchain table.
- **W-4 — `app/index.tsx` renders UI *and* `<Redirect>` in the same commit** — the splash
  frame is never actually visible; harmless but wrong.
- **W-5 — Notifications deep-link from Home hero** (`Link href="/notifications"`) while the tab
  route is `/(tabs)/notifications` — works only because Expo Router collapses group names;
  fragile and inconsistent with `SCREEN_NAVIGATION_MAP`.
- **W-6 — Create is a *tab*, not a modal sheet** (Spec §19/#23 say modal). Occupies a tab slot
  and renders full-screen; the "sheet" claim in comments is not what ships.
- **W-7 — `BRAND_SUBTITLE` defined at the bottom of `home/index.tsx`** (hoisted const, fine)
  but duplicated tagline strings exist in 4+ files — D-20 violation again.

## 4. Visual/UI assessment (why a redesign is required)

Implemented UI today (read from `components/ui.tsx` + screens):

- Purple-forward "plum-noir": gradient header block on Home, gradient FAB, gradient buttons,
  glass cards on gradients, scalloped wave edge. Reads as a themed demo, not a consumer
  social product; gradient dominates content (violates Spec §35A "do not apply the gradient
  to every surface").
- Typography: serif `Georgia` wordmark + Inter body, but no type-scale discipline beyond 10
  hard-coded variants; tracking/weights inconsistent; no display treatment for Korean.
- Iconography: glyphs/emoji (W-1). No icon set, no consistent stroke weight.
- Cards: 1px borders everywhere (`border-line`) on near-black; heavy corner radii (26px);
  inconsistent spacing (mix of 12/16/18/22px).
- The 19 blueprint PNGs do **not** match this implementation (they show a different, cleaner
  layout with a standard tab bar). They are AI-generated: painterly posters, invented
  inconsistencies (sheet 18's wrong nav, six different taglines, real actors'/networks'
  likenesses used as demo content — flagged already by
  `Hallyu_Blueprint_Consistency_Audit.md` §3). Using them as the design source would import
  both the drift and the likeness/legal problem.
- No light mode (`userInterfaceStyle: "dark"` hard-set), despite DECISIONS assumption 5.

Conclusion: the brief's instruction — design the UI as real code, render it, get approval —
is the correct next step. The new design lives in `/design` (this commit) and touches no
production screen.

## 5. CI/CD & mobile build assessment

- `ci.yml`: install → convex codegen (best-effort, tolerates failure) → vitest → tsc →
  doctor → `expo export --platform web`. **No Android build, no emulator/instrumented test,
  no bundle check.** The "mobile app" is validated only by a web compile.
- `eas-build.yml`: manual dispatch only; `--no-wait` (fire and forget, result never checked);
  requires `EXPO_TOKEN` secret (doctor shows it unset in this environment; presumably set in
  GitHub — must be reused, not replaced).
- `eas.json`: `preview` = internal APK, `production` = AAB + autoIncrement. Missing:
  a `development` profile (dev client), explicit `android.package` signing strategy
  (relies on EAS managed credentials — acceptable but undocumented), no `submit` config,
  no build-number/versioning policy doc.
- `app.json`: `newArchEnabled: true`, `edgeToEdgeEnabled: true`, package `com.hallyu.app`,
  `owner: darasimijags-team`, EAS projectId present. Splash/icon placeholders present.
  `web.output: "single"` (SPA).
- Verdict: to satisfy brief §12 we need CI that (a) typechecks+tests, (b) produces a real
  Android artifact on a schedule/dispatch **and waits for + verifies the result**, and
  (c) keeps a fast web/preview surface for humans. EAS token reuse confirmed as the plan.

## 6. Backend (Convex) assessment vs. target (Supabase)

| Capability | Convex today | Supabase target notes |
|---|---|---|
| Data model | 39 tables, indexed | Translate to Postgres DDL with real FKs, constraints, timestamps, pagination indexes (brief §8). Do **not** copy verbatim; re-express relationally (e.g. polymorphic `follows.targetId: string` becomes typed FKs / table-per-target or discriminator+FK checks). |
| Auth | Convex Auth password provider | Replace with Supabase Auth (email + Google), session persistence, recovery (brief §9). `secure-storage.ts` pattern survives for any native token storage needs. |
| Authorization | in-function guards | Replace with RLS policies + server-side functions (brief §8). Spoiler filtering must stay server-side (SQL/RLS + a security-definer read function or app-side server function). |
| Realtime | free live queries | Supabase Realtime only where useful (brief §8): notification badge, episode discussion liveness — not everything. |
| Storage | `mediaObjects` (schema only) | Supabase Storage buckets + signed URLs, image allowlist, variants. |
| Scheduled jobs | crons (trending, episode sweep, TMDB sync) | pg_cron / Edge Functions cron / GitHub Actions cron — decide at implementation. |
| Full-text search | Convex searchIndex | Postgres FTS (`tsvector`) + trigram for names. |
| File/secret hygiene | good | keep; never service-role key in client (brief §9). |

**Logic to port (high value):** spoiler policy matrix, trending scoring, moderation state
machine, notification fan-out + quiet hours, rate-limit bucket semantics, explainable For-You
signals. **Code to drop:** everything transport-specific (`ctx.db`, `_generated`, auth tables,
`http.ts`).

## 7. Recommended disposition (post-approval)

1. `/design` prototype (this commit) → owner approval.
2. Production UI: replace `app/**` screens + `components/*` with the approved design system,
   adapted (virtualized lists, `expo-image`, real icon set, light mode, modal composer).
3. Backend: greenfield Supabase schema + RLS + Edge Functions; port the six high-value logic
   modules with tests; delete `convex/` once parity is verified by tests + smoke journeys.
4. Auth: Supabase (email + Google), recovery, onboarding.
5. TMDB: server-side sync into Postgres; client never calls TMDB.
6. CI: add real Android artifact validation; keep typecheck/tests/doctor; reuse `EXPO_TOKEN`.
7. Docs: collapse `docs/plans` to current truth; archive KMP brief + `.skill`; regenerate
   visual reference from code (this repo's `docs/design-previews/`).

## 8. Risks & open items for the owner

- R-1: No Convex deployment is reachable from this repo, so M1–M5 behaviour could not be
  exercised end-to-end during the audit; claims about them rest on code reading + unit tests.
  (Moot after the Supabase migration, but stated for honesty.)
- R-2: `EXPO_TOKEN` presence in GitHub secrets must be confirmed before Android CI work.
- R-3: Real posters/actor imagery must come from TMDB (licensed metadata) post-migration;
  prototype art is procedural placeholder only.
- R-4: Blueprint sheets use real people/companies as demo content — must never seed
  production (already policy D-05; keep enforcing).

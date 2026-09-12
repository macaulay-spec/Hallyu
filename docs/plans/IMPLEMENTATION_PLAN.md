# Hallyu — Implementation Plan (Engineering Translation)

> **Status:** Revision 3 — scoped for the confirmed stack and confirmed build pipeline.
> **Source of truth:** `Hallyu_Final_Integrated_Master_Build_Specification (2).md` (referred to below as "the Spec").
> **Scope:** Full MVP as defined by Spec §20 (MVP boundary), §21 (exclusions), §40 (phases), §44 (testing), §45 (definition of done).
> **Confirmed stack (owner, 2026-09-12):** React Native + Expo + TypeScript client, Convex backend, NativeWind styling, Expo Router navigation, GitHub Actions + Expo EAS for CI/CD. See `DECISIONS.md` D-01/D-02/D-18 and `ARCHITECTURE.md`.
> **Supersedes:** the KMP/Ktor/Postgres revision of this document in full.

---

## 1. What this plan is

The Spec is the product contract. This document is the engineering translation: how each requirement becomes a repository layout, Convex functions, Expo screens, tests, and a CI/CD pipeline — scoped to what this project can actually run, where. Nothing here widens the MVP boundary; several items exist only to satisfy Spec §39 product-safety rules (real backend, no mock data, no fake buttons).

## 2. Where everything runs (honest scoping)

| Concern | Where it runs | Notes |
|---|---|---|
| Convex backend (schema, queries, mutations, actions, crons) | Convex cloud (dev + prod deployments) | No self-hosted server. Schema changes apply via `npx convex dev` / `npx convex deploy`. |
| Expo app source (all screens, design system, navigation) | Authored in the Freebuff workspace; typechecked with `tsc` | One codebase targeting Android + iOS (+ web export used as a compile/preview surface). |
| App runtime preview during development | Expo Go on a real phone via `npx expo start` (owner runs locally), plus `expo export --platform web` opened in a browser | Same code; the web export is a development/verification surface, not the product (Spec §21 keeps the public website out of MVP). |
| Automated builds (APK/AAB, iOS) | **GitHub Actions → EAS Build** (Expo's cloud builders) | GitHub-hosted runners cannot build iOS without macOS runners; EAS provides Linux (Android) and macOS (iOS) builders. The GitHub Actions workflow triggers and verifies EAS builds. |
| Store delivery | `eas submit` (later) | Requires the owner's Apple Developer Program and Google Play accounts — runbook step, not assumed. |
| Push notifications | Expo Notifications → FCM/APNs, triggered from Convex | Config-gated adapters; honest "unconfigured" reporting (Spec §54). |

## 3. Repository / file structure

```
Hallyu/                                        # repository root
├── Hallyu_Final_Integrated_Master_Build_Specification (2).md   # UNTOUCHED product contract
├── README.md
├── .github/workflows/
│   ├── ci.yml                                 # typecheck + lint + Convex function check + web-export compile smoke
│   └── eas-build.yml                          # dispatch/trigger EAS builds (Android/iOS) + status report
├── docs/
│   ├── plans/                                 # this document set
│   ├── blueprints/                            # visual reference (README catalog + sheets)
│   └── runbooks/                              # keys, TMDB, push, EAS, store delivery
├── app/                                       # Expo Router — file-based routes = SCREEN_NAVIGATION_MAP.md tree
│   ├── (auth)/                                # welcome, sign-up, login, account recovery
│   ├── (onboarding)/                          # interests → dramas → actors → communities → done
│   ├── (tabs)/                                # home, explore, notifications, profile (+ create modal)
│   ├── drama/[slug].tsx                       # drama hub (deep-link target)
│   ├── episode/[id].tsx                       # episode + first-class discussion
│   ├── post/[id].tsx                          # post detail + 3-level comments
│   ├── community/[slug].tsx
│   ├── user/[handle].tsx
│   ├── hashtag/[tag].tsx
│   └── _layout.tsx                            # Convex provider, auth gate, theme
├── components/                                # design-system primitives (NativeWind; tokens per Spec §35A)
├── features/                                  # per-domain hooks wrapping Convex clients; zero business logic in components
├── lib/                                       # brand.config.ts, theme, deep-link map, error-code → copy mapping
├── convex/                                    # server functions + schema.ts (single source of truth for data)
│   ├── lib/                                   # auth guards, spoiler-stripping filter, rate-limit buckets
│   ├── crons.ts                               # trending recompute, notification sweep, TMDB sync
│   └── ...one module per domain (users, posts, dramas, communities, moderation, ...)
├── scripts/
│   └── doctor.mjs                             # config honesty check: reports which env keys are set / features unconfigured
└── app.json / eas.json                        # Expo + EAS project config (scheme `hallyu://`)
```

## 4. Toolchain & dependency plan

| Concern | Choice | Notes |
|---|---|---|
| Runtime | Expo SDK (latest stable), TypeScript strict | Spec §29 as written. |
| Navigation | Expo Router (typed routes) | 5-tab + stacks + modal + deep links native (`hallyu://` + universal links). |
| Styling | NativeWind | One `tailwind.config.ts` holding every Spec §35A token; centralized, tunable (D-06/D-20). |
| Backend | Convex | Queries/mutations/actions + crons; typed end-to-end; no REST layer (D-08). |
| Auth | Convex Auth (email/password) | Clerk documented as drop-in (D-05 in `DECISIONS.md`, E-5). |
| Images | `expo-image` + Convex file storage | Display-appropriate variants; ≤10MB, JPEG/PNG/WebP allowlist (D-12). |
| Lists | FlashList (fallback FlatList) | 60fps scrolling target per Spec §31. |
| Push | `expo-notifications` | Device tokens registered via Convex mutation; sends config-gated (D-03). |
| State | Convex `useQuery`/`useMutation` + local React state | No separate state library; optimistic updates via Convex's built-in API (D-09, Spec §29/§31). |
| Testing | Vitest/Jest unit tests + Convex test deployment; `expo export` web as compile smoke in CI | Real Convex backend in tests — no mocked database layer (D-17). |
| Lint/format | ESLint + Prettier | Part of CI gate. |
| CI/CD | GitHub Actions + EAS Build | See §12. |
| CLI helper | `scripts/doctor.mjs` | Reports configured vs unconfigured external deps honestly (Spec §54). |

## 5. Convex backend architecture (summary — full detail in `ARCHITECTURE.md`)

- `convex/schema.ts` implements **every entity from Spec §25** as a Convex table with declared `.index(...)` definitions replacing SQL indexes and `.searchIndex(...)` on `posts.body` / `dramas.synopsis` replacing Postgres FTS/trigram.
- Every function begins with `ctx.auth.getUserIdentity()` + explicit authorization (Spec §39 rules 3–4, D-10). Role helpers: `requireCommunityModerator`, `requirePlatformModerator`, `requireAdmin` — community moderation never grants platform privileges (Spec §14/§26).
- **Spoiler engine (server-enforced, Spec §9 / D-10):** at read time the query compares the viewer's `watchedEpisodes` progress against the content's drama/episode context and spoiler preference; guarded payloads have text/media stripped server-side. Reveal is an explicit, audited second call.
- **Trending (D-11):** cron recomputes `trendScores` every 15 min — velocity, unique participants, freshness decay, per-drama caps. For You = explainable weighted signals with a `reason` string per item (Spec §17).
- **Rate limiting (D-21):** token-bucket helper backed by a Convex table, keyed identity + action class.
- **Media (D-12):** images only in MVP via Convex storage; `kind: "video"` + transcode-state fields exist in schema only; honest "video — coming in v1.1" chip in the composer.
- **Adapters (D-03/D-04/D-05):** push (Expo Notifications), email (Resend/SMTP), TMDB sync — all config-gated; `doctor.mjs` reports exactly what is missing; the app never fakes success.

## 6. Development phases (scoped, with exit criteria)

Each milestone ends green: `tsc` clean, lint clean, CI workflow passing on GitHub Actions, and the milestone's exit criteria demonstrably met before moving on.

- **M0 — Scaffold.** Expo app + Convex project wired (providers, auth gate), design tokens centralized per Spec §35A (dark `#0F0F0F`, gradient `#4A1C6E→#2D6CDF`, coral `#FF6B6B`, Inter, 12px radius, 16px grid, wave loading motif), router tree from `SCREEN_NAVIGATION_MAP.md` with placeholder-free but minimal screens, `ci.yml` + `eas-build.yml` workflows live. *Exit:* app boots in Expo Go; web export compiles in CI; typecheck clean.
- **M1 — Data + identity.** Full §25 schema in `convex/schema.ts`; Convex Auth signup/login/logout/recovery; profiles + handles; onboarding flow (interests → dramas → actors → communities → done, Spec §34). *Exit:* §44 auth tests green; onboarding journey works end-to-end against real Convex data.
- **M2 — Social core.** Posts (5,000 chars, categories, drama/episode tags, hashtags, mentions, spoiler metadata, ≤4 images), 3-level comments, ❤🔥😭😂😱🤍 reactions with optimistic updates, reposts, bookmarks, follow graph (user/drama/actor), blocks/mutes, rate limits. *Exit:* §44 social tests green end-to-end; feeds render from real data.
- **M3 — Drama graph + spoiler engine.** Dramas/episodes/actors/cast, drama hubs, episode discussions as first-class objects, Currently Watching progress editor, **server-side spoiler stripping + audited reveal**, fictional editorial seed dataset (D-05 rule: fictional-only), TMDB sync adapter (config-gated). *Exit:* §44 drama tests green; spoiler matrix tests green (strict/balanced/relaxed × progress states).
- **M4 — Discovery.** Explore rails, entity-typed search, trending (cron-computed), For You with `reason` strings, Following feed, Home top modules (Airing Now, Drama Updates, Episode Activity, Communities for you). *Exit:* §44 discovery paths green in smoke test; anti-domination caps verified.
- **M5 — Communities + trust.** Public/private communities (join-request flow), moderator role powers (pin/lock/hide/remove/ban/approve), report → classification → severity → automated action per thresholds → queue → decision → notify → appeal → audit log, verification badges (never privileges), notification center with per-category/per-drama prefs + quiet hours, deep links for all notification types. *Exit:* §44 communities/notifications/security tests green; role-gating proven.
- **M6 — Hardening + delivery.** Analytics events (Spec §33) + aggregate metrics, accessibility pass (Spec §32), performance pass (Spec §31: lazy lists, image variants, pagination, low-end Android target), §38 states everywhere with verbatim copy, security review, EAS release runbook (build + distribute APK to owner; store submission stays a documented owner step). *Exit:* §45 definition-of-done audit per feature; §48 final product test answered yes end-to-end.

**Deliberately excluded from all milestones (Spec §21):** DMs, video pipeline, polls, live streaming, monetization, public web app, third-party public API, marketplace — appearing only as schema fields or honest "coming in v1.1" chips.

## 7. Screen ↔ backend connection map (selected)

| Screen | Feature hooks | Convex functions | Table(s) |
|---|---|---|---|
| Home (For You/Following) | `features/feed` | `feeds.forYou`, `feeds.following`, `feeds.homeModules` | posts, follows, watchingStatus, trendScores |
| Explore / Search | `features/discovery` | `search.all`, `trending.list`, `dramas.explore` | dramas, actors, communities, trendScores |
| Drama hub | `features/drama` | `dramas.getBySlug`, `episodes.listForDrama`, `follows.toggleDrama` | dramas, episodes, dramaCast, posts |
| Episode discussion | `features/drama` | `episodes.getDiscussion`, `posts.create` | episodeDiscussions, posts, comments |
| Composer | `features/compose` | `posts.create`, `media.requestUpload` | posts, postMedia, hashtags, mentions |
| Post detail | `features/post` | `posts.get` (spoiler-filtered), `comments.*`, `reactions.toggle` | posts, comments, postReactions |
| Community | `features/community` | `communities.*`, `moderation.*` | communities, communityMembers, communityRules |
| Notifications | `features/notifications` | `notifications.list`, `notifications.markRead` | notifications, notificationPreferences |
| Profile / Watching | `features/profile` | `users.getByHandle`, `watching.setStatus`, `watching.markWatched` | profiles, follows, watchingStatus, watchedEpisodes |
| Moderation queue | `features/moderation` | `moderation.queue`, `moderation.decide`, `reports.create` | reports, moderationActions, moderationLogs, auditLogs |

## 8. Testing strategy (Spec §44)

Unit tests for Convex function logic (spoiler policy, ranking rules, moderation thresholds, rate limits) against a real Convex test deployment — no mocked database. Contract is type-checked end-to-end by the generated Convex client. Client presenter/hook tests for state machines (loading/content/empty/error per screen). CI compiles the web export as an integration smoke of the whole app tree. The §48 journey is walked manually in Expo Go per milestone and recorded in the runbook.

## 9. CI/CD & release (GitHub Actions + EAS)

- **`ci.yml` (every push/PR):** install → typecheck (`tsc`) → lint → Convex function check → `expo export --platform web` compile smoke. This proves the entire app tree (routes, components, Convex client calls) compiles and the backend functions are valid on every commit.
- **`eas-build.yml` (dispatch / push to main):** triggers `eas build --platform all --profile preview` (Android APK + iOS simulator build for device-free testing), waits for result, posts status. Store-grade builds (`--profile production`) and `eas submit` are owner-triggered runbook steps.
- Required GitHub secrets for the EAS workflow: `EXPO_TOKEN` (+ optional `EAS_WEBHOOK_SECRET`). Required Convex deploy keys for managed deploys from CI: `CONVEX_DEPLOY_KEY` (documented in runbooks; not needed while the Freebuff workspace runs `convex dev`).
- Releases: tagged → APK artifact downloadable from EAS; iOS TestFlight path documented for when the Apple account exists.

## 10. Definition of done per feature (Spec §45)

UI exists · database exists · permissions exist · backend logic exists · loading state exists · error state exists · empty state exists · analytics where appropriate · accessibility addressed · security addressed · end-to-end flow works. A button that opens nothing is not a feature; a beautiful screen backed by fake JSON is not a production application.

## 11. Deliverables of this planning phase

`docs/plans/IMPLEMENTATION_PLAN.md` (this file) · `docs/plans/ARCHITECTURE.md` · `docs/plans/SCREEN_NAVIGATION_MAP.md` · `docs/plans/DECISIONS.md` · `docs/plans/OWNER_REQUIREMENTS_CHECKLIST.md` · `docs/blueprints/` (visual reference).

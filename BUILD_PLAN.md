# Hallyu — Kotlin / Jetpack Compose Build Plan (v1)

> **Source of truth:** `Hallyu_Final_Integrated_Master_Build_Specification (2).md` (product/architecture/DB/phases).
> **Stack override (locked):** the spec's "React Native + Expo" is replaced with **Kotlin + Jetpack Compose (native Android)**. No Expo, ever. iOS door stays open via **Kotlin Multiplatform (KMP) later** — never via Expo/RN.
> **Design:** `design/DESIGN_SYSTEM.md` + `design/mockups/` (32 screens).

---

## 1. Technology stack (final)

| Layer | Choice |
|---|---|
| Language | Kotlin 2.x |
| UI | Jetpack Compose + Material 3 (Compose BOM) |
| Build | Gradle Kotlin DSL + version catalog (`libs.versions.toml`), AGP 8.x |
| Architecture | MVVM + unidirectional data flow (`StateFlow`), sealed UI states |
| DI | Hilt |
| Navigation | Navigation Compose + deep links (notifications → content) |
| Networking | Supabase Kotlin client (`supabase-kt`: postgrest/auth/realtime/storage) + OkHttp |
| Local cache | Room (drama metadata, watch progress, post cache) + DataStore (prefs) |
| Images | Coil |
| Serialization | kotlinx.serialization |
| Notifications | FCM (Android); APNs later via KMP shared layer |
| Observability | Sentry + Firebase Analytics |
| CI/CD | GitHub Actions (build, test, lint) → Play / Firebase App Distribution |
| minSdk | 26 (Android 8.0) |

---

## 2. Module layout (KMP-ready by construction)

```
:app                      Compose UI, navigation, DI wiring, Android entry
:core:designsystem        Color/Type/Shape/Spacing tokens + §5 components
:core:common              pure Kotlin utils (platform-agnostic)
:core:domain              entities, use cases, repository interfaces (NO Android imports)
:core:data                Supabase + Room implementations, mappers, sync
```

**iOS door:** `core:common`, `core:domain`, `core:data` are written **without Android dependencies** so they lift into a future `:shared` KMP module unchanged. Only `:app` + `:core:designsystem` (Compose UI) are Android-tied today.

---

## 3. Data flow

```
Compose screen ──intent──▶ ViewModel ──▶ UseCase ──▶ Repository ──▶ DataSource
      ▲                      │                                        │
      └── StateFlow<UiState> ◀──── StateFlow<Domain> ◀── result ◀─────┤
                                                      (Supabase │ Room)
```

- Every screen exposes `sealed interface UiState { Loading, Success, Error, Empty }` — spec §38 is enforced structurally, not by convention.
- Optimistic UI for reactions/follows (rollback on failure).
- Room-first reads for feeds/drama metadata; Supabase Realtime invalidates + refetches.

---

## 4. Backend & security (Supabase)

- **Auth:** Supabase Auth (email/password + Google + Apple), session persistence, refresh handling.
- **Data:** PostgreSQL with versioned migrations in `supabase/migrations/` (reproducible, not hand-edited in console).
- **RLS:** designed **before** any client exposure (§25A) — every table gets a policy; privileged/admin paths run only through **Edge Functions** with the service key (never shipped in the app).
- **Storage:** post images via Supabase Storage (signed/RLS-protected).
- **Realtime:** post/comments/reactions/notifications channels.
- **Moderation:** Edge Function for AI assist (spam/toxicity/spoiler hints) → human review queue; AI never sole authority (§39.13).
- **Secrets:** `SUPABASE_URL` + `SUPABASE_ANON_KEY` via `BuildConfig`; `SUPABASE_SERVICE_KEY`, TMDB key, etc. **server-side only** (Edge Functions / CI secrets).

### Core tables (from spec §25, improved not copied)
`users · profiles · user_preferences · follows · blocks · mutes`
`dramas · episodes · actors · drama_cast · drama_genres`
`watching_status · watched_episodes` (drives spoiler safety)
`posts · post_media · post_drama_tags · post_episode_tags · hashtags · post_hashtags · mentions`
`comments · comment_reactions · post_reactions · reposts · bookmarks`
`communities · community_members · community_roles · community_rules`
`episode_discussions` (first-class, not a tag)
`official_accounts · verification_requests`
`notifications · notification_preferences`
`reports · moderation_actions · moderation_logs · audit_logs`

---

## 5. Screens → phases (all 32 mockups)

| Phase | Screens |
|---|---|
| **0 Foundation** | 01 Splash, 02 Welcome, 03 Sign up, 04 Login, 05 Recovery, 31 Settings (scaffold), design system, nav shell, analytics |
| **1 Core social** | 11 For You (shell), 12 Following (shell), 14 Create, 16 Profile, 17 Post detail, 18 Comments, 26 Saved, 27 Followers, 28 Following |
| **2 K-drama graph** | 19 Drama hub, 20 Episode page, 21 Episode discussion, 22 Actor page, 29 Currently watching, 06–10 Onboarding (dramas/actors) |
| **3 Discovery** | 13 Explore, 24 Search results, 25 Hashtag page, 11/12 For You + Following ranking |
| **4 Communities** | 23 Community page, 30 My communities, 09 Onboarding (communities) |
| **5 Trust & retention** | 15 Notifications, 32 Moderation queue, spoiler engine, 31 Settings (full) |
| **6 Hardening** | all screens — perf, a11y, tests, release |

---

## 6. Phase plan (spec §40, executed in order — no skipping)

- **Phase 0 — Foundation:** Gradle scaffold, version catalog, Hilt, Navigation Compose + deep links, design tokens, Supabase client, auth (email + social), env config, migrations + RLS, analytics foundation, error handling. ✅ *Gate: sign-up/login/logout/session-recovery E2E.*
- **Phase 1 — Core social:** profiles, follows, posts, images, comments, reactions, reposts, bookmarks, mentions, hashtags. ✅ *Gate: post → comment → react → repost → bookmark loop on device.*
- **Phase 2 — K-drama graph:** dramas, actors, episodes, drama hubs, episode discussions, watching progress, follows, TMDB metadata sync (legitimate API only — no scraping, §23/§39.14). ✅ *Gate: follow drama → episode discussion → post reaction.*
- **Phase 3 — Discovery:** Explore, search, trending, For You, Following, explainable recommendation rules (§17 — no ML platform). ✅ *Gate: search + ranked feed.*
- **Phase 4 — Communities:** create, join, private/public, moderators, rules, community feeds. ✅ *Gate: create → join → post → moderate.*
- **Phase 5 — Trust & retention:** reports, blocks, mutes, moderation queue, verification, spoiler engine, notifications, deep links. ✅ *Gate: report → review → notify; spoiler boundary holds (Ep 6 user never sees Ep 8 unflagged).*
- **Phase 6 — Hardening:** performance (low-end Android + constrained network, §31), accessibility audit, analytics, Sentry, tests, security review, release builds.

Out-of-MVP (DMs, video, monetization, web, marketplace, live streaming) stays out — §21.

---

## 7. Definition of done (per spec §45)

A screen is done only when: UI + DB + permissions + backend + loading/error/empty states + analytics + a11y + security + real-device pass + E2E flow all exist. **A button that opens nothing is not a feature; a screen fed by fake JSON is not production** (§46).

---

## 8. Environment & open prerequisites

- **Sandbox toolchain:** no Java/Gradle/Android SDK here → project is scaffolded as source; **GitHub Actions** performs build/test/lint. (Check `git remote` = `github.com/macaulay-spec/Hallyu`.)
- **Needed before integration testing:** a Supabase project (URL + anon key), TMDB API key, Firebase project (FCM + Analytics), Play Console signing. Each is isolated behind a clean adapter with documented remaining config (§54) — nothing faked.

---

## 9. Next steps (pending your go)

1. Scaffold the Gradle project (module layout §2, version catalog, design-token sources).
2. Author Supabase migrations + RLS.
3. Implement Phase 0 (auth E2E) — first real vertical slice.

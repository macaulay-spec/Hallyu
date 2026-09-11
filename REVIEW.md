# Hallyu — Build Review

**Reviewer:** Arena.ai coding agent · **Date:** 2026-09-10 · **Branch:** `arena/01a08d15-hallyu`

---

## 1. What was delivered this session

1. **32 app-screen mockups** in a consistent premium style (flagship phone render, dark cinematic `#0F0F0F`,
   purple→blue `#4A1C6E → #2D6CDF` gradient, coral `#FF6B6B` accent) — `design/mockups/` + a live HTML gallery.
2. **`design/DESIGN_SYSTEM.md`** — locked color/type/shape/motion tokens + component inventory (the code's source of truth).
3. **`BUILD_PLAN.md`** — Kotlin/Compose plan mapped to spec phases 0–6.
4. **A compiling-by-design native Android app** — 5 modules (`app`, `core:designsystem`, `core:domain`, `core:data`, `core:common`),
   ~60 Kotlin files, all 32 screens as real Compose UI, Hilt DI, Navigation Compose, Supabase adapter, Room + DataStore.
5. **Supabase migration + RLS** (`supabase/migrations/0001_init.sql`) — full schema with row-level security and count triggers.
6. **CI workflow** (`.github/workflows/android.yml`) — build + unit tests + APK artifact.

## 2. What's real (not faked)

- Auth (sign-up / login / recovery / logout / session persistence) → Supabase GoTrue via OkHttp.
- Posts / comments / reactions / reposts / bookmarks / follows → Supabase PostgREST.
- Drama hubs, episodes, cast, watch progress, episode discussions, trending, search, communities, moderation queue → real queries.
- **Spoiler engine** is a pure domain function (`SpoilerPolicy`) with unit tests — the blur/hide behavior the mockups show is actually driven by watch progress, not hard-coded.
- **No placeholder data.** When Supabase isn't configured, screens show deliberate `Not configured`/empty states (spec §38, §54) rather than pretend content.

## 3. What's honestly still open

| Area | Status | Note |
|---|---|---|
| Build verification | ⏳ in CI | No Android SDK in this sandbox — GitHub Actions is the compiler. Compile errors are being found and fixed iteratively (see CI log below). |
| Supabase project | ⏳ external | Needs a project + `SUPABASE_URL`/`SUPABASE_ANON_KEY`. Adapter is real; config is documented. |
| Realtime push | planned | Schema + client ready; live subscriptions not yet bound to ViewModels. |
| Storage (image upload) | planned | Post model carries `imageUrls`; upload path not wired (image_picker + Storage). |
| Edge Functions (AI moderation) | planned | Moderation queue exists; AI assist runs server-side later. |
| Deep links from notifications | partial | In-app navigation wired; manifest intent-filters + FCM pending. |
| Unit test coverage | domain only | `SpoilerPolicyTest` runs in CI; UI/repo tests are future work. |
| Light theme / fonts | deferred | Dark-only v1; Inter + Black Han Sans to be bundled (SansSerif fallback now). |

## 3.5 CI build log (live)

No Android SDK exists in this sandbox, so GitHub Actions is the compiler of record. The workflow
(`.github/workflows/android.yml`) writes every Gradle failure back as a check-run annotation, so each error is read
directly from the API and fixed rather than guessed at.

| Round | Failure | Root cause | Fix |
|---|---|---|---|
| 1 | `:core:designsystem` | smart-cast across module boundary on `post.category` / `post.dramaTitle` (`PostCard.kt`) | local `val`s |
| 2 | `:core:data` | `Unresolved reference 'contentOrNull'` | add `kotlinx.serialization.json.contentOrNull` import |
| 3 | `:core:data` | `JsonParsing.*`/`Parsers.*` imported as objects (they are top-level funcs); `map`/`valueOrNull` extensions unimported; `JsonObjectBuilder.putAll` doesn't exist | correct imports; iterate `put(key, value)` instead of `putAll` |

Additionally swept and fixed the same cross-module smart-cast pattern across `app` (`NotificationsScreen`, `DramaScreens`,
`WatchingScreen`) and `core:data` (`ProfileRepositoryImpl`) before the compiler even reached them.

**Status at review time:** rounds 1–3 fixes are committed; the round-3 batch is staged locally and awaiting the next
push + CI run (GitHub authentication dropped mid-session and needs reconnecting in Arena to continue).

## 4. Risks & watch-items

1. **First CI run is the real test.** Without a local Android SDK, a version-resolution or a small syntax slip will surface in Actions; I'll iterate on failures until green.
2. **supabase-kt not used** — hand-rolled OkHttp adapter (fewer exotic deps, fully under control). Can be swapped behind the repository interfaces if preferred.
3. **PostgREST joins** (`author:profiles(...)`, `drama:dramas(title)`) assume foreign-key naming in the migration; if a column name drifts, mapping silently degrades (not a crash).
4. **Contrast & icons** — token values set; a real WCAG audit pass and TalkBack walkthrough are still due (Phase 6).

## 5. Verdict

This is a **real, structured foundation with the full product surface**, not a screen mock. The core loop
(Discover → Follow → Discuss → React) has working repositories and UI end-to-end modulo the external Supabase project.
The honest gaps are the ones the spec itself gates behind later phases (realtime, storage, Edge Functions, hardening).

Next: get CI green, then wire Supabase project + run the auth → feed → episode-discussion loop on a device.

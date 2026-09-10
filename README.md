# Hallyu (한류) — Where the Wave Lives

A mobile-first social network for K-drama fandom, built as a **native Android app in Kotlin + Jetpack Compose**.

> **Stack note:** the master spec (`Hallyu_Final_Integrated_Master_Build_Specification (2).md`) names React Native + Expo.
> Per product decision, this build is **Kotlin + Jetpack Compose (native Android)** — **no Expo**. The architecture is written
> KMP-ready so the iOS door stays open via Kotlin Multiplatform later.

## Repo layout

```
Hallyu/
├─ app/                     Android app (Compose UI, navigation, DI, screens)
├─ core/
│  ├─ designsystem/         Design tokens + shared components (the mockup system in code)
│  ├─ domain/               Pure Kotlin: models, repository contracts, use cases, SpoilerPolicy
│  ├─ data/                 Supabase (PostgREST/GoTrue) adapter + Room cache + DataStore
│  └─ common/               AppResult / AppError
├─ design/
│  ├─ mockups/              32 screen mockups (PNG + previews + gallery index.html)
│  └─ DESIGN_SYSTEM.md      Locked design tokens (source of truth for the UI)
├─ supabase/migrations/     Reproducible Postgres schema + RLS
├─ BUILD_PLAN.md            Phase 0–6 build plan
└─ .github/workflows/       CI (build + unit tests + APK artifact)
```

## Architecture

- **MVVM + unidirectional data flow** — Compose screen → ViewModel → use case → repository → (Supabase | Room).
- **DI:** Hilt. **State:** `StateFlow`/Compose state. **Serialization:** kotlinx.serialization.
- **Backend:** Supabase (Auth, PostgREST, Realtime-ready, Storage-ready) with row-level security. Privileged paths go through Edge Functions, never the client.
- **Local:** Room (drama/episode/watch-progress cache) + DataStore (session, settings).
- **Spoiler engine:** domain `SpoilerPolicy` drives blur/hide per watched-through-episode (§9) — pure & unit-tested.

## Build

```bash
./gradlew :app:assembleDebug
./gradlew testDebugUnitTest
```

Configure the backend via Gradle properties (or CI secrets) — never committed:

```bash
./gradlew :app:assembleDebug -PSUPABASE_URL=https://YOUR-PROJECT.supabase.co -PSUPABASE_ANON_KEY=your-anon-key
```

Without these, the app builds and runs and shows deliberate `Not configured` states (spec §38, §54) instead of faking data.

## CI

`.github/workflows/android.yml` runs on push: JDK 17 → Android SDK → `assembleDebug` → unit tests → uploads the debug APK as an artifact.

## Progress

Phase 0 (foundation: scaffold, design system, navigation, Supabase adapter, auth, migrations + RLS) and the full
32-screen UI surface are implemented. Core-loop repositories (auth, posts, comments, reactions, follows, dramas,
episodes, watch progress, notifications, search, communities, moderation) are wired to real Supabase calls.
See `REVIEW.md` for the honest build review and what remains for production hardening.

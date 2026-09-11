# Hallyu (한류) — Where the Wave Lives

A mobile-first social network for K-drama fandom, built as a **native Android app in Kotlin + Jetpack Compose**.

> **Stack note:** the master spec (`Hallyu_Final_Integrated_Master_Build_Specification (2).md`) names React Native + Expo.
> Per product decision, this build is **Kotlin + Jetpack Compose (native Android)** — **no Expo**. The architecture is written
> KMP-ready so the iOS door stays open via Kotlin Multiplatform later.

> **v2 direction:** frontend-first at an **Apple level of polish**. No backend, no network — the app is populated by an
> in-memory mock catalog so every one of the 32 screens can be explored and previewed immediately. See `BLUEPRINT.md`.

## Repo layout

```
Hallyu/
├─ app/                     Android app (Compose UI, navigation, DI, screens)
├─ core/
│  ├─ designsystem/         Apple-level design system: stage/glow, glass, gradient art, type
│  ├─ domain/               Pure Kotlin: models, repository contracts, use cases, SpoilerPolicy
│  ├─ data/                 In-memory mock catalog + mock repository implementations
│  └─ common/               AppResult / AppError
├─ design/
│  ├─ mockups/              32 screen mockups (PNG + previews + gallery index.html)
│  ├─ brand/                Apple-level app icon master + density variants
│  └─ DESIGN_SYSTEM.md      Locked design tokens (source of truth for the UI)
├─ BLUEPRINT.md             The Apple-level build contract (what the app is built to match)
├─ BUILD_PLAN.md            Phase 0–6 build plan
└─ .github/workflows/       CI (build + unit tests + APK artifact)
```

## Architecture

- **MVVM + unidirectional data flow** — Compose screen → ViewModel → use case → repository.
- **DI:** Hilt. **State:** `StateFlow`/Compose state.
- **Data:** pure in-memory mock repositories (`core:data`) behind the domain interfaces — live in-session
  interactions (like / follow / bookmark / comment / watch / moderate), zero network.
- **Spoiler engine:** domain `SpoilerPolicy` drives blur/hide per watched-through-episode (§9) — pure & unit-tested.

## Build

```bash
./gradlew :app:assembleDebug
./gradlew testDebugUnitTest
```

No credentials or backend setup required. The app opens into the full product flow
(Welcome → Sign up/Log in → Onboarding → tabs) and every screen is populated.

## CI

`.github/workflows/android.yml` runs on push: JDK 17 → Android SDK → `assembleDebug` → unit tests → uploads the debug APK as an artifact.

## Progress

- All 32 screens implemented in Compose, styled to the Apple-level blueprint.
- Design system + app icon refreshed to the approved premium look.
- Frontend runs fully populated from the mock catalog — no backend.
- CI green: `assembleDebug` + unit tests + APK artifact.

See `REVIEW.md` for the build review and `BLUEPRINT.md` for the design contract.

# Hallyu — Owner Requirements Checklist

> **Purpose:** every concrete thing needed from the project owner, what it unlocks, when it's needed, and what honestly happens without it (Spec §54: never fake success — document what's missing).
> **Already confirmed by owner (2026-09-12):** app name **"Hallyu"** · stack **React Native + Expo + Convex** · CI/CD **GitHub Actions + Expo EAS** · seed data **fictional-only** · TMDB key **provided later**.

---

## 1. Confirmed decisions (no action needed)

| Decision | Status |
|---|---|
| Product = native mobile app (iOS + Android), not a website | ✅ Confirmed |
| Name = "Hallyu", tagline "Where the Wave Lives" | ✅ Confirmed (rename stays a one-file change, D-20) |
| Stack = React Native + Expo + TypeScript + Convex + NativeWind + Expo Router | ✅ Confirmed (D-01/D-02, D-06/D-07) |
| CI/CD = GitHub Actions + Expo EAS | ✅ Confirmed (D-22) |
| Seed/demo content = fictional dramas, actors, "official accounts" only | ✅ Confirmed (D-05) |
| Spoiler default = balanced; email verification off by default; moderate seed volume; Convex Auth | ✅ Defaults accepted (DECISIONS.md §E) |

## 2. Accounts & credentials — by milestone

| # | Item | Needed by | Unlocks | If missing (honest degradation) |
|---|---|---|---|---|
| 1 | **Expo account** (free, expo.dev) → generate `EXPO_TOKEN` | M0 end | `eas-build.yml` can trigger real Android/iOS builds from GitHub Actions | CI gates still run; EAS step reports "not configured"; no native binaries yet |
| 2 | **GitHub Actions enabled** on this repo (it is already Freebuff-connected) | M0 | CI gate on every push/PR | No automated verification; typecheck still runs in the workspace |
| 3 | **Convex account ownership** (claim the dev/prod deployment via dashboard) | M1 | Owner-controlled backend, prod deployment at M6 | Work continues on the workspace-managed deployment |
| 4 | **Apple Developer Program** ($99/yr) | Store delivery only (post-M6) | TestFlight / App Store via `eas submit` | APK/simulator builds still work; iOS store path stays documented |
| 5 | **Google Play developer account** ($25 one-time) | Store delivery only (post-M6) | Play Console delivery via `eas submit` | APK distribution to testers still works |

## 3. API keys & external services — config-gated (app runs without each)

| # | Key | Needed by | Unlocks | If missing (honest degradation) |
|---|---|---|---|---|
| 1 | **`TMDB_API_KEY`** (themoviedb.org, free) | Owner said "later" — anytime before/after M3 | Real drama/episode/cast metadata sync augmenting the seed dataset | Fictional seed dataset powers everything; sync module reports "TMDB_API_KEY not set" |
| 2 | **`RESEND_API_KEY`** or SMTP credential | M1+ (optional) | Real verification / password-recovery email | Dev mode logs email + token to the Convex dashboard; email verification stays OFF |
| 3 | **Push credentials** (Expo project + FCM/APNs via `eas credentials`) | M5 (optional) | Real push notifications to devices | In-app realtime notifications still work (Convex live queries); push sends report unconfigured |

## 4. Brand & legal — before store release

| # | Item | Notes |
|---|---|---|
| 1 | Trademark / name / domain checks for "Hallyu" | Spec §35 requires brand configurability until this is done — D-20 keeps it a one-file change |
| 2 | Final app icon + splash artwork | Workspace can supply themed placeholder brand art per Spec §35A; owner approves final before store |
| 3 | Universal-links domain (optional) | Custom scheme `hallyu://` works from day one; https universal links need an owned domain + association files |
| 4 | Privacy policy / terms URLs | Required by both app stores at submission; not an MVP-code blocker |

## 5. Ongoing owner involvement (per milestone)

1. **Milestone review (mandatory, D-18):** owner reviews each M0–M6 exit before the next milestone starts.
2. **Real-device test:** run the app in **Expo Go** on a real phone (scan QR from `npx expo start`) each milestone; at M6 also a low-end Android check per Spec §31.
3. **Spec §48 journey sign-off** at M6: can a new fan sign up → get a relevant feed → follow a drama → discuss an episode safely → join a community → have a reason to return?

## 6. What the owner does NOT need to provide

- No servers, databases, or hosting to manage (Convex + EAS are managed — Spec §30).
- No secrets pasted into code or the client bundle (Spec §39 rule 2) — keys go in Convex/GitHub environment configuration.
- No store accounts until store delivery is actually wanted.
- No scraping rights or third-party database licenses — TMDB's free API + fictional seed data cover the MVP (Spec §23/§24).

# Hallyu — Apple-Level App Blueprint (v2)

> This document is the build contract. It is **not** a reference-only moodboard — the Kotlin +
> Jetpack Compose app is built to match it, screen by screen.

---

## 0. Ground rules (locked)

1. **Native Android, Kotlin + Jetpack Compose.** No React Native, no Expo. (The "Apple-level"
   instruction is about *visual quality*, not the platform.)
2. **Frontend only.** No backend, no Supabase, no network calls. Every screen is populated from an
   in-memory mock catalog so the entire product can be explored and previewed immediately.
3. **"Apple-level" = the bar.** Every screen must feel like a first-party iOS-calibre product:
   confident typography, generous whitespace, restrained color, soft depth, consistent rhythm.
4. Dark-only for v1. The app is designed dark-first with a deep charcoal stage and a violet→blue
   ambient glow (the approved mockup look).

---

## 1. Visual language

### The stage
Every screen sits on a **deep charcoal stage** with a faint ambient glow — violet (`#4A1C6E`)
bleeding from the top, blue (`#2D6CDF`) rising from the bottom. This is the single most important
signature: it lifts the whole app out of "plain Material dark mode" into the premium mockup look.

Implemented as `HallyuScreenBrush` + `HallyuBackground` in `core:designsystem` and applied to every
screen root.

### The materials
- **Cards**: opaque `#1A1A1E`, 16dp radii, hairline `#2A2A33` border, no heavy elevation. Depth
  comes from color and light, not shadows.
- **Frosted glass**: bottom nav + overlays use 72% `#14141A` with a hairline border.
- **Poster & monogram art**: every drama/actor/avatar gets a **cinematic vertical gradient**
  generated deterministically from its name (no placeholder gray boxes, no network images needed).
  Posters carry a subtle diagonal light streak for glass depth.

### Color tokens
| Role | Value |
|---|---|
| Brand start (violet) | `#4A1C6E` |
| Brand end (blue) | `#2D6CDF` |
| Accent (coral) | `#FF6B6B` |
| Background | `#0F0F0F` |
| Surface (card) | `#1A1A1E` |
| Surface elevated | `#22222A` |
| Glass | `#14141A` @ 72% |
| Text primary | `#F5F5F7` |
| Text secondary | `#9A9AA5` |
| Text tertiary | `#6A6A75` |
| Outline | `#2A2A33` |
| Success / Warning / Info | `#34D399` / `#FBBF24` / `#38BDF8` |

**Contrast rule:** gradient fills run light-stop-first (blue under white text) to hold WCAG AA;
coral is used as text/outline only, never as a fill behind white text.

### Typography
- Display/headlines: SemiBold with **tight negative tracking** (`-0.4sp`…`-0.1sp`) — the Apple
  tight-lead look.
- Body: 16/14/12sp with comfortable 1.5× line height.
- Labels: medium weight with slight positive tracking for a refined, airy feel.

### Shape & rhythm
- 8dp baseline grid: `4 / 8 / 12 / 16 / 24 / 32`.
- Radii: chips 999dp (pill), cards 16dp, buttons 14dp.
- Buttons: 50dp tall, full-width, gradient or hairline-outline.
- Touch targets ≥ 44dp everywhere (Apple HIG parity).

---

## 2. Screen map (32 screens — all populated)

**Auth (5)**
1. Splash — brand mark over the ambient stage
2. Welcome — hero + Get started / Log in
3. Sign up — email / password / username
4. Log in
5. Account recovery

**Onboarding (5)**
6. Interests · 7. Pick dramas · 8. Pick actors · 9. Pick communities · 10. Complete

**Main tabs (6)**
11. Home — For You · 12. Home — Following · 13. Explore (trending + carousels) · 14. Create ·
15. Notifications · 16. Profile

**Content (9)**
17. Post detail · 18. Comments · 19. Drama hub · 20. Episode page · 21. Episode discussion ·
22. Actor page · 23. Community page · 24. Search results · 25. Hashtag page

**Remaining (7)**
26. Saved · 27. Followers · 28. Following · 29. Currently watching · 30. My communities ·
31. Settings · 32. Moderation queue

---

## 3. The content (mock catalog)

`core:data` ships a rich in-memory catalog — no network, no database:

- 9 profiles (verified creators, an official account, a cast member, meme accounts)
- 8 dramas (airing / completed / upcoming, with synopses, genres, networks, episode counts)
- 10 actors (Korean names, bios, follower counts)
- 6 communities
- 14 posts spanning every category (reaction, theory, fan content, meme, news, question,
  recommendation) with realistic like/comment/repost counts and timestamps
- comments, notifications (release alerts, replies, mentions, trending, official),
  moderation reports, trending hashtags, watch progress

**Interactions are live in-session:** like, bookmark, repost, follow (drama/actor/user), join
community, comment, mark watched, resolve reports all mutate the in-memory state — so the app is a
*working* frontend, not a slideshow.

---

## 4. Architecture (unchanged skeleton, new data layer)

- Modules: `:app`, `:core:designsystem`, `:core:domain`, `:core:data`, `:core:common`.
- MVVM + StateFlow, Hilt, Navigation Compose, Coil (used only if a real image URL is ever supplied).
- Domain repositories are pure interfaces; `:core:data` now binds **in-memory mock implementations**
  to them. Swapping a real backend later is a single-module change behind the same interfaces.
- Spoiler engine (`SpoilerPolicy`) stays a pure, unit-tested domain function.

---

## 5. Definition of done

- [x] Apple-level design system (stage, glass, gradient art, tight type) in `:core:designsystem`
- [x] Apple-level app icon (gradient wave mark) in all mipmap densities
- [x] Frontend-only: backend removed from the run path; mock catalog populates all 32 screens
- [x] CI green (`assembleDebug` + unit tests + APK artifact)
- [ ] On-device polish pass (spacing/tracking audit) once previewed

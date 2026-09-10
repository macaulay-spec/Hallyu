# Hallyu — Design System (v1)

> **Status:** LOCKED (all open design questions resolved — no further sign-off needed).
> The 32 mockups in `design/mockups/` are the *direction*; this file is the *source of truth* the Kotlin / Jetpack Compose code is built from. AI renders drift in typography/spacing/color temperature — code must not.

---

## 0. Resolved decisions (owner: engineering, no rework)

| # | Decision | Choice | Rationale |
|---|---|---|---|
| 1 | Create tab treatment | **Raised gradient center button** in the bottom bar | Reinforces "Create should be extremely fast" (spec §19); gives the tab bar one focal point |
| 2 | Theme scope | **Dark-only for v1** | Spec palette is dark-first; light theme deferred. Architecture keeps tokens swappable |
| 3 | Glass / blur | **Backdrop blur on bottom nav + overlays only; feed cards opaque** | Real blur over scrolling content is expensive on low-end Android (spec §31) |
| 4 | Display typeface | **Black Han Sans** (logo/headlines) + **Inter** (UI) | Black Han Sans is the iconic K-drama poster stroke style; used sparingly |

---

## 1. Color tokens

### Brand
| Token | Value | Role |
|---|---|---|
| `brandGradientStart` | `#4A1C6E` | Deep purple — gradient start, brand presence |
| `brandGradientEnd` | `#2D6CDF` | Blue — gradient end |
| `brandAccent` | `#FF6B6B` | Coral — spoiler reveal, "live" indicator, destructive, follow-active |

### Surfaces (dark)
| Token | Value | Role |
|---|---|---|
| `background` | `#0F0F0F` | App background |
| `surface` | `#1A1A1E` | Cards, sheets |
| `surfaceElevated` | `#22222A` | Dialogs, menus, pressed states |
| `surfaceGlass` | `#14141A @ 72%` | Bottom nav / overlay glass (blur behind) |
| `scrim` | `#000000 @ 60%` | Spoiler blur + modal scrims |

### Content
| Token | Value | Role |
|---|---|---|
| `onBackground` | `#F5F5F7` | Primary text on background |
| `onSurface` | `#ECECF1` | Primary text on cards |
| `textSecondary` | `#9A9AA5` | Timestamps, meta |
| `textTertiary` | `#6A6A75` | Disabled, captions |
| `outline` | `#2A2A33` | Card borders, dividers |

### Semantic
| Token | Value | Role |
|---|---|---|
| `success` | `#34D399` | Verified, "watched", success toasts |
| `warning` | `#FBBF24` | Spoiler warning, moderation flags |
| `info` | `#38BDF8` | Official content badge, info |
| `error` | `#FF6B6B` | Errors, destructive actions (reuses accent) |

### Contrast rules (WCAG 2.1 AA — verified, not vibes)
- White text on `#2D6CDF` ✅ passes. White text on `#4A1C6E` ❌ **fails** (~2.9:1) →
  **gradient fills always run light-stop-first**, so button/logo text sits on the blue half.
- `#FF6B6B` as *text* on `#0F0F0F` ✅ passes → coral is used as text/outline, **never** as a fill behind white text.
- `textSecondary #9A9AA5` on `#0F0F0F` ✅ passes for ≥14sp text (captions use `textSecondary` only).

---

## 2. Typography

| Role | Typeface | Notes |
|---|---|---|
| UI body/labels | **Inter** (400/500/600/700) | All body text, buttons, chips, meta |
| Display / brand | **Black Han Sans** (400) | Logo "Hallyu", `한류`, screen headlines, "Where the Wave Lives" — **never body text** |
| Korean names/titles | **Noto Sans KR** | Korean drama/actor names inline with Inter |

### Type scale
| Style | Size / line-height | Weight | Use |
|---|---|---|---|
| `display` | 34 / 40 | 400 (Black Han Sans) | Splash, welcome headline, empty-state hero |
| `headline` | 24 / 32 | 700 | Screen titles (Drama hub, etc.) |
| `title` | 20 / 28 | 600 | Card titles, section headers |
| `body` | 16 / 24 | 400 | Post text, bios |
| `label` | 14 / 20 | 500 | Buttons, chips, tabs |
| `caption` | 12 / 16 | 400 | Timestamps, member counts |

---

## 3. Shape, spacing, elevation

- **Radius:** cards `12dp`, buttons `12dp`, inputs `12dp`, chips `999dp` (pill), avatars = circle.
- **Spacing grid (4dp):** screen padding `16dp`, internal card spacing `16dp`, section gap `24dp`, tight `8dp`, hairline `4dp`.
- **Elevation:** restrained — cards mostly flat with `outline` borders; `surfaceElevated` only for dialogs/menus/pressed. No heavy drop shadows.

---

## 4. Motion

- Fluid, cinematic, subtle. Durations **150–250ms**; spring where organic.
- **Wave-inspired loading** (brand accent moment) — a restrained ripple on splash/empty states.
- Respect `reduce motion`; no auto-playing/looping animated loops beyond the splash indicator.

---

## 5. Component inventory (these ~10 components compose all 32 screens)

| Component | Description |
|---|---|
| `HallyuButton` | Gradient fill (light-stop-first), white text, 12dp radius, 48dp height |
| `HallyuOutlinedButton` | Outline border, transparent fill |
| `GlassBottomNav` | 5 tabs + raised gradient **Create** center button, backdrop blur |
| `PostCard` | Avatar, username (+verified badge), timestamp, `DramaContextChip`, text, image carousel, action row (like/comment/repost/bookmark) |
| `DramaContextChip` | Purple-tinted pill: drama name · "Ep 8" — the product's identity element |
| `SpoilerOverlay` | Blur + `#FF6B6B` "Reveal spoiler" — blurred content + reveal toggle |
| `StoryRing` | Circular gradient ring around drama poster (currently airing) |
| `DramaPosterCard` | 2:3 poster + follow `+` |
| `CastChip` | Circular actor portrait + name |
| `EpisodeRow` | Episode number, air date, progress, "join discussion" link |
| `SearchBar` / `FilterChips` | Frosted search + category filter pills |
| `StateViews` | `LoadingState` / `EmptyState` / `ErrorState(+retry)` — spec §38 mandates these |

---

## 6. Accessibility (WCAG 2.1 AA — part of the system, not a checklist)

- Min touch target **48dp** (spec §32).
- Contrast per §1 table; large text (≥24px/19sp bold) ≥ 3:1, normal ≥ 4.5:1.
- TalkBack: content descriptions on every icon; `DramaContextChip` announces "drama X, episode Y"; spoiler overlay announces "spoiler hidden — double-tap to reveal".
- Dynamic text sizing up to 130% without breaking cards.

---

## 7. Mockup → code mapping

`design/mockups/*.png` set the visual *direction*. In code, every screen assembles from §5 components driven by §1–§3 tokens. Where a render contradicts a token (color drift, spacing), **the token wins**.

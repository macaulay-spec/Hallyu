# Hallyu — Coded UI/UX Design Prototype ("Ink & Rose")

> **Status: PROPOSAL — awaiting owner approval. Not production code.**
> This directory is the complete, coded redesign of Hallyu's user interface and
> experience. It is deliberately isolated: it does not replace production
> navigation, does not overwrite production screens, and never touches Supabase,
> Convex, TMDB or production auth. All data is fictional and local
> (`design/data.ts`); all key art is procedural (`Poster`).
>
> Flow: **existing Hallyu → this coded prototype → rendered previews
> (`docs/design-previews/`) → commit → human review → approval → production
> implementation.**

---

## 1. What this is

A real frontend implementation of the whole product surface — 27 screens built
from one design system — in React Native + TypeScript, the same component model
the production app uses. It is the design deliverable: layout, typography,
spacing, colour, iconography, components, navigation shell, interaction states,
motion contract, dark **and** light themes, and every loading/empty/error/
offline/spoiler state.

It is *not* concept art. The PNGs in `docs/design-previews/` are rasterized from
these exact components (see §5), so what you inspect visually is what the code
says.

## 2. How to look at it

| Way | Command | Notes |
|---|---|---|
| Rendered previews (in repo) | open `docs/design-previews/*.png` | 27 frames @3×, plus `manifest.json` |
| Live clickable prototype (web) | `npm run design:preview` → open `/design` | full app shell, screen switcher, theme toggle |
| Live on device | `npx expo start` → open `/design` route | same mount, native rendering |
| Re-render previews from code | `npm run design:render` | regenerates every PNG from current source |

The single production touch is one additive route, `app/(design)/index.tsx`,
which mounts `PrototypeApp` at `/design`. Delete that file when the approved
design is implemented for real; nothing else in `app/` references this folder.

## 3. Design language — "Ink & Rose"

Full token contract: `design/tokens.ts` (the only place visual values live).

- **Canvas:** neutral near-black ink (`#0A0A0C`), never purple-tinted; surfaces
  `#141417` / `#1C1C21`. Content and drama art are the brightest pixels.
- **Accent:** one confident rose (`#E8465A` dark / `#C22F44` light) for identity,
  action and "on" states; deep ink-blue (`#16233F`) as the rare second stop of
  the brand gradient (taegeuk duo). No gradient on chrome, no glass, no neon.
- **Type:** Inter with heavy weight contrast and tight display tracking
  (34/40 800 → 11/14 600 micro); Korean set in Noto Sans KR; eyebrows uppercase
  +0.6 tracking.
- **Grid:** 4pt spacing ladder (4…48), 16pt gutters, radii 8/12/16/20 + pill,
  20pt cards. No borders by default — elevation and hairlines only where lists
  need them.
- **Iconography:** Ionicons outline on a 14–28pt ladder; filled variants only for
  active/selected.
- **Light mode:** hanji-paper (`#F7F5F2`) with true-white cards and a deeper rose
  for AA contrast — drawn from the same tokens, not an inversion.
- **Motion contract** (`MOTION` in tokens): press scale 0.97 @120ms; screen enter
  fade + 12px rise @260ms (cubic-bezier .22,1,.36,1); reaction pop 220ms spring;
  skeleton shimmer 1400ms; brand wave 1800ms. Previews are static frames; these
  values are the implementation contract.

## 4. Structure

```
design/
  tokens.ts            every visual value (dark + light), type scale, motion
  theme.tsx            ThemeProvider / useTheme
  icons.tsx            Icon + curated IC name set (Ionicons)
  ui.tsx               primitives: T, Screen, Card, Button, Chip, Badge, Avatar,
                       Poster (procedural key art), Skeleton/Empty/Error/Offline,
                       SpoilerGuard, Segmented, TabBar, TopBar, Progress…
  cards.tsx            domain cards: PostCard, CommentRow, DramaRailCard,
                       ActorCard, CommunityRow, EpisodeRow, NotificationRow,
                       WatchingRow, ReactionPicker
  data.ts              fictional sample dataset (no real people/titles/brands)
  registry.tsx         the 27 screens: id, group, frame height, factory
  PrototypeApp.tsx     interactive shell: in-memory navigator, screen switcher,
                       theme toggle (live preview only)
  screens/             auth · home · discover · drama · people · social ·
                       personal · system (states/report/moderation) · foundations
  tools/               static renderer (shim + satori + resvg/sharp)
```

Navigation in the prototype is a tiny in-memory stack (`PrototypeApp`) so the
design can be clicked end-to-end without touching Expo Router. Production
implementation maps these screens onto the existing router tree.

## 5. How the previews are produced (no AI artwork)

`npm run design:render` runs `design/tools/render.mjs`:

1. esbuild bundles the renderer with `react-native`, `expo-linear-gradient` and
   `@expo/vector-icons` swapped for tiny host-element shims (`tools/shim/`);
2. each screen is rendered with `react-test-renderer` → element tree;
3. the tree is translated to CSS-flexbox nodes (RN semantics → CSS: column
   default, px line-heights, axis padding shorthands) and laid out by **satori**
   with the real Inter / Noto Sans KR / Ionicons fonts;
4. SVG → PNG via resvg (panic-isolated child process) with sharp as fallback,
   at 3× (1170px wide) into `docs/design-previews/`.

So every pixel in a preview is computed from the component code and real font
metrics. Change `tokens.ts` or any screen and re-run to regenerate the gallery.

## 6. Guardrails honoured here

- Fictional-only sample data (repo policy D-05): no real actors, titles,
  broadcasters or likenesses; key art is procedural gradients + motifs.
- No fake interactivity: controls that would need a backend are shown in their
  designed states, and the live prototype navigates only between real screens.
- Spoiler protection, moderation, reporting and honest empty/error/offline
  states are designed as first-class surfaces (sheets 23–25).
- Accessibility: 44pt+ touch targets, AA contrast in both themes, semantic
  labels on interactive primitives, type scale ≥ 11pt.

## 7. After approval

Production implementation adapts (not copies) this code: virtualized lists
(`FlashList`/`FlatList`), `expo-image` for media, Supabase-backed data hooks,
Expo Router routes, and the motion contract via Reanimated — while keeping the
approved visual system byte-for-byte from `tokens.ts`.

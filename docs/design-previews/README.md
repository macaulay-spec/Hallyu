# Hallyu — Rendered Design Previews

> **These images are renders of the coded prototype in `/design` — not generated
> artwork.** Pipeline: screen components → react-test-renderer → satori (real
> Inter / Noto Sans KR / Ionicons metrics) → SVG → PNG @3× (1170px wide).
> Regenerate with `npm run design:render`; `manifest.json` is written by the
> same run.

Frame width is a 390pt iPhone-class device. Frames taller than 844pt are scroll
sheets (settings, states, foundations) shown in full. Click a row to open the
frame.

## Social

| # | Screen | Frame | File |
|---|---|---|---|
| 15 | Post detail · comments | 390×844pt | [15-post-detail.png](./15-post-detail.png) |

## Highlights (inline)

| Home · For You | Drama hub | Post detail |
|---|---|---|
| ![home](./06-home-foryou.png) | ![drama](./12-drama-hub.png) | ![post](./15-post-detail.png) |

| Discover | Light mode | Design system (top) |
|---|---|---|
| ![discover](./09-discover.png) | ![light](./27-light-mode.png) | ![system](./26-design-system.png) |

## Reading a frame

Every frame is drawn from `design/tokens.ts` (Ink & Rose): neutral ink canvas,
single rose accent, Inter weight contrast, 4pt grid, 20pt cards, Ionicons
outline. Light mode is drawn from the same tokens, not inverted. Procedural key
art (`Poster`) stands in for licensed posters until the TMDB pipeline exists;
all people and titles are fictional.

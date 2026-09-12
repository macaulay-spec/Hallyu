# Hallyu — Blueprint Consistency Audit

**Scope:** all 19 sheets in `docs/blueprints/`, checked against `docs/blueprints/README.md`, `docs/plans/SCREEN_NAVIGATION_MAP.md`, and the master spec.
**Status:** findings for owner review. Nothing here changes product scope — these are visual/content consistency fixes.

---

## 1. Navigation bar

Confirmed correct (Home · Explore · Create · Notifications · Profile) on every tab-root sheet: 01, 04, 05, 06, 07, 11, 14. Detail/push screens (02, 03, 09, 10, 12, 16, 17, 19) correctly omit the bar per the nav tree — that's expected, not a bug.

**Issue — Sheet 18 (states):** shows a different bottom nav, with "Communities" in place of "Notifications," plus an extra top tab row ("For You / Following / Communities / Discussions") that doesn't exist anywhere in the written spec or `SCREEN_NAVIGATION_MAP.md`. This is the only sheet that breaks the pattern the README itself promises ("The 5-tab navigation shown in every sheet is..."). **Fix:** redraw sheet 18's chrome to match sheets 04/05/06.

**Minor — Create-tab icon:** rendered as a filled circular gradient "+" on most tab-root sheets (04, 05, 06, 07, 11) but as a plain square-outline "+" on sheet 14 (notifications). Same component, two different treatments — likely a leftover from an earlier pass. **Fix:** pick one and apply everywhere.

## 2. Brand voice / tagline

The master spec names one working positioning line (§35): **"Where the Wave Lives."** It's used correctly on sheets 01 and 02. Elsewhere, at least six other one-off taglines appear, none matching it and none repeated:

| Sheet | Tagline shown |
|---|---|
| 03 (onboarding) | "K-dramas. More than a fandom." |
| 06 (explore) | "Dramas. People. A Brighter You." |
| 11 (community) | "Good stories bring us closer." |
| 14 (notifications) | "K-drama people belong here." |
| 15 (profile) | Three at once: "People. Dramas. Communities. A brighter you." / "Dramas bring us closer." / "Same stories. A kinder world." |
| 18 (states) | "K-drama people. Real connections." |

**Fix:** either lock every sheet to "Where the Wave Lives" for consistency, or — if contextual taglines are genuinely the intent — write that down as an explicit content rule (which variant belongs where, and why) so it reads as a decision rather than sheet-by-sheet drift. Sheet 15 in particular carries three overlapping lines in one screen and could drop two of the three regardless of which way this goes.

## 3. Real-world names, faces, and brands used as example content

The one worth pausing on, not just polishing. Across the sheets, mockup content consistently uses:

- **Real, current K-drama titles** — *Queen of Tears*, *Moving*, *Lovely Runner*, *My Demon*, *The Silent Sea* — mixed inconsistently with invented placeholder titles (*Midnight Letters*, *Hearts in Seoul*, *The Quiet Tide*...) with no visible rule for which is used where.
- **Real actors' names, likenesses, and accurate filmographies** — most fully on sheet 10, where the Actor page is built entirely around Kim Ji-won, with her real 2024/2022/2017/2019 screen credits and a stylized portrait, presented as a followable in-app profile. Lee Min Ho, IU, Park Seo-joon, Kim Soo-hyun, Song Hye-kyo, Byeon Woo-seok, and Shin Hye-sun also appear by name across other sheets.
- **Real broadcaster/streamer logos as "Official accounts"** — Netflix Korea, tvN Drama, Disney+ Korea, and SBS Drama appear with verified badges and follower counts (sheets 06, 11, 14), implying an in-app presence none of them have actually agreed to. Sheet 14 even shows "tvN Drama" posting an official update about "Midnight Letters" — a title that isn't real, attached to a broadcaster that is.

None of this is a problem for internal blueprints — the README already says placeholder content is expected. It becomes a problem the moment any of it is mistaken for a decided-on production approach: a real actress's face and career on a "Follow" profile, or a real network's logo marked "verified official account," go a step beyond ordinary drama metadata (which TMDB legitimately licenses) — they read as an implied partnership or endorsement that doesn't exist.

**Recommendation:** before this becomes the literal build reference for M3 (drama graph) and the seed dataset (DECISIONS.md D-05), write one explicit line into `DECISIONS.md` or the seed-data doc settling it — e.g. "demo seed uses fictional dramas and fictional official accounts only; real-title factual metadata via TMDB is fine, real people's likenesses and real companies' branding as in-app 'accounts' are not, without an actual agreement."

## 4. Small polish items

- Sheet 01's footer reads "2024" — likely a stale placeholder year worth updating or removing.
- Otherwise, token usage (dark surface, gradient, coral accent, Inter, 12px radius) held up consistently across all 19 sheets.

## 5. What's not a problem

The spoiler system — overlay cards, "watched through Ep X," the reveal interaction — renders correctly and identically everywhere it appears. Empty/error/loading states match the §38 copy verbatim. The moderation queue and settings screens, often an afterthought in app design, got the same visual attention as the core social screens.

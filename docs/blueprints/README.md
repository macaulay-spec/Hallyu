# Hallyu — App Blueprint Gallery

Complete visual blueprint of the Hallyu K-drama community app, generated from the product contract
(`Hallyu_Final_Integrated_Master_Build_Specification (2).md`) and the engineering plan
(`../plans/`). Every screen below is a concrete app-screen design — one design system across
all 19 sheets, following the visual baseline tokens from **Spec §35A**:

| Token | Value |
|---|---|
| Background | `#0F0F0F` (dark surface) |
| Cards / elevated surfaces | `#1A1A1A` |
| Primary gradient | `#4A1C6E → #2D6CDF` (purple → blue) |
| Accent | `#FF6B6B` (coral) |
| Typography | Inter (SF Pro on iOS) |
| Corner radius | 12px |
| Base spacing | 16px grid |
| Loading motif | Animated wave |

## Screen Map

Numbering follows the user journey: first-run → core loop → personal spaces → states → moderation.

### Foundation

| # | File | Screens covered | Spec refs |
|---|---|---|---|
| 01 | `01-design-system.png` | Design-system sheet: palette, gradient, typography scale, buttons, inputs, cards, badges, spoiler overlay, bottom-nav bar, iconography | §35A |

### Onboarding & Identity (first-run)

| # | File | Screens covered | Spec refs |
|---|---|---|---|
| 02 | `02-auth-welcome-signup-login.png` | Welcome, Sign up, Log in — email/password, social-entry placeholder states, validation, error copy | §6, §38 |
| 03 | `03-onboarding.png` | Onboarding: genres you love → favourite dramas (follow) → favourite actors → spoiler-protection preference → review, with progress dots | §7, §9 |

### Home (Tab 1)

| # | File | Screens covered | Spec refs |
|---|---|---|---|
| 04 | `04-home-for-you.png` | For You feed: hero drama, episode-release cards, trending posts, community recommendations, continue-watching rail, 5-tab bottom nav | §4, §8, §12 |
| 05 | `05-home-following.png` | Following feed: posts from followed users/communities/dramas, post cards with spoiler chips and engagement, empty state ("Your fandom is quiet here…") | §8, §38 |

### Discovery (Tab 2)

| # | File | Screens covered | Spec refs |
|---|---|---|---|
| 06 | `06-explore.png` | Explore: rails (Trending Now, New Episodes, Fan Favourites), category chips (genre/network), editorially curated collections, hero sections | §12, §24 |
| 07 | `07-search-results.png` | Search results: grouped Dramas / Actors / Users / Communities / Hashtags / Posts, filter chips, follow/join inline actions, recent + suggested searches | §13 |

### Drama Graph

| # | File | Screens covered | Spec refs |
|---|---|---|---|
| 08 | `08-drama-hub.png` | Drama hub: hero art, synopsis, stats, Follow/Track buttons, episode list, cast rail, community rail, tabs (Episodes / Cast / Community / About) | §8, §25 |
| 09 | `09-episode-discussion.png` | Episode discussion: episode header, spoiler banner ("Tap to reveal guarded content"), reaction bar, posts/thread list, marked-spoiler post cards, jump to composer | §9, §11 |
| 10 | `10-actor-profile.png` | Actor page: hero portrait, bio, follower count, Follow, credits (role/year/type), fan communities, recent activity mentioning the actor | §25, §8 |

### Social & Communities

| # | File | Screens covered | Spec refs |
|---|---|---|---|
| 11 | `11-community.png` | Community page: banner, member count, Join button, tabs (Feed / Members / Rules), pinned mod post, spoiler-tagged posts, locked-post state | §14, §39 |
| 12 | `12-post-detail-comments.png` | Post detail: full post, spoiler overlay with reveal interaction, comment list (3-level nesting), reply composer, engagement counts | §10, §11 |
| 13 | `13-create-composer.png` | Create sheet: composer with 5000-char counter, audience selector, spoiler tagger (drama + episode + level), media attach, community cross-post, post button | §10, §9 |

### Personal Spaces (Tab 5 & rails)

| # | File | Screens covered | Spec refs |
|---|---|---|---|
| 14 | `14-notifications.png` | Notifications (Tab 4): grouped list (replies, mentions, reactions, follows, episode releases, mod actions), read/unread states, quiet-hours indicator | §16, §38 |
| 15 | `15-profile.png` | Profile (Tab 5): stats, bio, grid of posts, Currently Watching rail, badges, tabs (Posts / Comments / Saved / About), edit profile | §18 |
| 16 | `16-currently-watching.png` | Currently Watching list: drama rows with progress ("watched through Ep X"), episode-progress editor, marking what you've seen — the engine of the spoiler system | §9 |
| 17 | `17-settings.png` | Settings: Account, Notifications (per-drama, quiet hours), Spoilers (protection level, muted dramas, ask-before-reveal), Privacy (private account, blocked/muted), Appearance, About | §18, §9 |

### System States

| # | File | Screens covered | Spec refs |
|---|---|---|---|
| 18 | `18-states-loading-empty-error-offline.png` | Loading (wave motif + shimmer), Empty ("Your fandom is quiet here…", "You're caught up."), Error ("Couldn't load this right now." + retry), Offline banner | §38 |
| 19 | `19-moderation-queue.png` | Moderation queue (admin/mod surface): reported posts, spoiler-misuse reports, lock/resolve actions, report reasons, appeal state | §39, §15 |

## Coverage vs. Required Screens (Spec §37)

Spec §37 requires the core surfaces: onboarding, home, drama hub + episode discussion, post
composer, profile, notifications, community. This gallery covers **all of §37** plus the
supporting screens needed for a complete product: search, actor pages, saved content (in
profile tabs), currently watching (spoiler engine), settings (spoiler & notification prefs),
all system states (§38), and the moderation surface (§39). Screens not shown as dedicated
sheets (e.g., blocked users manager, per-drama notification settings sub-screen) are simple
list/detail variants of the patterns shown in sheets 17 and 18 and are specified in
`../plans/SCREEN_NAVIGATION_MAP.md`.

## Notes on Fidelity

These are **blueprints**, not final pixel-perfect assets: they define layout, hierarchy,
componentry, copy tone, and the design system so the Compose Multiplatform implementation
has a concrete visual reference. Minor differences from final implementation (exact spacing,
illustrative copy, placeholder avatars/imagery) are expected; tokens and structure are the
contract. Where the implementation and a blueprint disagree on token values, the spec
(§35A) and the design-system sheet (01) take precedence.

The 5-tab navigation shown in every sheet is: **Home · Explore · Create · Notifications · Profile** (Spec §4).

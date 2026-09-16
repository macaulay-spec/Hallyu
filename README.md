# Hallyu (한류) — Where the Wave Lives

> ## 🎨 2026-09-16 — Full product rebuild in progress
> 1. **Repository audit:** [`docs/audit/REPOSITORY_AUDIT.md`](docs/audit/REPOSITORY_AUDIT.md)
>    — what works, what is broken, what is dead, and the disposition of the Convex
>    backend (to be migrated to Supabase after design approval).
> 2. **Design mockups (for review):** [`docs/design-previews/`](docs/design-previews/README.md)
>    — 28 rendered frames of the proposed "Ink & Rose" redesign (every core
>    screen, plus states, light mode and the brand sheet), with the app icon and
>    key-art assets in [`docs/design-assets/`](docs/design-assets/).
>
> **The design is awaiting owner approval.** Production implementation, the
> Supabase rebuild and the Android/EAS hardening start only after the proposal
> is approved.
> Everything below describes the *current* (pre-rebuild) state of the repo.


A mobile-first social network built specifically for K-drama fandom: real-time
episode discussion, drama hubs, communities, and a server-enforced spoiler
system. React Native + Expo + Convex. The product contract is
`Hallyu_Final_Integrated_Master_Build_Specification (2).md` — untouched. The
visual reference is `docs/blueprints/` (19 sheets); the design tokens those
sheets use (Spec §35A: `#0F0F0F` surface, `#4A1C6E → #2D6CDF` gradient,
`#FF6B6B` accent, 12px radius, 16px grid, wave loading motif) live in exactly
one place — `tailwind.config.js` (D-20).

## Status: M5 (communities + trust) — what works now

- ✅ **M0** Expo (SDK 52) + Expo Router 5-tab tree, §35A design system, CI + EAS
  workflows, brand assets
- ✅ **M1** full Spec §25 Convex schema, Convex Auth (email/password,
  SecureStore sessions), profiles + handles, onboarding, fictional seed
- ✅ **M2** posts (5,000-char composer), spoiler-guarded feeds, 3-level comments,
  six reactions with optimistic rollback, reposts, bookmarks, follows,
  blocks/mutes, rate limiting
- ✅ **M3** drama hubs, first-class episode discussions, watch progress, the
  per-user **spoiler engine** (pure function + 19 unit tests), TMDB adapter
  (config-gated)
- ✅ **M4 Discovery** — the 15-minute `trendScores` sweep (velocity, unique
  participants, freshness decay, per-drama and per-author anti-domination caps),
  explainable **For You** (every item names the signal that ranked it),
  near-chronological **Following**, Home modules (Airing Now, Episode Activity,
  Communities for you, Drama Updates), Explore rails (trending, new episodes,
  popular dramas by genre, actors, communities, official accounts, topics),
  entity-typed global search with recent + trending searches
- ✅ **M5 Trust** — public/private communities with join requests and moderator
  approval, moderator powers (pin, lock, hide, remove, ban, roles, rules) with
  server-side role gates, **notification centre** (Critical/Important/Optional,
  per-category prefs, quiet hours, unread badge, deep links on every row),
  **moderation pipeline** (report → rule classification → severity → one
  documented auto-action → human queue → decision → notifications → appeal →
  audit log) with a permission-gated queue screen
- ✅ **Profile surfaces** — Posts / Saved / Communities / About tabs, Currently
  Watching progress editor, followers/following lists, edit profile, settings
  (spoiler protection, per-category notifications, quiet hours, private account,
  blocked + muted lists, sign out)
- ✅ CI green on `main` · EAS Android build verified · web export compiles
- Honest gaps (documented, not hidden):
  - image **upload** UI still pending the Convex storage pipeline; video/polls
    are v1.1 and are labelled rather than rendered as dead buttons (§39.10)
  - account deletion / data export are owner steps; the settings screen says so
    instead of faking them
  - push (FCM/APNs) needs credentials; the in-app inbox works now
  - recent searches are stored locally on the device (never sent to the server)

## Commands

| What | Command |
|---|---|
| Install | `npm install` |
| Dev (phone via Expo Go) | `npx expo start` → scan QR |
| Dev (web preview) | `npx expo start --web` |
| Typecheck | `npm run typecheck` |
| Unit tests (spoiler + policy) | `npx vitest run` |
| Web export smoke | `npm run export:web` |
| Convex dev | `npm run convex:dev` |
| Config doctor | `npm run doctor` |
| EAS build (APK) | `npx eas-cli build -p android --profile preview` |

### Seeding a fresh deployment

```bash
npx convex run seed:seedIfEmpty             # drama graph, episodes, communities
npx convex run seedSocial:seedSocialIfEmpty # fictional members + real reactions,
                                            # comments, follows, member posts
npx convex run trending:recompute           # populate the trend rail immediately
```

`seedSocial` creates **fictional** demo members only (D-05). They have no
credentials — they are data, not accounts — and every counter in the UI is then
computed from real rows rather than hard-coded (Spec §39 rule 11). Members are
also what makes the anti-domination caps observable: with only official authors,
the caps correctly leave the rails nearly empty.

## Docs

- `docs/plans/IMPLEMENTATION_PLAN.md` — milestones M0–M6, CI/CD, exit criteria
- `docs/plans/ARCHITECTURE.md` — system architecture (RN + Expo + Convex)
- `docs/plans/DECISIONS.md` — every technical decision + rationale (D-01…D-22)
- `docs/plans/SCREEN_NAVIGATION_MAP.md` — every screen, state, and route
- `docs/plans/OWNER_REQUIREMENTS_CHECKLIST.md` — what the owner provides, when
- `docs/blueprints/README.md` — visual blueprint catalog (19 sheets, Spec §35A)

## Product guardrails (Spec §39/§45/§54)

No fake buttons. No mock data presented as real. No secrets in the client
bundle. No scope creep past §21. Every feature ships with real loading, empty,
and error states — a beautiful screen backed by fake JSON is not production.
Where something is not built (media upload, delete account, push), the UI says
so in plain language rather than offering a control that does nothing.

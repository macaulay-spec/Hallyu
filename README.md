# Hallyu (한류) — Where the Wave Lives

A mobile-first social network built specifically for K-drama fandom: real-time
episode discussion, drama hubs, communities, and a server-enforced spoiler
system. React Native + Expo + Convex. The product contract is
`Hallyu_Final_Integrated_Master_Build_Specification (2).md` — untouched.

## Status: M2 (social core) — what works now

- ✅ **M0:** Expo (SDK 52) + Expo Router 5-tab tree, §35A design system,
  CI + EAS workflows, brand assets
- ✅ **M1:** full Spec §25 Convex schema, Convex Auth (email/password,
  SecureStore sessions), profiles + handles, onboarding wired end-to-end,
  fictional seed dataset (15 dramas, 8 communities, demo posts)
- ✅ **M2:** posts (5,000-char composer, categories, drama tagger, spoiler
  levels, hashtags), spoiler-guarded feeds (For You recent + real Following
  graph), post detail with server-enforced 3-level comments, optimistic
  reactions ❤🔥😭😂😱🤍 with rollback, reposts, bookmarks, user follows,
  blocks/mutes enforced server-side, rate limiting
- ✅ GitHub Actions CI green on main · EAS project linked (Android APK build
  verified) · web export compiles (verification surface only)
- ⏳ Next: **M3** drama hubs + episode discussions + per-user spoiler engine
  (watch progress) + TMDB adapter. Communities join/moderation is M5.
- Honest gaps: media upload UI pending storage pipeline; "For You" serves the
  recent stream (labeled as such) until M4 ranking lands.

## Commands

| What | Command |
|---|---|
| Install | `npm install` |
| Dev (phone via Expo Go) | `npx expo start` → scan QR |
| Dev (web preview) | `npx expo start --web` |
| Typecheck | `npm run typecheck` |
| Web export smoke | `npm run export:web` |
| Convex dev | `npm run convex:dev` |
| Config doctor | `npm run doctor` |
| EAS build (APK) | `npx eas-cli build -p android --profile preview` |

## Docs

- `docs/plans/IMPLEMENTATION_PLAN.md` — milestones M0–M6, CI/CD, exit criteria
- `docs/plans/ARCHITECTURE.md` — system architecture (RN + Expo + Convex)
- `docs/plans/DECISIONS.md` — every technical decision + rationale (D-01…D-22)
- `docs/plans/SCREEN_NAVIGATION_MAP.md` — every screen, state, and route
- `docs/plans/OWNER_REQUIREMENTS_CHECKLIST.md` — what the owner provides, when
- `docs/blueprints/README.md` — visual blueprint catalog (19 sheets, Spec §35A)

## Product guardrails (Spec §39/§45/§54)

No fake buttons. No mock data presented as real. No secrets in the client
bundle. No scope creep past §20. Every feature ships with real loading, empty,
and error states — a beautiful screen backed by fake JSON is not production.

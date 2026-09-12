# Hallyu (한류) — Where the Wave Lives

A mobile-first social network built specifically for K-drama fandom: real-time
episode discussion, drama hubs, communities, and a server-enforced spoiler
system. React Native + Expo + Convex. The product contract is
`Hallyu_Final_Integrated_Master_Build_Specification (2).md` — untouched.

## Status: M0 (scaffold) — what works now

- ✅ Expo (SDK 52) + Expo Router app with the full 5-tab navigation tree and
  every required route stubbed from `docs/plans/SCREEN_NAVIGATION_MAP.md`
- ✅ Design system per Spec §35A tokens (dark `#0F0F0F`, gradient
  `#4A1C6E→#2D6CDF`, coral `#FF6B6B`, Inter, 12px radius, wave loading motif) —
  centralized in `tailwind.config.js` + `components/ui.tsx` (D-20)
- ✅ Convex backend wired with a real local deployment, generated client types,
  schema + health functions (`tsc` clean end-to-end)
- ✅ Web-export compile smoke passes (`npm run export:web`) — a *verification
  surface*; the product is the native app
- ✅ EAS project linked; Android APK build submitted successfully
- ✅ GitHub Actions CI (`ci.yml`) + EAS build trigger (`eas-build.yml`)
- ⏳ No real data yet — screens show honest empty/loading states, never fake
  content (Spec §39). M1 brings the full §25 schema + auth.

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

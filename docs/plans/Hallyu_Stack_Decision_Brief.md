# Hallyu — Mobile & Backend Stack Decision Brief

> **⚠️ SUPERSEDED — RETAINED AS HISTORICAL RECORD ONLY.**
> The decision recorded below (**Kotlin Multiplatform + Ktor**) was replaced by owner decision on **2026-09-12**. The confirmed stack is **React Native + Expo + Convex**, with CI/CD via **GitHub Actions + Expo EAS**.
> **Current sources of truth:** `DECISIONS.md` (D-01, D-02, D-22) and `IMPLEMENTATION_PLAN.md` (Revision 3).
> This document is kept only as the written record of *why* the KMP path was considered and what the tradeoffs were. Do not cite this file for current decisions.

**Purpose:** resolve `DECISIONS.md` D-01/D-02, marked "requires owner review." Everything from Phase 0 onward depends on this being a deliberate choice, not an inherited default.

---

## Decision

**~~Confirmed: Kotlin Multiplatform + Compose Multiplatform + self-hosted Ktor.~~** *(Superseded 2026-09-12 — see banner above.)* Owner call at the time. D-01/D-02 in `DECISIONS.md` are now resolved differently.

---

## The conflict, restated

| | Master spec (§29) | Actual architecture docs |
|---|---|---|
| Mobile | React Native + Expo + TypeScript | Kotlin Multiplatform + Compose Multiplatform (native Android + iOS) |
| Backend | Supabase (Postgres + Auth + Storage + Realtime + Edge Functions) | Self-hosted Ktor + raw PostgreSQL, custom Auth (Argon2id, JWT, refresh rotation) |
| CI | GitHub Actions + Expo EAS | GitHub Actions (four workflows) |

The architecture docs attribute this to a "project owner instruction" that isn't present anywhere in the uploaded files. If that's a decision already made elsewhere, this brief is just documentation of it. If it isn't, here's what's actually being traded.

## What each path costs and buys

**React Native + Expo + Supabase**
- Time to first working build: fastest — Supabase supplies auth, row-level security, storage, and realtime without writing any of it; Expo handles builds/OTA updates.
- Hiring pool: largest (JS/TS is the most common mobile-adjacent skill set).
- Ongoing ops: minimal — Supabase runs the database and services; you run application code only.
- Maturity/precedent: very high, and specifically relevant here — RN is proven at social-feed scale (Instagram and Discord both run substantial RN surfaces), which matches Hallyu's actual shape: scrolling feeds, images, real-time reactions.
- Cost: usage-based Supabase billing; some managed-service lock-in, though the underlying data is plain Postgres and stays portable.

**Kotlin Multiplatform + Compose + self-hosted Ktor**
- Time to first working build: slowest of the two — the implementation plan's own early milestones (M1: full schema + auth backend from scratch; M2–M6: social core, drama graph, discovery, communities, shared client foundation) are backend engineering before a single app screen exists.
- Hiring pool: smaller — needs real Kotlin backend engineers (Ktor/Exposed/Postgres/security), not just mobile developers.
- Ongoing ops: you own uptime, scaling, patching, and security review for the whole backend indefinitely — not a one-time build cost.
- Maturity/precedent: solid on Android; the Compose Multiplatform iOS target is newer, and the architecture docs' own risk table already flags "KMP + Compose iOS stability edge cases" as a risk.
- Cost: no managed-service fee, but real infrastructure — servers, backups, monitoring — to run and pay for yourselves.

## A tension worth noticing

The master spec's own infrastructure principle (§30) says to keep the first production architecture simple and avoid unmeasured complexity. Supabase is arguably the more literal reading of that instinct — it's already a modular monolith on managed Postgres. Building a full custom auth system, session store, and Postgres row-policy layer from scratch, however well-specified (and DECISIONS.md D-02 specifies it well), is *more* infrastructure to build and then maintain forever, not less. That doesn't make the KMP path wrong — native performance and zero vendor lock-in are real, legitimate reasons to choose it — but it's a genuine tradeoff against the spec's own stated simplicity preference, not a free upgrade.

## Recommendation

This is the owner's call, not mine to make unilaterally — but since it was asked for directly:

If the near-term goal is **validating that the core loop actually retains K-drama fans** — which reads as the real open question for a product that hasn't launched yet — React Native + Expo + Supabase is the lower-risk default. It buys back the entire backend-build phase (M1 alone is weeks of auth/security engineering before a single screen ships) and gets a testable app in front of real users fastest, which matters more at this stage than which native toolkit renders the UI.

If there's already real backend engineering depth on the team — or a specific desire to build it — and native performance or avoiding vendor lock-in outweighs speed to first build, the KMP path is legitimate and unusually well-planned for a stack this new. Go in knowing the first several milestones are backend, not app screens, and budget for the iOS Compose Multiplatform risk directly: a one-screen spike (real auth call, real API round trip, real push notification) before committing to all 14 milestones would surface any real problems cheaply, rather than 6 milestones in.

## Decisions needed before Phase 0 (consolidated)

*(Historical list — current status:)*

1. ~~**Stack** — RN + Expo + Supabase vs. KMP + Ktor.~~ ~~Resolved: KMP + Ktor~~ → **Superseded 2026-09-12: React Native + Expo + Convex** (`DECISIONS.md` D-01/D-02).
2. ~~**App name**~~ → **Resolved: "Hallyu" confirmed.**
3. Default spoiler preference — "balanced" (still the default).
4. Email verification before first feed — still off by default.
5. Demo seed volume — ~15 dramas / 40 users / 8 communities / 150 posts (still the default, fictional-only per D-05).
6. Mobile-app-only for v1 — still out of scope for the public website per §21; the Expo web export is a dev/preview surface only (`DECISIONS.md` D-18).
7. Tagline — "Where the Wave Lives" (per Spec §35; contextual variants still open per the blueprint audit, §2).
8. Real-name content in the seed dataset — **Resolved: fictional-only** (`DECISIONS.md` D-05).

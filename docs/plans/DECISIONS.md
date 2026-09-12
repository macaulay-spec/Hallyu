# Hallyu — Technical Decisions, Assumptions & Spec Conflicts

> **Status:** Phase 2 deliverable — **requires owner review** before implementation.
> Rule applied (per project instructions): the existing specification is the product contract; nothing below changes product scope or behavior. Where a technical decision must be made, it is stated explicitly with rationale. Where the spec contains an internal conflict or requires an owner call, it is flagged here rather than silently resolved.

---

## A. Spec conflicts requiring owner sign-off

### D-01 — Mobile stack: Kotlin Multiplatform vs Spec §29 "React Native + Expo"
- **Spec says (§29):** Mobile = React Native + Expo + TypeScript; Backend = Supabase; CI = GitHub Actions + Expo EAS.
- **Project instruction says:** Build a real Kotlin Multiplatform application targeting Android + iOS; do not replace KMP with React Native/Flutter/web; build backend/infrastructure so frontend and backend actually connect.
- **Resolution applied:** **KMP is implemented** (owner instruction is the later, controlling directive — the instruction explicitly anticipates this conflict and forbids the RN path). The Spec's *architecture principles* are preserved exactly: PostgreSQL (Supabase's underlying database — self-hosted here), real authentication with server-side authorization and documented row-level policy (Spec §25A intent), modular monolith with no Redis/microservices (§30), single predictable state architecture (§29), Expo EAS replaced by GitHub Actions builds (CI function preserved).
- **Impact on the Spec's letter:** the *technology names* change; the *architecture, product behavior, data model, screens, security posture and MVP boundary do not*.
- **If the owner disagrees:** say so at review and the plan will be re-cut before any code is written.

### D-02 — Supabase platform vs self-hosted backend
- Spec §29/§46 name Supabase (Postgres + Auth + Storage + Realtime + Edge Functions) as the backend.
- A Supabase **cloud project cannot be provisioned from this environment** (requires account ownership/keys), and a fake Supabase layer would violate Spec §39 rule 8 (no fake backend) and §54 (never fake production behavior).
- **Resolution:** implement the **same capabilities** as a self-hosted Kotlin/Ktor backend with PostgreSQL: Auth (email/password, sessions, recovery), authorization policy matrix (RLS-intent, §25A), storage (local/S3 adapter with presigned uploads), realtime (WebSocket channel), server functions (Ktor modules = edge-function equivalents). Everything runs and is testable in CI with a real Postgres instance. Deploying to Supabase cloud remains possible for the Postgres layer (runbook included) — the API layer simply replaces PostgREST/Edge Functions, which is architecturally equivalent to the Spec's own "Edge Functions where appropriate" pattern.
- **Consequence (honest):** RLS-at-the-database is implemented as **API-layer row policy** because the client never connects to Postgres directly (which is also true in the Supabase design only for RLS-protected anonymous access — server-mediated access is the norm). The policy matrix is documented (`database/policies/POLICIES.md`) and integration-tested per row-policy rule (§44 Security: "unauthorized database access, private-content leakage"). Optionally, the same policies can be installed as true Postgres RLS on the DB as defense-in-depth for any direct-DB admin/BI path — documented in the runbook.

### D-03 — Push notifications (FCM/APNs) require external credentials
- FCM (server key/service account) and APNs (.p8 + Team ID) need accounts this environment does not own. Spec §54: "If an external dependency cannot be configured in the current environment, isolate it behind a clean adapter and clearly document the exact remaining configuration. Do not fake successful production behavior."
- **Resolution:** full push pipeline is implemented behind `PushAdapter` (FCM HTTP v1 + APNs providers); adapters are real code, config-gated; with no credentials the system runs in in-app/realtime-only mode and `hallyu setup` reports exactly which env vars remain to enable each provider. Device-token registration endpoints are live. No fake "notification sent" success states.
- **Android note:** FCM requires `google-services.json` in `androidApp`. Without it, the app builds and runs with realtime + in-app notifications; the file path and steps are in the runbook.

### D-04 — Email delivery (verification/recovery) requires SMTP credentials
- Same pattern as D-03: `Mailer` adapter (console mode logs the exact email + token to the server log for dev; SMTP mode when configured). Account recovery works end-to-end in dev via console mode; production needs `SMTP_URL`.

### D-05 — TMDB API key is external
- Spec §23 designates TMDB as the primary structured metadata source. Sync module + CLI `sync-tmdb` are fully implemented against TMDB's documented API; without a key they report "TMDB_API_KEY not set" honestly.
- **Resolution:** ship an **authored editorial seed dataset** (real, factual K-drama metadata hand-curated: ~15 dramas with full episode schedules, cast, genres — drawn from public factual knowledge, no scraping, clearly attributed in `database/seed/`) so the product's drama graph, hubs, episode discussions, feeds, spoiler engine and search are all fully functional and demo-able without external keys. TMDB sync augments this when configured.

## B. Technical decisions (engineering-level, not product-level)

### D-06 — UI framework: Compose Multiplatform
One UI codebase (Spec §29 "avoid introducing multiple overlapping state libraries"; the Spec's component-count argument for RN applies equally). Voyager for navigation (screen-stack model matching the 5-tab + modal architecture; deep-link router integrates cleanly). Koin for DI (KMP-stable, lightweight). Kotlin 2.1.x + CMP 1.7.x + AGP 8.7.x + Gradle 8.10+ (current stable alignment).

### D-07 — API style: REST/JSON v1, not GraphQL
Modular monolith + typed DTOs + cursor pagination; contract-tested via fixture pairs. Simpler to secure (route guards), matches Spec §30 simplicity, avoids GraphQL infrastructure; the Spec never mandates GraphQL.

### D-08 — Client cache: SQLDelight (drama metadata, feed pages, drafts)
Spec §31 requires cached drama metadata + lazy feeds; SQLDelight is the KMP-native SQL cache. Stale data is *flagged* as stale (never presented as fresh — Spec §39 rule 8 spirit).

### D-09 — Spoiler enforcement: server-side stripping + two-step reveal
Server strips guarded content from payloads (client never receives spoiler text/media it shouldn't see — stronger than client-side blur, which can be bypassed); reveal = auditable second fetch `?reveal=1`. Matches Spec §9 "should not be casually exposed" and §39 rule 3 (never bypass database security rules / never trust the client).

### D-10 — Trending & recommendations: SQL + rule engine, precomputed
Trend scores precomputed into `trend_scores` on a 15-min job (velocity, unique participants, freshness decay, community spread, per-entity caps — Spec §6 anti-domination). For You = explainable weighted signals with `reason` strings (Spec §17). No ML service (§17, §30).

### D-11 — Media: images only in MVP, but schema & upload pipeline are video-ready
Per Spec §22: `media_objects.kind` includes `video` + duration/transcode-state columns; MVP upload path validates an image allowlist (JPEG/PNG/WebP, ≤10MB), generates variants, moderation-gated. No fake video UI (Create sheet shows honest "coming in v1.1" chip, not a dead button — Spec §39 rule 10).

### D-12 — Communities: private = join-request + moderator approval (Spec §14 "approve members")
Owner/moderator roles with the Spec §14 moderation powers exactly: pin, lock, hide, remove, ban, approve members, edit rules. Community moderation **never** grants platform privileges (Spec §14/§26) — separate role scopes, tested.

### D-13 — Official accounts: verification is a *badge*, never a privilege (Spec §15/§26)
`official_accounts` + `verification_requests`; badge renders distinctly; official content is visually identifiable in feeds but never dominates (feed mix caps); users can mute official accounts. Two permission systems kept separate and tested.

### D-14 — Moderation: pipeline exactly per Spec §27
Report → classification (rule-based + optional AI adapter) → severity → narrowly-defined automated actions per explicit thresholds (e.g., spam-flood auto-hide) → human queue → decision → user notification → appeal → `audit_logs`. AI never sole authority for serious enforcement (§39 rule 13). Thresholds are config, documented.

### D-15 — Analytics: self-hosted event ingestion (Spec §33 events verbatim) with aggregate metric endpoints (DAU/WAU/MAU, D1/D7/D30, participation metrics). No third-party SDK dependency.

### D-16 — Testing: real Postgres in CI (GitHub Actions service container) — not H2 — because Spec §44 demands real security/RLS-intent verification and FTS/trigram behavior. JVM Postgres locally via apt for dev loop; CLI `smoke-test` runs the §48 journey end-to-end on every push.

### D-17 — Sandbox constraint: Android/iOS compile & test in GitHub Actions (repo is public → free OSS minutes; macOS runner for iOS). Local environment (2 CPU / 4GB) cannot run Android SDK/emulator; I will install a JDK locally to compile backend + shared JVM targets and run all tests that don't need device emulators; device-level verification is CI (emulator instrumented smoke) + documented manual runbook.

### D-18 — Accessibility (Spec §32): semantic content descriptions on every interactive element, focus order, 48dp touch targets, WCAG AA contrast tokens (checked in `check-design`), dynamic type via OS text scaling, reduced-motion media-query honoring, captions/alt-text fields in composer.

### D-19 — Brand/config (Spec §35 "configurable until trademark checks"): app name, tagline, scheme (`hallyu://`), and tokens are centralized in a single `BrandConfig` + design-token file; renaming is a one-file change.

### D-20 — Rate limiting & abuse prevention in-process (§28): token buckets per identity+route class; configurable; integration tests per §44 Security.

## C. Assumptions (stated for review)

1. **Owner instruction supersedes Spec §29 stack naming** (D-01). The rest of the Spec is followed as written.
2. **Spec §20 MVP boundary is the build scope** — all §21 exclusions respected; v1.1 items appear only as schema hooks/honest "coming soon" chips.
3. **Seed demo content:** for the product to be usable/reviewable at first run (feeds need content), a `--demo` seed creates demo users, official accounts, communities, posts, episode discussions. It is clearly labeled, idempotent, and never counted as "production data". Smoke tests rely on it.
4. **Email verification at signup** is config-gated OFF by default (Spec never mandates it for MVP; auth flows remain email+password with recovery) — enabled by env flag.
5. **Light theme**: Spec §35A gives a dark baseline; light theme is implemented from the same tokens (required by accessibility/platform norms), dark is default.
6. **`iosX64`** included for CI compile checks on Linux runners; **`iosArm64`** built on macOS runner. iOS Simulator app target supports x86_64 + arm64 simulators.
7. **Deep links**: custom scheme `hallyu://` universally; universal links (`https://`) wired in code but require an owned domain + AASA file at deployment (runbook documents the exact step — D-03 pattern).
8. **Port:** backend dev on 8080; client dev builds default to `http://10.0.2.2:8080` (Android emulator) / `http://localhost:8080` (iOS sim) with a single build-config override for a shared dev server.
9. **Versioning:** API `/v1` from day one (Spec implies long-lived clients); database migrations forward-only with baseline at V1.
10. **The Spec file itself remains untouched** at repo root (source of truth); all engineering docs live under `docs/`.

## D. Risks & mitigations

| Risk | Mitigation |
|---|---|
| KMP + Compose iOS stability edge cases | CMP 1.7 stable iOS; UI smoke on simulator in CI; conservative API usage |
| Build-agent minutes (macOS 6x cost) | iOS CI runs on PR/main only, not every push; caching via Gradle build-action |
| Sandbox can't run device tests locally | Emulator instrumented smoke in CI; manual runbook for low-end Android (Spec §31) |
| FTS quality (Korean text) | PG `pg_trigram` + `simple`+`english` configs for MVP; Korean tokenization documented as improvement path (no fake multilingual claims) |
| Single-viral-post domination (Spec §6) | Velocity + per-drama caps + decay window — unit-tested formula |
| Scope creep | Milestone gates (M0–M13) with Spec §45 DoD audit per feature; §21 list enforced in review checklist |

## E. Open questions for the owner (non-blocking — defaults chosen)

1. App display name: **"Hallyu"** (working brand per Spec §35) — confirm or rename later via one-file change (D-19).
2. Default spoiler preference for new users: **balanced** (guarded until watched-through matches; explicit reveals possible) — Spec §9 doesn't fix a default.
3. Should email verification be **required** before first feed? Default: no (friction); Spec §34 wants users to a populated feed fast.
4. Demo seed content volume: default **moderate** (15 dramas, ~40 demo users incl. official accounts, 8 communities, ~150 posts incl. episode discussions) — enough to make every screen alive for review; wipeable via `hallyu seed --reset`.

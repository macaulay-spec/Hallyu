# Hallyu — Technical Decisions, Assumptions & Spec Conflicts

> **Status:** Revision 2 — stack confirmed by owner (React Native + Expo + Convex, built via Freebuff).
> Rule applied (per project instructions): the existing specification is the product contract; nothing below changes product scope or behavior. Where a technical decision must be made, it is stated explicitly with rationale. Where the spec contains an internal conflict or requires an owner call, it is flagged here rather than silently resolved.
> **Supersedes:** the prior KMP/Ktor/Supabase revision of this document in full. That path was evaluated (see `Hallyu_Stack_Decision_Brief.md`) and replaced by owner decision on 2026-09-12.

---

## A. Spec conflicts requiring owner sign-off

### D-01 — Mobile stack: React Native + Expo (CONFIRMED — matches Spec §29 as written)
- **Spec says (§29):** Mobile = React Native + Expo + TypeScript.
- **Resolution:** **Confirmed as-is.** No conflict remains — this is the first revision where the build stack matches the Spec's own §29 recommendation exactly. The earlier KMP path (previous D-01) is retired.
- **Rationale (owner decision):** faster to a testable app, larger hiring pool, proven at social-feed scale (Instagram, Discord), avoids the unmeasured Compose-Multiplatform-iOS risk the prior revision had already flagged. See `Hallyu_Stack_Decision_Brief.md` for the full tradeoff writeup, kept as the record of why.

### D-02 — Backend: Convex (replaces Spec §29 "Supabase")
- **Spec says (§29/§46):** Supabase (Postgres + Auth + Storage + Realtime + Edge Functions).
- **Resolution:** **Convex** — a hosted reactive backend (TypeScript server functions + a realtime document database + file storage + scheduling + full-text search), with first-party Expo integration (`npx expo install convex` / EAS-provisioned deployment).
- **Why the substitution is architecturally faithful to §29's *intent*, not just its letter:** the Spec's Supabase choice is really asking for one thing — "don't hand-build auth/storage/realtime from scratch, use a managed platform that already does it, and keep infrastructure simple (§30)." Convex satisfies that same intent: managed auth (via Convex Auth or a provider like Clerk), managed file storage, and *automatic* realtime — every `useQuery` result updates live when underlying data changes, with no separate WebSocket wiring, cache-invalidation logic, or subscription plumbing to write. For a feed- and discussion-heavy product like Hallyu, this is arguably a **stronger** fit than Supabase's realtime add-on, not a downgrade.
- **Honest tradeoff (documented, not hidden):** Convex is a **document database with TypeScript query/mutation functions**, not Postgres/SQL. Spec §25's entity list (users, dramas, episodes, posts, comments, communities, etc.) is preserved exactly as a set of Convex tables with `v.id()` references standing in for foreign keys, and indexes declared in the Convex schema file standing in for the Spec's SQL indexes. What changes is the query language and the absence of native SQL joins — multi-entity reads (e.g., "post + author profile + drama context" for a feed item) are composed in TypeScript query functions instead of a SQL join. This is more verbose than SQL for complex joins but is a well-trodden pattern in Convex apps and does not reduce data integrity (Convex transactions are ACID/serializable).
- **RLS-equivalent:** Convex has no client-side database access at all — every read and write goes through a server-defined function, so authorization is enforced in that function body by construction (stronger default than needing to remember to enable RLS per table). The Spec's §25A "design RLS before exposing tables" intent is satisfied by writing an explicit auth check at the top of every query/mutation; this is documented per-module in `database/policies/POLICIES.md` (kept from the prior revision, rewritten against Convex functions instead of Postgres RLS policies).

### D-03 — Push notifications
- **Resolution:** **Expo Notifications** (wraps FCM for Android, APNs for iOS behind one Expo-managed API and one credential flow via `eas credentials`), triggered from Convex scheduled functions/actions on relevant events (new episode, reply, mention, followed-drama update). This still needs real Expo/Apple/Google push credentials before production sends will work — same honesty rule as before: without credentials configured, the system runs in in-app/realtime-only mode (Convex's live queries already cover most "you'd have gotten a push for this" cases while the app is foregrounded) and the setup CLI reports exactly what's missing.

### D-04 — Email delivery (verification/recovery)
- **Resolution:** Convex Auth's email provider (or a direct Resend/SMTP integration called from a Convex action) for verification and password-recovery email. Dev mode logs the email + token to the Convex dashboard/console instead of sending; production needs a real `RESEND_API_KEY` or SMTP credential. Same adapter-and-document pattern as before, not a fake "email sent" state.

### D-05 — TMDB API key is external (unchanged)
- Spec §23 designates TMDB as the primary structured metadata source. A TMDB sync module (implemented as a Convex action + cron) stays fully implemented against TMDB's documented API; without a key it reports "TMDB_API_KEY not set" honestly.
- **Resolution (unchanged from prior revision):** ship an authored editorial seed dataset (real, factual K-drama metadata: ~15 dramas with schedules, genres — public factual knowledge, no scraping) so the drama graph, hubs, episode discussions, feeds, and search all work without external keys. TMDB sync augments this when configured.
- **Seed-data content rule (new, resolves the blueprint audit's open question):** the demo/seed dataset uses **fictional dramas, fictional actors, and fictional "official accounts" only.** Real-title factual metadata pulled live from TMDB at runtime is fine (that's licensed data use); a real actor's photo and career presented as an in-app followable profile, or a real broadcaster's logo marked "verified official account," is not used anywhere in seed/demo content absent an actual agreement with that person or company. This applies to the blueprint set too — see the Blueprint Consistency Audit §3 fix item.

## B. Technical decisions (engineering-level, not product-level)

### D-06 — UI framework: React Native (Expo, TypeScript), styled with NativeWind
Matches Spec §29 exactly. NativeWind (Tailwind-style utility classes for RN) keeps the design-token system (colors, radii, spacing) expressible as a single config file, satisfying the same "avoid overlapping styling systems" spirit as the prior Compose-tokens decision.

### D-07 — Navigation: Expo Router
File-based routing, matching the 5-tab + modal + deep-link architecture in `SCREEN_NAVIGATION_MAP.md` directly (tab group + stack groups + a `+not-found` fallback); typed routes; deep links (`hallyu://…` + universal links) are native to Expo Router, no separate router library needed.

### D-08 — API style: Convex queries/mutations/actions, not REST
Replaces D-07 (prior revision's "REST/JSON v1"). Convex functions are called directly from typed client hooks (`useQuery`, `useMutation`) — there is no separate REST layer to design, version, or keep in sync with a client SDK; the generated `api` object from the `convex/` folder *is* the contract, and it's type-checked at compile time end-to-end. Versioning is handled by additive schema changes and deprecation comments rather than a `/v1` URL prefix, since client and backend deploy from the same repo.

### D-09 — Client cache: Convex's built-in reactive cache (no separate SQLDelight/offline DB layer in MVP)
Convex's client library already caches query results and keeps them live; for the MVP this satisfies Spec §31's "cached drama metadata" requirement without a second cache layer. A dedicated offline-first cache (e.g., for airplane-mode browsing of previously-seen content) is a `v1.1` candidate, not an MVP requirement — flagged here so it isn't silently added.

### D-10 — Spoiler enforcement: server-side stripping + two-step reveal (unchanged in principle)
A Convex query function strips guarded post/comment fields based on the requesting user's watch progress before the payload ever reaches the client (stronger than client-side blur). Reveal is a second, audited query call (`revealSpoiler` mutation logs the reveal). Matches Spec §9 and the "never trust the client" rule exactly as before — only the enforcement point moved from a Ktor route handler to a Convex query function.

### D-11 — Trending & recommendations: scheduled Convex function + rule engine, precomputed
A Convex cron job (`crons.ts`, every 15 min) recomputes a `trendScores` table (velocity, unique participants, freshness decay, per-drama caps — Spec §6 anti-domination). For You = explainable weighted signals with a `reason` string per item (Spec §17). No ML service (§17, §30 both still apply).

### D-12 — Media: images only in MVP, schema video-ready
Convex file storage handles uploads; the `mediaObjects` table includes a `kind` field (`image` now, `video` reserved) and transcode-state fields for later, per Spec §22. MVP upload path validates an image allowlist (JPEG/PNG/WebP, ≤10MB) and is moderation-gated before a post using it becomes visible. No fake video UI — the Create screen shows an honest "video — coming in v1.1" chip, not a dead button (Spec §39).

### D-13 — Communities: private = join-request + moderator approval (unchanged, Spec §14)
Owner/moderator roles enforced inside the relevant Convex mutations (`joinCommunity`, `approveMember`, `removeMember`, etc.) with the same power set as before: pin, lock, hide, remove, ban, approve members, edit rules. Community moderation never grants platform privileges (Spec §14/§26) — checked as a separate role table, tested.

### D-14 — Official accounts: verification is a badge, never a privilege (unchanged, Spec §15/§26)
`officialAccounts` + `verificationRequests` tables; badge renders distinctly; official content is visually flagged in feeds but capped in the feed mix; users can mute official accounts. Two permission systems kept separate and tested.

### D-15 — Moderation: pipeline exactly per Spec §27
Report → classification (rule-based, with an optional AI-classifier action hook) → severity → narrowly-defined automated actions per explicit config thresholds (e.g., spam-flood auto-hide) → human moderator queue → decision → user notification → appeal → `auditLogs` table. AI never sole authority for serious enforcement (§39). Thresholds are config values, documented in `docs/runbooks/moderation.md`.

### D-16 — Analytics: Convex table + aggregate query endpoints (Spec §33 events verbatim)
`analyticsEvents` table fed by a lightweight client event sink; admin-only aggregate query functions compute DAU/WAU/MAU, D1/D7/D30, and participation metrics on demand. No third-party analytics SDK dependency required for MVP.

### D-17 — Testing: Convex's local dev deployment + a persistent test deployment in CI
Convex ships a local/dev backend runnable in CI (`npx convex dev` against a disposable deployment, or Convex's testing utilities for isolated function tests). Unit tests cover query/mutation logic (spoiler policy, ranking rules, moderation thresholds) directly against a test deployment — this replaces the prior revision's "real Postgres in CI" requirement with "real Convex deployment in CI," same spirit: no mocked database layer standing in for the real thing.

### D-18 — Build tooling: Freebuff (free AI app builder) driving an Expo + Convex codebase, milestone by milestone
Freebuff Web's default stack (React + Convex) is steered explicitly toward **Expo + Convex** (native mobile, not the web default) for each milestone, working from `IMPLEMENTATION_PLAN.md`'s phase breakdown rather than one all-at-once prompt. Freebuff runs on open-source models (not frontier-tier), so **owner review of every generated milestone is mandatory** before moving to the next — this is a build-speed decision, not a reason to relax the Spec §39 safety rules or §45 definition-of-done checks, which still apply per feature regardless of which tool wrote the code.

### D-19 — Accessibility (Spec §32): unchanged in requirement, re-targeted to RN
Semantic `accessibilityLabel`/`accessibilityRole` on every interactive element, correct focus order, 44×44pt (iOS) / 48dp (Android) touch targets, WCAG AA contrast in the NativeWind token file, dynamic type via OS text-scaling support, `useReducedMotion` honored in animated components, captions/alt-text fields present in the composer schema.

### D-20 — Brand/config (Spec §35): centralized, renameable
App name, tagline, color scheme, and the `hallyu://` deep-link prefix live in one `brand.config.ts` + a NativeWind theme file; renaming remains a one-file change.

### D-21 — Rate limiting & abuse prevention (Spec §28)
Enforced inside Convex mutations via a token-bucket helper keyed on identity + action type (e.g., posts/min, reports/min, follow actions/min), backed by a Convex table rather than an external Redis — consistent with Spec §30's "no Redis until measured need."

## C. Assumptions (stated for review)

1. **Owner confirmed the stack change** on 2026-09-12: React Native + Expo + Convex, built with the Freebuff AI app builder. This supersedes assumption 1 of the prior revision (KMP).
2. **Spec §20 MVP boundary is still the build scope** — all §21 exclusions respected; v1.1 items appear only as schema fields/honest "coming soon" UI, never as working features.
3. **Seed demo content** is fictional-only per D-05's new rule; a `--demo` seed script (Convex mutation, run once via CLI) creates demo users, fictional official accounts, communities, posts, and episode discussions. Clearly labeled as demo data, never counted as production data.
4. **Email verification at signup** is config-gated OFF by default, same as the prior revision — enabled via an env flag when SMTP/Resend is configured.
5. **Theme:** dark is default per Spec §35A's baseline; a light theme is derived from the same NativeWind tokens.
6. **Deep links:** custom scheme `hallyu://` from day one; universal links (`https://`) wired in Expo Router config but require an owned domain + the platform-specific association files at deployment (documented as remaining config, D-03 pattern).
7. **Versioning:** since client and backend share one Convex deployment and one repo, there's no separate `/v1` API version to track — schema changes are additive and reviewed per milestone instead.
8. **The Spec file itself remains untouched** at repo root (source of truth); all engineering docs live under `docs/`.
9. **Freebuff is a build accelerant, not an unsupervised owner.** Every milestone it produces is reviewed against `IMPLEMENTATION_PLAN.md`'s exit criteria and Spec §45's definition-of-done before being accepted, exactly as if a human contractor had written it.

## D. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Convex's document-query model handles complex multi-entity joins less directly than SQL | Denormalize read-heavy joins (e.g., feed item author + drama context) into precomputed fields updated on write, where read volume justifies it; keep genuinely relational lookups as indexed queries composed in TypeScript |
| Freebuff (open-source models) may produce lower-quality or inconsistent code on complex features (spoiler engine, moderation pipeline, ranking) | Treat those specific features as "human/owner-reviewed" milestones — never accept them on a single pass; the design-system skill (see below) keeps at least the UI/UX layer consistent even when logic needs rework |
| Vendor dependency on Convex (hosted platform, not self-hosted like the prior Postgres plan) | Convex data is exportable; document an export/migration runbook so this isn't a silent lock-in the way the Spec's own §30 principle warns against |
| Push notifications / email need real credentials neither environment owns yet | Same adapter-and-document pattern as before (D-03/D-04) — app runs, honestly reports what's unconfigured |
| Scope creep, now compounded by an AI builder's tendency to "helpfully" add things | Spec §21's exclusion list is enforced in review of every Freebuff-generated milestone, not just at final review |

## E. Open questions for the owner (non-blocking — defaults chosen)

1. App display name: **"Hallyu"** — confirm or rename later via one-file change (D-20).
2. Default spoiler preference for new users: **balanced** (unchanged).
3. Should email verification be **required** before first feed? Default: no (unchanged rationale — friction).
4. Demo seed content volume: default **moderate** (15 dramas, ~40 demo users incl. fictional official accounts, 8 communities, ~150 posts) — unchanged, now explicitly fictional-only per D-05.
5. Auth provider inside Convex: **Convex Auth** (email/password + optional social) is the default; Clerk is a documented drop-in alternative if social-login breadth becomes a priority later.

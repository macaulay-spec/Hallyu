# Hallyu — AI-to-AI Handoff Document

> Single source of truth for continuing this project. Any AI (or human) picking up
> this repo must read this first. Updated at every push.
> Companions: docs/PLAN.md, docs/ARCHITECTURE.md, docs/DECISIONS.md, docs/SCREEN_MAP.md, docs/blueprints/.

## 0. Mission (user intent)

Build the Hallyu K-drama community platform end-to-end: backend + frontend (Kotlin
Multiplatform: Android + iOS; no React Native / Flutter / web), following the master
spec file "Hallyu_Final_Integrated_Master_Build_Specification (2).md" (READ-ONLY,
lives at /workspace/ next to the repo). No mock APIs or fake functionality (Spec 39).
The CLI must be genuinely useful (Spec 34). GitHub Actions CI must run. The project
must remain continuable by another AI at any point (this document is that mechanism).

## 1. Repo state (2026-09-12)

- Branch: feature/m0-scaffold (pushed commit 6373b4c = M0 scaffold).
- PR #1 (feature/planning-and-blueprints, planning docs + 19 blueprints) was approved and merged to main.
- M1 backend core (13 Kotlin files: config, tables, db, migrations, errors, plugins,
  server, main, passwords, jwt, auth plugin/service/routes) compiles locally
  (BUILD SUCCESSFUL, JDK 17) and is being pushed with this document.
- CI at 6373b4c: shared workflow passed; backend/android failed on compile errors
  that are now fixed locally; ios.yml fails until iosApp exists (expected until M11).

## 2. Local build (sandbox)

    cd /workspace/hallyu-repo
    export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
    ./gradlew :backend:compileKotlin
    ./gradlew :cli:compileKotlin
    ./gradlew :shared:shared-domain:allTests
    ./gradlew :androidApp:assembleDebug

- JDK 17: /usr/lib/jvm/java-17-openjdk-amd64
- Gradle 8.10.2 + wrapper in repo
- Android SDK: /workspace/tools/android-sdk (platform 35)
- PostgreSQL 15 localhost:5432 user postgres password hallyu_dev,
  databases hallyu_dev and hallyu_test; V1 migration applied to both (31 tables).
- Kotlin/Native iOS targets compile in CI (macos-14) or on a Mac only;
  gradle.properties sets kotlin.native.ignoreDisabledTargets=true.

## 3. Anti-corruption notes (critical for any writer)

- Write long Kotlin/YAML files via bash heredoc (cat > file <<'EOF') through the
  terminal. The dedicated file-writing tool intermittently corrupts long source
  files (foreign glyphs, mangled identifiers, broken YAML nesting). Even heredocs
  can rarely corrupt: always verify written files (grep for key identifiers,
  compile, python yaml.safe_load for YAML) and rewrite if mangled.
- Exposed 0.56 gotchas (already fixed in code, do not regress):
  index(colA, colB) without a name is NOT a valid overload; use
  index(isUnique = false, colA, colB) or the name-first overload.
  uniqueIndex(colA, colB) name-less multi-column form IS valid.
  date()/datetime() need import org.jetbrains.exposed.sql.javatime.date / .datetime.
- Ktor 2.3 quirk: package is io.ktor.server.plugins.callloging (one g).
- No Ktor Authentication plugin: auth is bearer-header helpers
  (principal(jwt), requireUserId(jwt), requireRole(jwt, ...)) on ApplicationCall.
- Server DI via Application.attributes keys: ConfigKey, JwtKey, AuthServiceKey.
- Version catalog gradle/libs.versions.toml is authoritative for all versions.

## 4. What is implemented (backend M1 core, compile-verified)

    backend/src/main/kotlin/com/hallyu/backend/
      config/AppConfig.kt      @Serializable config from HALYU_* env vars
      db/Tables.kt             all 31 Exposed table objects
      db/Database.kt           HallyuDb (HikariCP pool) + dbQuery (deadlock retry)
      db/Migrations.kt         JDBC migration runner (schema_migrations table)
      http/ApiError.kt         error envelope {"error":{code,message,details}} + ApiException hierarchy
      http/Plugins.kt          serialization, CORS, StatusPages, misc
      http/Server.kt           hallyuModule(config): DI attributes + routing skeleton
      Main.kt                  embeddedServer Netty, applies migrations then serves
      security/Passwords.kt    Argon2id hash/verify/timing-safe burnCycles
      security/JwtService.kt   HS256 access tokens (15 min, claims userId+role+jti)
      auth/AuthPlugin.kt       bearer helpers (no Ktor auth plugin)
      auth/AuthService.kt      signup/login/refresh rotation/family revocation/logout
      auth/AuthRoutes.kt       /v1/auth/{signup,login,refresh,logout}

- Routes live so far: /health, /v1/health, /v1/auth/*. More added in M2+.
- Schema: database/migrations/V1__initial_schema.sql, 31 tables, applied locally.
- Auth design: Argon2id hashing; JWT access 15 min; opaque rotating refresh tokens
  (48-byte SecureRandom, SHA-256 stored) with family-based theft detection.

## 4b. CI (4 workflows, .github/workflows/)

- backend.yml: postgres service, :backend:test :cli:test :backend:jar :cli:jar
- android.yml: :androidApp:assembleDebug + shared-domain tests
- ios.yml: macos-14, compileKotlinIosArm64 x3 + xcodebuild (fails until iosApp exists, M11)
- shared.yml: shared-domain + shared-data allTests
- Pushing to any branch triggers matching workflows (paths filter on push).

## 4c. Push protocol (user-specified)

    git push https://x-access-token:$GITHUB_TOKEN@github.com/macaulay-spec/Hallyu.git HEAD:refs/heads/<branch>

Never print the token. Always feature branches; PR into main.

## 5. Next actions for the receiving AI (M2 onward)

1. Read docs/PLAN.md (authoritative milestone list) and docs/SCREEN_MAP.md.
2. M2 = profiles + follows + blocks/mutes: routes GET/PUT /v1/me, onboarding,
   GET /v1/users/{handle}, POST/DELETE /v1/follows, GET /v1/me/following|followers,
   POST/DELETE /v1/blocks, /v1/mutes. Reuse UserPrincipal/requireUserId helpers.
3. Branch naming: feature/m2-social etc. Write Kotlin via heredocs, compile with
   :backend:compileKotlin after each file batch, test locally, PR.
4. M3 = posts/comments(3-level)/reactions/reposts/bookmarks/hashtags/mentions.
5. M4 = drama graph + spoiler engine (server-side strip/reveal + audit table).
6. M5 = feeds (For You/Following) + trending snapshots + PG full-text search.
7. M6 = communities + moderation (reports/queue/actions) + notifications.
8. M7 = media pipeline (local disk MediaStore, moderation gate, admin endpoints).
9. M8 = CLI (setup/migrate/serve/seed/smoke-test/validate/create-admin/token/stats).
10. M9-M11 = shared-domain models, shared-data API client, shared-ui 33 screens,
    androidApp shell, iosApp Xcode project (ios.yml goes green then).
11. M12 = backend tests (Ktor test host + real Postgres) + all CI green.
12. M13 = final docs (README, POLICIES.md, BUILD_STATUS.md), seed data, merge to main.

## 6. Budget

User allocation: about 100 credits of 138 total to finish end-to-end. Keep local
compiles in the sandbox to minimize CI burns; update this file at every push.

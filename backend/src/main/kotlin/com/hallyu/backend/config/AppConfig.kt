package com.hallyu.backend.config

import kotlinx.serialization.Serializable

/**
 * Runtime configuration, loaded from environment variables (12-factor style).
 * Every external dependency is config-gated per DECISIONS.md D-03/04/05:
 * unconfigured adapters degrade honestly, never fake success.
 */
@Serializable
data class AppConfig(
    val env: String = "dev",
    val host: String = "0.0.0.0",
    val port: Int = 8080,
    val databaseUrl: String,
    val dbPoolMax: Int = 10,
    val jwtSecret: String,
    val jwtAccessTtlSeconds: Long = 15L * 60,
    val refreshTtlDays: Int = 60,
    val mediaDir: String = "/tmp/hallyu-media",
    val publicBaseUrl: String = "http://localhost:8080",
    // Config-gated externals (D-03/D-04/D-05)
    val fcmCredentialsFile: String? = null,
    val apnsKeyFile: String? = null,
    val apnsTeamId: String? = null,
    val apnsKeyId: String? = null,
    val smtpHost: String? = null,
    val smtpPort: Int? = null,
    val smtpUser: String? = null,
    val smtpPassword: String? = null,
    val tmdbApiKey: String? = null,
    val corsOrigins: List<String> = listOf("http://localhost:8080"),
    val seedOnStart: Boolean = false,
) {
    companion object {
        fun fromEnv(): AppConfig = AppConfig(
            env = System.getenv("HALYU_ENV") ?: "dev",
            host = System.getenv("HALYU_HOST") ?: "0.0.0.0",
            port = System.getenv("HALYU_PORT")?.toIntOrNull() ?: 8080,
            databaseUrl = System.getenv("HALYU_DB_URL")
                ?: "jdbc:postgresql://localhost:5432/hallyu_dev?user=postgres&password=hallyu_dev",
            dbPoolMax = System.getenv("HALYU_DB_POOL")?.toIntOrNull() ?: 10,
            jwtSecret = System.getenv("HALYU_JWT_SECRET") ?: devJwtSecret(),
            publicBaseUrl = System.getenv("HALYU_PUBLIC_URL") ?: "http://localhost:8080",
            mediaDir = System.getenv("HALYU_MEDIA_DIR") ?: "/tmp/hallyu-media",
            fcmCredentialsFile = System.getenv("HALYU_FCM_CREDENTIALS_FILE"),
            apnsKeyFile = System.getenv("HALYU_APNS_KEY_FILE"),
            apnsTeamId = System.getenv("HALYU_APNS_TEAM_ID"),
            apnsKeyId = System.getenv("HALYU_APNS_KEY_ID"),
            smtpHost = System.getenv("HALYU_SMTP_HOST"),
            smtpPort = System.getenv("HALYU_SMTP_PORT")?.toIntOrNull(),
            smtpUser = System.getenv("HALYU_SMTP_USER"),
            smtpPassword = System.getenv("HALYU_SMTP_PASSWORD"),
            tmdbApiKey = System.getenv("HALYU_TMDB_API_KEY"),
            seedOnStart = System.getenv("HALYU_SEED_ON_START")?.equals("true", true) ?: false,
        )

        private fun devJwtSecret(): String = "hallyu-dev-only-secret-DO-NOT-USE-IN-PRODUCTION"
    }
}

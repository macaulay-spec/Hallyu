package com.hallyu.backend.db

import com.hallyu.backend.config.AppConfig
import org.slf4j.LoggerFactory
import java.io.File
import java.sql.Connection
import java.sql.DriverManager

/**
 * Ordered SQL migration runner (Flyway-style, no extra dependency).
 * Uses a dedicated JDBC connection (NOT the Exposed transaction) so migrations can
 * manage their own transaction scope (V1 contains BEGIN/COMMIT).
 */
object Migrations {
    private val log = LoggerFactory.getLogger(Migrations::class.java)
    private val VERSION_REGEX = Regex("""^V(\d+)__.*\.sql$""")

    fun migrationsDir(): File {
        val candidates = listOfNotNull(
            System.getenv("HALYU_MIGRATIONS_DIR")?.let(::File),
            File("database/migrations"),
            File("../database/migrations"),
            File("src/main/resources/database/migrations"),
        )
        return candidates.firstOrNull { it.isDirectory }
            ?: error("Migrations directory not found; set HALYU_MIGRATIONS_DIR")
    }

    fun run(dbUrl: String? = null): List<String> {
        val url = dbUrl ?: System.getenv("HALYU_DB_URL")
            ?: "jdbc:postgresql://localhost:5432/hallyu_dev?user=postgres&password=hallyu_dev"
        val dir = migrationsDir()
        val files = dir.listFiles { f: File -> VERSION_REGEX.matches(f.name) }
            ?.sortedBy { VERSION_REGEX.find(it.name)!!.groupValues[1].toInt() }
            ?: emptyList()
        if (files.isEmpty()) error("No migration files found in ${dir.absolutePath}")

        return DriverManager.getConnection(url).use { conn ->
            conn.autoCommit = true
            conn.createStatement().use { st ->
                st.execute("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT, applied_at TIMESTAMPTZ DEFAULT now())")
            }
            val applied = conn.createStatement().use { st ->
                st.executeQuery("SELECT version FROM schema_migrations ORDER BY version").use { rs ->
                    val set = mutableSetOf<Int>()
                    while (rs.next()) set.add(rs.getInt(1))
                    set
                }
            }
            val appliedNow = mutableListOf<String>()
            for (f in files) {
                val version = VERSION_REGEX.find(f.name)!!.groupValues[1].toInt()
                if (version in applied) continue
                log.info("Applying migration ${f.name}")
                conn.autoCommit = false
                val sql = f.readText()
                val body = sql.replace("BEGIN;", "").replace("COMMIT;", "")
                conn.prepareStatement(body).use { it.execute() }
                conn.createStatement().use { it.executeUpdate("INSERT INTO schema_migrations(version, name) VALUES ($version, '${f.name.replace("'", "''")}')") }
                conn.commit()
                conn.autoCommit = true
                appliedNow += "V${version}: ${f.name}"
            }
            appliedNow
        }
    }

    fun appliedVersions(dbUrl: String? = null): List<Int> {
        val url = dbUrl ?: System.getenv("HALYU_DB_URL")
            ?: "jdbc:postgresql://localhost:5432/hallyu_dev?user=postgres&password=hallyu_dev"
        return DriverManager.getConnection(url).use { conn ->
            conn.createStatement().use { st ->
                st.execute("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT, applied_at TIMESTAMPTZ DEFAULT now())")
                st.executeQuery("SELECT version FROM schema_migrations ORDER BY version").use { rs ->
                    val out = mutableListOf<Int>()
                    while (rs.next()) out.add(rs.getInt(1))
                    out
                }
            }
        }
    }
}

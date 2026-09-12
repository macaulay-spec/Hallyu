package com.hallyu.backend.db

import com.hallyu.backend.config.AppConfig
import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.transactions.transaction
import java.sql.Connection

/**
 * Single HikariCP-backed [Database] for the whole backend (modular monolith).
 * DAOs use [dbQuery] which runs inside a transaction with SERIALIZABLE-friendly
 * retry on serialization failures.
 */
object HallyuDb {
    private lateinit var ds: HikariDataSource
    lateinit var instance: Database
        private set

    fun connect(config: AppConfig): Database {
        val hc = HikariConfig().apply {
            jdbcUrl = config.databaseUrl
            maximumPoolSize = config.dbPoolMax
            minimumIdle = 2
            isAutoCommit = false
            transactionIsolation = "TRANSACTION_READ_COMMITTED"
            poolName = "hallyu-pool"
        }
        ds = HikariDataSource(hc)
        instance = Database.connect(ds)
        return instance
    }

    fun close() {
        if (::ds.isInitialized) ds.close()
    }
}

/** Run a transaction; retries on serialization/deadlock once for safety. */
fun <T> dbQuery(retryOnConflict: Boolean = true, block: () -> T): T {
    return try {
        transaction { block() }
    } catch (e: Exception) {
        if (retryOnConflict && (e.message?.contains("deadlock", ignoreCase = true) == true ||
                    e.message?.contains("serialization failure", ignoreCase = true) == true)) {
            Thread.sleep(50)
            transaction { block() }
        } else throw e
    }
}

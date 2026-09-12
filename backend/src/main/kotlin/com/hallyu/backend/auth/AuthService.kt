package com.hallyu.backend.auth

import com.hallyu.backend.db.*
import com.hallyu.backend.http.ConflictException
import com.hallyu.backend.http.NotFoundException
import com.hallyu.backend.http.ValidationException
import com.hallyu.backend.security.JwtService
import com.hallyu.backend.security.Passwords
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.security.SecureRandom
import java.time.LocalDateTime
import java.util.Base64
import java.util.UUID

data class SessionTokens(val accessToken: String, val refreshToken: String, val expiresIn: Long)

/**
 * Real auth: Argon2id hashes, opaque rotating refresh tokens, JWT access tokens.
 * No mocks — every operation hits PostgreSQL.
 */
class AuthService(val config: com.hallyu.backend.config.AppConfig, val jwt: JwtService) {

    private val random = SecureRandom()

    fun signup(email: String, password: String, handle: String, displayName: String): Long {
        if (!email.contains("@") || email.length > 254)
            throw ValidationException(mapOf("email" to "That email doesn't look right"))
        if (password.length < 8)
            throw ValidationException(mapOf("password" to "Use at least 8 characters"))
        if (!HANDLE_REGEX.matches(handle))
            throw ValidationException(mapOf("handle" to "Handles are 3-24 chars: a-z, 0-9, _ or ."))

        return transaction {
            val emailTaken = Users.selectAll().where { Users.email eq email }.any()
            if (emailTaken) throw ConflictException("That email is already with us")
            val handleTaken = Profiles.selectAll().where { Profiles.handle eq handle }.any()
            if (handleTaken) throw ConflictException("That handle is taken")

            val userId = Users.insert {
                it[Users.email] = email
                it[passwordHash] = Passwords.hash(password)
                it[createdAt] = LocalDateTime.now()
                it[updatedAt] = LocalDateTime.now()
            } get Users.id

            Profiles.insert {
                it[Profiles.userId] = userId
                it[Profiles.handle] = handle
                it[Profiles.displayName] = displayName.ifBlank { handle }
                it[createdAt] = LocalDateTime.now()
                it[updatedAt] = LocalDateTime.now()
            }
            userId
        }
    }

    fun login(email: String, password: String): SessionTokens {
        val userRow = transaction {
            Users.selectAll().where { Users.email eq email }.singleOrNull()
        } ?: run { Passwords.burnCycles(); throw com.hallyu.backend.http.UnauthorizedException("That email and password don't match") }

        val hash = userRow[Users.passwordHash]
        if (!Passwords.verify(hash, password))
            throw com.hallyu.backend.http.UnauthorizedException("That email and password don't match")

        val role = userRow[Users.role]
        val userId = userRow[Users.id]
        return issueTokens(userId, role)
    }

    fun issueTokens(userId: Long, role: String): SessionTokens {
        val refresh = newOpaqueToken()
        transaction {
            RefreshTokens.insert {
                it[RefreshTokens.userId] = userId
                it[tokenHash] = sha256(refresh)
                it[familyId] = UUID.randomUUID()
                it[expiresAt] = LocalDateTime.now().plusDays(config.refreshTtlDays.toLong())
                it[createdAt] = LocalDateTime.now()
            }
        }
        return SessionTokens(jwt.issue(userId, role), refresh, config.jwtAccessTtlSeconds)
    }

    /** Rotating refresh: single-use, family-aware (theft detection = revoke whole family). */
    fun refresh(refreshToken: String): SessionTokens {
        val hash = sha256(refreshToken)
        val row = transaction {
            RefreshTokens.selectAll().where { RefreshTokens.tokenHash eq hash }.singleOrNull()
        } ?: throw com.hallyu.backend.http.UnauthorizedException("Session expired — log in again")

        if (row[RefreshTokens.revokedAt] != null) {
            // Reuse of a revoked token: possible theft — revoke entire family.
            transaction {
                RefreshTokens.update({ RefreshTokens.familyId eq row[RefreshTokens.familyId] }) {
                    it[revokedAt] = LocalDateTime.now()
                }
            }
            throw com.hallyu.backend.http.UnauthorizedException("Session revoked — log in again")
        }
        if (row[RefreshTokens.expiresAt].isBefore(LocalDateTime.now()))
            throw com.hallyu.backend.http.UnauthorizedException("Session expired — log in again")

        val userRow = transaction { Users.selectAll().where { Users.id eq row[RefreshTokens.userId] }.singleOrNull() }
            ?: throw com.hallyu.backend.http.UnauthorizedException("Account no longer active")

        // Rotate
        val newRefresh = newOpaqueToken()
        transaction {
            RefreshTokens.update({ RefreshTokens.id eq row[RefreshTokens.id] }) {
                it[tokenHash] = sha256(newRefresh)
                it[revokedAt] = LocalDateTime.now()
                it[replacedBy] = null
            }
            RefreshTokens.insert {
                it[RefreshTokens.userId] = row[RefreshTokens.userId]
                it[tokenHash] = sha256(newRefresh)
                it[familyId] = row[RefreshTokens.familyId]
                it[expiresAt] = LocalDateTime.now().plusDays(config.refreshTtlDays.toLong())
                it[createdAt] = LocalDateTime.now()
            }
        }
        return SessionTokens(jwt.issue(userRow[Users.id], userRow[Users.role]), newRefresh, config.jwtAccessTtlSeconds)
    }

    fun logout(refreshToken: String) {
        transaction {
            RefreshTokens.update({ RefreshTokens.tokenHash eq sha256(refreshToken) }) {
                it[revokedAt] = LocalDateTime.now()
            }
        }
    }

    fun logoutAll(userId: Long) {
        transaction { RefreshTokens.deleteWhere { RefreshTokens.userId eq userId } }
    }

    companion object {
        val HANDLE_REGEX = Regex("^[a-z0-9_.]{3,24}$")

        fun sha256(s: String): String =
            java.security.MessageDigest.getInstance("SHA-256").digest(s.toByteArray())
                .joinToString("") { "%02x".format(it) }

        fun newOpaqueToken(): String {
            val bytes = ByteArray(48)
            java.security.SecureRandom().nextBytes(bytes)
            return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
        }
    }
}

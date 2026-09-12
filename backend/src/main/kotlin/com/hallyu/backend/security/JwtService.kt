package com.hallyu.backend.security

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.hallyu.backend.config.AppConfig
import java.time.Instant
import java.util.Date
import java.util.UUID

/**
 * HS256 access tokens, 15 minutes, carrying the minimum identity claims.
 */
class JwtService(private val config: AppConfig) {
    private val algorithm = Algorithm.HMAC256(config.jwtSecret)
    private val issuer = "hallyu"

    fun issue(userId: Long, role: String): String = JWT.create()
        .withIssuer(issuer)
        .withSubject(userId.toString())
        .withClaim("role", role)
        .withClaim("jti", UUID.randomUUID().toString())
        .withExpiresAt(Date.from(Instant.now().plusSeconds(config.jwtAccessTtlSeconds)))
        .sign(algorithm)

    data class AccessClaims(val userId: Long, val role: String)

    fun verify(token: String): AccessClaims? = try {
        val decoded = JWT.require(algorithm).withIssuer(issuer).build().verify(token)
        AccessClaims(
            userId = decoded.subject.toLong(),
            role = decoded.getClaim("role").asString() ?: "user",
        )
    } catch (e: Exception) { null }
}

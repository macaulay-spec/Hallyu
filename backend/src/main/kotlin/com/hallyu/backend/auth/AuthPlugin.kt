package com.hallyu.backend.auth

import com.hallyu.backend.http.ForbiddenException
import com.hallyu.backend.http.UnauthorizedException
import com.hallyu.backend.security.JwtService
import io.ktor.server.application.*
import io.ktor.server.request.*

/** Authenticated identity extracted from the Authorization: Bearer header. */
data class UserPrincipal(val userId: Long, val role: String)

/**
 * Lightweight auth: every protected route calls requireUserId() / requireRole().
 * Access tokens only (HS256, 15 min); refresh lives exclusively in /v1/auth/refresh.
 */
val ApplicationCall.bearerToken: String?
    get() = request.headers["Authorization"]?.takeIf { it.startsWith("Bearer ", ignoreCase = true) }?.substring(7)?.trim()

fun ApplicationCall.principal(jwt: JwtService): UserPrincipal? {
    val token = bearerToken ?: return null
    val claims = jwt.verify(token) ?: return null
    return UserPrincipal(claims.userId, claims.role)
}

fun ApplicationCall.requireUserId(jwt: JwtService): Long =
    principal(jwt)?.userId ?: throw UnauthorizedException()

fun ApplicationCall.requireRole(jwt: JwtService, vararg roles: String): Long {
    val p = principal(jwt) ?: throw UnauthorizedException()
    if (roles.isNotEmpty() && p.role !in roles) throw ForbiddenException()
    return p.userId
}

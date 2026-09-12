package com.hallyu.backend.auth

import com.hallyu.backend.http.AuthServiceKey
import com.hallyu.backend.http.BadRequestException
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable

@Serializable data class SignupRequest(val email: String, val password: String, val handle: String, val displayName: String = "")
@Serializable data class LoginRequest(val email: String, val password: String)
@Serializable data class RefreshRequest(val refreshToken: String)
@Serializable data class LogoutRequest(val refreshToken: String)
@Serializable data class TokenResponse(val accessToken: String, val refreshToken: String, val expiresIn: Long)

/** Auth endpoints under /v1/auth. */
fun Route.authRoutes() {
    route("/auth") {
        post("/signup") {
            val svc = call.application.attributes[AuthServiceKey]
            val req = call.receive<SignupRequest>()
            val userId = svc.signup(req.email, req.password, req.handle, req.displayName)
            val tokens = svc.issueTokens(userId, "user")
            call.respond(HttpStatusCode.Created, TokenResponse(tokens.accessToken, tokens.refreshToken, tokens.expiresIn))
        }
        post("/login") {
            val svc = call.application.attributes[AuthServiceKey]
            val req = call.receive<LoginRequest>()
            val tokens = call.authService.login(req.email, req.password)
            call.respond(TokenResponse(tokens.accessToken, tokens.refreshToken, tokens.expiresIn))
        }
        post("/refresh") {
            val svc = call.application.attributes[AuthServiceKey]
            val req = call.receive<RefreshRequest>()
            val tokens = call.authService.refresh(req.refreshToken)
            call.respond(TokenResponse(tokens.accessToken, tokens.refreshToken, tokens.expiresIn))
        }
        post("/logout") {
            val svc = call.application.attributes[AuthServiceKey]
            val req = call.receive<LogoutRequest>()
            call.authService.logout(req.refreshToken)
            call.respond(mapOf("ok" to true))
        }
    }
}

val ApplicationCall.authService: AuthService
    get() = application.attributes[AuthServiceKey]

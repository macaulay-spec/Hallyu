package com.hallyu.backend.http

import com.hallyu.backend.auth.AuthService
import com.hallyu.backend.auth.authRoutes
import com.hallyu.backend.config.AppConfig
import com.hallyu.backend.security.JwtService
import io.ktor.http.ContentType
import io.ktor.server.application.*
import io.ktor.server.netty.EngineMain
import io.ktor.server.routing.*
import io.ktor.server.response.*
import io.ktor.server.websocket.*
import io.ktor.util.*
import io.ktor.websocket.*
import java.time.Duration

val AuthServiceKey = AttributeKey<AuthService>("hallyu-auth-service")
val JwtKey = AttributeKey<JwtService>("hallyu-jwt")
val ConfigKey = AttributeKey<AppConfig>("hallyu-config")

/** Server assembly. Serialization -> errors -> CORS -> auth -> routes. */
fun Application.hallyuModule(config: AppConfig) {
    val jwt = JwtService(config)
    val auth = AuthService(config, jwt)

    attributes.put(ConfigKey, config)
    attributes.put(JwtKey, jwt)
    attributes.put(AuthServiceKey, auth)

    configureSerialization()
    configureErrorHandling()
    configureCors(config)
    configureMisc()
    install(WebSockets) {
        pingPeriod = Duration.ofSeconds(20)
        timeout = Duration.ofSeconds(15)
    }

    routing {
        get("/health") { call.respondText("ok") }
        get("/v1/health") {
            call.respondText("{\"status\":\"ok\"}", ContentType.Application.Json)
        }
        route("/v1") {
            authRoutes()
        }
    }
}

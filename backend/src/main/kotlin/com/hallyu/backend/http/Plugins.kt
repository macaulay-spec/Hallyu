package com.hallyu.backend.http

import com.hallyu.backend.config.AppConfig
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.application.*
import io.ktor.server.plugins.callloging.*
import io.ktor.server.plugins.compression.*
import io.ktor.server.plugins.cors.*
import io.ktor.server.plugins.defaultheaders.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.util.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.plugins.contentnegotiation.*
import kotlinx.serialization.json.Json
import org.slf4j.event.Level

fun Application.configureSerialization() {
    install(ContentNegotiation) {
        json(Json {
            ignoreUnknownKeys = true
            encodeDefaults = false
            explicitNulls = false
        })
    }
}

fun Application.configureCors(config: AppConfig) {
    install(CORS) {
        config.corsOrigins.forEach { allowHost(it.removePrefix("http://").removePrefix("https://"), schemes = listOf("http", "https")) }
        allowHeader(HttpHeaders.ContentType)
        allowHeader(HttpHeaders.Authorization)
        allowHeader("X-Client-Platform")
        allowMethod(HttpMethod.Get)
        allowMethod(HttpMethod.Post)
        allowMethod(HttpMethod.Patch)
        if (config.env == "dev") allowCredentials = true
    }
}

fun Application.configureErrorHandling() {
    install(StatusPages) {
        exception<ApiException> { call, cause ->
            call.respond(HttpStatusCode.fromValue(cause.status), ApiErrorBody(ApiErrorDetail(cause.code, cause.message ?: "error", cause.details)))
        }
        exception<BadRequestException> { call, cause ->
            call.respond(HttpStatusCode.BadRequest, ApiErrorBody(ApiErrorDetail("bad_request", cause.message ?: "Bad request")))
        }
        exception<Throwable> { call, cause ->
            call.application.environment.log.error("Unhandled", cause)
            call.respond(HttpStatusCode.InternalServerError, ApiErrorBody(ApiErrorDetail("internal_error", "Something broke on our side")))
        }
        status(HttpStatusCode.NotFound) { call, _ ->
            call.respond(HttpStatusCode.NotFound, ApiErrorBody(ApiErrorDetail("not_found", "Couldn't find that")))
        }
    }
}

fun Application.configureMisc() {
    install(DefaultHeaders)
    install(Compression)
    install(CallLogging) {
        level = Level.INFO
        filter { it.request.path().startsWith("/v1") }
        format { call -> "HTTP ${call.request.httpMethod.value} ${call.request.path()}" }
    }
}

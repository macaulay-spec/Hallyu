package com.hallyu.backend.http

import kotlinx.serialization.Serializable

/** Spec-consistent error envelope: {"error": {"code": ..., "message": ..., "details": ...}} */
@Serializable
data class ApiErrorBody(val error: ApiErrorDetail)

@Serializable
data class ApiErrorDetail(
    val code: String,
    val message: String,
    val details: String? = null,
)

/** Domain exceptions that map to HTTP status codes. */
open class ApiException(val status: Int, val code: String, message: String, val details: String? = null) :
    Exception(message)

class BadRequestException(message: String, details: String? = null) : ApiException(400, "bad_request", message, details)
class UnauthorizedException(message: String = "Authentication required") : ApiException(401, "unauthorized", message)
class ForbiddenException(message: String = "You don't have permission to do that") : ApiException(403, "forbidden", message)
class NotFoundException(message: String = "Not found") : ApiException(404, "not_found", message)
class ConflictException(message: String) : ApiException(409, "conflict", message)
class TooManyRequestsException(message: String = "Slow down a bit") : ApiException(429, "rate_limited", message)
class ValidationException(val fieldErrors: Map<String, String>) :
    ApiException(422, "validation_failed", "Some fields need attention", fieldErrors.toString())

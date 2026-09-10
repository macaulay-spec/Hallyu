package com.hallyu.common

/**
 * App-level error taxonomy. Maps cleanly onto the spec's empty/loading/error states (§38):
 * every important screen needs a deliberate, human-readable failure state with retry.
 */
sealed class AppError(val description: String) {
    object Network : AppError("Network unavailable. Couldn't load this right now.")
    object Unauthorized : AppError("Your session has expired. Please log in again.")
    object NotFound : AppError("Not found.")
    object NotConfigured : AppError(
        "Backend is not configured yet. Add SUPABASE_URL and SUPABASE_ANON_KEY and rebuild."
    )
    data class Server(val status: Int, val message: String) : AppError(
        if (message.isBlank()) "Something went wrong (HTTP $status)." else message
    )
    data class Unknown(val message: String) : AppError(
        if (message.isBlank()) "Something went wrong." else message
    )

    val isRetryable: Boolean
        get() = when (this) {
            Network, is Server -> true
            else -> false
        }
}

package com.hallyu.common

/**
 * Uniform result type used across the data and domain layers.
 * Screens translate these into [UiState] sealed interfaces (loading/error/empty/success).
 */
sealed interface AppResult<out T> {
    data class Success<T>(val value: T) : AppResult<T>
    data class Error(val error: AppError) : AppResult<Nothing>
}

inline fun <T, R> AppResult<T>.map(transform: (T) -> R): AppResult<R> = when (this) {
    is AppResult.Success -> AppResult.Success(transform(value))
    is AppResult.Error -> this
}

fun <T> AppResult<T>.valueOrNull(): T? = (this as? AppResult.Success)?.value

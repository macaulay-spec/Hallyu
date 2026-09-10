package com.hallyu.data.remote

import com.hallyu.common.AppError
import com.hallyu.common.AppResult
import com.hallyu.data.session.SessionStore
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

/** Configuration supplied by the app module from BuildConfig — never hard-coded secrets. */
data class SupabaseConfig(val baseUrl: String, val anonKey: String) {
    val isConfigured: Boolean get() = baseUrl.isNotBlank() && anonKey.isNotBlank()
}

/**
 * Thin, explicit Supabase HTTP adapter (PostgREST + GoTrue). Kept behind repository
 * interfaces so a different client (e.g. supabase-kt) can be swapped in without
 * touching domain or UI code (spec §54 — external deps behind clean adapters).
 */
@Singleton
class SupabaseRestClient @Inject constructor(
    private val config: SupabaseConfig,
    private val sessionStore: SessionStore,
    private val okHttpClient: OkHttpClient,
) {
    val isConfigured: Boolean get() = config.isConfigured

    private val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
        isLenient = true
    }

    private val jsonMediaType = "application/json".toMediaType()

    private fun abs(path: String): String = config.baseUrl.trimEnd('/') + path

    // -- PostgREST helpers -------------------------------------------------

    suspend fun restGet(
        path: String,
        query: Map<String, String> = emptyMap(),
        auth: Boolean = false,
    ): AppResult<JsonElement> {
        if (!isConfigured) return AppResult.Error(AppError.NotConfigured)
        val url = restUrl(path, query)
        return request("GET", url, null, auth)
    }

    suspend fun restPost(
        path: String,
        body: JsonElement,
        auth: Boolean = true,
        returnRepresentation: Boolean = true,
    ): AppResult<JsonElement> {
        if (!isConfigured) return AppResult.Error(AppError.NotConfigured)
        val url = restUrl(path)
        return request("POST", url, body, auth, returnRepresentation)
    }

    suspend fun restPatch(
        path: String,
        query: Map<String, String>,
        body: JsonElement,
        auth: Boolean = true,
        returnRepresentation: Boolean = true,
    ): AppResult<JsonElement> {
        if (!isConfigured) return AppResult.Error(AppError.NotConfigured)
        val url = restUrl(path, query)
        return request("PATCH", url, body, auth, returnRepresentation)
    }

    suspend fun restDelete(path: String, query: Map<String, String>, auth: Boolean = true): AppResult<JsonElement> {
        if (!isConfigured) return AppResult.Error(AppError.NotConfigured)
        val url = restUrl(path, query)
        return request("DELETE", url, null, auth)
    }

    // -- GoTrue (Auth) helpers ---------------------------------------------

    suspend fun authPost(path: String, body: JsonElement): AppResult<JsonElement> {
        if (!isConfigured) return AppResult.Error(AppError.NotConfigured)
        return request("POST", abs("/auth/v1$path"), body, auth = false)
    }

    suspend fun authGet(path: String): AppResult<JsonElement> {
        if (!isConfigured) return AppResult.Error(AppError.NotConfigured)
        return request("GET", abs("/auth/v1$path"), null, auth = true)
    }

    suspend fun authLogout(): AppResult<JsonElement> {
        if (!isConfigured) return AppResult.Error(AppError.NotConfigured)
        return request("POST", abs("/auth/v1/logout"), null, auth = true)
    }

    // -- internals ---------------------------------------------------------

    private fun restUrl(path: String, query: Map<String, String> = emptyMap()): String {
        val base = abs("/rest/v1/$path")
        val http = base.toHttpUrlOrNull() ?: return base
        val builder: HttpUrl.Builder = http.newBuilder()
        query.forEach { (k, v) -> builder.addQueryParameter(k, v) }
        return builder.build().toString()
    }

    private suspend fun request(
        method: String,
        url: String,
        body: JsonElement?,
        auth: Boolean,
        returnRepresentation: Boolean = false,
    ): AppResult<JsonElement> {
        val token = if (auth) sessionStore.accessToken() else null
        val builder = Request.Builder()
            .url(url)
            .header("apikey", config.anonKey)
            .header("Content-Type", "application/json")
        if (!token.isNullOrBlank()) builder.header("Authorization", "Bearer $token")
        if (returnRepresentation) builder.header("Prefer", "return=representation")

        when (method) {
            "GET" -> builder.get()
            "POST" -> builder.post((body?.toString() ?: "{}").toRequestBody(jsonMediaType))
            "PATCH" -> builder.patch((body?.toString() ?: "{}").toRequestBody(jsonMediaType))
            "DELETE" -> builder.delete()
            else -> return AppResult.Error(AppError.Unknown("Unsupported method $method"))
        }

        return try {
            val response = withContext(Dispatchers.IO) { okHttpClient.newCall(builder.build()).execute() }
            response.use { resp ->
                val text = resp.body?.string().orEmpty()
                if (resp.isSuccessful) {
                    AppResult.Success(if (text.isBlank()) JsonNull else json.parseToJsonElement(text))
                } else {
                    AppResult.Error(mapHttpError(resp.code, text))
                }
            }
        } catch (e: IOException) {
            AppResult.Error(AppError.Network)
        } catch (e: Exception) {
            AppResult.Error(AppError.Unknown(e.message ?: "Request failed"))
        }
    }

    private fun mapHttpError(code: Int, body: String): AppError = when (code) {
        401, 403 -> AppError.Unauthorized
        404 -> AppError.NotFound
        else -> AppError.Server(code, extractMessage(body))
    }

    private fun extractMessage(body: String): String = try {
        val el = json.parseToJsonElement(body)
        when {
            el is JsonNull -> ""
            else -> el.jsonObject["message"]?.jsonPrimitive?.content
                ?: el.jsonObject["msg"]?.jsonPrimitive?.content
                ?: el.jsonObject["error_description"]?.jsonPrimitive?.content
                ?: ""
        }
    } catch (e: Exception) {
        ""
    }
}

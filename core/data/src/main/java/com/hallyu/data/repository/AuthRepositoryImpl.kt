package com.hallyu.data.repository

import com.hallyu.common.AppResult
import com.hallyu.common.map
import com.hallyu.common.valueOrNull
import com.hallyu.data.remote.SupabaseRestClient
import com.hallyu.data.session.SessionStore
import com.hallyu.domain.model.AuthSession
import com.hallyu.domain.repository.AuthRepository
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonObject

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val client: SupabaseRestClient,
    private val store: SessionStore,
) : AuthRepository {

    override val session: Flow<AuthSession?> = store.session

    override suspend fun currentSession(): AuthSession? = store.session.firstOrNull()

    override suspend fun signUp(email: String, password: String, username: String): AppResult<AuthSession> {
        val body = buildJsonObject {
            put("email", email)
            put("password", password)
            putJsonObject("data") { put("username", username) }
        }
        return when (val res = client.authPost("/signup", body)) {
            is AppResult.Success -> consume(res.value)
            is AppResult.Error -> res
        }
    }

    override suspend fun login(email: String, password: String): AppResult<AuthSession> {
        val body = buildJsonObject {
            put("email", email)
            put("password", password)
        }
        return when (val res = client.authPost("/token?grant_type=password", body)) {
            is AppResult.Success -> consume(res.value)
            is AppResult.Error -> res
        }
    }

    override suspend fun recoverPassword(email: String): AppResult<Unit> {
        val body = buildJsonObject { put("email", email) }
        return when (val res = client.authPost("/recover", body)) {
            is AppResult.Success -> AppResult.Success(Unit)
            is AppResult.Error -> res
        }
    }

    override suspend fun logout(): AppResult<Unit> {
        store.clear()
        return when (val res = client.authLogout()) {
            is AppResult.Success -> AppResult.Success(Unit)
            is AppResult.Error -> AppResult.Success(Unit) // local sign-out succeeds regardless
        }
    }

    private suspend fun consume(element: kotlinx.serialization.json.JsonElement): AppResult<AuthSession> {
        val obj = element.jsonObject
        val user = obj["user"]?.jsonObject
        val session = AuthSession(
            userId = user?.get("id")?.let { (it as? kotlinx.serialization.json.JsonPrimitive)?.contentOrNull } ?: "",
            email = user?.get("email")?.let { (it as? kotlinx.serialization.json.JsonPrimitive)?.contentOrNull } ?: "",
            accessToken = obj["access_token"]?.let { (it as? kotlinx.serialization.json.JsonPrimitive)?.contentOrNull } ?: "",
            refreshToken = obj["refresh_token"]?.let { (it as? kotlinx.serialization.json.JsonPrimitive)?.contentOrNull } ?: "",
        )
        if (session.accessToken.isBlank()) {
            return AppResult.Success(session)
        }
        store.save(session)
        return AppResult.Success(session)
    }
}

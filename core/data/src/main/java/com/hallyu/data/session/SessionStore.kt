package com.hallyu.data.session

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.hallyu.domain.model.AuthSession
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "hallyu_session")

@Singleton
class SessionStore @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private object Keys {
        val userId = stringPreferencesKey("user_id")
        val email = stringPreferencesKey("email")
        val accessToken = stringPreferencesKey("access_token")
        val refreshToken = stringPreferencesKey("refresh_token")
    }

    val session: Flow<AuthSession?> = context.dataStore.data.map { prefs ->
        val token = prefs[Keys.accessToken] ?: return@map null
        AuthSession(
            userId = prefs[Keys.userId] ?: "",
            email = prefs[Keys.email] ?: "",
            accessToken = token,
            refreshToken = prefs[Keys.refreshToken] ?: "",
        )
    }

    suspend fun save(session: AuthSession) {
        context.dataStore.edit { prefs ->
            prefs[Keys.userId] = session.userId
            prefs[Keys.email] = session.email
            prefs[Keys.accessToken] = session.accessToken
            prefs[Keys.refreshToken] = session.refreshToken
        }
    }

    suspend fun clear() {
        context.dataStore.edit { it.clear() }
    }

    suspend fun accessToken(): String? =
        context.dataStore.data.firstOrNull()?.get(Keys.accessToken)
}

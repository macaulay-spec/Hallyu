package com.hallyu.data.session

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.settingsDataStore by preferencesDataStore(name = "hallyu_settings")

@Singleton
class SettingsStore @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private object Keys {
        val spoilerMode = stringPreferencesKey("spoiler_mode")
        val quietHours = booleanPreferencesKey("quiet_hours")
        val onboarded = booleanPreferencesKey("onboarded")
    }

    val spoilerMode: Flow<String> = context.settingsDataStore.data.map { it[Keys.spoilerMode] ?: "BLUR_BEYOND" }
    val quietHours: Flow<Boolean> = context.settingsDataStore.data.map { it[Keys.quietHours] ?: false }
    val onboarded: Flow<Boolean> = context.settingsDataStore.data.map { it[Keys.onboarded] ?: false }

    suspend fun setSpoilerMode(mode: String) {
        context.settingsDataStore.edit { it[Keys.spoilerMode] = mode }
    }

    suspend fun setQuietHours(enabled: Boolean) {
        context.settingsDataStore.edit { it[Keys.quietHours] = enabled }
    }

    suspend fun setOnboarded() {
        context.settingsDataStore.edit { it[Keys.onboarded] = true }
    }
}

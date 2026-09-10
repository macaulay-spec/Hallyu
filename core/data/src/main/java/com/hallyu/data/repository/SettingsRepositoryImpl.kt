package com.hallyu.data.repository

import com.hallyu.data.session.SettingsStore
import com.hallyu.domain.repository.SettingsRepository
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow

@Singleton
class SettingsRepositoryImpl @Inject constructor(
    private val store: SettingsStore,
) : SettingsRepository {

    override val spoilerMode: Flow<String> = store.spoilerMode
    override val quietHours: Flow<Boolean> = store.quietHours
    override val onboarded: Flow<Boolean> = store.onboarded

    override suspend fun setSpoilerMode(mode: String) = store.setSpoilerMode(mode)
    override suspend fun setQuietHours(enabled: Boolean) = store.setQuietHours(enabled)
    override suspend fun setOnboarded() = store.setOnboarded()
}

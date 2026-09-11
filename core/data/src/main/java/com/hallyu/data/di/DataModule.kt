package com.hallyu.data.di

import com.hallyu.data.mock.MockAuthRepository
import com.hallyu.data.mock.MockCommunityRepository
import com.hallyu.data.mock.MockDramaRepository
import com.hallyu.data.mock.MockExploreRepository
import com.hallyu.data.mock.MockModerationRepository
import com.hallyu.data.mock.MockNotificationRepository
import com.hallyu.data.mock.MockPostRepository
import com.hallyu.data.mock.MockProfileRepository
import com.hallyu.data.mock.MockSettingsRepository
import com.hallyu.domain.repository.AuthRepository
import com.hallyu.domain.repository.CommunityRepository
import com.hallyu.domain.repository.DramaRepository
import com.hallyu.domain.repository.ExploreRepository
import com.hallyu.domain.repository.ModerationRepository
import com.hallyu.domain.repository.NotificationRepository
import com.hallyu.domain.repository.PostRepository
import com.hallyu.domain.repository.ProfileRepository
import com.hallyu.domain.repository.SettingsRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

/** Binds the in-memory (mock) repositories so the frontend runs fully populated with no backend. */
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    abstract fun bindAuthRepository(impl: MockAuthRepository): AuthRepository

    @Binds
    abstract fun bindProfileRepository(impl: MockProfileRepository): ProfileRepository

    @Binds
    abstract fun bindPostRepository(impl: MockPostRepository): PostRepository

    @Binds
    abstract fun bindDramaRepository(impl: MockDramaRepository): DramaRepository

    @Binds
    abstract fun bindExploreRepository(impl: MockExploreRepository): ExploreRepository

    @Binds
    abstract fun bindCommunityRepository(impl: MockCommunityRepository): CommunityRepository

    @Binds
    abstract fun bindNotificationRepository(impl: MockNotificationRepository): NotificationRepository

    @Binds
    abstract fun bindModerationRepository(impl: MockModerationRepository): ModerationRepository

    @Binds
    abstract fun bindSettingsRepository(impl: MockSettingsRepository): SettingsRepository
}

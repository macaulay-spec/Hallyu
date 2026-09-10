package com.hallyu.data.di

import android.content.Context
import com.hallyu.data.cache.DramaDao
import com.hallyu.data.cache.EpisodeDao
import com.hallyu.data.cache.HallyuDatabase
import com.hallyu.data.cache.WatchDao
import com.hallyu.data.repository.AuthRepositoryImpl
import com.hallyu.data.repository.CommunityRepositoryImpl
import com.hallyu.data.repository.DramaRepositoryImpl
import com.hallyu.data.repository.ExploreRepositoryImpl
import com.hallyu.data.repository.ModerationRepositoryImpl
import com.hallyu.data.repository.NotificationRepositoryImpl
import com.hallyu.data.repository.PostRepositoryImpl
import com.hallyu.data.repository.ProfileRepositoryImpl
import com.hallyu.data.repository.SettingsRepositoryImpl
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
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import java.util.concurrent.TimeUnit
import javax.inject.Singleton
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .addInterceptor(HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC })
        .build()
}

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): HallyuDatabase =
        HallyuDatabase.getInstance(context)

    @Provides
    fun provideDramaDao(db: HallyuDatabase): DramaDao = db.dramaDao()

    @Provides
    fun provideEpisodeDao(db: HallyuDatabase): EpisodeDao = db.episodeDao()

    @Provides
    fun provideWatchDao(db: HallyuDatabase): WatchDao = db.watchDao()
}

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    abstract fun bindAuthRepository(impl: AuthRepositoryImpl): AuthRepository

    @Binds
    abstract fun bindProfileRepository(impl: ProfileRepositoryImpl): ProfileRepository

    @Binds
    abstract fun bindPostRepository(impl: PostRepositoryImpl): PostRepository

    @Binds
    abstract fun bindDramaRepository(impl: DramaRepositoryImpl): DramaRepository

    @Binds
    abstract fun bindExploreRepository(impl: ExploreRepositoryImpl): ExploreRepository

    @Binds
    abstract fun bindCommunityRepository(impl: CommunityRepositoryImpl): CommunityRepository

    @Binds
    abstract fun bindNotificationRepository(impl: NotificationRepositoryImpl): NotificationRepository

    @Binds
    abstract fun bindModerationRepository(impl: ModerationRepositoryImpl): ModerationRepository

    @Binds
    abstract fun bindSettingsRepository(impl: SettingsRepositoryImpl): SettingsRepository
}

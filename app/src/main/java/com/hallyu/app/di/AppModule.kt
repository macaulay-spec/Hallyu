package com.hallyu.app.di

import com.hallyu.domain.repository.DramaRepository
import com.hallyu.domain.repository.ExploreRepository
import com.hallyu.domain.repository.PostRepository
import com.hallyu.domain.usecase.FollowDramaUseCase
import com.hallyu.domain.usecase.GetDramaUseCase
import com.hallyu.domain.usecase.GetHomeFeedUseCase
import com.hallyu.domain.usecase.GetPostUseCase
import com.hallyu.domain.usecase.PublishPostUseCase
import com.hallyu.domain.usecase.SearchContentUseCase
import com.hallyu.domain.usecase.ToggleReactionUseCase
import com.hallyu.domain.usecase.TrendingUseCase
import com.hallyu.domain.usecase.UpdateWatchProgressUseCase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

/** Wires the use-case layer. Repositories are provided by :core:data (mock catalog). */
@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    fun provideGetHomeFeed(posts: PostRepository) = GetHomeFeedUseCase(posts)

    @Provides
    fun provideGetPost(posts: PostRepository) = GetPostUseCase(posts)

    @Provides
    fun providePublishPost(posts: PostRepository) = PublishPostUseCase(posts)

    @Provides
    fun provideToggleReaction(posts: PostRepository) = ToggleReactionUseCase(posts)

    @Provides
    fun provideFollowDrama(dramas: DramaRepository) = FollowDramaUseCase(dramas)

    @Provides
    fun provideUpdateWatch(dramas: DramaRepository) = UpdateWatchProgressUseCase(dramas)

    @Provides
    fun provideSearch(explore: ExploreRepository) = SearchContentUseCase(explore)

    @Provides
    fun provideTrending(explore: ExploreRepository) = TrendingUseCase(explore)

    @Provides
    fun provideGetDrama(dramas: DramaRepository) = GetDramaUseCase(dramas)
}

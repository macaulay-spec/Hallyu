package com.hallyu.domain.usecase

import com.hallyu.common.AppResult
import com.hallyu.domain.model.Drama
import com.hallyu.domain.model.FeedKind
import com.hallyu.domain.model.Page
import com.hallyu.domain.model.Post
import com.hallyu.domain.model.SearchResults
import com.hallyu.domain.model.TrendingTopic
import com.hallyu.domain.model.WatchingStatus
import com.hallyu.domain.repository.DramaRepository
import com.hallyu.domain.repository.ExploreRepository
import com.hallyu.domain.repository.PostRepository

/** Discover → Discuss core-loop use cases. Thin, testable, single-responsibility. */
class GetHomeFeedUseCase(private val posts: PostRepository) {
    suspend operator fun invoke(kind: FeedKind, offset: Int = 0, limit: Int = 20): AppResult<Page<Post>> =
        posts.getFeed(kind, offset, limit)
}

class GetPostUseCase(private val posts: PostRepository) {
    suspend operator fun invoke(postId: String): AppResult<Post> = posts.getPost(postId)
}

class PublishPostUseCase(private val posts: PostRepository) {
    suspend operator fun invoke(
        text: String,
        category: String?,
        dramaId: String?,
        episodeNumber: Int?,
        spoilerLevel: Int?,
        imageUrls: List<String>,
    ): AppResult<Post> = posts.createPost(text, category, dramaId, episodeNumber, spoilerLevel, imageUrls)
}

class ToggleReactionUseCase(private val posts: PostRepository) {
    suspend operator fun invoke(postId: String, liked: Boolean): AppResult<Int> =
        posts.toggleLike(postId, liked)
}

class FollowDramaUseCase(private val dramas: DramaRepository) {
    suspend operator fun invoke(dramaId: String, follow: Boolean): AppResult<Boolean> =
        dramas.followDrama(dramaId, follow)
}

class UpdateWatchProgressUseCase(private val dramas: DramaRepository) {
    suspend operator fun invoke(
        dramaId: String,
        watchedThroughEpisode: Int,
        status: String,
    ): AppResult<WatchingStatus> = dramas.updateWatchProgress(dramaId, watchedThroughEpisode, status)
}

class SearchContentUseCase(private val explore: ExploreRepository) {
    suspend operator fun invoke(query: String): AppResult<SearchResults> = explore.search(query)
}

class TrendingUseCase(private val explore: ExploreRepository) {
    suspend operator fun invoke(): AppResult<List<TrendingTopic>> = explore.getTrending()
}

class GetDramaUseCase(private val dramas: DramaRepository) {
    suspend operator fun invoke(dramaId: String): AppResult<Drama> = dramas.getDrama(dramaId)
}

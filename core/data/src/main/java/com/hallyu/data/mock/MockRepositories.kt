package com.hallyu.data.mock

import com.hallyu.common.AppResult
import com.hallyu.domain.model.Actor
import com.hallyu.domain.model.AppNotification
import com.hallyu.domain.model.AuthSession
import com.hallyu.domain.model.Comment
import com.hallyu.domain.model.Community
import com.hallyu.domain.model.Drama
import com.hallyu.domain.model.Episode
import com.hallyu.domain.model.FeedKind
import com.hallyu.domain.model.Page
import com.hallyu.domain.model.Post
import com.hallyu.domain.model.Profile
import com.hallyu.domain.model.Report
import com.hallyu.domain.model.ReportStatus
import com.hallyu.domain.model.SearchResults
import com.hallyu.domain.model.TrendingTopic
import com.hallyu.domain.model.WatchingStatus
import com.hallyu.domain.repository.AuthRepository
import com.hallyu.domain.repository.CommunityRepository
import com.hallyu.domain.repository.DramaRepository
import com.hallyu.domain.repository.ExploreRepository
import com.hallyu.domain.repository.ModerationRepository
import com.hallyu.domain.repository.NotificationRepository
import com.hallyu.domain.repository.PostRepository
import com.hallyu.domain.repository.ProfileRepository
import com.hallyu.domain.repository.SettingsRepository
import java.time.OffsetDateTime
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * In-memory repository implementations backed by [MockCatalog]. Every screen is fully populated
 * and interactions (like / follow / bookmark / comment) update live for the session — no network,
 * no database, no backend (BLUEPRINT.md §1).
 */

private fun <T> ok(value: T) = AppResult.Success(value)

@Singleton
class MockAuthRepository @Inject constructor() : AuthRepository {

    private val sessionFlow = MutableStateFlow<AuthSession?>(
        // Start signed OUT so the full product flow (Welcome → Sign up/Login → Onboarding →
        // Main tabs) is previewable in order. Sign up / log in accept any credentials.
        null,
    )

    override val session: Flow<AuthSession?> = sessionFlow.asStateFlow()

    override suspend fun currentSession(): AuthSession? = sessionFlow.value

    override suspend fun signUp(email: String, password: String, username: String): AppResult<AuthSession> {
        val created = AuthSession(userId = "me", email = email, accessToken = "mock", refreshToken = "mock")
        sessionFlow.value = created
        return ok(created)
    }

    override suspend fun login(email: String, password: String): AppResult<AuthSession> {
        val created = AuthSession(userId = "me", email = email, accessToken = "mock", refreshToken = "mock")
        sessionFlow.value = created
        return ok(created)
    }

    override suspend fun recoverPassword(email: String): AppResult<Unit> = ok(Unit)

    override suspend fun logout(): AppResult<Unit> {
        sessionFlow.value = null
        return ok(Unit)
    }
}

@Singleton
class MockProfileRepository @Inject constructor() : ProfileRepository {

    override suspend fun getProfile(userId: String): AppResult<Profile> = ok(
        if (userId == "me") MockCatalog.me
        else MockCatalog.profiles.firstOrNull { it.id == userId } ?: MockCatalog.me,
    )

    override suspend fun updateProfile(profile: Profile): AppResult<Profile> {
        val idx = MockCatalog.profiles.indexOfFirst { it.id == profile.id }
        if (idx >= 0) MockCatalog.profiles[idx] = profile
        return ok(profile)
    }

    override suspend fun getFollowers(userId: String): AppResult<List<Profile>> = ok(
        MockCatalog.profiles.filter { it.id != "me" }.take(8),
    )

    override suspend fun getFollowing(userId: String): AppResult<List<Profile>> = ok(
        MockCatalog.profiles.filter { it.id != "me" }.take(6),
    )

    override suspend fun followUser(targetId: String): AppResult<Boolean> {
        setFollow(targetId, true)
        return ok(true)
    }

    override suspend fun unfollowUser(targetId: String): AppResult<Boolean> {
        setFollow(targetId, false)
        return ok(true)
    }

    private fun setFollow(id: String, follow: Boolean) {
        val idx = MockCatalog.profiles.indexOfFirst { it.id == id }
        if (idx >= 0) MockCatalog.profiles[idx] = MockCatalog.profiles[idx].copy(isFollowed = follow)
    }
}

@Singleton
class MockPostRepository @Inject constructor() : PostRepository {

    override suspend fun getFeed(kind: FeedKind, offset: Int, limit: Int, communityId: String?): AppResult<Page<Post>> {
        val all = MockCatalog.posts
        val items = all.drop(offset).take(limit)
        val next = if (offset + limit < all.size) offset + limit else null
        return ok(Page(items = items, nextOffset = next))
    }

    override suspend fun getPost(postId: String): AppResult<Post> = ok(
        MockCatalog.posts.firstOrNull { it.id == postId } ?: MockCatalog.posts.first(),
    )

    override suspend fun createPost(
        text: String,
        category: String?,
        dramaId: String?,
        episodeNumber: Int?,
        spoilerLevel: Int?,
        imageUrls: List<String>,
    ): AppResult<Post> {
        val drama = dramaId?.let { id -> MockCatalog.dramas.firstOrNull { it.id == id } }
        val post = Post(
            id = "p_${MockCatalog.posts.size + 1}",
            authorId = "me",
            author = MockCatalog.me,
            text = text,
            category = category?.let { runCatching { com.hallyu.domain.model.PostCategory.valueOf(it) }.getOrNull() },
            dramaId = dramaId,
            dramaTitle = drama?.title,
            episodeNumber = episodeNumber,
            spoilerLevel = spoilerLevel,
            imageUrls = imageUrls,
            createdAt = OffsetDateTime.now().toString(),
        )
        MockCatalog.posts.add(0, post)
        return ok(post)
    }

    override suspend fun toggleLike(postId: String, liked: Boolean): AppResult<Int> {
        val idx = MockCatalog.posts.indexOfFirst { it.id == postId }
        if (idx < 0) return ok(0)
        val p = MockCatalog.posts[idx]
        val updated = p.copy(
            isLiked = liked,
            likeCount = (p.likeCount + if (liked && !p.isLiked) 1 else if (!liked && p.isLiked) -1 else 0).coerceAtLeast(0),
        )
        MockCatalog.posts[idx] = updated
        return ok(updated.likeCount)
    }

    override suspend fun getBookmarkedPosts(): AppResult<List<Post>> = ok(MockCatalog.posts.filter { it.isBookmarked })

    override suspend fun toggleBookmark(postId: String, bookmarked: Boolean): AppResult<Boolean> {
        val idx = MockCatalog.posts.indexOfFirst { it.id == postId }
        if (idx >= 0) MockCatalog.posts[idx] = MockCatalog.posts[idx].copy(isBookmarked = bookmarked)
        return ok(bookmarked)
    }

    override suspend fun toggleRepost(postId: String): AppResult<Boolean> {
        val idx = MockCatalog.posts.indexOfFirst { it.id == postId }
        if (idx < 0) return ok(false)
        val p = MockCatalog.posts[idx]
        val target = !p.isReposted
        MockCatalog.posts[idx] = p.copy(
            isReposted = target,
            repostCount = (p.repostCount + if (target) 1 else -1).coerceAtLeast(0),
        )
        return ok(target)
    }

    override suspend fun getComments(postId: String): AppResult<List<Comment>> =
        ok(MockCatalog.comments.filter { it.postId == postId })

    override suspend fun addComment(postId: String, text: String, parentId: String?): AppResult<Comment> {
        val comment = Comment(
            id = "cm_${MockCatalog.comments.size + 1}",
            postId = postId,
            parentId = parentId,
            authorId = "me",
            author = MockCatalog.me,
            text = text,
            createdAt = OffsetDateTime.now().toString(),
        )
        MockCatalog.comments.add(comment)
        return ok(comment)
    }

    override suspend fun toggleCommentLike(commentId: String, liked: Boolean): AppResult<Int> {
        val idx = MockCatalog.comments.indexOfFirst { it.id == commentId }
        if (idx < 0) return ok(0)
        val c = MockCatalog.comments[idx]
        val updated = c.copy(
            isLiked = liked,
            likeCount = (c.likeCount + if (liked && !c.isLiked) 1 else if (!liked && c.isLiked) -1 else 0).coerceAtLeast(0),
        )
        MockCatalog.comments[idx] = updated
        return ok(updated.likeCount)
    }
}

@Singleton
class MockDramaRepository @Inject constructor() : DramaRepository {

    override suspend fun getDrama(dramaId: String): AppResult<Drama> = ok(
        MockCatalog.dramas.firstOrNull { it.id == dramaId } ?: MockCatalog.dramas.first(),
    )

    override suspend fun getEpisodes(dramaId: String): AppResult<List<Episode>> = ok(
        MockCatalog.dramas.firstOrNull { it.id == dramaId }?.let { MockCatalog.episodesFor(it) } ?: emptyList(),
    )

    override suspend fun getEpisode(dramaId: String, number: Int): AppResult<Episode> {
        val drama = MockCatalog.dramas.firstOrNull { it.id == dramaId } ?: MockCatalog.dramas.first()
        return ok(MockCatalog.episodesFor(drama).firstOrNull { it.number == number } ?: MockCatalog.episodesFor(drama).first())
    }

    override suspend fun getCast(dramaId: String): AppResult<List<Actor>> = ok(MockCatalog.actors)

    override suspend fun followDrama(dramaId: String, follow: Boolean): AppResult<Boolean> {
        setDramaFollow(dramaId, follow)
        return ok(follow)
    }

    override suspend fun getActor(actorId: String): AppResult<Actor> = ok(
        MockCatalog.actors.firstOrNull { it.id == actorId } ?: MockCatalog.actors.first(),
    )

    override suspend fun getActors(): AppResult<List<Actor>> = ok(MockCatalog.actors)

    override suspend fun followActor(actorId: String, follow: Boolean): AppResult<Boolean> {
        val idx = MockCatalog.actors.indexOfFirst { it.id == actorId }
        if (idx >= 0) MockCatalog.actors[idx] = MockCatalog.actors[idx].copy(isFollowed = follow)
        return ok(follow)
    }

    override suspend fun getCurrentlyWatching(): AppResult<List<Drama>> = ok(
        MockCatalog.dramas.filter { it.watchingStatus != null },
    )

    override suspend fun getMyWatchProgress(): AppResult<List<WatchingStatus>> = ok(MockCatalog.watchProgress.toList())

    override suspend fun updateWatchProgress(dramaId: String, watchedThroughEpisode: Int, status: String): AppResult<WatchingStatus> {
        val updated = WatchingStatus(dramaId = dramaId, status = status, watchedThroughEpisode = watchedThroughEpisode, updatedAt = OffsetDateTime.now().toString())
        val idx = MockCatalog.watchProgress.indexOfFirst { it.dramaId == dramaId }
        if (idx >= 0) MockCatalog.watchProgress[idx] = updated else MockCatalog.watchProgress.add(updated)
        return ok(updated)
    }

    override suspend fun getEpisodeDiscussion(dramaId: String, episodeNumber: Int): AppResult<List<Post>> = ok(
        MockCatalog.posts.filter { it.dramaId == dramaId && (it.episodeNumber == null || it.episodeNumber == episodeNumber) },
    )

    override suspend fun getAiring(): AppResult<List<Drama>> = ok(
        MockCatalog.dramas.filter { it.status == com.hallyu.domain.model.DramaStatus.AIRING },
    )

    override suspend fun getUpcoming(): AppResult<List<Drama>> = ok(
        MockCatalog.dramas.filter { it.status == com.hallyu.domain.model.DramaStatus.UPCOMING },
    )

    private fun setDramaFollow(id: String, follow: Boolean) {
        val idx = MockCatalog.dramas.indexOfFirst { it.id == id }
        if (idx >= 0) MockCatalog.dramas[idx] = MockCatalog.dramas[idx].copy(isFollowed = follow)
    }
}

@Singleton
class MockExploreRepository @Inject constructor() : ExploreRepository {

    override suspend fun search(query: String): AppResult<SearchResults> {
        val q = query.trim().lowercase()
        if (q.isBlank()) return ok(SearchResults())
        fun has(text: String) = text.lowercase().contains(q)
        return ok(
            SearchResults(
                dramas = MockCatalog.dramas.filter { has(it.title) || has(it.koreanTitle ?: "") },
                actors = MockCatalog.actors.filter { has(it.name) || has(it.koreanName ?: "") },
                users = MockCatalog.profiles.filter { has(it.username) || has(it.displayName) },
                communities = MockCatalog.communities.filter { has(it.name) || has(it.description) },
                posts = MockCatalog.posts.filter { has(it.text) || has(it.dramaTitle ?: "") },
                hashtags = MockCatalog.trending.map { it.tag }.filter { has(it) },
            )
        )
    }

    override suspend fun getTrending(): AppResult<List<TrendingTopic>> = ok(MockCatalog.trending)

    override suspend fun getHashtagPosts(tag: String, offset: Int, limit: Int): AppResult<Page<Post>> {
        val matched = MockCatalog.posts.filter { p ->
            p.text.lowercase().contains("#${tag.lowercase()}") ||
                (p.dramaTitle ?: "").replace(" ", "").equals(tag, ignoreCase = true)
        }
        val source = if (matched.isEmpty()) MockCatalog.posts else matched
        val items = source.drop(offset).take(limit)
        val next = if (offset + limit < source.size) offset + limit else null
        return ok(Page(items = items, nextOffset = next))
    }
}

@Singleton
class MockCommunityRepository @Inject constructor() : CommunityRepository {

    override suspend fun getCommunity(communityId: String): AppResult<Community> = ok(
        MockCatalog.communities.firstOrNull { it.id == communityId } ?: MockCatalog.communities.first(),
    )

    override suspend fun getCommunities(): AppResult<List<Community>> = ok(MockCatalog.communities)

    override suspend fun getMyCommunities(): AppResult<List<Community>> = ok(
        MockCatalog.communities.filter { it.isJoined },
    )

    override suspend fun joinCommunity(communityId: String, join: Boolean): AppResult<Boolean> {
        val idx = MockCatalog.communities.indexOfFirst { it.id == communityId }
        if (idx >= 0) MockCatalog.communities[idx] = MockCatalog.communities[idx].copy(isJoined = join)
        return ok(join)
    }

    override suspend fun getCommunityFeed(communityId: String, offset: Int, limit: Int): AppResult<Page<Post>> {
        val source = MockCatalog.posts
        val items = source.drop(offset).take(limit)
        val next = if (offset + limit < source.size) offset + limit else null
        return ok(Page(items = items, nextOffset = next))
    }
}

@Singleton
class MockNotificationRepository @Inject constructor() : NotificationRepository {

    override suspend fun getNotifications(): AppResult<List<AppNotification>> = ok(MockCatalog.notifications)

    override suspend fun markRead(notificationId: String): AppResult<Boolean> {
        val idx = MockCatalog.notifications.indexOfFirst { it.id == notificationId }
        if (idx >= 0) MockCatalog.notifications[idx] = MockCatalog.notifications[idx].copy(read = true)
        return ok(true)
    }
}

@Singleton
class MockModerationRepository @Inject constructor() : ModerationRepository {

    override suspend fun getOpenReports(): AppResult<List<Report>> = ok(MockCatalog.reports.filter { it.status == ReportStatus.OPEN })

    override suspend fun resolveReport(reportId: String, action: String): AppResult<Boolean> {
        val idx = MockCatalog.reports.indexOfFirst { it.id == reportId }
        if (idx >= 0) {
            val newStatus = if (action.equals("DISMISSED", ignoreCase = true)) ReportStatus.DISMISSED else ReportStatus.RESOLVED
            MockCatalog.reports[idx] = MockCatalog.reports[idx].copy(status = newStatus)
        }
        return ok(true)
    }

    override suspend fun blockUser(userId: String): AppResult<Boolean> = ok(true)

    override suspend fun muteUser(userId: String): AppResult<Boolean> = ok(true)
}

@Singleton
class MockSettingsRepository @Inject constructor() : SettingsRepository {

    private val spoilerModeFlow = MutableStateFlow("BLUR_BEYOND")
    private val quietHoursFlow = MutableStateFlow(false)
    private val onboardedFlow = MutableStateFlow(true)

    override val spoilerMode: Flow<String> = spoilerModeFlow.asStateFlow()
    override val quietHours: Flow<Boolean> = quietHoursFlow.asStateFlow()
    override val onboarded: Flow<Boolean> = onboardedFlow.asStateFlow()

    override suspend fun setSpoilerMode(mode: String) {
        spoilerModeFlow.value = mode
    }

    override suspend fun setQuietHours(enabled: Boolean) {
        quietHoursFlow.value = enabled
    }

    override suspend fun setOnboarded() {
        onboardedFlow.value = true
    }
}

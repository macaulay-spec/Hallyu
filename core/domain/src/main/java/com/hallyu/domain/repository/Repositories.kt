package com.hallyu.domain.repository

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
import com.hallyu.domain.model.SearchResults
import com.hallyu.domain.model.TrendingTopic
import com.hallyu.domain.model.WatchingStatus
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    val session: Flow<AuthSession?>
    suspend fun currentSession(): AuthSession?
    suspend fun signUp(email: String, password: String, username: String): AppResult<AuthSession>
    suspend fun login(email: String, password: String): AppResult<AuthSession>
    suspend fun recoverPassword(email: String): AppResult<Unit>
    suspend fun logout(): AppResult<Unit>
}

interface ProfileRepository {
    suspend fun getProfile(userId: String): AppResult<Profile>
    suspend fun updateProfile(profile: Profile): AppResult<Profile>
    suspend fun getFollowers(userId: String): AppResult<List<Profile>>
    suspend fun getFollowing(userId: String): AppResult<List<Profile>>
    suspend fun followUser(targetId: String): AppResult<Boolean>
    suspend fun unfollowUser(targetId: String): AppResult<Boolean>
}

interface PostRepository {
    suspend fun getFeed(kind: FeedKind, offset: Int, limit: Int, communityId: String? = null): AppResult<Page<Post>>
    suspend fun getPost(postId: String): AppResult<Post>
    suspend fun createPost(
        text: String,
        category: String?,
        dramaId: String?,
        episodeNumber: Int?,
        spoilerLevel: Int?,
        imageUrls: List<String>,
    ): AppResult<Post>

    suspend fun toggleLike(postId: String, liked: Boolean): AppResult<Int>
    suspend fun getBookmarkedPosts(): AppResult<List<Post>>
    suspend fun toggleBookmark(postId: String, bookmarked: Boolean): AppResult<Boolean>
    suspend fun toggleRepost(postId: String): AppResult<Boolean>

    suspend fun getComments(postId: String): AppResult<List<Comment>>
    suspend fun addComment(postId: String, text: String, parentId: String? = null): AppResult<Comment>
    suspend fun toggleCommentLike(commentId: String, liked: Boolean): AppResult<Int>
}

interface DramaRepository {
    suspend fun getDrama(dramaId: String): AppResult<Drama>
    suspend fun getEpisodes(dramaId: String): AppResult<List<Episode>>
    suspend fun getEpisode(dramaId: String, number: Int): AppResult<Episode>
    suspend fun getCast(dramaId: String): AppResult<List<Actor>>
    suspend fun followDrama(dramaId: String, follow: Boolean): AppResult<Boolean>
    suspend fun getActor(actorId: String): AppResult<Actor>
    suspend fun getActors(): AppResult<List<Actor>>
    suspend fun followActor(actorId: String, follow: Boolean): AppResult<Boolean>
    suspend fun getCurrentlyWatching(): AppResult<List<Drama>>
    suspend fun getMyWatchProgress(): AppResult<List<WatchingStatus>>
    suspend fun updateWatchProgress(dramaId: String, watchedThroughEpisode: Int, status: String): AppResult<WatchingStatus>
    suspend fun getEpisodeDiscussion(dramaId: String, episodeNumber: Int): AppResult<List<Post>>
    suspend fun getAiring(): AppResult<List<Drama>>
    suspend fun getUpcoming(): AppResult<List<Drama>>
}

interface ExploreRepository {
    suspend fun search(query: String): AppResult<SearchResults>
    suspend fun getTrending(): AppResult<List<TrendingTopic>>
    suspend fun getHashtagPosts(tag: String, offset: Int, limit: Int): AppResult<Page<Post>>
}

interface CommunityRepository {
    suspend fun getCommunity(communityId: String): AppResult<Community>
    suspend fun getCommunities(): AppResult<List<Community>>
    suspend fun getMyCommunities(): AppResult<List<Community>>
    suspend fun joinCommunity(communityId: String, join: Boolean): AppResult<Boolean>
    suspend fun getCommunityFeed(communityId: String, offset: Int, limit: Int): AppResult<Page<Post>>
}

interface NotificationRepository {
    suspend fun getNotifications(): AppResult<List<AppNotification>>
    suspend fun markRead(notificationId: String): AppResult<Boolean>
}

interface ModerationRepository {
    suspend fun getOpenReports(): AppResult<List<Report>>
    suspend fun resolveReport(reportId: String, action: String): AppResult<Boolean>
    suspend fun blockUser(userId: String): AppResult<Boolean>
    suspend fun muteUser(userId: String): AppResult<Boolean>
}

interface SettingsRepository {
    val spoilerMode: Flow<String>
    val quietHours: Flow<Boolean>
    suspend fun setSpoilerMode(mode: String)
    suspend fun setQuietHours(enabled: Boolean)
    suspend fun setOnboarded()
    val onboarded: Flow<Boolean>
}

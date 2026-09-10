package com.hallyu.domain.model

import kotlinx.serialization.Serializable

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

@Serializable
enum class PostCategory { REACTION, DISCUSSION, THEORY, RECOMMENDATION, MEME, NEWS, QUESTION, FAN_CONTENT }

@Serializable
enum class DramaStatus { AIRING, UPCOMING, COMPLETED }

@Serializable
enum class FeedKind { FOR_YOU, FOLLOWING, TRENDING, COMMUNITY, HASHTAG }

@Serializable
enum class NotificationType {
    EPISODE_RELEASE, REPLY, MENTION, COMMUNITY_ANNOUNCEMENT,
    ACTOR_UPDATE, OFFICIAL_ANNOUNCEMENT, TRENDING_POST, SYSTEM
}

@Serializable
enum class ReportStatus { OPEN, REVIEWING, RESOLVED, DISMISSED }

@Serializable
enum class ReportReason { SPAM, HARASSMENT, SPOILER, UNSAFE, COPYRIGHT, OTHER }

@Serializable
enum class CommunityVisibility { PUBLIC, PRIVATE }

@Serializable
enum class ModerationAction { NONE, REMOVED, HIDDEN, BANNED, APPROVED }

// ---------------------------------------------------------------------------
// Identity / social graph
// ---------------------------------------------------------------------------

@Serializable
data class Profile(
    val id: String = "",
    val username: String = "",
    val displayName: String = "",
    val bio: String = "",
    val avatarUrl: String? = null,
    val isVerified: Boolean = false,
    val isOfficial: Boolean = false,
    val followerCount: Int = 0,
    val followingCount: Int = 0,
    val postCount: Int = 0,
    val isFollowed: Boolean = false,
)

@Serializable
data class AuthSession(
    val userId: String = "",
    val email: String = "",
    val accessToken: String = "",
    val refreshToken: String = "",
)

// ---------------------------------------------------------------------------
// K-drama graph
// ---------------------------------------------------------------------------

@Serializable
data class Drama(
    val id: String = "",
    val title: String = "",
    val koreanTitle: String? = null,
    val synopsis: String = "",
    val posterUrl: String? = null,
    val backdropUrl: String? = null,
    val status: DramaStatus = DramaStatus.AIRING,
    val year: Int = 0,
    val genres: List<String> = emptyList(),
    val airsOn: String? = null,
    val network: String? = null,
    val episodeCount: Int = 0,
    val isFollowed: Boolean = false,
    val watchingStatus: String? = null,
)

@Serializable
data class Episode(
    val id: String = "",
    val dramaId: String = "",
    val number: Int = 0,
    val title: String? = null,
    val synopsis: String = "",
    val airDate: String? = null,
    val thumbnailUrl: String? = null,
    val discussionCount: Int = 0,
    val watched: Boolean = false,
)

@Serializable
data class Actor(
    val id: String = "",
    val name: String = "",
    val koreanName: String? = null,
    val photoUrl: String? = null,
    val bio: String = "",
    val isFollowed: Boolean = false,
    val followerCount: Int = 0,
)

@Serializable
data class WatchingStatus(
    val dramaId: String = "",
    val status: String = "WATCHING", // WATCHING | COMPLETED | PLAN_TO_WATCH
    val watchedThroughEpisode: Int = 0,
    val updatedAt: String = "",
)

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

@Serializable
data class Post(
    val id: String = "",
    val authorId: String = "",
    val author: Profile? = null,
    val text: String = "",
    val category: PostCategory? = null,
    val dramaId: String? = null,
    val dramaTitle: String? = null,
    val episodeNumber: Int? = null,
    val spoilerLevel: Int? = null,
    val imageUrls: List<String> = emptyList(),
    val likeCount: Int = 0,
    val commentCount: Int = 0,
    val repostCount: Int = 0,
    val isLiked: Boolean = false,
    val isBookmarked: Boolean = false,
    val isReposted: Boolean = false,
    val createdAt: String = "",
)

@Serializable
data class Comment(
    val id: String = "",
    val postId: String = "",
    val parentId: String? = null,
    val authorId: String = "",
    val author: Profile? = null,
    val text: String = "",
    val likeCount: Int = 0,
    val isLiked: Boolean = false,
    val createdAt: String = "",
)

@Serializable
data class Community(
    val id: String = "",
    val name: String = "",
    val description: String = "",
    val avatarUrl: String? = null,
    val bannerUrl: String? = null,
    val memberCount: Int = 0,
    val visibility: CommunityVisibility = CommunityVisibility.PUBLIC,
    val isJoined: Boolean = false,
    val isModerator: Boolean = false,
)

@Serializable
data class AppNotification(
    val id: String = "",
    val type: NotificationType = NotificationType.SYSTEM,
    val title: String = "",
    val body: String = "",
    val actor: Profile? = null,
    val dramaId: String? = null,
    val episodeNumber: Int? = null,
    val postId: String? = null,
    val read: Boolean = false,
    val createdAt: String = "",
)

@Serializable
data class Report(
    val id: String = "",
    val targetType: String = "", // POST | COMMENT | USER | COMMUNITY
    val targetId: String = "",
    val reporterId: String = "",
    val reason: ReportReason = ReportReason.OTHER,
    val note: String = "",
    val status: ReportStatus = ReportStatus.OPEN,
    val createdAt: String = "",
    val preview: String = "",
)

@Serializable
data class SearchResults(
    val dramas: List<Drama> = emptyList(),
    val actors: List<Actor> = emptyList(),
    val users: List<Profile> = emptyList(),
    val communities: List<Community> = emptyList(),
    val posts: List<Post> = emptyList(),
    val hashtags: List<String> = emptyList(),
)

@Serializable
data class TrendingTopic(
    val rank: Int = 0,
    val tag: String = "",
    val postCount: Int = 0,
)

@Serializable
data class Page<T>(
    val items: List<T> = emptyList(),
    val nextOffset: Int? = null,
)

object Categories {
    val all: List<PostCategory> = PostCategory.entries
    fun label(category: PostCategory): String = when (category) {
        PostCategory.REACTION -> "Reaction"
        PostCategory.DISCUSSION -> "Discussion"
        PostCategory.THEORY -> "Theory"
        PostCategory.RECOMMENDATION -> "Recommendation"
        PostCategory.MEME -> "Meme"
        PostCategory.NEWS -> "News"
        PostCategory.QUESTION -> "Question"
        PostCategory.FAN_CONTENT -> "Fan content"
    }
}

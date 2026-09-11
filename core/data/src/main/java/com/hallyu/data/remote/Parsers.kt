package com.hallyu.data.remote

import com.hallyu.data.remote.boolOrFalse
import com.hallyu.data.remote.intOrNull
import com.hallyu.data.remote.intOrZero
import com.hallyu.data.remote.objectOrNull
import com.hallyu.data.remote.stringList
import com.hallyu.data.remote.stringOrEmpty
import com.hallyu.data.remote.stringOrNull
import com.hallyu.domain.model.Actor
import com.hallyu.domain.model.AppNotification
import com.hallyu.domain.model.Community
import com.hallyu.domain.model.CommunityVisibility
import com.hallyu.domain.model.Drama
import com.hallyu.domain.model.DramaStatus
import com.hallyu.domain.model.Episode
import com.hallyu.domain.model.NotificationType
import com.hallyu.domain.model.Post
import com.hallyu.domain.model.PostCategory
import com.hallyu.domain.model.Profile
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull

internal fun parseProfile(obj: JsonObject): Profile = Profile(
    id = obj.stringOrEmpty("id"),
    username = obj.stringOrEmpty("username"),
    displayName = obj.stringOrEmpty("display_name"),
    bio = obj.stringOrEmpty("bio"),
    avatarUrl = obj.stringOrNull("avatar_url"),
    isVerified = obj.boolOrFalse("is_verified"),
    isOfficial = obj.boolOrFalse("is_official"),
    followerCount = obj.intOrZero("follower_count"),
    followingCount = obj.intOrZero("following_count"),
    postCount = obj.intOrZero("post_count"),
    isFollowed = obj.boolOrFalse("is_followed"),
)

internal fun parseDrama(obj: JsonObject): Drama = Drama(
    id = obj.stringOrEmpty("id"),
    title = obj.stringOrEmpty("title"),
    koreanTitle = obj.stringOrNull("korean_title"),
    synopsis = obj.stringOrEmpty("synopsis"),
    posterUrl = obj.stringOrNull("poster_url"),
    backdropUrl = obj.stringOrNull("backdrop_url"),
    status = obj.stringOrNull("status")?.let { runCatching { DramaStatus.valueOf(it) }.getOrNull() } ?: DramaStatus.AIRING,
    year = obj.intOrZero("year"),
    genres = obj.stringList("genres"),
    airsOn = obj.stringOrNull("airs_on"),
    network = obj.stringOrNull("network"),
    episodeCount = obj.intOrZero("episode_count"),
    isFollowed = obj.boolOrFalse("is_followed"),
    watchingStatus = obj.stringOrNull("watching_status"),
)

internal fun parseEpisode(obj: JsonObject): Episode = Episode(
    id = obj.stringOrEmpty("id"),
    dramaId = obj.stringOrEmpty("drama_id"),
    number = obj.intOrZero("number"),
    title = obj.stringOrNull("title"),
    synopsis = obj.stringOrEmpty("synopsis"),
    airDate = obj.stringOrNull("air_date"),
    thumbnailUrl = obj.stringOrNull("thumbnail_url"),
    discussionCount = obj.intOrZero("discussion_count"),
    watched = obj.boolOrFalse("watched"),
)

internal fun parseActor(obj: JsonObject): Actor = Actor(
    id = obj.stringOrEmpty("id"),
    name = obj.stringOrEmpty("name"),
    koreanName = obj.stringOrNull("korean_name"),
    photoUrl = obj.stringOrNull("photo_url"),
    bio = obj.stringOrEmpty("bio"),
    isFollowed = obj.boolOrFalse("is_followed"),
    followerCount = obj.intOrZero("follower_count"),
)

internal fun parsePost(obj: JsonObject): Post {
    val author = obj.objectOrNull("author")?.let { parseProfile(it) }
    val drama = obj.objectOrNull("drama")
    return Post(
        id = obj.stringOrEmpty("id"),
        authorId = obj.stringOrEmpty("author_id"),
        author = author,
        text = obj.stringOrEmpty("text"),
        category = obj.stringOrNull("category")?.let { runCatching { PostCategory.valueOf(it) }.getOrNull() },
        dramaId = obj.stringOrNull("drama_id"),
        dramaTitle = drama?.stringOrNull("title"),
        episodeNumber = obj.intOrNull("episode_number"),
        spoilerLevel = obj.intOrNull("spoiler_level"),
        imageUrls = obj.stringList("image_urls"),
        likeCount = obj.intOrZero("like_count"),
        commentCount = obj.intOrZero("comment_count"),
        repostCount = obj.intOrZero("repost_count"),
        isLiked = obj.boolOrFalse("is_liked"),
        isBookmarked = obj.boolOrFalse("is_bookmarked"),
        isReposted = obj.boolOrFalse("is_reposted"),
        createdAt = obj.stringOrEmpty("created_at"),
    )
}

internal fun parseCommunity(obj: JsonObject): Community = Community(
    id = obj.stringOrEmpty("id"),
    name = obj.stringOrEmpty("name"),
    description = obj.stringOrEmpty("description"),
    avatarUrl = (obj["avatar_url"] as? JsonPrimitive)?.contentOrNull,
    bannerUrl = (obj["banner_url"] as? JsonPrimitive)?.contentOrNull,
    memberCount = obj.intOrZero("member_count"),
    visibility = obj.stringOrNull("visibility")?.let {
        runCatching { CommunityVisibility.valueOf(it) }.getOrNull()
    } ?: CommunityVisibility.PUBLIC,
    isJoined = obj.boolOrFalse("is_joined"),
    isModerator = obj.boolOrFalse("is_moderator"),
)

internal fun parseNotification(obj: JsonObject): AppNotification {
    val actor = obj.objectOrNull("actor")?.let { parseProfile(it) }
    return AppNotification(
        id = obj.stringOrEmpty("id"),
        type = obj.stringOrNull("type")?.let { runCatching { NotificationType.valueOf(it) }.getOrNull() }
            ?: NotificationType.SYSTEM,
        title = obj.stringOrEmpty("title"),
        body = obj.stringOrEmpty("body"),
        actor = actor,
        dramaId = obj.stringOrNull("drama_id"),
        episodeNumber = obj.stringOrNull("episode_number")?.toIntOrNull(),
        postId = obj.stringOrNull("post_id"),
        read = obj.boolOrFalse("read"),
        createdAt = obj.stringOrEmpty("created_at"),
    )
}

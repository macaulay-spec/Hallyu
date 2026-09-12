package com.hallyu.backend.db

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.date
import org.jetbrains.exposed.sql.javatime.datetime

/**
 * Exposed table definitions mirroring database/migrations/V1__initial_schema.sql.
 * SQL migrations are the source of truth for DDL; these definitions exist for
 * type-safe query construction in DAOs.
 */
object Users : Table("users") {
    val id = long("id").autoIncrement()
    val email = text("email").uniqueIndex()
    val passwordHash = text("password_hash")
    val role = text("role").default("user")
    val status = text("status").default("active")
    val emailVerified = bool("email_verified").default(false)
    val createdAt = datetime("created_at")
    val updatedAt = datetime("updated_at")
    override val primaryKey = PrimaryKey(id)
}

object Profiles : Table("profiles") {
    val userId = long("user_id")
    val handle = text("handle").uniqueIndex()
    val displayName = text("display_name")
    val bio = text("bio").nullable()
    val avatarMediaId = long("avatar_media_id").nullable()
    val bannerMediaId = long("banner_media_id").nullable()
    val verificationLevel = text("verification_level").default("none")
    val isPrivate = bool("is_private").default(false)
    val followerCount = integer("follower_count").default(0)
    val followingCount = integer("following_count").default(0)
    val postCount = integer("post_count").default(0)
    val spoilerPreference = text("spoiler_preference").default("balanced")
    val askBeforeReveal = bool("ask_before_reveal").default(true)
    val quietHoursStart = short("quiet_hours_start").nullable()
    val quietHoursEnd = short("quiet_hours_end").nullable()
    val onboarded = bool("onboarded").default(false)
    val createdAt = datetime("created_at")
    val updatedAt = datetime("updated_at")
    override val primaryKey = PrimaryKey(userId)
}

object RefreshTokens : Table("refresh_tokens") {
    val id = long("id").autoIncrement()
    val userId = long("user_id").index()
    val tokenHash = text("token_hash").uniqueIndex()
    val familyId = uuid("family_id")
    val expiresAt = datetime("expires_at")
    val revokedAt = datetime("revoked_at").nullable()
    val replacedBy = long("replaced_by").nullable()
    val userAgent = text("user_agent").nullable()
    val ip = text("ip").nullable()
    val createdAt = datetime("created_at")
    override val primaryKey = PrimaryKey(id)
}

object Follows : Table("follows") {
    val id = long("id").autoIncrement()
    val followerId = long("follower_id").index()
    val subjectType = text("subject_type")
    val subjectId = long("subject_id")
    val createdAt = datetime("created_at")
    override val primaryKey = PrimaryKey(id)
    init {
        uniqueIndex(followerId, subjectType, subjectId)
        index(isUnique = false, subjectType, subjectId)
    }
}

object Blocks : Table("blocks") {
    val id = long("id").autoIncrement()
    val blockerId = long("blocker_id")
    val blockedId = long("blocked_id")
    val createdAt = datetime("created_at")
    override val primaryKey = PrimaryKey(id)
    init { uniqueIndex(blockerId, blockedId) }
}

object Mutes : Table("mutes") {
    val id = long("id").autoIncrement()
    val muterId = long("muter_id")
    val mutedId = long("muted_id")
    val createdAt = datetime("created_at")
    override val primaryKey = PrimaryKey(id)
    init { uniqueIndex(muterId, mutedId) }
}

object Dramas : Table("dramas") {
    val id = long("id").autoIncrement()
    val slug = text("slug").uniqueIndex()
    val title = text("title")
    val titleKr = text("title_kr").nullable()
    val year = integer("year").nullable()
    val network = text("network").nullable()
    val country = text("country").default("South Korea")
    val genres = text("genres").default("")
    val synopsis = text("synopsis").nullable()
    val posterMediaId = long("poster_media_id").nullable()
    val backdropMediaId = long("backdrop_media_id").nullable()
    val status = text("status").default("airing")
    val episodeCount = integer("episode_count").default(0)
    val airStart = date("air_start").nullable()
    val airEnd = date("air_end").nullable()
    val followerCount = integer("follower_count").default(0)
    val isFeatured = bool("is_featured").default(false)
    val tmdbId = integer("tmdb_id").nullable()
    val createdAt = datetime("created_at")
    val updatedAt = datetime("updated_at")
    override val primaryKey = PrimaryKey(id)
}

object Episodes : Table("episodes") {
    val id = long("id").autoIncrement()
    val dramaId = long("drama_id").index()
    val number = integer("number")
    val title = text("title").nullable()
    val airDate = date("air_date").nullable()
    val synopsis = text("synopsis").nullable()
    val tmdbId = integer("tmdb_id").nullable()
    val createdAt = datetime("created_at")
    override val primaryKey = PrimaryKey(id)
    init { uniqueIndex("episodes_uniq", dramaId, number) }
}

object Actors : Table("actors") {
    val id = long("id").autoIncrement()
    val slug = text("slug").uniqueIndex()
    val name = text("name")
    val nameKr = text("name_kr").nullable()
    val bio = text("bio").nullable()
    val photoMediaId = long("photo_media_id").nullable()
    val birthday = date("birthday").nullable()
    val nationality = text("nationality").default("South Korean")
    val followerCount = integer("follower_count").default(0)
    val tmdbId = integer("tmdb_id").nullable()
    val createdAt = datetime("created_at")
    override val primaryKey = PrimaryKey(id)
}

object Credits : Table("credits") {
    val id = long("id").autoIncrement()
    val actorId = long("actor_id").index()
    val dramaId = long("drama_id").index()
    val roleName = text("role_name").nullable()
    val roleType = text("role_type").default("support")
    val creditOrder = integer("credit_order").default(100)
    val createdAt = datetime("created_at")
    override val primaryKey = PrimaryKey(id)
    init { uniqueIndex("credits_uniq", actorId, dramaId) }
}

object WatchProgress : Table("watch_progress") {
    val id = long("id").autoIncrement()
    val userId = long("user_id").index()
    val dramaId = long("drama_id")
    val lastEpisode = integer("last_episode").default(0)
    val status = text("status").default("watching")
    val updatedAt = datetime("updated_at")
    override val primaryKey = PrimaryKey(id)
    init { uniqueIndex("watch_progress_uniq", userId, dramaId) }
}

object SpoilerMutes : Table("spoiler_mutes") {
    val userId = long("user_id")
    val dramaId = long("drama_id")
    val createdAt = datetime("created_at")
    override val primaryKey = PrimaryKey(userId, dramaId)
}

object MediaAssets : Table("media_assets") {
    val id = long("id").autoIncrement()
    val ownerId = long("owner_id").index()
    val kind = text("kind")
    val status = text("status").default("pending")
    val mime = text("mime")
    val sizeBytes = long("size_bytes")
    val width = integer("width").nullable()
    val height = integer("height").nullable()
    val storageKey = text("storage_key")
    val thumbKey = text("thumb_key").nullable()
    val createdAt = datetime("created_at")
    override val primaryKey = PrimaryKey(id)
}

object Communities : Table("communities") {
    val id = long("id").autoIncrement()
    val slug = text("slug").uniqueIndex()
    val name = text("name")
    val description = text("description").nullable()
    val bannerMediaId = long("banner_media_id").nullable()
    val avatarMediaId = long("avatar_media_id").nullable()
    val isOfficial = bool("is_official").default(false)
    val createdBy = long("created_by").nullable()
    val memberCount = integer("member_count").default(0)
    val postCount = integer("post_count").default(0)
    val createdAt = datetime("created_at")
    override val primaryKey = PrimaryKey(id)
}

object CommunityMembers : Table("community_members") {
    val communityId = long("community_id")
    val userId = long("user_id").index()
    val role = text("role").default("member")
    val joinedAt = datetime("joined_at")
    override val primaryKey = PrimaryKey(communityId, userId)
}

object CommunityRules : Table("community_rules") {
    val id = long("id").autoIncrement()
    val communityId = long("community_id").index()
    val position = short("position").default(0)
    val ruleText = text("rule_text")
    val createdAt = datetime("created_at")
    override val primaryKey = PrimaryKey(id)
}

object Posts : Table("posts") {
    val id = long("id").autoIncrement()
    val authorId = long("author_id").index()
    val content = text("content")
    val communityId = long("community_id").nullable()
    val dramaId = long("drama_id").nullable()
    val episodeId = long("episode_id").nullable()
    val spoilerLevel = text("spoiler_level").default("none")
    val spoilerDramaId = long("spoiler_drama_id").nullable()
    val spoilerEpisode = integer("spoiler_episode").nullable()
    val repostOfId = long("repost_of_id").nullable()
    val isLocked = bool("is_locked").default(false)
    val isPinned = bool("is_pinned").default(false)
    val commentCount = integer("comment_count").default(0)
    val reactionCount = integer("reaction_count").default(0)
    val repostCount = integer("repost_count").default(0)
    val deletedAt = datetime("deleted_at").nullable()
    val editedAt = datetime("edited_at").nullable()
    val createdAt = datetime("created_at")
    override val primaryKey = PrimaryKey(id)
}

object Comments : Table("comments") {
    val id = long("id").autoIncrement()
    val postId = long("post_id").index()
    val parentCommentId = long("parent_comment_id").nullable()
    val rootCommentId = long("root_comment_id").nullable()
    val depth = short("depth").default(1)
    val authorId = long("author_id").index()
    val content = text("content")
    val spoilerLevel = text("spoiler_level").default("none")
    val reactionCount = integer("reaction_count").default(0)
    val deletedAt = datetime("deleted_at").nullable()
    val createdAt = datetime("created_at")
    override val primaryKey = PrimaryKey(id)
}

object Reactions : Table("reactions") {
    val id = long("id").autoIncrement()
    val userId = long("user_id")
    val targetType = text("target_type")
    val targetId = long("target_id")
    val emoji = text("emoji")
    val createdAt = datetime("created_at")
    override val primaryKey = PrimaryKey(id)
    init {
        uniqueIndex(userId, targetType, targetId)
        index(isUnique = false, targetType, targetId, emoji)
    }
}

object Bookmarks : Table("bookmarks") {
    val userId = long("user_id")
    val postId = long("post_id")
    val createdAt = datetime("created_at")
    override val primaryKey = PrimaryKey(userId, postId)
}

object Hashtags : Table("hashtags") {
    val id = long("id").autoIncrement()
    val tag = text("tag").uniqueIndex()
    val useCount = integer("use_count").default(0)
    override val primaryKey = PrimaryKey(id)
}

object PostHashtags : Table("post_hashtags") {
    val postId = long("post_id")
    val hashtagId = long("hashtag_id").index()
    override val primaryKey = PrimaryKey(postId, hashtagId)
}

object Mentions : Table("mentions") {
    val id = long("id").autoIncrement()
    val authorId = long("author_id")
    val mentionedId = long("mentioned_id").index()
    val targetType = text("target_type")
    val targetId = long("target_id")
    val createdAt = datetime("created_at")
    override val primaryKey = PrimaryKey(id)
}

object PostMedia : Table("post_media") {
    val postId = long("post_id")
    val mediaId = long("media_id")
    val position = short("position").default(0)
    override val primaryKey = PrimaryKey(postId, mediaId)
}

object Reports : Table("reports") {
    val id = long("id").autoIncrement()
    val reporterId = long("reporter_id")
    val targetType = text("target_type")
    val targetId = long("target_id")
    val reason = text("reason")
    val details = text("details").nullable()
    val status = text("status").default("open")
    val resolvedBy = long("resolved_by").nullable()
    val resolvedAt = datetime("resolved_at").nullable()
    val createdAt = datetime("created_at")
    override val primaryKey = PrimaryKey(id)
}

object ModerationActions : Table("moderation_actions") {
    val id = long("id").autoIncrement()
    val actorId = long("actor_id")
    val action = text("action")
    val targetType = text("target_type")
    val targetId = long("target_id")
    val reason = text("reason").nullable()
    val createdAt = datetime("created_at")
    override val primaryKey = PrimaryKey(id)
}

object AuditLog : Table("audit_log") {
    val id = long("id").autoIncrement()
    val actorId = long("actor_id").nullable()
    val action = text("action")
    val entityType = text("entity_type")
    val entityId = long("entity_id").nullable()
    val details = text("details").nullable()
    val createdAt = datetime("created_at")
    override val primaryKey = PrimaryKey(id)
}

object SpoilerReveals : Table("spoiler_reveals") {
    val id = long("id").autoIncrement()
    val userId = long("user_id").index()
    val targetType = text("target_type")
    val targetId = long("target_id")
    val createdAt = datetime("created_at")
    override val primaryKey = PrimaryKey(id)
}

object Notifications : Table("notifications") {
    val id = long("id").autoIncrement()
    val userId = long("user_id").index()
    val type = text("type")
    val actorId = long("actor_id").nullable()
    val entityType = text("entity_type").nullable()
    val entityId = long("entity_id").nullable()
    val payload = text("payload").nullable()
    val readAt = datetime("read_at").nullable()
    val createdAt = datetime("created_at")
    override val primaryKey = PrimaryKey(id)
}

object Devices : Table("devices") {
    val id = long("id").autoIncrement()
    val userId = long("user_id")
    val platform = text("platform")
    val pushToken = text("push_token")
    val createdAt = datetime("created_at")
    val lastSeen = datetime("last_seen")
    override val primaryKey = PrimaryKey(id)
    init { uniqueIndex(userId, pushToken) }
}

object TrendingSnapshots : Table("trending_snapshots") {
    val id = long("id").autoIncrement()
    val entityType = text("entity_type")
    val entityId = long("entity_id")
    val score = double("score")
    val bucket = date("bucket")
    val computedAt = datetime("computed_at")
    override val primaryKey = PrimaryKey(id)
}

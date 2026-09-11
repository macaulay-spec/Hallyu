package com.hallyu.data.repository

import com.hallyu.common.AppError
import com.hallyu.common.AppResult
import com.hallyu.common.map
import com.hallyu.common.valueOrNull
import com.hallyu.data.remote.arrayOrEmpty
import com.hallyu.data.remote.boolOrFalse
import com.hallyu.data.remote.intOrNull
import com.hallyu.data.remote.intOrZero
import com.hallyu.data.remote.mapObjects
import com.hallyu.data.remote.objectOrNull
import com.hallyu.data.remote.stringList
import com.hallyu.data.remote.stringOrEmpty
import com.hallyu.data.remote.stringOrNull
import com.hallyu.data.remote.parseProfile
import com.hallyu.data.remote.SupabaseRestClient
import com.hallyu.data.session.SessionStore
import com.hallyu.domain.model.Comment
import com.hallyu.domain.model.FeedKind
import com.hallyu.domain.model.Page
import com.hallyu.domain.model.Post
import com.hallyu.domain.model.PostCategory
import com.hallyu.domain.model.Profile
import com.hallyu.domain.repository.PostRepository
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

@Singleton
class PostRepositoryImpl @Inject constructor(
    private val client: SupabaseRestClient,
    private val store: SessionStore,
) : PostRepository {

    private suspend fun myId(): String? = store.session.firstOrNull()?.userId

    override suspend fun getFeed(
        kind: FeedKind,
        offset: Int,
        limit: Int,
        communityId: String?,
    ): AppResult<Page<Post>> {
        val query = linkedMapOf(
            "select" to "*,author:profiles(id,username,display_name,avatar_url,is_verified,is_official),drama:dramas(title)",
            "order" to "created_at.desc",
            "limit" to limit.toString(),
            "offset" to offset.toString(),
        )
        if (kind == FeedKind.COMMUNITY && communityId != null) {
            query["community_id"] = "eq.$communityId"
        }
        return when (val res = client.restGet("posts", query)) {
            is AppResult.Error -> res
            is AppResult.Success -> {
                val posts = (res.value as? JsonArray)
                    ?.mapObjects { parsePost(it) }
                    ?: emptyList()
                val marked = markMine(posts)
                AppResult.Success(Page(marked, (offset + marked.size).takeIf { marked.isNotEmpty() }))
            }
        }
    }

    override suspend fun getPost(postId: String): AppResult<Post> = when (
        val res = client.restGet(
            "posts",
            mapOf(
                "select" to "*,author:profiles(id,username,display_name,avatar_url,is_verified,is_official),drama:dramas(title)",
                "id" to "eq.$postId",
            ),
        )
    ) {
        is AppResult.Error -> res
        is AppResult.Success -> {
            val first = (res.value as? JsonArray)?.firstOrNull() as? JsonObject
            if (first == null) AppResult.Error(AppError.NotFound)
            else AppResult.Success(parsePost(first))
        }
    }

    override suspend fun createPost(
        text: String,
        category: String?,
        dramaId: String?,
        episodeNumber: Int?,
        spoilerLevel: Int?,
        imageUrls: List<String>,
    ): AppResult<Post> {
        val uid = myId() ?: return AppResult.Error(AppError.Unauthorized)
        val body = buildJsonObject {
            put("author_id", uid)
            put("text", text)
            if (category != null) put("category", category)
            if (dramaId != null) put("drama_id", dramaId)
            if (episodeNumber != null) put("episode_number", episodeNumber)
            if (spoilerLevel != null) put("spoiler_level", spoilerLevel)
            put("image_urls", buildJsonArray { imageUrls.forEach { add(JsonPrimitive(it)) } })
        }
        return when (val res = client.restPost("posts", body)) {
            is AppResult.Error -> res
            is AppResult.Success -> {
                val first = (res.value as? JsonArray)?.firstOrNull() as? JsonObject
                    ?: return AppResult.Error(AppError.Unknown("Post created but response unreadable"))
                AppResult.Success(parsePost(first))
            }
        }
    }

    override suspend fun toggleLike(postId: String, liked: Boolean): AppResult<Int> {
        val uid = myId() ?: return AppResult.Error(AppError.Unauthorized)
        if (liked) {
            val body = buildJsonObject {
                put("post_id", postId)
                put("user_id", uid)
            }
            when (val res = client.restPost("post_reactions", body)) {
                is AppResult.Error -> return res
                is AppResult.Success -> Unit
            }
        } else {
            when (val res = client.restDelete(
                "post_reactions",
                mapOf("post_id" to "eq.$postId", "user_id" to "eq.$uid"),
            )) {
                is AppResult.Error -> return res
                is AppResult.Success -> Unit
            }
        }
        return reactionCount("post_reactions", postId)
    }

    override suspend fun getBookmarkedPosts(): AppResult<List<Post>> {
        val uid = myId() ?: return AppResult.Success(emptyList())
        return when (val res = client.restGet(
            "bookmarks",
            mapOf(
                "select" to "post:posts(*,author:profiles(id,username,display_name,avatar_url,is_verified,is_official),drama:dramas(title))",
                "user_id" to "eq.$uid",
                "order" to "created_at.desc",
            ),
        )) {
            is AppResult.Error -> res
            is AppResult.Success -> AppResult.Success(
                (res.value as? JsonArray)
                    ?.mapNotNull { (it as? JsonObject)?.objectOrNull("post") }
                    ?.map { parsePost(it.copyBookmarked()) }
                    ?: emptyList(),
            )
        }
    }

    private fun JsonObject.copyBookmarked(): JsonObject = buildJsonObject {
        this@copyBookmarked.forEach { (key, value) -> put(key, value) }
        put("is_bookmarked", true)
    }

    override suspend fun toggleBookmark(postId: String, bookmarked: Boolean): AppResult<Boolean> {
        val uid = myId() ?: return AppResult.Error(AppError.Unauthorized)
        return if (bookmarked) {
            client.restPost(
                "bookmarks",
                buildJsonObject { put("post_id", postId); put("user_id", uid) },
            ).map { true }
        } else {
            client.restDelete("bookmarks", mapOf("post_id" to "eq.$postId", "user_id" to "eq.$uid")).map { false }
        }
    }

    override suspend fun toggleRepost(postId: String): AppResult<Boolean> {
        val uid = myId() ?: return AppResult.Error(AppError.Unauthorized)
        val existing = client.restGet(
            "reposts",
            mapOf("post_id" to "eq.$postId", "user_id" to "eq.$uid", "select" to "id"),
        )
        return when (existing) {
            is AppResult.Error -> existing
            is AppResult.Success -> {
                val already = (existing.value as? JsonArray)?.isNotEmpty() == true
                if (already) {
                    client.restDelete("reposts", mapOf("post_id" to "eq.$postId", "user_id" to "eq.$uid")).map { false }
                } else {
                    client.restPost(
                        "reposts",
                        buildJsonObject { put("post_id", postId); put("user_id", uid) },
                    ).map { true }
                }
            }
        }
    }

    override suspend fun getComments(postId: String): AppResult<List<Comment>> = when (
        val res = client.restGet(
            "comments",
            mapOf(
                "select" to "*,author:profiles(id,username,display_name,avatar_url,is_verified,is_official)",
                "post_id" to "eq.$postId",
                "order" to "created_at.asc",
            ),
        )
    ) {
        is AppResult.Error -> res
        is AppResult.Success -> AppResult.Success(
            (res.value as? JsonArray)?.mapObjects { parseComment(it) } ?: emptyList(),
        )
    }

    override suspend fun addComment(postId: String, text: String, parentId: String?): AppResult<Comment> {
        val uid = myId() ?: return AppResult.Error(AppError.Unauthorized)
        val body = buildJsonObject {
            put("post_id", postId)
            put("author_id", uid)
            put("text", text)
            if (parentId != null) put("parent_id", parentId)
        }
        return when (val res = client.restPost("comments", body)) {
            is AppResult.Error -> res
            is AppResult.Success -> {
                val first = (res.value as? JsonArray)?.firstOrNull() as? JsonObject
                    ?: return AppResult.Error(AppError.Unknown("Comment created but response unreadable"))
                AppResult.Success(parseComment(first))
            }
        }
    }

    override suspend fun toggleCommentLike(commentId: String, liked: Boolean): AppResult<Int> {
        val uid = myId() ?: return AppResult.Error(AppError.Unauthorized)
        if (liked) {
            client.restPost(
                "comment_reactions",
                buildJsonObject { put("comment_id", commentId); put("user_id", uid) },
            )
        } else {
            client.restDelete("comment_reactions", mapOf("comment_id" to "eq.$commentId", "user_id" to "eq.$uid"))
        }
        return reactionCount("comment_reactions", commentId, "comment_id")
    }

    // -- internals ---------------------------------------------------------

    private suspend fun reactionCount(table: String, id: String, column: String = "post_id"): AppResult<Int> =
        when (val res = client.restGet(table, mapOf(column to "eq.$id", "select" to column))) {
            is AppResult.Error -> res
            is AppResult.Success -> AppResult.Success((res.value as? JsonArray)?.size ?: 0)
        }

    private suspend fun markMine(posts: List<Post>): List<Post> {
        val ids = posts.map { it.id }.filter { it.isNotBlank() }
        if (ids.isEmpty()) return posts
        val idFilter = "in.(${ids.joinToString(",")})"
        val liked = idSet("post_reactions", idFilter)
        val saved = idSet("bookmarks", idFilter)
        val reposted = idSet("reposts", idFilter)
        return posts.map {
            it.copy(isLiked = it.id in liked, isBookmarked = it.id in saved, isReposted = it.id in reposted)
        }
    }

    private suspend fun idSet(table: String, idFilter: String): Set<String> {
        val uid = myId() ?: return emptySet()
        return when (val res = client.restGet(table, mapOf("post_id" to idFilter, "user_id" to "eq.$uid", "select" to "post_id"))) {
            is AppResult.Success -> (res.value as? JsonArray)
                ?.mapNotNull { (it as? JsonObject)?.stringOrNull("post_id") }
                ?.toSet()
                ?: emptySet()
            is AppResult.Error -> emptySet()
        }
    }

    private fun parsePost(obj: JsonObject): Post {
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

    private fun parseComment(obj: JsonObject): Comment = Comment(
        id = obj.stringOrEmpty("id"),
        postId = obj.stringOrEmpty("post_id"),
        parentId = obj.stringOrNull("parent_id"),
        authorId = obj.stringOrEmpty("author_id"),
        author = obj.objectOrNull("author")?.let { parseProfile(it) },
        text = obj.stringOrEmpty("text"),
        likeCount = obj.intOrZero("like_count"),
        isLiked = obj.boolOrFalse("is_liked"),
        createdAt = obj.stringOrEmpty("created_at"),
    )

}

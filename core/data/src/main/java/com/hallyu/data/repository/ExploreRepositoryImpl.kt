package com.hallyu.data.repository

import com.hallyu.common.AppResult
import com.hallyu.common.map
import com.hallyu.common.valueOrNull
import com.hallyu.data.remote.intOrZero
import com.hallyu.data.remote.mapObjects
import com.hallyu.data.remote.objectOrNull
import com.hallyu.data.remote.stringOrEmpty
import com.hallyu.data.remote.parseActor
import com.hallyu.data.remote.parseDrama
import com.hallyu.data.remote.parsePost
import com.hallyu.data.remote.parseProfile
import com.hallyu.data.remote.SupabaseRestClient
import com.hallyu.domain.model.Community
import com.hallyu.domain.model.CommunityVisibility
import com.hallyu.domain.model.Page
import com.hallyu.domain.model.Post
import com.hallyu.domain.model.SearchResults
import com.hallyu.domain.model.TrendingTopic
import com.hallyu.domain.repository.ExploreRepository
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull

@Singleton
class ExploreRepositoryImpl @Inject constructor(
    private val client: SupabaseRestClient,
) : ExploreRepository {

    override suspend fun search(query: String): AppResult<SearchResults> {
        if (query.isBlank()) return AppResult.Success(SearchResults())
        val pattern = "ilike.*$query*"

        val dramas = fetchList("dramas", mapOf("title" to pattern, "limit" to "10")) { parseDrama(it) }
        val actors = fetchList("actors", mapOf("name" to pattern, "limit" to "10")) { parseActor(it) }
        val users = fetchList("profiles", mapOf("username" to pattern, "limit" to "10")) { parseProfile(it) }
        val communities = fetchList("communities", mapOf("name" to pattern, "limit" to "10")) { parseCommunity(it) }
        val posts = fetchList(
            "posts",
            mapOf(
                "select" to "*,author:profiles(id,username,display_name,avatar_url,is_verified,is_official),drama:dramas(title)",
                "text" to pattern,
                "limit" to "10",
            ),
        ) { parsePost(it) }
        val tags = when (val res = client.restGet("hashtags", mapOf("tag" to pattern, "limit" to "10"))) {
            is AppResult.Success -> (res.value as? JsonArray)
                ?.mapNotNull { (it as? JsonObject)?.stringOrEmpty("tag") }
                ?: emptyList()
            is AppResult.Error -> emptyList()
        }

        return AppResult.Success(
            SearchResults(
                dramas = dramas.valueOrNull() ?: emptyList(),
                actors = actors.valueOrNull() ?: emptyList(),
                users = users.valueOrNull() ?: emptyList(),
                communities = communities.valueOrNull() ?: emptyList(),
                posts = posts.valueOrNull() ?: emptyList(),
                hashtags = tags,
            ),
        )
    }

    override suspend fun getTrending(): AppResult<List<TrendingTopic>> = when (
        val res = client.restGet("hashtags", mapOf("order" to "post_count.desc", "limit" to "10"))
    ) {
        is AppResult.Error -> res
        is AppResult.Success -> {
            val topics = (res.value as? JsonArray)
                ?.mapObjects {
                    TrendingTopic(
                        rank = 0,
                        tag = it.stringOrEmpty("tag"),
                        postCount = it.intOrZero("post_count"),
                    )
                }
                ?.filter { it.tag.isNotBlank() }
                ?: emptyList()
            AppResult.Success(topics.mapIndexed { i, t -> t.copy(rank = i + 1) })
        }
    }

    override suspend fun getHashtagPosts(tag: String, offset: Int, limit: Int): AppResult<Page<Post>> {
        val tagRes = client.restGet("hashtags", mapOf("tag" to "eq.$tag", "select" to "id"))
        return when (tagRes) {
            is AppResult.Error -> tagRes
            is AppResult.Success -> {
                val tagId = ((tagRes.value as? JsonArray)?.firstOrNull() as? JsonObject)?.stringOrEmpty("id").orEmpty()
                if (tagId.isBlank()) return AppResult.Success(Page(emptyList(), null))
                when (val res = client.restGet(
                    "post_hashtags",
                    mapOf(
                        "select" to "post:posts(*,author:profiles(id,username,display_name,avatar_url,is_verified,is_official),drama:dramas(title))",
                        "hashtag_id" to "eq.$tagId",
                        "limit" to limit.toString(),
                        "offset" to offset.toString(),
                    ),
                )) {
                    is AppResult.Error -> res
                    is AppResult.Success -> {
                        val posts = (res.value as? JsonArray)
                            ?.mapNotNull { (it as? JsonObject)?.objectOrNull("post") }
                            ?.map { parsePost(it) }
                            ?: emptyList()
                        AppResult.Success(Page(posts, (offset + posts.size).takeIf { posts.isNotEmpty() }))
                    }
                }
            }
        }
    }

    private suspend fun <T> fetchList(
        table: String,
        query: Map<String, String>,
        parse: (JsonObject) -> T,
    ): AppResult<List<T>> = when (val res = client.restGet(table, query)) {
        is AppResult.Error -> res
        is AppResult.Success -> AppResult.Success((res.value as? JsonArray)?.mapObjects(parse) ?: emptyList())
    }

    private fun parseCommunity(obj: JsonObject): Community = Community(
        id = obj.stringOrEmpty("id"),
        name = obj.stringOrEmpty("name"),
        description = obj.stringOrEmpty("description"),
        avatarUrl = obj["avatar_url"]?.let { (it as? kotlinx.serialization.json.JsonPrimitive)?.contentOrNull },
        bannerUrl = obj["banner_url"]?.let { (it as? kotlinx.serialization.json.JsonPrimitive)?.contentOrNull },
        memberCount = obj.intOrZero("member_count"),
        visibility = obj.stringOrEmpty("visibility").let {
            runCatching { CommunityVisibility.valueOf(it) }.getOrDefault(CommunityVisibility.PUBLIC)
        },
    )
}

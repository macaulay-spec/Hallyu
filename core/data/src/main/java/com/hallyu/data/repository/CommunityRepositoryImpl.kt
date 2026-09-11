package com.hallyu.data.repository

import com.hallyu.common.AppError
import com.hallyu.common.AppResult
import com.hallyu.common.map
import com.hallyu.common.valueOrNull
import com.hallyu.data.remote.mapObjects
import com.hallyu.data.remote.objectOrNull
import com.hallyu.data.remote.parseCommunity
import com.hallyu.data.remote.parsePost
import com.hallyu.data.remote.SupabaseRestClient
import com.hallyu.data.session.SessionStore
import com.hallyu.domain.model.Community
import com.hallyu.domain.model.Page
import com.hallyu.domain.model.Post
import com.hallyu.domain.repository.CommunityRepository
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

@Singleton
class CommunityRepositoryImpl @Inject constructor(
    private val client: SupabaseRestClient,
    private val store: SessionStore,
) : CommunityRepository {

    private suspend fun myId(): String? = store.session.firstOrNull()?.userId

    override suspend fun getCommunity(communityId: String): AppResult<Community> = when (
        val res = client.restGet("communities", mapOf("select" to "*", "id" to "eq.$communityId"))
    ) {
        is AppResult.Error -> res
        is AppResult.Success -> {
            val obj = (res.value as? JsonArray)?.firstOrNull() as? JsonObject
                ?: return AppResult.Error(AppError.NotFound)
            AppResult.Success(mergeJoined(parseCommunity(obj)))
        }
    }

    override suspend fun getCommunities(): AppResult<List<Community>> = when (
        val res = client.restGet("communities", mapOf("select" to "*", "order" to "member_count.desc", "limit" to "50"))
    ) {
        is AppResult.Error -> res
        is AppResult.Success -> AppResult.Success(
            (res.value as? JsonArray)?.mapObjects { parseCommunity(it) } ?: emptyList(),
        )
    }

    override suspend fun getMyCommunities(): AppResult<List<Community>> {
        val uid = myId() ?: return AppResult.Success(emptyList())
        return when (val res = client.restGet(
            "community_members",
            mapOf("select" to "community:communities(*)", "user_id" to "eq.$uid"),
        )) {
            is AppResult.Error -> res
            is AppResult.Success -> AppResult.Success(
                (res.value as? JsonArray)
                    ?.mapNotNull { (it as? JsonObject)?.objectOrNull("community") }
                    ?.map { parseCommunity(it) }
                    ?: emptyList(),
            )
        }
    }

    override suspend fun joinCommunity(communityId: String, join: Boolean): AppResult<Boolean> {
        val uid = myId() ?: return AppResult.Error(AppError.Unauthorized)
        return if (join) {
            client.restPost(
                "community_members",
                buildJsonObject { put("user_id", uid); put("community_id", communityId) },
            ).map { true }
        } else {
            client.restDelete("community_members", mapOf("user_id" to "eq.$uid", "community_id" to "eq.$communityId"))
                .map { false }
        }
    }

    override suspend fun getCommunityFeed(communityId: String, offset: Int, limit: Int): AppResult<Page<Post>> =
        when (val res = client.restGet(
            "posts",
            mapOf(
                "select" to "*,author:profiles(id,username,display_name,avatar_url,is_verified,is_official),drama:dramas(title)",
                "community_id" to "eq.$communityId",
                "order" to "created_at.desc",
                "limit" to limit.toString(),
                "offset" to offset.toString(),
            ),
        )) {
            is AppResult.Error -> res
            is AppResult.Success -> {
                val posts = (res.value as? JsonArray)?.mapObjects { parsePost(it) } ?: emptyList()
                AppResult.Success(Page(posts, (offset + posts.size).takeIf { posts.isNotEmpty() }))
            }
        }

    private suspend fun mergeJoined(community: Community): Community {
        val uid = myId() ?: return community
        val res = client.restGet(
            "community_members",
            mapOf("user_id" to "eq.$uid", "community_id" to "eq.${community.id}", "select" to "user_id"),
        )
        return community.copy(isJoined = (res.valueOrNull() as? JsonArray)?.isNotEmpty() == true)
    }
}

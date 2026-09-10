package com.hallyu.data.repository

import com.hallyu.common.AppError
import com.hallyu.common.AppResult
import com.hallyu.data.remote.JsonParsing.mapObjects
import com.hallyu.data.remote.JsonParsing.stringOrEmpty
import com.hallyu.data.remote.Parsers.parseProfile
import com.hallyu.data.remote.SupabaseRestClient
import com.hallyu.data.session.SessionStore
import com.hallyu.domain.model.Profile
import com.hallyu.domain.repository.ProfileRepository
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

@Singleton
class ProfileRepositoryImpl @Inject constructor(
    private val client: SupabaseRestClient,
    private val store: SessionStore,
) : ProfileRepository {

    private suspend fun myId(): String? = store.session.firstOrNull()?.userId

    override suspend fun getProfile(userId: String): AppResult<Profile> {
        val id = if (userId == "me") myId() ?: return AppResult.Error(AppError.Unauthorized) else userId
        return when (val res = client.restGet("profiles", mapOf("select" to "*", "id" to "eq.$id"))) {
            is AppResult.Error -> res
            is AppResult.Success -> {
                val obj = (res.value as? JsonArray)?.firstOrNull() as? JsonObject
                    ?: return AppResult.Error(AppError.NotFound)
                AppResult.Success(mergeFollow(parseProfile(obj)))
            }
        }
    }

    override suspend fun updateProfile(profile: Profile): AppResult<Profile> {
        val id = profile.id.ifBlank { myId() } ?: return AppResult.Error(AppError.Unauthorized)
        val body = buildJsonObject {
            put("display_name", profile.displayName)
            put("bio", profile.bio)
            val avatarUrl = profile.avatarUrl
            if (avatarUrl != null) put("avatar_url", avatarUrl)
        }
        return when (val res = client.restPatch("profiles", mapOf("id" to "eq.$id"), body)) {
            is AppResult.Error -> res
            is AppResult.Success -> {
                val obj = (res.value as? JsonArray)?.firstOrNull() as? JsonObject
                    ?: return AppResult.Error(AppError.Unknown("Profile updated but response unreadable"))
                AppResult.Success(parseProfile(obj))
            }
        }
    }

    override suspend fun getFollowers(userId: String): AppResult<List<Profile>> {
        val res = client.restGet(
            "follows",
            mapOf("followed_user_id" to "eq.$userId", "select" to "user_id"),
        )
        return when (res) {
            is AppResult.Error -> res
            is AppResult.Success -> profilesByIds((res.value as? JsonArray)?.mapNotNull { (it as? JsonObject)?.stringOrEmpty("user_id") } ?: emptyList())
        }
    }

    override suspend fun getFollowing(userId: String): AppResult<List<Profile>> {
        val res = client.restGet(
            "follows",
            mapOf("user_id" to "eq.$userId", "select" to "followed_user_id"),
        )
        return when (res) {
            is AppResult.Error -> res
            is AppResult.Success -> profilesByIds(
                (res.value as? JsonArray)?.mapNotNull { (it as? JsonObject)?.stringOrEmpty("followed_user_id") } ?: emptyList(),
            )
        }
    }

    override suspend fun followUser(targetId: String): AppResult<Boolean> {
        val uid = myId() ?: return AppResult.Error(AppError.Unauthorized)
        return client.restPost(
            "follows",
            buildJsonObject { put("user_id", uid); put("followed_user_id", targetId) },
        ).map { true }
    }

    override suspend fun unfollowUser(targetId: String): AppResult<Boolean> {
        val uid = myId() ?: return AppResult.Error(AppError.Unauthorized)
        return client.restDelete(
            "follows",
            mapOf("user_id" to "eq.$uid", "followed_user_id" to "eq.$targetId"),
        ).map { false }
    }

    private suspend fun profilesByIds(ids: List<String>): AppResult<List<Profile>> {
        val unique = ids.filter { it.isNotBlank() }.distinct()
        if (unique.isEmpty()) return AppResult.Success(emptyList())
        return when (val res = client.restGet("profiles", mapOf("select" to "*", "id" to "in.(${unique.joinToString(",")})"))) {
            is AppResult.Error -> res
            is AppResult.Success -> AppResult.Success(
                (res.value as? JsonArray)?.mapObjects { parseProfile(it) } ?: emptyList(),
            )
        }
    }

    private suspend fun mergeFollow(profile: Profile): Profile {
        val uid = myId() ?: return profile
        val res = client.restGet(
            "follows",
            mapOf("user_id" to "eq.$uid", "followed_user_id" to "eq.${profile.id}", "select" to "id"),
        )
        return profile.copy(isFollowed = (res.valueOrNull() as? JsonArray)?.isNotEmpty() == true)
    }
}

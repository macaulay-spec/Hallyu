package com.hallyu.data.repository

import com.hallyu.common.AppError
import com.hallyu.common.AppResult
import com.hallyu.common.map
import com.hallyu.common.valueOrNull
import com.hallyu.data.cache.DramaDao
import com.hallyu.data.cache.EpisodeDao
import com.hallyu.data.cache.WatchDao
import com.hallyu.data.cache.WatchProgressEntity
import com.hallyu.data.mapper.toCache
import com.hallyu.data.mapper.toDomain
import com.hallyu.data.remote.intOrZero
import com.hallyu.data.remote.mapObjects
import com.hallyu.data.remote.objectOrNull
import com.hallyu.data.remote.stringOrEmpty
import com.hallyu.data.remote.stringOrNull
import com.hallyu.data.remote.parseActor
import com.hallyu.data.remote.parseDrama
import com.hallyu.data.remote.parseEpisode
import com.hallyu.data.remote.parsePost
import com.hallyu.data.remote.SupabaseRestClient
import com.hallyu.data.session.SessionStore
import com.hallyu.domain.model.Actor
import com.hallyu.domain.model.Drama
import com.hallyu.domain.model.Episode
import com.hallyu.domain.model.Post
import com.hallyu.domain.model.WatchingStatus
import com.hallyu.domain.repository.DramaRepository
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

@Singleton
class DramaRepositoryImpl @Inject constructor(
    private val client: SupabaseRestClient,
    private val store: SessionStore,
    private val dramaDao: DramaDao,
    private val episodeDao: EpisodeDao,
    private val watchDao: WatchDao,
) : DramaRepository {

    private suspend fun myId(): String? = store.session.firstOrNull()?.userId

    override suspend fun getDrama(dramaId: String): AppResult<Drama> {
        val remote = client.restGet(
            "dramas",
            mapOf("select" to "*", "id" to "eq.$dramaId"),
        )
        return when (remote) {
            is AppResult.Success -> {
                val obj = (remote.value as? JsonArray)?.firstOrNull() as? JsonObject
                    ?: return AppResult.Error(AppError.NotFound)
                val drama = parseDrama(obj)
                dramaDao.upsertAll(listOf(drama.toCache()))
                AppResult.Success(mergeFollow(drama))
            }
            is AppResult.Error -> cachedDrama(dramaId, remote)
        }
    }

    private suspend fun cachedDrama(dramaId: String, fallback: AppResult.Error): AppResult<Drama> {
        val cached = dramaDao.getById(dramaId) ?: return fallback
        return AppResult.Success(mergeFollow(cached.toDomain()))
    }

    private suspend fun mergeFollow(drama: Drama): Drama {
        val uid = myId() ?: return drama
        val res = client.restGet(
            "follows",
            mapOf("user_id" to "eq.$uid", "drama_id" to "eq.${drama.id}", "select" to "id"),
        )
        val followed = (res.valueOrNull() as? JsonArray)?.isNotEmpty() == true
        return drama.copy(isFollowed = followed)
    }

    override suspend fun getEpisodes(dramaId: String): AppResult<List<Episode>> {
        val remote = client.restGet(
            "episodes",
            mapOf("select" to "*", "drama_id" to "eq.$dramaId", "order" to "number.asc"),
        )
        return when (remote) {
            is AppResult.Success -> {
                val episodes = (remote.value as? JsonArray)?.mapObjects { parseEpisode(it) } ?: emptyList()
                if (episodes.isNotEmpty()) episodeDao.upsertAll(episodes.map { it.toCache() })
                AppResult.Success(mergeWatched(episodes))
            }
            is AppResult.Error -> {
                val cached = episodeDao.getByDrama(dramaId)
                if (cached.isNotEmpty()) AppResult.Success(cached.map { it.toDomain() })
                else remote
            }
        }
    }

    override suspend fun getEpisode(dramaId: String, number: Int): AppResult<Episode> {
        val remote = client.restGet(
            "episodes",
            mapOf("select" to "*", "drama_id" to "eq.$dramaId", "number" to "eq.$number"),
        )
        return when (remote) {
            is AppResult.Success -> {
                val obj = (remote.value as? JsonArray)?.firstOrNull() as? JsonObject
                    ?: return AppResult.Error(AppError.NotFound)
                AppResult.Success(parseEpisode(obj))
            }
            is AppResult.Error -> {
                val cached = episodeDao.getOne(dramaId, number) ?: return remote
                AppResult.Success(cached.toDomain())
            }
        }
    }

    override suspend fun getCast(dramaId: String): AppResult<List<Actor>> {
        val remote = client.restGet(
            "drama_cast",
            mapOf(
                "select" to "actor:actors(*)",
                "drama_id" to "eq.$dramaId",
                "order" to "position.asc",
            ),
        )
        return when (remote) {
            is AppResult.Error -> remote
            is AppResult.Success -> {
                val actors = (remote.value as? JsonArray)
                    ?.mapNotNull { (it as? JsonObject)?.objectOrNull("actor") }
                    ?.map { parseActor(it) }
                    ?: emptyList()
                AppResult.Success(actors)
            }
        }
    }

    override suspend fun followDrama(dramaId: String, follow: Boolean): AppResult<Boolean> {
        val uid = myId() ?: return AppResult.Error(AppError.Unauthorized)
        return if (follow) {
            client.restPost(
                "follows",
                buildJsonObject { put("user_id", uid); put("drama_id", dramaId) },
            ).map { true }
        } else {
            client.restDelete("follows", mapOf("user_id" to "eq.$uid", "drama_id" to "eq.$dramaId")).map { false }
        }
    }

    override suspend fun getActor(actorId: String): AppResult<Actor> = when (
        val res = client.restGet("actors", mapOf("select" to "*", "id" to "eq.$actorId"))
    ) {
        is AppResult.Error -> res
        is AppResult.Success -> {
            val obj = (res.value as? JsonArray)?.firstOrNull() as? JsonObject
                ?: return AppResult.Error(AppError.NotFound)
            AppResult.Success(parseActor(obj))
        }
    }

    override suspend fun getActors(): AppResult<List<Actor>> = when (
        val res = client.restGet("actors", mapOf("select" to "*", "order" to "name.asc", "limit" to "30"))
    ) {
        is AppResult.Error -> res
        is AppResult.Success -> AppResult.Success(
            (res.value as? JsonArray)?.mapObjects { parseActor(it) } ?: emptyList(),
        )
    }

    override suspend fun followActor(actorId: String, follow: Boolean): AppResult<Boolean> {
        val uid = myId() ?: return AppResult.Error(AppError.Unauthorized)
        return if (follow) {
            client.restPost(
                "follows",
                buildJsonObject { put("user_id", uid); put("actor_id", actorId) },
            ).map { true }
        } else {
            client.restDelete("follows", mapOf("user_id" to "eq.$uid", "actor_id" to "eq.$actorId")).map { false }
        }
    }

    override suspend fun getCurrentlyWatching(): AppResult<List<Drama>> {
        val uid = myId() ?: return AppResult.Success(emptyList())
        val res = client.restGet(
            "watching_status",
            mapOf(
                "select" to "watched_through_episode,status,drama:dramas(*)",
                "user_id" to "eq.$uid",
                "order" to "updated_at.desc",
            ),
        )
        return when (res) {
            is AppResult.Error -> res
            is AppResult.Success -> {
                val dramas = (res.value as? JsonArray)
                    ?.mapNotNull { (it as? JsonObject)?.objectOrNull("drama") }
                    ?.map { parseDrama(it) }
                    ?: emptyList()
                AppResult.Success(dramas)
            }
        }
    }

    override suspend fun getMyWatchProgress(): AppResult<List<WatchingStatus>> {
        val uid = myId() ?: return AppResult.Success(emptyList())
        return when (val res = client.restGet(
            "watching_status",
            mapOf("select" to "*", "user_id" to "eq.$uid"),
        )) {
            is AppResult.Error -> res
            is AppResult.Success -> AppResult.Success(
                (res.value as? JsonArray)
                    ?.mapNotNull { it as? JsonObject }
                    ?.map { WatchingStatus(
                        dramaId = it.stringOrEmpty("drama_id"),
                        status = it.stringOrEmpty("status"),
                        watchedThroughEpisode = it.intOrZero("watched_through_episode"),
                        updatedAt = it.stringOrEmpty("updated_at"),
                    ) }
                    ?: emptyList(),
            )
        }
    }

    override suspend fun updateWatchProgress(
        dramaId: String,
        watchedThroughEpisode: Int,
        status: String,
    ): AppResult<WatchingStatus> {
        val uid = myId() ?: return AppResult.Error(AppError.Unauthorized)
        val entity = WatchProgressEntity(
            dramaId = dramaId,
            status = status,
            watchedThroughEpisode = watchedThroughEpisode,
            updatedAt = java.time.Instant.now().toString(),
        )
        watchDao.upsert(entity)

        val existing = client.restGet(
            "watching_status",
            mapOf("user_id" to "eq.$uid", "drama_id" to "eq.$dramaId", "select" to "drama_id"),
        )
        val body = buildJsonObject {
            put("user_id", uid)
            put("drama_id", dramaId)
            put("watched_through_episode", watchedThroughEpisode)
            put("status", status)
        }
        return when (existing) {
            is AppResult.Error -> existing
            is AppResult.Success -> {
                val present = (existing.value as? JsonArray)?.isNotEmpty() == true
                if (present) {
                    client.restPatch(
                        "watching_status",
                        mapOf("user_id" to "eq.$uid", "drama_id" to "eq.$dramaId"),
                        body,
                    ).map { entity.toDomain() }
                } else {
                    client.restPost("watching_status", body).map { entity.toDomain() }
                }
            }
        }
    }

    override suspend fun getEpisodeDiscussion(dramaId: String, episodeNumber: Int): AppResult<List<Post>> {
        val res = client.restGet(
            "posts",
            mapOf(
                "select" to "*,author:profiles(id,username,display_name,avatar_url,is_verified,is_official),drama:dramas(title)",
                "drama_id" to "eq.$dramaId",
                "episode_number" to "eq.$episodeNumber",
                "order" to "created_at.desc",
            ),
        )
        return when (res) {
            is AppResult.Error -> res
            is AppResult.Success -> {
                val posts = (res.value as? JsonArray)
                    ?.mapObjects { parsePost(it) }
                    ?: emptyList()
                AppResult.Success(posts)
            }
        }
    }

    override suspend fun getAiring(): AppResult<List<Drama>> {
        val res = client.restGet("dramas", mapOf("select" to "*", "status" to "eq.AIRING", "order" to "title.asc", "limit" to "20"))
        return dramasFromRemote(res, dramaDao.getAiring())
    }

    override suspend fun getUpcoming(): AppResult<List<Drama>> {
        val res = client.restGet("dramas", mapOf("select" to "*", "status" to "eq.UPCOMING", "order" to "title.asc", "limit" to "20"))
        return dramasFromRemote(res, dramaDao.getUpcoming())
    }

    private suspend fun dramasFromRemote(res: AppResult<kotlinx.serialization.json.JsonElement>, fallback: List<com.hallyu.data.cache.CachedDrama>): AppResult<List<Drama>> =
        when (res) {
            is AppResult.Error -> if (fallback.isNotEmpty()) AppResult.Success(fallback.map { it.toDomain() }) else res
            is AppResult.Success -> {
                val dramas = (res.value as? JsonArray)?.mapObjects { parseDrama(it) } ?: emptyList()
                if (dramas.isNotEmpty()) dramaDao.upsertAll(dramas.map { it.toCache() })
                AppResult.Success(dramas)
            }
        }

    private suspend fun mergeWatched(episodes: List<Episode>): List<Episode> {
        val uid = myId() ?: return episodes
        val res = client.restGet(
            "watched_episodes",
            mapOf("user_id" to "eq.$uid", "select" to "episode_id"),
        )
        val watchedIds = (res.valueOrNull() as? JsonArray)
            ?.mapNotNull { (it as? JsonObject)?.stringOrNull("episode_id") }
            ?.toSet()
            ?: emptySet()
        return episodes.map { it.copy(watched = it.id in watchedIds) }
    }
}

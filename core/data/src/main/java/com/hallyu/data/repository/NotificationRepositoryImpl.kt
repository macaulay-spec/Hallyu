package com.hallyu.data.repository

import com.hallyu.common.AppError
import com.hallyu.common.AppResult
import com.hallyu.data.remote.JsonParsing.mapObjects
import com.hallyu.data.remote.Parsers.parseNotification
import com.hallyu.data.remote.SupabaseRestClient
import com.hallyu.data.session.SessionStore
import com.hallyu.domain.model.AppNotification
import com.hallyu.domain.repository.NotificationRepository
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

@Singleton
class NotificationRepositoryImpl @Inject constructor(
    private val client: SupabaseRestClient,
    private val store: SessionStore,
) : NotificationRepository {

    override suspend fun getNotifications(): AppResult<List<AppNotification>> {
        val uid = store.session.firstOrNull()?.userId ?: return AppResult.Success(emptyList())
        return when (val res = client.restGet(
            "notifications",
            mapOf(
                "select" to "*,actor:profiles(id,username,display_name,avatar_url,is_verified,is_official)",
                "user_id" to "eq.$uid",
                "order" to "created_at.desc",
                "limit" to "50",
            ),
        )) {
            is AppResult.Error -> res
            is AppResult.Success -> AppResult.Success(
                (res.value as? JsonArray)?.mapObjects { parseNotification(it) } ?: emptyList(),
            )
        }
    }

    override suspend fun markRead(notificationId: String): AppResult<Boolean> {
        val uid = store.session.firstOrNull()?.userId ?: return AppResult.Error(AppError.Unauthorized)
        return client.restPatch(
            "notifications",
            mapOf("id" to "eq.$notificationId", "user_id" to "eq.$uid"),
            buildJsonObject { put("read", true) },
        ).map { true }
    }
}

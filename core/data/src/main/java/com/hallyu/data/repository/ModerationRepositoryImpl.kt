package com.hallyu.data.repository

import com.hallyu.common.AppError
import com.hallyu.common.AppResult
import com.hallyu.common.map
import com.hallyu.common.valueOrNull
import com.hallyu.data.remote.mapObjects
import com.hallyu.data.remote.stringOrEmpty
import com.hallyu.data.remote.SupabaseRestClient
import com.hallyu.data.session.SessionStore
import com.hallyu.domain.model.Report
import com.hallyu.domain.model.ReportReason
import com.hallyu.domain.model.ReportStatus
import com.hallyu.domain.repository.ModerationRepository
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

@Singleton
class ModerationRepositoryImpl @Inject constructor(
    private val client: SupabaseRestClient,
    private val store: SessionStore,
) : ModerationRepository {

    override suspend fun getOpenReports(): AppResult<List<Report>> = when (
        val res = client.restGet(
            "reports",
            mapOf("select" to "*", "status" to "eq.OPEN", "order" to "created_at.asc", "limit" to "50"),
        )
    ) {
        is AppResult.Error -> res
        is AppResult.Success -> AppResult.Success(
            (res.value as? JsonArray)?.mapObjects { parseReport(it) } ?: emptyList(),
        )
    }

    override suspend fun resolveReport(reportId: String, action: String): AppResult<Boolean> =
        client.restPatch(
            "reports",
            mapOf("id" to "eq.$reportId"),
            buildJsonObject { put("status", action) },
        ).map { true }

    override suspend fun blockUser(userId: String): AppResult<Boolean> {
        val uid = store.session.firstOrNull()?.userId ?: return AppResult.Error(AppError.Unauthorized)
        return client.restPost(
            "blocks",
            buildJsonObject { put("user_id", uid); put("blocked_user_id", userId) },
        ).map { true }
    }

    override suspend fun muteUser(userId: String): AppResult<Boolean> {
        val uid = store.session.firstOrNull()?.userId ?: return AppResult.Error(AppError.Unauthorized)
        return client.restPost(
            "mutes",
            buildJsonObject { put("user_id", uid); put("muted_user_id", userId) },
        ).map { true }
    }

    private fun parseReport(obj: JsonObject): Report = Report(
        id = obj.stringOrEmpty("id"),
        targetType = obj.stringOrEmpty("target_type"),
        targetId = obj.stringOrEmpty("target_id"),
        reporterId = obj.stringOrEmpty("reporter_id"),
        reason = obj.stringOrEmpty("reason").let {
            runCatching { ReportReason.valueOf(it) }.getOrDefault(ReportReason.OTHER)
        },
        note = obj.stringOrEmpty("note"),
        status = obj.stringOrEmpty("status").let {
            runCatching { ReportStatus.valueOf(it) }.getOrDefault(ReportStatus.OPEN)
        },
        createdAt = obj.stringOrEmpty("created_at"),
        preview = obj.stringOrEmpty("preview"),
    )
}

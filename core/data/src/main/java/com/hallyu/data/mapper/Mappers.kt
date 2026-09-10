package com.hallyu.data.mapper

import com.hallyu.data.cache.CachedDrama
import com.hallyu.data.cache.CachedEpisode
import com.hallyu.data.cache.WatchProgressEntity
import com.hallyu.domain.model.Drama
import com.hallyu.domain.model.DramaStatus
import com.hallyu.domain.model.Episode
import com.hallyu.domain.model.WatchingStatus

fun CachedDrama.toDomain(isFollowed: Boolean = false, watchingStatus: String? = null): Drama = Drama(
    id = id,
    title = title,
    koreanTitle = koreanTitle,
    synopsis = synopsis,
    posterUrl = posterUrl,
    backdropUrl = backdropUrl,
    status = runCatching { DramaStatus.valueOf(status) }.getOrDefault(DramaStatus.AIRING),
    year = year,
    genres = runCatching { genres.split(",").filter { it.isNotBlank() } }.getOrDefault(emptyList()),
    airsOn = airsOn,
    network = network,
    episodeCount = episodeCount,
    isFollowed = isFollowed,
    watchingStatus = watchingStatus,
)

fun Drama.toCache(): CachedDrama = CachedDrama(
    id = id,
    title = title,
    koreanTitle = koreanTitle,
    synopsis = synopsis,
    posterUrl = posterUrl,
    backdropUrl = backdropUrl,
    status = status.name,
    year = year,
    genres = genres.joinToString(","),
    airsOn = airsOn,
    network = network,
    episodeCount = episodeCount,
)

fun CachedEpisode.toDomain(watched: Boolean = false, discussionCount: Int = 0): Episode = Episode(
    id = id,
    dramaId = dramaId,
    number = number,
    title = title,
    synopsis = synopsis,
    airDate = airDate,
    thumbnailUrl = thumbnailUrl,
    discussionCount = discussionCount,
    watched = watched,
)

fun Episode.toCache(): CachedEpisode = CachedEpisode(
    id = id,
    dramaId = dramaId,
    number = number,
    title = title,
    synopsis = synopsis,
    airDate = airDate,
    thumbnailUrl = thumbnailUrl,
)

fun WatchProgressEntity.toDomain(): WatchingStatus = WatchingStatus(
    dramaId = dramaId,
    status = status,
    watchedThroughEpisode = watchedThroughEpisode,
    updatedAt = updatedAt,
)

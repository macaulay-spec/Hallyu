package com.hallyu.data.cache

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "cached_dramas")
data class CachedDrama(
    @PrimaryKey val id: String,
    val title: String,
    val koreanTitle: String?,
    val synopsis: String,
    val posterUrl: String?,
    val backdropUrl: String?,
    val status: String,
    val year: Int,
    val genres: String,
    val airsOn: String?,
    val network: String?,
    val episodeCount: Int,
)

@Entity(tableName = "cached_episodes")
data class CachedEpisode(
    @PrimaryKey val id: String,
    val dramaId: String,
    val number: Int,
    val title: String?,
    val synopsis: String,
    val airDate: String?,
    val thumbnailUrl: String?,
)

@Entity(tableName = "watch_progress")
data class WatchProgressEntity(
    @PrimaryKey val dramaId: String,
    val status: String,
    val watchedThroughEpisode: Int,
    val updatedAt: String,
)

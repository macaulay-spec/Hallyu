package com.hallyu.data.cache

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface DramaDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(dramas: List<CachedDrama>)

    @Query("SELECT * FROM cached_dramas WHERE id = :id")
    suspend fun getById(id: String): CachedDrama?

    @Query("SELECT * FROM cached_dramas ORDER BY title")
    suspend fun getAll(): List<CachedDrama>

    @Query("SELECT * FROM cached_dramas WHERE status = 'AIRING' ORDER BY title")
    suspend fun getAiring(): List<CachedDrama>

    @Query("SELECT * FROM cached_dramas WHERE status = 'UPCOMING' ORDER BY title")
    suspend fun getUpcoming(): List<CachedDrama>

    @Query("DELETE FROM cached_dramas")
    suspend fun clear()
}

@Dao
interface EpisodeDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(episodes: List<CachedEpisode>)

    @Query("SELECT * FROM cached_episodes WHERE dramaId = :dramaId ORDER BY number")
    suspend fun getByDrama(dramaId: String): List<CachedEpisode>

    @Query("SELECT * FROM cached_episodes WHERE dramaId = :dramaId AND number = :number LIMIT 1")
    suspend fun getOne(dramaId: String, number: Int): CachedEpisode?

    @Query("DELETE FROM cached_episodes WHERE dramaId = :dramaId")
    suspend fun clearForDrama(dramaId: String)
}

@Dao
interface WatchDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(progress: WatchProgressEntity)

    @Query("SELECT * FROM watch_progress WHERE dramaId = :dramaId LIMIT 1")
    suspend fun getById(dramaId: String): WatchProgressEntity?

    @Query("SELECT * FROM watch_progress ORDER BY updatedAt DESC")
    fun observeAll(): Flow<List<WatchProgressEntity>>

    @Query("SELECT * FROM watch_progress ORDER BY updatedAt DESC")
    suspend fun getAll(): List<WatchProgressEntity>
}

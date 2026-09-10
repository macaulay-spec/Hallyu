package com.hallyu.data.cache

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [CachedDrama::class, CachedEpisode::class, WatchProgressEntity::class],
    version = 1,
    exportSchema = false,
)
abstract class HallyuDatabase : RoomDatabase() {
    abstract fun dramaDao(): DramaDao
    abstract fun episodeDao(): EpisodeDao
    abstract fun watchDao(): WatchDao

    companion object {
        @Volatile
        private var instance: HallyuDatabase? = null

        fun getInstance(context: Context): HallyuDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    HallyuDatabase::class.java,
                    "hallyu.db",
                ).fallbackToDestructiveMigration().build().also { instance = it }
            }
    }
}

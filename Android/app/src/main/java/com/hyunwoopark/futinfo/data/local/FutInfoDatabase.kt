package com.hyunwoopark.futinfo.data.local

import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import android.content.Context
import com.hyunwoopark.futinfo.data.local.entity.LeagueEntity
import com.hyunwoopark.futinfo.data.local.entity.StandingEntity
import com.hyunwoopark.futinfo.data.local.entity.FixtureEntity
import com.hyunwoopark.futinfo.data.local.entity.TeamProfileEntity
import com.hyunwoopark.futinfo.data.local.entity.FavoriteEntity
import com.hyunwoopark.futinfo.data.local.dao.LeagueDao
import com.hyunwoopark.futinfo.data.local.dao.StandingDao
import com.hyunwoopark.futinfo.data.local.dao.FixtureDao
import com.hyunwoopark.futinfo.data.local.dao.TeamProfileDao
import com.hyunwoopark.futinfo.data.local.dao.FavoriteDao

/**
 * FutInfo 앱의 Room 데이터베이스
 *
 * 이 데이터베이스는 다음과 같은 엔티티들을 포함합니다:
 * - LeagueEntity: 리그 정보 캐싱
 * - StandingEntity: 순위표 정보 캐싱
 * - FixtureEntity: 경기 일정 정보 캐싱
 * - TeamProfileEntity: 팀 프로필 정보 캐싱
 * - FavoriteEntity: 즐겨찾기 정보 저장
 *
 * 캐싱 전략:
 * - 리그 정보: 24시간 캐시 유지
 * - 순위표 정보: 1시간 캐시 유지
 * - 경기 일정: 1시간 캐시 유지
 * - 팀 프로필: 24시간 캐시 유지
 * - 오프라인 상황에서도 최근 데이터 제공
 */
@Database(
    entities = [
        LeagueEntity::class,
        StandingEntity::class,
        FixtureEntity::class,
        TeamProfileEntity::class,
        FavoriteEntity::class
    ],
    version = 4,
    exportSchema = false
)
abstract class FutInfoDatabase : RoomDatabase() {
    
    /**
     * League 데이터에 접근하기 위한 DAO
     */
    abstract fun leagueDao(): LeagueDao
    
    /**
     * Standing 데이터에 접근하기 위한 DAO
     */
    abstract fun standingDao(): StandingDao
    
    /**
     * Fixture 데이터에 접근하기 위한 DAO
     */
    abstract fun fixtureDao(): FixtureDao
    
    /**
     * TeamProfile 데이터에 접근하기 위한 DAO
     */
    abstract fun teamProfileDao(): TeamProfileDao
    
    /**
     * Favorite 데이터에 접근하기 위한 DAO
     */
    abstract fun favoriteDao(): FavoriteDao
    
    companion object {
        /**
         * 데이터베이스 이름
         */
        const val DATABASE_NAME = "futinfo_database"
        
        /**
         * 캐시 유효 시간 상수들 (밀리초)
         */
        object CacheTimeout {
            const val LEAGUES = 24 * 60 * 60 * 1000L // 24시간
            const val STANDINGS = 60 * 60 * 1000L // 1시간
            const val FIXTURES = 60 * 60 * 1000L // 1시간
            const val TEAM_PROFILES = 24 * 60 * 60 * 1000L // 24시간
            const val DEFAULT = 30 * 60 * 1000L // 30분
        }
        
        /**
         * 데이터베이스 인스턴스 (Singleton)
         * Hilt를 통해 주입되므로 직접 사용하지 않습니다.
         */
        @Volatile
        private var INSTANCE: FutInfoDatabase? = null
        
        /**
         * 데이터베이스 인스턴스를 가져옵니다.
         * 일반적으로 Hilt를 통해 주입받아 사용하므로 이 메서드는 테스트 용도로만 사용됩니다.
         * 
         * @param context 애플리케이션 컨텍스트
         * @return FutInfoDatabase 인스턴스
         */
        fun getDatabase(context: Context): FutInfoDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    FutInfoDatabase::class.java,
                    DATABASE_NAME
                )
                    .addMigrations(MIGRATION_2_3, MIGRATION_3_4)
                    .fallbackToDestructiveMigration() // 개발 단계에서만 사용
                    .build()
                INSTANCE = instance
                instance
            }
        }
        
        /**
         * 데이터베이스 버전 2에서 3으로의 마이그레이션
         * FixtureEntity에 leagueLogoUrl 필드 추가
         */
        private val MIGRATION_2_3 = object : Migration(2, 3) {
            override fun migrate(database: SupportSQLiteDatabase) {
                // FixtureEntity 테이블에 leagueLogoUrl 컬럼 추가
                database.execSQL(
                    "ALTER TABLE fixtures ADD COLUMN leagueLogoUrl TEXT NOT NULL DEFAULT ''"
                )
                
                // 기존 데이터의 leagueLogoUrl을 leagueLogo 값으로 업데이트
                database.execSQL(
                    "UPDATE fixtures SET leagueLogoUrl = leagueLogo"
                )
            }
        }
        
        /**
         * 데이터베이스 버전 3에서 4로의 마이그레이션
         * FavoriteEntity 테이블 추가
         */
        private val MIGRATION_3_4 = object : Migration(3, 4) {
            override fun migrate(database: SupportSQLiteDatabase) {
                // favorites 테이블 생성
                database.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS `favorites` (
                        `id` TEXT NOT NULL,
                        `type` TEXT NOT NULL,
                        `itemId` INTEGER NOT NULL,
                        `name` TEXT NOT NULL,
                        `imageUrl` TEXT,
                        `addedAt` INTEGER NOT NULL,
                        `additionalInfo` TEXT,
                        PRIMARY KEY(`id`)
                    )
                    """.trimIndent()
                )
            }
        }
        
        /**
         * 캐시가 유효한지 확인하는 헬퍼 함수
         * 
         * @param lastUpdated 마지막 업데이트 시간 (밀리초)
         * @param cacheTimeout 캐시 유효 시간 (밀리초)
         * @return 캐시가 유효하면 true, 그렇지 않으면 false
         */
        fun isCacheValid(lastUpdated: Long, cacheTimeout: Long): Boolean {
            return System.currentTimeMillis() - lastUpdated < cacheTimeout
        }
        
        /**
         * 캐시 만료 시간을 계산하는 헬퍼 함수
         * 
         * @param cacheTimeout 캐시 유효 시간 (밀리초)
         * @return 캐시 만료 기준 시간 (밀리초)
         */
        fun getCacheExpiryTime(cacheTimeout: Long): Long {
            return System.currentTimeMillis() - cacheTimeout
        }
    }
}

/**
 * 캐시 상태를 나타내는 열거형
 */
enum class CacheStatus {
    VALID,      // 캐시가 유효함
    EXPIRED,    // 캐시가 만료됨
    EMPTY       // 캐시가 비어있음
}

/**
 * 캐시 정보를 담는 데이터 클래스
 */
data class CacheInfo(
    val status: CacheStatus,
    val lastUpdated: Long,
    val itemCount: Int
)
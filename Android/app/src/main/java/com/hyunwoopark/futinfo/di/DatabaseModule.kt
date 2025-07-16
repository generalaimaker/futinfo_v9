package com.hyunwoopark.futinfo.di

import android.content.Context
import androidx.room.Room
import com.hyunwoopark.futinfo.data.local.FutInfoDatabase
import com.hyunwoopark.futinfo.data.local.dao.LeagueDao
import com.hyunwoopark.futinfo.data.local.dao.StandingDao
import com.hyunwoopark.futinfo.data.local.dao.FixtureDao
import com.hyunwoopark.futinfo.data.local.dao.TeamProfileDao
import com.hyunwoopark.futinfo.data.local.dao.FavoriteDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Room 데이터베이스 관련 의존성 주입을 위한 Hilt 모듈
 *
 * 이 모듈은 다음과 같은 의존성들을 제공합니다:
 * - FutInfoDatabase: Room 데이터베이스 인스턴스
 * - LeagueDao: 리그 데이터 접근 객체
 * - StandingDao: 순위표 데이터 접근 객체
 * - FixtureDao: 경기 일정 데이터 접근 객체
 * - TeamProfileDao: 팀 프로필 데이터 접근 객체
 * - FavoriteDao: 즐겨찾기 데이터 접근 객체
 */
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    
    /**
     * Room 데이터베이스 인스턴스를 제공합니다.
     * 
     * @param context 애플리케이션 컨텍스트
     * @return FutInfoDatabase 인스턴스
     */
    @Provides
    @Singleton
    fun provideFutInfoDatabase(
        @ApplicationContext context: Context
    ): FutInfoDatabase {
        return Room.databaseBuilder(
            context.applicationContext,
            FutInfoDatabase::class.java,
            FutInfoDatabase.DATABASE_NAME
        )
            .fallbackToDestructiveMigration() // 개발 단계에서만 사용
            .build()
    }
    
    /**
     * LeagueDao를 제공합니다.
     * 
     * @param database FutInfoDatabase 인스턴스
     * @return LeagueDao 인스턴스
     */
    @Provides
    fun provideLeagueDao(database: FutInfoDatabase): LeagueDao {
        return database.leagueDao()
    }
    
    /**
     * StandingDao를 제공합니다.
     * 
     * @param database FutInfoDatabase 인스턴스
     * @return StandingDao 인스턴스
     */
    @Provides
    fun provideStandingDao(database: FutInfoDatabase): StandingDao {
        return database.standingDao()
    }
    
    /**
     * FixtureDao를 제공합니다.
     *
     * @param database FutInfoDatabase 인스턴스
     * @return FixtureDao 인스턴스
     */
    @Provides
    fun provideFixtureDao(database: FutInfoDatabase): FixtureDao {
        return database.fixtureDao()
    }
    
    /**
     * TeamProfileDao를 제공합니다.
     *
     * @param database FutInfoDatabase 인스턴스
     * @return TeamProfileDao 인스턴스
     */
    @Provides
    fun provideTeamProfileDao(database: FutInfoDatabase): TeamProfileDao {
        return database.teamProfileDao()
    }
    
    /**
     * FavoriteDao를 제공합니다.
     *
     * @param database FutInfoDatabase 인스턴스
     * @return FavoriteDao 인스턴스
     */
    @Provides
    fun provideFavoriteDao(database: FutInfoDatabase): FavoriteDao {
        return database.favoriteDao()
    }
}
package com.hyunwoopark.futinfo.data.local.dao

import androidx.room.*
import com.hyunwoopark.futinfo.data.local.entity.FixtureEntity
import kotlinx.coroutines.flow.Flow

/**
 * Fixture 데이터에 대한 Room DAO
 * 경기 일정 정보의 CRUD 작업을 담당합니다.
 */
@Dao
interface FixtureDao {
    
    /**
     * 모든 경기를 조회합니다.
     * @return 모든 경기 목록의 Flow
     */
    @Query("SELECT * FROM fixtures ORDER BY date ASC")
    fun getAllFixtures(): Flow<List<FixtureEntity>>
    
    /**
     * 모든 경기를 조회합니다 (일회성).
     * @return 모든 경기 목록
     */
    @Query("SELECT * FROM fixtures ORDER BY date ASC")
    suspend fun getAllFixturesOnce(): List<FixtureEntity>
    
    /**
     * 특정 ID의 경기를 조회합니다.
     * @param id 경기 ID
     * @return 해당 경기 정보
     */
    @Query("SELECT * FROM fixtures WHERE id = :id")
    suspend fun getFixtureById(id: Int): FixtureEntity?
    
    /**
     * 특정 리그의 경기들을 조회합니다.
     * @param leagueId 리그 ID
     * @return 해당 리그의 경기 목록
     */
    @Query("SELECT * FROM fixtures WHERE leagueId = :leagueId ORDER BY date ASC")
    suspend fun getFixturesByLeague(leagueId: Int): List<FixtureEntity>
    
    /**
     * 특정 리그의 경기들을 조회합니다 (Flow).
     * @param leagueId 리그 ID
     * @return 해당 리그의 경기 목록의 Flow
     */
    @Query("SELECT * FROM fixtures WHERE leagueId = :leagueId ORDER BY date ASC")
    fun getFixturesByLeagueFlow(leagueId: Int): Flow<List<FixtureEntity>>
    
    /**
     * 특정 팀의 경기들을 조회합니다.
     * @param teamId 팀 ID
     * @return 해당 팀의 경기 목록
     */
    @Query("SELECT * FROM fixtures WHERE homeTeamId = :teamId OR awayTeamId = :teamId ORDER BY date ASC")
    suspend fun getFixturesByTeam(teamId: Int): List<FixtureEntity>
    
    /**
     * 특정 날짜 범위의 경기들을 조회합니다.
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 해당 날짜 범위의 경기 목록
     */
    @Query("SELECT * FROM fixtures WHERE date BETWEEN :startDate AND :endDate ORDER BY date ASC")
    suspend fun getFixturesByDateRange(startDate: String, endDate: String): List<FixtureEntity>
    
    /**
     * 특정 시즌의 경기들을 조회합니다.
     * @param season 시즌
     * @return 해당 시즌의 경기 목록
     */
    @Query("SELECT * FROM fixtures WHERE season = :season ORDER BY date ASC")
    suspend fun getFixturesBySeason(season: Int): List<FixtureEntity>
    
    /**
     * 특정 라운드의 경기들을 조회합니다.
     * @param round 라운드
     * @return 해당 라운드의 경기 목록
     */
    @Query("SELECT * FROM fixtures WHERE round = :round ORDER BY date ASC")
    suspend fun getFixturesByRound(round: String): List<FixtureEntity>
    
    /**
     * 특정 상태의 경기들을 조회합니다.
     * @param status 경기 상태
     * @return 해당 상태의 경기 목록
     */
    @Query("SELECT * FROM fixtures WHERE statusShort = :status ORDER BY date ASC")
    suspend fun getFixturesByStatus(status: String): List<FixtureEntity>
    
    /**
     * 특정 시간 이후에 업데이트된 경기들을 조회합니다.
     * @param timestamp 기준 시간 (밀리초)
     * @return 해당 시간 이후 업데이트된 경기 목록
     */
    @Query("SELECT * FROM fixtures WHERE lastUpdated > :timestamp ORDER BY date ASC")
    suspend fun getFixturesUpdatedAfter(timestamp: Long): List<FixtureEntity>
    
    /**
     * 캐시된 데이터가 유효한지 확인합니다.
     * @param maxAge 최대 캐시 유지 시간 (밀리초)
     * @return 유효한 캐시 데이터 개수
     */
    @Query("SELECT COUNT(*) FROM fixtures WHERE lastUpdated > :maxAge")
    suspend fun getValidCacheCount(maxAge: Long): Int
    
    /**
     * 특정 리그와 날짜 범위의 캐시된 경기 개수를 확인합니다.
     * @param leagueId 리그 ID
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @param maxAge 최대 캐시 유지 시간 (밀리초)
     * @return 유효한 캐시 데이터 개수
     */
    @Query("SELECT COUNT(*) FROM fixtures WHERE leagueId = :leagueId AND date BETWEEN :startDate AND :endDate AND lastUpdated > :maxAge")
    suspend fun getValidCacheCountByLeagueAndDate(leagueId: Int, startDate: String, endDate: String, maxAge: Long): Int
    
    /**
     * 경기를 삽입합니다. 이미 존재하면 교체합니다.
     * @param fixture 삽입할 경기 정보
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFixture(fixture: FixtureEntity)
    
    /**
     * 여러 경기를 삽입합니다. 이미 존재하면 교체합니다.
     * @param fixtures 삽입할 경기 목록
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFixtures(fixtures: List<FixtureEntity>)
    
    /**
     * 경기 정보를 업데이트합니다.
     * @param fixture 업데이트할 경기 정보
     */
    @Update
    suspend fun updateFixture(fixture: FixtureEntity)
    
    /**
     * 특정 경기를 삭제합니다.
     * @param fixture 삭제할 경기 정보
     */
    @Delete
    suspend fun deleteFixture(fixture: FixtureEntity)
    
    /**
     * 특정 ID의 경기를 삭제합니다.
     * @param id 삭제할 경기 ID
     */
    @Query("DELETE FROM fixtures WHERE id = :id")
    suspend fun deleteFixtureById(id: Int)
    
    /**
     * 특정 리그의 모든 경기를 삭제합니다.
     * @param leagueId 리그 ID
     */
    @Query("DELETE FROM fixtures WHERE leagueId = :leagueId")
    suspend fun deleteFixturesByLeague(leagueId: Int)
    
    /**
     * 모든 경기를 삭제합니다.
     */
    @Query("DELETE FROM fixtures")
    suspend fun deleteAllFixtures()
    
    /**
     * 오래된 캐시 데이터를 삭제합니다.
     * @param maxAge 최대 캐시 유지 시간 (밀리초)
     */
    @Query("DELETE FROM fixtures WHERE lastUpdated < :maxAge")
    suspend fun deleteOldCache(maxAge: Long)
}
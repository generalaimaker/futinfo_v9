package com.hyunwoopark.futinfo.data.local.dao

import androidx.room.*
import com.hyunwoopark.futinfo.data.local.entity.StandingEntity
import kotlinx.coroutines.flow.Flow

/**
 * Standing 데이터에 대한 Room DAO
 * 순위표 정보의 CRUD 작업을 담당합니다.
 */
@Dao
interface StandingDao {
    
    /**
     * 특정 리그와 시즌의 순위표를 조회합니다.
     * @param leagueId 리그 ID
     * @param season 시즌
     * @return 순위표 목록의 Flow (순위 순으로 정렬)
     */
    @Query("SELECT * FROM standings WHERE leagueId = :leagueId AND season = :season ORDER BY rank ASC")
    fun getStandings(leagueId: Int, season: Int): Flow<List<StandingEntity>>
    
    /**
     * 특정 리그와 시즌의 순위표를 조회합니다 (일회성).
     * @param leagueId 리그 ID
     * @param season 시즌
     * @return 순위표 목록 (순위 순으로 정렬)
     */
    @Query("SELECT * FROM standings WHERE leagueId = :leagueId AND season = :season ORDER BY rank ASC")
    suspend fun getStandingsOnce(leagueId: Int, season: Int): List<StandingEntity>
    
    /**
     * 특정 팀의 순위 정보를 조회합니다.
     * @param leagueId 리그 ID
     * @param season 시즌
     * @param teamId 팀 ID
     * @return 해당 팀의 순위 정보
     */
    @Query("SELECT * FROM standings WHERE leagueId = :leagueId AND season = :season AND teamId = :teamId")
    suspend fun getTeamStanding(leagueId: Int, season: Int, teamId: Int): StandingEntity?
    
    /**
     * 특정 팀의 모든 시즌 순위 정보를 조회합니다.
     * @param teamId 팀 ID
     * @return 해당 팀의 모든 시즌 순위 정보
     */
    @Query("SELECT * FROM standings WHERE teamId = :teamId ORDER BY season DESC, rank ASC")
    suspend fun getTeamStandingsHistory(teamId: Int): List<StandingEntity>
    
    /**
     * 특정 리그의 상위 N개 팀을 조회합니다.
     * @param leagueId 리그 ID
     * @param season 시즌
     * @param limit 조회할 팀 수
     * @return 상위 N개 팀의 순위 정보
     */
    @Query("SELECT * FROM standings WHERE leagueId = :leagueId AND season = :season ORDER BY rank ASC LIMIT :limit")
    suspend fun getTopTeams(leagueId: Int, season: Int, limit: Int): List<StandingEntity>
    
    /**
     * 특정 리그의 하위 N개 팀을 조회합니다.
     * @param leagueId 리그 ID
     * @param season 시즌
     * @param limit 조회할 팀 수
     * @return 하위 N개 팀의 순위 정보
     */
    @Query("SELECT * FROM standings WHERE leagueId = :leagueId AND season = :season ORDER BY rank DESC LIMIT :limit")
    suspend fun getBottomTeams(leagueId: Int, season: Int, limit: Int): List<StandingEntity>
    
    /**
     * 특정 순위 범위의 팀들을 조회합니다.
     * @param leagueId 리그 ID
     * @param season 시즌
     * @param startRank 시작 순위
     * @param endRank 끝 순위
     * @return 해당 순위 범위의 팀들
     */
    @Query("SELECT * FROM standings WHERE leagueId = :leagueId AND season = :season AND rank BETWEEN :startRank AND :endRank ORDER BY rank ASC")
    suspend fun getTeamsByRankRange(leagueId: Int, season: Int, startRank: Int, endRank: Int): List<StandingEntity>
    
    /**
     * 특정 점수 이상의 팀들을 조회합니다.
     * @param leagueId 리그 ID
     * @param season 시즌
     * @param minPoints 최소 점수
     * @return 해당 점수 이상의 팀들
     */
    @Query("SELECT * FROM standings WHERE leagueId = :leagueId AND season = :season AND points >= :minPoints ORDER BY rank ASC")
    suspend fun getTeamsByMinPoints(leagueId: Int, season: Int, minPoints: Int): List<StandingEntity>
    
    /**
     * 특정 시간 이후에 업데이트된 순위표를 조회합니다.
     * @param leagueId 리그 ID
     * @param season 시즌
     * @param timestamp 기준 시간 (밀리초)
     * @return 해당 시간 이후 업데이트된 순위표
     */
    @Query("SELECT * FROM standings WHERE leagueId = :leagueId AND season = :season AND lastUpdated > :timestamp ORDER BY rank ASC")
    suspend fun getStandingsUpdatedAfter(leagueId: Int, season: Int, timestamp: Long): List<StandingEntity>
    
    /**
     * 캐시된 데이터가 유효한지 확인합니다.
     * @param leagueId 리그 ID
     * @param season 시즌
     * @param maxAge 최대 캐시 유지 시간 (밀리초)
     * @return 유효한 캐시 데이터 개수
     */
    @Query("SELECT COUNT(*) FROM standings WHERE leagueId = :leagueId AND season = :season AND lastUpdated > :maxAge")
    suspend fun getValidCacheCount(leagueId: Int, season: Int, maxAge: Long): Int
    
    /**
     * 팀 이름으로 검색합니다.
     * @param leagueId 리그 ID
     * @param season 시즌
     * @param teamName 검색할 팀 이름
     * @return 검색된 팀들의 순위 정보
     */
    @Query("SELECT * FROM standings WHERE leagueId = :leagueId AND season = :season AND teamName LIKE '%' || :teamName || '%' ORDER BY rank ASC")
    suspend fun searchTeamsByName(leagueId: Int, season: Int, teamName: String): List<StandingEntity>
    
    /**
     * 순위표 정보를 삽입합니다. 이미 존재하면 교체합니다.
     * @param standing 삽입할 순위 정보
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertStanding(standing: StandingEntity)
    
    /**
     * 여러 순위표 정보를 삽입합니다. 이미 존재하면 교체합니다.
     * @param standings 삽입할 순위 정보 목록
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertStandings(standings: List<StandingEntity>)
    
    /**
     * 순위표 정보를 업데이트합니다.
     * @param standing 업데이트할 순위 정보
     */
    @Update
    suspend fun updateStanding(standing: StandingEntity)
    
    /**
     * 특정 순위표 정보를 삭제합니다.
     * @param standing 삭제할 순위 정보
     */
    @Delete
    suspend fun deleteStanding(standing: StandingEntity)
    
    /**
     * 특정 리그와 시즌의 모든 순위표를 삭제합니다.
     * @param leagueId 리그 ID
     * @param season 시즌
     */
    @Query("DELETE FROM standings WHERE leagueId = :leagueId AND season = :season")
    suspend fun deleteStandingsByLeagueAndSeason(leagueId: Int, season: Int)
    
    /**
     * 특정 팀의 순위 정보를 삭제합니다.
     * @param leagueId 리그 ID
     * @param season 시즌
     * @param teamId 팀 ID
     */
    @Query("DELETE FROM standings WHERE leagueId = :leagueId AND season = :season AND teamId = :teamId")
    suspend fun deleteTeamStanding(leagueId: Int, season: Int, teamId: Int)
    
    /**
     * 모든 순위표를 삭제합니다.
     */
    @Query("DELETE FROM standings")
    suspend fun deleteAllStandings()
    
    /**
     * 오래된 캐시 데이터를 삭제합니다.
     * @param maxAge 최대 캐시 유지 시간 (밀리초)
     */
    @Query("DELETE FROM standings WHERE lastUpdated < :maxAge")
    suspend fun deleteOldCache(maxAge: Long)
    
    /**
     * 특정 리그의 오래된 캐시 데이터를 삭제합니다.
     * @param leagueId 리그 ID
     * @param maxAge 최대 캐시 유지 시간 (밀리초)
     */
    @Query("DELETE FROM standings WHERE leagueId = :leagueId AND lastUpdated < :maxAge")
    suspend fun deleteOldCacheByLeague(leagueId: Int, maxAge: Long)
}
package com.hyunwoopark.futinfo.data.local.dao

import androidx.room.*
import com.hyunwoopark.futinfo.data.local.entity.LeagueEntity
import kotlinx.coroutines.flow.Flow

/**
 * League 데이터에 대한 Room DAO
 * 리그 정보의 CRUD 작업을 담당합니다.
 */
@Dao
interface LeagueDao {
    
    /**
     * 모든 리그를 조회합니다.
     * @return 모든 리그 목록의 Flow
     */
    @Query("SELECT * FROM leagues ORDER BY name ASC")
    fun getAllLeagues(): Flow<List<LeagueEntity>>
    
    /**
     * 모든 리그를 조회합니다 (일회성).
     * @return 모든 리그 목록
     */
    @Query("SELECT * FROM leagues ORDER BY name ASC")
    suspend fun getAllLeaguesOnce(): List<LeagueEntity>
    
    /**
     * 특정 ID의 리그를 조회합니다.
     * @param id 리그 ID
     * @return 해당 리그 정보
     */
    @Query("SELECT * FROM leagues WHERE id = :id")
    suspend fun getLeagueById(id: Int): LeagueEntity?
    
    /**
     * 지원되는 주요 리그들만 조회합니다.
     * @param leagueIds 지원되는 리그 ID 목록
     * @return 지원되는 리그 목록
     */
    @Query("SELECT * FROM leagues WHERE id IN (:leagueIds) ORDER BY name ASC")
    suspend fun getSupportedLeagues(leagueIds: List<Int>): List<LeagueEntity>
    
    /**
     * 지원되는 주요 리그들만 조회합니다 (Flow).
     * @param leagueIds 지원되는 리그 ID 목록
     * @return 지원되는 리그 목록의 Flow
     */
    @Query("SELECT * FROM leagues WHERE id IN (:leagueIds) ORDER BY name ASC")
    fun getSupportedLeaguesFlow(leagueIds: List<Int>): Flow<List<LeagueEntity>>
    
    /**
     * 리그 이름으로 검색합니다.
     * @param name 검색할 리그 이름
     * @return 검색된 리그 목록
     */
    @Query("SELECT * FROM leagues WHERE name LIKE '%' || :name || '%' ORDER BY name ASC")
    suspend fun searchLeaguesByName(name: String): List<LeagueEntity>
    
    /**
     * 국가별 리그를 조회합니다.
     * @param countryName 국가 이름
     * @return 해당 국가의 리그 목록
     */
    @Query("SELECT * FROM leagues WHERE countryName = :countryName ORDER BY name ASC")
    suspend fun getLeaguesByCountry(countryName: String): List<LeagueEntity>
    
    /**
     * 특정 시간 이후에 업데이트된 리그들을 조회합니다.
     * @param timestamp 기준 시간 (밀리초)
     * @return 해당 시간 이후 업데이트된 리그 목록
     */
    @Query("SELECT * FROM leagues WHERE lastUpdated > :timestamp ORDER BY name ASC")
    suspend fun getLeaguesUpdatedAfter(timestamp: Long): List<LeagueEntity>
    
    /**
     * 캐시된 데이터가 유효한지 확인합니다.
     * @param maxAge 최대 캐시 유지 시간 (밀리초)
     * @return 유효한 캐시 데이터 개수
     */
    @Query("SELECT COUNT(*) FROM leagues WHERE lastUpdated > :maxAge")
    suspend fun getValidCacheCount(maxAge: Long): Int
    
    /**
     * 리그를 삽입합니다. 이미 존재하면 교체합니다.
     * @param league 삽입할 리그 정보
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLeague(league: LeagueEntity)
    
    /**
     * 여러 리그를 삽입합니다. 이미 존재하면 교체합니다.
     * @param leagues 삽입할 리그 목록
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLeagues(leagues: List<LeagueEntity>)
    
    /**
     * 리그 정보를 업데이트합니다.
     * @param league 업데이트할 리그 정보
     */
    @Update
    suspend fun updateLeague(league: LeagueEntity)
    
    /**
     * 특정 리그를 삭제합니다.
     * @param league 삭제할 리그 정보
     */
    @Delete
    suspend fun deleteLeague(league: LeagueEntity)
    
    /**
     * 특정 ID의 리그를 삭제합니다.
     * @param id 삭제할 리그 ID
     */
    @Query("DELETE FROM leagues WHERE id = :id")
    suspend fun deleteLeagueById(id: Int)
    
    /**
     * 모든 리그를 삭제합니다.
     */
    @Query("DELETE FROM leagues")
    suspend fun deleteAllLeagues()
    
    /**
     * 오래된 캐시 데이터를 삭제합니다.
     * @param maxAge 최대 캐시 유지 시간 (밀리초)
     */
    @Query("DELETE FROM leagues WHERE lastUpdated < :maxAge")
    suspend fun deleteOldCache(maxAge: Long)
}
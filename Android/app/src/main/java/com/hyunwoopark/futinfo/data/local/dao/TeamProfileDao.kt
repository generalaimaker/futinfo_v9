package com.hyunwoopark.futinfo.data.local.dao

import androidx.room.*
import com.hyunwoopark.futinfo.data.local.entity.TeamProfileEntity
import kotlinx.coroutines.flow.Flow

/**
 * TeamProfile 데이터에 대한 Room DAO
 * 팀 프로필 정보의 CRUD 작업을 담당합니다.
 */
@Dao
interface TeamProfileDao {
    
    /**
     * 모든 팀 프로필을 조회합니다.
     * @return 모든 팀 프로필 목록의 Flow
     */
    @Query("SELECT * FROM team_profiles ORDER BY name ASC")
    fun getAllTeamProfiles(): Flow<List<TeamProfileEntity>>
    
    /**
     * 모든 팀 프로필을 조회합니다 (일회성).
     * @return 모든 팀 프로필 목록
     */
    @Query("SELECT * FROM team_profiles ORDER BY name ASC")
    suspend fun getAllTeamProfilesOnce(): List<TeamProfileEntity>
    
    /**
     * 특정 ID의 팀 프로필을 조회합니다.
     * @param id 팀 ID
     * @return 해당 팀 프로필 정보
     */
    @Query("SELECT * FROM team_profiles WHERE id = :id")
    suspend fun getTeamProfileById(id: Int): TeamProfileEntity?
    
    /**
     * 특정 ID의 팀 프로필을 조회합니다 (Flow).
     * @param id 팀 ID
     * @return 해당 팀 프로필 정보의 Flow
     */
    @Query("SELECT * FROM team_profiles WHERE id = :id")
    fun getTeamProfileByIdFlow(id: Int): Flow<TeamProfileEntity?>
    
    /**
     * 팀 이름으로 검색합니다.
     * @param name 검색할 팀 이름
     * @return 검색된 팀 프로필 목록
     */
    @Query("SELECT * FROM team_profiles WHERE name LIKE '%' || :name || '%' ORDER BY name ASC")
    suspend fun searchTeamProfilesByName(name: String): List<TeamProfileEntity>
    
    /**
     * 국가별 팀 프로필을 조회합니다.
     * @param country 국가 이름
     * @return 해당 국가의 팀 프로필 목록
     */
    @Query("SELECT * FROM team_profiles WHERE country = :country ORDER BY name ASC")
    suspend fun getTeamProfilesByCountry(country: String): List<TeamProfileEntity>
    
    /**
     * 창립 연도별 팀 프로필을 조회합니다.
     * @param founded 창립 연도
     * @return 해당 연도에 창립된 팀 프로필 목록
     */
    @Query("SELECT * FROM team_profiles WHERE founded = :founded ORDER BY name ASC")
    suspend fun getTeamProfilesByFounded(founded: Int): List<TeamProfileEntity>
    
    /**
     * 국가대표팀 여부로 팀 프로필을 조회합니다.
     * @param isNational 국가대표팀 여부
     * @return 해당 조건의 팀 프로필 목록
     */
    @Query("SELECT * FROM team_profiles WHERE national = :isNational ORDER BY name ASC")
    suspend fun getTeamProfilesByNational(isNational: Boolean): List<TeamProfileEntity>
    
    /**
     * 특정 도시의 팀 프로필을 조회합니다.
     * @param city 도시 이름
     * @return 해당 도시의 팀 프로필 목록
     */
    @Query("SELECT * FROM team_profiles WHERE venueCity = :city ORDER BY name ASC")
    suspend fun getTeamProfilesByCity(city: String): List<TeamProfileEntity>
    
    /**
     * 특정 시간 이후에 업데이트된 팀 프로필들을 조회합니다.
     * @param timestamp 기준 시간 (밀리초)
     * @return 해당 시간 이후 업데이트된 팀 프로필 목록
     */
    @Query("SELECT * FROM team_profiles WHERE lastUpdated > :timestamp ORDER BY name ASC")
    suspend fun getTeamProfilesUpdatedAfter(timestamp: Long): List<TeamProfileEntity>
    
    /**
     * 캐시된 데이터가 유효한지 확인합니다.
     * @param maxAge 최대 캐시 유지 시간 (밀리초)
     * @return 유효한 캐시 데이터 개수
     */
    @Query("SELECT COUNT(*) FROM team_profiles WHERE lastUpdated > :maxAge")
    suspend fun getValidCacheCount(maxAge: Long): Int
    
    /**
     * 특정 팀의 캐시된 데이터가 유효한지 확인합니다.
     * @param teamId 팀 ID
     * @param maxAge 최대 캐시 유지 시간 (밀리초)
     * @return 유효한 캐시 데이터 개수
     */
    @Query("SELECT COUNT(*) FROM team_profiles WHERE id = :teamId AND lastUpdated > :maxAge")
    suspend fun getValidCacheCountByTeam(teamId: Int, maxAge: Long): Int
    
    /**
     * 팀 프로필을 삽입합니다. 이미 존재하면 교체합니다.
     * @param teamProfile 삽입할 팀 프로필 정보
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTeamProfile(teamProfile: TeamProfileEntity)
    
    /**
     * 여러 팀 프로필을 삽입합니다. 이미 존재하면 교체합니다.
     * @param teamProfiles 삽입할 팀 프로필 목록
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTeamProfiles(teamProfiles: List<TeamProfileEntity>)
    
    /**
     * 팀 프로필 정보를 업데이트합니다.
     * @param teamProfile 업데이트할 팀 프로필 정보
     */
    @Update
    suspend fun updateTeamProfile(teamProfile: TeamProfileEntity)
    
    /**
     * 특정 팀 프로필을 삭제합니다.
     * @param teamProfile 삭제할 팀 프로필 정보
     */
    @Delete
    suspend fun deleteTeamProfile(teamProfile: TeamProfileEntity)
    
    /**
     * 특정 ID의 팀 프로필을 삭제합니다.
     * @param id 삭제할 팀 ID
     */
    @Query("DELETE FROM team_profiles WHERE id = :id")
    suspend fun deleteTeamProfileById(id: Int)
    
    /**
     * 모든 팀 프로필을 삭제합니다.
     */
    @Query("DELETE FROM team_profiles")
    suspend fun deleteAllTeamProfiles()
    
    /**
     * 오래된 캐시 데이터를 삭제합니다.
     * @param maxAge 최대 캐시 유지 시간 (밀리초)
     */
    @Query("DELETE FROM team_profiles WHERE lastUpdated < :maxAge")
    suspend fun deleteOldCache(maxAge: Long)
}
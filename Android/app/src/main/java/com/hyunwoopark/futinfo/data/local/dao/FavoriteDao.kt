package com.hyunwoopark.futinfo.data.local.dao

import androidx.room.*
import com.hyunwoopark.futinfo.data.local.entity.FavoriteEntity
import kotlinx.coroutines.flow.Flow

/**
 * 즐겨찾기 데이터에 접근하기 위한 DAO
 */
@Dao
interface FavoriteDao {
    
    /**
     * 모든 즐겨찾기 항목을 가져옵니다.
     * 최근에 추가된 순서로 정렬됩니다.
     */
    @Query("SELECT * FROM favorites ORDER BY addedAt DESC")
    fun getAllFavorites(): Flow<List<FavoriteEntity>>
    
    /**
     * 특정 타입의 즐겨찾기 항목들을 가져옵니다.
     * 
     * @param type 즐겨찾기 타입 ("league", "team", "player")
     */
    @Query("SELECT * FROM favorites WHERE type = :type ORDER BY addedAt DESC")
    fun getFavoritesByType(type: String): Flow<List<FavoriteEntity>>
    
    /**
     * 특정 항목이 즐겨찾기에 있는지 확인합니다.
     * 
     * @param id 즐겨찾기 ID (예: "league_39", "team_33")
     */
    @Query("SELECT * FROM favorites WHERE id = :id")
    suspend fun getFavoriteById(id: String): FavoriteEntity?
    
    /**
     * 특정 항목이 즐겨찾기에 있는지 확인합니다 (Flow 버전).
     * 
     * @param id 즐겨찾기 ID
     */
    @Query("SELECT * FROM favorites WHERE id = :id")
    fun getFavoriteByIdFlow(id: String): Flow<FavoriteEntity?>
    
    /**
     * 즐겨찾기 항목을 추가합니다.
     * 
     * @param favorite 추가할 즐겨찾기 항목
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFavorite(favorite: FavoriteEntity)
    
    /**
     * 즐겨찾기 항목을 삭제합니다.
     * 
     * @param id 삭제할 즐겨찾기 ID
     */
    @Query("DELETE FROM favorites WHERE id = :id")
    suspend fun deleteFavoriteById(id: String)
    
    /**
     * 특정 타입의 모든 즐겨찾기를 삭제합니다.
     * 
     * @param type 삭제할 즐겨찾기 타입
     */
    @Query("DELETE FROM favorites WHERE type = :type")
    suspend fun deleteFavoritesByType(type: String)
    
    /**
     * 모든 즐겨찾기를 삭제합니다.
     */
    @Query("DELETE FROM favorites")
    suspend fun deleteAllFavorites()
    
    /**
     * 즐겨찾기 개수를 가져옵니다.
     */
    @Query("SELECT COUNT(*) FROM favorites")
    suspend fun getFavoritesCount(): Int
    
    /**
     * 특정 타입의 즐겨찾기 개수를 가져옵니다.
     * 
     * @param type 즐겨찾기 타입
     */
    @Query("SELECT COUNT(*) FROM favorites WHERE type = :type")
    suspend fun getFavoritesCountByType(type: String): Int
    
    /**
     * 리그 즐겨찾기만 가져옵니다.
     */
    @Query("SELECT * FROM favorites WHERE type = 'league' ORDER BY addedAt DESC")
    fun getFavoriteLeagues(): Flow<List<FavoriteEntity>>
    
    /**
     * 팀 즐겨찾기만 가져옵니다.
     */
    @Query("SELECT * FROM favorites WHERE type = 'team' ORDER BY addedAt DESC")
    fun getFavoriteTeams(): Flow<List<FavoriteEntity>>
    
    /**
     * 선수 즐겨찾기만 가져옵니다.
     */
    @Query("SELECT * FROM favorites WHERE type = 'player' ORDER BY addedAt DESC")
    fun getFavoritePlayers(): Flow<List<FavoriteEntity>>
}
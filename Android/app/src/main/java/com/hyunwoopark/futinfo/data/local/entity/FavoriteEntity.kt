package com.hyunwoopark.futinfo.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * 즐겨찾기 항목을 저장하는 Room Entity
 * 
 * 리그, 팀, 선수 등 다양한 타입의 즐겨찾기를 하나의 테이블로 관리합니다.
 * type 필드를 통해 즐겨찾기 항목의 종류를 구분합니다.
 */
@Entity(tableName = "favorites")
data class FavoriteEntity(
    @PrimaryKey
    val id: String, // "league_39", "team_33", "player_276" 형태로 구성
    
    /**
     * 즐겨찾기 항목의 타입
     * "league", "team", "player" 중 하나
     */
    val type: String,
    
    /**
     * 실제 항목의 ID (API에서 사용되는 ID)
     */
    val itemId: Int,
    
    /**
     * 항목의 이름
     */
    val name: String,
    
    /**
     * 항목의 로고/사진 URL
     */
    val imageUrl: String?,
    
    /**
     * 즐겨찾기에 추가된 시간 (밀리초)
     */
    val addedAt: Long = System.currentTimeMillis(),
    
    /**
     * 추가 정보 (팀의 경우 리그 이름, 선수의 경우 팀 이름 등)
     */
    val additionalInfo: String? = null
) {
    companion object {
        const val TYPE_LEAGUE = "league"
        const val TYPE_TEAM = "team"
        const val TYPE_PLAYER = "player"
        
        /**
         * 리그 즐겨찾기 ID 생성
         */
        fun createLeagueId(leagueId: Int): String = "league_$leagueId"
        
        /**
         * 팀 즐겨찾기 ID 생성
         */
        fun createTeamId(teamId: Int): String = "team_$teamId"
        
        /**
         * 선수 즐겨찾기 ID 생성
         */
        fun createPlayerId(playerId: Int): String = "player_$playerId"
    }
}
package com.hyunwoopark.futinfo.domain.use_case

import com.hyunwoopark.futinfo.data.local.entity.FavoriteEntity
import com.hyunwoopark.futinfo.domain.repository.FootballRepository
import javax.inject.Inject

/**
 * 즐겨찾기 삭제 UseCase
 * 
 * 리그, 팀, 선수를 즐겨찾기에서 삭제하는 비즈니스 로직을 담당합니다.
 */
class RemoveFavoriteUseCase @Inject constructor(
    private val repository: FootballRepository
) {
    
    /**
     * 즐겨찾기를 삭제합니다.
     * 
     * @param favoriteId 삭제할 즐겨찾기 ID
     */
    suspend operator fun invoke(favoriteId: String) {
        repository.removeFavorite(favoriteId)
    }
    
    /**
     * 리그를 즐겨찾기에서 삭제합니다.
     * 
     * @param leagueId 리그 ID
     */
    suspend fun removeLeague(leagueId: Int) {
        val favoriteId = FavoriteEntity.createLeagueId(leagueId)
        repository.removeFavorite(favoriteId)
    }
    
    /**
     * 팀을 즐겨찾기에서 삭제합니다.
     * 
     * @param teamId 팀 ID
     */
    suspend fun removeTeam(teamId: Int) {
        val favoriteId = FavoriteEntity.createTeamId(teamId)
        repository.removeFavorite(favoriteId)
    }
    
    /**
     * 선수를 즐겨찾기에서 삭제합니다.
     * 
     * @param playerId 선수 ID
     */
    suspend fun removePlayer(playerId: Int) {
        val favoriteId = FavoriteEntity.createPlayerId(playerId)
        repository.removeFavorite(favoriteId)
    }
}
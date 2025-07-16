package com.hyunwoopark.futinfo.domain.use_case

import com.hyunwoopark.futinfo.domain.repository.FootballRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

/**
 * 즐겨찾기 상태 확인 UseCase
 * 
 * 특정 항목이 즐겨찾기에 등록되어 있는지 확인하는 비즈니스 로직을 담당합니다.
 */
class IsFavoriteUseCase @Inject constructor(
    private val repository: FootballRepository
) {
    
    /**
     * 특정 항목이 즐겨찾기에 등록되어 있는지 확인합니다.
     * 
     * @param id 항목 ID
     * @param type 항목 타입 ("league", "team", "player")
     * @return 즐겨찾기 등록 여부 Flow
     */
    operator fun invoke(id: Int, type: String): Flow<Boolean> {
        return repository.isFavorite(id, type)
    }
    
    /**
     * 리그가 즐겨찾기에 등록되어 있는지 확인합니다.
     * 
     * @param leagueId 리그 ID
     * @return 즐겨찾기 등록 여부 Flow
     */
    fun isLeagueFavorite(leagueId: Int): Flow<Boolean> {
        return repository.isFavorite(leagueId, "league")
    }
    
    /**
     * 팀이 즐겨찾기에 등록되어 있는지 확인합니다.
     * 
     * @param teamId 팀 ID
     * @return 즐겨찾기 등록 여부 Flow
     */
    fun isTeamFavorite(teamId: Int): Flow<Boolean> {
        return repository.isFavorite(teamId, "team")
    }
    
    /**
     * 선수가 즐겨찾기에 등록되어 있는지 확인합니다.
     * 
     * @param playerId 선수 ID
     * @return 즐겨찾기 등록 여부 Flow
     */
    fun isPlayerFavorite(playerId: Int): Flow<Boolean> {
        return repository.isFavorite(playerId, "player")
    }
}
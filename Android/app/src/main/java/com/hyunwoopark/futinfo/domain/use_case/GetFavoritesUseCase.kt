package com.hyunwoopark.futinfo.domain.use_case

import com.hyunwoopark.futinfo.data.local.entity.FavoriteEntity
import com.hyunwoopark.futinfo.domain.repository.FootballRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

/**
 * 즐겨찾기 조회 UseCase
 * 
 * 즐겨찾기 목록을 조회하는 비즈니스 로직을 담당합니다.
 */
class GetFavoritesUseCase @Inject constructor(
    private val repository: FootballRepository
) {
    
    /**
     * 모든 즐겨찾기 목록을 가져옵니다.
     * 
     * @return 즐겨찾기 목록 Flow
     */
    operator fun invoke(): Flow<List<FavoriteEntity>> {
        return repository.getAllFavorites()
    }
    
    /**
     * 특정 타입의 즐겨찾기 목록을 가져옵니다.
     * 
     * @param type 즐겨찾기 타입 ("league", "team", "player")
     * @return 해당 타입의 즐겨찾기 목록 Flow
     */
    fun getFavoritesByType(type: String): Flow<List<FavoriteEntity>> {
        return repository.getFavoritesByType(type)
    }
    
    /**
     * 리그 즐겨찾기 목록을 가져옵니다.
     * 
     * @return 리그 즐겨찾기 목록 Flow
     */
    fun getFavoriteLeagues(): Flow<List<FavoriteEntity>> {
        return repository.getFavoriteLeagues()
    }
    
    /**
     * 팀 즐겨찾기 목록을 가져옵니다.
     * 
     * @return 팀 즐겨찾기 목록 Flow
     */
    fun getFavoriteTeams(): Flow<List<FavoriteEntity>> {
        return repository.getFavoriteTeams()
    }
    
    /**
     * 선수 즐겨찾기 목록을 가져옵니다.
     * 
     * @return 선수 즐겨찾기 목록 Flow
     */
    fun getFavoritePlayers(): Flow<List<FavoriteEntity>> {
        return repository.getFavoritePlayers()
    }
}
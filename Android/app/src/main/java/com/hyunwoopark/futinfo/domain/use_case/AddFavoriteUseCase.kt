package com.hyunwoopark.futinfo.domain.use_case

import com.hyunwoopark.futinfo.data.local.entity.FavoriteEntity
import com.hyunwoopark.futinfo.domain.repository.FootballRepository
import javax.inject.Inject

/**
 * 즐겨찾기 추가 UseCase
 * 
 * 리그, 팀, 선수를 즐겨찾기에 추가하는 비즈니스 로직을 담당합니다.
 */
class AddFavoriteUseCase @Inject constructor(
    private val repository: FootballRepository
) {
    
    /**
     * 즐겨찾기를 추가합니다.
     * 
     * @param favorite 추가할 즐겨찾기 항목
     */
    suspend operator fun invoke(favorite: FavoriteEntity) {
        repository.addFavorite(favorite)
    }
    
    /**
     * 리그를 즐겨찾기에 추가합니다.
     * 
     * @param leagueId 리그 ID
     * @param name 리그 이름
     * @param imageUrl 리그 로고 URL
     * @param additionalInfo 추가 정보 (예: 국가명)
     */
    suspend fun addLeague(
        leagueId: Int,
        name: String,
        imageUrl: String? = null,
        additionalInfo: String? = null
    ) {
        val favorite = FavoriteEntity(
            id = FavoriteEntity.createLeagueId(leagueId),
            type = FavoriteEntity.TYPE_LEAGUE,
            itemId = leagueId,
            name = name,
            imageUrl = imageUrl,
            additionalInfo = additionalInfo
        )
        repository.addFavorite(favorite)
    }
    
    /**
     * 팀을 즐겨찾기에 추가합니다.
     * 
     * @param teamId 팀 ID
     * @param name 팀 이름
     * @param imageUrl 팀 로고 URL
     * @param additionalInfo 추가 정보 (예: 리그명)
     */
    suspend fun addTeam(
        teamId: Int,
        name: String,
        imageUrl: String? = null,
        additionalInfo: String? = null
    ) {
        val favorite = FavoriteEntity(
            id = FavoriteEntity.createTeamId(teamId),
            type = FavoriteEntity.TYPE_TEAM,
            itemId = teamId,
            name = name,
            imageUrl = imageUrl,
            additionalInfo = additionalInfo
        )
        repository.addFavorite(favorite)
    }
    
    /**
     * 선수를 즐겨찾기에 추가합니다.
     * 
     * @param playerId 선수 ID
     * @param name 선수 이름
     * @param imageUrl 선수 사진 URL
     * @param additionalInfo 추가 정보 (예: 팀명)
     */
    suspend fun addPlayer(
        playerId: Int,
        name: String,
        imageUrl: String? = null,
        additionalInfo: String? = null
    ) {
        val favorite = FavoriteEntity(
            id = FavoriteEntity.createPlayerId(playerId),
            type = FavoriteEntity.TYPE_PLAYER,
            itemId = playerId,
            name = name,
            imageUrl = imageUrl,
            additionalInfo = additionalInfo
        )
        repository.addFavorite(favorite)
    }
}
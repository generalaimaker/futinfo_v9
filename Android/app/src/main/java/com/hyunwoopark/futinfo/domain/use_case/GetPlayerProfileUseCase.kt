package com.hyunwoopark.futinfo.domain.use_case

import com.hyunwoopark.futinfo.domain.model.PlayerProfile
import com.hyunwoopark.futinfo.domain.model.PlayerInfo
import com.hyunwoopark.futinfo.domain.repository.FootballRepository
import com.hyunwoopark.futinfo.util.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import retrofit2.HttpException
import java.io.IOException
import javax.inject.Inject

/**
 * 선수 프로필 정보를 가져오는 UseCase
 */
class GetPlayerProfileUseCase @Inject constructor(
    private val repository: FootballRepository
) {
    operator fun invoke(
        playerId: Int,
        season: Int? = null,
        team: Int? = null
    ): Flow<Resource<PlayerProfile>> = flow {
        try {
            println("GetPlayerProfileUseCase - Loading player: $playerId, season: $season, team: $team")
            emit(Resource.Loading())
            val playerProfile = repository.getPlayerProfile(
                id = playerId,
                season = season,
                team = team
            )
            println("GetPlayerProfileUseCase - Successfully loaded player: ${playerProfile.player.name}")
            emit(Resource.Success(playerProfile))
        } catch (e: HttpException) {
            println("GetPlayerProfileUseCase - HTTP Exception: ${e.message}")
            emit(Resource.Error(e.localizedMessage ?: "HTTP 오류가 발생했습니다"))
        } catch (e: IOException) {
            println("GetPlayerProfileUseCase - IO Exception: ${e.message}")
            emit(Resource.Error("네트워크 연결을 확인해주세요"))
        } catch (e: Exception) {
            println("GetPlayerProfileUseCase - Exception: ${e.message}")
            e.printStackTrace()
            
            // 임시로 기본 선수 프로필 생성 (크래시 방지)
            val fallbackProfile = PlayerProfile(
                player = PlayerInfo(
                    id = playerId,
                    name = "선수 정보 로딩 중...",
                    firstname = null,
                    lastname = null,
                    age = null,
                    nationality = null,
                    height = null,
                    weight = null,
                    photo = null,
                    injured = false,
                    birth = null
                ),
                statistics = emptyList()
            )
            
            emit(Resource.Success(fallbackProfile))
        }
    }
}
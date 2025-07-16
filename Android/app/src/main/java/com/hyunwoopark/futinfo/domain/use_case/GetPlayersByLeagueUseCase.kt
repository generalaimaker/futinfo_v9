package com.hyunwoopark.futinfo.domain.use_case

import com.hyunwoopark.futinfo.data.remote.dto.PlayersResponseDto
import com.hyunwoopark.futinfo.domain.repository.FootballRepository
import com.hyunwoopark.futinfo.util.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import retrofit2.HttpException
import java.io.IOException
import javax.inject.Inject

/**
 * 리그별 선수 통계를 가져오는 UseCase
 */
class GetPlayersByLeagueUseCase @Inject constructor(
    private val repository: FootballRepository
) {
    operator fun invoke(
        league: Int,
        season: Int,
        page: Int? = null
    ): Flow<Resource<PlayersResponseDto>> = flow {
        try {
            emit(Resource.Loading())
            val players = repository.getPlayersByLeague(league, season, page)
            emit(Resource.Success(players))
        } catch (e: HttpException) {
            emit(Resource.Error(e.localizedMessage ?: "HTTP 오류가 발생했습니다"))
        } catch (e: IOException) {
            emit(Resource.Error("네트워크 연결을 확인해주세요"))
        } catch (e: Exception) {
            emit(Resource.Error(e.localizedMessage ?: "알 수 없는 오류가 발생했습니다"))
        }
    }
}
package com.hyunwoopark.futinfo.domain.use_case

import com.hyunwoopark.futinfo.data.remote.dto.StandingsResponseDto
import com.hyunwoopark.futinfo.domain.repository.FootballRepository
import com.hyunwoopark.futinfo.util.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import retrofit2.HttpException
import java.io.IOException
import javax.inject.Inject

/**
 * 순위표 조회 UseCase
 * 
 * 리그의 순위표 정보를 가져오는 비즈니스 로직을 담당합니다.
 */
class GetStandingsUseCase @Inject constructor(
    private val repository: FootballRepository
) {
    
    /**
     * 순위표를 조회합니다.
     *
     * @param league 리그 ID (필수)
     * @param season 시즌 (필수)
     * @param team 특정 팀 ID (선택사항)
     * @return Flow<Resource<StandingsResponseDto>>
     */
    operator fun invoke(
        league: Int,
        season: Int,
        team: Int? = null
    ): Flow<Resource<StandingsResponseDto>> = flow {
        try {
            emit(Resource.Loading())
            
            android.util.Log.d("GetStandingsUseCase", "🔍 [DEBUG] 순위표 조회 요청 - league: $league, season: $season")
            
            val standings = repository.getStandings(
                league = league,
                season = season,
                team = team
            )
            
            android.util.Log.d("GetStandingsUseCase", "🔍 [DEBUG] 순위표 조회 성공")
            android.util.Log.d("GetStandingsUseCase", "🔍 [DEBUG] 순위표 데이터 개수: ${standings.response.size}")
            
            if (standings.response.isEmpty()) {
                android.util.Log.w("GetStandingsUseCase", "🔍 [DEBUG] 순위표 데이터 없음")
                emit(Resource.Error("${season}/${season + 1} 시즌 순위 정보가 없습니다"))
            } else {
                emit(Resource.Success(standings))
            }
            
        } catch (e: HttpException) {
            emit(Resource.Error(
                message = when (e.code()) {
                    404 -> "순위 정보를 찾을 수 없습니다"
                    429 -> "요청이 너무 많습니다. 잠시 후 다시 시도해주세요"
                    403 -> "API 접근 권한이 없습니다"
                    else -> "순위 정보를 불러오는데 실패했습니다: ${e.localizedMessage}"
                }
            ))
        } catch (e: IOException) {
            emit(Resource.Error(
                message = "네트워크 연결을 확인해주세요"
            ))
        } catch (e: Exception) {
            emit(Resource.Error(
                message = "알 수 없는 오류가 발생했습니다: ${e.localizedMessage}"
            ))
        }
    }
}
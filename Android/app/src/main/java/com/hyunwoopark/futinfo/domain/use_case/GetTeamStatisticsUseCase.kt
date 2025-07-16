package com.hyunwoopark.futinfo.domain.use_case

import com.hyunwoopark.futinfo.data.remote.dto.TeamStatisticsResponseDto
import com.hyunwoopark.futinfo.domain.repository.FootballRepository
import com.hyunwoopark.futinfo.util.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

/**
 * 리그별 팀 통계를 가져오는 UseCase
 * 리그 상세 화면의 '팀 통계' 탭에서 사용됩니다.
 */
class GetTeamStatisticsUseCase @Inject constructor(
    private val repository: FootballRepository
) {
    /**
     * 리그 내 모든 팀의 통계를 가져옵니다.
     * 
     * @param leagueId 리그 ID
     * @param season 시즌
     * @return 팀 통계 목록
     */
    operator fun invoke(
        leagueId: Int,
        season: Int
    ): Flow<Resource<List<TeamStatisticsResponseDto>>> = flow {
        try {
            emit(Resource.Loading())
            
            android.util.Log.d("GetTeamStatisticsUseCase", "🔍 팀 통계 로드 시작 - leagueId: $leagueId, season: $season")
            
            // 먼저 리그의 순위표를 가져와서 팀 ID 목록을 얻습니다
            val standings = repository.getStandings(leagueId, season)
            
            if (standings.response.isEmpty()) {
                emit(Resource.Error("순위표 데이터가 없습니다"))
                return@flow
            }
            
            val teamIds = mutableSetOf<Int>()
            standings.response.forEach { leagueStanding ->
                leagueStanding.league.standings?.forEach { standingsList ->
                    standingsList.forEach { standing ->
                        teamIds.add(standing.team.id)
                    }
                }
            }
            
            android.util.Log.d("GetTeamStatisticsUseCase", "🔍 총 ${teamIds.size}개 팀 발견")
            
            // 각 팀의 통계를 병렬로 가져옵니다
            val teamStatistics = mutableListOf<TeamStatisticsResponseDto>()
            
            // API 호출 제한을 고려하여 상위 10개 팀만 가져옵니다
            teamIds.take(10).forEach { teamId ->
                try {
                    val stats = repository.getTeamStatistics(
                        league = leagueId,
                        season = season,
                        team = teamId
                    )
                    teamStatistics.add(stats)
                    android.util.Log.d("GetTeamStatisticsUseCase", "✅ 팀 $teamId 통계 로드 성공")
                } catch (e: Exception) {
                    android.util.Log.w("GetTeamStatisticsUseCase", "⚠️ 팀 $teamId 통계 로드 실패: ${e.message}")
                }
            }
            
            android.util.Log.d("GetTeamStatisticsUseCase", "🔍 총 ${teamStatistics.size}개 팀 통계 로드 완료")
            
            emit(Resource.Success(teamStatistics))
            
        } catch (e: Exception) {
            android.util.Log.e("GetTeamStatisticsUseCase", "❌ 팀 통계 로드 실패: ${e.message}")
            emit(Resource.Error(e.message ?: "팀 통계를 불러올 수 없습니다"))
        }
    }
    
    /**
     * 특정 팀의 통계를 가져옵니다.
     * 
     * @param leagueId 리그 ID
     * @param season 시즌
     * @param teamId 팀 ID
     * @return 팀 통계
     */
    fun getTeamStatistics(
        leagueId: Int,
        season: Int,
        teamId: Int
    ): Flow<Resource<TeamStatisticsResponseDto>> = flow {
        try {
            emit(Resource.Loading())
            
            val stats = repository.getTeamStatistics(
                league = leagueId,
                season = season,
                team = teamId
            )
            
            emit(Resource.Success(stats))
            
        } catch (e: Exception) {
            android.util.Log.e("GetTeamStatisticsUseCase", "❌ 팀 통계 로드 실패: ${e.message}")
            emit(Resource.Error(e.message ?: "팀 통계를 불러올 수 없습니다"))
        }
    }
}
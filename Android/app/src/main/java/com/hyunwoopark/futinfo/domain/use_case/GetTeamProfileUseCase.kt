package com.hyunwoopark.futinfo.domain.use_case

import com.hyunwoopark.futinfo.domain.model.TeamProfileDetails
import com.hyunwoopark.futinfo.domain.repository.FootballRepository
import com.hyunwoopark.futinfo.util.Resource
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

/**
 * 팀 프로필 정보를 가져오는 UseCase
 * 
 * FootballRepository를 사용하여 팀 기본 정보, 통계, 선수단 데이터를 병렬로 가져오고,
 * 이를 조합하여 TeamProfileDetails로 만들어 Flow를 통해 로딩, 성공, 실패 상태를 방출합니다.
 */
class GetTeamProfileUseCase @Inject constructor(
    private val repository: FootballRepository
) {
    
    /**
     * 팀 프로필 상세 정보를 가져옵니다.
     * 
     * @param teamId 팀 ID (필수)
     * @param season 시즌 (선택사항, 통계 조회에 사용)
     * @param league 리그 ID (선택사항, 통계 조회에 사용)
     * 
     * @return Flow<Resource<TeamProfileDetails>> 팀 프로필 상세 정보를 Resource로 감싼 Flow
     */
    suspend operator fun invoke(
        teamId: Int,
        season: Int? = null,
        league: Int? = null
    ): Flow<Resource<TeamProfileDetails>> = flow {
        println("GetTeamProfileUseCase - invoke called with teamId: $teamId, season: $season, league: $league")
        try {
            // 로딩 상태 방출
            emit(Resource.Loading())
            
            // coroutineScope를 사용하여 여러 API 호출을 병렬로 처리
            coroutineScope {
                // 팀 기본 정보 조회 (필수)
                val teamProfileDeferred = async {
                    repository.getTeamProfile(id = teamId)
                }
                
                // 팀 통계 조회 (선택사항 - league와 season이 모두 있을 때만)
                val statisticsDeferred = if (league != null && season != null) {
                    async {
                        try {
                            repository.getTeamStatistics(
                                league = league,
                                season = season,
                                team = teamId
                            )
                        } catch (e: Exception) {
                            // 통계 조회 실패 시 null 반환 (선택사항이므로)
                            null
                        }
                    }
                } else null
                
                // 팀 선수단 조회 (선택사항)
                val squadDeferred = async {
                    try {
                        println("GetTeamProfileUseCase - Fetching squad for team: $teamId, season: 2024")
                        repository.getTeamSquad(
                            team = teamId,
                            season = 2024
                        )
                    } catch (e: Exception) {
                        // 선수단 조회 실패 시 null 반환 (선택사항이므로)
                        println("GetTeamProfileUseCase - Squad fetch failed: ${e.message}")
                        e.printStackTrace()
                        null
                    }
                }
                
                // 모든 비동기 작업 완료 대기
                val teamProfileResponse = teamProfileDeferred.await()
                val statisticsResponse = statisticsDeferred?.await()
                val squadResponse = squadDeferred.await()
                
                // 팀 프로필 응답에서 첫 번째 팀 정보 추출
                val teamProfile = teamProfileResponse.response.firstOrNull()
                    ?: throw Exception("팀 프로필 정보를 찾을 수 없습니다.")
                
                // 통계 응답에서 통계 정보 추출 (있는 경우)
                val statistics = statisticsResponse?.response
                
                // 선수단 응답에서 첫 번째 팀 선수단 정보 추출 (있는 경우)
                val squad = squadResponse?.response?.firstOrNull()
                
                // 디버깅용 로그
                println("TeamProfile - Squad Response: ${squadResponse != null}")
                println("TeamProfile - Squad Players: ${squad?.players?.size ?: 0}")
                
                // TeamProfileDetails 객체 생성
                val teamProfileDetails = TeamProfileDetails(
                    teamProfile = teamProfile,
                    statistics = statistics,
                    squad = squad
                )
                
                // 디버깅용 로그
                println("GetTeamProfileUseCase - TeamId: $teamId")
                println("GetTeamProfileUseCase - Squad players count: ${squad?.players?.size ?: 0}")
                if (squad?.players?.isNotEmpty() == true) {
                    println("GetTeamProfileUseCase - First player: ${squad.players.first().name}")
                }
                
                // 성공 상태 방출
                emit(Resource.Success(teamProfileDetails))
            }
            
        } catch (e: Exception) {
            // 에러 상태 방출
            emit(Resource.Error(
                message = e.localizedMessage ?: "팀 프로필 정보를 가져오는 중 알 수 없는 오류가 발생했습니다."
            ))
        }
    }
    
    /**
     * 팀 기본 정보만 가져옵니다.
     * 통계나 선수단 정보 없이 빠르게 팀 정보만 필요한 경우 사용합니다.
     * 
     * @param teamId 팀 ID (필수)
     * 
     * @return Flow<Resource<TeamProfileDetails>> 팀 기본 정보만 포함된 TeamProfileDetails를 Resource로 감싼 Flow
     */
    suspend fun getBasicTeamProfile(teamId: Int): Flow<Resource<TeamProfileDetails>> = flow {
        try {
            // 로딩 상태 방출
            emit(Resource.Loading())
            
            // 팀 기본 정보만 조회
            val teamProfileResponse = repository.getTeamProfile(id = teamId)
            
            // 팀 프로필 응답에서 첫 번째 팀 정보 추출
            val teamProfile = teamProfileResponse.response.firstOrNull()
                ?: throw Exception("팀 프로필 정보를 찾을 수 없습니다.")
            
            // 기본 정보만 포함된 TeamProfileDetails 객체 생성
            val teamProfileDetails = TeamProfileDetails(
                teamProfile = teamProfile,
                statistics = null,
                squad = null
            )
            
            // 성공 상태 방출
            emit(Resource.Success(teamProfileDetails))
            
        } catch (e: Exception) {
            // 에러 상태 방출
            emit(Resource.Error(
                message = e.localizedMessage ?: "팀 기본 정보를 가져오는 중 알 수 없는 오류가 발생했습니다."
            ))
        }
    }
}
package com.hyunwoopark.futinfo.domain.use_case

import com.hyunwoopark.futinfo.data.local.UserLeaguePreferences
import com.hyunwoopark.futinfo.data.remote.dto.FixturesResponseDto
import com.hyunwoopark.futinfo.domain.repository.FootballRepository
import com.hyunwoopark.futinfo.util.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

/**
 * 경기 목록을 가져오는 UseCase
 *
 * 사용자가 즐겨찾기한 리그의 경기 정보만 가져옵니다.
 * FootballRepository를 사용하여 경기 데이터를 가져오고,
 * Flow를 통해 로딩, 성공, 실패 상태를 방출합니다.
 */
class GetFixturesUseCase @Inject constructor(
    private val repository: FootballRepository,
    private val userLeaguePreferences: UserLeaguePreferences
) {
    
    /**
     * 경기 목록을 가져옵니다.
     * 
     * @param id 특정 경기 ID (선택사항)
     * @param live 라이브 경기만 조회 (선택사항)
     * @param date 특정 날짜의 경기 (YYYY-MM-DD 형식) (선택사항)
     * @param league 리그 ID (선택사항)
     * @param season 시즌 (선택사항)
     * @param team 팀 ID (선택사항)
     * @param last 최근 N개 경기 (선택사항)
     * @param next 다음 N개 경기 (선택사항)
     * @param from 시작 날짜 (YYYY-MM-DD 형식) (선택사항)
     * @param to 종료 날짜 (YYYY-MM-DD 형식) (선택사항)
     * @param round 라운드 (선택사항)
     * @param status 경기 상태 (선택사항)
     * @param venue 경기장 ID (선택사항)
     * @param timezone 시간대 (선택사항)
     * 
     * @return Flow<Resource<FixturesResponseDto>> 경기 목록 응답을 Resource로 감싼 Flow
     */
    suspend operator fun invoke(
        id: Int? = null,
        live: String? = null,
        date: String? = null,
        league: Int? = null,
        season: Int? = null,
        team: Int? = null,
        last: Int? = null,
        next: Int? = null,
        from: String? = null,
        to: String? = null,
        round: String? = null,
        status: String? = null,
        venue: Int? = null,
        timezone: String? = null
    ): Flow<Resource<FixturesResponseDto>> = flow {
        try {
            // 로딩 상태 방출
            emit(Resource.Loading())
            
            // Repository를 통해 데이터 요청
            val fixtures = repository.getFixtures(
                id = id,
                live = live,
                date = date,
                league = league,
                season = season,
                team = team,
                last = last,
                next = next,
                from = from,
                to = to,
                round = round,
                status = status,
                venue = venue,
                timezone = timezone
            )
            
            // 성공 상태 방출
            emit(Resource.Success(fixtures))
            
        } catch (e: Exception) {
            // 에러 상태 방출
            emit(Resource.Error(
                message = e.localizedMessage ?: "경기 목록을 가져오는 중 알 수 없는 오류가 발생했습니다."
            ))
        }
    }
    
    /**
     * 즐겨찾기된 리그의 특정 날짜 경기 목록을 가져옵니다.
     * 일정 탭에서 사용되는 메인 함수
     *
     * @param date 특정 날짜 (YYYY-MM-DD 형식) (필수)
     * @param season 시즌 (선택사항)
     *
     * @return Flow<Resource<FixturesResponseDto>> 즐겨찾기된 리그의 경기 목록을 종합한 응답을 Resource로 감싼 Flow
     */
    suspend fun getFavoriteLeagueFixtures(
        date: String,
        season: Int? = null
    ): Flow<Resource<FixturesResponseDto>> = flow {
        try {
            // 로딩 상태 방출
            emit(Resource.Loading())
            
            // 즐겨찾기된 리그 ID 목록 가져오기
            val favoriteLeagueIds = userLeaguePreferences.getFixtureDisplayLeagues()
            
            if (favoriteLeagueIds.isEmpty()) {
                // 즐겨찾기된 리그가 없으면 빈 결과 반환
                emit(Resource.Success(FixturesResponseDto(
                    get = "fixtures",
                    parameters = com.hyunwoopark.futinfo.data.remote.dto.ParametersDto(),
                    errors = emptyList(),
                    results = 0,
                    paging = com.hyunwoopark.futinfo.data.remote.dto.PagingDto(current = 1, total = 1),
                    response = emptyList()
                )))
                return@flow
            }
            
            // Repository를 통해 병렬 데이터 요청
            val fixtures = repository.getFixtures(
                date = date,
                leagueIds = favoriteLeagueIds,
                season = season
            )
            
            // 성공 상태 방출
            emit(Resource.Success(fixtures))
            
        } catch (e: Exception) {
            // 에러 상태 방출
            emit(Resource.Error(
                message = e.localizedMessage ?: "즐겨찾기된 리그의 경기 목록을 가져오는 중 알 수 없는 오류가 발생했습니다."
            ))
        }
    }
    
    /**
     * 여러 리그의 특정 날짜 경기 목록을 병렬로 가져옵니다.
     * 일정 기능 개선을 위한 새로운 함수
     *
     * @param date 특정 날짜 (YYYY-MM-DD 형식) (필수)
     * @param leagueIds 여러 리그 ID 목록 (필수)
     * @param season 시즌 (선택사항)
     *
     * @return Flow<Resource<FixturesResponseDto>> 여러 리그의 경기 목록을 종합한 응답을 Resource로 감싼 Flow
     */
    suspend operator fun invoke(
        date: String,
        leagueIds: List<Int>,
        season: Int? = null
    ): Flow<Resource<FixturesResponseDto>> = flow {
        try {
            // 로딩 상태 방출
            emit(Resource.Loading())
            
            // Repository를 통해 병렬 데이터 요청
            val fixtures = repository.getFixtures(
                date = date,
                leagueIds = leagueIds,
                season = season
            )
            
            // 성공 상태 방출
            emit(Resource.Success(fixtures))
            
        } catch (e: Exception) {
            // 에러 상태 방출
            emit(Resource.Error(
                message = e.localizedMessage ?: "여러 리그의 경기 목록을 가져오는 중 알 수 없는 오류가 발생했습니다."
            ))
        }
    }
}
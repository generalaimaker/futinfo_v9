package com.hyunwoopark.futinfo.domain.use_case

import com.hyunwoopark.futinfo.data.remote.dto.LeaguesResponseDto
import com.hyunwoopark.futinfo.domain.repository.FootballRepository
import com.hyunwoopark.futinfo.util.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

/**
 * 리그 목록을 가져오는 UseCase
 * 
 * FootballRepository를 사용하여 리그 데이터를 가져오고,
 * Flow를 통해 로딩, 성공, 실패 상태를 방출합니다.
 */
class GetLeaguesUseCase @Inject constructor(
    private val repository: FootballRepository
) {
    
    /**
     * 리그 목록을 가져옵니다.
     * 
     * @param id 특정 리그 ID (선택사항)
     * @param name 리그 이름으로 검색 (선택사항)
     * @param country 국가별 리그 검색 (선택사항)
     * @param code 국가 코드로 검색 (선택사항)
     * @param season 시즌별 검색 (선택사항)
     * @param type 리그 타입 (League, Cup) (선택사항)
     * @param current 현재 시즌만 조회 (선택사항)
     * @param search 검색어 (선택사항)
     * @param last 최근 N개 결과 (선택사항)
     * 
     * @return Flow<Resource<LeaguesResponseDto>> 리그 목록 응답을 Resource로 감싼 Flow
     */
    suspend operator fun invoke(
        id: Int? = null,
        name: String? = null,
        country: String? = null,
        code: String? = null,
        season: Int? = null,
        type: String? = null,
        current: Boolean? = null,
        search: String? = null,
        last: Int? = null
    ): Flow<Resource<LeaguesResponseDto>> = flow {
        try {
            // 로딩 상태 방출
            emit(Resource.Loading())
            
            // Repository를 통해 데이터 요청
            val leagues = repository.getLeagues(
                id = id,
                name = name,
                country = country,
                code = code,
                season = season,
                type = type,
                current = current,
                search = search,
                last = last
            )
            
            // 성공 상태 방출
            emit(Resource.Success(leagues))
            
        } catch (e: Exception) {
            // 에러 상태 방출
            emit(Resource.Error(
                message = e.localizedMessage ?: "리그 목록을 가져오는 중 알 수 없는 오류가 발생했습니다."
            ))
        }
    }
    
    /**
     * 지원되는 주요 리그들만 가져옵니다.
     * Premier League, La Liga, Serie A, Bundesliga, Champions League, Europa League
     * 
     * @param season 시즌 (기본값: 현재 시즌)
     * @return Flow<Resource<LeaguesResponseDto>> 주요 리그 목록 응답을 Resource로 감싼 Flow
     */
    suspend fun getSupportedLeagues(season: Int? = null): Flow<Resource<LeaguesResponseDto>> = flow {
        try {
            // 로딩 상태 방출
            emit(Resource.Loading())
            
            // Repository를 통해 지원되는 리그 데이터 요청
            val supportedLeagues = repository.getSupportedLeagues(season)
            
            // 성공 상태 방출
            emit(Resource.Success(supportedLeagues))
            
        } catch (e: Exception) {
            // 에러 상태 방출
            emit(Resource.Error(
                message = e.localizedMessage ?: "지원되는 리그 목록을 가져오는 중 알 수 없는 오류가 발생했습니다."
            ))
        }
    }
}
package com.hyunwoopark.futinfo.domain.use_case

import com.hyunwoopark.futinfo.data.remote.dto.TeamSearchResponseDto
import com.hyunwoopark.futinfo.domain.repository.FootballRepository
import com.hyunwoopark.futinfo.util.Resource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

/**
 * 팀 검색 UseCase
 * 
 * FootballRepository를 사용하여 팀 검색을 수행하고,
 * Flow를 통해 로딩, 성공, 실패 상태를 방출합니다.
 */
class SearchTeamsUseCase @Inject constructor(
    private val repository: FootballRepository
) {
    
    /**
     * 팀을 검색합니다.
     * 
     * @param searchQuery 검색어 (필수)
     * @param country 국가별 필터링 (선택사항)
     * @param league 리그별 필터링 (선택사항)
     * @param season 시즌별 필터링 (선택사항)
     * 
     * @return Flow<Resource<TeamSearchResponseDto>> 팀 검색 결과를 Resource로 감싼 Flow
     */
    suspend operator fun invoke(
        searchQuery: String,
        country: String? = null,
        league: Int? = null,
        season: Int? = null
    ): Flow<Resource<TeamSearchResponseDto>> = flow {
        try {
            // 검색어가 비어있는 경우 에러 상태 방출
            if (searchQuery.isBlank()) {
                emit(Resource.Error(
                    message = "검색어를 입력해주세요."
                ))
                return@flow
            }
            
            // 로딩 상태 방출
            emit(Resource.Loading())
            
            // Repository를 통해 팀 검색 요청
            val searchResult = repository.searchTeams(
                search = searchQuery.trim(),
                country = country,
                league = league,
                season = season
            )
            
            // 성공 상태 방출
            emit(Resource.Success(searchResult))
            
        } catch (e: Exception) {
            // 에러 상태 방출
            emit(Resource.Error(
                message = e.localizedMessage ?: "팀 검색 중 알 수 없는 오류가 발생했습니다."
            ))
        }
    }
}
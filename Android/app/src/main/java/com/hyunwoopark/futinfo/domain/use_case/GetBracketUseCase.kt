package com.hyunwoopark.futinfo.domain.use_case

import com.hyunwoopark.futinfo.domain.model.Bracket
import com.hyunwoopark.futinfo.domain.repository.FootballRepository
import com.hyunwoopark.futinfo.util.Resource
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

/**
 * 토너먼트 대진표를 가져오는 UseCase
 */
class GetBracketUseCase @Inject constructor(
    private val repository: FootballRepository
) {
    /**
     * 특정 리그의 토너먼트 대진표를 가져옵니다.
     * 
     * @param leagueId 리그 ID
     * @param season 시즌 (예: 2024)
     * @return 대진표 데이터를 포함한 Flow<Resource<Bracket>>
     */
    operator fun invoke(leagueId: Int, season: Int): Flow<Resource<Bracket>> {
        return repository.getBracket(leagueId, season)
    }
}
package com.hyunwoopark.futinfo.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * 토너먼트 대진표 API 응답 DTO
 */
@Serializable
data class BracketResponseDto(
    val get: String,
    val parameters: BracketParametersDto,
    val errors: List<String>,
    val results: Int,
    val paging: PagingDto,
    val response: List<String> // API는 라운드 이름 문자열 배열을 반환
)

/**
 * 대진표 요청 파라미터 DTO
 */
@Serializable
data class BracketParametersDto(
    val league: String,
    val season: String
)

/**
 * 대진표 라운드 DTO
 */
@Serializable
data class BracketRoundDto(
    val round: String,
    val fixtures: List<BracketFixtureDto>
)

/**
 * 대진표 경기 DTO
 */
@Serializable
data class BracketFixtureDto(
    val fixture: BracketFixtureInfoDto,
    val league: LeagueDto,
    val teams: BracketTeamsDto,
    val goals: BracketGoalsDto,
    val score: BracketScoreDto
)

/**
 * 대진표 경기 정보 DTO
 */
@Serializable
data class BracketFixtureInfoDto(
    val id: Int,
    val referee: String? = null,
    val timezone: String,
    val date: String,
    val timestamp: Long,
    val periods: BracketPeriodsDto? = null,
    val venue: VenueDto? = null,
    val status: FixtureStatusDto
)

/**
 * 대진표 경기 시간 DTO
 */
@Serializable
data class BracketPeriodsDto(
    val first: Long? = null,
    val second: Long? = null
)

/**
 * 대진표 팀 정보 DTO
 */
@Serializable
data class BracketTeamsDto(
    val home: TeamDto,
    val away: TeamDto
)

/**
 * 대진표 골 정보 DTO
 */
@Serializable
data class BracketGoalsDto(
    val home: Int? = null,
    val away: Int? = null
)

/**
 * 대진표 점수 정보 DTO
 */
@Serializable
data class BracketScoreDto(
    val halftime: BracketGoalsDto,
    val fulltime: BracketGoalsDto,
    val extratime: BracketGoalsDto,
    val penalty: BracketGoalsDto
)

/**
 * BracketResponseDto를 도메인 모델로 변환하는 확장 함수
 */
fun BracketResponseDto.toDomain(): com.hyunwoopark.futinfo.domain.model.Bracket {
    return try {
        com.hyunwoopark.futinfo.domain.model.Bracket(
            rounds = response.map { roundName ->
                com.hyunwoopark.futinfo.domain.model.BracketRound(
                    round = roundName,
                    fixtures = emptyList() // 라운드 이름만 있고 실제 경기 정보는 별도 API에서 가져와야 함
                )
            }
        )
    } catch (e: Exception) {
        android.util.Log.e("BracketDto", "🔍 [DEBUG] toDomain 변환 실패: ${e.message}")
        android.util.Log.e("BracketDto", "🔍 [DEBUG] response 타입: ${response.javaClass.simpleName}")
        android.util.Log.e("BracketDto", "🔍 [DEBUG] response 내용: $response")
        // 변환 실패 시 빈 대진표 반환
        com.hyunwoopark.futinfo.domain.model.Bracket(rounds = emptyList())
    }
}
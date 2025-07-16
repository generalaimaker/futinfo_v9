package com.hyunwoopark.futinfo.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * 팀 프로필 API 응답 DTO
 * iOS TeamProfileResponse에 대응
 */
@Serializable
data class TeamProfileResponseDto(
    @SerialName("get") val get: String,
    @SerialName("parameters") val parameters: TeamParametersDto,
    @SerialName("errors") val errors: List<String> = emptyList(),
    @SerialName("results") val results: Int,
    @SerialName("paging") val paging: PagingDto,
    @SerialName("response") val response: List<TeamProfileDto>
)

/**
 * 팀 프로필 DTO
 * iOS TeamProfile에 대응
 */
@Serializable
data class TeamProfileDto(
    @SerialName("team") val team: TeamInfoDto,
    @SerialName("venue") val venue: VenueInfoDto
)

/**
 * 팀 정보 DTO
 * iOS TeamInfo에 대응
 */
@Serializable
data class TeamInfoDto(
    @SerialName("id") val id: Int,
    @SerialName("name") val name: String,
    @SerialName("code") val code: String? = null,
    @SerialName("country") val country: String? = null,
    @SerialName("founded") val founded: Int? = null,
    @SerialName("national") val national: Boolean? = null,
    @SerialName("logo") val logo: String
)

/**
 * 경기장 정보 DTO
 * iOS VenueInfo에 대응
 */
@Serializable
data class VenueInfoDto(
    @SerialName("id") val id: Int? = null,
    @SerialName("name") val name: String? = null,
    @SerialName("address") val address: String? = null,
    @SerialName("city") val city: String? = null,
    @SerialName("capacity") val capacity: Int? = null,
    @SerialName("surface") val surface: String? = null,
    @SerialName("image") val image: String? = null
)

/**
 * 팀 파라미터 DTO
 */
@Serializable
data class TeamParametersDto(
    @SerialName("id") val id: String? = null,
    @SerialName("name") val name: String? = null,
    @SerialName("league") val league: String? = null,
    @SerialName("season") val season: String? = null,
    @SerialName("country") val country: String? = null,
    @SerialName("code") val code: String? = null,
    @SerialName("venue") val venue: String? = null,
    @SerialName("search") val search: String? = null
)

/**
 * 팀 통계 API 응답 DTO
 * iOS TeamStatisticsResponse에 대응
 */
@Serializable
data class TeamStatisticsResponseDto(
    @SerialName("get") val get: String,
    @SerialName("parameters") val parameters: TeamStatisticsParametersDto,
    @SerialName("errors") val errors: List<String> = emptyList(),
    @SerialName("results") val results: Int,
    @SerialName("paging") val paging: PagingDto,
    @SerialName("response") val response: TeamSeasonStatisticsDto
)

/**
 * 팀 통계 파라미터 DTO
 */
@Serializable
data class TeamStatisticsParametersDto(
    @SerialName("league") val league: String,
    @SerialName("season") val season: String,
    @SerialName("team") val team: String,
    @SerialName("date") val date: String? = null
)

/**
 * 팀 시즌 통계 DTO
 * iOS TeamSeasonStatistics에 대응
 */
@Serializable
data class TeamSeasonStatisticsDto(
    @SerialName("league") val league: TeamLeagueInfoDto,
    @SerialName("team") val team: TeamStatisticsInfoDto,
    @SerialName("form") val form: String? = null,
    @SerialName("fixtures") val fixtures: FixturesStatsDto? = null,
    @SerialName("goals") val goals: TeamGoalsStatsDto? = null,
    @SerialName("biggest") val biggest: BiggestStatsDto? = null,
    @SerialName("clean_sheet") val cleanSheets: CleanSheetsDto? = null,
    @SerialName("failed_to_score") val failedToScore: FailedToScoreDto? = null,
    @SerialName("penalty") val penalty: PenaltyStatsDto? = null,
    @SerialName("lineups") val lineups: List<LineupStatsDto>? = null,
    @SerialName("cards") val cards: CardsStatsDto? = null
)

/**
 * 팀 리그 정보 DTO
 * iOS TeamLeagueInfo에 대응
 */
@Serializable
data class TeamLeagueInfoDto(
    @SerialName("id") val id: Int,
    @SerialName("name") val name: String,
    @SerialName("country") val country: String? = null,
    @SerialName("logo") val logo: String,
    @SerialName("flag") val flag: String? = null,
    @SerialName("season") val season: Int
)

/**
 * 팀 통계 정보 DTO
 * iOS TeamStatisticsInfo에 대응
 */
@Serializable
data class TeamStatisticsInfoDto(
    @SerialName("id") val id: Int,
    @SerialName("name") val name: String,
    @SerialName("logo") val logo: String
)

/**
 * 경기 통계 DTO
 * iOS FixturesStats에 대응
 */
@Serializable
data class FixturesStatsDto(
    @SerialName("played") val played: TeamSeasonStatisticDto,
    @SerialName("wins") val wins: TeamSeasonStatisticDto,
    @SerialName("draws") val draws: TeamSeasonStatisticDto,
    @SerialName("loses") val loses: TeamSeasonStatisticDto
)

/**
 * 팀 골 통계 DTO
 * iOS GoalsStats에 대응
 */
@Serializable
data class TeamGoalsStatsDto(
    @SerialName("for") val goalsFor: TeamGoalsForDto,
    @SerialName("against") val against: TeamGoalsAgainstDto
)

/**
 * 득점 통계 DTO
 * iOS TeamGoalsFor에 대응
 */
@Serializable
data class TeamGoalsForDto(
    @SerialName("total") val total: TeamSeasonStatisticDto,
    @SerialName("average") val average: AverageStatsDto,
    @SerialName("minute") val minute: Map<String, MinuteStatsDto>? = null
)

/**
 * 실점 통계 DTO
 * iOS TeamGoalsAgainst에 대응
 */
@Serializable
data class TeamGoalsAgainstDto(
    @SerialName("total") val total: TeamSeasonStatisticDto,
    @SerialName("average") val average: AverageStatsDto,
    @SerialName("minute") val minute: Map<String, MinuteStatsDto>? = null
)

/**
 * 평균 통계 DTO
 * iOS AverageStats에 대응
 */
@Serializable
data class AverageStatsDto(
    @SerialName("home") val home: String,
    @SerialName("away") val away: String,
    @SerialName("total") val total: String
)

/**
 * 팀 시즌 통계 DTO
 * iOS TeamSeasonStatistic에 대응
 */
@Serializable
data class TeamSeasonStatisticDto(
    @SerialName("home") val home: Int,
    @SerialName("away") val away: Int,
    @SerialName("total") val total: Int
)

/**
 * 분별 통계 DTO
 * iOS MinuteStats에 대응
 */
@Serializable
data class MinuteStatsDto(
    @SerialName("total") val total: Int? = null,
    @SerialName("percentage") val percentage: String? = null
)

/**
 * 최대 기록 통계 DTO
 * iOS BiggestStats에 대응
 */
@Serializable
data class BiggestStatsDto(
    @SerialName("streak") val streak: StreakDto,
    @SerialName("wins") val wins: GameScoreDto,
    @SerialName("loses") val loses: GameScoreDto,
    @SerialName("goals") val goals: BiggestGoalsDto
)

/**
 * 연속 기록 DTO
 * iOS Streak에 대응
 */
@Serializable
data class StreakDto(
    @SerialName("wins") val wins: Int,
    @SerialName("draws") val draws: Int,
    @SerialName("loses") val loses: Int
)

/**
 * 경기 스코어 DTO
 * iOS GameScore에 대응
 */
@Serializable
data class GameScoreDto(
    @SerialName("home") val home: String? = null,
    @SerialName("away") val away: String? = null
)

/**
 * 최대 골 기록 DTO
 * iOS BiggestGoals에 대응
 */
@Serializable
data class BiggestGoalsDto(
    @SerialName("for") val goalsFor: GoalsScoreDto,
    @SerialName("against") val against: GoalsScoreDto
)

/**
 * 골 스코어 DTO
 * iOS GoalsScore에 대응
 */
@Serializable
data class GoalsScoreDto(
    @SerialName("home") val home: Int,
    @SerialName("away") val away: Int
)

/**
 * 클린시트 DTO
 * iOS CleanSheets에 대응
 */
@Serializable
data class CleanSheetsDto(
    @SerialName("home") val home: Int,
    @SerialName("away") val away: Int,
    @SerialName("total") val total: Int
)

/**
 * 무득점 DTO
 * iOS FailedToScore에 대응
 */
@Serializable
data class FailedToScoreDto(
    @SerialName("home") val home: Int,
    @SerialName("away") val away: Int,
    @SerialName("total") val total: Int
)

/**
 * 페널티 통계 DTO
 * iOS PenaltyStats에 대응
 */
@Serializable
data class PenaltyStatsDto(
    @SerialName("scored") val scored: PenaltyDetailDto,
    @SerialName("missed") val missed: PenaltyDetailDto,
    @SerialName("total") val total: Int
)

/**
 * 페널티 상세 DTO
 * iOS PenaltyDetail에 대응
 */
@Serializable
data class PenaltyDetailDto(
    @SerialName("total") val total: Int,
    @SerialName("percentage") val percentage: String
)

/**
 * 라인업 통계 DTO
 * iOS LineupStats에 대응
 */
@Serializable
data class LineupStatsDto(
    @SerialName("formation") val formation: String,
    @SerialName("played") val played: Int
)

/**
 * 카드 통계 DTO
 * iOS CardsStats에 대응
 */
@Serializable
data class CardsStatsDto(
    @SerialName("yellow") val yellow: CardsByMinuteDto,
    @SerialName("red") val red: CardsByMinuteDto
)

/**
 * 분별 카드 통계 DTO
 * iOS CardsByMinute에 대응
 */
@Serializable
data class CardsByMinuteDto(
    @SerialName("0-15") val zeroFifteen: MinuteStatsDto,
    @SerialName("16-30") val sixteenThirty: MinuteStatsDto,
    @SerialName("31-45") val thirtyOneFortyfive: MinuteStatsDto,
    @SerialName("46-60") val fortysixSixty: MinuteStatsDto,
    @SerialName("61-75") val sixtyoneSeventyfive: MinuteStatsDto,
    @SerialName("76-90") val seventysixNinety: MinuteStatsDto,
    @SerialName("91-105") val ninetyOneHundredFive: MinuteStatsDto? = null,
    @SerialName("106-120") val hundredSixOnetwenty: MinuteStatsDto? = null
)
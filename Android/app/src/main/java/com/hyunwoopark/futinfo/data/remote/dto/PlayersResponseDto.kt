package com.hyunwoopark.futinfo.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * 선수 목록 API 응답 DTO
 */
@Serializable
data class PlayersResponseDto(
    @SerialName("get") val get: String,
    @SerialName("parameters") val parameters: PlayersParametersDto,
    @SerialName("errors") val errors: List<String> = emptyList(),
    @SerialName("results") val results: Int,
    @SerialName("paging") val paging: PagingDto,
    @SerialName("response") val response: List<PlayerDto>
)

/**
 * 선수 API 파라미터 DTO
 */
@Serializable
data class PlayersParametersDto(
    @SerialName("league") val league: String? = null,
    @SerialName("season") val season: String? = null
)

/**
 * 선수 정보 DTO
 */
@Serializable
data class PlayerDto(
    @SerialName("player") val player: PlayerInfoDto,
    @SerialName("statistics") val statistics: List<PlayerStatisticsDto>? = null
)

/**
 * 선수 통계 DTO
 */
@Serializable
data class PlayerStatisticsDto(
    @SerialName("team") val team: PlayerTeamDto? = null,
    @SerialName("league") val league: PlayerLeagueDto? = null,
    @SerialName("games") val games: PlayerGamesDto? = null,
    @SerialName("substitutes") val substitutes: PlayerSubstitutesDto? = null,
    @SerialName("shots") val shots: PlayerShotsDto? = null,
    @SerialName("goals") val goals: PlayerGoalsDto? = null,
    @SerialName("passes") val passes: PlayerPassesDto? = null,
    @SerialName("tackles") val tackles: PlayerTacklesDto? = null,
    @SerialName("duels") val duels: PlayerDuelsDto? = null,
    @SerialName("dribbles") val dribbles: PlayerDribblesDto? = null,
    @SerialName("fouls") val fouls: PlayerFoulsDto? = null,
    @SerialName("cards") val cards: PlayerCardsDto? = null,
    @SerialName("penalty") val penalty: PlayerPenaltyDto? = null
)

/**
 * 선수 통계용 리그 DTO
 */
@Serializable
data class PlayerLeagueDto(
    @SerialName("id") val id: Int,
    @SerialName("name") val name: String,
    @SerialName("country") val country: String? = null,
    @SerialName("logo") val logo: String? = null,
    @SerialName("flag") val flag: String? = null,
    @SerialName("season") val season: Int? = null
)

/**
 * 선수 통계용 팀 DTO
 */
@Serializable
data class PlayerTeamDto(
    @SerialName("id") val id: Int,
    @SerialName("name") val name: String,
    @SerialName("logo") val logo: String? = null
)

/**
 * 선수 경기 출전 정보 DTO
 */
@Serializable
data class PlayerGamesDto(
    @SerialName("appearences") val appearances: Int? = null,
    @SerialName("lineups") val lineups: Int? = null,
    @SerialName("minutes") val minutes: Int? = null,
    @SerialName("number") val number: Int? = null,
    @SerialName("position") val position: String? = null,
    @SerialName("rating") val rating: String? = null,
    @SerialName("captain") val captain: Boolean? = null
)
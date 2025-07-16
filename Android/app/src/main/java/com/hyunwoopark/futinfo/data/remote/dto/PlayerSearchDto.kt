package com.hyunwoopark.futinfo.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * 선수 검색 응답 DTO
 */
@Serializable
data class PlayerSearchResponseDto(
    val get: String,
    val parameters: ParametersDto,
    val errors: List<String>,
    val results: Int,
    val paging: PagingDto,
    val response: List<PlayerSearchResultDto>
)

/**
 * 선수 검색 결과 DTO
 */
@Serializable
data class PlayerSearchResultDto(
    val player: PlayerBasicDto,
    val statistics: List<PlayerSearchStatisticsDto>
)

/**
 * 선수 기본 정보 DTO
 */
@Serializable
data class PlayerBasicDto(
    val id: Int,
    val name: String,
    val firstname: String? = null,
    val lastname: String? = null,
    val age: Int? = null,
    val birth: BirthDto? = null,
    val nationality: String? = null,
    val height: String? = null,
    val weight: String? = null,
    val injured: Boolean? = null,
    val photo: String? = null
)

/**
 * 선수 생년월일 DTO
 */
@Serializable
data class BirthDto(
    val date: String? = null,
    val place: String? = null,
    val country: String? = null
)

/**
 * 선수 통계 DTO (검색용)
 */
@Serializable
data class PlayerSearchStatisticsDto(
    val team: TeamBasicDto,
    val league: LeagueBasicDto,
    val games: GamesDto? = null,
    val goals: PlayerGoalsDto? = null,
    val cards: CardsDto? = null
)

/**
 * 팀 기본 정보 DTO (선수 통계용)
 */
@Serializable
data class TeamBasicDto(
    val id: Int,
    val name: String,
    val logo: String
)

/**
 * 리그 기본 정보 DTO (선수 통계용)
 */
@Serializable
data class LeagueBasicDto(
    val id: Int,
    val name: String,
    val country: String,
    val logo: String,
    val flag: String? = null,
    val season: Int
)

/**
 * 경기 통계 DTO
 */
@Serializable
data class GamesDto(
    val appearences: Int? = null,
    val lineups: Int? = null,
    val minutes: Int? = null,
    val number: Int? = null,
    val position: String? = null,
    val rating: String? = null,
    val captain: Boolean? = null
)

/**
 * 득점 통계 DTO (선수 검색용)
 */
@Serializable
data class PlayerGoalsDto(
    val total: Int? = null,
    val conceded: Int? = null,
    val assists: Int? = null,
    val saves: Int? = null
)

/**
 * 카드 통계 DTO
 */
@Serializable
data class CardsDto(
    val yellow: Int? = null,
    val yellowred: Int? = null,
    val red: Int? = null
)
package com.hyunwoopark.futinfo.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * 라인업 응답 DTO
 */
@Serializable
data class LineupResponseDto(
    @SerialName("get") val get: String,
    @SerialName("parameters") val parameters: Map<String, String>,
    @SerialName("errors") val errors: List<String>,
    @SerialName("results") val results: Int,
    @SerialName("paging") val paging: PagingDto,
    @SerialName("response") val response: List<TeamLineupDto>
)

/**
 * 팀 라인업 DTO
 */
@Serializable
data class TeamLineupDto(
    @SerialName("team") val team: TeamDto,
    @SerialName("formation") val formation: String? = null,
    @SerialName("startXI") val startXI: List<LineupPlayerDto>? = null,
    @SerialName("substitutes") val substitutes: List<LineupPlayerDto>? = null,
    @SerialName("coach") val coach: CoachDto? = null
)

/**
 * 라인업 선수 DTO
 */
@Serializable
data class LineupPlayerDto(
    @SerialName("player") val player: LineupPlayerInfoDto
)

/**
 * 라인업 선수 정보 DTO
 */
@Serializable
data class LineupPlayerInfoDto(
    @SerialName("id") val id: Int?,
    @SerialName("name") val name: String?,
    @SerialName("number") val number: Int?,
    @SerialName("pos") val pos: String?,
    @SerialName("grid") val grid: String?
)

/**
 * 코치 DTO
 */
@Serializable
data class CoachDto(
    @SerialName("id") val id: Int?,
    @SerialName("name") val name: String?,
    @SerialName("photo") val photo: String?
)
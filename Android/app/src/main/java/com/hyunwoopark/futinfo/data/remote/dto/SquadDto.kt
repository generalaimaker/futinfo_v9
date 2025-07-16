package com.hyunwoopark.futinfo.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

/**
 * 선수단 API 응답 DTO
 * iOS SquadResponse에 대응
 */
@Serializable
data class SquadResponseDto(
    @SerialName("get") val get: String,
    @SerialName("parameters") val parameters: SquadParametersDto? = null,
    @SerialName("errors") val errors: kotlinx.serialization.json.JsonElement? = null,
    @SerialName("results") val results: Int,
    @SerialName("paging") val paging: PagingDto? = null,
    @SerialName("response") val response: List<TeamSquadResponseDto>
)

/**
 * 팀 선수단 응답 DTO
 * iOS TeamSquadResponse에 대응
 */
@Serializable
data class TeamSquadResponseDto(
    @SerialName("team") val team: TeamDto,
    @SerialName("players") val players: List<SquadPlayerDto>
)

/**
 * 선수단 선수 DTO
 * iOS SquadPlayer에 대응
 */
@Serializable
data class SquadPlayerDto(
    @SerialName("id") val id: Int? = null,
    @SerialName("name") val name: String,
    @SerialName("age") val age: Int? = null,
    @SerialName("number") val number: Int? = null,
    @SerialName("position") val position: String? = null,
    @SerialName("photo") val photo: String? = null,
    @SerialName("nationality") val nationality: String? = null,
    @SerialName("height") val height: String? = null,
    @SerialName("weight") val weight: String? = null,
    @SerialName("injured") val injured: Boolean? = null,
    @SerialName("rating") val rating: String? = null,
    @SerialName("captain") val isCaptain: Boolean? = null
)

/**
 * 선수단 파라미터 DTO
 */
@Serializable
data class SquadParametersDto(
    @SerialName("team") val team: String,
    @SerialName("season") val season: String? = null
)

/**
 * 선수 응답 DTO (기존 PlayerProfile과 호환성을 위해)
 * iOS PlayerResponse에 대응
 */
@Serializable
data class PlayerResponseDto(
    @SerialName("player") val player: PlayerInfoDto,
    @SerialName("statistics") val statistics: List<PlayerSeasonStatsDto>? = null
)

/**
 * 선수단 그룹 데이터 클래스
 * iOS SquadGroup에 대응
 */
data class SquadGroup(
    val position: String,
    val players: List<PlayerResponseDto>
) {
    companion object {
        /**
         * 선수들을 포지션별로 그룹화
         */
        fun groupPlayers(players: List<PlayerResponseDto>): List<SquadGroup> {
            val grouped = players.groupBy { player ->
                player.statistics?.firstOrNull()?.games?.position ?: "Unknown"
            }
            
            val positionOrder = listOf("Goalkeeper", "Defender", "Midfielder", "Attacker")
            
            return positionOrder.mapNotNull { position ->
                grouped[position]?.let { playersInPosition ->
                    SquadGroup(position = position, players = playersInPosition)
                }
            }
        }
    }
}
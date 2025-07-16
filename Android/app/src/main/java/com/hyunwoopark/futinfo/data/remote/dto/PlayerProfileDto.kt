package com.hyunwoopark.futinfo.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

/**
 * 선수 프로필 API 응답 DTO
 */
@Serializable
data class PlayerProfileResponseDto(
    @SerialName("get") val get: String,
    @SerialName("parameters") val parameters: Map<String, String> = emptyMap(),
    @SerialName("errors") val errors: JsonElement? = null,
    @SerialName("results") val results: Int,
    @SerialName("paging") val paging: PagingDto,
    @SerialName("response") val response: List<PlayerProfileDto>
)

@Serializable
data class PlayerProfileParametersDto(
    @SerialName("id") val id: String? = null,
    @SerialName("season") val season: String? = null,
    @SerialName("team") val team: String? = null
)

@Serializable
data class PlayerProfileDto(
    @SerialName("player") val player: PlayerInfoDto,
    @SerialName("statistics") val statistics: List<PlayerSeasonStatsDto>? = null
)

@Serializable
data class PlayerInfoDto(
    @SerialName("id") val id: Int? = null,
    @SerialName("name") val name: String? = null,
    @SerialName("firstname") val firstname: String? = null,
    @SerialName("lastname") val lastname: String? = null,
    @SerialName("age") val age: Int? = null,
    @SerialName("nationality") val nationality: String? = null,
    @SerialName("height") val height: String? = null,
    @SerialName("weight") val weight: String? = null,
    @SerialName("photo") val photo: String? = null,
    @SerialName("injured") val injured: Boolean? = null,
    @SerialName("birth") val birth: PlayerBirthDto? = null
)

@Serializable
data class PlayerBirthDto(
    @SerialName("date") val date: String? = null,
    @SerialName("place") val place: String? = null,
    @SerialName("country") val country: String? = null
)

@Serializable
data class PlayerSeasonStatsDto(
    @SerialName("team") val team: TeamDto? = null,
    @SerialName("league") val league: PlayerLeagueInfoDto? = null,
    @SerialName("games") val games: PlayerGameStatsDto? = null,
    @SerialName("substitutes") val substitutes: PlayerSubstitutesDto? = null,
    @SerialName("shots") val shots: PlayerShotsDto? = null,
    @SerialName("goals") val goals: ProfilePlayerGoalsDto? = null,
    @SerialName("passes") val passes: PlayerPassesDto? = null,
    @SerialName("tackles") val tackles: PlayerTacklesDto? = null,
    @SerialName("duels") val duels: PlayerDuelsDto? = null,
    @SerialName("dribbles") val dribbles: PlayerDribblesDto? = null,
    @SerialName("fouls") val fouls: PlayerFoulsDto? = null,
    @SerialName("cards") val cards: PlayerCardsDto? = null,
    @SerialName("penalty") val penalty: PlayerPenaltyDto? = null
)

@Serializable
data class PlayerLeagueInfoDto(
    @SerialName("id") val id: Int? = null,
    @SerialName("name") val name: String? = null,
    @SerialName("country") val country: String? = null,
    @SerialName("logo") val logo: String? = null,
    @SerialName("season") val season: Int? = null,
    @SerialName("flag") val flag: String? = null
)

@Serializable
data class PlayerGameStatsDto(
    @SerialName("minutes") val minutes: Int? = null,
    @SerialName("number") val number: Int? = null,
    @SerialName("position") val position: String? = null,
    @SerialName("rating") val rating: String? = null,
    @SerialName("captain") val captain: Boolean? = null,
    @SerialName("substitute") val substitute: Boolean? = null,
    @SerialName("appearences") val appearances: Int? = null,
    @SerialName("lineups") val lineups: Int? = null
)

@Serializable
data class PlayerSubstitutesDto(
    @SerialName("in") val `in`: Int? = null,
    @SerialName("out") val out: Int? = null,
    @SerialName("bench") val bench: Int? = null
)

@Serializable
data class PlayerShotsDto(
    @SerialName("total") val total: Int? = null,
    @SerialName("on") val on: Int? = null
)

@Serializable
data class ProfilePlayerGoalsDto(
    @SerialName("total") val total: Int? = null,
    @SerialName("conceded") val conceded: Int? = null,
    @SerialName("assists") val assists: Int? = null,
    @SerialName("saves") val saves: Int? = null
)

@Serializable
data class PlayerPassesDto(
    @SerialName("total") val total: Int? = null,
    @SerialName("key") val key: Int? = null,
    @SerialName("accuracy") val accuracy: Int? = null
)

@Serializable
data class PlayerTacklesDto(
    @SerialName("total") val total: Int? = null,
    @SerialName("blocks") val blocks: Int? = null,
    @SerialName("interceptions") val interceptions: Int? = null
)

@Serializable
data class PlayerDuelsDto(
    @SerialName("total") val total: Int? = null,
    @SerialName("won") val won: Int? = null
)

@Serializable
data class PlayerDribblesDto(
    @SerialName("attempts") val attempts: Int? = null,
    @SerialName("success") val success: Int? = null,
    @SerialName("past") val past: Int? = null
)

@Serializable
data class PlayerFoulsDto(
    @SerialName("drawn") val drawn: Int? = null,
    @SerialName("committed") val committed: Int? = null
)

@Serializable
data class PlayerCardsDto(
    @SerialName("yellow") val yellow: Int? = null,
    @SerialName("yellowred") val yellowred: Int? = null,
    @SerialName("red") val red: Int? = null
)

@Serializable
data class PlayerPenaltyDto(
    @SerialName("won") val won: Int? = null,
    @SerialName("committed") val committed: Int? = null,
    @SerialName("scored") val scored: Int? = null,
    @SerialName("missed") val missed: Int? = null,
    @SerialName("saved") val saved: Int? = null
)
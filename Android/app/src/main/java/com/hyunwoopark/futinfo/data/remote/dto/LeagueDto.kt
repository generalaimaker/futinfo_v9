package com.hyunwoopark.futinfo.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// MARK: - League Response
@Serializable
data class LeaguesResponseDto(
    val get: String,
    val parameters: ParametersDto,
    val errors: List<String>,
    val results: Int,
    val paging: PagingDto,
    val response: List<LeagueDetailsDto>
)

// MARK: - League Details
@Serializable
data class LeagueDetailsDto(
    val league: LeagueInfoDto,
    val country: CountryDto? = null,
    val seasons: List<SeasonDto>? = null
)

// MARK: - League Info
@Serializable
data class LeagueInfoDto(
    val id: Int,
    val name: String,
    val type: String,
    val logo: String
)

// MARK: - League (for compatibility with other DTOs)
typealias LeagueDto = LeagueInfoDto

// MARK: - Country
@Serializable
data class CountryDto(
    val name: String,
    val code: String? = null,
    val flag: String? = null
)

// MARK: - Season
@Serializable
data class SeasonDto(
    val year: Int,
    val start: String? = null,
    val end: String? = null,
    val current: Boolean,
    val coverage: CoverageDto? = null
)

// MARK: - Coverage
@Serializable
data class CoverageDto(
    val fixtures: FixtureCoverageDto? = null,
    val standings: Boolean? = null,
    val players: Boolean? = null,
    @SerialName("top_scorers")
    val topScorers: Boolean? = null,
    @SerialName("top_assists")
    val topAssists: Boolean? = null,
    @SerialName("top_cards")
    val topCards: Boolean? = null,
    val injuries: Boolean? = null,
    val predictions: Boolean? = null,
    val odds: Boolean? = null
)

// MARK: - Fixture Coverage
@Serializable
data class FixtureCoverageDto(
    val events: Boolean? = null,
    val lineups: Boolean? = null,
    @SerialName("statistics_fixtures")
    val statisticsFixtures: Boolean? = null,
    @SerialName("statistics_players")
    val statisticsPlayers: Boolean? = null
)

// MARK: - Supported Leagues
object SupportedLeagues {
    val allLeagues = listOf(39, 140, 135, 78, 2, 3) // Premier League, La Liga, Serie A, Bundesliga, Champions League, Europa League
    
    fun getName(id: Int): String {
        return when (id) {
            39 -> "Premier League"
            140 -> "La Liga"
            135 -> "Serie A"
            78 -> "Bundesliga"
            2 -> "Champions League"
            3 -> "Europa League"
            else -> "알 수 없는 리그"
        }
    }
    
    fun getCountryCode(id: Int): String {
        return when (id) {
            39 -> "GB" // 잉글랜드
            140 -> "ES" // 스페인
            135 -> "IT" // 이탈리아
            78 -> "DE" // 독일
            2, 3 -> "EU" // UEFA
            else -> ""
        }
    }
    
    fun getCountryName(id: Int): String {
        return when (id) {
            39 -> "England"
            140 -> "Spain"
            135 -> "Italy"
            78 -> "Germany"
            2, 3 -> "UEFA"
            else -> ""
        }
    }
}
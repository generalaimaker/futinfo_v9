package com.hyunwoopark.futinfo.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// MARK: - Fixture Response
@Serializable
data class FixturesResponseDto(
    val get: String,
    val parameters: ParametersDto,
    val errors: List<String>,
    val results: Int,
    val paging: PagingDto,
    val response: List<FixtureDto>
)

// MARK: - Fixture
@Serializable
data class FixtureDto(
    val fixture: FixtureDetailsDto,
    val league: LeagueFixtureInfoDto,
    val teams: TeamsDto,
    val goals: GoalsDto? = null
)

// MARK: - League Fixture Info
@Serializable
data class LeagueFixtureInfoDto(
    val id: Int,
    val name: String,
    val country: String,
    val logo: String,
    val flag: String? = null,
    val season: Int,
    val round: String,
    val standings: Boolean? = null
)

// MARK: - Fixture Details
@Serializable
data class FixtureDetailsDto(
    val id: Int,
    val date: String,
    val status: FixtureStatusDto,
    val venue: VenueDto,
    val timezone: String,
    val referee: String? = null
)


// MARK: - Teams
@Serializable
data class TeamsDto(
    val home: TeamFixtureDto,
    val away: TeamFixtureDto
)

// MARK: - Team (for Fixture)
@Serializable
data class TeamFixtureDto(
    val id: Int,
    val name: String,
    val logo: String,
    val winner: Boolean? = null,
    val colors: TeamColorsDto? = null
)

// MARK: - Goals
@Serializable
data class GoalsDto(
    val home: Int? = null,
    val away: Int? = null
)
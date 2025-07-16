package com.hyunwoopark.futinfo.data.remote.dto

import kotlinx.serialization.Serializable

/**
 * 공통으로 사용되는 DTO 클래스들
 * 중복 선언을 방지하기 위해 여기에 통합
 */

// MARK: - Venue
@Serializable
data class VenueDto(
    val id: Int? = null,
    val name: String? = null,
    val address: String? = null,
    val city: String? = null,
    val capacity: Int? = null,
    val surface: String? = null,
    val image: String? = null
)

// MARK: - Team Colors
@Serializable
data class TeamColorsDto(
    val player: ColorSetDto? = null,
    val goalkeeper: ColorSetDto? = null
)

// MARK: - Color Set
@Serializable
data class ColorSetDto(
    val primary: String? = null,
    val number: String? = null,
    val border: String? = null
)

// MARK: - Parameters (API 요청 파라미터)
@Serializable
data class ParametersDto(
    val league: String? = null,
    val season: String? = null,
    val team: String? = null,
    val fixture: String? = null,
    val date: String? = null,
    val timezone: String? = null,
    val live: String? = null,
    val round: String? = null,
    val status: String? = null,
    val venue: String? = null,
    val ids: String? = null,
    val last: String? = null,
    val next: String? = null,
    val from: String? = null,
    val to: String? = null,
    val h2h: String? = null
)

// MARK: - Fixture Status
@Serializable
data class FixtureStatusDto(
    val long: String,
    val short: String,
    val elapsed: Int? = null
)
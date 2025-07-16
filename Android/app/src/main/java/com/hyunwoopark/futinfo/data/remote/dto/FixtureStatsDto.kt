package com.hyunwoopark.futinfo.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.intOrNull

/**
 * 경기 통계 응답 DTO
 */
@Serializable
data class FixtureStatsResponseDto(
    @SerialName("get") val get: String,
    @SerialName("parameters") val parameters: Map<String, String>,
    @SerialName("errors") val errors: List<String>,
    @SerialName("results") val results: Int,
    @SerialName("paging") val paging: PagingDto,
    @SerialName("response") val response: List<TeamStatisticsDto>
)

/**
 * 팀 통계 DTO
 */
@Serializable
data class TeamStatisticsDto(
    @SerialName("team") val team: TeamDto,
    @SerialName("statistics") val statistics: List<FixtureStatisticDto>
)

/**
 * 경기 통계 항목 DTO
 */
@Serializable
data class FixtureStatisticDto(
    @SerialName("type") val type: String,
    @SerialName("value") val value: JsonElement? = null
) {
    /**
     * 통계 값을 문자열로 반환
     */
    fun getDisplayValue(): String {
        return when (value) {
            null -> "-"
            is JsonNull -> "-"
            is JsonPrimitive -> {
                when {
                    value.isString -> value.contentOrNull ?: "-"
                    else -> {
                        val intValue = value.intOrNull
                        val doubleValue = value.doubleOrNull
                        when {
                            intValue != null -> intValue.toString()
                            doubleValue != null -> String.format("%.1f", doubleValue)
                            else -> value.toString()
                        }
                    }
                }
            }
            else -> value.toString()
        }
    }

    /**
     * 통계 값을 정수로 반환 (가능한 경우)
     */
    fun getIntValue(): Int? {
        return when (value) {
            null -> null
            is JsonPrimitive -> {
                value.intOrNull ?: value.contentOrNull?.toIntOrNull()
            }
            else -> null
        }
    }

    /**
     * 통계 값을 실수로 반환 (가능한 경우)
     */
    fun getDoubleValue(): Double? {
        return when (value) {
            null -> null
            is JsonPrimitive -> {
                value.doubleOrNull ?: value.contentOrNull?.toDoubleOrNull()
            }
            else -> null
        }
    }

    /**
     * 통계 값을 문자열로 반환 (가능한 경우)
     */
    fun getStringValue(): String? {
        return when (value) {
            null -> null
            is JsonPrimitive -> value.contentOrNull
            else -> null
        }
    }
}

/**
 * 통계 타입 열거형
 */
enum class StatisticType(val displayName: String) {
    SHOTS_ON_GOAL("Shots on Goal"),
    SHOTS_OFF_GOAL("Shots off Goal"),
    TOTAL_SHOTS("Total Shots"),
    BLOCKED_SHOTS("Blocked Shots"),
    SHOTS_INSIDE_BOX("Shots insidebox"),
    SHOTS_OUTSIDE_BOX("Shots outsidebox"),
    FOULS("Fouls"),
    CORNER_KICKS("Corner Kicks"),
    OFFSIDES("Offsides"),
    BALL_POSSESSION("Ball Possession"),
    YELLOW_CARDS("Yellow Cards"),
    RED_CARDS("Red Cards"),
    GOALKEEPER_SAVES("Goalkeeper Saves"),
    TOTAL_PASSES("Total passes"),
    PASSES_ACCURATE("Passes accurate"),
    PASSES_PERCENTAGE("Passes %"),
    EXPECTED_GOALS("expected_goals");

    companion object {
        fun fromApiValue(apiValue: String): StatisticType? {
            return values().find { it.displayName == apiValue }
        }
    }
}
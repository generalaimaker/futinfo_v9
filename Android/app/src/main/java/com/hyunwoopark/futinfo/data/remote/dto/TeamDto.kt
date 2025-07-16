package com.hyunwoopark.futinfo.data.remote.dto

import kotlinx.serialization.Serializable

// MARK: - Team
@Serializable
data class TeamDto(
    val id: Int,
    val name: String,
    val logo: String,
    val winner: Boolean? = null,
    val colors: TeamColorsDto? = null
)

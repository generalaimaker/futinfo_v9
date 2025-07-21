package com.hyunwoopark.futinfo.domain.model

data class TeamInfo(
    val teamId: Int,
    val name: String,
    val logo: String?,
    val primaryColor: String?,
    val secondaryColor: String?,
    val slogan: String?,
    val standing: Int?,
    val points: Int?,
    val form: String?
)
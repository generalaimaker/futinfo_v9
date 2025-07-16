package com.hyunwoopark.futinfo.domain.model

/**
 * 팀 도메인 모델
 */
data class Team(
    val id: Int,
    val name: String,
    val code: String?,
    val country: String?,
    val founded: Int?,
    val national: Boolean?,
    val logo: String?
)
package com.hyunwoopark.futinfo.domain.model

data class Board(
    val id: String,
    val type: BoardType,
    val name: String,
    val teamId: Int? = null,
    val leagueId: Int? = null,
    val description: String? = null,
    val iconUrl: String? = null,
    val postCount: Int = 0,
    val memberCount: Int = 0
)

enum class BoardType {
    ALL,
    TEAM
}

data class TeamBadgeInfo(
    val teamId: Int,
    val teamName: String,
    val teamLogo: String?,
    val primaryColor: String?,
    val secondaryColor: String?
)
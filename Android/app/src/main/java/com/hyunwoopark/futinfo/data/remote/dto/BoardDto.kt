package com.hyunwoopark.futinfo.data.remote.dto

import com.hyunwoopark.futinfo.domain.model.Board
import com.hyunwoopark.futinfo.domain.model.BoardType
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class BoardDto(
    val id: String,
    val type: String,
    val name: String,
    @SerialName("team_id")
    val teamId: Int? = null,
    @SerialName("league_id")
    val leagueId: Int? = null,
    val description: String? = null,
    @SerialName("icon_url")
    val iconUrl: String? = null,
    @SerialName("post_count")
    val postCount: Int = 0,
    @SerialName("member_count")
    val memberCount: Int = 0
)

fun BoardDto.toBoard(): Board {
    return Board(
        id = id,
        type = when (type) {
            "all" -> BoardType.ALL
            "team" -> BoardType.TEAM
            else -> BoardType.ALL
        },
        name = name,
        teamId = teamId,
        leagueId = leagueId,
        description = description,
        iconUrl = iconUrl,
        postCount = postCount,
        memberCount = memberCount
    )
}
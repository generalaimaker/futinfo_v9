package com.hyunwoopark.futinfo.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class StandingsResponseDto(
    @SerialName("response")
    val response: List<LeagueStandingDto>
)

@Serializable
data class LeagueStandingDto(
    @SerialName("league")
    val league: StandingLeagueInfoDto
)

@Serializable
data class StandingLeagueInfoDto(
    @SerialName("id")
    val id: Int,
    @SerialName("name")
    val name: String,
    @SerialName("country")
    val country: String,
    @SerialName("logo")
    val logo: String,
    @SerialName("flag")
    val flag: String? = null,
    @SerialName("season")
    val season: Int,
    @SerialName("standings")
    val standings: List<List<StandingDto>>? = null // 순위표는 league 객체 안에 있음
)

@Serializable
data class StandingDto(
    @SerialName("rank")
    val rank: Int,
    @SerialName("team")
    val team: TeamStandingDto,
    @SerialName("points")
    val points: Int,
    @SerialName("goalsDiff")
    val goalsDiff: Int,
    @SerialName("group")
    val group: String? = null,
    @SerialName("form")
    val form: String? = null,
    @SerialName("status")
    val status: String? = null,
    @SerialName("description")
    val description: String? = null,
    @SerialName("all")
    val all: StandingStatsDto,
    @SerialName("home")
    val home: StandingStatsDto,
    @SerialName("away")
    val away: StandingStatsDto,
    @SerialName("update")
    val update: String
)

@Serializable
data class TeamStandingDto(
    @SerialName("id")
    val id: Int,
    @SerialName("name")
    val name: String,
    @SerialName("logo")
    val logo: String
)

@Serializable
data class StandingStatsDto(
    @SerialName("played")
    val played: Int,
    @SerialName("win")
    val win: Int,
    @SerialName("draw")
    val draw: Int,
    @SerialName("lose")
    val lose: Int,
    @SerialName("goals")
    val goals: StandingGoalsDto
)

@Serializable
data class StandingGoalsDto(
    @SerialName("for")
    val `for`: Int,
    @SerialName("against")
    val `against`: Int
)

/**
 * StandingsResponseDto를 도메인 모델로 변환하는 확장 함수
 */
fun StandingsResponseDto.toDomain(): List<com.hyunwoopark.futinfo.domain.model.LeagueStanding> {
    android.util.Log.d("StandingDto", "🔍 [DEBUG] StandingsResponseDto 변환 시작 - response 개수: ${response.size}")
    return response.map { it.toDomain() }
}

/**
 * LeagueStandingDto를 도메인 모델로 변환하는 확장 함수
 */
fun LeagueStandingDto.toDomain(): com.hyunwoopark.futinfo.domain.model.LeagueStanding {
    android.util.Log.d("StandingDto", "🔍 [DEBUG] LeagueStandingDto 변환 - 리그: ${league.name}, standings null 여부: ${league.standings == null}")
    android.util.Log.d("StandingDto", "🔍 [DEBUG] league.id: ${league.id}, league.season: ${league.season}")
    android.util.Log.d("StandingDto", "🔍 [DEBUG] standings raw value: ${league.standings}")
    
    if (league.standings != null) {
        android.util.Log.d("StandingDto", "🔍 [DEBUG] standings 그룹 개수: ${league.standings.size}")
        league.standings.forEachIndexed { index, group ->
            android.util.Log.d("StandingDto", "🔍 [DEBUG] 그룹 $index 팀 개수: ${group.size}")
            if (group.isNotEmpty()) {
                android.util.Log.d("StandingDto", "🔍 [DEBUG] 그룹 $index 첫 번째 팀: ${group[0].team.name}")
            }
        }
    } else {
        android.util.Log.w("StandingDto", "⚠️ [DEBUG] standings가 null입니다 - 컵 대회일 가능성")
    }
    
    return com.hyunwoopark.futinfo.domain.model.LeagueStanding(
        league = league.toDomain(),
        standings = league.standings?.map { standingGroup ->
            standingGroup.map { it.toDomain() }
        }
    )
}

/**
 * StandingLeagueInfoDto를 도메인 모델로 변환하는 확장 함수
 */
fun StandingLeagueInfoDto.toDomain(): com.hyunwoopark.futinfo.domain.model.StandingLeagueInfo {
    return com.hyunwoopark.futinfo.domain.model.StandingLeagueInfo(
        id = id,
        name = name,
        country = country,
        logo = logo,
        flag = flag,
        season = season
    )
}

/**
 * StandingDto를 도메인 모델로 변환하는 확장 함수
 */
fun StandingDto.toDomain(): com.hyunwoopark.futinfo.domain.model.Standing {
    return com.hyunwoopark.futinfo.domain.model.Standing(
        rank = rank,
        team = team.toDomain(),
        points = points,
        goalsDiff = goalsDiff,
        group = group,
        form = form,
        status = status,
        description = description,
        all = all.toDomain(),
        home = home.toDomain(),
        away = away.toDomain(),
        update = update
    )
}

/**
 * TeamStandingDto를 도메인 모델로 변환하는 확장 함수
 */
fun TeamStandingDto.toDomain(): com.hyunwoopark.futinfo.domain.model.StandingTeam {
    return com.hyunwoopark.futinfo.domain.model.StandingTeam(
        id = id,
        name = name,
        logo = logo
    )
}

/**
 * StandingStatsDto를 도메인 모델로 변환하는 확장 함수
 */
fun StandingStatsDto.toDomain(): com.hyunwoopark.futinfo.domain.model.StandingStats {
    return com.hyunwoopark.futinfo.domain.model.StandingStats(
        played = played,
        win = win,
        draw = draw,
        lose = lose,
        goals = goals.toDomain()
    )
}

/**
 * StandingGoalsDto를 도메인 모델로 변환하는 확장 함수
 */
fun StandingGoalsDto.toDomain(): com.hyunwoopark.futinfo.domain.model.StandingGoals {
    return com.hyunwoopark.futinfo.domain.model.StandingGoals(
        `for` = `for`,
        against = `against`
    )
}
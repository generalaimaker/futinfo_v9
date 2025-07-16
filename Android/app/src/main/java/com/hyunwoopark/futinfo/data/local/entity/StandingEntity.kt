package com.hyunwoopark.futinfo.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.hyunwoopark.futinfo.data.remote.dto.StandingDto
import com.hyunwoopark.futinfo.data.remote.dto.TeamStandingDto
import com.hyunwoopark.futinfo.data.remote.dto.StandingStatsDto
import com.hyunwoopark.futinfo.data.remote.dto.StandingGoalsDto

/**
 * Room 데이터베이스용 Standing Entity
 * 리그 순위표 정보를 로컬 데이터베이스에 저장하기 위한 엔티티
 */
@Entity(
    tableName = "standings",
    primaryKeys = ["leagueId", "season", "teamId"]
)
data class StandingEntity(
    val leagueId: Int,
    val season: Int,
    val teamId: Int,
    val teamName: String,
    val teamLogo: String,
    val rank: Int,
    val points: Int,
    val goalsDiff: Int,
    val group: String?,
    val form: String?,
    val status: String?,
    val description: String?,
    // All stats
    val allPlayed: Int,
    val allWin: Int,
    val allDraw: Int,
    val allLose: Int,
    val allGoalsFor: Int,
    val allGoalsAgainst: Int,
    // Home stats
    val homePlayed: Int,
    val homeWin: Int,
    val homeDraw: Int,
    val homeLose: Int,
    val homeGoalsFor: Int,
    val homeGoalsAgainst: Int,
    // Away stats
    val awayPlayed: Int,
    val awayWin: Int,
    val awayDraw: Int,
    val awayLose: Int,
    val awayGoalsFor: Int,
    val awayGoalsAgainst: Int,
    val update: String,
    val lastUpdated: Long = System.currentTimeMillis()
)

/**
 * StandingDto를 StandingEntity로 변환하는 확장 함수
 */
fun StandingDto.toEntity(leagueId: Int, season: Int): StandingEntity {
    return StandingEntity(
        leagueId = leagueId,
        season = season,
        teamId = team.id,
        teamName = team.name,
        teamLogo = team.logo,
        rank = rank,
        points = points,
        goalsDiff = goalsDiff,
        group = group,
        form = form,
        status = status,
        description = description,
        allPlayed = all.played,
        allWin = all.win,
        allDraw = all.draw,
        allLose = all.lose,
        allGoalsFor = all.goals.`for`,
        allGoalsAgainst = all.goals.`against`,
        homePlayed = home.played,
        homeWin = home.win,
        homeDraw = home.draw,
        homeLose = home.lose,
        homeGoalsFor = home.goals.`for`,
        homeGoalsAgainst = home.goals.`against`,
        awayPlayed = away.played,
        awayWin = away.win,
        awayDraw = away.draw,
        awayLose = away.lose,
        awayGoalsFor = away.goals.`for`,
        awayGoalsAgainst = away.goals.`against`,
        update = update
    )
}

/**
 * StandingEntity를 StandingDto로 변환하는 확장 함수
 */
fun StandingEntity.toDto(): StandingDto {
    return StandingDto(
        rank = rank,
        team = TeamStandingDto(
            id = teamId,
            name = teamName,
            logo = teamLogo
        ),
        points = points,
        goalsDiff = goalsDiff,
        group = group,
        form = form,
        status = status,
        description = description,
        all = StandingStatsDto(
            played = allPlayed,
            win = allWin,
            draw = allDraw,
            lose = allLose,
            goals = StandingGoalsDto(
                `for` = allGoalsFor,
                `against` = allGoalsAgainst
            )
        ),
        home = StandingStatsDto(
            played = homePlayed,
            win = homeWin,
            draw = homeDraw,
            lose = homeLose,
            goals = StandingGoalsDto(
                `for` = homeGoalsFor,
                `against` = homeGoalsAgainst
            )
        ),
        away = StandingStatsDto(
            played = awayPlayed,
            win = awayWin,
            draw = awayDraw,
            lose = awayLose,
            goals = StandingGoalsDto(
                `for` = awayGoalsFor,
                `against` = awayGoalsAgainst
            )
        ),
        update = update
    )
}
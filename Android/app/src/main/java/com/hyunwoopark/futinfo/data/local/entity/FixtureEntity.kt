package com.hyunwoopark.futinfo.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.hyunwoopark.futinfo.data.remote.dto.*

/**
 * Room 데이터베이스용 Fixture Entity
 * 경기 일정 정보를 로컬 데이터베이스에 저장하기 위한 엔티티
 */
@Entity(tableName = "fixtures")
data class FixtureEntity(
    @PrimaryKey
    val id: Int,
    val date: String,
    val statusLong: String,
    val statusShort: String,
    val elapsed: Int?,
    val venueName: String?,
    val venueCity: String?,
    val timezone: String,
    val referee: String?,
    val leagueId: Int,
    val leagueName: String,
    val leagueCountry: String,
    val leagueLogo: String,
    val leagueLogoUrl: String, // 리그별 그룹화를 위한 추가 필드
    val leagueFlag: String?,
    val season: Int,
    val round: String,
    val homeTeamId: Int,
    val homeTeamName: String,
    val homeTeamLogo: String,
    val homeTeamWinner: Boolean?,
    val awayTeamId: Int,
    val awayTeamName: String,
    val awayTeamLogo: String,
    val awayTeamWinner: Boolean?,
    val homeGoals: Int?,
    val awayGoals: Int?,
    val lastUpdated: Long = System.currentTimeMillis()
)

/**
 * FixtureDto를 FixtureEntity로 변환하는 확장 함수
 */
fun FixtureDto.toEntity(): FixtureEntity {
    return FixtureEntity(
        id = fixture.id,
        date = fixture.date,
        statusLong = fixture.status.long,
        statusShort = fixture.status.short,
        elapsed = fixture.status.elapsed,
        venueName = fixture.venue.name,
        venueCity = fixture.venue.city,
        timezone = fixture.timezone,
        referee = fixture.referee,
        leagueId = league.id,
        leagueName = league.name,
        leagueCountry = league.country,
        leagueLogo = league.logo,
        leagueLogoUrl = league.logo, // leagueLogo와 동일한 값 사용
        leagueFlag = league.flag,
        season = league.season,
        round = league.round,
        homeTeamId = teams.home.id,
        homeTeamName = teams.home.name,
        homeTeamLogo = teams.home.logo,
        homeTeamWinner = teams.home.winner,
        awayTeamId = teams.away.id,
        awayTeamName = teams.away.name,
        awayTeamLogo = teams.away.logo,
        awayTeamWinner = teams.away.winner,
        homeGoals = goals?.home,
        awayGoals = goals?.away
    )
}

/**
 * FixtureEntity를 FixtureDto로 변환하는 확장 함수
 */
fun FixtureEntity.toDto(): FixtureDto {
    return FixtureDto(
        fixture = FixtureDetailsDto(
            id = id,
            date = date,
            status = FixtureStatusDto(
                long = statusLong,
                short = statusShort,
                elapsed = elapsed
            ),
            venue = VenueDto(
                id = null,
                name = venueName,
                city = venueCity
            ),
            timezone = timezone,
            referee = referee
        ),
        league = LeagueFixtureInfoDto(
            id = leagueId,
            name = leagueName,
            country = leagueCountry,
            logo = leagueLogoUrl, // leagueLogoUrl 사용
            flag = leagueFlag,
            season = season,
            round = round,
            standings = null
        ),
        teams = TeamsDto(
            home = TeamFixtureDto(
                id = homeTeamId,
                name = homeTeamName,
                logo = homeTeamLogo,
                winner = homeTeamWinner,
                colors = null
            ),
            away = TeamFixtureDto(
                id = awayTeamId,
                name = awayTeamName,
                logo = awayTeamLogo,
                winner = awayTeamWinner,
                colors = null
            )
        ),
        goals = if (homeGoals != null || awayGoals != null) {
            GoalsDto(
                home = homeGoals,
                away = awayGoals
            )
        } else null
    )
}
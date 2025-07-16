package com.hyunwoopark.futinfo.domain.model

/**
 * 경기 정보를 나타내는 도메인 모델
 * UI 계층에서 리그별 그룹화가 가능하도록 leagueName과 leagueLogoUrl 필드를 포함합니다.
 */
data class Fixture(
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
    val leagueName: String, // 리그별 그룹화를 위한 필드
    val leagueLogoUrl: String, // 리그별 그룹화를 위한 필드
    val leagueCountry: String,
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
    val awayGoals: Int?
)

/**
 * 리그별로 그룹화된 경기 목록을 나타내는 데이터 클래스
 * UI에서 리그별 섹션으로 표시하기 위해 사용됩니다.
 */
data class LeagueFixtures(
    val leagueId: Int,
    val leagueName: String,
    val leagueLogoUrl: String,
    val fixtures: List<Fixture>
)

/**
 * FixtureEntity를 Fixture 도메인 모델로 변환하는 확장 함수
 */
fun com.hyunwoopark.futinfo.data.local.entity.FixtureEntity.toDomainModel(): Fixture {
    return Fixture(
        id = id,
        date = date,
        statusLong = statusLong,
        statusShort = statusShort,
        elapsed = elapsed,
        venueName = venueName,
        venueCity = venueCity,
        timezone = timezone,
        referee = referee,
        leagueId = leagueId,
        leagueName = leagueName,
        leagueLogoUrl = leagueLogoUrl,
        leagueCountry = leagueCountry,
        leagueFlag = leagueFlag,
        season = season,
        round = round,
        homeTeamId = homeTeamId,
        homeTeamName = homeTeamName,
        homeTeamLogo = homeTeamLogo,
        homeTeamWinner = homeTeamWinner,
        awayTeamId = awayTeamId,
        awayTeamName = awayTeamName,
        awayTeamLogo = awayTeamLogo,
        awayTeamWinner = awayTeamWinner,
        homeGoals = homeGoals,
        awayGoals = awayGoals
    )
}

/**
 * FixtureDto를 Fixture 도메인 모델로 변환하는 확장 함수
 */
fun com.hyunwoopark.futinfo.data.remote.dto.FixtureDto.toDomainModel(): Fixture {
    return Fixture(
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
        leagueLogoUrl = league.logo,
        leagueCountry = league.country,
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
 * Fixture 목록을 리그별로 그룹화하는 확장 함수
 * UI에서 리그별 섹션으로 표시하기 위해 사용됩니다.
 */
fun List<Fixture>.groupByLeague(): List<LeagueFixtures> {
    return this.groupBy { it.leagueId }
        .map { (leagueId, fixtures) ->
            val firstFixture = fixtures.first()
            LeagueFixtures(
                leagueId = leagueId,
                leagueName = firstFixture.leagueName,
                leagueLogoUrl = firstFixture.leagueLogoUrl,
                fixtures = fixtures.sortedBy { it.date }
            )
        }
        .sortedBy { it.leagueName }
}
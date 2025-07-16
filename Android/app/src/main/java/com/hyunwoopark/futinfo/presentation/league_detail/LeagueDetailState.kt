package com.hyunwoopark.futinfo.presentation.league_detail

import com.hyunwoopark.futinfo.data.remote.dto.FixturesResponseDto
import com.hyunwoopark.futinfo.data.remote.dto.PlayersResponseDto
import com.hyunwoopark.futinfo.data.remote.dto.StandingsResponseDto
import com.hyunwoopark.futinfo.data.remote.dto.TeamStatisticsResponseDto
import com.hyunwoopark.futinfo.domain.model.Bracket

/**
 * 리그 상세 화면의 상태를 나타내는 데이터 클래스
 */
data class LeagueDetailState(
    // 기본 정보
    val leagueId: Int? = null,
    val season: Int = 2024, // 2024/25 시즌
    val selectedTab: Int = 0,
    val availableSeasons: List<Int> = emptyList(),
    val showSeasonSelector: Boolean = false,
    
    // 순위표 관련
    val standings: StandingsResponseDto? = null,
    val isStandingsLoading: Boolean = false,
    val standingsError: String? = null,
    
    // 경기 관련
    val fixtures: FixturesResponseDto? = null,
    val isFixturesLoading: Boolean = false,
    val fixturesError: String? = null,
    
    // 득점왕 관련
    val topScorers: PlayersResponseDto? = null,
    val isTopScorersLoading: Boolean = false,
    val topScorersError: String? = null,
    
    // 도움왕 관련
    val topAssists: PlayersResponseDto? = null,
    val isTopAssistsLoading: Boolean = false,
    val topAssistsError: String? = null,
    
    // 대진표 관련
    val bracket: Bracket? = null,
    val isBracketLoading: Boolean = false,
    val bracketError: String? = null,
    
    // 팀 통계 관련
    val teamStatistics: List<TeamStatisticsResponseDto>? = null,
    val isTeamStatisticsLoading: Boolean = false,
    val teamStatisticsError: String? = null
)